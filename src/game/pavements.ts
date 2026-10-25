import { streets, junctions, geometry, roadContains } from "./network.ts";
export const PAVEMENT_TOP = 0.42;
// Metre cells are merged into strips for rendering. Reject every cell touching
// the road union, so raised corners cannot obstruct an intersection or turn.
export function pavementLayout() {
  const candidates = new Set<string>();
  function rect(x0: number, z0: number, x1: number, z1: number) {
    for (let z = Math.floor(z0); z < Math.ceil(z1); z++)
      for (let x = Math.floor(x0); x < Math.ceil(x1); x++)
        candidates.add(`${x},${z}`);
  }
  for (const e of streets) {
    if (e.oneWay) continue;
    const g = geometry(e.id),
      side = e.width / 2 + 3.3;
    if (Math.abs(g.dx) > 0.5)
      rect(
        Math.min(g.a.x, g.b.x),
        g.a.z - side,
        Math.max(g.a.x, g.b.x),
        g.a.z + side,
      );
    else
      rect(
        g.a.x - side,
        Math.min(g.a.z, g.b.z),
        g.a.x + side,
        Math.max(g.a.z, g.b.z),
      );
  }
  for (const n of junctions)
    if (!n.ring) rect(n.x - 22, n.z - 22, n.x + 22, n.z + 22);
  const cells = new Set<string>();
  for (const key of candidates) {
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
    const [x, z] = key.split(",").map(Number);
    if (!rows.has(z)) rows.set(z, []);
    rows.get(z)!.push(x);
  }
  const strips: { x: number; z: number; width: number }[] = [];
  for (const [z, xs] of rows) {
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
  return {
    strips,
    heightAt: (x: number, z: number) =>
      cells.has(`${Math.floor(x)},${Math.floor(z)}`) ? PAVEMENT_TOP : 0,
  };
}
