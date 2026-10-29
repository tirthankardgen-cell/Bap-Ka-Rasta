import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import * as THREE from "three";
import { characters } from "../src/game/characters.ts";
import { disposeAutoModel } from "../src/game/auto-model.ts";
import { characterPlayerPart } from "../src/game/character-models.ts";
import { readCharacterModels } from "./helpers/character-assets.ts";

test("the shipped Blender library contains all reference characters at human scale, with compatible LODs", async () => {
  const models = await readCharacterModels();
  assert.equal(models.cast.size, 20);
  for (const { id } of characters) {
    const { detail, crowd } = models.cast.get(id)!;
    const bounds = detail.geometry.boundingBox!;
    const size = bounds.getSize(new THREE.Vector3());
    assert.ok(size.y > 1.7 && size.y < 2.15, `${id}: height ${size.y}`);
    assert.ok(
      bounds.min.y >= -0.025 && bounds.min.y < 0.05,
      `${id}: feet at ${bounds.min.y}`,
    );
    assert.ok(size.x > 0.55 && size.x < 1.65, `${id}: width ${size.x}`);
    assert.ok(detail.geometry.index!.count > 24000, `${id}: detailed geometry`);
    // Small disconnected flower petals retain a minimum number of faces.
    assert.ok(
      crowd.geometry.index!.count < detail.geometry.index!.count / 3,
      `${id}: distant triangle budget`,
    );
    for (const axis of ["x", "y", "z"] as const) {
      assert.ok(
        Math.abs(bounds.min[axis] - crowd.geometry.boundingBox!.min[axis]) <
          0.055,
        `${id}: LOD min ${axis}`,
      );
      assert.ok(
        Math.abs(bounds.max[axis] - crowd.geometry.boundingBox!.max[axis]) <
          0.055,
        `${id}: LOD max ${axis}`,
      );
    }
    const roles = detail.geometry.getAttribute("castJoint");
    const pivots = detail.geometry.getAttribute("castPivot");
    const kinds = new Set<number>();
    for (let i = 0; i < roles.count; i++) {
      kinds.add(roles.getX(i));
      assert.ok(
        Number.isFinite(pivots.getX(i) + pivots.getY(i) + pivots.getZ(i)),
      );
      assert.ok(
        pivots.getY(i) >= 0.4 && pivots.getY(i) < 1.5,
        `${id}: pivot ${pivots.getY(i)}`,
      );
    }
    assert.deepEqual([...kinds].sort(), [0, 1, 2, 3]);
  }
  disposeAutoModel(models.source);
});

test("Sachin's seated body fits the actual auto cabin and the first-person hands face the camera", async () => {
  const models = await readCharacterModels();
  const seated = characterPlayerPart(models, "seated");
  const box = new THREE.Box3().setFromObject(seated);
  assert.ok(
    box.min.y >= 0.38 && box.min.y < 0.55,
    `footboard height: ${box.min.y}`,
  );
  assert.ok(
    box.max.y > 1.65 && box.max.y < 1.85,
    `canopy clearance: ${box.max.y}`,
  );
  assert.ok(
    box.max.x < 0.47 && box.min.x > -0.47,
    "shoulders and hands fit through the cabin",
  );
  assert.ok(box.max.z < 0.85, "feet and hands stay behind the windscreen");
  for (const part of ["hand_left", "hand_right", "keys"]) {
    const bounds = new THREE.Box3().setFromObject(
      characterPlayerPart(models, part),
    );
    assert.ok(
      bounds.max.y < 0 && bounds.max.z < -0.1,
      `${part}: in front of first-person camera`,
    );
    assert.ok(bounds.min.z > -1, `${part}: within arm's reach`);
  }
  disposeAutoModel(models.source);
});

test("the manifest fingerprints the packed asset and keeps the mobile download bounded", async () => {
  const bytes = await readFile(
    new URL("../public/models/mumbai-characters.glb", import.meta.url),
  );
  const manifest = JSON.parse(
    await readFile(
      new URL("../assets/characters/mumbai/manifest.json", import.meta.url),
      "utf8",
    ),
  );
  assert.equal(bytes.length, manifest.bytes);
  assert.equal(
    createHash("sha256").update(bytes).digest("hex"),
    manifest.sha256,
  );
  assert.equal(manifest.characters.length, 20);
  assert.ok(bytes.length < 8 * 1048576);
  assert.ok(manifest.uncompressed_bytes > bytes.length * 3);
});
