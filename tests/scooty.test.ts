import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { Box3, Mesh, PerspectiveCamera, Vector3 } from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/addons/libs/meshopt_decoder.module.js";
import { newDrive, newTraffic, emptyInput, resetDrive, step, steeringAngleFor, STEP } from "../src/game/simulation.ts";
import { vehicleContact } from "../src/game/world-scale.ts";
import { sweptPersonContact } from "../src/game/pedestrian-rules.ts";
import { createCones } from "../src/game/cones.ts";
import { createPlayerScooty } from "../src/game/scooty-model.ts";
import { prepareTrafficModels } from "../src/game/traffic-models.ts";
import { disposeAutoModel } from "../src/game/auto-model.ts";
import { readCharacterModels } from "./helpers/character-assets.ts";
import { roadContains } from "../src/game/network.ts";
import { PLAYER_VEHICLES, SCOOTY_FOOT_LOWER_TIME } from "../src/game/player-vehicles.ts";

test("scooty reverses both steering inputs while the auto retains normal steering", () => {
  for (const direction of ["left", "right"] as const) {
    const input = { ...emptyInput(), [direction]: true };
    const auto = newDrive(), scooty = newDrive("scooty");
    const yaw = auto.yaw, expected = direction === "left" ? 1 : -1;
    for (let i = 0; i < 10; i++) {
      step(auto, input, []);
      step(scooty, input, []);
    }
    assert.equal(scooty.yaw, yaw, "stationary steering cannot rotate the scooty");
    auto.speed = scooty.speed = 6;
    step(auto, input, []);
    step(scooty, input, []);
    assert.ok((auto.yaw - yaw) * expected > 0);
    assert.ok((scooty.yaw - yaw) * expected < 0);
    assert.ok(steeringAngleFor(scooty.steer, scooty.speed, "scooty") * expected < 0,
      "front-wheel yaw follows the reversed physical turn");
  }
  const scooty = newDrive("scooty");
  step(scooty, { ...emptyInput(), left: true, right: true }, []);
  assert.equal(scooty.steer, 0, "opposite inputs cancel");
});

test("scooty brakes only after planting the feet and Space stops without reversing", () => {
  const scooty = newDrive("scooty");
  scooty.speed = 6;
  const input = { ...emptyInput(), brake: true, throttle: true };
  for (let i = 0; i < Math.floor(SCOOTY_FOOT_LOWER_TIME / STEP); i++) {
    step(scooty, input, []);
    assert.equal(scooty.speed, 6, "no acceleration or foot friction before ground contact");
    assert.ok(scooty.footBrake < 1);
  }
  step(scooty, input, []);
  assert.equal(scooty.footBrake, 1);
  assert.ok(scooty.speed < 6, "planted feet begin slowing the scooty");
  for (let i = 0; i < 90; i++) step(scooty, input, []);
  assert.equal(scooty.speed, 0);
  assert.equal(scooty.footBrake, 1, "the rider stays standing while the brake is held");
  for (let i = 0; i < 30; i++) step(scooty, emptyInput(), []);
  assert.equal(scooty.footBrake, 0, "releasing the brake restores the riding pose");
  for (const speed of [5, -1]) {
    const drive = newDrive("scooty");
    drive.speed = speed;
    for (let i = 0; i < 100; i++) step(drive, { ...emptyInput(), handbrake: true, throttle: true }, []);
    assert.equal(drive.footBrake, 1);
    assert.equal(drive.speed, 0, "Space stops in either direction and wins over throttle");
  }
  const auto = newDrive();
  step(auto, { ...emptyInput(), brake: true }, []);
  assert.equal(auto.footBrake, 0, "the auto never uses the scooty foot pose");
});

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
  Object.assign(drive, { distance: 100, topSpeed: 55, speed: 12, steer: 0.8, footBrake: 1 });
  resetDrive(drive, traffic);
  assert.equal(drive.vehicle, "scooty");
  assert.equal(drive.distance, 100);
  assert.equal(drive.topSpeed, 55);
  assert.equal(drive.speed, 0);
  assert.equal(drive.steer, 0);
  assert.equal(drive.footBrake, 0);
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
    const posedBounds = (mesh: Mesh) => {
      mesh.updateWorldMatrix(true, false);
      const result = new Box3(), point = new Vector3(), index = mesh.geometry.index;
      const count = index?.count ?? mesh.geometry.getAttribute("position").count;
      for (let i = 0; i < count; i++) {
        mesh.getVertexPosition(index ? index.getX(i) : i, point).applyMatrix4(mesh.matrixWorld);
        result.expandByPoint(point);
      }
      return result;
    };
    const head = player.root.getObjectByName("Riya | female rider face and ponytail") as Mesh;
    const seatedHead = posedBounds(head);
    const shoes: Mesh[] = [];
    player.root.traverse((o) => {
      if (o instanceof Mesh && o.userData.rider && posedBounds(o).max.y < 0.45) shoes.push(o);
    });
    assert.equal(shoes.length, 2, "third-person and rider-eye views each have their own feet");
    const seatedShoes = shoes.map(posedBounds);
    player.updateBrakePose(0.45, false);
    assert.ok(posedBounds(head).getCenter(new Vector3()).z > seatedHead.getCenter(new Vector3()).z + 0.2,
      "the rider moves toward the handlebars before lowering the feet");
    shoes.forEach((shoe, i) => {
      const feet = posedBounds(shoe);
      assert.ok(feet.min.distanceTo(seatedShoes[i].min) < 0.000001
        && feet.max.distanceTo(seatedShoes[i].max) < 0.000001, "feet stay on the boards during the rise");
    });
    player.updateBrakePose(1, false);
    shoes.forEach((shoe) => {
      const feet = posedBounds(shoe);
      assert.ok(Math.abs(feet.min.y) < 0.001, "shoe soles meet the road");
      assert.ok(feet.max.x > 0.45 && feet.min.x < -0.45, "both feet clear the scooty floor");
    });
    player.updateLean(0.2, 10, 1, false, 1);
    assert.equal(player.lean.rotation.z, 0, "grounded braking cannot bank the feet through the road");
    player.updateBrakePose(0, false);
    assert.ok(posedBounds(head).equals(seatedHead), "release restores the original seated pose");
    player.updateBrakePose(0.1, true);
    assert.ok(Math.abs(posedBounds(shoes[0]).min.y) < 0.001, "reduced motion shows planted feet without the transition");
    player.updateBrakePose(0, true);
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
