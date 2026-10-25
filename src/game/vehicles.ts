import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";

function kit() {
  const root = new THREE.Group(),
    materials = new Map<string, THREE.MeshStandardMaterial>();
  const mat = (color: string, finish = "paint") => {
    const key = color + finish;
    if (!materials.has(key))
      materials.set(
        key,
        new THREE.MeshStandardMaterial({
          color,
          metalness:
            finish === "chrome"
              ? 0.8
              : finish === "paint"
                ? 0.35
                : finish === "glass"
                  ? 0.45
                  : 0,
          roughness:
            finish === "chrome"
              ? 0.22
              : finish === "glass"
                ? 0.15
                : finish === "paint"
                  ? 0.32
                  : 0.85,
          envMapIntensity: finish === "glass" ? 1.5 : 1,
        }),
      );
    return materials.get(key)!;
  };
  const mesh = (
    geo: THREE.BufferGeometry,
    color: string,
    x: number,
    y: number,
    z: number,
    finish = "paint",
  ) => {
    const m = new THREE.Mesh(geo, mat(color, finish));
    m.position.set(x, y, z);
    m.castShadow = true;
    m.receiveShadow = true;
    root.add(m);
    return m;
  };
  const box = (
    w: number,
    h: number,
    d: number,
    x: number,
    y: number,
    z: number,
    color: string,
    finish = "paint",
    radius = 0.06,
  ) =>
    mesh(
      Math.min(w, h, d) < 0.18
        ? new THREE.BoxGeometry(w, h, d)
        : new RoundedBoxGeometry(
            w,
            h,
            d,
            1,
            Math.min(radius, w / 3, h / 3, d / 3),
          ),
      color,
      x,
      y,
      z,
      finish,
    );
  const human = (
    w: number,
    h: number,
    d: number,
    x: number,
    y: number,
    z: number,
    color: string,
  ) => {
    const part = mesh(new THREE.BoxGeometry(w, h, d), color, x, y, z, "fabric");
    part.userData.driver = true;
    return part;
  };
  const wheel = (x: number, z: number, r = 0.34, width = 0.22) => {
    const g = new THREE.Group();
    g.position.set(x, r, z);
    const tire = new THREE.Mesh(
      new THREE.CylinderGeometry(r, r, width, 24),
      mat("#1c2327", "rubber"),
    );
    tire.rotation.z = Math.PI / 2;
    tire.castShadow = true;
    g.add(tire);
    for (const side of [-1, 1]) {
      const rim = new THREE.Mesh(
        new THREE.CylinderGeometry(r * 0.61, r * 0.61, 0.025, 16),
        mat("#a3a9a7", "chrome"),
      );
      rim.rotation.z = Math.PI / 2;
      rim.position.x = side * (width / 2 + 0.013);
      g.add(rim);
      const hub = new THREE.Mesh(
        new THREE.CylinderGeometry(r * 0.2, r * 0.2, 0.04, 12),
        mat("#50575a", "chrome"),
      );
      hub.rotation.z = Math.PI / 2;
      hub.position.x = side * (width / 2 + 0.03);
      g.add(hub);
      for (let i = 0; i < 6; i++) {
        const a = (i * Math.PI) / 3;
        const bolt = new THREE.Mesh(
          new THREE.SphereGeometry(0.025, 6, 4),
          mat("#d5d7cc", "chrome"),
        );
        bolt.position.set(
          side * (width / 2 + 0.03),
          Math.sin(a) * r * 0.35,
          Math.cos(a) * r * 0.35,
        );
        g.add(bolt);
      }
    }
    root.add(g);
    return g;
  };
  return { root, mat, mesh, box, human, wheel };
}
function label(
  root: THREE.Group,
  text: string,
  x: number,
  y: number,
  z: number,
  w: number,
  h: number,
  front = false,
  bg = "#e7d297",
  fg = "#273436",
) {
  const c = document.createElement("canvas");
  c.width = 512;
  c.height = 128;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 512, 128);
  ctx.fillStyle = fg;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = "bold 48px sans-serif";
  ctx.fillText(text, 256, 68, 480);
  const texture = new THREE.CanvasTexture(c);
  texture.colorSpace = THREE.SRGBColorSpace;
  const m = new THREE.Mesh(
    new THREE.PlaneGeometry(w, h),
    new THREE.MeshStandardMaterial({ map: texture, roughness: 0.65 }),
  );
  m.position.set(x, y, z);
  m.rotation.y = front ? 0 : Math.PI;
  root.add(m);
}
export function autoRickshaw() {
  const k = kit(),
    { root, box, human, mesh } = k;
  box(1.55, 0.36, 2.18, 0, 0.63, -0.02, "#efb91b");
  box(1.58, 0.65, 0.18, 0, 1.07, -1.08, "#20282b", "fabric");
  box(1.62, 0.14, 0.13, 0, 1.44, -1.1, "#f4c32b");
  box(1.52, 0.55, 0.68, 0, 0.99, 0.82, "#171f23", "paint", 0.22);
  box(1.35, 0.38, 0.27, 0, 0.67, 1.12, "#232b2e", "paint", 0.12);
  // A curved fabric canopy rather than a box roof.
  const vertices: number[] = [],
    indices: number[] = [];
  for (let z = 0; z <= 4; z++)
    for (let i = 0; i <= 24; i++) {
      const a = -Math.PI / 2 + (i / 24) * Math.PI;
      vertices.push(
        Math.sin(a) * 0.83,
        1.64 + Math.cos(a) * 0.7,
        -1.12 + z * 0.5,
      );
    }
  for (let z = 0; z < 4; z++)
    for (let i = 0; i < 24; i++) {
      const n = z * 25 + i;
      indices.push(n, n + 1, n + 25, n + 1, n + 26, n + 25);
    }
  const roof = new THREE.BufferGeometry();
  roof.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
  roof.setIndex(indices);
  roof.computeVertexNormals();
  const canopy = mesh(roof, "#24292c", 0, 0, 0, "fabric");
  (canopy.material as THREE.MeshStandardMaterial).side = THREE.DoubleSide;
  canopy.userData.cabinRoof = true;
  const rear = new THREE.Shape();
  rear.moveTo(-0.81, 1.4);
  rear.lineTo(-0.81, 1.7);
  rear.quadraticCurveTo(-0.81, 2.32, 0, 2.32);
  rear.quadraticCurveTo(0.81, 2.32, 0.81, 1.7);
  rear.lineTo(0.81, 1.4);
  rear.closePath();
  const rearPanel = mesh(
    new THREE.ShapeGeometry(rear, 20),
    "#262c2d",
    0,
    0,
    -1.125,
    "fabric",
  );
  rearPanel.rotation.y = Math.PI;
  box(0.96, 0.45, 0.035, 0, 1.88, -1.151, "#1c333b", "glass", 0.12);
  box(1.05, 0.055, 0.04, 0, 1.61, -1.17, "#45504f", "rubber");
  for (const side of [-1, 1]) {
    box(0.085, 0.8, 0.08, side * 0.73, 1.83, 0.78, "#eab821", "paint");
    box(0.085, 0.72, 0.08, side * 0.76, 1.71, -0.53, "#333c3c", "chrome");
    box(0.09, 0.43, 0.55, side * 0.76, 0.95, -0.8, "#eabb22");
    box(0.13, 0.06, 1.6, side * 0.8, 0.44, -0.2, "#7d8a8b", "chrome");
    box(0.27, 0.23, 0.09, side * 0.94, 1.62, 0.69, "#26353b", "glass");
    box(0.13, 0.19, 0.035, side * 0.62, 0.9, -1.19, "#a7281c");
    box(0.19, 0.12, 0.04, side * 0.54, 1.13, 1.17, "#fff0c7");
    box(0.4, 0.18, 0.75, side * 0.73, 0.68, -0.67, "#242c2c", "rubber", 0.08);
  }
  // Reference-inspired round headlamp, front mudguard and open entry frame.
  const lamp = mesh(
    new THREE.CylinderGeometry(0.14, 0.14, 0.055, 24),
    "#fff4cd",
    0,
    1.04,
    1.185,
  );
  lamp.rotation.x = Math.PI / 2;
  (lamp.material as THREE.MeshStandardMaterial).emissive.set("#ffce74");
  (lamp.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.5;
  box(0.48, 0.16, 0.65, 0, 0.71, 1.05, "#20292b", "paint", 0.08);
  function piping(points: THREE.Vector3[], color: string) {
    const geo = new THREE.TubeGeometry(
      new THREE.CatmullRomCurve3(points),
      28,
      0.014,
      6,
      false,
    );
    const trim = new THREE.Mesh(
      geo,
      new THREE.MeshStandardMaterial({
        color,
        emissive: color,
        emissiveIntensity: 1.3,
        roughness: 0.25,
      }),
    );
    root.add(trim);
  }
  for (const side of [-1, 1]) {
    piping(
      [
        new THREE.Vector3(side * 0.8, 2.17, 0.74),
        new THREE.Vector3(side * 0.85, 1.8, 0.86),
        new THREE.Vector3(side * 0.85, 0.57, 0.72),
        new THREE.Vector3(side * 0.85, 0.44, 0.45),
        new THREE.Vector3(side * 0.85, 0.44, -0.52),
      ],
      "#73d5ec",
    );
    piping(
      [
        new THREE.Vector3(side * 0.82, 1.12, -1),
        new THREE.Vector3(side * 0.82, 1.12, -0.55),
      ],
      "#a3ed65",
    );
  }
  const upholstery = document.createElement("canvas");
  upholstery.width = 128;
  upholstery.height = 128;
  const fabric = upholstery.getContext("2d")!;
  fabric.fillStyle = "#a88c70";
  fabric.fillRect(0, 0, 128, 128);
  fabric.strokeStyle = "#5a4436";
  fabric.lineWidth = 3;
  for (let x = -128; x < 256; x += 32) {
    fabric.beginPath();
    fabric.moveTo(x, 0);
    fabric.lineTo(x + 128, 128);
    fabric.stroke();
    fabric.beginPath();
    fabric.moveTo(x, 128);
    fabric.lineTo(x + 128, 0);
    fabric.stroke();
  }
  const seatTexture = new THREE.CanvasTexture(upholstery);
  seatTexture.colorSpace = THREE.SRGBColorSpace;
  const patternedSeat = new THREE.Mesh(
    new RoundedBoxGeometry(1.22, 0.65, 0.16, 2, 0.07),
    new THREE.MeshStandardMaterial({ map: seatTexture, roughness: 0.95 }),
  );
  patternedSeat.position.set(0, 1.35, -0.82);
  root.add(patternedSeat);
  const glass = new THREE.Mesh(
    new THREE.PlaneGeometry(1.35, 0.65),
    new THREE.MeshPhysicalMaterial({
      color: "#b7d0d0",
      metalness: 0.05,
      roughness: 0.08,
      transparent: true,
      opacity: 0.22,
      side: THREE.DoubleSide,
      depthWrite: false,
    }),
  );
  glass.position.set(0, 1.83, 0.795);
  glass.rotation.x = -0.12;
  root.add(glass);
  const wiper = box(0.035, 0.43, 0.025, 0.25, 1.69, 0.84, "#253436", "rubber");
  wiper.rotation.z = -0.5;
  box(0.58, 0.2, 0.025, 0, 0.67, -1.19, "#ead28c");
  box(1.48, 0.07, 0.08, 0, 0.45, -1.18, "#aab6b4", "chrome");
  for (let i = 0; i < 5; i++)
    box(
      0.44,
      0.025,
      0.025,
      -0.38,
      1.14 - i * 0.055,
      -1.19,
      "#59615b",
      "rubber",
    );
  box(1.25, 0.18, 0.7, 0, 1, -0.55, "#6d3e26", "fabric");
  box(1.24, 0.48, 0.1, 0, 1.27, -0.96, "#9a5e37", "fabric");
  box(0.6, 0.17, 0.5, 0, 1, 0.22, "#74492f", "fabric");
  human(0.55, 0.62, 0.36, 0, 1.43, 0.18, "#ad956d");
  human(0.38, 0.4, 0.38, 0, 1.95, 0.2, "#bd8755");
  human(0.42, 0.13, 0.42, 0, 2.12, 0.2, "#ece2c9");
  human(0.18, 0.05, 0.025, 0, 1.88, 0.405, "#332e29");
  for (const side of [-1, 1]) {
    human(0.17, 0.48, 0.18, side * 0.32, 1.4, 0.34, "#ad956d").rotation.x =
      -0.55;
    human(0.16, 0.16, 0.16, side * 0.32, 1.27, 0.55, "#bd8755");
  }
  box(0.7, 0.05, 0.08, 0, 1.24, 0.65, "#2a3539", "chrome");
  const wheels = [
    k.wheel(-0.76, -0.66),
    k.wheel(0.76, -0.66),
    k.wheel(0, 1.02, 0.35, 0.24),
  ];
  label(root, "MH 01  786", 0, 0.67, -1.211, 0.54, 0.16);
  label(
    root,
    "HORN OK PLEASE",
    0,
    1.36,
    -1.211,
    1.18,
    0.13,
    false,
    "#e5ba30",
    "#303730",
  );
  return { root, wheels };
}
export function trafficCar(kind: number) {
  const k = kit(),
    { root, box, mesh } = k;
  if (kind === 3) {
    box(2.2, 1.95, 6.7, 0, 1.44, 0, "#b44732", "paint", 0.18);
    box(2.24, 0.24, 6.6, 0, 2.48, 0, "#d9d2b6", "paint", 0.12);
    for (const side of [-1, 1])
      for (let z = -2.5; z < 2.8; z += 0.87) {
        box(0.035, 0.8, 0.7, side * 1.115, 1.94, z, "#34515b", "glass", 0.07);
        box(0.04, 0.035, 0.7, side * 1.14, 1.56, z, "#9ba8a1", "chrome");
      }
    box(1.9, 0.85, 0.035, 0, 1.95, 3.37, "#365864", "glass", 0.1);
    box(1.8, 0.5, 0.035, 0, 1.96, -3.37, "#365864", "glass");
    for (const x of [-0.85, 0.85]) {
      box(0.35, 0.15, 0.04, x, 0.95, 3.38, "#f6e6bd");
      box(0.2, 0.25, 0.04, x, 0.9, -3.38, "#a52721");
    }
    box(2.05, 0.15, 0.15, 0, 0.65, 3.4, "#77847f", "chrome");
    for (const x of [-1.06, 1.06])
      for (const z of [-2.2, 2.2]) k.wheel(x, z, 0.45, 0.26);
    return root;
  }
  const palette = ["#e6bd33", "#e6e4db", "#5c838a"],
    paint = palette[kind % 3];
  box(1.82, 0.52, 3.85, 0, 0.78, 0, paint, "paint", 0.17);
  box(1.7, 0.27, 1.1, 0, 1.07, 1.26, paint, "paint", 0.13);
  box(1.7, 0.22, 0.7, 0, 1.08, -1.48, paint, "paint", 0.1);
  // Sloping windscreen, side windows and curved roof, with metal pillars.
  const cabin = new THREE.BoxGeometry(1.5, 0.7, 1.95);
  const pos = cabin.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    if (pos.getY(i) > 0) {
      pos.setX(i, pos.getX(i) * 0.82);
      pos.setZ(i, pos.getZ(i) * 0.67);
    }
  }
  cabin.computeVertexNormals();
  mesh(cabin, "#304c58", 0, 1.4, -0.12, "glass");
  box(
    1.3,
    0.13,
    1.38,
    0,
    1.77,
    -0.12,
    kind === 0 ? "#263034" : paint,
    "paint",
    0.06,
  );
  for (const side of [-1, 1]) {
    box(0.07, 0.66, 0.08, side * 0.72, 1.4, -0.12, paint);
    box(0.035, 0.07, 2.35, side * 0.91, 1.08, -0.12, "#a5b0ad", "chrome");
    box(0.2, 0.04, 0.05, side * 0.925, 1, -0.55, "#a5b0ad", "chrome");
    box(0.23, 0.17, 0.14, side * 1.01, 1.25, 0.62, paint);
    box(0.37, 0.2, 0.05, side * 0.58, 0.96, 1.95, "#f5efd7");
    box(0.3, 0.17, 0.05, side * 0.62, 0.91, -1.95, "#af2f29");
  }
  box(0.7, 0.2, 0.06, 0, 0.73, 1.97, "#29353a");
  for (let i = 0; i < 4; i++)
    box(0.65, 0.018, 0.025, 0, 0.67 + i * 0.045, 2.01, "#aeb9b4", "chrome");
  box(1.65, 0.1, 0.1, 0, 0.52, 1.96, "#7c8b8e", "chrome");
  box(1.65, 0.1, 0.1, 0, 0.52, -1.96, "#7c8b8e", "chrome");
  for (const x of [-0.87, 0.87])
    for (const z of [-1.2, 1.2]) k.wheel(x, z, 0.34, 0.22);
  return root;
}
