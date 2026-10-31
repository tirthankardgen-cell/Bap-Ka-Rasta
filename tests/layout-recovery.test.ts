import test from "node:test";
import assert from "node:assert/strict";
import { buildingLotWork, buildingLots } from "../src/game/buildings.ts";
import { pavementWork, pavementLayout, PAVEMENT_TOP } from "../src/game/pavements.ts";
import { runSetupWork } from "../src/game/setup-work.ts";

async function cancelDuring<T>(work: Generator<void, T>) {
  const controller = new AbortController();
  const reason = new Error("Leave the loading screen");
  function* interrupted() {
    let batches = 0;
    for (const step of work) {
      if (++batches === 25) controller.abort(reason);
      yield step;
    }
  }
  await assert.rejects(runSetupWork(interrupted(), controller.signal), reason);
}

test("cancelled city setup retries with complete buildings and pavement", async () => {
  await cancelDuring(buildingLotWork());
  await cancelDuring(pavementWork());
  const lots = await runSetupWork(buildingLotWork());
  const pavement = await runSetupWork(pavementWork());
  assert.ok(lots.length > 1600, "all expanded districts were generated");
  assert.deepEqual(lots, buildingLots());
  assert.ok(pavement.strips.length > 1000);
  assert.equal(pavement.heightAt(-247.5, 325.5), PAVEMENT_TOP);
  assert.equal(pavement.heightAt(-266, 325), 0);
  assert.deepEqual(pavement.strips, pavementLayout().strips);
});

test("fresh scenes cannot inherit edits to another scene's layout objects", () => {
  const expectedLots = buildingLots();
  const editedLots = buildingLots();
  editedLots[0].x += 1000;
  editedLots.pop();
  assert.deepEqual(buildingLots(), expectedLots);

  const expectedPavement = pavementLayout();
  const editedPavement = pavementLayout();
  editedPavement.strips[0].width = 0;
  editedPavement.strips.length = 0;
  editedPavement.heightAt = () => 999;
  const freshPavement = pavementLayout();
  assert.deepEqual(freshPavement.strips, expectedPavement.strips);
  assert.equal(freshPavement.heightAt(-247.5, 325.5), PAVEMENT_TOP);
});
