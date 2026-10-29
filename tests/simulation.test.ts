import { test } from "node:test";
import assert from "node:assert/strict";
import {
  createTrafficHornScheduler,
  playerBlocksTraffic,
  newDrive,
  newTraffic,
  emptyInput,
  step,
  resetDrive,
  updateTraffic,
} from "../src/game/simulation.ts";
import {
  streets,
  junctions,
  connections,
  geometry,
  margin,
  lanePosition,
  roadContains,
  lightFor,
  signalPhase,
  crossingPosition,
  SPAWN,
} from "../src/game/network.ts";

test("connected street network has branches, multiple lanes and a one-way roundabout", () => {
  const seen = new Set<number>([0]),
    todo = [0];
  while (todo.length) {
    for (const c of connections(todo.pop()!))
      if (!seen.has(c.to)) {
        seen.add(c.to);
        todo.push(c.to);
      }
  }
  assert.equal(seen.size, junctions.length);
  assert.ok(
    junctions.filter((n) => connections(n.id).length >= 3).length >= 10,
  );
  assert.equal(streets.filter((e) => e.oneWay).length, 8);
  assert.ok(streets.filter((e) => e.width === 24).length >= 25);
  assert.equal(roadContains(110, 180), false);
  assert.ok(roadContains(144, 180));
});

test("acceleration, speed cap, braking and delayed reverse", () => {
  const s = newDrive(),
    input = emptyInput();
  input.throttle = true;
  s.gear = 4;
  for (let i = 0; i < 360; i++) step(s, input, []);
  assert.ok(s.speed > 12 && s.speed <= 65 / 3.6);
  input.throttle = false;
  input.brake = true;
  let stopped = false;
  for (let i = 0; i < 180; i++) {
    step(s, input, []);
    if (s.speed === 0) {
      stopped = true;
      break;
    }
  }
  assert.ok(stopped);
  for (let i = 0; i < 20; i++) step(s, input, []);
  assert.ok(s.speed >= 0);
  for (let i = 0; i < 90; i++) step(s, input, []);
  assert.ok(s.speed < 0 && s.speed >= -3.3);
});

test("stationary steering does not rotate and moving steering matches input", () => {
  const s = newDrive(),
    input = emptyInput();
  input.left = true;
  for (let i = 0; i < 60; i++) step(s, input, []);
  assert.equal(s.yaw, SPAWN.yaw);
  input.throttle = true;
  for (let i = 0; i < 60; i++) step(s, input, []);
  assert.ok(s.yaw > SPAWN.yaw);
});

test("curbs stop entry into buildings and the sea; intersections remain open", () => {
  const s = newDrive();
  Object.assign(s, { x: -270.9, z: 325, yaw: -Math.PI / 2, speed: 15 });
  step(s, emptyInput(), []);
  assert.ok(roadContains(s.x, s.z));
  assert.ok(s.speed < 5);
  assert.ok(s.impact > 0);
  assert.ok(roadContains(-250, 175));
  assert.ok(roadContains(-245, 180));
});

test("traffic contacts separate vehicles and reduce speed", () => {
  const s = newDrive(),
    t = newTraffic()[0];
  Object.assign(t, { x: s.x, z: s.z, speed: 0, turn: null });
  const e = streets.find(
    (e) =>
      junctions[e.a].x === -260 &&
      junctions[e.b].x === -260 &&
      junctions[e.a].z === 180,
  )!;
  Object.assign(t, { edge: e.id, from: e.b, progress: 75, lane: 6 });
  // Place the collision fixture on its traffic lane, independently of the kerbside spawn.
  Object.assign(s, lanePosition(e.id, e.b, 75, 6));
  step(s, emptyInput(), [t]);
  assert.ok(Math.hypot(s.x - t.x, s.z - t.z) >= 2.49);
  assert.ok(s.impact > 0);
});

test("safe reset preserves progress and avoids occupied positions", () => {
  const s = newDrive(),
    traffic = newTraffic();
  s.distance = 124;
  s.topSpeed = 42;
  s.speed = 10;
  s.gear = 4;
  resetDrive(s, traffic);
  assert.equal(s.speed, 0);
  assert.equal(s.gear, 1);
  assert.equal(s.distance, 124);
  assert.equal(s.topSpeed, 42);
  assert.ok(roadContains(s.x, s.z));
  assert.ok(traffic.every((t) => Math.hypot(t.x - s.x, t.z - s.z) >= 12));
});

test("signals never give conflicting axes green and reserve a pedestrian phase", () => {
  for (const n of junctions.filter((n) => n.signal))
    for (let t = 0; t < 92; t += 0.25) {
      const ns = lightFor(n.id, 0, 1, t),
        ew = lightFor(n.id, 1, 0, t);
      assert.ok(!(ns === "green" && ew === "green"));
      if (signalPhase(n.id, t) >= 30) {
        assert.equal(ns, "red");
        assert.equal(ew, "red");
      }
    }
});

test("traffic stops at red and proceeds through the junction on green", () => {
  const t = newTraffic().find(
    (t) => junctions[geometry(t.edge, t.from).b.id].signal,
  )!;
  const g = geometry(t.edge, t.from),
    end = g.length - margin(g.length);
  t.progress = end - 3;
  t.speed = 6;
  Object.assign(t, lanePosition(t.edge, t.from, t.progress, t.lane));
  let red = 0,
    green = 0;
  while (lightFor(g.b.id, g.dx, g.dz, red) !== "red") red++;
  while (lightFor(g.b.id, g.dx, g.dz, green) !== "green") green++;
  for (let i = 0; i < 180; i++)
    updateTraffic([t], { x: 900, z: 900 }, red, 1 / 60);
  assert.equal(t.turn, null);
  assert.ok(t.progress <= end);
  assert.ok(t.speed < 0.1);
  for (let i = 0; i < 600; i++)
    updateTraffic([t], { x: 900, z: 900 }, green, 1 / 60);
  assert.ok(t.turn !== null || t.decisions > 0);
});

test("pedestrians cross only during all-red and do not teleport between cycles", () => {
  const id = junctions.find((n) => n.signal)!.id,
    offset = (id % 4) * 4,
    t = 46 - offset;
  const a = crossingPosition(id, t - 0.001, 1),
    b = crossingPosition(id, t + 0.001, 1);
  assert.ok(Math.hypot(a.x - b.x, a.z - b.z) < 0.01);
  assert.equal(crossingPosition(id, 35 - offset, 1).moving, true);
  assert.equal(crossingPosition(id, 10 - offset, 1).moving, false);
});

test("dense traffic follows connected routes for three minutes without invalid poses", () => {
  const traffic = newTraffic();
  assert.equal(traffic.length, 112);
  for (let i = 0; i < traffic.length; i++)
    for (let j = i + 1; j < traffic.length; j++)
      assert.ok(
        Math.hypot(traffic[i].x - traffic[j].x, traffic[i].z - traffic[j].z) >=
          9,
      );
  let transitions = 0;
  for (let tick = 0; tick < 60 * 180; tick++) {
    updateTraffic(traffic, { x: 999, z: 999 }, tick / 60, 1 / 60);
    if (tick % 60 === 0)
      for (const t of traffic) {
        assert.ok(Number.isFinite(t.x + t.z + t.yaw));
        assert.ok(
          roadContains(t.x, t.z, 0),
          `off-road ${t.id}: ${t.x}, ${t.z}`,
        );
      }
  }
  transitions = traffic.reduce((sum, t) => sum + t.decisions, 0);
  assert.ok(transitions > 100, `only ${transitions} completed turns`);
});

test("five-minute free drive can choose cross streets without a finish condition", () => {
  const s = newDrive(),
    input = emptyInput();
  s.gear = 3;
  const points = [
    [-260, 180],
    [-260, -40],
    [-260, -260],
    [-80, -260],
    [110, -260],
    [290, -260],
    [290, -40],
    [110, -40],
    [-80, -40],
    [-80, 180],
    [-80, 400],
    [-80, 620],
    [290, 620],
    [290, 400],
    [110, 400],
    [-80, 400],
    [-260, 400],
  ];
  let goal = 0;
  for (let i = 0; i < 60 * 300; i++) {
    const [x, z] = points[goal];
    if (Math.hypot(s.x - x, s.z - z) < 14) goal = (goal + 1) % points.length;
    const target = Math.atan2(points[goal][0] - s.x, points[goal][1] - s.z);
    const error = Math.atan2(
      Math.sin(target - s.yaw),
      Math.cos(target - s.yaw),
    );
    const wanted = Math.abs(error) > 0.25 ? 4 : 12;
    input.throttle = s.speed < wanted;
    input.brake = s.speed > wanted + 1;
    input.left = error > 0.025;
    input.right = error < -0.025;
    step(s, input, []);
    assert.ok(Number.isFinite(s.x + s.z + s.speed));
    assert.ok(roadContains(s.x, s.z));
  }
  assert.ok(s.distance > 1500, `distance ${s.distance}`);

  assert.ok(s.topSpeed <= 65.01);
});

test("free driving does not automatically brake at pedestrians or red signals", () => {
  const n = junctions.find((n) => n.signal)!,
    s = newDrive(),
    time = 35 - (n.id % 4) * 4,
    p = crossingPosition(n.id, time, 1, 0.72);
  Object.assign(s, {
    x: p.x,
    z: p.z + 5,
    yaw: Math.PI,
    speed: 10,
    gear: 3,
    time: time - 1 / 60,
  });
  step(s, { ...emptyInput(), throttle: true }, []);
  assert.ok(s.speed > 10);
  assert.notEqual(s.signal, "pedestrian");
});

test("expanded neighbourhood lanes carry opposing traffic and stay inside the visible city perimeter", () => {
  const lanes = streets.filter((e) => e.width === 10);
  assert.ok(lanes.length >= 20);
  for (const e of lanes) {
    assert.equal(e.oneWay, false);
    const length = geometry(e.id).length;
    const a = lanePosition(e.id, e.a, length / 2, 2.5),
      b = lanePosition(e.id, e.b, length / 2, 2.5);
    assert.ok(roadContains(a.x, a.z));
    assert.ok(roadContains(b.x, b.z));
    assert.ok(Math.hypot(a.x - b.x, a.z - b.z) >= 4.9);
  }
  for (const p of [
    [-295, 0],
    [649, 0],
    [0, -719],
    [0, 659],
  ])
    assert.equal(roadContains(p[0], p[1], 0), false);
  const drive = newDrive(),
    input = emptyInput();
  Object.assign(drive, { x: 452.5, z: -420, yaw: 0, gear: 2 });
  input.throttle = true;
  for (let i = 0; i < 600; i++) step(drive, input, []);
  assert.ok(drive.distance > 50);
  assert.ok(roadContains(drive.x, drive.z));
});

test("brake takes priority over held throttle without reversing", () => {
  const s = newDrive();
  s.speed = 5;
  const input = { ...emptyInput(), throttle: true, brake: true };
  for (let i = 0; i < 120; i++) step(s, input, []);
  assert.equal(s.speed, 0);
});

test("traffic honks at a blocking player with cooldown, not adjacent or shielded traffic", () => {
  const t = { ...newTraffic()[0], x: 0, z: 0, yaw: 0 };
  const player = { x: 0, z: 6 };
  const schedule = createTrafficHornScheduler();
  assert.equal(playerBlocksTraffic(t, { x: 4, z: 6 }, [t]), false);
  assert.equal(playerBlocksTraffic(t, { x: 0, z: -6 }, [t]), false);
  assert.equal(
    playerBlocksTraffic(t, player, [t, { ...t, id: 999, z: 3 }]),
    false,
  );
  assert.equal(schedule([t], player, 0), t);
  assert.equal(schedule([t], player, 0.5), null);
  assert.equal(schedule([t], player, 3), null);
  assert.equal(schedule([t], player, 7), t);
  assert.equal(schedule([t], { x: 20, z: 20 }, 15), null);
});
