import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/addons/libs/meshopt_decoder.module.js";
import { disposeAutoModel } from "./auto-model.ts";

export const TRAFFIC_MODEL_URL = "/models/gallery-traffic.glb";
export const GALLERY_TRAFFIC = new Map([
  [0, "traffic_thar"], [1, "traffic_fortuner"], [2, "traffic_toto"],
  [5, "traffic_scooty"], [6, "traffic_ktm"],
  [3, "traffic_best_bus"], [7, "traffic_sedan"], [8, "traffic_taxi"],
  [9, "traffic_hatchback"], [10, "traffic_wagon"],
  [11, "traffic_crossover"], [12, "traffic_mpv"],
]);
export type TrafficModels = { source: THREE.Group; vehicles: Map<number, THREE.Object3D> };

export function prepareTrafficModels(source: THREE.Group): TrafficModels {
  const vehicles = new Map<number, THREE.Object3D>();
  for (const [kind, name] of GALLERY_TRAFFIC) {
    const vehicle = source.getObjectByName(name);
    if (!vehicle || vehicle.userData.traffic_kind !== kind)
      throw new Error(`Gallery traffic is missing ${name}`);
    let wheels = 0;
    vehicle.traverse((object) => {
      if (Number.isFinite(object.userData.wheelRadius) && object.userData.wheelRadius > 0)
        wheels++;
    });
    const expectedWheels = kind === 2 ? 3 : kind === 5 || kind === 6 ? 2 : 4;
    if (wheels !== expectedWheels)
      throw new Error(`Gallery traffic has invalid wheel pivots for ${name}`);
    vehicles.set(kind, vehicle);
  }
  source.name = "Gallery traffic resources | Blender";
  source.visible = false;
  return { source, vehicles };
}

/** Session-owned library, downloaded alongside the auto, cast and landmarks. */
export async function loadTrafficModels(signal?: AbortSignal): Promise<TrafficModels> {
  const controller = new AbortController();
  const abort = () => controller.abort();
  if (signal?.aborted) abort();
  signal?.addEventListener("abort", abort, { once: true });
  const timer = setTimeout(abort, 30_000);
  let source: THREE.Group | undefined;
  try {
    const response = await fetch(TRAFFIC_MODEL_URL, { signal: controller.signal });
    if (!response.ok) throw new Error(`Traffic model download failed: ${response.status}`);
    source = (await new GLTFLoader().setMeshoptDecoder(MeshoptDecoder)
      .parseAsync(await response.arrayBuffer(), "/models/")).scene;
    controller.signal.throwIfAborted();
    return prepareTrafficModels(source);
  } catch (error) {
    if (source) disposeAutoModel(source);
    throw error;
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener("abort", abort);
  }
}
