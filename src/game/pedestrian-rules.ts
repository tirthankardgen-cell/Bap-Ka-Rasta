import { actorPose, characters, type Actor } from "./characters.ts";
import { geometry, junctions, type Point } from "./network.ts";

export const SERIOUS_IMPACT_SPEED = 20 / 3.6;
export type PedestrianHit = {
  actorId: number;
  name: string;
  role: string;
  speed: number;
  time: number;
  x: number;
  z: number;
  yaw: number;
  fatal: boolean;
  line: string;
};
export type IncidentReport = PedestrianHit & {
  street: string;
  phase: "cinematic" | "report";
  photo: string;
};
const lines = [
  "Arre bhau! Dekh ke chala, rasta tere baap ka hai kya?",
  "Aye dada! Zara sambhal ke, hum bhi chal rahe hain!",
  "Kay re! Aankhein road pe rakh, hero mat ban!",
];
/** Swept expanded vehicle rectangle: fast frames and reversing cannot tunnel through people. */
export function sweptPersonContact(
  before: Point,
  after: Point,
  yaw: number,
  p0: Point,
  p1: Point,
) {
  const local = (p: Point, v: Point) => {
    const x = p.x - v.x,
      z = p.z - v.z;
    return [
      x * Math.cos(yaw) - z * Math.sin(yaw),
      x * Math.sin(yaw) + z * Math.cos(yaw),
    ];
  };
  const a = local(p0, before),
    b = local(p1, after);
  let enter = 0,
    leave = 1;
  for (let axis = 0; axis < 2; axis++) {
    const radius = axis === 0 ? 1.15 : 1.7,
      delta = b[axis] - a[axis];
    if (Math.abs(delta) < 1e-8) {
      if (Math.abs(a[axis]) > radius) return false;
    } else {
      const t0 = (-radius - a[axis]) / delta,
        t1 = (radius - a[axis]) / delta;
      enter = Math.max(enter, Math.min(t0, t1));
      leave = Math.min(leave, Math.max(t0, t1));
      if (enter > leave) return false;
    }
  }
  return true;
}
export function createPedestrianRules(actors: Actor[]) {
  const reactions = new Map<number, PedestrianHit>();
  const bounds = actors.map((a) => {
    if (a.home)
      return {
        minX: a.home.x - 4,
        maxX: a.home.x + 4,
        minZ: a.home.z - 4,
        maxZ: a.home.z + 4,
      };
    if (a.cross >= 0) {
      const n = junctions[a.cross];
      return { minX: n.x - 35, maxX: n.x + 35, minZ: n.z - 35, maxZ: n.z + 35 };
    }
    const g = geometry(a.edge);
    return {
      minX: Math.min(g.a.x, g.b.x) - 25,
      maxX: Math.max(g.a.x, g.b.x) + 25,
      minZ: Math.min(g.a.z, g.b.z) - 25,
      maxZ: Math.max(g.a.z, g.b.z) + 25,
    };
  });
  let fatal: PedestrianHit | null = null;
  return {
    reactions,
    collide(
      before: Point,
      after: Point & { yaw: number },
      previousTime: number,
      time: number,
      speed: number,
    ) {
      if (fatal || Math.abs(speed) < 0.3) return null;
      for (let i = 0; i < actors.length; i++) {
        const a = actors[i],
          b = bounds[i],
          old = reactions.get(a.id);
        if (
          Math.max(before.x, after.x) < b.minX ||
          Math.min(before.x, after.x) > b.maxX ||
          Math.max(before.z, after.z) < b.minZ ||
          Math.min(before.z, after.z) > b.maxZ
        )
          continue;
        if (
          old &&
          time - old.time < 8 &&
          Math.abs(speed) < SERIOUS_IMPACT_SPEED
        )
          continue;
        const p0 =
          old && time - old.time < 5 ? old : actorPose(a, previousTime);
        const p1 = old && time - old.time < 5 ? old : actorPose(a, time);
        if (!sweptPersonContact(before, after, after.yaw, p0, p1)) continue;
        const c = characters[a.character];
        const hit: PedestrianHit = {
          actorId: a.id,
          name: a.named
            ? c.name
            : c.name.split(" ")[0] +
              " " +
              ["Sawant", "Shaikh", "Patil", "D'Souza", "Shinde", "More"][
                a.id % 6
              ],
          role: c.role,
          speed: Math.abs(speed) * 3.6,
          time,
          x: p1.x,
          z: p1.z,
          yaw: after.yaw + (speed < 0 ? Math.PI : 0),
          fatal: Math.abs(speed) >= SERIOUS_IMPACT_SPEED,
          line: lines[a.id % lines.length],
        };
        reactions.set(a.id, hit);
        if (hit.fatal) fatal = hit;
        return hit;
      }
      return null;
    },
  };
}
/** A small stylized knockback, then a grounded pose; no ragdoll explosions. */
export function fallPose(hit: PedestrianHit, time: number, reduced = false) {
  const u = Math.min(
    1,
    Math.max(0, (time - hit.time) / (reduced ? 0.15 : 0.9)),
  );
  return {
    x: hit.x + Math.sin(hit.yaw) * 0.55 * u,
    z: hit.z + Math.cos(hit.yaw) * 0.55 * u,
    lift: Math.sin(u * Math.PI) * 0.25 + 0.22 * u,
    tilt: (u * Math.PI) / 2,
    blood: Math.max(0, Math.min(1, (time - hit.time - 0.9) / 1.4)),
  };
}
