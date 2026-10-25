import test from "node:test";
import assert from "node:assert/strict";
import { pavementLayout, PAVEMENT_TOP } from "../src/game/pavements.ts";
import { roadContains } from "../src/game/network.ts";
test("raised pavements meet street edges and junction corners without blocking roads", () => {
  const layout = pavementLayout();
  assert.equal(layout.heightAt(-247.5, 325.5), PAVEMENT_TOP);
  assert.equal(layout.heightAt(-241.5, 198.5), PAVEMENT_TOP);
  assert.equal(layout.heightAt(-266, 325), 0);
  assert.equal(layout.heightAt(-260, 180), 0);
  for (const strip of layout.strips)
    for (
      let x = strip.x - strip.width / 2 + 0.001;
      x < strip.x + strip.width / 2;
      x += 0.5
    )
      assert.equal(roadContains(x, strip.z, 0), false);
});
