import test from "node:test";
import assert from "node:assert/strict";
import { Vector3 } from "three";
import { createCameraLook, followCamera } from "../src/game/camera.ts";

for (const mode of ["driver"] as const) {
  test(`${mode} camera stays in the cabin during acceleration, turns and reverse`, () => {
    const position = new Vector3();
    const vehicle = new Vector3();
    const offset = new Vector3(0, 1.52, 0.08);
    const up = new Vector3(0, 1, 0);
    for (const dt of [1 / 120, 1 / 60, 1 / 30, 0.1]) {
      for (let frame = 0; frame < 240; frame++) {
        const yaw = frame * 0.025;
        const speed = frame < 180 ? Math.min(65 / 3.6, frame * 0.25) : -5;
        vehicle.add(
          new Vector3(Math.sin(yaw), 0, Math.cos(yaw)).multiplyScalar(
            speed * dt,
          ),
        );
        const target = offset.clone().applyAxisAngle(up, yaw).add(vehicle);
        followCamera(position, target, mode, dt);
        const local = position.clone().sub(vehicle).applyAxisAngle(up, -yaw);
        assert.ok(
          local.distanceTo(offset) < 1e-10,
          "camera left its seat offset",
        );
      }
    }
  });
}

test("third-person camera keeps smooth follow and snaps on reset or mode switch", () => {
  const position = new Vector3();
  const target = new Vector3(10, 4.4, 20);
  followCamera(position, target, "third-person", 1 / 60);
  assert.ok(position.length() > 0);
  assert.ok(position.distanceTo(target) > 0);
  followCamera(position, target, "third-person", 1 / 60, true);
  assert.deepEqual(position, target);
});

test("look-around holds while dragging, bounds pitch and eases back on release", () => {
  const look = createCameraLook();
  look.dragging = true;
  look.drag(200, -1000);
  const yaw = look.yaw;
  assert.equal(look.pitch, 1.1);
  look.update(1);
  assert.equal(look.yaw, yaw);
  look.dragging = false;
  look.update(0.1);
  assert.ok(Math.abs(look.yaw) > 0 && Math.abs(look.yaw) < Math.abs(yaw));
  for (let i = 0; i < 300; i++) look.update(1 / 60);
  assert.equal(look.yaw, 0);
  assert.equal(look.pitch, 0);
});

test("camera return follows elapsed time even at low frame rates", () => {
  const fast = createCameraLook(),
    slow = createCameraLook();
  fast.drag(100, 30);
  slow.drag(100, 30);
  for (let i = 0; i < 120; i++) fast.update(1 / 60);
  slow.update(2);
  assert.ok(Math.abs(fast.yaw - slow.yaw) < 1e-10);
  assert.ok(Math.abs(slow.yaw) < 0.002);
});
