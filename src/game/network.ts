// Authored South Mumbai-inspired network; metres, north is -Z. Not a street-map export.
export type Point = { x: number; z: number };
export type Junction = Point & {
  id: number;
  name: string;
  signal: boolean;
  ring: boolean;
};
export type Street = {
  id: number;
  a: number;
  b: number;
  width: number;
  name: string;
  oneWay: boolean;
};
export const junctions: Junction[] = [];
export const streets: Street[] = [];
const xs = [-260, -80, 110, 290],
  zs = [-480, -260, -40, 180, 400];
const grid = new Map<string, number>();
function node(x: number, z: number, name: string, ring = false) {
  const id = junctions.length;
  junctions.push({ id, x, z, name, signal: false, ring });
  return id;
}
function link(a: number, b: number, name: string, width = 24, oneWay = false) {
  streets.push({ id: streets.length, a, b, name, width, oneWay });
}
for (let row = 0; row < 5; row++)
  for (let col = 0; col < 4; col++)
    if (!(row === 3 && col === 2))
      grid.set(
        `${col},${row}`,
        node(
          xs[col],
          zs[row],
          ["Chowpatty", "Station Quarter", "Churchgate", "Fort", "Colaba"][row],
        ),
      );
const roundIds = Array.from({ length: 8 }, (_, i) =>
  node(
    110 + Math.cos((i * Math.PI) / 4) * 34,
    180 + Math.sin((i * Math.PI) / 4) * 34,
    "Fort Circle",
    true,
  ),
);
const get = (col: number, row: number, fromCol: number, fromRow: number) =>
  col === 2 && row === 3
    ? roundIds[fromCol < 2 ? 4 : fromCol > 2 ? 0 : fromRow < 3 ? 6 : 2]
    : grid.get(`${col},${row}`)!;
for (let row = 0; row < 5; row++)
  for (let col = 0; col < 4; col++) {
    if (col < 3)
      link(
        get(col, row, col + 1, row),
        get(col + 1, row, col, row),
        [
          "Chowpatty Link",
          "Station Road",
          "Churchgate Avenue",
          "Fort Road",
          "Colaba Causeway",
        ][row],
      );
    if (row < 4)
      link(
        get(col, row, col, row + 1),
        get(col, row + 1, col, row),
        ["Marine Drive", "Maidan Avenue", "Heritage Road", "Harbour Avenue"][
          col
        ],
      );
  }
for (let i = 0; i < 8; i++)
  link(roundIds[i], roundIds[(i + 1) % 8], "Fort Circle", 12, true);
const southWest = node(-80, 620, "Colaba Market"),
  southEast = node(290, 620, "Gateway Waterfront");
link(grid.get("1,4")!, southWest, "Colaba Market Road", 20);
link(southWest, southEast, "Gateway Road", 24);
link(southEast, grid.get("3,4")!, "Harbour Avenue");
export const connections = (id: number) =>
  streets
    .filter((e) => e.a === id || (!e.oneWay && e.b === id))
    .map((e) => ({ edge: e.id, to: e.a === id ? e.b : e.a }));
for (const n of junctions) n.signal = !n.ring && connections(n.id).length >= 3;
export const SPAWN = { x: -266, z: 325, yaw: Math.PI };
export const districts = [
  { name: "Marine Drive", x: -260, z: 80 },
  { name: "Chowpatty", x: -180, z: -480 },
  { name: "Station Quarter", x: 180, z: -260 },
  { name: "Churchgate", x: -80, z: -40 },
  { name: "Fort", x: 110, z: 180 },
  { name: "Colaba", x: 0, z: 620 },
  { name: "Gateway Waterfront", x: 290, z: 600 },
];
export const obstacles = [
  { x: -249.5, z: 60, r: 1.5, kind: "parked" },
  { x: -249.5, z: 115, r: 1.5, kind: "parked" },
  { x: 55, z: -29.5, r: 0.6, kind: "cone" },
  { x: 59, z: -29.5, r: 0.6, kind: "cone" },
  { x: 63, z: -29.5, r: 0.6, kind: "cone" },
  { x: 300.5, z: 100, r: 1.5, kind: "parked" },
];
export function geometry(edge: number, from = streets[edge].a) {
  const e = streets[edge],
    a = junctions[from],
    b = junctions[e.a === from ? e.b : e.a],
    length = Math.hypot(b.x - a.x, b.z - a.z);
  return {
    a,
    b,
    length,
    dx: (b.x - a.x) / length,
    dz: (b.z - a.z) / length,
    width: e.width,
  };
}
export const margin = (length: number) => Math.min(26, length * 0.22);
export function lanePosition(
  edge: number,
  from: number,
  progress: number,
  lane: number,
) {
  const g = geometry(edge, from);
  return {
    x: g.a.x + g.dx * progress + g.dz * lane,
    z: g.a.z + g.dz * progress - g.dx * lane,
    yaw: Math.atan2(g.dx, g.dz),
  };
}
export function nearestStreet(x: number, z: number) {
  let best = {
    edge: 0,
    x: 0,
    z: 0,
    offset: 0,
    progress: 0,
    distance: Infinity,
  };
  for (const e of streets) {
    const g = geometry(e.id);
    const p = Math.max(
      0,
      Math.min(g.length, (x - g.a.x) * g.dx + (z - g.a.z) * g.dz),
    );
    const px = g.a.x + g.dx * p,
      pz = g.a.z + g.dz * p,
      d = Math.hypot(x - px, z - pz);
    if (d < best.distance)
      best = {
        edge: e.id,
        x: px,
        z: pz,
        offset: (x - px) * g.dz - (z - pz) * g.dx,
        progress: p,
        distance: d,
      };
  }
  return best;
}
// Union of road corridors and intersection aprons: turning is free, no spline constraint.
export function roadContains(x: number, z: number, r = 1) {
  if (Math.hypot(x - 110, z - 180) < 22 + r) return false;
  for (const n of junctions)
    if (!n.ring && Math.abs(x - n.x) <= 18 - r && Math.abs(z - n.z) <= 18 - r)
      return true;
  return streets.some((e) => {
    const g = geometry(e.id),
      p = (x - g.a.x) * g.dx + (z - g.a.z) * g.dz,
      o = (x - g.a.x) * g.dz - (z - g.a.z) * g.dx;
    return p >= -r && p <= g.length + r && Math.abs(o) <= e.width / 2 - r;
  });
}
export function constrainRoad(x: number, z: number) {
  if (roadContains(x, z)) return { x, z, hit: false };
  let best = { x: SPAWN.x, z: SPAWN.z, d: Infinity };
  const candidate = (px: number, pz: number) => {
    if (!roadContains(px, pz)) return;
    const d = Math.hypot(px - x, pz - z);
    if (d < best.d) best = { x: px, z: pz, d };
  };
  for (const e of streets) {
    const g = geometry(e.id),
      p = Math.max(
        0,
        Math.min(g.length, (x - g.a.x) * g.dx + (z - g.a.z) * g.dz),
      ),
      o = Math.max(
        -e.width / 2 + 1.05,
        Math.min(e.width / 2 - 1.05, (x - g.a.x) * g.dz - (z - g.a.z) * g.dx),
      );
    candidate(g.a.x + g.dx * p + g.dz * o, g.a.z + g.dz * p - g.dx * o);
  }
  for (const n of junctions)
    if (!n.ring)
      candidate(
        Math.max(n.x - 16.95, Math.min(n.x + 16.95, x)),
        Math.max(n.z - 16.95, Math.min(n.z + 16.95, z)),
      );
  return { x: best.x, z: best.z, hit: true };
}
export type Light = "green" | "amber" | "red";
export function signalPhase(id: number, time: number) {
  return (time + (id % 4) * 4) % 46;
}
export function lightFor(
  id: number,
  dx: number,
  dz: number,
  time: number,
): Light {
  if (!junctions[id].signal) return "green";
  const p = signalPhase(id, time),
    ns = Math.abs(dz) > Math.abs(dx);
  if (ns) return p < 12 ? "green" : p < 14 ? "amber" : "red";
  return p >= 15 && p < 27 ? "green" : p >= 27 && p < 29 ? "amber" : "red";
}
export function walkPhase(id: number, time: number) {
  return junctions[id].signal && signalPhase(id, time) >= 30;
}
export function streetName(x: number, z: number) {
  return streets[nearestStreet(x, z).edge].name;
}
export function crossingPosition(
  id: number,
  time: number,
  side: number,
  offset = 0,
) {
  const n = junctions[id],
    north = streets.some(
      (e) =>
        (e.a === id && junctions[e.b].z < n.z) ||
        (e.b === id && junctions[e.a].z < n.z),
    ),
    shifted = time + (id % 4) * 4,
    p = shifted % 46,
    cycle = Math.floor(shifted / 46),
    direction = side * (cycle % 2 ? -1 : 1),
    u = p >= 30 ? Math.min(1, (p - 30) / 15) : 0;
  return {
    x: n.x + (u * 30 - 15) * direction,
    z: n.z + (north ? -21 : 21) + offset,
    yaw: direction > 0 ? Math.PI / 2 : -Math.PI / 2,
    moving: p >= 30 && p < 45,
  };
}
