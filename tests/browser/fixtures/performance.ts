import * as THREE from "three";
import { makeWorld, trafficVisuals } from "../../../src/game/world";
import { loadAutoRickshaw } from "../../../src/game/auto-model";
import { newTraffic } from "../../../src/game/simulation";
const renderer = new THREE.WebGLRenderer();
renderer.setSize(844, 390);
document.body.append(renderer.domElement);
const scene = new THREE.Scene();
scene.add(new THREE.HemisphereLight(0xffffff, 0x444444, 2));
const camera = new THREE.PerspectiveCamera(55, 844 / 390, 0.1, 800);
camera.position.set(-271.8, 4.4, 332.5);
camera.lookAt(-270, 1.1, 317);
const model = await loadAutoRickshaw();
const world = makeWorld(scene);
const traffic = trafficVisuals(scene, newTraffic(), model);
world.update(0, -270, 325);
traffic(-270, 325);
const start = performance.now();
for (let i = 1; i <= 60; i++) world.update(i / 60, -270, 325);
const updateMs = (performance.now() - start) / 60;
renderer.render(scene, camera);
const counts = { ...renderer.info.render };
renderer.getContext().finish();
const renderStart = performance.now();
for (let i = 0; i < 3; i++) {
  renderer.render(scene, camera);
  renderer.getContext().finish();
}
const renderMs = (performance.now() - renderStart) / 3;
(document.body as HTMLElement).dataset.result = JSON.stringify({
  updateMs,
  renderMs,
  ...counts,
});
