import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/addons/libs/meshopt_decoder.module.js";
import { characters } from "./characters.ts";
import { disposeAutoModel } from "./auto-model.ts";
import { runSetupWork, runSetupWorkSync } from "./setup-work.ts";

export const CHARACTER_MODEL_URL = "/models/mumbai-characters.glb";
export const CHARACTER_DETAIL_LIMIT = 24;
export const CHARACTER_LOW_DETAIL_LIMIT = 12;

type Template = {
  geometry: THREE.BufferGeometry;
  material: THREE.MeshStandardMaterial;
};
export type CharacterModels = {
  /** Hidden templates are attached to the engine scene for shared-resource disposal. */
  source: THREE.Group;
  cast: Map<string, { detail: Template; crowd: Template }>;
  player: Map<string, Template>;
  time: { value: number };
};

/** Convert Blender's rigid skin weights to per-vertex joint data for GPU instancing. */
function* articulatedGeometry(mesh: THREE.SkinnedMesh): Generator<void, THREE.BufferGeometry> {
  const geometry = mesh.geometry;
  const positions = geometry.getAttribute("position");
  const normals = geometry.getAttribute("normal");
  const skinIndex = geometry.getAttribute("skinIndex");
  const skinWeight = geometry.getAttribute("skinWeight");
  if (!skinIndex || !skinWeight)
    throw new Error(`Character ${mesh.name} has no Blender rig`);
  const count = geometry.getAttribute("position").count;
  const joints = new Float32Array(count * 3);
  const pivots = new Float32Array(count * 3);
  const parents = new Float32Array(count * 3);
  const world = new THREE.Vector3();
  const position = new THREE.Vector3(),
    normal = new THREE.Vector3();
  const bakedPositions = new THREE.Float32BufferAttribute(
    new Float32Array(count * 3),
    3,
  );
  const bakedNormals = new THREE.Float32BufferAttribute(
    new Float32Array(count * 3),
    3,
  );
  const info = mesh.skeleton.bones.map((bone, i) => {
    // glTF names are made unique by GLTFLoader, e.g. arm_l_lower_3.
    const name = bone.name;
    const limb = /^(arm|leg)_([lr])(_lower)?/.exec(name);
    const kind = limb
      ? limb[1] === "arm"
        ? 1
        : 2
      : name.startsWith("head")
        ? 3
        : 0;
    bone.getWorldPosition(world);
    const pivot = world.toArray();
    (bone.parent ?? bone).getWorldPosition(world);
    // Meshopt quantization may move dequantization into each skin's inverse
    // bind matrices. Baking mesh.matrixWorld alone loses that transform.
    const transform = mesh.matrixWorld
      .clone()
      .multiply(mesh.bindMatrixInverse)
      .multiply(bone.matrixWorld)
      .multiply(mesh.skeleton.boneInverses[i])
      .multiply(mesh.bindMatrix);
    return {
      joint: [kind, limb?.[2] === "l" ? -1 : 1, limb?.[3] ? 1 : 0],
      pivot,
      parent: world.toArray(),
      transform,
      normal: new THREE.Matrix3().getNormalMatrix(transform),
    };
  });
  for (let i = 0; i < count; i++) {
    if (i % 4096 === 0) yield;
    let component = 0;
    for (let j = 1; j < 4; j++)
      if (skinWeight.getComponent(i, j) > skinWeight.getComponent(i, component))
        component = j;
    const bone = info[skinIndex.getComponent(i, component)];
    if (!bone) throw new Error(`Invalid rig joint in ${mesh.name}`);
    joints.set(bone.joint, i * 3);
    pivots.set(bone.pivot, i * 3);
    parents.set(bone.parent, i * 3);
    position.fromBufferAttribute(positions, i).applyMatrix4(bone.transform);
    normal.fromBufferAttribute(normals, i).applyNormalMatrix(bone.normal);
    bakedPositions.setXYZ(i, position.x, position.y, position.z);
    bakedNormals.setXYZ(i, normal.x, normal.y, normal.z);
  }
  geometry.setAttribute("position", bakedPositions);
  geometry.setAttribute("normal", bakedNormals);
  geometry.setAttribute("castJoint", new THREE.BufferAttribute(joints, 3));
  geometry.setAttribute("castPivot", new THREE.BufferAttribute(pivots, 3));
  geometry.setAttribute(
    "castParentPivot",
    new THREE.BufferAttribute(parents, 3),
  );
  geometry.deleteAttribute("skinIndex");
  geometry.deleteAttribute("skinWeight");
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
  return geometry;
}

/** Exported for validation against the real GLB, without requiring a renderer. */
function* prepareCharacterWork(source: THREE.Group): Generator<void, CharacterModels> {
  const cast: CharacterModels["cast"] = new Map();
  const player: CharacterModels["player"] = new Map();
  source.updateMatrixWorld(true);
  const objects: THREE.Mesh[] = [];
  source.traverse((object) => { if (object instanceof THREE.Mesh) objects.push(object); });
  for (const character of characters) {
    const levels: Partial<Record<"detail" | "crowd", Template>> = {};
    for (const object of objects) {
      if (!(object instanceof THREE.SkinnedMesh)) continue;
      if (object.userData.cast_id !== character.id) continue;
      const lod = object.userData.lod as "detail" | "crowd";
      if (lod !== "detail" && lod !== "crowd") continue;
      if (levels[lod])
        throw new Error(`Duplicate ${character.id} ${lod} model`);
      const material = object.material as THREE.MeshStandardMaterial;
      material.vertexColors = true;
      if (material.map) material.map.anisotropy = 4;
      levels[lod] = { geometry: yield* articulatedGeometry(object), material };
      yield;
    }
    if (!levels.detail || !levels.crowd)
      throw new Error(`Blender cast is missing ${character.id}`);
    cast.set(character.id, { detail: levels.detail, crowd: levels.crowd });
  }
  for (const object of objects) {
    if (!object.userData.player_part) continue;
    // Expand normalized integer attributes before applying metre-space transforms.
    for (const name of ["position", "normal"]) {
      const attr = object.geometry.getAttribute(name);
      const out = new THREE.Float32BufferAttribute(
        new Float32Array(attr.count * 3),
        3,
      );
      for (let i = 0; i < attr.count; i++) {
        if (i % 4096 === 0) yield;
        out.setXYZ(i, attr.getX(i), attr.getY(i), attr.getZ(i));
      }
      object.geometry.setAttribute(name, out);
    }
    object.geometry.applyMatrix4(object.matrixWorld);
    player.set(object.userData.player_part, {
      geometry: object.geometry,
      material: object.material as THREE.MeshStandardMaterial,
    });
    yield;
  }
  for (const part of ["seated", "hand_left", "hand_right", "keys"])
    if (!player.has(part)) throw new Error(`Blender player is missing ${part}`);
  source.name = "Blender character resources";
  source.visible = false;
  return { source, cast, player, time: { value: 0 } };
}

/** Synchronous entry for offline GLB validation; the browser uses cooperative batches. */
export function prepareCharacterModels(source: THREE.Group): CharacterModels {
  return runSetupWorkSync(prepareCharacterWork(source));
}

export async function loadCharacterModels(signal?: AbortSignal) {
  const controller = new AbortController();
  const abort = () => controller.abort();
  if (signal?.aborted) abort();
  signal?.addEventListener("abort", abort, { once: true });
  const timer = setTimeout(abort, 30_000);
  let source: THREE.Group | undefined;
  try {
    const response = await fetch(CHARACTER_MODEL_URL, {
      signal: controller.signal,
    });
    if (!response.ok)
      throw new Error(`Character model download failed: ${response.status}`);
    const data = await response.arrayBuffer();
    const gltf = await new GLTFLoader()
      .setMeshoptDecoder(MeshoptDecoder)
      .parseAsync(data, "/models/");
    source = gltf.scene;
    controller.signal.throwIfAborted();
    return await runSetupWork(prepareCharacterWork(source), controller.signal);
  } catch (error) {
    if (source) disposeAutoModel(source);
    throw error;
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener("abort", abort);
  }
}

export function characterPlayerPart(models: CharacterModels, part: string) {
  const template = models.player.get(part);
  if (!template) throw new Error(`Unknown player part: ${part}`);
  const mesh = new THREE.Mesh(template.geometry, template.material);
  mesh.name = `Sachin ${part} | Blender`;
  mesh.castShadow = part === "seated";
  mesh.receiveShadow = true;
  return mesh;
}

// The Blender mesh and its textiles are shared by all instances. Only actor
// transforms and four animation values are uploaded; bones animate on the GPU.
const articulation = /* glsl */ `
attribute vec3 castJoint;
attribute vec3 castPivot;
attribute vec3 castParentPivot;
attribute vec4 castMotion;
uniform float castTime;
mat3 castRX(float a) {
  float c = cos(a), s = sin(a);
  return mat3(1.,0.,0., 0.,c,s, 0.,-s,c);
}
mat3 castRZ(float a) {
  float c = cos(a), s = sin(a);
  return mat3(c,s,0., -s,c,0., 0.,0.,1.);
}
mat3 castRY(float a) {
  float c = cos(a), s = sin(a);
  return mat3(c,0.,-s, 0.,1.,0., s,0.,c);
}
mat3 castRotation(bool lower) {
  float phase = castTime * 5.6 + castMotion.x;
  float gait = sin(phase) * castMotion.y * castJoint.y;
  float angle = 0.;
  float wave = 0.;
  if (castJoint.x > 2.5)
    return castRY(sin(castTime * .75 + castMotion.x) * .035);
  if (castJoint.x > 1.5) {
    angle = lower ? max(0., -gait) * .8 : gait;
  } else if (castJoint.x > .5) {
    angle = lower ? -.08 * abs(gait) : -gait * .8;
    if (castMotion.z > .5 && castMotion.z < 1.5)
      angle += lower ? -.05 : -.10 + sin(castTime * 2. + castMotion.x) * .07;
    if (castMotion.z > 1.5 && castMotion.z < 2.5 && castJoint.y > 0.) {
      angle = -.18;
      wave = lower ? .12 : 2.1 + sin(castTime * 5.) * .16;
    }
    if (castMotion.z > 2.5) angle = lower ? -.35 : -.9 + sin(castTime * 9.) * .16;
    // Basket carriers keep both hands on their load.
    if (castMotion.w > .5 && castMotion.z < 2.5) angle *= .08;
  }
  return castRZ(wave) * castRX(angle);
}
vec3 castDeform(vec3 p) {
  bool lower = castJoint.z > .5;
  p = castRotation(lower) * (p - castPivot) + castPivot;
  if (lower) p = castRotation(false) * (p - castParentPivot) + castParentPivot;
  return p;
}
vec3 castDeformNormal(vec3 n) {
  bool lower = castJoint.z > .5;
  n = castRotation(lower) * n;
  if (lower) n = castRotation(false) * n;
  return n;
}
`;

function animateMaterial<T extends THREE.Material>(
  material: T,
  time: { value: number },
) {
  material.onBeforeCompile = (shader) => {
    shader.uniforms.castTime = time;
    shader.vertexShader = articulation + shader.vertexShader;
    shader.vertexShader = shader.vertexShader
      .replace(
        "#include <beginnormal_vertex>",
        "#include <beginnormal_vertex>\nobjectNormal = castDeformNormal(objectNormal);",
      )
      .replace(
        "#include <begin_vertex>",
        "#include <begin_vertex>\ntransformed = castDeform(transformed);",
      );
  };
  material.customProgramCacheKey = () => "mumbai-blender-cast-rigid-v1";
  return material;
}

export function makeCastBatch(
  template: Template,
  capacity: number,
  models: CharacterModels,
  name: string,
  detailed: boolean,
) {
  // Share immutable geometry attributes instead of duplicating the full cast.
  const geometry = new THREE.BufferGeometry();
  geometry.setIndex(template.geometry.index);
  for (const [key, value] of Object.entries(template.geometry.attributes))
    geometry.setAttribute(key, value);
  const motion = new THREE.InstancedBufferAttribute(
    new Float32Array(capacity * 4),
    4,
  );
  motion.setUsage(THREE.DynamicDrawUsage);
  geometry.setAttribute("castMotion", motion);
  const material = animateMaterial(template.material.clone(), models.time);
  const mesh = new THREE.InstancedMesh(geometry, material, capacity);
  mesh.name = name;
  mesh.count = 0;
  mesh.visible = false;
  mesh.frustumCulled = false;
  mesh.castShadow = detailed;
  mesh.receiveShadow = true;
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  if (detailed)
    mesh.customDepthMaterial = animateMaterial(
      new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking }),
      models.time,
    );
  return { mesh, motion, capacity };
}

export function finishCastBatch(batch: ReturnType<typeof makeCastBatch>) {
  const { mesh, motion } = batch;
  mesh.visible = mesh.count > 0;
  for (const [attribute, size] of [
    [mesh.instanceMatrix, 16],
    [mesh.instanceColor, 3],
    [motion, 4],
  ] as const) {
    if (!attribute) continue;
    attribute.clearUpdateRanges();
    if (mesh.count) attribute.addUpdateRange(0, mesh.count * size);
    attribute.needsUpdate = true;
  }
}
