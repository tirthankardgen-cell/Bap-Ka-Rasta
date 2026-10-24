import { test } from "node:test";
import assert from "node:assert/strict";
import {
  newDrive,
  newTraffic,
  emptyInput,
  step,
  resetDrive,
  nearest,
  road,
  TAU,
} from "../src/game/simulation.ts";

test("acceleration is capped, brakes stop before delayed reverse", () => {
  const s = newDrive(),
    input = emptyInput();
  input.throttle = true;
  // Follow the straight tangent briefly to avoid reaching the curve's barrier.
  for (let i = 0; i < 240; i++) step(s, input, []);
  assert.ok(s.speed > 12 && s.speed <= 18.05);
  input.throttle = false;
  input.brake = true;
  let reachedStop = false;
  for (let i = 0; i < 180; i++) {
    step(s, input, []);
    if (s.speed === 0) {
      reachedStop = true;
      break;
    }
  }
  assert.ok(reachedStop);
  for (let i = 0; i < 20; i++) step(s, input, []);
  assert.ok(s.speed >= 0, "reverse must wait 0.4s");
  for (let i = 0; i < 90; i++) step(s, input, []);
  assert.ok(s.speed < 0 && s.speed >= -3.3);
});

test("stationary steering does not rotate, motion steering changes heading", () => {
  const s = newDrive(),
    input = emptyInput();
  input.left = true;
  for (let i = 0; i < 60; i++) step(s, input, []);
  assert.ok(Math.abs(s.yaw) < 1e-12);
  input.throttle = true;
  for (let i = 0; i < 60; i++) step(s, input, []);
  assert.ok(s.yaw > 0);
});

test("barriers keep the auto on the road and reduce impact speed", () => {
  const s = newDrive(),
    input = emptyInput();
  const p = road(0, 8.45);
  s.x = p.x;
  s.z = p.z;
  s.yaw = Math.PI / 2;
  s.speed = 15;
  step(s, input, []);
  assert.ok(Math.abs(nearest(s.x, s.z).offset) <= 8.501);
  assert.ok(s.speed < 5);
  assert.ok(s.impact > 0);
});

test("traffic contacts resolve overlap and slow the auto", () => {
  const s = newDrive(),
    input = emptyInput(),
    traffic = newTraffic();
  Object.assign(traffic[0], { angle: 0, lane: 4, x: s.x, z: s.z, speed: 0 });
  s.speed = 6;
  step(s, input, [traffic[0]]);
  assert.ok(Math.hypot(s.x - traffic[0].x, s.z - traffic[0].z) >= 2.64);
  assert.ok(Math.abs(s.speed) < 2);
  assert.ok(s.impact > 0);
});

test("reset avoids traffic and preserves run statistics", () => {
  const s = newDrive(),
    traffic = newTraffic();
  s.distance = 124;
  s.topSpeed = 42;
  s.laps = 1;
  s.gate = 4;
  s.speed = 10;
  Object.assign(traffic[0], { ...road(0, 4), angle: 0, lane: 4, speed: 0 });
  resetDrive(s, traffic);
  assert.ok(traffic.every((t) => Math.hypot(t.x - s.x, t.z - s.z) > 9));
  assert.equal(s.speed, 0);
  assert.equal(s.distance, 124);
  assert.equal(s.topSpeed, 42);
  assert.equal(s.laps, 1);
  assert.equal(s.gate, 4);
});

test("five-minute circuit drive remains finite and completes ordered laps", () => {
  const s = newDrive(),
    input = emptyInput();
  input.throttle = true;
  for (let i = 0; i < 60 * 300; i++) {
    const p = road(s.angle + 0.025, 4);
    const target = Math.atan2(p.x - s.x, p.z - s.z);
    const error = ((((target - s.yaw + Math.PI) % TAU) + TAU) % TAU) - Math.PI;
    input.left = error > 0.015;
    input.right = error < -0.015;
    step(s, input, []);
    assert.ok(Number.isFinite(s.x + s.z + s.yaw + s.speed));
    assert.ok(Math.abs(nearest(s.x, s.z).offset) < 8.501);
  }
  assert.ok(s.distance > 3000, `distance: ${s.distance}`);
  assert.ok(s.laps >= 1, `laps: ${s.laps}, gate: ${s.gate}`);
  assert.ok(s.topSpeed <= 65.01);
});
