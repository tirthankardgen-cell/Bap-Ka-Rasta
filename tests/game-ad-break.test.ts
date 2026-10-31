import { test } from "node:test";
import assert from "node:assert/strict";
import { requestExitAd, type BreakRequest } from "../src/game-ad-break.ts";
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

test("missing ads and request errors return home immediately", () => {
  let exits = 0;
  requestExitAd(undefined, () => exits++);
  requestExitAd(() => { throw new Error("blocked"); }, () => exits++);
  assert.equal(exits, 2);
});
test("no-fill and both completion callbacks navigate only once", () => {
  let exits = 0;
  requestExitAd((ad) => ad.adBreakDone(), () => exits++);
  requestExitAd((ad) => { ad.beforeAd(); ad.afterAd(); ad.adBreakDone(); }, () => exits++);
  assert.equal(exits, 2);
});
test("unanswered request times out, but visible ad is allowed to finish", async () => {
  let exits = 0;
  requestExitAd(() => {}, () => exits++, 10);
  await wait(30);
  assert.equal(exits, 1);
  let active!: BreakRequest;
  requestExitAd((ad) => { active = ad; ad.beforeAd(); }, () => exits++, 10);
  await wait(30);
  assert.equal(exits, 1);
  active.afterAd();
  active.adBreakDone();
  assert.equal(exits, 2);
});
test("unmount cleanup ignores late callbacks and timers", async () => {
  let exits = 0;
  let active!: BreakRequest;
  const cancel = requestExitAd((ad) => { active = ad; }, () => exits++, 10);
  cancel();
  active.adBreakDone();
  await wait(30);
  assert.equal(exits, 0);
});
