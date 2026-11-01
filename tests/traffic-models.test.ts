import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { Box3, Mesh, Vector3 } from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/addons/libs/meshopt_decoder.module.js";
import { GALLERY_TRAFFIC, prepareTrafficModels } from "../src/game/traffic-models.ts";
import { disposeAutoModel } from "../src/game/auto-model.ts";
import { newTraffic } from "../src/game/simulation.ts";
import { TRAFFIC_KIND_COUNT, trafficDimensions } from "../src/game/world-scale.ts";

test("every traffic kind has a current, grounded Blender model with usable wheel pivots", async () => {
  const file = await readFile(new URL("../public/models/gallery-traffic.glb", import.meta.url));
  const manifest = JSON.parse(await readFile(new URL("../assets/vehicles/gallery-traffic/manifest.json", import.meta.url), "utf8"));
  const gltf = JSON.parse(file.subarray(20, 20 + file.readUInt32LE(12)).toString());
  assert.equal(gltf.scenes.length, 1, "export only the traffic scene");
  assert.equal(gltf.images?.length ?? 0, 0, "reference photos and studio objects must not ship");
  assert.equal(createHash("sha256").update(file).digest("hex"), manifest.sha256, "manifest must describe the shipped export");
  assert.equal(manifest.bytes, file.length);
  assert.ok(file.length < 4_000_000, "compressed traffic download budget");
  const { scene } = await new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).parseAsync(
    file.buffer.slice(file.byteOffset, file.byteOffset + file.byteLength), "",
  );
  try {
    const models = prepareTrafficModels(scene);
    assert.equal(models.vehicles.size, TRAFFIC_KIND_COUNT - 1, "the hero auto has its own GLB");
    assert.equal(manifest.models.length, models.vehicles.size);
    assert.equal(models.source.visible, false, "resource templates never appear at the world origin");
    for (const [kind, name] of GALLERY_TRAFFIC) {
      const model = models.vehicles.get(kind)!;
      const entry = manifest.models.find((m: { kind: number }) => m.kind === kind);
      assert.equal(entry.name, name);
      assert.ok(model.position.length() < 1e-6, `${name} exported with studio placement`);
      const bounds = new Box3().setFromObject(model);
      const size = bounds.getSize(new Vector3());
      const expected = trafficDimensions(kind);
      assert.ok(Math.abs(bounds.min.y) < .035, `${name} tyres miss the road: ${bounds.min.y}`);
      assert.ok(Math.abs(size.z - expected.length) < .035, `${name} collision length: ${size.z}`);
      assert.ok(Math.abs(size.y - expected.height) < .035, `${name} height: ${size.y}`);
      assert.ok(size.x >= expected.width - .08 && size.x < expected.width + .68, `${name} width including mirrors: ${size.x}`);
      for (const [axis, value] of [["width", size.x], ["height", size.y], ["length", size.z]] as const)
        assert.ok(Math.abs(value - entry[axis]) < .01, `${name} stale ${axis} in manifest`);
      let triangles = 0;
      model.traverse((o) => {
        if (!(o instanceof Mesh)) return;
        triangles += (o.geometry.index?.count ?? o.geometry.getAttribute("position").count) / 3;
      });
      assert.ok(triangles > 4_000 && triangles < 75_000, `${name} detail/triangle budget: ${triangles}`);
      assert.equal(entry.wheels.length, kind === 2 ? 3 : kind === 5 || kind === 6 ? 2 : 4);
      for (const pivot of entry.wheels) {
        const wheel = model.getObjectByName(pivot.node)!;
        assert.ok(wheel, `${name} missing ${pivot.node}`);
        const centre = wheel.getWorldPosition(new Vector3());
        assert.ok(centre.distanceTo(new Vector3(...pivot.centre)) < .003, `${name} axle position`);
        assert.ok(Math.abs(centre.y - pivot.radius) < .003, `${name} wheel radius`);
        const before = new Box3().setFromObject(wheel).getCenter(new Vector3());
        wheel.rotation.x += Math.PI / 2;
        const after = new Box3().setFromObject(wheel).getCenter(new Vector3());
        assert.ok(before.distanceTo(after) < .02, `${name} wheel orbits instead of spinning`);
        wheel.rotation.x -= Math.PI / 2;
      }
      if ([0, 1, 3, 7, 8, 9, 10, 11, 12].includes(kind)) {
        assert.ok(entry.parts.includes("interior"), `${name} is missing its cabin`);
        assert.ok(entry.parts.includes("controls"), `${name} is missing driver controls`);
        assert.ok(entry.parts.includes("glass"), `${name} is missing separate windows`);
      }
    }
    const incomplete = scene.clone(true);
    const missing = incomplete.getObjectByName("traffic_best_bus")!;
    missing.removeFromParent();
    assert.throws(() => prepareTrafficModels(incomplete), /missing traffic_best_bus/, "a stale five-model export must fail clearly");
  } finally {
    disposeAutoModel(scene);
  }
});

test("the city actually spawns every authored vehicle kind", () => {
  const traffic = newTraffic();
  assert.equal(traffic.length, 112);
  assert.deepEqual([...new Set(traffic.map((t) => t.kind))].sort((a, b) => a - b),
    Array.from({ length: TRAFFIC_KIND_COUNT }, (_, i) => i));
});
