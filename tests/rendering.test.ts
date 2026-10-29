import test from "node:test";
import assert from "node:assert/strict";
import * as THREE from "three";
import {
  localInstances,
  withinDrawDistance,
} from "../src/game/static-visibility.ts";
import { createRenderBudget } from "../src/game/render-budget.ts";
import { renderPose } from "../src/game/render-pose.ts";
test("static culling keeps overlapping ground, restores neighbourhoods and only uploads live instances", () => {
  const matrices = [
    new THREE.Matrix4(),
    new THREE.Matrix4().makeTranslation(1000, 0, 0),
    new THREE.Matrix4().compose(
      new THREE.Vector3(900, 0, 0),
      new THREE.Quaternion(),
      new THREE.Vector3(2000, 1, 2000),
    ),
  ];
  assert.equal(withinDrawDistance(matrices[2], 0, 0, 350), true);
  const mesh = new THREE.InstancedMesh(
    new THREE.BoxGeometry(),
    new THREE.MeshBasicMaterial(),
    3,
  );
  localInstances(mesh, matrices, 0, 0, 350);
  assert.equal(mesh.count, 2);
  assert.equal(mesh.instanceMatrix.updateRanges[0].count, 32);
  localInstances(mesh, matrices, 1000, 0, 350);
  assert.equal(mesh.count, 2);
  const m = new THREE.Matrix4();
  mesh.getMatrixAt(0, m);
  assert.equal(m.elements[12], 1000);
  localInstances(mesh, matrices, 10000, 10000, 350);
  assert.equal(mesh.visible, false);
  localInstances(mesh, matrices, 0, 0, 350);
  assert.equal(mesh.visible, true);
  assert.equal(mesh.count, 2);
  mesh.geometry.dispose();
  (mesh.material as THREE.Material).dispose();
});
test("render budget responds to sustained slow frames and never exceeds bounds", () => {
  const b = createRenderBudget(1);
  let last;
  for (let i = 0; i < 500; i++) {
    const r = b.sample(0.04);
    if (r) last = r;
  }
  assert.equal(last?.ratio, 0.65);
  assert.equal(last?.shadows, false);
  for (let i = 0; i < 4500; i++) {
    const r = b.sample(1 / 90);
    if (r) last = r;
  }
  assert.equal(last?.ratio, 1);
  b.reset();
  assert.equal(b.sample(0.2), null);
});
test("render pose interpolates movement and shortest turn without changing physics state", () => {
  const a = { x: 0, z: 0, yaw: Math.PI - 0.1 },
    b = { x: 2, z: 4, yaw: -Math.PI + 0.1 };
  const p = renderPose(a, b, 0.5);
  assert.equal(p.x, 1);
  assert.equal(p.z, 2);
  assert.ok(Math.abs(p.yaw - Math.PI) < 1e-10);
  assert.equal(b.x, 2);
  assert.equal(renderPose(a, b, 2).x, 2);
});
