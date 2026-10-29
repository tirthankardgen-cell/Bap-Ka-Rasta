// Development-only viewer of the exact compressed assets and GPU rigs used by the game.
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { characters } from "../../../src/game/characters";
import { loadGameAssets } from "../../../src/game/game-assets";
import {
  makeCastBatch,
  finishCastBatch,
  characterPlayerPart,
} from "../../../src/game/character-models";

document.body.style.cssText =
  "margin:0;background:#f1e6d1;color:#332a21;font:15px system-ui;overflow:hidden";
const controlsBar = document.createElement("div");
controlsBar.style.cssText =
  "position:absolute;z-index:2;left:24px;top:20px;right:24px;display:flex;gap:8px;flex-wrap:wrap;align-items:center";
const select = document.createElement("select");
select.setAttribute("aria-label", "Character");
select.style.cssText =
  "font:600 17px system-ui;padding:10px;background:#fff9ef;border:1px solid #b6a791;border-radius:8px";
for (const c of characters) select.add(new Option(c.name, c.id));
const walking = document.createElement("button");
walking.textContent = "Walk";
const low = document.createElement("button");
low.textContent = "Show distant model";
const driver = document.createElement("button");
driver.textContent = "Sachin in auto";
for (const button of [walking, low, driver])
  button.style.cssText =
    "font:15px system-ui;padding:11px;background:#fff9ef;border:1px solid #b6a791;border-radius:8px;cursor:pointer";
controlsBar.append(select, walking, low, driver);
document.body.append(controlsBar);
const caption = document.createElement("div");
caption.style.cssText =
  "position:absolute;bottom:20px;left:28px;font:600 20px system-ui";
document.body.append(caption);
const renderer = new THREE.WebGLRenderer({
  antialias: true,
  preserveDrawingBuffer: true,
});
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
renderer.setSize(innerWidth, innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;
renderer.domElement.setAttribute(
  "aria-label",
  "Blender character in game renderer",
);
document.body.append(renderer.domElement);
const scene = new THREE.Scene();
scene.background = new THREE.Color("#efe3ce");
scene.add(new THREE.HemisphereLight("#fff4de", "#657076", 2.0));
const light = new THREE.DirectionalLight("#ffe8ca", 3.2);
light.position.set(-3, 5, 4);
light.castShadow = true;
light.shadow.mapSize.set(2048, 2048);
light.shadow.camera.left = light.shadow.camera.bottom = -3;
light.shadow.camera.right = light.shadow.camera.top = 3;
light.shadow.normalBias = 0.025;
scene.add(light);
const rim = new THREE.DirectionalLight("#ffffff", 1.5);
rim.position.set(3, 3, -4);
scene.add(rim);
const floor = new THREE.Mesh(
  new THREE.PlaneGeometry(200, 200),
  new THREE.MeshStandardMaterial({ color: "#d1b991", roughness: 1 }),
);
floor.rotation.x = -Math.PI / 2;
floor.position.y = -0.012;
floor.receiveShadow = true;
scene.add(floor);
const camera = new THREE.PerspectiveCamera(
  35,
  innerWidth / innerHeight,
  0.02,
  300,
);
camera.position.set(1.8, 1.8, 4.1);
const orbit = new OrbitControls(camera, renderer.domElement);
orbit.target.set(0, 1, 0);
orbit.update();
const assets = await loadGameAssets();
const { characterModels: models, autoModel } = assets;
scene.add(models.source);
autoModel.traverse((o) => {
  if (o.userData.driver) o.visible = false;
});
autoModel.add(characterPlayerPart(models, "seated"));
autoModel.visible = false;
scene.add(autoModel);
let current: ReturnType<typeof makeCastBatch> | undefined;
let isLow = false,
  isWalking = false,
  inAuto = false;
let elapsed = 0;
select.value = new URLSearchParams(location.search).get("id") ?? "sachin";
function show() {
  if (current) {
    scene.remove(current.mesh);
    current.mesh.geometry.dispose();
    (current.mesh.material as THREE.Material).dispose();
    current.mesh.customDepthMaterial?.dispose();
  }
  const c = characters.find((c) => c.id === select.value)!;
  current = makeCastBatch(
    models.cast.get(c.id)![isLow ? "crowd" : "detail"],
    1,
    models,
    c.id,
    !isLow,
  );
  current.mesh.setMatrixAt(0, new THREE.Matrix4());
  current.mesh.setColorAt(0, new THREE.Color(1, 1, 1));
  current.mesh.count = 1;
  current.motion.setXYZW(
    0,
    0,
    isWalking ? 0.3 : 0,
    0,
    ["flowers", "crate"].includes(c.prop) ? 1 : 0,
  );
  finishCastBatch(current);
  current.mesh.visible = !inAuto;
  scene.add(current.mesh);
  autoModel.visible = inAuto;
  caption.textContent = inAuto
    ? "Sachin · Player driver"
    : `${c.name} · ${c.role}`;
  document.body.dataset.character = c.id;
  document.body.dataset.lod = isLow ? "crowd" : "detail";
  document.body.dataset.triangles = String(
    current.mesh.geometry.index!.count / 3,
  );
  document.body.dataset.ready = "true";
}
select.onchange = () => {
  inAuto = false;
  show();
};
walking.onclick = () => {
  isWalking = !isWalking;
  walking.textContent = isWalking ? "Stand" : "Walk";
  show();
};
low.onclick = () => {
  isLow = !isLow;
  low.textContent = isLow ? "Show detailed model" : "Show distant model";
  show();
};
driver.onclick = () => {
  inAuto = !inAuto;
  camera.position.set(
    inAuto ? 2.7 : 1.8,
    inAuto ? 2.0 : 1.8,
    inAuto ? 3.7 : 4.1,
  );
  orbit.target.set(0, 1, 0);
  orbit.update();
  show();
};
show();
Object.assign(window, {
  castReview: {
    models,
    current: () => current,
    renderer,
    scene,
    camera,
    orbit,
  },
});
let lastFrame = performance.now();
renderer.setAnimationLoop(() => {
  const now = performance.now();
  elapsed += Math.min((now - lastFrame) / 1000, 0.05);
  lastFrame = now;
  models.time.value = elapsed;
  orbit.update();
  renderer.render(scene, camera);
  document.body.dataset.drawCalls = String(renderer.info.render.calls);
});
window.addEventListener("resize", () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});
