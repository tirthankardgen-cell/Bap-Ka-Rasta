import test from "node:test";
import assert from "node:assert/strict";
import {
  createActors,
  characters,
  actorIdentity,
  actorPose,
  type Actor,
} from "../src/game/characters.ts";
import { createCrowdMotion, PERSONAL_SPACE } from "../src/game/crowd-motion.ts";
import {
  roadContains,
  streets,
  geometry,
  lightFor,
  junctions,
} from "../src/game/network.ts";
import { createPedestrianRules } from "../src/game/pedestrian-rules.ts";

test("the original cast designs and main names stay intact while every background actor has a stable name", () => {
  const actors = createActors();
  assert.equal(characters.length, 20);
  assert.equal(actors.filter((a) => a.named).length, 19);
  for (const a of actors.filter((a) => a.named))
    assert.equal(actorIdentity(a).name, characters[a.character].name);
  assert.equal(
    new Set(actors.map((a) => actorIdentity(a).name)).size,
    actors.length,
  );
  assert.deepEqual(
    actors.map(actorIdentity),
    createActors().map(actorIdentity),
  );
  const delivery = actors.filter((a) => a.character === 14);
  assert.ok(delivery.length > 100);
  assert.equal(actorIdentity(delivery.find((a) => a.named)!).name, "Bala");
  assert.ok(new Set(delivery.map((a) => actorIdentity(a).name)).size > 100);
});

test("mid-block walkers cross continuously at staggered times, including when traffic has green", () => {
  const walkers = createActors().filter((a) => a.jaywalk !== undefined);
  assert.ok(walkers.length >= 180);
  let greenCrossings = 0;
  for (const a of walkers.slice(0, 24)) {
    const e = streets[a.edge],
      g = geometry(a.edge);
    const node = [g.a, g.b].find((n) => n.signal);
    let onRoad = 0,
      offRoad = 0;
    for (let time = 0; time < 120; time += 0.25) {
      const p = actorPose(a, time),
        q = actorPose(a, time + 0.01);
      assert.ok(
        Math.hypot(p.x - q.x, p.z - q.z) < 0.025,
        "crossing must never teleport between legs",
      );
      if (roadContains(p.x, p.z, 0)) {
        onRoad++;
        if (node && lightFor(node.id, g.dx, g.dz, time) === "green")
          greenCrossings++;
        assert.ok(
          junctions.every((n) => Math.hypot(n.x - p.x, n.z - p.z) > 20),
          "use mid-block routes",
        );
      } else offRoad++;
    }
    assert.ok(onRoad && offRoad);
  }
  assert.ok(greenCrossings > 0);
});

test("opposing walkers make room, pass one another and keep personal space", () => {
  const edge = streets.find((e) => !e.oneWay && geometry(e.id).length > 200)!;
  const common: Actor = {
    id: 0,
    character: 12,
    named: false,
    edge: edge.id,
    side: 1,
    phase: 0.4,
    variant: 1,
    activity: "walk",
    cross: -1,
  };
  const actors = [common, { ...common, id: 1, phase: 1.5 }];
  const motion = createCrowdMotion(actors);
  const start = motion.sample(0).map((p) => ({ ...p }));
  let previous = start;
  for (let tick = 1; tick <= 600; tick++) {
    const poses = motion.sample(tick * 0.05);
    assert.ok(
      Math.hypot(poses[0].x - poses[1].x, poses[0].z - poses[1].z) >=
        PERSONAL_SPACE - 0.002,
    );
    for (let i = 0; i < 2; i++)
      assert.ok(
        Math.hypot(poses[i].x - previous[i].x, poses[i].z - previous[i].z) <
          0.4,
      );
    previous = poses;
  }
  const end = motion.sample(30),
    g = geometry(edge.id);
  const along = (p: { x: number; z: number }) => p.x * g.dx + p.z * g.dz;
  assert.ok(along(start[0]) < along(start[1]));
  assert.ok(
    along(end[0]) > along(end[1]),
    "walkers should pass, not remain deadlocked",
  );
});

test("dense crowd separation keeps named homes fixed and body transforms apart", () => {
  const actors = createActors(),
    motion = createCrowdMotion(actors);
  const settled = motion.sample(0).map(({ x, z }) => ({ x, z }));
  for (let tick = 0; tick <= 100; tick++) {
    const poses = motion.sample(tick * 0.05);
    if (tick % 20) continue;
    const grid = new Map<string, number[]>();
    poses.forEach((p, i) => {
      assert.ok(Number.isFinite(p.x + p.z + p.yaw));
      if (actors[i].activity !== "walk")
        assert.deepEqual({ x: p.x, z: p.z }, settled[i], "Standing neighbours must not jitter between updates");
      if (actors[i].home)
        assert.deepEqual(
          { x: p.x, z: p.z },
          { x: actors[i].home!.x, z: actors[i].home!.z },
        );
      const gx = Math.floor(p.x / 2),
        gz = Math.floor(p.z / 2);
      for (let x = gx - 1; x <= gx + 1; x++)
        for (let z = gz - 1; z <= gz + 1; z++)
          for (const j of grid.get(x + "," + z) ?? [])
            assert.ok(
              Math.hypot(p.x - poses[j].x, p.z - poses[j].z) >=
                PERSONAL_SPACE - 0.025,
              `overlap ${i}/${j} at ${tick * 0.05}`,
            );
      const key = gx + "," + gz;
      const bucket = grid.get(key);
      if (bucket) bucket.push(i);
      else grid.set(key, [i]);
    });
  }
});

test("vehicle hits use the same separated poses the crowd renders", () => {
  const a: Actor = {
    id: 0,
    character: 14,
    named: false,
    edge: 0,
    side: 1,
    phase: 0,
    variant: 1,
    activity: "walk",
    cross: -1,
    home: { x: 0, z: 0, yaw: 0 },
  };
  const rule = createPedestrianRules([a]);
  assert.equal(
    rule.collide(
      { x: 0, z: -2 },
      { x: 0, z: 0, yaw: 0 },
      0,
      0.1,
      3,
      [{ x: 2, z: 0 }],
      [{ x: 2, z: 0 }],
    ),
    null,
  );
  assert.ok(
    rule.collide(
      { x: 2, z: -2 },
      { x: 2, z: 0, yaw: 0 },
      0.1,
      0.2,
      3,
      [{ x: 2, z: 0 }],
      [{ x: 2, z: 0 }],
    ),
  );
});
