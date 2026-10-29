import { geometry, lanePosition, streets, type Point } from "./network.ts";
import { sweptPersonContact } from "./pedestrian-rules.ts";

export function coneLocations(): Point[] {
  const points: Point[] = [
    { x: 55, z: -29.5 },
    { x: 59, z: -29.5 },
    { x: 63, z: -29.5 },
  ];
  // Small roadside work zones, rather than a continuous barrier or blocked junction.
  for (const street of streets) {
    if (
      street.oneWay ||
      street.id % 7 !== 0 ||
      geometry(street.id).length < 120
    )
      continue;
    for (let i = 0; i < 4; i++)
      points.push(
        lanePosition(
          street.id,
          street.a,
          geometry(street.id).length * 0.45 + i * 3,
          street.width / 2 - 1.4,
        ),
      );
  }
  return points;
}
export type Cone = Point & {
  y: number;
  vx: number;
  vz: number;
  vy: number;
  tilt: number;
  yaw: number;
  spin: number;
  hit: boolean;
  armed: boolean;
};
export function createCones(locations = coneLocations()) {
  const cones: Cone[] = [];
  function reset() {
    cones.splice(
      0,
      cones.length,
      ...locations.map((p) => ({
        ...p,
        y: 0.55,
        vx: 0,
        vz: 0,
        vy: 0,
        tilt: 0,
        yaw: 0,
        spin: 0,
        hit: false,
        armed: true,
      })),
    );
  }
  reset();
  return {
    cones,
    reset,
    step(
      before: Point,
      after: Point & { yaw: number },
      speed: number,
      dt: number,
      heightAt: (x: number, z: number) => number = () => 0,
    ) {
      for (const c of cones) {
        const distance = Math.hypot(c.x - after.x, c.z - after.z);
        if (distance > 3) c.armed = true;
        if (
          c.armed &&
          c.y < 1.5 &&
          Math.abs(speed) > 0.25 &&
          sweptPersonContact(before, after, after.yaw, c, c)
        ) {
          const forward = Math.sign(speed),
            strength = Math.min(18, Math.abs(speed));
          const dx = Math.sin(after.yaw) * forward,
            dz = Math.cos(after.yaw) * forward;
          const side =
            (c.x - after.x) * Math.cos(after.yaw) -
              (c.z - after.z) * Math.sin(after.yaw) >=
            0
              ? 1
              : -1;
          c.vx =
            dx * (0.35 + strength * 0.28) + Math.cos(after.yaw) * side * 0.45;
          c.vz =
            dz * (0.35 + strength * 0.28) - Math.sin(after.yaw) * side * 0.45;
          c.vy = 0.35 + strength * 0.14;
          c.yaw = Math.atan2(c.vx, c.vz);
          c.spin = 2.5 + strength * 0.35;
          c.hit = true;
          c.armed = false;
        }
        if (!c.hit) {
          c.y = heightAt(c.x, c.z) + 0.55;
          continue;
        }
        c.x += c.vx * dt;
        c.z += c.vz * dt;
        c.vy -= 9.81 * dt;
        c.y += c.vy * dt;
        c.tilt += c.spin * dt;
        const floor = heightAt(c.x, c.z) + 0.42;
        if (c.y <= floor) {
          c.y = floor;
          c.vy = c.vy < -1.5 ? -c.vy * 0.2 : 0;
          const friction = Math.exp(-5 * dt);
          c.vx *= friction;
          c.vz *= friction;
          c.spin *= friction;
          // Settle on the side after the airborne tumble, with no upright snap.
          const resting =
            Math.round((c.tilt - Math.PI / 2) / (Math.PI * 2)) * Math.PI * 2 +
            Math.PI / 2;
          c.tilt += (resting - c.tilt) * (1 - Math.exp(-9 * dt));
          if (Math.hypot(c.vx, c.vz) < 0.02) {
            c.vx = c.vz = c.spin = 0;
          }
        }
      }
    },
  };
}
