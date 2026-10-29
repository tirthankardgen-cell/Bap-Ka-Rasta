import test from "node:test";
import assert from "node:assert/strict";
import {
  GEARS,
  GEAR_LIMITS,
  gearedSpeed,
  enginePitch,
} from "../src/game/gears.ts";
import { newDrive } from "../src/game/simulation.ts";

test("new rides start in first and each gear gradually reaches its own limit", () => {
  assert.equal(newDrive().gear, 1);
  for (const gear of GEARS) {
    let speed = 0;
    assert.ok(gearedSpeed(speed, gear, true, 1 / 60) < 0.1);
    for (let i = 0; i < 1200; i++)
      speed = gearedSpeed(speed, gear, true, 1 / 60);
    assert.ok(Math.abs(speed * 3.6 - GEAR_LIMITS[gear]) < 0.001);
  }
});
test("downshifts slow progressively without snapping or reversing", () => {
  for (const throttle of [true, false]) {
    let speed = 65 / 3.6;
    const next = gearedSpeed(speed, 1, throttle, 1 / 60);
    assert.ok(next < speed && speed - next < 0.05);
    for (let i = 0; i < 600; i++) {
      const before = speed;
      speed = gearedSpeed(speed, 1, throttle, 1 / 60);
      assert.ok(speed >= 0 && speed <= before);
    }
    assert.ok(speed <= 12 / 3.6 + 0.001);
  }
});
test("upshifts retain momentum, releasing coasts and engine pitch falls on upshift", () => {
  const speed = 12 / 3.6;
  assert.ok(gearedSpeed(speed, 2, true, 1 / 60) - speed < 0.05);
  assert.ok(gearedSpeed(speed, 2, false, 1 / 60) < speed);
  assert.ok(enginePitch(speed, 2, true) < enginePitch(speed, 1, true));
  assert.equal(enginePitch(0, 1, false), enginePitch(0, 4, false));
  assert.ok(Number.isFinite(enginePitch(-3.3, 1, true)));
});
