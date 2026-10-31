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
  return { root, mat, mesh, box, wheel };
}
export function trafficCar(kind: number) {
  const k = kit(),
    { root, box, mesh } = k;
  if (kind === 3) {
    // Nine-metre BEST-style midi bus. Keep round, half-metre wheels grounded.
    box(2.3, 2.24, 9.2, 0, 1.81, 0, "#b44732", "paint", 0.18);
    box(2.32, 0.17, 9.2, 0, 3.015, 0, "#d9d2b6", "paint", 0.08);
    for (const side of [-1, 1])
      for (let z = -3.65; z < 4; z += 0.92) {
        box(0.035, 1.0, 0.75, side * 1.165, 2.31, z, "#34515b", "glass", 0.07);
        box(0.04, 0.035, 0.75, side * 1.19, 1.82, z, "#9ba8a1", "chrome");
      }
    box(1.95, 1.0, 0.035, 0, 2.30, 4.615, "#365864", "glass", 0.1);
    box(1.8, 0.65, 0.035, 0, 2.36, -4.615, "#365864", "glass");
    box(1.6, 0.22, 0.04, 0, 2.88, 4.625, "#29382d");
    for (const x of [-0.85, 0.85]) {
      box(0.35, 0.15, 0.04, x, 1.0, 4.635, "#f6e6bd");
      box(0.2, 0.25, 0.04, x, 1.0, -4.635, "#a52721");
    }
    box(2.22, 0.15, 0.16, 0, 0.70, 4.62, "#77847f", "chrome");
    box(2.22, 0.15, 0.16, 0, 0.70, -4.62, "#77847f", "chrome");
    for (const x of [-1.06, 1.06])
      for (const z of [-3.0, 3.0]) k.wheel(x, z, 0.50, 0.26);
    return root;
  }
  const palette = ["#e6bd33", "#e6e4db", "#5c838a"],
    paint = palette[kind % 3];
  box(1.78, 0.46, 4.12, 0, 0.68, 0, paint, "paint", 0.15);
  box(1.68, 0.24, 1.18, 0, 0.95, 1.42, paint, "paint", 0.1);
  box(1.68, 0.20, 0.78, 0, 0.94, -1.61, paint, "paint", 0.08);
  // Sloping windscreen, side windows and curved roof, with metal pillars.
  const cabin = new THREE.BoxGeometry(1.48, 0.57, 2.05);
  const pos = cabin.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    if (pos.getY(i) > 0) {
      pos.setX(i, pos.getX(i) * 0.82);
      pos.setZ(i, pos.getZ(i) * 0.67);
    }
  }
  cabin.computeVertexNormals();
  mesh(cabin, "#304c58", 0, 1.215, -0.12, "glass");
  box(
    1.3,
    0.09,
    1.38,
    0,
    1.505,
    -0.12,
    kind === 0 ? "#263034" : paint,
    "paint",
    0.06,
  );
  for (const side of [-1, 1]) {
    box(0.07, 0.54, 0.08, side * 0.71, 1.23, -0.12, paint);
    box(0.035, 0.05, 2.4, side * 0.90, 0.95, -0.12, "#a5b0ad", "chrome");
    box(0.18, 0.035, 0.05, side * 0.91, 0.88, -0.55, "#a5b0ad", "chrome");
    box(0.17, 0.14, 0.14, side * 0.94, 1.09, 0.65, paint);
    box(0.37, 0.17, 0.05, side * 0.58, 0.84, 2.08, "#f5efd7");
    box(0.3, 0.17, 0.05, side * 0.62, 0.80, -2.08, "#af2f29");
  }
  box(0.7, 0.18, 0.06, 0, 0.66, 2.09, "#29353a");
  for (let i = 0; i < 4; i++)
    box(0.65, 0.018, 0.025, 0, 0.60 + i * 0.038, 2.12, "#aeb9b4", "chrome");
  box(1.65, 0.1, 0.1, 0, 0.47, 2.075, "#7c8b8e", "chrome");
  box(1.65, 0.1, 0.1, 0, 0.47, -2.075, "#7c8b8e", "chrome");
  for (const x of [-0.83, 0.83])
    for (const z of [-1.3, 1.3]) k.wheel(x, z, 0.30, 0.20);
  return root;
}
