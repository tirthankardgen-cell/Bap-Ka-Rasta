import {
  streets,
  geometry,
  lanePosition,
  roadContains,
  WORLD_BOUNDS,
} from "./network.ts";
import { boundaryBuildings } from "./boundaries.ts";

export type BuildingLot = {
  x: number;
  z: number;
  yaw: number;
  edge: number;
  distance: number;
  side: number;
  corner: boolean;
};
// Includes balconies, eaves and storefronts, not just the building centre.
export const LOT_HALF_WIDTH = 11;
export const LOT_HALF_LENGTH = 12;
type Footprint = {
  x: number;
  z: number;
  yaw: number;
  halfWidth: number;
  halfLength: number;
};
export function lotFootprint(lot: BuildingLot): Footprint {
  return { ...lot, halfWidth: LOT_HALF_WIDTH, halfLength: LOT_HALF_LENGTH };
}
export function footprintPoint(p: Footprint, x: number, z: number) {
  return {
    x: p.x + Math.cos(p.yaw) * x + Math.sin(p.yaw) * z,
    z: p.z - Math.sin(p.yaw) * x + Math.cos(p.yaw) * z,
  };
}
/** Separating-axis check keeps complete rotated buildings apart. */
export function footprintsOverlap(a: Footprint, b: Footprint) {
  const axes = (p: Footprint) => [
    { x: Math.cos(p.yaw), z: -Math.sin(p.yaw), radius: p.halfWidth },
    { x: Math.sin(p.yaw), z: Math.cos(p.yaw), radius: p.halfLength },
  ];
  const aa = axes(a),
    bb = axes(b);
  for (const axis of [...aa, ...bb]) {
    const projected = (list: typeof aa) =>
      list.reduce(
        (sum, v) => sum + Math.abs(v.x * axis.x + v.z * axis.z) * v.radius,
        0,
      );
    if (
      Math.abs((a.x - b.x) * axis.x + (a.z - b.z) * axis.z) >=
      projected(aa) + projected(bb)
    )
      return false;
  }
  return true;
}
const reserved: Footprint[] = [
  // Keep the maidan and the inhabited perimeter intact.
  { x: -170, z: 70, yaw: 0, halfWidth: 55, halfLength: 70 },
  ...boundaryBuildings.map((b) => ({
    ...b,
    halfWidth: b.width / 2 + 0.5,
    halfLength: b.depth / 2 + 0.5,
  })),
];
export function buildingLots(): BuildingLot[] {
  const lots: BuildingLot[] = [];
  const occupied = [...reserved];
  function place(
    edge: number,
    distance: number,
    side: number,
    corner: boolean,
  ) {
    const e = streets[edge];
    const p = lanePosition(edge, e.a, distance, side * (e.width / 2 + 15));
    const lot = { ...p, edge, distance, side, corner };
    const footprint = lotFootprint(lot);
    if (p.x < -242 || occupied.some((b) => footprintsOverlap(footprint, b)))
      return;
    // Sample the envelope and its pavement clearance, including the interior:
    // centre-only checks miss buildings spanning a side road or curved lane.
    for (let ix = 0; ix <= 14; ix++)
      for (let iz = 0; iz <= 14; iz++) {
        const x = -14.3 + (ix * 28.6) / 14,
          z = -15.3 + (iz * 30.6) / 14;
        const q = footprintPoint(footprint, x, z);
        if (
          q.x < WORLD_BOUNDS.minX ||
          q.x > WORLD_BOUNDS.maxX ||
          q.z < WORLD_BOUNDS.minZ ||
          q.z > WORLD_BOUNDS.maxZ ||
          roadContains(q.x, q.z, 0)
        )
          return;
      }
    lots.push(lot);
    occupied.push(footprint);
  }
  // Reserve both ends first, so mid-block rows cannot consume corner lots.
  for (const e of streets) {
    if (e.oneWay) continue;
    const g = geometry(e.id);
    for (const [node, end] of [
      [e.a, false],
      [e.b, true],
    ] as const) {
      const crossWidth = Math.max(
        ...streets
          .filter((s) => s.a === node || s.b === node)
          .map((s) => s.width),
      );
      const inset = crossWidth / 2 + 16;
      for (const side of [-1, 1])
        place(e.id, end ? g.length - inset : inset, side, true);
    }
  }
  // Densely infill the remaining frontage, including short streets.
  for (const e of streets) {
    if (e.oneWay) continue;
    const length = geometry(e.id).length;
    for (let d = 20; d < length - 18; d += 4)
      for (const side of [-1, 1]) place(e.id, d, side, false);
  }
  return lots;
}
