import * as THREE from "three";
import {
  characterPlayerPart,
  type CharacterModels,
} from "./character-models.ts";

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
