import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { Box3, Mesh, Vector3 } from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import {
  autoRickshaw,
  AUTO_WHEEL_RADIUS,
  AUTO_DRIVER_EYE_HEIGHT,
  disposeAutoModel,
} from "../src/game/auto-model.ts";

test("exported auto fits the game and has grounded, independent wheel pivots", async () => {
  const file = await readFile(new URL("../public/models/mumbai-auto.glb", import.meta.url));
  const { scene } = await new GLTFLoader().parseAsync(
    file.buffer.slice(file.byteOffset, file.byteOffset + file.byteLength), "",
  );
  const { wheels, steering } = autoRickshaw(scene);
  const bounds = new Box3().setFromObject(scene);
  const size = bounds.getSize(new Vector3());
  assert.ok(Math.abs(bounds.min.y) < 0.015, "tires must meet the ground");
  assert.ok(size.x > 1.7 && size.x < 2, "width includes the mirrors");
  assert.ok(size.y > 2 && size.y < 2.2, "realistic canopy height");
  assert.ok(size.z > 2.5 && size.z < 2.9, "correct vehicle length");
  assert.ok(file.byteLength < 2_000_000, "asset download budget");
  for (const wheel of wheels) {
    const position = wheel.getWorldPosition(new Vector3());
    assert.ok(Math.abs(position.y - AUTO_WHEEL_RADIUS) < 1e-5);
    const before = new Box3().setFromObject(wheel).getCenter(new Vector3());
    wheel.rotation.x += Math.PI / 2;
    const after = new Box3().setFromObject(wheel).getCenter(new Vector3());
    assert.ok(before.distanceTo(after) < 0.005, "wheel spins around its axle, not the origin");
  }
  assert.ok(wheels[2].getWorldPosition(new Vector3()).z > .9, "front wheel points toward game +Z");
  const axle = wheels[2].getWorldPosition(new Vector3());
  steering.rotation.y = 0.4;
  wheels[2].rotation.x += 12;
  scene.updateMatrixWorld(true);
  assert.ok(wheels[2].getWorldPosition(new Vector3()).distanceTo(axle) < 1e-6,
    "steering and spinning preserve the front axle position");
  assert.equal(autoRickshaw(scene).steering, steering, "binding is idempotent");
  let driver = 0, canopy = 0, triangles = 0;
  scene.traverse((object) => {
    if (object.userData.driver) driver++;
    if (object.userData.cabinRoof) canopy++;
    if (object instanceof Mesh)
      triangles += (object.geometry.index?.count ?? object.geometry.attributes.position.count) / 3;
  });
  assert.ok(driver > 0 && canopy > 0, "interior cameras can hide driver and canopy");
  assert.ok(AUTO_DRIVER_EYE_HEIGHT > 1.36 && AUTO_DRIVER_EYE_HEIGHT < 1.85);
  assert.ok(triangles < 45_000, "hero mesh triangle budget");
  disposeAutoModel(scene);
});
