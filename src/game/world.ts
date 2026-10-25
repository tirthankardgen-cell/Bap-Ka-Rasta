import * as THREE from "three";
import {
  streets,
  junctions,
  geometry,
  lanePosition,
  lightFor,
  signalPhase,
  crossingPosition,
  obstacles,
  roadContains,
} from "./network";
import type { Traffic } from "./simulation";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

const colors = {
  black: "#222d31",
  yellow: "#f9bd26",
  glass: "#80c3d0",
  tire: "#172127",
  khaki: "#b29a6a",
  skin: "#bc844f",
};
export function autoRickshaw() {
  const root = new THREE.Group();
  const mats = new Map<string, THREE.MeshStandardMaterial>();
  const material = (c: string) => {
    if (!mats.has(c))
      mats.set(c, new THREE.MeshStandardMaterial({ color: c, roughness: 0.8 }));
    return mats.get(c)!;
  };
  const box = (
    w: number,
    h: number,
    d: number,
    x: number,
    y: number,
    z: number,
    c: string,
  ) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material(c));
    m.position.set(x, y, z);
    m.castShadow = true;
    root.add(m);
    return m;
  };
  box(1.55, 0.45, 2.4, 0, 0.67, 0, colors.yellow);
  box(1.6, 0.65, 0.22, 0, 1.14, -1.12, colors.black);
  box(1.6, 0.55, 0.65, 0, 1.12, 0.83, colors.yellow);
  box(1.7, 0.22, 2.12, 0, 2.2, -0.12, colors.black);
  box(1.62, 0.65, 0.16, 0, 1.7, -1.12, colors.black);
  box(0.85, 0.42, 0.02, 0, 1.75, -1.21, colors.glass);
  for (const x of [-0.74, 0.74]) {
    box(0.085, 1.1, 0.08, x, 1.65, 0.65, colors.black);
    box(0.09, 1.2, 0.09, x, 1.65, -1, colors.black);
    box(0.1, 0.4, 1.1, x, 0.93, -0.3, colors.yellow);
    box(0.18, 0.13, 0.32, x * 1.22, 1.55, 0.7, colors.black);
    box(0.15, 0.13, 0.04, x * 0.8, 0.77, -1.25, "#e55939");
  }
  // A narrow clear windscreen leaves the khaki driver visible from either side.
  const wind = new THREE.Mesh(
    new THREE.PlaneGeometry(1.36, 0.66),
    new THREE.MeshStandardMaterial({
      color: colors.glass,
      transparent: true,
      opacity: 0.2,
      side: THREE.DoubleSide,
      depthWrite: false,
    }),
  );
  wind.position.set(0, 1.75, 0.71);
  root.add(wind);
  box(1.25, 0.2, 0.6, 0, 1, -0.65, colors.black);
  box(0.65, 0.22, 0.5, 0, 1, 0.12, colors.black);
  box(0.55, 0.62, 0.38, 0, 1.43, 0.15, colors.khaki);
  box(0.38, 0.4, 0.38, 0, 1.95, 0.18, colors.skin);
  box(0.43, 0.13, 0.43, 0, 2.12, 0.18, "#eee7cc");
  box(0.16, 0.05, 0.025, 0, 1.88, 0.383, "#302e26");
  for (const x of [-0.32, 0.32]) {
    const arm = box(0.16, 0.48, 0.18, x, 1.43, 0.32, colors.khaki);
    arm.rotation.x = -0.65;
    box(0.16, 0.16, 0.16, x, 1.27, 0.54, colors.skin);
  }
  box(0.7, 0.05, 0.09, 0, 1.23, 0.65, colors.black);
  box(0.6, 0.14, 0.06, 0, 0.82, -1.25, "#f7e9b0");
  box(0.37, 0.22, 0.04, 0, 1.1, 1.17, "#fff2b7");
  box(0.5, 0.05, 0.05, 0, 0.9, 1.18, "#ced9d1");
  const wheels: THREE.Mesh[] = [];
  for (const [x, z] of [
    [-0.78, -0.65],
    [0.78, -0.65],
    [0, 1],
  ]) {
    const tire = new THREE.Mesh(
      new THREE.CylinderGeometry(0.34, 0.34, 0.22, 12),
      material(colors.tire),
    );
    tire.rotation.z = Math.PI / 2;
    tire.position.set(x, 0.35, z);
    root.add(tire);
    wheels.push(tire);
    const hub = new THREE.Mesh(
      new THREE.CylinderGeometry(0.15, 0.15, 0.235, 12),
      material("#a7b7b6"),
    );
    hub.rotation.z = Math.PI / 2;
    hub.position.copy(tire.position);
    root.add(hub);
  }
  const decalCanvas = document.createElement("canvas");
  decalCanvas.width = 256;
  decalCanvas.height = 64;
  const dc = decalCanvas.getContext("2d")!;
  dc.fillStyle = "#263132";
  dc.fillRect(0, 0, 256, 64);
  dc.fillStyle = "#f5d375";
  dc.font = "bold 24px sans-serif";
  dc.textAlign = "center";
  dc.fillText("HORN OK PLEASE", 128, 41);
  const decalTexture = new THREE.CanvasTexture(decalCanvas);
  decalTexture.colorSpace = THREE.SRGBColorSpace;
  const decal = new THREE.Mesh(
    new THREE.PlaneGeometry(1.2, 0.3),
    new THREE.MeshBasicMaterial({ map: decalTexture }),
  );
  decal.position.set(0, 1.1, -1.242);
  decal.rotation.y = Math.PI;
  root.add(decal);
  const shadow = new THREE.Mesh(
    new THREE.CircleGeometry(1, 24),
    new THREE.MeshBasicMaterial({
      color: "#19342d",
      transparent: true,
      opacity: 0.22,
      depthWrite: false,
    }),
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.scale.set(1.15, 1.65, 1);
  shadow.position.y = 0.04;
  root.add(shadow);
  return { root, wheels };
}
export function trafficCar(kind: number) {
  const g = new THREE.Group();
  const palette = ["#f7c62e", "#d5683c", "#84b2a5"];
  const mat = (color: string) =>
    new THREE.MeshStandardMaterial({ color, roughness: 0.8 });
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(1.8, 0.7, 3.4),
    mat(palette[kind]),
  );
  body.position.y = 0.8;
  g.add(body);
  const roof = new THREE.Mesh(
    new THREE.BoxGeometry(1.55, 0.7, 1.9),
    mat(kind === 0 ? "#263a3e" : "#a5c9d0"),
  );
  roof.position.set(0, 1.5, -0.2);
  g.add(roof);
  for (const x of [-0.9, 0.9])
    for (const z of [-1.05, 1.05]) {
      const wheel = new THREE.Mesh(
        new THREE.CylinderGeometry(0.35, 0.35, 0.22, 8),
        mat("#263033"),
      );
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(x, 0.4, z);
      g.add(wheel);
    }
  for (const x of [-0.6, 0.6]) {
    const light = new THREE.Mesh(
      new THREE.BoxGeometry(0.32, 0.18, 0.04),
      mat("#fff1c2"),
    );
    light.position.set(x, 0.9, 1.72);
    g.add(light);
  }
  return g;
}
export function makeWorld(scene: THREE.Scene) {
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
    cylinder: new THREE.CylinderGeometry(1, 1, 1, 7),
    cone: new THREE.ConeGeometry(1, 1, 7),
    sphere: new THREE.SphereGeometry(1, 7, 5),
  };
  const dummy = new THREE.Object3D();
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
        material: new THREE.MeshStandardMaterial({ color, roughness: 0.92 }),
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
  box("#c9c5a6", 35, -0.25, 60, 690, 0.5, 1260);
  box("#decba6", -289, 0.08, 10, 34, 0.18, 1120);
  for (let z = -535; z < 572; z += 5) {
    box("#aaa890", -305, 0.65, z, 1.2, 1.3, 5);
    add("sphere", "#546d6c", -311, -0.1, z, 2, 1, 2);
  }
  for (const e of streets) {
    const g = geometry(e.id),
      mid = lanePosition(e.id, e.a, g.length / 2, 0),
      yaw = mid.yaw;
    box("#dbd0b5", mid.x, 0, mid.z, e.width + 11, 0.06, g.length + 1, yaw);
    box("#525f65", mid.x, 0.04, mid.z, e.width, 0.06, g.length + 0.2, yaw);
    if (e.oneWay) continue;
    for (let d = 23; d < g.length - 23; d += 4) {
      for (const side of [-1, 1]) {
        const p = lanePosition(e.id, e.a, d, side * (e.width / 2 + 0.15));
        box(
          Math.floor(d / 4) % 2 ? "#ead6a0" : "#323f41",
          p.x,
          0.18,
          p.z,
          0.45,
          0.32,
          3.8,
          yaw,
        );
      }
    }
    for (let d = 28; d < g.length - 28; d += 10) {
      for (const side of [-1, 1]) {
        const p = lanePosition(e.id, e.a, d, side * 5);
        box("#d8dfd2", p.x, 0.085, p.z, 0.16, 0.018, 4, yaw);
      }
      const p = lanePosition(e.id, e.a, d, 0);
      box("#dfbf63", p.x, 0.085, p.z, 0.18, 0.018, 7, yaw);
    }
  }
  for (const n of junctions)
    if (!n.ring) {
      box("#d9d0b8", n.x, 0.01, n.z, 44, 0.04, 44);
      box("#525f65", n.x, 0.075, n.z, 36, 0.06, 36);
    }
  add("cylinder", "#d4c5a2", 110, 0.2, 180, 22, 0.4, 22);
  add("cylinder", "#7e9c6b", 110, 0.42, 180, 20, 0.35, 20);
  add("cylinder", "#d3d9bf", 110, 0.8, 180, 8, 1, 8);
  add("cylinder", "#66a5a9", 110, 1.35, 180, 6, 0.2, 6);
  add("cylinder", "#c6c7a7", 110, 2, 180, 1.5, 3, 1.5);
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
      for (let offset = -10.5; offset <= 11; offset += 2.7) {
        const p = lanePosition(e.id, from, g.length - 21, offset);
        box("#ebebd6", p.x, 0.12, p.z, 1.5, 0.025, 4.8, Math.atan2(g.dx, g.dz));
      }
      const bar = lanePosition(e.id, from, g.length - 26, 6);
      box(
        "#e9e7cd",
        bar.x,
        0.12,
        bar.z,
        10,
        0.025,
        0.4,
        Math.atan2(g.dx, g.dz),
      );
      const p = lanePosition(e.id, from, g.length - 24, 14);
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
  const buildingPositions: { x: number; z: number }[] = [];
  for (const e of streets) {
    if (e.oneWay) continue;
    const g = geometry(e.id);
    for (let d = 45; d < g.length - 36; d += 31)
      for (const side of [-1, 1]) {
        const p = lanePosition(e.id, e.a, d, side * (e.width / 2 + 18));
        if (
          p.x < -242 ||
          p.x > 328 ||
          p.z > 658 ||
          roadContains(p.x, p.z, 0) ||
          buildingPositions.some(
            (b) => Math.hypot(b.x - p.x, b.z - p.z) < 20,
          ) ||
          (p.x > -225 && p.x < -115 && p.z > 0 && p.z < 140)
        )
          continue;
        buildingPositions.push(p);
        const seed = e.id * 13 + Math.floor(d) + side,
          h = 9 + (Math.abs(seed) % 6) * 4,
          c = facades[Math.abs(seed) % 6];
        box(c, p.x, h / 2, p.z, 17, h, 20, p.yaw);
        box("#eee1bf", p.x, h + 0.25, p.z, 18, 0.5, 21, p.yaw);
        for (let floor = 3.6; floor < h; floor += 3.5)
          for (const shift of [-5, 0, 5]) {
            const wx = p.x - g.dz * side * 8.6 + g.dx * shift,
              wz = p.z + g.dx * side * 8.6 + g.dz * shift;
            box("#4d7480", wx, floor, wz, 0.15, 1.65, 2.3, p.yaw);
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
        const shop = lanePosition(e.id, e.a, d, side * (e.width / 2 + 7));
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
        if ((e.id + Math.floor(d)) % 3 === 0 || p.x < -270) {
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
              "sphere",
              "#4c8458",
              p.x + g.dx * 5 + Math.cos(a) * 1.8,
              6.8,
              p.z + g.dz * 5 + Math.sin(a) * 1.8,
              3,
              0.3,
              0.9,
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
    if (o.kind === "cone") {
      box("#343f37", o.x, 0.08, o.z, 0.8, 0.12, 0.8);
      add("cone", "#e58b35", o.x, 0.55, o.z, 0.35, 1, 0.35);
    } else {
      box("#e9b82c", o.x, 0.7, o.z, 1.8, 0.8, 3.8);
      box("#2b3b3d", o.x, 1.4, o.z, 1.55, 0.7, 2);
      for (const x of [-0.9, 0.9])
        for (const z of [-1.2, 1.2])
          add(
            "cylinder",
            "#263333",
            o.x + x,
            0.35,
            o.z + z,
            0.33,
            0.22,
            0.33,
            0,
            0,
            Math.PI / 2,
          );
    }
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
  const sun = new THREE.Mesh(
    new THREE.SphereGeometry(20, 12, 8),
    new THREE.MeshBasicMaterial({ color: "#ffe7ac", fog: false }),
  );
  sun.position.set(-700, 190, -300);
  scene.add(sun);
  for (const b of batches.values()) {
    const mesh = new THREE.InstancedMesh(b.geo, b.material, b.matrices.length);
    b.matrices.forEach((m, i) => mesh.setMatrixAt(i, m));
    mesh.computeBoundingSphere();
    scene.add(mesh);
  }
  const walkers: {
    edge: number;
    side: number;
    phase: number;
    cross: number;
  }[] = [];
  for (const e of streets)
    if (!e.oneWay && geometry(e.id).length > 90)
      for (let i = 0; i < 5; i++)
        walkers.push({
          edge: e.id,
          side: i % 2 ? 1 : -1,
          phase: i * 0.2,
          cross: -1,
        });
  for (const n of junctions)
    if (n.signal)
      for (let i = 0; i < 2; i++)
        walkers.push({
          edge: 0,
          side: i % 2 ? 1 : -1,
          phase: i * 0.06,
          cross: n.id,
        });
  const people = new THREE.InstancedMesh(
    new THREE.BoxGeometry(1, 1, 1),
    new THREE.MeshStandardMaterial({ color: "#ffffff", roughness: 1 }),
    walkers.length * 8,
  );
  people.frustumCulled = false;
  scene.add(people);
  const outfits = ["#cd913c", "#568b8b", "#b26887", "#ddd2b0", "#b39a6b"];
  function personPart(
    index: number,
    x: number,
    y: number,
    z: number,
    sx: number,
    sy: number,
    sz: number,
    c: string,
    yaw = 0,
    rx = 0,
  ) {
    dummy.position.set(x, y, z);
    dummy.scale.set(sx, sy, sz);
    dummy.rotation.set(rx, yaw, 0);
    dummy.updateMatrix();
    people.setMatrixAt(index, dummy.matrix);
    people.setColorAt(index, color.set(c));
  }
  let lastPeople = -1,
    lastLights = -1;
  return {
    update(time: number) {
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
      if (Math.floor(time * 12) === lastPeople) return;
      lastPeople = Math.floor(time * 12);
      walkers.forEach((w, i) => {
        let x: number,
          z: number,
          yaw: number,
          moving = true;
        if (w.cross >= 0) {
          const p = crossingPosition(w.cross, time, w.side, w.phase * 12);
          x = p.x;
          z = p.z;
          yaw = p.yaw;
          moving = p.moving;
        } else {
          const e = streets[w.edge],
            g = geometry(e.id),
            span = g.length - 65,
            phase = ((time * 1.25) / Math.max(1, span) + w.phase) % 2,
            u = phase < 1 ? phase : 2 - phase,
            p = lanePosition(
              e.id,
              e.a,
              32 + u * span,
              w.side * (e.width / 2 + 3.6),
            );
          x = p.x;
          z = p.z;
          yaw = p.yaw + (phase >= 1 ? Math.PI : 0);
        }
        const base = i * 8,
          swing = moving ? Math.sin(time * 6 + i) * 0.35 : 0,
          c = outfits[i % outfits.length],
          dx = Math.cos(yaw),
          dz = -Math.sin(yaw);
        personPart(base, x, 1.35, z, 0.55, 0.75, 0.35, c, yaw);
        personPart(base + 1, x, 1.98, z, 0.4, 0.42, 0.4, "#bc885c", yaw);
        personPart(base + 2, x, 2.22, z, 0.43, 0.12, 0.43, "#38352e", yaw);
        for (const side of [-1, 1]) {
          personPart(
            base + 3 + (side === 1 ? 1 : 0),
            x + dx * side * 0.16,
            0.65,
            z + dz * side * 0.16,
            0.22,
            0.65,
            0.26,
            "#3c4c5a",
            yaw,
            swing * side,
          );
          personPart(
            base + 5 + (side === 1 ? 1 : 0),
            x + dx * side * 0.38,
            1.3,
            z + dz * side * 0.38,
            0.18,
            0.6,
            0.23,
            c,
            yaw,
            -swing * side,
          );
        }
        personPart(
          base + 7,
          x + Math.sin(yaw) * 0.22,
          2.01,
          z + Math.cos(yaw) * 0.22,
          0.22,
          0.045,
          0.02,
          "#29372e",
          yaw,
        );
      });
      people.instanceMatrix.needsUpdate = true;
      if (people.instanceColor) people.instanceColor.needsUpdate = true;
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
      new THREE.BoxGeometry(w, h, d),
      new THREE.MeshStandardMaterial({ color: c, roughness: 0.8 }),
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

export function trafficVisuals(scene: THREE.Scene, traffic: Traffic[]) {
  const batches: { mesh: THREE.InstancedMesh; ids: number[] }[] = [];
  const transform = new THREE.Object3D();
  for (let kind = 0; kind < 6; kind++) {
    const ids = traffic
      .map((t, i) => (t.kind === kind ? i : -1))
      .filter((i) => i >= 0);
    if (!ids.length) continue;
    let model: THREE.Group;
    if (kind === 4) model = autoRickshaw().root;
    else if (kind === 5) {
      model = scooterModel();
    } else {
      model = trafficCar(kind % 3);
      if (kind === 3) {
        model.scale.set(1.2, 1.7, 1.9);
        model.traverse((o) => {
          if (
            o instanceof THREE.Mesh &&
            o.material instanceof THREE.MeshStandardMaterial &&
            o.material.color.getHexString() === "f7c62e"
          )
            o.material.color.set("#b94e3c");
        });
      }
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
      const key = mat.color.getHexString();
      if (!groups.has(key))
        groups.set(key, { geos: [], material: mat.clone() });
      groups
        .get(key)!
        .geos.push(o.geometry.clone().applyMatrix4(o.matrixWorld));
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
      scene.add(mesh);
      batches.push({ mesh, ids });
    }
    originalGeos.forEach((g) => g.dispose());
    originalMats.forEach((m) => {
      const map = (m as THREE.MeshStandardMaterial).map;
      map?.dispose();
      m.dispose();
    });
  }
  return () => {
    for (const b of batches) {
      b.ids.forEach((id, i) => {
        const t = traffic[id];
        transform.position.set(t.x, 0, t.z);
        transform.rotation.set(0, t.yaw, 0);
        transform.scale.set(1, 1, 1);
        transform.updateMatrix();
        b.mesh.setMatrixAt(i, transform.matrix);
      });
      b.mesh.instanceMatrix.needsUpdate = true;
    }
  };
}
