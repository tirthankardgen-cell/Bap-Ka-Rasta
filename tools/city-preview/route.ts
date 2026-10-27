export type Road = {
  id: string; name?: string; nodeIds: string[]; coordinates: number[][];
  tags: { oneway?: string };
};

// Preview one continuous carriageway. Shared OSM nodes join the segments;
// coordinate sorting would incorrectly weave between opposite carriageways.
export function marineDriveRoute(roads: Road[], bounds: number[]) {
  const outgoing = new Map<string, { to: string; a: number[]; b: number[] }[]>();
  const incoming = new Set<string>();
  for (const road of roads) {
    if (road.name !== "Marine Drive" || !["yes", "1", "true", "-1"].includes(road.tags.oneway ?? "")) continue;
    const reverse = road.tags.oneway === "-1";
    for (let i = 1; i < road.nodeIds.length; i++) {
      const from = road.nodeIds[reverse ? i : i - 1], to = road.nodeIds[reverse ? i - 1 : i];
      const edge = { to, a: road.coordinates[reverse ? i : i - 1], b: road.coordinates[reverse ? i - 1 : i] };
      outgoing.set(from, [...(outgoing.get(from) ?? []), edge]);
      incoming.add(to);
    }
  }
  const inside = ([x, z]: number[]) => x > bounds[0] + 25 && x < bounds[2] - 25 && z > bounds[1] + 25 && z < bounds[3] - 25;
  const length = (points: number[][]) => points.slice(1).reduce((sum, p, i) => sum + Math.hypot(p[0] - points[i][0], p[1] - points[i][1]), 0);
  let best: number[][] = [];
  for (const start of outgoing.keys()) {
    if (incoming.has(start)) continue;
    let current = start, run: number[][] = [];
    const visited = new Set<string>();
    const finish = () => { if (length(run) > length(best)) best = run; run = []; };
    while (!visited.has(current)) {
      visited.add(current);
      const edges = outgoing.get(current);
      if (edges?.length !== 1) break;
      const edge = edges[0];
      if (!run.length && inside(edge.a)) run.push(edge.a);
      if (inside(edge.b)) run.push(edge.b); else finish();
      current = edge.to;
    }
    finish();
  }
  return best;
}
