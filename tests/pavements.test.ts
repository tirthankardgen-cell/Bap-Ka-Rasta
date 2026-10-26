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

test("junction footpaths fill asphalt notches with continuous right-angle corners", () => {
  const layout = pavementLayout();
  // The avenue at (-260, 180) has 12m half-widths. All four corner
  // quadrants must be paved right up to those edges, not an 18m apron.
  for (const sx of [-1, 1])
    for (const sz of [-1, 1])
      for (let x = 12.5; x < 22; x++)
        for (let z = 12.5; z < 22; z++) {
          assert.equal(
            layout.heightAt(-260 + sx * x, 180 + sz * z),
            PAVEMENT_TOP,
          );
          assert.equal(roadContains(-260 + sx * x, 180 + sz * z, 0), false);
        }
});
