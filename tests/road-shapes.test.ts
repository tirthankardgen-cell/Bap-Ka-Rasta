import { pavementLayout, PAVEMENT_TOP } from "../src/game/pavements.ts";
import test from "node:test";
import assert from "node:assert/strict";
import {
  streets,
  streetPath,
  geometry,
  lanePosition,
  roadContains,
  constrainRoad,
  WORLD_BOUNDS,
} from "../src/game/network.ts";
import { boundaryBuildings } from "../src/game/boundaries.ts";
test("Fort Circle follows a constant radius and has no polygonal road corners", () => {
  for (const e of streets.filter((e) => e.oneWay)) {
    assert.ok(streetPath(e.id).length > 10);
    for (const p of streetPath(e.id)) {
      assert.ok(Math.abs(Math.hypot(p.x - 110, p.z - 180) - 34) < 0.001);
      assert.ok(roadContains(p.x, p.z));
    }
  }
});
test("side corridors remain two-way and uniformly two-lane while avenues stay wide", () => {
  for (const name of [
    "Station Road",
    "Colaba Causeway",
    "Maidan Avenue",
    "Bazaar Galli",
    "Chawl Lane",
  ]) {
    const edges = streets.filter((e) => e.name === name);
    assert.ok(edges.length);
    for (const e of edges) {
      assert.equal(e.width, 10);
      assert.equal(e.oneWay, false);
    }
  }
  for (const e of streets.filter(
    (e) => e.name === "Marine Drive" || e.name === "Harbour Avenue",
  ))
    assert.equal(e.width, 24);
});
test("curved gallis support opposing lanes and collision follows the bend", () => {
  const pavement = pavementLayout();
  for (const e of streets.filter(
    (e) => e.name === "Bazaar Galli" || e.name === "Chawl Lane",
  )) {
    const g = geometry(e.id),
      mid = lanePosition(e.id, e.a, g.length / 2, 0);
    assert.ok(Math.abs(mid.x - (g.a.x + g.b.x) / 2) > 4.9);
    assert.equal(pavement.heightAt(mid.x, mid.z), 0);
    for (const side of [-1, 1]) {
      const p = lanePosition(e.id, e.a, g.length / 2, side * 7);
      assert.equal(pavement.heightAt(p.x, p.z), PAVEMENT_TOP);
    }
    for (let d = 10; d < g.length - 10; d += 4) {
      for (const from of [e.a, e.b]) {
        const p = lanePosition(e.id, from, d, 2.5);
        assert.ok(roadContains(p.x, p.z));
      }
      const p = lanePosition(e.id, e.a, d, 8);
      const c = constrainRoad(p.x, p.z);
      assert.ok(c.hit);
      assert.ok(roadContains(c.x, c.z));
    }
  }
});
test("land-side boundaries have continuous frontages with no houses on the sea edge", () => {
  assert.ok(boundaryBuildings.length > 100);
  for (const b of boundaryBuildings) assert.ok(b.x > WORLD_BOUNDS.minX + 5);
  for (const side of ["north", "south", "east"]) {
    const row = boundaryBuildings.filter((b) =>
      side === "north"
        ? b.yaw === 0
        : side === "south"
          ? b.yaw === Math.PI
          : b.yaw === -Math.PI / 2,
    );
    const intervals = row
      .map((b) => {
        const center = side === "east" ? b.z : b.x;
        return [center - b.width / 2, center + b.width / 2];
      })
      .sort((a, b) => a[0] - b[0]);
    for (let i = 1; i < intervals.length; i++)
      assert.ok(intervals[i][0] <= intervals[i - 1][1]);
  }
});
