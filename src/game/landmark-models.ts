import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/addons/libs/meshopt_decoder.module.js";
import { disposeAutoModel } from "./auto-model.ts";
import { landmarkSites } from "./landmark-layout.ts";

export const LANDMARK_MODEL_URL = "/models/mumbai-landmarks.glb";
export type LandmarkModels = {
  source: THREE.Group;
  sites: Array<{ root: THREE.Object3D; near: THREE.Object3D; far: THREE.Object3D; x: number; z: number; height: number; radius: number; shop: boolean }>;
};

/** The source hierarchy is also the resource owner, including hidden LODs. */
export function prepareLandmarkModels(source: THREE.Group): LandmarkModels {
  const sites = landmarkSites.map(site => {
    const root = source.getObjectByName(site.id);
    const near = source.getObjectByName(site.id + "__near");
    const far = source.getObjectByName(site.id + "__far");
    if (!root || !near || !far) throw new Error(`Mumbai landmark missing: ${site.id}`);
    root.position.set(site.x, 0, site.z);
    root.rotation.set(0, site.yaw, 0);
    root.name = site.id;
    near.visible = false;
    far.visible = true;
    root.traverse(object => {
      if (!(object instanceof THREE.Mesh)) return;
      object.castShadow = object.userData.lod === "near";
      object.receiveShadow = true;
      for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
        if (material instanceof THREE.MeshStandardMaterial) {
          if (material.map) material.map.anisotropy = 4;
          material.envMapIntensity = 0.7;
        }
      }
    });
    return { root, near, far, x: site.x, z: site.z, height: site.height,
      radius: Math.hypot(site.halfWidth, site.halfLength), shop: site.kind === "shop" };
  });
  source.name = "Mumbai landmark districts";
  return { source, sites };
}

export async function loadLandmarkModels(signal?: AbortSignal): Promise<LandmarkModels> {
  const controller = new AbortController();
  const abort = () => controller.abort();
  if (signal?.aborted) abort();
  signal?.addEventListener("abort", abort, { once: true });
  const timer = setTimeout(abort, 30_000);
  let source: THREE.Group | undefined;
  try {
    const response = await fetch(LANDMARK_MODEL_URL, { signal: controller.signal });
    if (!response.ok) throw new Error(`Landmark download failed: ${response.status}`);
    const bytes = await response.arrayBuffer();
    source = (await new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).parseAsync(bytes, "/models/")).scene;
    if (controller.signal.aborted) throw new DOMException("Landmark loading cancelled", "AbortError");
    return prepareLandmarkModels(source);
  } catch (error) {
    if (source) disposeAutoModel(source);
    throw error;
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener("abort", abort);
  }
}

export function placeLandmarks(scene: THREE.Scene, models: LandmarkModels) {
  scene.add(models.source);
  let lastX = Infinity, lastZ = Infinity, lastLow: boolean | undefined;
  return (x: number, z: number, low = false) => {
    if (lastLow === low && Math.hypot(x-lastX, z-lastZ) < 8) return;
    lastX=x; lastZ=z; lastLow=low;
    for (const site of models.sites) {
      const distance = Math.hypot(site.x-x, site.z-z) - site.radius;
      // Tall skyline silhouettes persist; tiny storefronts need no distant work.
      site.root.visible = distance < (site.shop ? 280 : low ? 520 : 760);
      const detailed = distance < (site.shop ? (low ? 70 : 105) : low ? 130 : 205);
      site.near.visible = detailed;
      site.far.visible = !detailed;
    }
  };
}
