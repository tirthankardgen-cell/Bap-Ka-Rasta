import test from "node:test";
import assert from "node:assert/strict";
import {
  buildingLots,
  lotFootprint,
  footprintPoint,
  footprintsOverlap,
} from "../src/game/buildings.ts";
import { roadContains, junctions } from "../src/game/network.ts";

const lots = buildingLots();
test("dense street frontages reserve inhabited corners, including all four sides of central intersections", () => {
  assert.ok(lots.length >= 600);
  assert.ok(lots.filter((b) => b.corner).length >= 100);
  for (const [x, z] of [
    [-80, -260],
    [110, -40],
    [290, -260],
  ]) {
    assert.ok(junctions.some((n) => n.x === x && n.z === z));
    for (const sx of [-1, 1])
      for (const sz of [-1, 1])
        assert.ok(
          lots.some(
            (b) =>
              (b.x - x) * sx > 0 &&
              (b.z - z) * sz > 0 &&
              Math.abs(b.x - x) < 43 &&
              Math.abs(b.z - z) < 43,
          ),
          `missing corner at ${x},${z}: ${sx},${sz}`,
        );
  }
});

test("whole building envelopes clear roads, crossings and neighbouring buildings", () => {
  for (let i = 0; i < lots.length; i++) {
    const a = lotFootprint(lots[i]);
    for (let x = -a.halfWidth; x <= a.halfWidth; x += 2)
      for (let z = -a.halfLength; z <= a.halfLength; z += 2) {
        const p = footprintPoint(a, x, z);
        assert.equal(
          roadContains(p.x, p.z, 0),
          false,
          `building ${i} enters road`,
        );
      }
    for (let j = i + 1; j < lots.length; j++)
      assert.equal(
        footprintsOverlap(a, lotFootprint(lots[j])),
        false,
        `buildings ${i} and ${j} overlap`,
      );
    assert.ok(lots[i].x >= -242, "seaside promenade remains open");
    assert.equal(
      footprintsOverlap(a, {
        x: -170,
        z: 70,
        yaw: 0,
        halfWidth: 55,
        halfLength: 70,
      }),
      false,
      "maidan remains open",
    );
  }
});
