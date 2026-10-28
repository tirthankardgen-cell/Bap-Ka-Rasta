import {
  introFrame,
  advanceIntro,
  INTRO_DURATION,
  type IntroStage,
} from "./intro";
import { driverHands } from "./intro-visuals";
import { createStreetAudio } from "./audio";
import * as THREE from "three";
import { atmosphere } from "./atmosphere";
import { makeWorld, autoRickshaw, trafficVisuals } from "./world";
import {
  createTrafficHornScheduler,
  steeringAngleFor,
  emptyInput,
  newDrive,
  newTraffic,
  resetDrive,
  step,
  STEP,
  type Input,
} from "./simulation";
import { followCamera, type CameraMode } from "./camera";
import {
  AUTO_DRIVER_EYE_HEIGHT,
  AUTO_PASSENGER_EYE_HEIGHT,
  AUTO_WHEEL_RADIUS,
} from "./auto-model";
export type { CameraMode } from "./camera";
export type Stats = {
  introStage: IntroStage;
  introFade: number;
  speaker: string;
  subtitle: string;
  meaning: string;
  clipId: string;
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
  autoModel: THREE.Group,
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
  const player = autoRickshaw(autoModel);
  scene.add(player.root);
  const traffic = newTraffic();
  const trafficHorn = createTrafficHornScheduler();
  const placeTraffic = trafficVisuals(scene, traffic, autoModel);
  renderer.domElement.dataset.vehicleModel = "mumbai-auto";
  renderer.domElement.dataset.cameraMode = "third-person";
  renderer.domElement.dataset.trafficCount = String(traffic.length);
  const state = newDrive();
  const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 800);
  scene.add(camera);
  const hands = driverHands(camera);
  let introActive = false,
    introStarted = false,
    introTime = 0,
    lowQuality = false;
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
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
    const frame = introFrame(introTime, reducedMotion);
    const greeting = world.crowd.greeting(
      state.time,
      state.x,
      state.z,
      state.speed,
    );
    const stage = !introStarted ? "ready" : introActive ? frame.stage : "done";
    renderer.domElement.dataset.introStage = stage;
    renderer.domElement.dataset.characterCount = String(world.crowd.count);
    onStats({
      introStage: stage,
      introFade: introActive ? frame.fade : 0,
      speaker: introActive ? frame.speaker : greeting.name,
      subtitle: introActive ? frame.caption : greeting.text,
      meaning: introActive ? frame.meaning : "",
      clipId: introActive ? frame.clipId : greeting.clipId,
      cameraMode,
      audioStatus,
      speed: state.speed * 3.6,
      distance: state.distance,
      topSpeed: state.topSpeed,
      street: introActive ? "Apna auto stand" : state.street,
      signal: state.signal,
      time: state.time,
      x: state.x,
      z: state.z,
      yaw: state.yaw,
      impact: state.impact > 0,
      fps,
    });
  }
  function place(snap = false, dt = 0) {
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
        ? AUTO_PASSENGER_EYE_HEIGHT
        : AUTO_DRIVER_EYE_HEIGHT;
    camera.near = outside ? 0.1 : 0.04;
    camera.fov = outside ? 55 : 70;
    camera.updateProjectionMatrix();
    cameraTarget.set(
      state.x - Math.sin(state.yaw) * distance + Math.cos(state.yaw) * lateral,
      height,
      state.z - Math.cos(state.yaw) * distance - Math.sin(state.yaw) * lateral,
    );
    followCamera(camera.position, cameraTarget, cameraMode, dt, snap);
    lookTarget.set(
      state.x + Math.sin(state.yaw) * 8,
      outside ? 1.1 : 1.5,
      state.z + Math.cos(state.yaw) * 8,
    );
    camera.lookAt(lookTarget);
    placeTraffic(state.x, state.z);
    lighting.update(state.x, state.z, state.time);
    world.update(state.time, state.x, state.z, lowQuality);
    hands.update(cameraMode === "driver", false, state.time, reducedMotion);
    if (introActive) placeIntro();
  }
  function driverVisibility(seated: boolean) {
    player.root.traverse((o) => {
      if (o.userData.driver)
        o.visible = seated && (introActive || cameraMode !== "driver");
      if (o.userData.cabinRoof) o.visible = cameraMode !== "behind-driver";
    });
  }
  function placeIntro() {
    const frame = introFrame(introTime, reducedMotion);
    driverVisibility(frame.exterior);
    camera.near = 0.04;
    camera.fov = 70;
    if (!frame.exterior) {
      camera.position.set(frame.x, frame.y, frame.z);
      const entering = Math.max(0, Math.min(1, (introTime - 3) / 3));
      const approach = Math.min(1, introTime / 3);
      lookTarget.set(
        -274 + (state.x + 274) * approach,
        1.5,
        325 - approach - entering * 7,
      );
      camera.lookAt(lookTarget);
    } else {
      camera.fov = 55;
      camera.position.set(state.x - 1.8, 4.4, state.z + 7.5);
      camera.lookAt(state.x, 1.1, state.z - 8);
    }
    camera.updateProjectionMatrix();
    hands.update(!frame.exterior, introTime < 6, introTime, reducedMotion);
    world.update(introTime, state.x, state.z, lowQuality);
  }
  function finishIntro() {
    if (!introActive && introStarted) return;
    introActive = false;
    introStarted = true;
    state.time = Math.max(state.time, introTime);
    introTime = INTRO_DURATION;
    accumulator = 0;
    clear();
    driverVisibility(true);
    place(true);
    publish();
    renderer.render(scene, camera);
  }
  function beginIntro() {
    if (introStarted) return;
    introStarted = true;
    introActive = true;
    introTime = 0;
    clear();
    place(true);
    publish();
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
    publish();
  }
  function horn() {
    if (paused || introActive) return;
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
    if (introActive && e.code === "Enter") {
      e.preventDefault();
      finishIntro();
      return;
    }
    if (motionKeys.has(e.code) && !introActive) {
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
    if (introActive) return;
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
    if (introActive) finishIntro();
    resetDrive(state, traffic);
    clear();
    place(true);
    publish();
    renderer.render(scene, camera);
  }
  function loop(now: number) {
    if (disposed) return;
    raf = requestAnimationFrame(loop);
    const elapsed = Math.max(0, (now - last) / 1000);
    const dt = Math.min(elapsed, 0.1);
    last = now;
    if (!paused && introActive) {
      introTime = advanceIntro(introTime, Math.min(elapsed, 0.5), false);
      placeIntro();
      lighting.update(state.x, state.z, introTime);
      if (introTime >= INTRO_DURATION) finishIntro();
      renderer.render(scene, camera);
    } else if (!paused) {
      accumulator += dt;
      let ticks = 0;
      while (accumulator >= STEP && ticks < 5) {
        step(state, input, traffic);
        accumulator -= STEP;
        ticks++;
      }
      if (ticks === 5) accumulator %= STEP;
      place(false, dt);
      player.steering.rotation.y = steeringAngleFor(state.steer, state.speed);
      const honking = trafficHorn(traffic, state, state.time);
      if (honking) {
        const x = honking.x - state.x,
          z = honking.z - state.z;
        streetAudio.trafficHorn(
          Math.hypot(x, z),
          -(x * Math.cos(state.yaw) - z * Math.sin(state.yaw)) / 10,
        );
      }
      player.wheels.forEach((w) => {
        w.rotation.x += (state.speed * dt) / AUTO_WHEEL_RADIUS;
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
    beginIntro,
    skipIntro: finishIntro,
    setPaused,
    reset,
    pointer(id: number, action: keyof Input | null) {
      if (action && !paused && !introActive) touch.set(id, action);
      else touch.delete(id);
      updateInput();
    },
    horn,
    sound(enabled: boolean) {
      sound = streetAudio.enable(enabled);
      return sound;
    },
    quality(low: boolean) {
      lowQuality = low;
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
