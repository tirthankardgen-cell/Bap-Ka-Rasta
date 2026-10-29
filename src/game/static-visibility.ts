import * as THREE from "three";
type Bounds = { x: number; z: number; radius: number };
const cachedBounds = new WeakMap<THREE.Matrix4[], Bounds[]>();
function bounds(matrix: THREE.Matrix4): Bounds {
  const e = matrix.elements;
  return {
    x: e[12],
    z: e[14],
    radius:
      0.5 *
      (Math.hypot(e[0], e[2]) +
        Math.hypot(e[4], e[6]) +
        Math.hypot(e[8], e[10])),
  };
}
/** Retain large ground/road surfaces whose bounds overlap the local view. */
export function withinDrawDistance(
  matrix: THREE.Matrix4,
  x: number,
  z: number,
  distance: number,
) {
  const b = bounds(matrix);
  return Math.hypot(b.x - x, b.z - z) <= distance + b.radius;
}
export function localInstances(
  mesh: THREE.InstancedMesh,
  source: THREE.Matrix4[],
  x: number,
  z: number,
  distance: number,
) {
  // Source matrices are immutable authored instances. Cache their bounds once.
  let boxes = cachedBounds.get(source);
  if (!boxes) {
    boxes = source.map(bounds);
    cachedBounds.set(source, boxes);
  }
  let count = 0;
  for (let i = 0; i < source.length; i++) {
    const b = boxes[i],
      dx = b.x - x,
      dz = b.z - z,
      radius = distance + b.radius;
    if (dx * dx + dz * dz <= radius * radius)
      mesh.setMatrixAt(count++, source[i]);
  }
  mesh.count = count;
  mesh.visible = count > 0;
  mesh.instanceMatrix.clearUpdateRanges();
  if (count) mesh.instanceMatrix.addUpdateRange(0, count * 16);
  mesh.instanceMatrix.needsUpdate = true;
  // Compute once per neighbourhood change, not on every rendered frame.
  mesh.computeBoundingSphere();
}
