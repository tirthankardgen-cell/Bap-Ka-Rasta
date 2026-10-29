import * as THREE from "three";
import { createCones } from "./cones.ts";

export function makeCones(
  scene: THREE.Scene,
  heightAt: (x: number, z: number) => number,
) {
  const physics = createCones();
  const orange = new THREE.MeshStandardMaterial({
    color: "#f57824",
    roughness: 0.8,
  });
  const white = new THREE.MeshStandardMaterial({
    color: "#fff5db",
    roughness: 0.6,
  });
  const rubber = new THREE.MeshStandardMaterial({
    color: "#27332f",
    roughness: 0.95,
  });
  const body = new THREE.CylinderGeometry(0.055, 0.32, 0.85, 16);
  const band = new THREE.CylinderGeometry(0.14, 0.2, 0.18, 16);
  const base = new THREE.BoxGeometry(0.76, 0.1, 0.76);
  const models = physics.cones.map(() => {
    const group = new THREE.Group();
    group.name = "Knockable traffic cone";
    const shell = new THREE.Mesh(body, orange);
    const stripe = new THREE.Mesh(band, white);
    stripe.position.y = 0.06;
    const foot = new THREE.Mesh(base, rubber);
    foot.position.y = -0.43;
    group.add(shell, stripe, foot);
    group.traverse((o) => {
      if (o instanceof THREE.Mesh) {
        o.castShadow = true;
        o.receiveShadow = true;
      }
    });
    scene.add(group);
    return group;
  });
  function update(x: number, z: number) {
    physics.cones.forEach((c, i) => {
      const model = models[i];
      model.visible = Math.hypot(c.x - x, c.z - z) < 220;
      model.position.set(c.x, c.y, c.z);
      model.rotation.set(0, c.yaw, 0);
      model.rotateX(c.tilt);
    });
  }
  return {
    reset: physics.reset,
    step: (
      before: { x: number; z: number },
      after: { x: number; z: number; yaw: number },
      speed: number,
      dt: number,
    ) => physics.step(before, after, speed, dt, heightAt),
    update,
  };
}
