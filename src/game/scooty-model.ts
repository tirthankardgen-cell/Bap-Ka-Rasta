import * as THREE from "three";
import type { TrafficModels } from "./traffic-models.ts";
import type { CharacterModels } from "./character-models.ts";
import { riderBrakePose } from "./scooty-braking.ts";

/** Riya's face uses the authored female cast, fitted to the scooter's seated rider. */
function riderHead(models: CharacterModels) {
  const template = models.cast.get("pooja")!.detail;
  const source = template.geometry;
  const joints = source.getAttribute("castJoint"), index = source.index!;
  const indices: number[] = [];
  for (let i = 0; i < index.count; i += 3) {
    const triangle = [index.getX(i), index.getX(i + 1), index.getX(i + 2)];
    if (triangle.every((v) => joints.getX(v) === 3)) indices.push(...triangle);
  }
  const selected = source.clone().setIndex(indices);
  const geometry = selected.toNonIndexed();
  selected.dispose();
  for (const name of ["castJoint", "castPivot", "castParentPivot"])
    geometry.deleteAttribute(name);
  geometry.computeBoundingBox();
  const top = geometry.boundingBox!.max.y;
  geometry.scale(0.68, 0.68, 0.68);
  geometry.translate(0, 1.775 - top * 0.68, -0.17);
  const head = new THREE.Mesh(geometry, template.material);
  head.name = "Riya | female rider face and ponytail";
  head.castShadow = head.receiveShadow = true;

  // Open-face helmet: retain the shell around the temples and back, expose the face.
  const shell = new THREE.SphereGeometry(1, 28, 20, 0, Math.PI * 2, 0, 2.05);
  const positions = shell.getAttribute("position"), shellIndex = shell.index!;
  const shellIndices: number[] = [];
  for (let i = 0; i < shellIndex.count; i += 3) {
    const triangle = [shellIndex.getX(i), shellIndex.getX(i + 1), shellIndex.getX(i + 2)];
    const y = triangle.reduce((n, v) => n + positions.getY(v), 0) / 3;
    const z = triangle.reduce((n, v) => n + positions.getZ(v), 0) / 3;
    if (z < 0.3 || y > 0.37) shellIndices.push(...triangle);
  }
  shell.setIndex(shellIndices);
  shell.scale(0.203, 0.205, 0.196);
  shell.translate(0, 1.65, -0.162);
  const helmet = new THREE.Mesh(shell, new THREE.MeshStandardMaterial({
    color: "#f3e8d4", roughness: 0.36, metalness: 0.18, side: THREE.DoubleSide,
  }));
  helmet.name = "Riya | ivory riding helmet";
  helmet.castShadow = helmet.receiveShadow = true;
  const strap = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.165, 1.62, -0.13), new THREE.Vector3(-0.16, 1.51, -0.07),
    new THREE.Vector3(0, 1.493, 0), new THREE.Vector3(0.16, 1.51, -0.07),
    new THREE.Vector3(0.165, 1.62, -0.13),
  ]), 20, 0.009, 6, false), new THREE.MeshStandardMaterial({ color: "#28363b", roughness: 0.9 }));
  strap.name = "Riya | helmet chin strap";
  const stripe = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 1.68, -0.359), new THREE.Vector3(0, 1.79, -0.307),
    new THREE.Vector3(0, 1.858, -0.162), new THREE.Vector3(0, 1.79, -0.017),
    new THREE.Vector3(0, 1.73, 0.023),
  ]), 24, 0.01, 8, false), new THREE.MeshStandardMaterial({ color: "#068e97", roughness: 0.45 }));
  stripe.name = "Riya | teal helmet stripe";
  const group = new THREE.Group();
  group.name = "Riya | helmeted female scooty rider";
  group.userData.driver = true;
  group.add(head, helmet, strap, stripe);
  return group;
}

/** Reuse the shipped Blender scooter without changing any traffic templates. */
export function createPlayerScooty(traffic: TrafficModels, characters: CharacterModels) {
  const template = traffic.vehicles.get(5);
  if (!template) throw new Error("Mumbai scooty model is missing");
  const model = template.clone(true);
  model.name = "Mumbai turquoise scooty | Riya";
  const root = new THREE.Group(), lean = new THREE.Group();
  root.name = "Player scooty";
  root.userData.driverGender = "female";
  root.userData.driverName = "Riya";
  root.add(lean);
  lean.add(model);
  model.updateMatrixWorld(true);

  const firstPersonBody = new THREE.Group();
  firstPersonBody.name = "Riya | vehicle-anchored first-person body";
  firstPersonBody.visible = false;
  const riders: THREE.Mesh[] = [];
  const posedRiders: THREE.Mesh[] = [];
  const wheels: THREE.Object3D[] = [];
  model.traverse((object) => {
    if (Number.isFinite(object.userData.wheelRadius)) wheels.push(object);
    if (!(object instanceof THREE.Mesh)) return;
    object.castShadow = object.receiveShadow = true;
    if (object.userData.rider) riders.push(object);
  });
  if (wheels.length !== 2 || !riders.length) throw new Error("Scooty needs two wheels and a seated rider");
  for (const rider of riders) {
    const bounds = new THREE.Box3().setFromObject(rider);
    // Replace the anonymous closed helmet and hair with the female cast head.
    if (bounds.min.y > 1.47 || (bounds.max.z < -0.2 && bounds.max.y > 1.55)) {
      rider.removeFromParent();
      continue;
    }
    rider.userData.driver = true;
    rider.geometry = rider.geometry.clone();
    posedRiders.push(rider);
    const body = rider.clone();
    body.userData.driver = false;
    body.name = `Riya first-person | ${rider.name}`;
    const geometry = rider.geometry.clone();
    const index = geometry.index!, position = geometry.getAttribute("position");
    const point = new THREE.Vector3(), indices: number[] = [];
    for (let i = 0; i < index.count; i += 3) {
      const triangle = [index.getX(i), index.getX(i + 1), index.getX(i + 2)];
      if (triangle.every((v) => point.fromBufferAttribute(position, v).applyMatrix4(rider.matrixWorld).y < 1.48))
        indices.push(...triangle);
    }
    geometry.setIndex(indices);
    body.geometry = geometry;
    firstPersonBody.add(body);
    posedRiders.push(body);
  }
  const head = riderHead(characters);
  head.traverse((o) => { if (o instanceof THREE.Mesh) posedRiders.push(o); });
  model.add(head, firstPersonBody);
  const updateBrakePose = riderBrakePose(posedRiders);

  // Keep front-wheel yaw separate from the rolling axle.
  const front = wheels.reduce((a, b) => a.position.z > b.position.z ? a : b);
  const steering = new THREE.Group();
  steering.name = "Scooty front steering";
  steering.position.copy(front.position);
  front.parent!.add(steering);
  steering.add(front);
  front.position.set(0, 0, 0);

  const dial = new THREE.Group();
  dial.name = "Scooty speedometer";
  dial.position.set(0, 1.282, 0.29);
  const needle = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.004, 0.046),
    new THREE.MeshStandardMaterial({ color: "#fff0c4", roughness: 0.5 }));
  needle.position.z = 0.017;
  dial.add(needle);
  model.add(dial);
  function setSpeed(speed: number) {
    dial.rotation.y = 2.25 - Math.min(60, Math.abs(speed) * 3.6) / 60 * 4.5;
  }
  setSpeed(0);
  return {
    root, wheels, steering, setSpeed, firstPersonBody, lean, updateBrakePose,
    updateLean(angle: number, speed: number, dt: number, reducedMotion: boolean, footBrake = 0) {
      const bank = reducedMotion ? 0 : -THREE.MathUtils.clamp(speed * speed / 1.26 * Math.tan(angle) / 9.81, -0.28, 0.28);
      lean.rotation.z = footBrake === 1 ? 0
        : (lean.rotation.z + (bank - lean.rotation.z) * (1 - Math.exp(-9 * dt))) * (1 - footBrake);
    },
  };
}
