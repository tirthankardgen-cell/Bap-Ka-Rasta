import { createStreetAudio } from "./audio";
import * as THREE from "three";
import { atmosphere } from "./atmosphere";
import { makeWorld, autoRickshaw, trafficVisuals } from "./world";
import {
  emptyInput,
  newDrive,
  newTraffic,
  resetDrive,
  step,
  STEP,
  type Input,
} from "./simulation";
export type CameraMode = "third-person" | "behind-driver" | "driver";
export type Stats = {
  cameraMode: CameraMode;
  audioStatus: string;
  speed: number;
  distance: number;
  topSpeed: number;
  street: string;
  signal: string;
  time: number;
  x: number;
  z: number;
  yaw: number;
  impact: boolean;
  fps: number;
};
export function createEngine(
  host: HTMLElement,
  onStats: (s: Stats) => void,
  onPause: () => void,
  onError: (message: string) => void,
) {
  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    powerPreference: "high-performance",
  });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.95;
  renderer.setClearColor("#bfd6d3");
  renderer.domElement.setAttribute(
    "aria-label",
    "Playable 3D Mumbai driving scene",
  );
  host.appendChild(renderer.domElement);
  const scene = new THREE.Scene();
  const lighting = atmosphere(renderer, scene);
  const world = makeWorld(scene);
  const player = autoRickshaw();
  scene.add(player.root);
  const traffic = newTraffic();
  const placeTraffic = trafficVisuals(scene, traffic);
  renderer.domElement.dataset.cameraMode = "third-person";
  renderer.domElement.dataset.trafficCount = String(traffic.length);
  const state = newDrive();
  const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 800);
  const input = emptyInput();
  const keys = new Set<string>();
  const touch = new Map<number, keyof Input>();
  let paused = true,
    disposed = false,
    raf = 0,
    last = performance.now(),
    accumulator = 0,
    lastHud = 0,
    frames = 0,
    lastFps = performance.now(),
    fps = 60;
  let audioStatus = "idle";
  let sound = false,
    lastHorn = 0;
  const streetAudio = createStreetAudio((status) => {
    audioStatus = status;
    renderer.domElement.dataset.audioStatus = status;
  });
  let cameraMode: CameraMode = "third-person";
  const cameraTarget = new THREE.Vector3(),
    lookTarget = new THREE.Vector3();
  function publish() {
    onStats({
      cameraMode,
      audioStatus,
      speed: state.speed * 3.6,
      distance: state.distance,
      topSpeed: state.topSpeed,
      street: state.street,
      signal: state.signal,
      time: state.time,
      x: state.x,
      z: state.z,
      yaw: state.yaw,
      impact: state.impact > 0,
      fps,
    });
  }
  function place(snap = false) {
    player.root.position.set(state.x, 0, state.z);
    player.root.rotation.y = state.yaw;
    const portrait = host.clientHeight > host.clientWidth;
    const outside = cameraMode === "third-person";
    const distance = outside
      ? portrait
        ? 9
        : 7.5
      : cameraMode === "behind-driver"
        ? 0.95
        : -0.08;
    const lateral = outside ? 1.8 : cameraMode === "behind-driver" ? 0.48 : 0;
    const height = outside
      ? portrait
        ? 5.8
        : 4.4
      : cameraMode === "behind-driver"
        ? 2.03
        : 1.83;
    camera.near = outside ? 0.1 : 0.04;
    camera.fov = outside ? 55 : 70;
    camera.updateProjectionMatrix();
    cameraTarget.set(
      state.x - Math.sin(state.yaw) * distance + Math.cos(state.yaw) * lateral,
      height,
      state.z - Math.cos(state.yaw) * distance - Math.sin(state.yaw) * lateral,
    );
    if (snap) camera.position.copy(cameraTarget);
    lookTarget.set(
      state.x + Math.sin(state.yaw) * 8,
      outside ? 1.1 : 1.5,
      state.z + Math.cos(state.yaw) * 8,
    );
    camera.lookAt(lookTarget);
    placeTraffic(state.x, state.z);
    lighting.update(state.x, state.z, state.time);
    world.update(state.time);
  }
  function resize() {
    const w = host.clientWidth,
      h = host.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    place(true);
    renderer.render(scene, camera);
  }
  const observer = new ResizeObserver(resize);
  observer.observe(host);
  function updateInput() {
    input.throttle = keys.has("KeyW") || keys.has("ArrowUp");
    input.brake = keys.has("KeyS") || keys.has("ArrowDown");
    input.left = keys.has("KeyA") || keys.has("ArrowLeft");
    input.right = keys.has("KeyD") || keys.has("ArrowRight");
    input.handbrake = keys.has("Space");
    for (const action of touch.values()) input[action] = true;
  }
  function clear() {
    keys.clear();
    touch.clear();
    Object.assign(input, emptyInput());
  }
  function setPaused(value: boolean) {
    paused = value;
    clear();
    accumulator = 0;
    last = performance.now();
    streetAudio.pause(value);
  }
  function horn() {
    if (paused) return;
    lastHorn = performance.now();
    streetAudio.horn();
  }
  const motionKeys = new Set([
    "KeyW",
    "KeyS",
    "KeyA",
    "KeyD",
    "ArrowUp",
    "ArrowDown",
    "ArrowLeft",
    "ArrowRight",
    "Space",
  ]);
  function down(e: KeyboardEvent) {
    if (paused) return;
    if (motionKeys.has(e.code)) {
      e.preventDefault();
      keys.add(e.code);
      updateInput();
    }
    if (e.repeat) return;
    if (e.code === "Escape" || e.code === "KeyP") {
      e.preventDefault();
      setPaused(true);
      onPause();
    }
    if (e.code === "KeyR") {
      e.preventDefault();
      reset();
    }
    if (e.code === "KeyC") {
      e.preventDefault();
      cycleCamera();
    }
    if (e.code === "KeyH") {
      e.preventDefault();
      horn();
    }
  }
  function up(e: KeyboardEvent) {
    if (keys.has(e.code)) {
      e.preventDefault();
      keys.delete(e.code);
      updateInput();
    }
  }
  function blur() {
    if (!paused) {
      setPaused(true);
      onPause();
    }
    clear();
  }
  function visibility() {
    if (document.hidden) blur();
  }
  function lost(e: Event) {
    e.preventDefault();
    setPaused(true);
    onError("Graphics ne chai break le liya. Retry dabaao, phir nikalte hain.");
  }
  window.addEventListener("keydown", down);
  window.addEventListener("keyup", up);
  window.addEventListener("blur", blur);
  document.addEventListener("visibilitychange", visibility);
  renderer.domElement.addEventListener("webglcontextlost", lost);
  function cycleCamera() {
    cameraMode =
      cameraMode === "third-person"
        ? "behind-driver"
        : cameraMode === "behind-driver"
          ? "driver"
          : "third-person";
    player.root.traverse((o) => {
      if (o.userData.driver) o.visible = cameraMode !== "driver";
      // Cut away the roof only for the rear-seat camera to keep the road visible.
      if (o.userData.cabinRoof) o.visible = cameraMode !== "behind-driver";
    });
    renderer.domElement.dataset.cameraMode = cameraMode;
    place(true);
    publish();
    renderer.render(scene, camera);
  }
  function reset() {
    resetDrive(state, traffic);
    clear();
    place(true);
    publish();
    renderer.render(scene, camera);
  }
  function loop(now: number) {
    if (disposed) return;
    raf = requestAnimationFrame(loop);
    const dt = Math.min((now - last) / 1000, 0.1);
    last = now;
    if (!paused) {
      accumulator += dt;
      let ticks = 0;
      while (accumulator >= STEP && ticks < 5) {
        step(state, input, traffic);
        accumulator -= STEP;
        ticks++;
      }
      if (ticks === 5) accumulator %= STEP;
      place();
      camera.position.lerp(cameraTarget, 1 - Math.exp(-5 * dt));
      camera.lookAt(lookTarget);
      player.wheels.forEach((w) => {
        w.rotation.x += (state.speed * dt) / 0.34;
      });
      streetAudio.update(
        state.speed,
        input.throttle,
        traffic.filter((t) => Math.hypot(t.x - state.x, t.z - state.z) < 65)
          .length,
        world.marketIntensity(state.x, state.z),
      );
      renderer.render(scene, camera);
    }
    frames++;
    if (now - lastFps > 1000) {
      fps = Math.round((frames * 1000) / (now - lastFps));
      frames = 0;
      lastFps = now;
    }
    if (now - lastHud > 100) {
      publish();
      lastHud = now;
    }
    renderer.domElement.dataset.horn = now - lastHorn < 250 ? "on" : "off";
  }
  place(true);
  resize();
  publish();
  raf = requestAnimationFrame(loop);
  return {
    cycleCamera,
    setPaused,
    reset,
    pointer(id: number, action: keyof Input | null) {
      if (action && !paused) touch.set(id, action);
      else touch.delete(id);
      updateInput();
    },
    horn,
    sound(enabled: boolean) {
      sound = streetAudio.enable(enabled);
      return sound;
    },
    quality(low: boolean) {
      renderer.setPixelRatio(low ? 0.65 : Math.min(devicePixelRatio, 1.5));
      lighting.quality(low);
      resize();
    },
    dispose() {
      disposed = true;
      cancelAnimationFrame(raf);
      observer.disconnect();
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", blur);
      document.removeEventListener("visibilitychange", visibility);
      renderer.domElement.removeEventListener("webglcontextlost", lost);
      clear();
      streetAudio.dispose();
      const geometries = new Set<THREE.BufferGeometry>(),
        materials = new Set<THREE.Material>(),
        textures = new Set<THREE.Texture>();
      scene.traverse((o) => {
        if (o instanceof THREE.Mesh) {
          geometries.add(o.geometry);
          for (const mat of Array.isArray(o.material)
            ? o.material
            : [o.material]) {
            materials.add(mat);
            for (const value of [
              ...Object.values(mat),
              ...Object.values(mat.userData),
            ])
              if (value instanceof THREE.Texture) textures.add(value);
          }
        }
      });
      geometries.forEach((g) => g.dispose());
      textures.forEach((t) => t.dispose());
      materials.forEach((m) => m.dispose());
      lighting.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      renderer.domElement.remove();
    },
  };
}
export type Engine = ReturnType<typeof createEngine>;
