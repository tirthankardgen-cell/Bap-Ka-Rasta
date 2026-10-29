import { actorPose, type Actor } from "./characters.ts";
export type CrowdPose = ReturnType<typeof actorPose>;
export const PERSONAL_SPACE = 1.08;
type Hold = (
  actor: Actor,
  time: number,
) => { x: number; z: number } | undefined;
/** Shared 20 Hz pedestrian positions for rendering and vehicle hit detection. */
export function createCrowdMotion(
  actors: Actor[],
  hold: Hold = () => undefined,
) {
  let last = -Infinity;
  let current: CrowdPose[] = [];
  const gridSize = 2;
  const keyFor = (x: number, z: number) => x * 65536 + z;
  function resolve(poses: CrowdPose[], fixed: boolean[]) {
    for (let pass = 0; pass < 8; pass++) {
      const grid = new Map<number, number[]>();
      for (let i = 0; i < poses.length; i++) {
        const p = poses[i],
          key = keyFor(Math.floor(p.x / gridSize), Math.floor(p.z / gridSize));
        const bucket = grid.get(key);
        if (bucket) bucket.push(i);
        else grid.set(key, [i]);
      }
      let changed = false;
      for (let i = 0; i < poses.length; i++) {
        const p = poses[i],
          gx = Math.floor(p.x / gridSize),
          gz = Math.floor(p.z / gridSize);
        for (let x = gx - 1; x <= gx + 1; x++)
          for (let z = gz - 1; z <= gz + 1; z++)
            for (const j of grid.get(keyFor(x, z)) ?? []) {
              if (j <= i || (fixed[i] && fixed[j])) continue;
              const q = poses[j],
                dx = q.x - p.x,
                dz = q.z - p.z,
                d = Math.hypot(dx, dz);
              if (d >= PERSONAL_SPACE - 0.001) continue;
              const angle =
                ((actors[i].id * 17 + actors[j].id * 31) % 628) / 100;
              const nx = d > 0.0001 ? dx / d : Math.cos(angle),
                nz = d > 0.0001 ? dz / d : Math.sin(angle);
              const push = PERSONAL_SPACE - d;
              const share = fixed[i] ? 0 : fixed[j] ? 1 : 0.5;
              p.x -= nx * push * share;
              p.z -= nz * push * share;
              q.x += nx * push * (1 - share);
              q.z += nz * push * (1 - share);
              changed = true;
            }
      }
      if (!changed) break;
    }
  }
  function tick(time: number, dt: number, reset: boolean) {
    const desired = actors.map((a) => actorPose(a, time));
    const fixed = actors.map((a) => !!a.home || !!hold(a, time));
    const neighbours = new Map<number, number[]>();
    if (!reset)
      current.forEach((p, i) => {
        const key = keyFor(Math.floor(p.x / 2), Math.floor(p.z / 2));
        const bucket = neighbours.get(key);
        if (bucket) bucket.push(i);
        else neighbours.set(key, [i]);
      });
    const next = desired.map((goal, i) => {
      const stopped = hold(actors[i], time);
      if (stopped) return { ...goal, ...stopped, moving: false };
      if (reset || fixed[i]) return { ...goal };
      const old = current[i],
        dx = goal.x - old.x,
        dz = goal.z - old.z,
        d = Math.hypot(dx, dz);
      const step = Math.min(d, 2.1 * dt);
      let vx = d ? (dx / d) * step : 0,
        vz = d ? (dz / d) * step : 0;
      if (d > 0.02) {
        const ux = dx / d,
          uz = dz / d,
          gx = Math.floor(old.x / 2),
          gz = Math.floor(old.z / 2);
        let blocked = false;
        for (let x = gx - 1; x <= gx + 1; x++)
          for (let z = gz - 1; z <= gz + 1; z++)
            for (const j of neighbours.get(keyFor(x, z)) ?? []) {
              if (j === i) continue;
              const px = current[j].x - old.x,
                pz = current[j].z - old.z;
              const ahead = px * ux + pz * uz,
                side = Math.abs(px * uz - pz * ux);
              if (ahead > 0 && ahead < 1.8 && side < 0.8) blocked = true;
            }
        if (blocked) {
          // Each walker keeps to their right: opposing walkers choose opposite sides.
          vx = vx * 0.4 + uz * 0.8 * dt;
          vz = vz * 0.4 - ux * 0.8 * dt;
        }
      }
      return { ...goal, x: old.x + vx, z: old.z + vz };
    });
    resolve(next, fixed);
    // Face actual movement when sidestepping or waiting, rather than moonwalking.
    if (!reset)
      for (let i = 0; i < next.length; i++) {
        if (fixed[i]) continue;
        const dx = next[i].x - current[i].x,
          dz = next[i].z - current[i].z;
        if (Math.hypot(dx, dz) > 0.008) {
          next[i].yaw = Math.atan2(dx, dz);
          next[i].moving = true;
        } else next[i].moving = false;
      }
    current = next;
  }
  return {
    sample(time: number) {
      const target = Math.floor((time + 1e-7) * 20) / 20;
      if (!current.length || target < last - 1e-6 || target - last > 1) {
        tick(target, 0.05, true);
        last = target;
      } else
        while (target - last > 0.049) {
          last += 0.05;
          tick(last, 0.05, false);
        }
      return current;
    },
  };
}
