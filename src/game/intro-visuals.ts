import * as THREE from "three";
import {
  characterPlayerPart,
  type CharacterModels,
} from "./character-models.ts";

/** Keep the seated torso, arms and legs in vehicle space while looking around.
 * The camera occupies the head, so only that geometry is omitted in first person.
 * Walking/keys in the opening still use the separate camera-space view below.
 */
export function seatedDriverView(vehicle: THREE.Object3D, models: CharacterModels) {
  const body = characterPlayerPart(models, "seated");
  const geometry = body.geometry.clone();
  const position = geometry.getAttribute("position");
  const sourceIndex = geometry.index;
  const indices: number[] = [];
  for (let i = 0; i < (sourceIndex?.count ?? position.count); i += 3) {
    const a = sourceIndex ? sourceIndex.getX(i) : i;
    const b = sourceIndex ? sourceIndex.getX(i + 1) : i + 1;
    const c = sourceIndex ? sourceIndex.getX(i + 2) : i + 2;
    if (Math.max(position.getY(a), position.getY(b), position.getY(c)) < 1.41)
      indices.push(a, b, c);
  }
  geometry.setIndex(indices);
  body.geometry = geometry;
  body.name = "Sachin seated first-person body | vehicle anchored";
  body.visible = false;
  vehicle.add(body);
  return body;
}

export function driverHands(camera: THREE.Camera, models: CharacterModels) {
  const group = new THREE.Group();
  group.name = "Sachin first-person hands | Blender";
  const left = characterPlayerPart(models, "hand_left");
  const right = characterPlayerPart(models, "hand_right");
  const keys = characterPlayerPart(models, "keys");
  group.add(left, right, keys);
  camera.add(group);
  return {
    update(visible: boolean, walking: boolean, time: number, reduced: boolean) {
      group.visible = visible;
      keys.visible = walking;
      left.visible = !walking;
      group.position.y = walking && !reduced ? Math.sin(time * 6) * 0.012 : 0;
    },
  };
}
