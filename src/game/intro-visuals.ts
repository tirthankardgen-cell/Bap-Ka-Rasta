import * as THREE from "three";

export function driverHands(camera: THREE.Camera) {
  const group = new THREE.Group(),
    key = new THREE.Group();
  const geometry = new THREE.BoxGeometry(1, 1, 1);
  const khaki = new THREE.MeshStandardMaterial({
    color: "#ad956d",
    roughness: 0.9,
  });
  const skin = new THREE.MeshStandardMaterial({
    color: "#bd8755",
    roughness: 0.9,
  });
  const metal = new THREE.MeshStandardMaterial({
    color: "#aab4ad",
    metalness: 0.75,
    roughness: 0.3,
  });
  const arms: THREE.Group[] = [];
  for (const side of [-1, 1]) {
    const arm = new THREE.Group();
    const sleeve = new THREE.Mesh(geometry, khaki);
    sleeve.scale.set(0.14, 0.17, 0.4);
    sleeve.position.z = 0.12;
    arm.add(sleeve);
    const hand = new THREE.Mesh(geometry, skin);
    hand.scale.set(0.13, 0.12, 0.14);
    hand.position.z = -0.12;
    arm.add(hand);
    arm.position.set(side * 0.28, -0.36, -0.55);
    group.add(arm);
    arms.push(arm);
  }
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(0.045, 0.008, 5, 12),
    metal,
  );
  key.add(ring);
  const blade = new THREE.Mesh(geometry, metal);
  blade.scale.set(0.018, 0.1, 0.015);
  blade.position.y = -0.08;
  key.add(blade);
  key.position.set(0.28, -0.32, -0.73);
  group.add(key);
  camera.add(group);
  return {
    update(visible: boolean, walking: boolean, time: number, reduced: boolean) {
      group.visible = visible;
      key.visible = walking;
      arms[0].visible = !walking;
      group.position.y = walking && !reduced ? Math.sin(time * 6) * 0.012 : 0;
    },
  };
}
