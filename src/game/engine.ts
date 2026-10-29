import { renderPose } from "./render-pose";
import { createRenderBudget } from "./render-budget";
import { type Gear } from "./gears";
import { type IncidentReport, type PedestrianHit } from "./pedestrian-rules";
import {
  introFrame,
  advanceIntro,
  INTRO_DURATION,
  type IntroStage,
} from "./intro";
import { driverHands } from "./intro-visuals";
import { characterPlayerPart, type CharacterModels } from "./character-models";
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
import { landscapeDelta } from "../LandscapeStage";
import { createCameraLook, followCamera, type CameraMode } from "./camera";
import { AUTO_DRIVER_EYE_HEIGHT, AUTO_WHEEL_RADIUS } from "./auto-model";
export type { CameraMode } from "./camera";
export type Stats = {
  gear: Gear;
  incident: IncidentReport | null;
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
  characterModels: CharacterModels,
  initialDrive = newDrive(),
) {
  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    powerPreference: "high-performance",
  });
  const mobile = matchMedia("(any-pointer: coarse)").matches;
  const maxPixelRatio = Math.min(devicePixelRatio, mobile ? 1 : 1.25);
  const renderBudget = createRenderBudget(maxPixelRatio);
  let automaticShadows = !mobile;
  renderer.setPixelRatio(maxPixelRatio);
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
  lighting.quality(!automaticShadows);
  const world = makeWorld(scene, characterModels);
  const player = autoRickshaw(autoModel);
  scene.add(player.root);
  const traffic = newTraffic();
  const trafficHorn = createTrafficHornScheduler();
  const placeTraffic = trafficVisuals(scene, traffic, autoModel);
  // Traffic keeps its cheap anonymous drivers; Sachin is the reference-cast model.
  autoModel.traverse((object) => {
    if (object.userData.driver) {
      object.visible = false;
      object.userData.driver = false;
    }
  });
  const sachin = characterPlayerPart(characterModels, "seated");
  sachin.userData.driver = true;
  player.root.add(sachin);
  renderer.domElement.dataset.vehicleModel = "mumbai-auto";
  renderer.domElement.dataset.characterModels = "blender-reference-cast";
  renderer.domElement.dataset.cameraMode = "third-person";
  renderer.domElement.dataset.trafficCount = String(traffic.length);
  const state = initialDrive;
  const previousPose = { x: state.x, z: state.z, yaw: state.yaw };
  const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 800);
  scene.add(camera);
  const hands = driverHands(camera, characterModels);
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
  let incident: IncidentReport | null = null;
  let incidentTime = 0;
  const incidentCameraStart = new THREE.Vector3();
  const incidentLookStart = new THREE.Vector3();
  const look = createCameraLook();
  const followPosition = new THREE.Vector3();
  const orbit = new THREE.Spherical();
  let lookPointer: number | null = null,
    lookX = 0,
    lookY = 0;
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
    renderer.domElement.dataset.detailedCharacters = String(
      world.crowd.stats.detailed,
    );
    renderer.domElement.dataset.visibleCharacters = String(
      world.crowd.stats.visible,
    );
    onStats({
      gear: state.gear,
      incident,
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
    if (snap)
      Object.assign(previousPose, { x: state.x, z: state.z, yaw: state.yaw });
    const pose = snap
      ? state
      : renderPose(previousPose, state, accumulator / STEP);
    player.root.position.set(pose.x, 0, pose.z);
    player.root.rotation.y = pose.yaw;
    const portrait = host.clientHeight > host.clientWidth;
    const outside = cameraMode === "third-person";
    const distance = outside ? (portrait ? 9 : 7.5) : -0.08;
    const lateral = outside ? 1.8 : 0;
    const height = outside ? (portrait ? 5.8 : 4.4) : AUTO_DRIVER_EYE_HEIGHT;
    camera.near = outside ? 0.1 : 0.04;
    camera.fov = outside ? 55 : 70;
    camera.updateProjectionMatrix();
    cameraTarget.set(
      pose.x - Math.sin(pose.yaw) * distance + Math.cos(pose.yaw) * lateral,
      height,
      pose.z - Math.cos(pose.yaw) * distance - Math.sin(pose.yaw) * lateral,
    );
    followCamera(followPosition, cameraTarget, cameraMode, dt, snap);
    camera.position.copy(followPosition);
    lookTarget.set(
      pose.x + Math.sin(pose.yaw) * 8,
      outside ? 1.1 : 1.5,
      pose.z + Math.cos(pose.yaw) * 8,
    );
    if (outside && (look.yaw || look.pitch)) {
      camera.position.sub(lookTarget);
      orbit.setFromVector3(camera.position);
      orbit.theta += look.yaw;
      orbit.phi = THREE.MathUtils.clamp(
        orbit.phi - look.pitch,
        0.15,
        Math.PI / 2,
      );
      camera.position.setFromSpherical(orbit).add(lookTarget);
    }
    camera.lookAt(lookTarget);
    if (!outside) {
      camera.rotateY(look.yaw);
      camera.rotateX(look.pitch);
    }
    renderer.domElement.dataset.lookYaw = look.yaw.toFixed(3);
    placeTraffic(pose.x, pose.z);
    lighting.update(pose.x, pose.z, state.time);
    world.update(state.time, pose.x, pose.z, lowQuality);
    hands.update(cameraMode === "driver", false, state.time, reducedMotion);
    if (introActive) placeIntro();
    if (incident) placeIncident();
  }
  function driverVisibility(seated: boolean) {
    player.root.traverse((o) => {
      if (o.userData.driver)
        o.visible = seated && (introActive || cameraMode !== "driver");
      if (o.userData.cabinRoof) o.visible = true;
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
    look.reset();
    lookPointer = null;
    keys.clear();
    touch.clear();
    Object.assign(input, emptyInput());
  }
  function setPaused(value: boolean) {
    if (incident) {
      clear();
      return;
    }
    paused = value;
    clear();
    accumulator = 0;
    Object.assign(previousPose, { x: state.x, z: state.z, yaw: state.yaw });
    last = performance.now();
    streetAudio.pause(value);
    publish();
  }
  function horn() {
    if (paused || introActive || incident) return;
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
  function selectGear(gear: Gear) {
    if (paused || introActive || incident) return;
    state.gear = gear;
    publish();
  }
  function down(e: KeyboardEvent) {
    if (paused || incident) return;
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
    const gearKey = /^(?:Digit|Numpad)([1-4])$/.exec(e.code);
    if (gearKey && !introActive) {
      e.preventDefault();
      selectGear(Number(gearKey[1]) as Gear);
    }
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
    if (!paused && !incident) {
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
  const canvas = renderer.domElement;
  canvas.style.touchAction = "none";
  function lookDown(e: PointerEvent) {
    if (
      paused ||
      introActive ||
      incident ||
      lookPointer !== null ||
      e.button !== 0
    )
      return;
    lookPointer = e.pointerId;
    look.dragging = true;
    lookX = e.clientX;
    lookY = e.clientY;
    canvas.setPointerCapture(e.pointerId);
    e.preventDefault();
  }
  function lookMove(e: PointerEvent) {
    if (e.pointerId !== lookPointer) return;
    const d = landscapeDelta(canvas, e.clientX - lookX, e.clientY - lookY);
    look.drag(d.dx, d.dy);
    lookX = e.clientX;
    lookY = e.clientY;
  }
  function lookUp(e: PointerEvent) {
    if (e.pointerId !== lookPointer) return;
    lookPointer = null;
    look.dragging = false;
    if (canvas.hasPointerCapture(e.pointerId))
      canvas.releasePointerCapture(e.pointerId);
  }
  canvas.addEventListener("pointerdown", lookDown);
  canvas.addEventListener("pointermove", lookMove);
  canvas.addEventListener("pointerup", lookUp);
  canvas.addEventListener("pointercancel", lookUp);
  canvas.addEventListener("lostpointercapture", lookUp);

  function cycleCamera() {
    if (introActive || incident) return;
    look.reset();
    cameraMode = cameraMode === "third-person" ? "driver" : "third-person";
    player.root.traverse((o) => {
      if (o.userData.driver) o.visible = cameraMode !== "driver";
      if (o.userData.cabinRoof) o.visible = true;
    });
    renderer.domElement.dataset.cameraMode = cameraMode;
    place(true);
    publish();
    renderer.render(scene, camera);
  }
  function reset() {
    if (incident) return;
    if (introActive) finishIntro();
    resetDrive(state, traffic);
    world.cones.reset();
    clear();
    place(true);
    publish();
    renderer.render(scene, camera);
  }
  function beginIncident(hit: PedestrianHit) {
    // Commit the impact tick to the rendered auto before freezing the scene.
    player.root.position.set(state.x, 0, state.z);
    player.root.rotation.y = state.yaw;
    placeTraffic(state.x, state.z);
    incident = { ...hit, street: state.street, phase: "cinematic", photo: "" };
    incidentTime = 0;
    incidentCameraStart.copy(camera.position);
    camera
      .getWorldDirection(incidentLookStart)
      .multiplyScalar(6)
      .add(camera.position);
    cameraMode = "third-person";
    driverVisibility(true);
    hands.update(false, false, state.time, true);
    clear();
    state.speed = 0;
    accumulator = 0;
    streetAudio.pause(true);
    publish();
  }
  function placeIncident() {
    if (!incident) return;
    const u = reducedMotion ? 1 : Math.min(1, incidentTime / 1.8);
    const ease = u * u * (3 - 2 * u);
    const yaw = incident.yaw;
    cameraTarget.set(
      incident.x - Math.cos(yaw) * 5 + Math.sin(yaw) * 3,
      3.7,
      incident.z + Math.sin(yaw) * 5 + Math.cos(yaw) * 3,
    );
    camera.position.lerpVectors(incidentCameraStart, cameraTarget, ease);
    lookTarget.set(incident.x, 0.65, incident.z);
    lookTarget.lerpVectors(incidentLookStart, lookTarget, ease);
    camera.lookAt(lookTarget);
    camera.near = 0.1;
    camera.fov = 55;
    camera.updateProjectionMatrix();
    world.update(incident.time + incidentTime, state.x, state.z, lowQuality);
  }
  function loop(now: number) {
    if (disposed) return;
    raf = requestAnimationFrame(loop);
    const elapsed = Math.max(0, (now - last) / 1000);
    const dt = Math.min(elapsed, 0.1);
    last = now;
    look.update(elapsed);
    if (incident) {
      if (incident.phase === "cinematic" && !document.hidden) {
        incidentTime += Math.min(elapsed, 0.1);
        placeIncident();
        renderer.render(scene, camera);
        if (incidentTime >= 3.2) {
          // Capture immediately after rendering: this is the actual scene at the incident.
          let photo = "";
          try {
            photo = renderer.domElement.toDataURL("image/jpeg", 0.85);
          } catch {}
          incident = { ...incident, phase: "report", photo };
          publish();
        }
      }
    } else if (!paused && introActive) {
      introTime = advanceIntro(introTime, Math.min(elapsed, 0.5), false);
      placeIntro();
      lighting.update(state.x, state.z, introTime);
      if (introTime >= INTRO_DURATION) finishIntro();
      renderer.render(scene, camera);
    } else if (!paused) {
      if (!lowQuality) {
        const budget = renderBudget.sample(elapsed);
        if (budget) {
          if (automaticShadows && !budget.shadows) {
            automaticShadows = false;
            lighting.quality(true);
          }
          if (budget.changed) {
            renderer.setPixelRatio(budget.ratio);
            renderer.setSize(host.clientWidth, host.clientHeight);
          }
        }
      }
      accumulator += dt;
      let ticks = 0;
      while (accumulator >= STEP && ticks < 5) {
        const before = { x: state.x, z: state.z };
        const previousTime = state.time;
        Object.assign(previousPose, { x: state.x, z: state.z, yaw: state.yaw });
        step(state, input, traffic);
        world.cones.step(before, state, state.speed, STEP);
        const hit = world.crowd.collide(
          before,
          state,
          previousTime,
          state.time,
          state.speed,
        );
        if (hit?.fatal) {
          beginIncident(hit);
          break;
        }
        accumulator -= STEP;
        ticks++;
      }
      if (ticks === 5) accumulator %= STEP;
      if (incident) {
        placeIncident();
        renderer.render(scene, camera);
        return;
      }
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
        state.gear,
      );
      renderer.render(scene, camera);
    }
    frames++;
    if (now - lastFps > 1000) {
      fps = Math.round((frames * 1000) / (now - lastFps));
      frames = 0;
      lastFps = now;
    }
    if (!paused && now - lastHud > 100) {
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
    selectGear,
    cycleCamera,
    beginIntro,
    skipIntro: finishIntro,
    setPaused,
    reset,
    pointer(id: number, action: keyof Input | null) {
      if (action && !paused && !introActive && !incident) touch.set(id, action);
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
      renderBudget.reset();
      automaticShadows = !mobile;
      renderer.setPixelRatio(low ? 0.65 : maxPixelRatio);
      lighting.quality(low || !automaticShadows);
      resize();
    },
    dispose() {
      disposed = true;
      cancelAnimationFrame(raf);
      observer.disconnect();
      canvas.removeEventListener("pointerdown", lookDown);
      canvas.removeEventListener("pointermove", lookMove);
      canvas.removeEventListener("pointerup", lookUp);
      canvas.removeEventListener("pointercancel", lookUp);
      canvas.removeEventListener("lostpointercapture", lookUp);
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
          if (o.customDepthMaterial) materials.add(o.customDepthMaterial);
          if (o.customDistanceMaterial) materials.add(o.customDistanceMaterial);
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
