import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { autoRickshaw } from "../../src/game/vehicles";
import { selectTiles, TileStreamer, type Pose, type Tile } from "./streaming";
import { marineDriveRoute } from "./route";

type Manifest = { tiles: Tile[]; bounds: number[]; stats: Record<string, number>; totalGlbBytes: number };
const base = "/output/playwright/free-city/export/";
const metrics = document.querySelector<HTMLDivElement>("#metrics")!;
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
renderer.setSize(innerWidth, innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
document.body.appendChild(renderer.domElement);
const scene = new THREE.Scene();
scene.background = new THREE.Color("#c9d8d9");
scene.fog = new THREE.Fog("#c9d8d9", 180, 450);
scene.add(new THREE.HemisphereLight("#fff7e8", "#718173", 2.1));
const sun = new THREE.DirectionalLight("#fff1ce", 2.4);
sun.position.set(-90, 150, 60);
scene.add(sun);
const camera = new THREE.PerspectiveCamera(55, innerWidth / innerHeight, 0.1, 1100);
const auto = autoRickshaw();
scene.add(auto.root);
const loader = new GLTFLoader();
const pose: Pose = { x: 0, z: 0, yaw: Math.PI };
const keys = new Set<string>();
let manifest: Manifest, streamer: TileStreamer<THREE.Group>, mapView = false, automatic = false;
let route: number[][] = [], routeDistance = 0, last = performance.now(), lastSelection = 0, frames = 0;
let readyAt: number | null = null;

function disposeGroup(group: THREE.Group) {
  scene.remove(group);
  const geometries = new Set<THREE.BufferGeometry>(), materials = new Set<THREE.Material>();
  group.traverse(obj => {
    if (obj instanceof THREE.Mesh) {
      geometries.add(obj.geometry);
      for (const material of Array.isArray(obj.material) ? obj.material : [obj.material]) materials.add(material);
    }
  });
  for (const geometry of geometries) geometry.dispose();
  for (const material of materials) material.dispose();
}

function stats() {
  return { ...streamer?.stats(), totalTiles: manifest?.tiles.length, totalGlbBytes: manifest?.totalGlbBytes,
    pose: { ...pose }, frames, readyAt, automatic, mapView, routePoints: route.length, triangles: renderer.info.render.triangles,
    drawCalls: renderer.info.render.calls, geometryCount: renderer.info.memory.geometries };
}

function updateMetrics() {
  if (!streamer || !manifest) return;
  const state = streamer.stats();
  if (readyAt === null && state.resident > 0) readyAt = performance.now();
  metrics.textContent = `${state.resident} / ${manifest.tiles.length} tiles loaded\n${Math.round(state.downloadedBytes / 1024)} KB fetched · ${state.requests} loading`;
  metrics.style.whiteSpace = "pre-line";
}

function updateSelection() {
  if (manifest) streamer?.update(selectTiles(manifest.tiles, pose));
}

function reset() {
  const start = route[0] ?? [0, 0];
  pose.x = start[0]; pose.z = start[1];
  if (route.length > 1) pose.yaw = Math.atan2(route[1][0] - start[0], route[1][1] - start[1]);
  routeDistance = 0;
  updateSelection();
}

function alongRoute(distance: number) {
  for (let i = 1; i < route.length; i++) {
    const a = route[i - 1], b = route[i], length = Math.hypot(b[0] - a[0], b[1] - a[1]);
    if (distance <= length) {
      const t = length ? distance / length : 0;
      pose.x = a[0] + (b[0] - a[0]) * t; pose.z = a[1] + (b[1] - a[1]) * t;
      pose.yaw = Math.atan2(b[0] - a[0], b[1] - a[1]);
      return;
    }
    distance -= length;
  }
  const end = route.at(-1);
  if (end) { pose.x = end[0]; pose.z = end[1]; }
  automatic = false;
  document.querySelector<HTMLButtonElement>("#drive")!.textContent = "Drive along Marine Drive";
}

function manualDrive() {
  automatic = false;
  document.querySelector<HTMLButtonElement>("#drive")!.textContent = "Drive along Marine Drive";
}

function render(time: number) {
  const dt = Math.min((time - last) / 1000, 0.05); last = time; frames++;
  if (automatic) { routeDistance += dt * 18.1; alongRoute(routeDistance); }
  else {
    const move = Number(keys.has("w") || keys.has("arrowup")) - Number(keys.has("s") || keys.has("arrowdown"));
    const turn = Number(keys.has("a") || keys.has("arrowleft")) - Number(keys.has("d") || keys.has("arrowright"));
    pose.yaw += turn * dt * 0.9;
    pose.x += Math.sin(pose.yaw) * move * dt * 18.1;
    pose.z += Math.cos(pose.yaw) * move * dt * 18.1;
  }
  if (manifest) {
    pose.x = THREE.MathUtils.clamp(pose.x, manifest.bounds[0] + 5, manifest.bounds[2] - 5);
    pose.z = THREE.MathUtils.clamp(pose.z, manifest.bounds[1] + 5, manifest.bounds[3] - 5);
  }
  auto.root.position.set(pose.x, 0.12, pose.z);
  auto.root.rotation.y = pose.yaw;
  const fx = Math.sin(pose.yaw), fz = Math.cos(pose.yaw);
  camera.up.set(0, mapView ? 0 : 1, mapView ? -1 : 0);
  camera.position.set(pose.x - (mapView ? 0 : fx * 18), mapView ? 350 : 10, pose.z - (mapView ? -0.1 : fz * 18));
  camera.lookAt(pose.x + (mapView ? 0 : fx * 18), 2, pose.z + (mapView ? 0 : fz * 18));
  if (streamer && time - lastSelection > 150) { updateSelection(); lastSelection = time; }
  renderer.render(scene, camera);
  requestAnimationFrame(render);
}
requestAnimationFrame(render);

window.addEventListener("keydown", event => {
  const key = event.key.toLowerCase();
  if (["w", "a", "s", "d", "arrowup", "arrowdown", "arrowleft", "arrowright"].includes(key)) {
    event.preventDefault(); manualDrive(); keys.add(key);
  }
});
window.addEventListener("keyup", event => keys.delete(event.key.toLowerCase()));
window.addEventListener("blur", () => { keys.clear(); manualDrive(); });
window.addEventListener("resize", () => { renderer.setSize(innerWidth, innerHeight); camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); });
document.querySelector<HTMLButtonElement>("#drive")!.onclick = event => {
  automatic = !automatic;
  if (automatic) reset();
  (event.target as HTMLButtonElement).textContent = automatic ? "Stop auto drive" : "Drive along Marine Drive";
};
document.querySelector<HTMLButtonElement>("#view")!.onclick = event => { mapView = !mapView; (event.target as HTMLButtonElement).textContent = mapView ? "Street view" : "Map view"; };
document.querySelector<HTMLButtonElement>("#reset")!.onclick = () => { manualDrive(); reset(); };

async function start() {
  const response = await fetch(base + "manifest.json");
  if (!response.ok) throw new Error("Prepare and export the city first; manifest is missing");
  manifest = await response.json();
  const roads = await (await fetch(base + "roads.json")).json();
  route = marineDriveRoute(roads, manifest.bounds);
  if (route.length < 2) throw new Error("No continuous Marine Drive route found inside this crop");
  streamer = new TileStreamer(async (tile, signal) => {
    const response = await fetch(base + tile.url, { signal });
    if (!response.ok) throw new Error(`${response.status} loading ${tile.id}`);
    const buffer = await response.arrayBuffer();
    if (signal.aborted) throw new DOMException("Aborted", "AbortError");
    const gltf = await loader.parseAsync(buffer, base);
    if (!signal.aborted) scene.add(gltf.scene);
    return gltf.scene;
  }, disposeGroup, updateMetrics);
  reset();
  (window as unknown as { cityPreview: unknown }).cityPreview = {
    stats, setPose: (next: Pose) => { Object.assign(pose, next); updateSelection(); },
    stop: () => streamer.stop(), selectTiles: (next: Pose) => selectTiles(manifest.tiles, next).map(tile => tile.id)
  };
}
start().catch(error => { metrics.textContent = String(error); console.error(error); });
