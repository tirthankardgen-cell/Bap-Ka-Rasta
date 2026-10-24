import * as THREE from "three";
import { road, RX, RZ, TAU } from "./simulation";

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
  function ring(inner: number, outer: number, color: string, y: number) {
    const positions: number[] = [],
      indices: number[] = [];
    for (let i = 0; i <= 512; i++) {
      const a = (i / 512) * TAU;
      for (const offset of [inner, outer]) {
        const p = road(a, offset);
        positions.push(p.x, y, p.z);
      }
      if (i < 512) {
        const j = i * 2;
        indices.push(j, j + 2, j + 1, j + 1, j + 2, j + 3);
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    g.setIndex(indices);
    g.computeVertexNormals();
    scene.add(
      new THREE.Mesh(
        g,
        new THREE.MeshStandardMaterial({
          color,
          roughness: 1,
          side: THREE.DoubleSide,
        }),
      ),
    );
  }
  // A warm sun and distant pale clouds keep the low-poly horizon readable.
  const sunDisk = new THREE.Mesh(
    new THREE.SphereGeometry(17, 16, 12),
    new THREE.MeshBasicMaterial({ color: "#ffe5aa", fog: false }),
  );
  sunDisk.position.set(650, 210, 650);
  scene.add(sunDisk);
  for (let i = 0; i < 20; i++) {
    const a = (i / 20) * TAU;
    add(
      "sphere",
      "#e6e4d2",
      Math.cos(a) * 700,
      85 + (i % 4) * 15,
      Math.sin(a) * 700,
      65,
      8,
      20,
    );
  }
  const sea = new THREE.Mesh(
    new THREE.PlaneGeometry(2600, 2200),
    new THREE.MeshStandardMaterial({ color: "#489fa9", roughness: 0.65 }),
  );
  sea.rotation.x = -Math.PI / 2;
  sea.position.y = -0.65;
  scene.add(sea);
  const land = new THREE.Mesh(
    new THREE.CircleGeometry(1, 128),
    new THREE.MeshStandardMaterial({ color: "#b2be8c", roughness: 1 }),
  );
  land.rotation.x = -Math.PI / 2;
  land.scale.set(RX, RZ, 1);
  land.position.y = -0.12;
  scene.add(land);
  ring(-11, 11, "#515c62", 0.01);
  ring(-21, -11, "#d3c9ad", 0.02);
  ring(11, 22, "#ddccaa", 0.03);
  // Sea foam and a narrow band of dark wave breakers along the promenade.
  ring(22, 24, "#ced9bd", -0.2);
  ring(24, 28, "#3a6669", -0.35);
  for (let i = 0; i < 400; i++) {
    const a = (i / 400) * TAU;
    for (const lane of [-10.7, 10.7]) {
      const p = road(a, lane);
      box(i % 2 ? "#f4e5af" : "#273b3d", p.x, 0.15, p.z, 0.42, 0.3, 5.3, p.yaw);
    }
    const p = road(a, 21);
    box("#aaac96", p.x, 0.58, p.z, 0.7, 1.1, 5.5, p.yaw);
    if (i % 2 === 0) {
      const dash = road(a, 0);
      box("#f7e6aa", dash.x, 0.035, dash.z, 0.18, 0.02, 3.5, dash.yaw);
    }
  }
  // Start/finish painted checks, safely on the roadway.
  for (let x = -9; x < 10; x++)
    for (let z = 0; z < 2; z++) {
      const p = road(0, x);
      box((x + z) % 2 ? "#e7e9df" : "#39454b", p.x, 0.045, p.z + z, 1, 0.02, 1);
    }
  function textSign(
    text: string,
    x: number,
    y: number,
    z: number,
    angle: number,
    width = 6,
    bg = "#174b4e",
  ) {
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 128;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, 512, 128);
    ctx.fillStyle = "#fff3ce";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "bold 42px sans-serif";
    ctx.fillText(text, 256, 66, 480);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    const sign = new THREE.Mesh(
      new THREE.PlaneGeometry(width, width / 4),
      new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide }),
    );
    sign.position.set(x, y, z);
    sign.rotation.y = angle;
    scene.add(sign);
    if (width >= 6)
      for (const side of [-1, 1])
        add(
          "cylinder",
          "#42544b",
          x + Math.cos(angle) * side * width * 0.34,
          y / 2,
          z - Math.sin(angle) * side * width * 0.34,
          0.075,
          y,
          0.075,
        );
  }
  const shopColors = [
    "#e0b082",
    "#cc8364",
    "#b9cab3",
    "#e8d8a4",
    "#9bbac0",
    "#d0ad94",
  ];
  for (let i = 0; i < 112; i++) {
    const a = (i / 112) * TAU;
    const p = road(a, -36 - (i % 3) * 5),
      h = 9 + ((i * 17) % 27),
      width = 10 + (i % 3) * 3;
    box(shopColors[i % 6], p.x, h / 2, p.z, width, h, 13, p.yaw);
    box("#eadbb9", p.x, h + 0.3, p.z, width + 1, 0.6, 14, p.yaw);
    for (let floor = 3; floor < h - 1; floor += 3.2)
      for (const side of [-1, 1]) {
        const wx = p.x + p.nx * 6.6 + Math.sin(p.yaw) * side * 3,
          wz = p.z + p.nz * 6.6 + Math.cos(p.yaw) * side * 3;
        box("#426b76", wx, floor, wz, 0.12, 1.6, 2, p.yaw);
      }
    if (i % 7 === 0) {
      const q = road(a, -23);
      box("#b9784b", q.x, 1.3, q.z, 4, 2.6, 3, p.yaw);
      box(i % 2 ? "#e4a133" : "#498b80", q.x, 2.9, q.z, 5, 0.4, 4, p.yaw);
      textSign(
        ["CHAI & CHILL", "VADA PAV", "PAPA KI WORKSHOP", "METER DOWN"][i % 4],
        q.x + q.nx * 1.6,
        2.5,
        q.z + q.nz * 1.6,
        Math.atan2(q.nx, q.nz),
        4,
      );
    }
  }
  // Inland skyline: shared boxes, not hundreds of independent draw calls.
  for (let i = 0; i < 115; i++) {
    const a = i * 2.39996,
      r = 0.35 + (i % 13) / 22;
    const x = Math.cos(a) * RX * r,
      z = Math.sin(a) * RZ * r;
    const h = 18 + ((i * 19) % 62);
    box(
      ["#a6b8b6", "#c5c4b3", "#8da7b1"][i % 3],
      x,
      h / 2,
      z,
      12 + (i % 4) * 4,
      h,
      14,
    );
    for (let y = 5; y < h; y += 5)
      box("#71939d", x, y, z + 7.06, 10, 0.65, 0.1);
  }
  for (let i = 0; i < 90; i++) {
    const a = (i / 90) * TAU;
    const p = road(a, i % 2 ? 16 : -16);
    add("cylinder", "#79654d", p.x, 3.5, p.z, 0.2, 7, 0.2);
    for (let leaf = 0; leaf < 5; leaf++) {
      const angle = (leaf * TAU) / 5;
      add(
        "sphere",
        "#51845a",
        p.x + Math.cos(angle) * 1.8,
        7.2,
        p.z + Math.sin(angle) * 1.8,
        3,
        0.27,
        0.8,
        0,
        -angle,
        0.15,
      );
    }
    const lamp = road(a + 0.018, 18.5);
    add("cylinder", "#344749", lamp.x, 3, lamp.z, 0.09, 6, 0.09);
    box("#f4d896", lamp.x, 6.15, lamp.z, 0.65, 0.4, 0.65);
    if (i % 3 === 0) {
      const bench = road(a + 0.025, 15);
      box("#916c48", bench.x, 0.6, bench.z, 1, 0.2, 3, bench.yaw);
      box(
        "#916c48",
        bench.x + bench.nx * 0.5,
        1,
        bench.z + bench.nz * 0.5,
        0.15,
        0.8,
        3,
        bench.yaw,
      );
    }
  }
  // Blocky pedestrians remain behind the curb, out of driving/collision lanes.
  for (let i = 0; i < 100; i++) {
    const p = road((i / 100) * TAU + 0.004, i % 2 ? 14 : -15);
    const clothing = ["#d69443", "#4e858d", "#ad637b", "#e3ce9c"][i % 4];
    box(clothing, p.x, 1.3, p.z, 0.55, 0.7, 0.35, p.yaw);
    box("#b8875b", p.x, 1.94, p.z, 0.4, 0.45, 0.4, p.yaw);
    box("#3d3931", p.x, 2.17, p.z, 0.42, 0.12, 0.42, p.yaw);
    for (const side of [-1, 1])
      box(
        "#283831",
        p.x + Math.cos(p.yaw) * side * 0.09 + Math.sin(p.yaw) * 0.21,
        1.98,
        p.z - Math.sin(p.yaw) * side * 0.09 + Math.cos(p.yaw) * 0.21,
        0.05,
        0.05,
        0.035,
        p.yaw,
      );
    for (const side of [-1, 1]) {
      box("#344a58", p.x + side * 0.17, 0.65, p.z, 0.22, 0.65, 0.25);
      box(clothing, p.x + side * 0.39, 1.28, p.z, 0.2, 0.6, 0.25);
    }
  }
  // Gateway-inspired arch on a stone pier beside the sea-facing start area.
  const gate = road(0.09, 42);
  box("#d9c7a0", gate.x, 0.05, gate.z, 30, 0.8, 28);
  const arch = new THREE.Shape();
  arch.moveTo(-7, 0);
  arch.lineTo(-7, 16);
  arch.lineTo(7, 16);
  arch.lineTo(7, 0);
  arch.lineTo(-7, 0);
  const opening = new THREE.Path();
  opening.moveTo(-3.1, 0);
  opening.lineTo(3.1, 0);
  opening.lineTo(3.1, 8);
  opening.quadraticCurveTo(0, 13, -3.1, 8);
  opening.lineTo(-3.1, 0);
  arch.holes.push(opening);
  const archMesh = new THREE.Mesh(
    new THREE.ExtrudeGeometry(arch, { depth: 4, bevelEnabled: false }),
    new THREE.MeshStandardMaterial({ color: "#d3af78" }),
  );
  archMesh.position.set(gate.x, 0.5, gate.z);
  archMesh.rotation.y = -Math.PI / 2;
  scene.add(archMesh);
  for (const side of [-1, 1]) {
    add("cylinder", "#c6a372", gate.x - 2, 9, gate.z + side * 8, 2, 17, 2);
    add("sphere", "#dbbb86", gate.x - 2, 18, gate.z + side * 8, 2.1, 1.6, 2.1);
    add("cone", "#bc955c", gate.x - 2, 20, gate.z + side * 8, 0.65, 2, 0.65);
  }
  box("#dec391", gate.x - 2, 16.7, gate.z, 5, 1.2, 19);
  const start = road(0.018, -13);
  textSign("MARINE DRIVE  →", start.x, 3.2, start.z, start.yaw + Math.PI, 7);
  const welcome = road(-0.018, 14);
  textSign(
    "BAP KA RASTA",
    welcome.x,
    3,
    welcome.z,
    welcome.yaw + Math.PI,
    7,
    "#b0782d",
  );
  for (let i = 0; i < 18; i++) {
    const a = (i / 18) * TAU,
      p = road(a, 110 + (i % 4) * 20);
    box("#e8e5cd", p.x, 0.2, p.z, 2, 0.6, 5, p.yaw);
    add("cone", "#faf1d6", p.x, 3, p.z, 1.8, 5, 0.15, 0, p.yaw);
  }
  for (const batch of batches.values()) {
    const mesh = new THREE.InstancedMesh(
      batch.geo,
      batch.material,
      batch.matrices.length,
    );
    batch.matrices.forEach((matrix, i) => mesh.setMatrixAt(i, matrix));
    mesh.castShadow = false;
    mesh.receiveShadow = true;
    mesh.computeBoundingSphere();
    scene.add(mesh);
  }
}
