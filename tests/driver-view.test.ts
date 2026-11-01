import test from "node:test";
import assert from "node:assert/strict";
import { Group, PerspectiveCamera, Scene } from "three";
import { seatedDriverView } from "../src/game/intro-visuals.ts";
import { readCharacterModels } from "./helpers/character-assets.ts";
import { disposeAutoModel } from "../src/game/auto-model.ts";

test("looking around turns the head view while the actual seated body and controls stay with the vehicle", async () => {
  const models = await readCharacterModels();
  const source = models.player.get("seated")!.geometry;
  const originalIndex = source.index!.array.slice();
  const scene = new Scene(), vehicle = new Group(), camera = new PerspectiveCamera();
  scene.add(vehicle, camera);
  vehicle.position.set(12, 0, -18);
  vehicle.rotation.y = .65;
  const body = seatedDriverView(vehicle, models);
  body.visible = true;
  try {
    scene.updateMatrixWorld(true);
    const initial = body.matrixWorld.clone();
    for (const yaw of [-Math.PI, -1.5, 0, 1.5, Math.PI]) {
      for (const pitch of [-1.1, 0, 1.1]) {
        camera.rotation.set(pitch, yaw, 0, "YXZ");
        scene.updateMatrixWorld(true);
        assert.ok(body.matrixWorld.equals(initial), "the driver's torso rotated with the camera");
      }
    }
    assert.equal(body.parent, vehicle);
    vehicle.position.x += 3;
    vehicle.rotation.y += .4;
    scene.updateMatrixWorld(true);
    assert.ok(!body.matrixWorld.equals(initial), "body must follow the auto when it moves");
    assert.ok(body.matrixWorld.equals(vehicle.matrixWorld));
    const index = body.geometry.index!, position = body.geometry.getAttribute("position");
    assert.ok(index.count > 0 && index.count < source.index!.count, "only the head-facing geometry is removed");
    let leftHand = 0, rightHand = 0, feet = 0;
    for (let i = 0; i < index.count; i++) {
      const v = index.getX(i), x = position.getX(v), y = position.getY(v), z = position.getZ(v);
      assert.ok(y < 1.41, "head geometry clips the first-person camera");
      if (y > 1.14 && y < 1.26 && z > .40 && z < .53) {
        if (x > .24) rightHand++;
        if (x < -.24) leftHand++;
      }
      if (y < .59 && z > .40) feet++;
    }
    assert.ok(leftHand > 20 && rightHand > 20 && feet > 20, "seated hands and feet must remain visible at the controls");
    assert.deepEqual(source.index!.array, originalIndex, "first-person filtering changed the third-person source");
  } finally {
    body.geometry.dispose();
    disposeAutoModel(models.source);
  }
});
