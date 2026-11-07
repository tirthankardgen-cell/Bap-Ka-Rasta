// Authored Mumbai-inspired network; metres, north is -Z. Not a street-map export.
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
  roundabout?: string;
  bend?: number;
};
export const roundabouts = [
  { id: "fort", name: "Fort Circle", x: 110, z: 180, radius: 34, width: 12, islandRadius: 22 },
  { id: "central", name: "Mumbai Chowk", x: 450, z: -40, radius: 64, width: 18, islandRadius: 50 },
  { id: "dadar", name: "Dadar Garden Circle", x: 980, z: -680, radius: 26, width: 10, islandRadius: 19 },
  { id: "cuffe", name: "Cuffe Parade Circle", x: 110, z: 860, radius: 25, width: 10, islandRadius: 18 },
] as const;
/** A clear, level centre for a future feature; roads and building lots must avoid it. */
export const CENTRAL_PLAZA = { x: 450, z: -40, radius: 20, height: 0.32 };
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
function link(a: number, b: number, name: string, width = 24, oneWay = false, roundabout?: string) {
  streets.push({ id: streets.length, a, b, name, width, oneWay, roundabout });
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
  link(roundIds[i], roundIds[(i + 1) % 8], "Fort Circle", 12, true, "fort");
const southWest = node(-80, 620, "Colaba Market"),
  southEast = node(290, 620, "Gateway Waterfront");
link(grid.get("1,4")!, southWest, "Colaba Market Road", 20);
link(southWest, southEast, "Gateway Road", 24);
link(southEast, grid.get("3,4")!, "Harbour Avenue");
// Two-way neighbourhood lanes expand the city east and north.
const neighbourhood = new Map<string, number>();
for (const x of [450, 610])
  for (const z of [-680, -480, -260, -40, 180, 400, 620])
    neighbourhood.set(`${x},${z}`, node(x, z, "Bhendi Bazaar Lanes"));
for (const x of [450, 610]) {
  const rows = [-680, -480, -260, -40, 180, 400, 620];
  for (let i = 0; i < rows.length - 1; i++)
    link(
      neighbourhood.get(`${x},${rows[i]}`)!,
      neighbourhood.get(`${x},${rows[i + 1]}`)!,
      x === 450 ? "Bazaar Galli" : "Chawl Lane",
      10,
    );
}
for (const z of [-680, -480, -260, -40, 180, 400, 620]) {
  link(
    neighbourhood.get(`450,${z}`)!,
    neighbourhood.get(`610,${z}`)!,
    "Dukaan Lane",
    10,
  );
  if (z !== -680) {
    const west = junctions.find((n) => n.x === 290 && n.z === z)!;
    link(west.id, neighbourhood.get(`450,${z}`)!, "Market Cross Lane", 10);
  }
}
let previous: number | undefined;
for (const x of [-260, -80, 110, 290]) {
  const north = node(x, -680, "Chowpatty Extension");
  link(
    north,
    junctions.find((n) => n.x === x && n.z === -480)!.id,
    "North Mumbai Link",
    x === -80 ? 10 : 24,
  );
  if (previous !== undefined) link(previous, north, "Chowpatty Backstreet", 10);
  previous = north;
}
link(previous!, neighbourhood.get("450,-680")!, "Bazaar Approach", 10);
// Side streets retain one lane each way for their entire named corridor.
for (const e of streets)
  if (
    [
      "Station Road",
      "Colaba Causeway",
      "Maidan Avenue",
      "Colaba Market Road",
    ].includes(e.name)
  )
    e.width = 10;

// Extend the existing connected network north, east and south. Every quadrant
// gets a mixture of main avenues and curved, two-lane neighbourhood streets.
const expandedXs = [-260, -80, 110, 290, 450, 610, 800, 980, 1160];
const expandedZs = [-1200, -1000, -840, -680, -480, -260, -40, 180, 400, 620, 860, 1120];
const expanded = new Map(junctions.filter(n => !n.ring).map(n => [`${n.x},${n.z}`, n.id]));
for (const z of expandedZs)
  for (const x of expandedXs) {
    if (x === 110 && z === 180) continue; // Existing Fort Circle replaces this crossing.
    const key = `${x},${z}`;
    if (!expanded.has(key)) expanded.set(key, node(x, z,
      z < -1000 ? "Juhu Quarter" : z < -680 ? "Bandra" : x > 610 ? "Dadar / Parel" : "Colaba Extension"));
  }
const hasLink = (a: number, b: number) => streets.some(s => (s.a === a && s.b === b) || (s.a === b && s.b === a));
// An added crossing must split an existing long road, not create overlapping
// parallel edges (the old Gateway Road spans the new Heritage Road junction).
for (const street of [...streets]) {
  if (street.oneWay) continue;
  const a=junctions[street.a], b=junctions[street.b];
  const dx=b.x-a.x, dz=b.z-a.z, length2=dx*dx+dz*dz;
  const middle=junctions.filter(n=>!n.ring&&n.id!==a.id&&n.id!==b.id)
    .map(n=>({n,t:((n.x-a.x)*dx+(n.z-a.z)*dz)/length2}))
    .filter(({n,t})=>t>0&&t<1&&Math.abs((n.x-a.x)*dz-(n.z-a.z)*dx)<.001)
    .sort((u,v)=>u.t-v.t);
  if(!middle.length) continue;
  const chain=[a.id,...middle.map(p=>p.n.id),b.id];
  street.b=chain[1];
  for(let i=1;i<chain.length-1;i++) link(chain[i],chain[i+1],street.name,street.width);
}
for (let row = 0; row < expandedZs.length; row++)
  for (let col = 0; col < expandedXs.length; col++) {
    const x = expandedXs[col], z = expandedZs[row];
    const a = expanded.get(`${x},${z}`);
    if (a === undefined) continue;
    if (col + 1 < expandedXs.length) {
      const b = expanded.get(`${expandedXs[col + 1]},${z}`);
      if (b !== undefined && !hasLink(a, b)) {
        const main = row % 3 === 0;
        link(a, b,
          z <= -1000 ? (main ? "Juhu Tara Road" : "Juhu Church Lane") :
          z === -840 ? "Bandra Hill Road" :
          z >= 860 ? (main ? "Cuffe Parade Road" : "Sassoon Dock Lane") :
          main ? "Dadar Link Road" : "Parel Market Lane", main ? 24 : 10);
      }
    }
    if (row + 1 < expandedZs.length) {
      const b = expanded.get(`${x},${expandedZs[row + 1]}`);
      if (b !== undefined && !hasLink(a, b)) {
        const main = col % 3 === 0;
        link(a, b,
          x === -260 ? (z < -680 ? "Bandstand Promenade" : "Marine Drive") :
          x === -80 && z < -680 ? "Pali Hill Lane" :
          x === 290 ? "S. V. Road" :
          x >= 800 ? (main ? "Eastern Avenue" : "Dadar Neighbourhood Lane") :
          z >= 620 ? "Colaba Harbour Lane" : "Chapel Road", main ? 24 : 10);
      }
    }
  }

// Reuse the old bazaar crossing's ID so there is no disconnected orphan node.
// The four approaches stop at the ring, leaving the central island unobstructed.
const centre = roundabouts[1];
for (const circle of roundabouts.slice(1)) {
const centre = circle;
const centreId = expanded.get(`${centre.x},${centre.z}`)!;
const centralIds = Array.from({ length: 8 }, (_, i) => {
  const x = centre.x + Math.cos(i * Math.PI / 4) * centre.radius;
  const z = centre.z + Math.sin(i * Math.PI / 4) * centre.radius;
  if (i === 0) {
    Object.assign(junctions[centreId], { x, z, name: centre.name, ring: true });
    return centreId;
  }
  return node(x, z, centre.name, true);
});
for (const e of streets) {
  if (e.a !== centreId && e.b !== centreId) continue;
  const other = junctions[e.a === centreId ? e.b : e.a];
  const index = Math.abs(other.x - centre.x) > Math.abs(other.z - centre.z)
    ? other.x > centre.x ? 0 : 4 : other.z > centre.z ? 2 : 6;
  if (e.a === centreId) e.a = centralIds[index]; else e.b = centralIds[index];
  e.width = centre.width;
  e.name = centre.name + " Approach";
}
for (let i = 0; i < 8; i++) link(centralIds[i], centralIds[(i + 1) % 8], centre.name, centre.width, true, centre.id);
}
for (const e of streets) {
  if (e.oneWay || e.width > 12) continue;
  // Alternating bends are present in west, north, centre, east and south;
  // endpoints and tangents stay aligned with their connected intersections.
  if (e.id % 3 !== 0 || ["Bazaar Galli", "Chawl Lane", "Dukaan Lane"].includes(e.name))
    e.bend = (e.id % 2 ? 1 : -1) * 5;
}

export const WORLD_BOUNDS = { minX: -294, maxX: 1194, minZ: -1240, maxZ: 1160 };
export function trafficLane(edge: number, preferred = 3) {
  const e = streets[edge];
  return e.oneWay
    ? 0
    : e.width <= 12
      ? e.width / 4
      : Math.min(preferred, e.width / 2 - 2);
}
export const connections = (id: number) =>
  streets
    .filter((e) => e.a === id || (!e.oneWay && e.b === id))
    .map((e) => ({ edge: e.id, to: e.a === id ? e.b : e.a }));
for (const n of junctions) n.signal = !n.ring && connections(n.id).length >= 3;
export const SPAWN = { x: -270, z: 325, yaw: Math.PI };
export const districts = [
  { name: "Marine Drive", x: -260, z: 80 },
  { name: "Chowpatty", x: -180, z: -480 },
  { name: "Station Quarter", x: 180, z: -260 },
  { name: "Churchgate", x: -80, z: -40 },
  { name: "Fort", x: 110, z: 180 },
  { name: "Colaba", x: 0, z: 620 },
  { name: "Gateway Waterfront", x: 290, z: 600 },
  { name: "Bandra / Bandstand", x: -170, z: -850 },
  { name: "Juhu Quarter", x: 110, z: -1100 },
  { name: "Dadar / Parel", x: 980, z: -120 },
  { name: "Cuffe Parade", x: 0, z: 990 },
  { name: "Mumbai Chowk", x: centre.x, z: centre.z },
];
export const obstacles = [
  { x: -249.5, z: 60, r: 1.5, kind: "parked" },
  { x: -249.5, z: 115, r: 1.5, kind: "parked" },
  { x: 300.5, z: 100, r: 1.5, kind: "parked" },
];
const curved = streets.map((street) => street.oneWay || !!street.bend);
export const isCurved = (edge: number) => curved[edge];
type Sample = Point & { distance: number };
const paths = new Map<number, Sample[]>();
const bounds = new Map<
  number,
  { minX: number; maxX: number; minZ: number; maxZ: number }
>();
export function streetPath(edge: number): Sample[] {
  if (paths.has(edge)) return paths.get(edge)!;
  const e = streets[edge],
    a = junctions[e.a],
    b = junctions[e.b];
  const chord = Math.hypot(b.x - a.x, b.z - a.z),
    steps = isCurved(edge) ? Math.ceil(chord / 2) : 1;
  const points: Sample[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    let x = a.x + (b.x - a.x) * t,
      z = a.z + (b.z - a.z) * t;
    if (e.oneWay) {
      const ring = roundabouts.find(r => r.id === e.roundabout)!;
      const angle = Math.atan2(a.z - ring.z, a.x - ring.x) + (t * Math.PI) / 4;
      x = ring.x + ring.radius * Math.cos(angle);
      z = ring.z + ring.radius * Math.sin(angle);
    } else if (isCurved(edge)) {
      const bend = e.bend! * Math.sin(Math.PI * t) ** 2;
      x += ((b.z - a.z) / chord) * bend;
      z -= ((b.x - a.x) / chord) * bend;
    }
    const last = points.at(-1);
    points.push({
      x,
      z,
      distance: last ? last.distance + Math.hypot(x - last.x, z - last.z) : 0,
    });
  }
  paths.set(edge, points);
  bounds.set(edge, {
    minX: Math.min(...points.map((p) => p.x)),
    maxX: Math.max(...points.map((p) => p.x)),
    minZ: Math.min(...points.map((p) => p.z)),
    maxZ: Math.max(...points.map((p) => p.z)),
  });
  return points;
}
type StreetGeometry = Readonly<{
  a: Junction; b: Junction; length: number; dx: number; dz: number; width: number;
}>;
// The authored network is fixed. Pavement/collision checks reuse both directions
// instead of allocating and measuring the same road millions of times at setup.
const geometries: Array<Map<number, StreetGeometry>> = [];
export function geometry(edge: number, from = streets[edge].a): StreetGeometry {
  const cached = geometries[edge]?.get(from);
  if (cached) return cached;
  const e = streets[edge],
    a = junctions[from],
    b = junctions[e.a === from ? e.b : e.a];
  const chord = Math.hypot(b.x - a.x, b.z - a.z);
  const result = {
    a,
    b,
    length: streetPath(edge).at(-1)!.distance,
    dx: (b.x - a.x) / chord,
    dz: (b.z - a.z) / chord,
    width: e.width,
  };
  (geometries[edge] ??= new Map()).set(from, result);
  return result;
}
export const margin = (length: number) => Math.min(26, length * 0.22);
export function lanePosition(
  edge: number,
  from: number,
  progress: number,
  lane: number,
) {
  const path = streetPath(edge),
    reverse = from !== streets[edge].a,
    length = path.at(-1)!.distance;
  const d = Math.max(
    0,
    Math.min(length, reverse ? length - progress : progress),
  );
  let i = 1;
  while (i < path.length - 1 && path[i].distance < d) i++;
  const a = path[i - 1],
    b = path[i],
    span = b.distance - a.distance,
    t = (d - a.distance) / span;
  const dx = ((b.x - a.x) / span) * (reverse ? -1 : 1),
    dz = ((b.z - a.z) / span) * (reverse ? -1 : 1);
  return {
    x: a.x + (b.x - a.x) * t + dz * lane,
    z: a.z + (b.z - a.z) * t - dx * lane,
    yaw: Math.atan2(dx, dz),
  };
}
function project(edge: number, x: number, z: number) {
  const path = streetPath(edge);
  let best = {
    x: 0,
    z: 0,
    progress: 0,
    offset: 0,
    distance: Infinity,
    dx: 0,
    dz: 0,
  };
  for (let i = 1; i < path.length; i++) {
    const a = path[i - 1],
      b = path[i],
      length = b.distance - a.distance,
      dx = (b.x - a.x) / length,
      dz = (b.z - a.z) / length;
    const p = Math.max(0, Math.min(length, (x - a.x) * dx + (z - a.z) * dz));
    const px = a.x + dx * p,
      pz = a.z + dz * p,
      distance = Math.hypot(x - px, z - pz);
    if (distance < best.distance)
      best = {
        x: px,
        z: pz,
        progress: a.distance + p,
        offset: (x - px) * dz - (z - pz) * dx,
        distance,
        dx,
        dz,
      };
  }
  return best;
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
    const p = project(e.id, x, z);
    if (p.distance < best.distance) best = { edge: e.id, ...p };
  }
  return best;
}
// The road union also defines pavement edges, keeping junction corners square.
export function roadContains(x: number, z: number, r = 1) {
  if (
    x < WORLD_BOUNDS.minX + r ||
    x > WORLD_BOUNDS.maxX - r ||
    z < WORLD_BOUNDS.minZ + r ||
    z > WORLD_BOUNDS.maxZ - r
  )
    return false;
  if (Math.hypot(x - 110, z - 180) < 22 + r) return false;
  return streets.some((e) => {
    if (isCurved(e.id)) {
      streetPath(e.id);
      const b = bounds.get(e.id)!,
        w = e.width / 2;
      if (x < b.minX - w || x > b.maxX + w || z < b.minZ - w || z > b.maxZ + w)
        return false;
      return project(e.id, x, z).distance <= w - r;
    }
    const g = geometry(e.id),
      p = (x - g.a.x) * g.dx + (z - g.a.z) * g.dz,
      o = (x - g.a.x) * g.dz - (z - g.a.z) * g.dx;
    return p >= -r && p <= g.length + r && Math.abs(o) <= e.width / 2 - r;
  });
}
export function constrainRoad(x: number, z: number, radius = 1) {
  if (roadContains(x, z, radius)) return { x, z, hit: false };
  let best = { x: SPAWN.x, z: SPAWN.z, d: Infinity };
  for (const e of streets) {
    const p = project(e.id, x, z),
      o = Math.max(-e.width / 2 + radius + 0.05, Math.min(e.width / 2 - radius - 0.05, p.offset));
    const px = p.x + p.dz * o,
      pz = p.z - p.dx * o,
      d = Math.hypot(px - x, pz - z);
    if (d < best.d && roadContains(px, pz, radius)) best = { x: px, z: pz, d };
  }
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
    crossingRoad = streets.find(
      (e) =>
        (e.a === id || e.b === id) &&
        Math.abs(junctions[e.a].z - junctions[e.b].z) > 1,
    ),
    span = (crossingRoad?.width ?? 24) + 6,
    shifted = time + (id % 4) * 4,
    p = shifted % 46,
    cycle = Math.floor(shifted / 46),
    direction = side * (cycle % 2 ? -1 : 1),
    u = p >= 30 ? Math.min(1, (p - 30) / 15) : 0;
  return {
    x: n.x + (u * span - span / 2) * direction,
    z: n.z + (north ? -21 : 21) + offset,
    yaw: direction > 0 ? Math.PI / 2 : -Math.PI / 2,
    moving: p >= 30 && p < 45,
  };
}
