import {
  streets,
  junctions,
  geometry,
  roadContains,
  isCurved,
  lanePosition,
} from "./network.ts";
import { runSetupWorkSync } from "./setup-work.ts";
export const PAVEMENT_TOP = 0.42;
// Metre cells are merged into strips for rendering. Reject every cell touching
// the road union, so raised corners cannot obstruct an intersection or turn.
export function pavementLayout() {
  return runSetupWorkSync(pavementWork());
}
export function* pavementWork() {
  const candidates = new Set<string>();
  function* rect(x0: number, z0: number, x1: number, z1: number) {
    for (let z = Math.floor(z0); z < Math.ceil(z1); z++) {
      if (z % 16 === 0) yield;
      for (let x = Math.floor(x0); x < Math.ceil(x1); x++)
        candidates.add(`${x},${z}`);
    }
  }
  for (const e of streets) {
    if (isCurved(e.id)) continue;
    const g = geometry(e.id),
      side = e.width / 2 + 3.3;
    if (Math.abs(g.dx) > 0.5)
      yield* rect(
        Math.min(g.a.x, g.b.x),
        g.a.z - side,
        Math.max(g.a.x, g.b.x),
        g.a.z + side,
      );
    else
      yield* rect(
        g.a.x - side,
        Math.min(g.a.z, g.b.z),
        g.a.x + side,
        Math.max(g.a.z, g.b.z),
      );
  }
  for (const n of junctions)
    if (!n.ring) yield* rect(n.x - 22, n.z - 22, n.x + 22, n.z + 22);
  const cells = new Set<string>();
  let processed = 0;
  for (const key of candidates) {
    if (processed++ % 256 === 0) yield;
    const [x, z] = key.split(",").map(Number);
    if (
      [
        [0.001, 0.001],
        [0.999, 0.001],
        [0.001, 0.999],
        [0.999, 0.999],
      ].some(([dx, dz]) => roadContains(x + dx, z + dz, 0))
    )
      continue;
    cells.add(key);
  }
  const rows = new Map<number, number[]>();
  for (const key of cells) {
    if (processed++ % 2048 === 0) yield;
    const [x, z] = key.split(",").map(Number);
    if (!rows.has(z)) rows.set(z, []);
    rows.get(z)!.push(x);
  }
  const strips: { x: number; z: number; width: number }[] = [];
  for (const [z, xs] of rows) {
    yield;
    xs.sort((a, b) => a - b);
    let start = xs[0],
      end = start;
    for (let i = 1; i <= xs.length; i++) {
      if (xs[i] === end + 1) {
        end = xs[i];
        continue;
      }
      strips.push({
        x: (start + end + 1) / 2,
        z: z + 0.5,
        width: end - start + 1,
      });
      start = end = xs[i];
    }
  }
  // Cache curved pavement heights too: crowd updates must remain O(1), not
  // project hundreds of pedestrians onto every sampled road each frame.
  const curveCells = new Set<string>();
  for (const e of streets.filter((e) => isCurved(e.id))) {
    const length = geometry(e.id).length;
    for (let d = 0; d <= length; d += 0.5) {
      if (d % 8 === 0) yield;
      for (const side of [-1, 1])
        for (let offset = 0.25; offset < 3.3; offset += 0.5) {
          const p = lanePosition(e.id, e.a, d, side * (e.width / 2 + offset));
          const x = Math.floor(p.x),
            z = Math.floor(p.z),
            key = `${x},${z}`;
          if (!curveCells.has(key) && !roadContains(x + 0.5, z + 0.5, 0))
            curveCells.add(key);
        }
    }
  }
  return {
    strips,
    heightAt: (x: number, z: number) => {
      const key = `${Math.floor(x)},${Math.floor(z)}`;
      return cells.has(key) || curveCells.has(key) ? PAVEMENT_TOP : 0;
    },
  };
}
