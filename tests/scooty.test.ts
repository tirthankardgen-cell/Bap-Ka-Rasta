import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { Box3, Mesh, PerspectiveCamera, Vector3 } from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/addons/libs/meshopt_decoder.module.js";
import { newDrive, newTraffic, emptyInput, resetDrive, step } from "../src/game/simulation.ts";
import { vehicleContact } from "../src/game/world-scale.ts";
import { sweptPersonContact } from "../src/game/pedestrian-rules.ts";
import { createCones } from "../src/game/cones.ts";
import { createPlayerScooty } from "../src/game/scooty-model.ts";
import { prepareTrafficModels } from "../src/game/traffic-models.ts";
import { disposeAutoModel } from "../src/game/auto-model.ts";
import { readCharacterModels } from "./helpers/character-assets.ts";
import { roadContains } from "../src/game/network.ts";
import { PLAYER_VEHICLES } from "../src/game/player-vehicles.ts";

test("scooty reaches its full automatic speed without gears and retains brake priority", () => {
  const scooty = newDrive("scooty"), auto = newDrive();
  const input = { ...emptyInput(), throttle: true };
  for (let i = 0; i < 480; i++) {
    step(scooty, input, []);
    step(auto, input, []);
  }
  assert.ok(Math.abs(scooty.speed * 3.6 - 60) < 0.01);
  assert.ok(auto.speed * 3.6 <= 12.001, "auto still starts in first gear");
  assert.equal(scooty.gear, 1, "scooty did not need a hidden gear change");
  input.brake = true;
  for (let i = 0; i < 240; i++) step(scooty, input, []);
  assert.equal(scooty.speed, 0, "braking wins while both pedals are held");
  input.throttle = false;
  for (let i = 0; i < 120; i++) step(scooty, input, []);
  assert.ok(scooty.speed < 0 && scooty.speed >= -1.2, "backing up stays at walking pace");
});

test("scooty traffic, pedestrian and cone contacts use its smaller body", () => {
  const player = { x: 0, z: 0, yaw: 0 };
  const car = { x: 1.45, z: 0, yaw: 0, kind: 7 };
  assert.ok(vehicleContact(player, car));
  assert.equal(vehicleContact({ ...player, vehicle: "scooty" }, car), null);
  assert.ok(vehicleContact({ ...player, vehicle: "scooty" }, { ...car, x: 1.1 }));
  const before = { x: 0, z: -3 }, after = { ...player, z: 3 };
  const pedestrian = { x: 1, z: 0 };
  assert.ok(sweptPersonContact(before, after, 0, pedestrian, pedestrian));
  assert.equal(sweptPersonContact(before, after, 0, pedestrian, pedestrian, "scooty"), false);
  assert.ok(sweptPersonContact(before, after, 0, { x: 0.4, z: 0 }, { x: 0.4, z: 0 }, "scooty"));
  const cones = createCones([pedestrian]);
  cones.step(before, { ...after, vehicle: "scooty" }, 8, 1 / 60);
  assert.equal(cones.cones[0].hit, false, "adjacent cones should not fly away");
  cones.step(before, after, 8, 1 / 60);
  assert.equal(cones.cones[0].hit, true);
});

test("scooty reset keeps the selected ride and progress at a clear road position", () => {
  const drive = newDrive("scooty"), traffic = newTraffic();
  Object.assign(drive, { distance: 100, topSpeed: 55, speed: 12, steer: 0.8 });
  resetDrive(drive, traffic);
  assert.equal(drive.vehicle, "scooty");
  assert.equal(drive.distance, 100);
  assert.equal(drive.topSpeed, 55);
  assert.equal(drive.speed, 0);
  assert.equal(drive.steer, 0);
  assert.ok(roadContains(drive.x, drive.z, 0.55));
  assert.ok(traffic.every((t) => !vehicleContact(drive, t)));
});

test("shipped scooter and female cast form a grounded rider with separate first-person geometry", async () => {
  const file = await readFile(new URL("../public/models/gallery-traffic.glb", import.meta.url));
  const { scene } = await new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).parseAsync(
    file.buffer.slice(file.byteOffset, file.byteOffset + file.byteLength), "",
  );
  const traffic = prepareTrafficModels(scene), cast = await readCharacterModels();
  const template = traffic.vehicles.get(5)!;
  const originalBounds = new Box3().setFromObject(template);
  const originalIndices = new Map<Mesh, number[]>();
  template.traverse((o) => {
    if (o instanceof Mesh && o.userData.rider)
      originalIndices.set(o, Array.from(o.geometry.index!.array));
  });
  const player = createPlayerScooty(traffic, cast);
  try {
    assert.equal(player.root.userData.driverGender, "female");
    assert.ok(player.root.getObjectByName("Riya | female rider face and ponytail"));
    assert.ok(player.root.getObjectByName("Riya | ivory riding helmet"));
    const bounds = new Box3().setFromObject(player.root);
    assert.ok(Math.abs(bounds.min.y) < 0.01, "wheels stay grounded");
    assert.ok(bounds.max.y > 1.7 && bounds.max.y < 1.9, "seated adult fits the scooty");
    assert.equal(player.wheels.length, 2);
    for (const wheel of player.wheels) {
      const centre = wheel.getWorldPosition(new Vector3());
      player.steering.rotation.y = 0.22;
      wheel.rotation.x = 1.1;
      const next = wheel.getWorldPosition(new Vector3());
      assert.ok(centre.distanceTo(next) < 0.001, "rolling and steering retain axle centres");
    }
    const view = PLAYER_VEHICLES.scooty;
    const camera = new PerspectiveCamera(view.driverFov, 1280 / 800, 0.04, 800);
    camera.position.set(0, view.eyeHeight, view.eyeForward);
    camera.lookAt(0, view.driverLookHeight, view.lookAhead);
    camera.updateMatrixWorld(true);
    let hands = 0, visibleLeftHand = 0, visibleRightHand = 0;
    player.firstPersonBody.traverse((o) => {
      if (!(o instanceof Mesh)) return;
      const positions = o.geometry.getAttribute("position"), index = o.geometry.index!;
      const point = new Vector3();
      o.updateWorldMatrix(true, false);
      for (let i = 0; i < index.count; i++) {
        point.fromBufferAttribute(positions, index.getX(i)).applyMatrix4(o.matrixWorld);
        assert.ok(point.y < 1.48, "head must not obstruct the rider camera");
        if (Math.abs(point.x) > 0.25 && point.z > 0.35 && point.y > 1.1) {
          hands++;
          const projected = point.clone().project(camera);
          if (Math.abs(projected.x) < 0.9 && projected.y > -0.95 && projected.y < 0.9) {
            if (point.x < 0) visibleLeftHand++; else visibleRightHand++;
          }
        }
      }
    });
    assert.ok(hands > 50, "hands remain at the handlebars in first person");
    assert.ok(visibleLeftHand > 20 && visibleRightHand > 20, "default rider-eye camera must frame both hands");
    player.updateLean(0.1, 10, 1, false);
    assert.ok(player.lean.rotation.z < 0 && player.lean.rotation.z > -0.29);
    player.updateLean(0.1, 10, 1, true);
    assert.ok(Math.abs(player.lean.rotation.z) < 0.001, "reduced motion removes banking");
    for (const [mesh, indices] of originalIndices) {
      assert.deepEqual(Array.from(mesh.geometry.index!.array), indices);
      assert.equal(mesh.visible, true);
      assert.equal(mesh.userData.driver, undefined);
    }
    assert.ok(new Box3().setFromObject(template).equals(originalBounds), "player posing cannot alter traffic");
  } finally {
    disposeAutoModel(player.root);
    disposeAutoModel(scene);
    disposeAutoModel(cast.source);
  }
});
