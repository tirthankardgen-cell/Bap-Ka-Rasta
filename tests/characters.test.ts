import test from "node:test";
import assert from "node:assert/strict";
import {
  characters,
  createActors,
  actorPose,
  actorIdentity,
  districtFor,
} from "../src/game/characters.ts";
import { streets, roadContains } from "../src/game/network.ts";
import { introFrame, advanceIntro, INTRO_DURATION } from "../src/game/intro.ts";

test("all 20 cast designs are present, with one home per named NPC and no duplicate player", () => {
  assert.equal(characters.length, 20);
  assert.equal(new Set(characters.map((c) => c.id)).size, 20);
  const cast = createActors().filter((a) => a.named);
  assert.equal(cast.length, 19);
  assert.equal(new Set(cast.map((a) => a.character)).size, 19);
  assert.ok(cast.every((a) => a.character > 0));
  assert.equal(characters.find((c) => c.id === "patil")?.moustache, true);
});
test("crowd identity is deterministic and neighbourhoods use varied activities and wardrobes", () => {
  const actors = createActors();
  assert.deepEqual(actors, createActors());
  assert.equal(
    new Set(streets.filter((e) => !e.oneWay).map((e) => districtFor(e.id)))
      .size,
    6,
  );
  assert.ok(
    new Set(
      actors.filter((a) => !a.named).map((a) => `${a.character}:${a.variant}`),
    ).size >= 48,
  );
  assert.ok(
    actors.some((a) => a.activity === "browse") &&
      actors.some((a) => a.activity === "chat"),
  );
});
test("non-crossing characters stay off active roads and clear the entry path", () => {
  const actors = createActors();
  for (const time of [0, 30, 90, 180])
    for (const a of actors) {
      if (a.cross >= 0 || a.jaywalk !== undefined) continue;
      const p = actorPose(a, time);
      assert.equal(
        roadContains(p.x, p.z, 0),
        false,
        `${a.id} at ${p.x},${p.z}`,
      );
      assert.ok(Number.isFinite(p.x + p.z + p.yaw));
      if (!a.named)
        assert.ok(!(p.x > -276.3 && p.x < -274.7 && p.z > 325 && p.z < 331));
    }
});
test("intro progresses through approach, entry, seat and masked handoff, with stable pause", () => {
  assert.deepEqual(
    [0, 3, 6, 8, 10].map((t) => introFrame(t).stage),
    ["approach", "entering", "seated", "handoff", "done"],
  );
  assert.equal(advanceIntro(2, 5, true), 2);
  assert.equal(advanceIntro(9, 10, false), INTRO_DURATION);
  assert.equal(introFrame(9).fade, 1);
  assert.equal(introFrame(9).exterior, true);
  const seat = introFrame(7);
  assert.equal(seat.y, 1.52);
  assert.equal(seat.x, -270);
  for (const t of [0, 1, 2, 3, 4, 5]) {
    assert.equal(introFrame(t, true).x, introFrame(0, true).x);
    assert.equal(introFrame(t, true).z, introFrame(0, true).z);
  }
});

// Build the actual shared NPC render batch without requiring a WebGL context.
test("crowd models produce finite transforms and Low graphics reduces visible instances", async () => {
  const { Scene, InstancedMesh, Matrix4 } = await import("three");
  const { makeCrowd } = await import("../src/game/crowd.ts");
  const scene = new Scene();
  const crowd = makeCrowd(scene, () => 0.42);
  crowd.update(2, -270, 325, false);
  const mesh = scene.children[0];
  assert.ok(mesh instanceof InstancedMesh);
  const standard = mesh.count;
  assert.ok(standard > 0);
  const matrix = new Matrix4();
  for (let i = 0; i < standard; i++) {
    mesh.getMatrixAt(i, matrix);
    assert.ok(matrix.elements.every(Number.isFinite));
  }
  crowd.update(2, -270, 325, true);
  assert.ok(mesh.count > 0 && mesh.count < standard);
  mesh.geometry.dispose();
  if (!Array.isArray(mesh.material)) mesh.material.dispose();
});

test("serious crowd impacts render a grounded mark above the road and zebra crossing", async () => {
  const { Scene, Mesh } = await import("three");
  const { makeCrowd } = await import("../src/game/crowd.ts");
  const scene = new Scene(),
    crowd = makeCrowd(scene, () => 0);
  const actor = createActors().find((a) => a.cross >= 0)!;
  const time = 35 - (actor.cross % 4) * 4;
  const p = actorPose(actor, time);
  const hit = crowd.collide(
    { x: p.x, z: p.z + 3 },
    { x: p.x, z: p.z, yaw: Math.PI },
    time,
    time,
    10,
  );
  assert.ok(hit?.fatal);
  crowd.update(time + 3, p.x, p.z);
  const mark = scene.getObjectByName("Incident blood mark")!;
  assert.ok(mark.visible);
  assert.ok(
    mark.position.y > 0.1325,
    "mark must not be hidden beneath zebra geometry",
  );
  scene.traverse((o) => {
    if (o instanceof Mesh) {
      o.geometry.dispose();
      for (const m of Array.isArray(o.material) ? o.material : [o.material])
        m.dispose();
    }
  });
});

test("shop-worker identities describe a person, not the goods they carry", () => {
  const shopWorker = characters.findIndex((c) => c.id === "ganesh");
  const actors = createActors().filter((a) => a.character === shopWorker);
  assert.ok(actors.some((a) => a.named) && actors.some((a) => !a.named));
  for (const actor of actors)
    assert.equal(actorIdentity(actor).role, "Shop worker");
});
