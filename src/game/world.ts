import { localInstances } from "./static-visibility";
import { makeCones } from "./cone-visuals";
import { buildingLots } from "./buildings";
import { boundaryBuildings } from "./boundaries";
import { makeCrowd } from "./crowd";
import { pavementLayout, PAVEMENT_TOP } from "./pavements";
import * as THREE from "three";
import {
  streets,
  isCurved,
  streetPath,
  junctions,
  geometry,
  lanePosition,
  lightFor,
  signalPhase,
  obstacles,
  roadContains,
} from "./network";
import type { Traffic } from "./simulation";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

import { trafficCar } from "./vehicles";
export { autoRickshaw } from "./auto-model";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";

function palmFrond() {
  const positions: number[] = [],
    indices: number[] = [];
  for (let i = 0; i <= 18; i++) {
    const t = i / 18,
      w = Math.sin(t * Math.PI) * 0.58 * (i % 2 ? 0.65 : 1),
      y = Math.sin(t * Math.PI) * 0.9 - t * 0.9;
    positions.push(t * 5.6, y, -w, t * 5.6, y, w);
  }
  for (let i = 0; i < 18; i++) {
    const n = i * 2;
    indices.push(n, n + 1, n + 2, n + 1, n + 3, n + 2);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  g.setIndex(indices);
  g.computeVertexNormals();
  return g;
}
function archWindow() {
  const profile = new THREE.Shape();
  profile.moveTo(-0.5, 0);
  profile.lineTo(0.5, 0);
  profile.lineTo(0.5, 0.65);
  profile.quadraticCurveTo(0.5, 1, 0, 1);
  profile.quadraticCurveTo(-0.5, 1, -0.5, 0.65);
  profile.closePath();
  const geo = new THREE.ExtrudeGeometry(profile, {
    depth: 1,
    bevelEnabled: false,
    curveSegments: 8,
  });
  geo.rotateY(Math.PI / 2);
  return geo;
}
function pitchedRoof() {
  const shape = new THREE.Shape();
  shape.moveTo(-0.5, 0);
  shape.lineTo(0.5, 0);
  shape.lineTo(0, 1);
  shape.closePath();
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: 1,
    bevelEnabled: false,
  });
  geo.translate(0, 0, -0.5);
  return geo;
}
const cityTime = { value: 0 };
function surfaceMaterial(color: string, grain: THREE.Texture) {
  const glass = color === "#4d7480",
    sea = color === "#4b9da5",
    road = color === "#525f65";
  const material = new THREE.MeshStandardMaterial({
    color: road ? "#53595b" : color,
    roughness: glass ? 0.18 : sea ? 0.24 : 0.85,
    metalness: glass ? 0.4 : sea ? 0.25 : 0,
    envMapIntensity: glass ? 1.5 : 1,
    side: ["#3e7951", "#527f48"].includes(color)
      ? THREE.DoubleSide
      : THREE.FrontSide,
  });
  material.userData.grain = grain;
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uCityGrain = { value: grain };
    shader.uniforms.uCityTime = cityTime;
    shader.vertexShader = shader.vertexShader.replace(
      "#include <common>",
      "#include <common>\nvarying vec3 vSurfaceWorld;",
    );
    shader.vertexShader = shader.vertexShader.replace(
      "#include <begin_vertex>",
      `#include <begin_vertex>
vec4 cityPosition=vec4(transformed,1.0);
#ifdef USE_INSTANCING
cityPosition=instanceMatrix*cityPosition;
#endif
vSurfaceWorld=(modelMatrix*cityPosition).xyz;`,
    );
    shader.fragmentShader = shader.fragmentShader.replace(
      "#include <common>",
      `#include <common>
varying vec3 vSurfaceWorld;uniform float uCityTime;uniform sampler2D uCityGrain;
float cityNoise(vec3 p){return fract(sin(dot(p,vec3(12.9898,78.233,37.719)))*43758.5453);}`,
    );
    shader.fragmentShader = shader.fragmentShader.replace(
      "#include <color_fragment>",
      `#include <color_fragment>
${glass ? "" : sea ? "diffuseColor.rgb*=.96+.04*sin(vSurfaceWorld.x*.3+sin(vSurfaceWorld.z*.2)+uCityTime*.6);" : `float grit=texture2D(uCityGrain,${road ? "vSurfaceWorld.xz*.2" : "vec2(vSurfaceWorld.x+vSurfaceWorld.z,vSurfaceWorld.y)*.15"}).r;diffuseColor.rgb*=.94+.08*grit;`}`,
    );
    if (sea)
      shader.fragmentShader = shader.fragmentShader.replace(
        "#include <normal_fragment_maps>",
        "#include <normal_fragment_maps>\nnormal=normalize(normal+vec3(sin(vSurfaceWorld.z*.5+uCityTime)*.075,0.0,cos(vSurfaceWorld.x*.3-uCityTime*.7)*.065));",
      );
  };
  material.customProgramCacheKey = () =>
    glass
      ? "city-glass"
      : sea
        ? "city-water"
        : road
          ? "city-asphalt"
          : "city-plaster";
  return material;
}

export function makeWorld(scene: THREE.Scene) {
  const grainCanvas = document.createElement("canvas");
  grainCanvas.width = 128;
  grainCanvas.height = 128;
  const grainCtx = grainCanvas.getContext("2d")!,
    pixels = grainCtx.createImageData(128, 128);
  let seed = 527;
  for (let i = 0; i < pixels.data.length; i += 4) {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    const value = 70 + (seed >>> 24) * 0.6;
    pixels.data[i] = pixels.data[i + 1] = pixels.data[i + 2] = value;
    pixels.data[i + 3] = 255;
  }
  grainCtx.putImageData(pixels, 0, 0);
  const grain = new THREE.CanvasTexture(grainCanvas);
  grain.wrapS = grain.wrapT = THREE.RepeatWrapping;
  grain.minFilter = THREE.LinearMipmapLinearFilter;
  grain.magFilter = THREE.LinearFilter;

  const batches = new Map<
    string,
    {
      geo: THREE.BufferGeometry;
      material: THREE.Material;
      matrices: THREE.Matrix4[];
    }
  >();
  const geometries = {
    box: new THREE.BoxGeometry(1, 1, 1),
    cylinder: new THREE.CylinderGeometry(1, 1, 1, 12),
    circle: new THREE.CylinderGeometry(1, 1, 1, 64),
    cone: new THREE.ConeGeometry(1, 1, 12),
    sphere: new THREE.SphereGeometry(1, 12, 8),
    frond: palmFrond(),
    arch: archWindow(),
    roof: pitchedRoof(),
    rounded: new RoundedBoxGeometry(1, 1, 1, 2, 0.12),
  };
  const dummy = new THREE.Object3D();
  const pavement = pavementLayout();
  function add(
    shape: keyof typeof geometries,
    color: string,
    x: number,
    y: number,
    z: number,
    sx: number,
    sy: number,
    sz: number,
    rx = 0,
    ry = 0,
    rz = 0,
  ) {
    const key = shape + color;
    if (!batches.has(key))
      batches.set(key, {
        geo: geometries[shape],
        material: surfaceMaterial(color, grain),
        matrices: [],
      });
    dummy.position.set(x, y, z);
    dummy.scale.set(sx, sy, sz);
    dummy.rotation.set(rx, ry, rz);
    dummy.updateMatrix();
    batches.get(key)!.matrices.push(dummy.matrix.clone());
  }
  const box = (
    c: string,
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    d: number,
    ry = 0,
  ) => add("box", c, x, y, z, w, h, d, 0, ry);
  // Narrow coastal land with inland city blocks, not a circular island.
  box("#4b9da5", 0, -1.1, 0, 2400, 1, 2500);
  box("#c9c5a6", 603, -0.4, 0, 1794, 0.4, 2500);
  box("#c9c5a6", 177, -0.25, -30, 942, 0.5, 1376);
  box("#decba6", -283, PAVEMENT_TOP / 2, -30, 22, PAVEMENT_TOP, 1376);
  for (let z = -718; z < 658; z += 5) {
    box("#aaa890", -294, 0.65, z, 1.2, 1.3, 5);
    add("sphere", "#546d6c", -300, -0.1, z, 2, 1, 2);
  }
  const ribbonBatches = new Map<string, THREE.BufferGeometry[]>();
  // Continuous extruded ribbons keep curved asphalt and kerbs smooth.
  function ribbon(
    edge: number,
    inner: number,
    outer: number,
    y: number,
    height: number,
    color: string,
  ) {
    const e = streets[edge],
      path = streetPath(edge),
      pieces: THREE.BufferGeometry[] = [];
    for (let i = 1; i < path.length; i++) {
      const points = [
        lanePosition(edge, e.a, path[i - 1].distance, inner),
        lanePosition(edge, e.a, path[i].distance, inner),
        lanePosition(edge, e.a, path[i].distance, outer),
        lanePosition(edge, e.a, path[i - 1].distance, outer),
      ];
      // Do not lay a raised outer kerb across a roundabout entrance or junction.
      if (
        height === PAVEMENT_TOP &&
        points.some((p) => roadContains(p.x, p.z, 0.08))
      )
        continue;
      const shape = new THREE.Shape();
      points.forEach((p, j) =>
        j ? shape.lineTo(p.x, -p.z) : shape.moveTo(p.x, -p.z),
      );
      shape.closePath();
      const geo = new THREE.ExtrudeGeometry(shape, {
        depth: height,
        bevelEnabled: false,
      });
      geo.rotateX(-Math.PI / 2);
      pieces.push(geo);
    }
    if (!pieces.length) return;
    const geo = mergeGeometries(pieces);
    pieces.forEach((p) => p.dispose());
    geo.translate(0, y, 0);
    if (!ribbonBatches.has(color)) ribbonBatches.set(color, []);
    ribbonBatches.get(color)!.push(geo);
  }
  for (const e of streets) {
    const g = geometry(e.id),
      mid = lanePosition(e.id, e.a, g.length / 2, 0),
      yaw = mid.yaw;
    if (isCurved(e.id)) {
      ribbon(e.id, -e.width / 2, e.width / 2, 0.01, 0.06, "#525f65");
      for (const side of [-1, 1])
        ribbon(
          e.id,
          (side * e.width) / 2,
          side * (e.width / 2 + 3.3),
          0,
          PAVEMENT_TOP,
          "#dbd0b5",
        );
    } else {
      box("#dbd0b5", mid.x, 0, mid.z, e.width + 6.6, 0.06, g.length + 1, yaw);
      box("#525f65", mid.x, 0.04, mid.z, e.width, 0.06, g.length + 0.2, yaw);
    }
    if (e.oneWay) continue;
    for (let d = 23; d < g.length - 23; d += 4) {
      for (const side of [-1, 1]) {
        const p = lanePosition(e.id, e.a, d, side * (e.width / 2 + 0.15));
        box(
          Math.floor(d / 4) % 2 ? "#ead6a0" : "#323f41",
          p.x,
          PAVEMENT_TOP / 2,
          p.z,
          0.45,
          PAVEMENT_TOP,
          3.8,
          p.yaw,
        );
      }
    }
    for (let d = 28; d < g.length - 28; d += 10) {
      for (const side of e.width > 12 ? [-1, 1] : []) {
        const p = lanePosition(e.id, e.a, d, side * 5);
        box("#d8dfd2", p.x, 0.085, p.z, 0.16, 0.018, 4, p.yaw);
      }
      const p = lanePosition(e.id, e.a, d, 0);
      box("#dfbf63", p.x, 0.085, p.z, 0.18, 0.018, 7, p.yaw);
    }
  }
  for (const n of junctions)
    if (!n.ring) {
      box("#d9d0b8", n.x, 0.01, n.z, 44, 0.04, 44);
      // Street rectangles meet directly; no asphalt apron cutting into footpaths.
    }
  for (const strip of pavement.strips)
    box(
      "#dbd0b5",
      strip.x,
      PAVEMENT_TOP / 2,
      strip.z,
      strip.width,
      PAVEMENT_TOP,
      1,
    );
  add("circle", "#d4c5a2", 110, 0.2, 180, 22, 0.4, 22);
  add("circle", "#7e9c6b", 110, 0.42, 180, 20, 0.35, 20);
  add("circle", "#d3d9bf", 110, 0.8, 180, 8, 1, 8);
  add("circle", "#66a5a9", 110, 1.35, 180, 6, 0.2, 6);
  add("circle", "#c6c7a7", 110, 2, 180, 1.5, 3, 1.5);
  function sign(
    text: string,
    x: number,
    y: number,
    z: number,
    yaw: number,
    width = 7,
    bg = "#215858",
  ) {
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 128;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, 512, 128);
    ctx.fillStyle = "#fff2ca";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "bold 36px sans-serif";
    ctx.fillText(text, 256, 65, 490);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(width, width / 4),
      new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide }),
    );
    mesh.position.set(x, y, z);
    mesh.rotation.y = yaw;
    scene.add(mesh);
    if (width >= 6) add("cylinder", "#516356", x, y / 2, z, 0.07, y, 0.07);
  }
  const lights: {
    node: number;
    dx: number;
    dz: number;
    x: number;
    z: number;
    yaw: number;
  }[] = [];
  for (const n of junctions) {
    if (n.ring) continue;
    const incident = streets.filter((e) => e.a === n.id || e.b === n.id);
    for (const e of incident) {
      const from = e.a === n.id ? e.b : e.a,
        g = geometry(e.id, from),
        yaw = Math.atan2(-g.dx, -g.dz);
      for (
        let offset = -e.width / 2 + 1.5;
        offset <= e.width / 2 - 1;
        offset += 2.7
      ) {
        const p = lanePosition(e.id, from, g.length - 21, offset);
        box("#ebebd6", p.x, 0.12, p.z, 1.5, 0.025, 4.8, Math.atan2(g.dx, g.dz));
      }
      const bar = lanePosition(e.id, from, g.length - 26, e.width / 4);
      box(
        "#e9e7cd",
        bar.x,
        0.12,
        bar.z,
        e.width / 2 - 2,
        0.025,
        0.4,
        Math.atan2(g.dx, g.dz),
      );
      const p = lanePosition(e.id, from, g.length - 24, e.width / 2 + 2);
      if (n.signal) {
        add("cylinder", "#374c42", p.x, 2.25, p.z, 0.09, 4.5, 0.09);
        box("#213b31", p.x, 4.25, p.z, 0.6, 1.8, 0.4, yaw);
        lights.push({ node: n.id, dx: g.dx, dz: g.dz, x: p.x, z: p.z, yaw });
      } else if (incident.length === 2 && n.id % 2 === 0)
        sign("SLOW · JUNCTION", p.x, 2.6, p.z, yaw, 4, "#ad7e36");
    }
    if (n.id % 3 === 0) {
      const p = { x: n.x + 16, z: n.z + 18 };
      sign(n.name.toUpperCase(), p.x, 3.3, p.z, Math.PI, 7);
    }
  }
  const bulbs = new THREE.InstancedMesh(
    new THREE.SphereGeometry(0.18, 8, 6),
    new THREE.MeshBasicMaterial({ color: "#ffffff" }),
    lights.length * 3,
  );
  const color = new THREE.Color();
  lights.forEach((l, i) => {
    for (let j = 0; j < 3; j++) {
      dummy.position.set(
        l.x + Math.sin(l.yaw) * 0.26,
        4.85 - j * 0.55,
        l.z + Math.cos(l.yaw) * 0.26,
      );
      dummy.rotation.set(0, 0, 0);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      bulbs.setMatrixAt(i * 3 + j, dummy.matrix);
      bulbs.setColorAt(i * 3 + j, color.set("#24392f"));
    }
  });
  scene.add(bulbs);
  // Road-front buildings, shops and balconies; shared boxes keep draw calls bounded.
  const facades = [
    "#e1bb8d",
    "#c99479",
    "#c7c5ac",
    "#9bb6b3",
    "#e1cea0",
    "#b5b4ba",
  ];
  const lots = buildingLots();
  for (const p of lots) {
    const e = streets[p.edge],
      d = p.distance,
      side = p.side;
    const g = { dx: Math.sin(p.yaw), dz: Math.cos(p.yaw) };
    const seed = e.id * 31 + Math.floor(d * 1.618) + side * 7,
      style = e.width <= 12 ? 2 : Math.abs(seed) % 4,
      h =
        style === 2
          ? 12 + (Math.abs(seed) % 3) * 3.5
          : style === 1
            ? 17 + (Math.abs(seed) % 2) * 4
            : 16 + (Math.abs(seed) % 4) * 3.5,
      c = facades[Math.abs(seed) % 6];
    add(
      style === 0 ? "rounded" : "box",
      style === 1 ? "#ad8a61" : c,
      p.x,
      h / 2,
      p.z,
      17,
      h,
      20,
      0,
      p.yaw,
    );
    const front = (along: number, out = 0) => ({
      x: p.x - Math.cos(p.yaw) * side * (8.6 + out) + Math.sin(p.yaw) * along,
      z: p.z + Math.sin(p.yaw) * side * (8.6 + out) + Math.cos(p.yaw) * along,
    });
    const face = (
      color: string,
      along: number,
      y: number,
      wide: number,
      tall: number,
      depth = 0.15,
      out = 0,
    ) => {
      const q = front(along, out);
      box(color, q.x, y, q.z, depth, tall, wide, p.yaw);
    };
    // Mumbai's coastal Art Deco, Fort stone arcades, chawls and mixed-use blocks.
    if (style === 0) {
      for (let floor = 3; floor < h; floor += 3.5) {
        face("#eee0b7", 0, floor, 20, 0.25, 1.1, 0.45);
        const q = front(7, 0.1);
        add("cylinder", c, q.x, floor + 0.35, q.z, 2.1, 0.8, 2.1);
      }
      face("#e4cf9b", -7, h / 2, 1.1, h + 1, 0.5, 0.2);
      face("#eee0b7", -7, h + 0.5, 3, 1, 0.6, 0.2);
      face("#b57d54", -7, h + 1.3, 1.8, 0.6, 0.6, 0.2);
    } else if (style === 1) {
      for (const along of [-9, -3, 3, 9]) {
        const q = front(along, 0.2);
        add("cylinder", "#e0c291", q.x, h / 2, q.z, 0.38, h, 0.38);
        face("#e9d0a1", along, h - 0.3, 1.2, 0.5, 0.8, 0.25);
      }
      add("roof", "#795440", p.x, h + 0.5, p.z, 18, 3, 21, 0, p.yaw);
      for (const along of [-7, 0, 7])
        face("#d7bb8c", along, h + 1, 1.2, 2.2, 1.2, 0.2);
    } else if (style === 2) {
      add("roof", "#985e40", p.x, h + 0.5, p.z, 19, 2.5, 22, 0, p.yaw);
      for (let floor = 3; floor < h; floor += 3.5) {
        face("#565a4b", 0, floor + 0.65, 20, 0.08, 0.08, 1.2);
        face("#c5ac80", 0, floor, 20, 0.3, 2, 1);
        for (let along = -9; along <= 9; along += 1.5)
          face("#565a4b", along, floor + 0.35, 0.05, 0.7, 0.05, 1.2);
        for (let along = -7; along <= 7; along += 3.5) {
          face("#5d6c60", along, floor + 1.3, 1.5, 2.1, 0.12, 0.1);
          face(
            ["#bd6860", "#d3b653", "#54798a"][
              Math.abs(Math.floor(along + floor)) % 3
            ],
            along + 0.6,
            floor + 1.3,
            0.8,
            1.1,
            0.035,
            1.3,
          );
        }
      }
    } else {
      for (let floor = 5; floor < h; floor += 4)
        for (const along of [-6, 6]) {
          face("#aab3aa", along, floor, 1.7, 0.7, 0.6, 0.35);
          face("#526b68", along, floor, 1.35, 0.45, 0.65, 0.37);
        }
      for (let along = -9; along <= 9; along += 6)
        face("#e3cda5", along, h / 2, 0.35, h, 0.3, 0.1);
    }
    if (Math.abs(seed) % 3 === 0) {
      const q = front(0, 0.5);
      sign(
        ["SAGAR MAHAL", "FORT CHAMBERS", "GANESH NIWAS", "MUMBAI SADAN"][style],
        q.x,
        h - 0.9,
        q.z,
        Math.atan2(-g.dz * side, g.dx * side),
        5,
        style === 1 ? "#614d3c" : "#31645e",
      );
    }
    box("#eee1bf", p.x, h + 0.25, p.z, 18, 0.5, 21, p.yaw);
    for (let floor = 3.6; floor < h; floor += 3.5)
      for (const shift of [-5, 0, 5]) {
        const wx = p.x - g.dz * side * 8.6 + g.dx * shift,
          wz = p.z + g.dx * side * 8.6 + g.dz * shift;
        if (style === 1) {
          add("arch", "#e3c99a", wx, floor - 0.95, wz, 0.22, 2.4, 3, 0, p.yaw);
          const q = front(shift, 0.25);
          add(
            "arch",
            "#344a47",
            q.x,
            floor - 0.8,
            q.z,
            0.25,
            1.9,
            2.4,
            0,
            p.yaw,
          );
        } else if (style !== 2)
          box("#4d7480", wx, floor, wz, 0.15, 1.65, 2.3, p.yaw);
        if (style === 1 || style === 2) continue;
        // Window mullions and iron balcony rails soften the repeated facades.
        box("#d5cab5", wx, floor, wz, 0.19, 1.7, 0.075, p.yaw);
        const railX = wx - g.dz * side * 0.72,
          railZ = wz + g.dx * side * 0.72;
        box("#596365", railX, floor - 0.35, railZ, 0.055, 0.055, 2.8, p.yaw);
        for (const offset of [-1.2, -0.6, 0, 0.6, 1.2])
          box(
            "#596365",
            railX + g.dx * offset,
            floor - 0.65,
            railZ + g.dz * offset,
            0.05,
            0.65,
            0.05,
            p.yaw,
          );

        box(
          "#e6d8b4",
          wx - g.dz * side * 0.35,
          floor - 1,
          wz + g.dx * side * 0.35,
          0.8,
          0.17,
          2.8,
          p.yaw,
        );
      }
    const shop = front(0, 0.4);
    box(
      seed % 2 ? "#be713c" : "#437e70",
      shop.x,
      2.65,
      shop.z,
      2,
      0.3,
      16,
      p.yaw,
    );
    box("#444f49", shop.x, 1.35, shop.z, 0.15, 2.4, 13, p.yaw);
    if (Math.abs(seed) % 3 === 0)
      sign(
        ["CHAI & CHILL", "VADA PAV", "MUMBAI STORES", "PAPA KI GARAGE"][
          Math.abs(seed) % 4
        ],
        shop.x - g.dz * side * 0.2,
        3.2,
        shop.z + g.dx * side * 0.2,
        Math.atan2(-g.dz * side, g.dx * side),
        6,
        seed % 2 ? "#a45a35" : "#255e5b",
      );
    if (Math.abs(seed) % 5 === 0) {
      box("#eee4bc", p.x, h + 1.2, p.z, 3, 2, 3, p.yaw);
      add("cylinder", "#2e4148", p.x + 3, h + 1.5, p.z + 2, 1.5, 2.4, 1.5);
    }
    if (p.corner) {
      // Corners are seen from two roads: wrap windows, cornices and shops
      // onto the end walls rather than exposing a blank box.
      for (const end of [-1, 1]) {
        const local = (across: number, along: number) => ({
          x: p.x + Math.cos(p.yaw) * across + Math.sin(p.yaw) * along,
          z: p.z - Math.sin(p.yaw) * across + Math.cos(p.yaw) * along,
        });
        for (let floor = 3.6; floor < h; floor += 3.5) {
          const ledge = local(0, end * 10.2);
          box("#eee0b7", ledge.x, floor - 1, ledge.z, 17, 0.22, 0.65, p.yaw);
          for (const across of [-5, 0, 5]) {
            const q = local(across, end * 10.1);
            box("#4d7480", q.x, floor, q.z, 2.3, 1.65, 0.16, p.yaw);
            box("#d5cab5", q.x, floor, q.z, 0.08, 1.7, 0.2, p.yaw);
          }
        }
        const q = local(0, end * 10.2);
        box("#437e70", q.x, 2.65, q.z, 13, 0.3, 1.2, p.yaw);
        for (const across of [-4, 0, 4]) {
          const door = local(across, end * 10.1);
          box("#444f49", door.x, 1.3, door.z, 3, 2.4, 0.16, p.yaw);
        }
      }
    }
  }
  // Central maidan and street furniture break up the dense urban blocks.
  box("#88a36e", -170, 0.08, 70, 90, 0.15, 140);
  box("#d4bd8a", -170, 0.18, 70, 4, 0.12, 24);
  for (const z of [57, 83])
    for (const x of [-0.4, 0, 0.4])
      box("#ece2bd", -170 + x, 0.75, z, 0.08, 1.2, 0.08);
  sign("OVAL MAIDAN", -220, 3, 65, Math.PI / 2, 7);
  for (const e of streets) {
    if (e.oneWay) continue;
    const g = geometry(e.id);
    for (let d = 35; d < g.length - 30; d += 43)
      for (const side of [-1, 1]) {
        const p = lanePosition(e.id, e.a, d, side * (e.width / 2 + 3.3));
        add("cylinder", "#3f5551", p.x, 3.2, p.z, 0.09, 6.4, 0.09);
        box("#f6e5b0", p.x, 6.5, p.z, 0.8, 0.23, 0.6, p.yaw);
        // Palms belong on the western beach promenade, not inland streets.
        if (p.x < -270) {
          add(
            "cylinder",
            "#887151",
            p.x + g.dx * 5,
            3.2,
            p.z + g.dz * 5,
            0.23,
            6.4,
            0.23,
          );
          for (let j = 0; j < 5; j++) {
            const a = (j * Math.PI * 2) / 5;
            add(
              "frond",
              j % 2 ? "#3e7951" : "#527f48",
              p.x + g.dx * 5,
              6.8,
              p.z + g.dz * 5,
              1,
              1,
              1,
              0,
              -a,
            );
          }
        }
        if (e.id % 4 === 0) {
          const b = lanePosition(e.id, e.a, d + 10, side * (e.width / 2 + 3));
          box("#906f4e", b.x, 0.65, b.z, 1, 0.22, 3, p.yaw);
          box(
            "#906f4e",
            b.x + g.dz * side * 0.5,
            1,
            b.z - g.dx * side * 0.5,
            0.15,
            0.8,
            3,
            p.yaw,
          );
        }
      }
  }
  // BEST-style bus stops, small stalls, parked taxis and a shoulder repair zone.
  for (const e of streets.filter((e) => !e.oneWay && e.id % 6 === 0)) {
    const g = geometry(e.id),
      p = lanePosition(e.id, e.a, g.length * 0.5, 16);
    box("#af4437", p.x, 2.9, p.z, 3, 0.22, 7, p.yaw);
    for (const d of [-2.6, 2.6])
      add(
        "cylinder",
        "#41594c",
        p.x + g.dx * d,
        1.5,
        p.z + g.dz * d,
        0.07,
        3,
        0.07,
      );
    sign(
      "BEST · BUS STOP",
      p.x,
      2.45,
      p.z,
      Math.atan2(g.dz, -g.dx),
      5,
      "#a84636",
    );
  }
  for (const o of obstacles) {
    const taxi = trafficCar(0);
    taxi.position.set(o.x, 0, o.z);
    scene.add(taxi);
  }

  // Kerbside carts leave through lanes and pedestrian crossings open.
  const vendors: { x: number; z: number }[] = [];
  for (const e of streets) {
    if (e.oneWay) continue;
    const g = geometry(e.id);
    for (let d = 58; d < g.length - 45; d += 72) {
      const side = (e.id + Math.floor(d)) % 2 ? 1 : -1;
      const p = lanePosition(e.id, e.a, d, side * (e.width / 2 + 0.95));
      vendors.push(p);
      const lift = PAVEMENT_TOP;
      const vbox: typeof box = (c, x, y, z, w, h, d, ry = 0) =>
        box(c, x, y + lift, z, w, h, d, ry);
      const vadd: typeof add = (
        shape,
        c,
        x,
        y,
        z,
        sx,
        sy,
        sz,
        rx = 0,
        ry = 0,
        rz = 0,
      ) => add(shape, c, x, y + lift, z, sx, sy, sz, rx, ry, rz);

      const style = vendors.length % 4;
      const local = (forward: number, lateral: number) => ({
        x: p.x + g.dx * forward - g.dz * lateral,
        z: p.z + g.dz * forward + g.dx * lateral,
      });
      vbox(
        ["#267e74", "#b5482f", "#b89a44", "#4c7796"][style],
        p.x,
        0.85,
        p.z,
        1.25,
        0.9,
        2.7,
        p.yaw,
      );
      vbox("#b9b6a4", p.x, 1.35, p.z, 1.45, 0.12, 2.9, p.yaw);
      for (const f of [-1.1, 1.1]) {
        const q = local(f, 0);
        vadd(
          "cylinder",
          "#273332",
          q.x,
          0.3,
          q.z,
          0.3,
          0.18,
          0.3,
          0,
          0,
          Math.PI / 2,
        );
        vadd("cylinder", "#49544b", q.x, 1.95, q.z, 0.035, 1.3, 0.035);
      }
      vbox(
        style % 2 ? "#e39d3d" : "#396e6a",
        p.x,
        2.65,
        p.z,
        1.8,
        0.12,
        3.2,
        p.yaw,
      );
      for (const f of [-0.9, -0.3, 0.3, 0.9]) {
        const q = local(f, 0);
        if (style === 0) {
          vadd("cylinder", "#a4aaa4", q.x, 1.58, q.z, 0.18, 0.35, 0.18);
        } else {
          for (const l of [-0.3, 0, 0.3]) {
            const fruit = local(f, l);
            vadd(
              "sphere",
              style === 1 ? "#eab63f" : style === 2 ? "#87a447" : "#c9643b",
              fruit.x,
              1.5,
              fruit.z,
              0.14,
              0.14,
              0.14,
            );
          }
        }
      }
      sign(
        ["CHAI · CUTTING", "VADA PAV", "TAZE PHAL", "BHEL PURI"][style],
        p.x,
        2.35 + lift,
        p.z,
        Math.atan2(-g.dz * side, g.dx * side),
        3.2,
        "#79472d",
      );
      // Boxy sellers and customers, sharing the city's instanced geometry.
      for (const f of [-2.1, 2.1]) {
        const q = local(f, 0);
        vbox(
          style % 2 ? "#d3b779" : "#89a2a0",
          q.x,
          1.25,
          q.z,
          0.55,
          0.75,
          0.35,
          p.yaw,
        );
        vbox("#b67e51", q.x, 1.88, q.z, 0.4, 0.42, 0.4, p.yaw);
        for (const l of [-0.16, 0.16]) {
          const leg = local(f, l);
          vbox("#3e4b53", leg.x, 0.58, leg.z, 0.2, 0.6, 0.23, p.yaw);
        }
      }
    }
  }
  // A continuous inhabited land-side edge; the west stays open to the seawall.
  for (const block of boundaryBuildings) {
    const { x, z, width, depth, yaw, height: h } = block;
    const local = (along: number, out: number) => ({
      x: x + Math.cos(yaw) * along + Math.sin(yaw) * out,
      z: z - Math.sin(yaw) * along + Math.cos(yaw) * out,
    });
    const c = facades[block.id % facades.length];
    box(c, x, h / 2, z, width, h, depth, yaw);
    box(
      "#dbd0b5",
      x,
      PAVEMENT_TOP / 2,
      z,
      width + 0.2,
      PAVEMENT_TOP,
      depth + 5,
      yaw,
    );
    const facade = (
      color: string,
      along: number,
      y: number,
      w: number,
      tall: number,
      d: number,
      out = 0,
    ) => {
      const q = local(along, depth / 2 + out);
      box(color, q.x, y, q.z, w, tall, d, yaw);
    };
    facade("#eee0b7", 0, h, width + 0.3, 0.6, 1);
    for (let y = 4; y < h - 1; y += 3.4) {
      facade("#eee0b7", 0, y - 1.1, width, 0.22, 1.1, 0.3);
      facade("#4d625a", 0, y - 0.5, width, 0.35, 0.1, 0.9);
      for (let along = -width / 2 + 2; along < width / 2 - 1; along += 3.5) {
        facade("#385653", along, y, 1.5, 1.8, 0.15, 0.05);
      }
    }
    for (let along = -width / 2 + 3; along < width / 2; along += 6) {
      facade("#4d645c", along, 1.5, 4.5, 2.8, 0.2, 0.1);
      facade(
        block.id % 2 ? "#ac613b" : "#d2aa56",
        along,
        3.1,
        5,
        0.35,
        1.6,
        0.6,
      );
    }
    const tank = local(width / 3, 0);
    add("cylinder", "#4a5149", tank.x, h + 1, tank.z, 1.2, 2, 1.2);
  }
  // Gateway-inspired waterfront arch in the south-east, plus a station silhouette inland.
  const gx = 335,
    gz = 585;
  box("#d9c7a0", gx, 0.25, gz, 34, 0.5, 36);
  const arch = new THREE.Shape();
  arch.moveTo(-7, 0);
  arch.lineTo(-7, 16);
  arch.lineTo(7, 16);
  arch.lineTo(7, 0);
  arch.lineTo(-7, 0);
  const hole = new THREE.Path();
  hole.moveTo(-3.1, 0);
  hole.lineTo(3.1, 0);
  hole.lineTo(3.1, 8);
  hole.quadraticCurveTo(0, 13, -3.1, 8);
  hole.lineTo(-3.1, 0);
  arch.holes.push(hole);
  const monument = new THREE.Mesh(
    new THREE.ExtrudeGeometry(arch, { depth: 4, bevelEnabled: false }),
    new THREE.MeshStandardMaterial({ color: "#d2ad77" }),
  );
  monument.position.set(gx, 0.5, gz);
  monument.rotation.y = -Math.PI / 2;
  scene.add(monument);
  for (const side of [-1, 1]) {
    add("cylinder", "#c7a574", gx - 2, 9, gz + side * 8, 2, 17, 2);
    add("sphere", "#dbbe88", gx - 2, 18, gz + side * 8, 2.1, 1.6, 2.1);
    add("cone", "#be965e", gx - 2, 20, gz + side * 8, 0.6, 2, 0.6);
  }
  box("#dfc58f", gx - 2, 16.7, gz, 5, 1.2, 19);
  sign("GATEWAY WATERFRONT", 310, 3, 558, Math.PI, 9);
  box("#ba8d65", 220, 8, -300, 76, 16, 24);
  box("#d5bf91", 220, 10, -300, 17, 20, 26);
  add("sphere", "#c5a977", 220, 24, -300, 9, 7, 9);
  add("cone", "#9b7952", 220, 32, -300, 2, 6, 2);
  for (const x of [185, 255]) {
    box("#d0b385", x, 13, -300, 9, 26, 15);
    add("cone", "#8f7057", x, 29, -300, 7, 8, 7);
  }
  sign("VICTORIA STATION", 220, 8, -285, 0, 20, "#79583e");
  for (let i = 0; i < 12; i++) {
    const x = -420 - (i % 3) * 60,
      z = -450 + i * 90;
    box("#eee5c6", x, 0, z, 3, 0.7, 7);
    add("cone", "#f7eed2", x, 4, z, 2.5, 6, 0.15);
  }
  for (const [color, pieces] of ribbonBatches) {
    const geo = mergeGeometries(pieces);
    pieces.forEach((p) => p.dispose());
    const mesh = new THREE.Mesh(geo, surfaceMaterial(color, grain));
    mesh.receiveShadow = true;
    scene.add(mesh);
  }
  const localBatches: {
    mesh: THREE.InstancedMesh;
    matrices: THREE.Matrix4[];
  }[] = [];
  for (const b of batches.values()) {
    const mesh = new THREE.InstancedMesh(b.geo, b.material, b.matrices.length);
    b.matrices.forEach((m, i) => mesh.setMatrixAt(i, m));
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    localBatches.push({ mesh, matrices: b.matrices });
    mesh.castShadow = !["53595b", "4b9da5", "c9c5a6", "decba6"].includes(
      (b.material as THREE.MeshStandardMaterial).color.getHexString(),
    );
    mesh.receiveShadow = true;
    mesh.computeBoundingSphere();
    scene.add(mesh);
  }
  const crowd = makeCrowd(scene, pavement.heightAt);
  const cones = makeCones(scene, pavement.heightAt);
  let lastLights = -1,
    lastViewX = Infinity,
    lastViewZ = Infinity,
    lastLow = false;
  return {
    crowd,
    cones,
    marketIntensity(x: number, z: number) {
      let nearest = Infinity;
      for (const vendor of vendors)
        nearest = Math.min(nearest, Math.hypot(x - vendor.x, z - vendor.z));
      return Math.max(0, 1 - nearest / 38);
    },
    update(time: number, x: number, z: number, low = false) {
      if (low !== lastLow || Math.hypot(x - lastViewX, z - lastViewZ) > 12) {
        for (const batch of localBatches)
          localInstances(batch.mesh, batch.matrices, x, z, low ? 270 : 350);
        lastViewX = x;
        lastViewZ = z;
        lastLow = low;
      }
      crowd.update(time, x, z, low);
      cones.update(x, z);
      cityTime.value = time;
      if (Math.floor(time * 4) !== lastLights) {
        lastLights = Math.floor(time * 4);
        lights.forEach((l, i) => {
          const active = lightFor(l.node, l.dx, l.dz, time);
          ["red", "amber", "green"].forEach((name, j) =>
            bulbs.setColorAt(
              i * 3 + j,
              color.set(
                active === name
                  ? ["#ff4433", "#ffc93e", "#64ef86"][j]
                  : "#26372e",
              ),
            ),
          );
        });
        if (bulbs.instanceColor) bulbs.instanceColor.needsUpdate = true;
      }
    },
  };
}

function scooterModel() {
  const g = new THREE.Group();
  const box = (
    w: number,
    h: number,
    d: number,
    x: number,
    y: number,
    z: number,
    c: string,
  ) => {
    const m = new THREE.Mesh(
      y > 1.7 || c === "#9b8161"
        ? new THREE.BoxGeometry(w, h, d)
        : new RoundedBoxGeometry(
            w,
            h,
            d,
            2,
            Math.min(0.08, w / 3, h / 3, d / 3),
          ),
      new THREE.MeshStandardMaterial({
        color: c,
        roughness: 0.35,
        metalness: 0.3,
      }),
    );
    m.position.set(x, y, z);
    g.add(m);
  };
  box(0.65, 0.4, 1.25, 0, 0.6, 0, "#359d9e");
  box(0.68, 0.9, 0.2, 0, 1.05, 0.55, "#359d9e");
  box(0.6, 0.15, 0.7, 0, 0.94, -0.22, "#2c3d3e");
  box(0.7, 0.07, 0.08, 0, 1.52, 0.55, "#334548");
  box(0.3, 0.3, 0.3, 0, 1.76, 0, "#b98756");
  box(0.36, 0.17, 0.36, 0, 1.96, 0, "#e5aa3b");
  box(0.44, 0.55, 0.3, 0, 1.35, 0, "#9b8161");
  for (const z of [-0.6, 0.65]) {
    const wheel = new THREE.Mesh(
      new THREE.CylinderGeometry(0.28, 0.28, 0.16, 10),
      new THREE.MeshStandardMaterial({ color: "#253538" }),
    );
    wheel.rotation.z = Math.PI / 2;
    wheel.position.set(0, 0.28, z);
    g.add(wheel);
  }
  return g;
}

export function trafficVisuals(
  scene: THREE.Scene,
  traffic: Traffic[],
  autoModel: THREE.Group,
) {
  const batches: { mesh: THREE.InstancedMesh; ids: number[] }[] = [];
  const transform = new THREE.Object3D();
  for (let kind = 0; kind < 6; kind++) {
    const ids = traffic
      .map((t, i) => (t.kind === kind ? i : -1))
      .filter((i) => i >= 0);
    if (!ids.length) continue;
    let model: THREE.Group;
    if (kind === 4) model = autoModel.clone(true);
    else if (kind === 5) {
      model = scooterModel();
    } else {
      model = trafficCar(kind);
    }
    model.updateMatrixWorld(true);
    const groups = new Map<
        string,
        { geos: THREE.BufferGeometry[]; material: THREE.Material }
      >(),
      originalGeos = new Set<THREE.BufferGeometry>(),
      originalMats = new Set<THREE.Material>();
    model.traverse((o) => {
      if (!(o instanceof THREE.Mesh)) return;
      const mat = o.material as THREE.MeshStandardMaterial;
      originalGeos.add(o.geometry);
      originalMats.add(mat);
      if (mat.transparent || ("map" in mat && mat.map)) return;
      const key = kind === 4 ? mat.uuid : mat.color.getHexString();
      if (!groups.has(key))
        groups.set(key, { geos: [], material: mat.clone() });
      const geometry = (
        o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone()
      ).applyMatrix4(o.matrixWorld);
      // Imported body surfaces and wheel primitives can have different UV sets.
      // These untextured traffic batches only need positions and normals.
      if (kind === 4)
        for (const attribute of Object.keys(geometry.attributes))
          if (attribute !== "position" && attribute !== "normal")
            geometry.deleteAttribute(attribute);
      groups.get(key)!.geos.push(geometry);
    });
    for (const group of groups.values()) {
      const geometry = mergeGeometries(group.geos);
      group.geos.forEach((g) => g.dispose());
      if (!geometry) continue;
      const mesh = new THREE.InstancedMesh(
        geometry,
        group.material,
        ids.length,
      );
      mesh.frustumCulled = false;
      mesh.castShadow = false;
      mesh.receiveShadow = true;
      scene.add(mesh);
      batches.push({ mesh, ids });
    }
    // The imported traffic template borrows the player's mesh resources.
    // Only its baked instance geometries belong to traffic; engine disposal owns originals.
    if (kind !== 4) originalGeos.forEach((g) => g.dispose());
    if (kind !== 4)
      originalMats.forEach((m) => {
        const map = (m as THREE.MeshStandardMaterial).map;
        map?.dispose();
        m.dispose();
      });
  }
  return (x: number, z: number) => {
    for (const b of batches) {
      let visible = 0;
      b.ids.forEach((id) => {
        const t = traffic[id];
        if (Math.hypot(t.x - x, t.z - z) > 280) return;
        const i = visible++;
        transform.position.set(t.x, 0, t.z);
        transform.rotation.set(0, t.yaw, 0);
        transform.scale.set(1, 1, 1);
        transform.updateMatrix();
        b.mesh.setMatrixAt(i, transform.matrix);
      });
      b.mesh.count = visible;
      b.mesh.instanceMatrix.clearUpdateRanges();
      if (visible) b.mesh.instanceMatrix.addUpdateRange(0, visible * 16);
      b.mesh.instanceMatrix.needsUpdate = true;
    }
  };
}
