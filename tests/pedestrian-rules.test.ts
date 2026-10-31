import test from "node:test";
import assert from "node:assert/strict";
import {
  createPedestrianRules,
  sweptPersonContact,
  SERIOUS_IMPACT_SPEED,
  fallPose,
} from "../src/game/pedestrian-rules.ts";
import type { Actor } from "../src/game/characters.ts";
const actor: Actor = {
  id: 123,
  character: 12,
  named: false,
  edge: 0,
  side: 1,
  phase: 0,
  variant: 1,
  activity: "walk",
  cross: -1,
  home: { x: 0, z: 0, yaw: 0 },
};
test("slow bumps scold once, respect cooldown, and allow a later serious collision", () => {
  const rules = createPedestrianRules([actor]);
  const hit = rules.collide(
    { x: 0, z: -2 },
    { x: 0, z: -1, yaw: 0 },
    0,
    0.1,
    2,
  )!;
  assert.ok(hit && !hit.fatal);
  assert.match(hit.line, /Laptop/, "The office commuter uses his own warning");
  assert.equal(
    rules.collide({ x: 0, z: -1 }, { x: 0, z: -0.5, yaw: 0 }, 0.1, 0.2, 2),
    null,
  );
  assert.ok(
    rules.collide(
      { x: 0, z: -1 },
      { x: 0, z: 0, yaw: 0 },
      0.2,
      0.3,
      SERIOUS_IMPACT_SPEED,
    )!.fatal,
  );
  assert.equal(
    rules.collide({ x: 0, z: -1 }, { x: 0, z: 0, yaw: 0 }, 0.3, 0.4, 15),
    null,
  );
});
test("swept contacts catch fast and reverse impacts but ignore adjacent pedestrians", () => {
  assert.ok(
    sweptPersonContact(
      { x: 0, z: -5 },
      { x: 0, z: 5 },
      0,
      { x: 0, z: 0 },
      { x: 0, z: 0 },
    ),
  );
  assert.ok(
    sweptPersonContact(
      { x: 0, z: 5 },
      { x: 0, z: -5 },
      0,
      { x: 0, z: 0 },
      { x: 0, z: 0 },
    ),
  );
  assert.equal(
    sweptPersonContact(
      { x: 0, z: -5 },
      { x: 0, z: 5 },
      0,
      { x: 2, z: 0 },
      { x: 2, z: 0 },
    ),
    false,
  );
  assert.equal(
    createPedestrianRules([actor]).collide(
      { x: 0, z: 0 },
      { x: 0, z: 0, yaw: 0 },
      0,
      0.1,
      0,
    ),
    null,
  );
});
test("fall remains short, settles on the ground, and the blood mark grows only after landing", () => {
  const hit = createPedestrianRules([actor]).collide(
    { x: 0, z: -3 },
    { x: 0, z: 0, yaw: 0 },
    0,
    0.1,
    12,
  )!;
  assert.equal(hit.actorId, 123);
  assert.ok(hit.name && hit.role && hit.speed === 43.2);
  const airborne = fallPose(hit, 0.55),
    end = fallPose(hit, 5);
  assert.ok(airborne.lift > 0 && airborne.lift < 0.5);
  assert.equal(airborne.blood, 0);
  assert.equal(end.tilt, Math.PI / 2);
  assert.ok(Math.hypot(end.x - hit.x, end.z - hit.z) <= 0.56);
  assert.equal(end.blood, 1);
  assert.deepEqual(fallPose(hit, 10), end);
  assert.equal(fallPose(hit, 0.3, true).tilt, Math.PI / 2);
});
