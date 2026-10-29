import test from "node:test";
import assert from "node:assert/strict";
import { coneLocations, createCones } from "../src/game/cones.ts";
import { obstacles, roadContains } from "../src/game/network.ts";

function strike(speed: number) {
  const sim = createCones([{ x: 0, z: 2 }]);
  sim.step({ x: 0, z: 0 }, { x: 0, z: 3, yaw: 0 }, speed, 1 / 60);
  let peak = 0;
  for (let i = 0; i < 300; i++) {
    sim.step({ x: 100, z: 100 }, { x: 100, z: 100, yaw: 0 }, 0, 1 / 60);
    peak = Math.max(peak, sim.cones[0].y);
  }
  return { sim, peak, travel: Math.hypot(sim.cones[0].x, sim.cones[0].z - 2) };
}
test("faster cone impacts fly further and higher, then settle on their side", () => {
  const slow = strike(1),
    fast = strike(18);
  assert.ok(slow.travel < 1);
  assert.ok(fast.travel > slow.travel * 3 && fast.travel < 8);
  assert.ok(fast.peak > slow.peak);
  for (const { sim } of [slow, fast]) {
    const c = sim.cones[0];
    assert.equal(c.y, 0.42);
    assert.equal(c.vx, 0);
    assert.equal(c.vz, 0);
    assert.ok(Math.abs(Math.cos(c.tilt)) < 0.01);
  }
});
test("swept cone contact catches fast crossings and reverse pushes backwards", () => {
  const sim = createCones([{ x: 0, z: 5 }]);
  sim.step({ x: 0, z: 0 }, { x: 0, z: 10, yaw: 0 }, 18, 1 / 60);
  assert.equal(sim.cones[0].hit, true);
  assert.ok(sim.cones[0].vz > 0);
  sim.reset();
  sim.step({ x: 0, z: 10 }, { x: 0, z: 0, yaw: 0 }, -5, 1 / 60);
  assert.ok(sim.cones[0].vz < 0);
});
test("stationary contact does not launch cones; reset restores work zones", () => {
  const sim = createCones([{ x: 0, z: 0 }]);
  sim.step({ x: 0, z: 0 }, { x: 0, z: 0, yaw: 0 }, 0, 1 / 60);
  assert.equal(sim.cones[0].hit, false);
  sim.step({ x: 0, z: -1 }, { x: 0, z: 0, yaw: 0 }, 8, 1 / 60);
  assert.equal(sim.cones[0].hit, true);
  sim.reset();
  assert.deepEqual(
    { x: sim.cones[0].x, z: sim.cones[0].z, tilt: sim.cones[0].tilt },
    { x: 0, z: 0, tilt: 0 },
  );
  assert.equal(sim.cones[0].hit, false);
});
test("work-zone cones are roadside props, not solid vehicle obstacles", () => {
  const locations = coneLocations();
  assert.ok(locations.length > 12 && locations.length < 80);
  assert.ok(locations.every((p) => roadContains(p.x, p.z)));
  assert.ok(obstacles.every((o) => o.kind !== "cone"));
});
