import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

export const AUTO_MODEL_URL = "/models/mumbai-auto.glb";
export const AUTO_WHEEL_RADIUS = 0.265;
export const AUTO_DRIVER_EYE_HEIGHT = 1.52;
export const AUTO_PASSENGER_EYE_HEIGHT = 1.72;

/** Each game owns a fresh scene and its GPU resources, including after a retry. */
export async function loadAutoRickshaw() {
  const { scene } = await new GLTFLoader().loadAsync(AUTO_MODEL_URL);
  scene.name = "Mumbai kaali-peeli";
  scene.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return;
    object.castShadow = true;
    object.receiveShadow = true;
    for (const material of Array.isArray(object.material)
      ? object.material
      : [object.material]) {
      if (material.transparent) {
        material.depthWrite = false;
        material.side = THREE.DoubleSide;
        object.castShadow = false;
      }
    }
  });
  try {
    autoRickshaw(scene); // Fail at loading, rather than halfway through engine setup.
  } catch (error) {
    disposeAutoModel(scene);
    throw error;
  }
  return scene;
}

export function autoRickshaw(root: THREE.Group) {
  const wheels = ["wheel_rear_left", "wheel_rear_right", "wheel_front"].map(
    (name) => {
      const wheel = root.getObjectByName(name);
      if (!wheel) throw new Error(`Mumbai auto is missing ${name}`);
      return wheel;
    },
  );
  // Separate yaw from axle roll: rotating the spinning wheel itself on Y tilts it.
  let steering = root.getObjectByName("runtime_front_steering");
  if (!steering) {
    const front = wheels[2];
    steering = new THREE.Group();
    steering.name = "runtime_front_steering";
    steering.position.copy(front.position);
    front.parent!.add(steering);
    steering.add(front);
    front.position.set(0, 0, 0);
  }
  return { root, wheels, steering };
}

/** Used when an async load completes after leaving the game screen. */
export function disposeAutoModel(root: THREE.Object3D) {
  const geometries = new Set<THREE.BufferGeometry>();
  const materials = new Set<THREE.Material>();
  const textures = new Set<THREE.Texture>();
  root.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return;
    geometries.add(object.geometry);
    for (const material of Array.isArray(object.material)
      ? object.material
      : [object.material]) {
      materials.add(material);
      for (const value of Object.values(material))
        if (value instanceof THREE.Texture) textures.add(value);
    }
  });
  geometries.forEach((geometry) => geometry.dispose());
  materials.forEach((material) => material.dispose());
  textures.forEach((texture) => texture.dispose());
}
