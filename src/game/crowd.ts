import { createCrowdMotion } from "./crowd-motion.ts";
import { createPedestrianRules, fallPose } from "./pedestrian-rules.ts";
import * as THREE from "three";
import {
  characters,
  createActors,
  type Character,
  type Actor,
} from "./characters.ts";

type Part = {
  x: number;
  y: number;
  z: number;
  w: number;
  h: number;
  d: number;
  color: THREE.Color;
  limb: number;
  fixed?: boolean;
};
function partsFor(c: Character, a: Actor): Part[] {
  const parts: Part[] = [];
  const box = (
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    d: number,
    color: string,
    limb = 0,
  ) => parts.push({ x, y, z, w, h, d, color: new THREE.Color(color), limb });
  const shades = ["#a6734e", "#bf8c64", "#875d42", "#d09c75", "#ae7e58"];
  const skin = a.named ? c.skin : shades[a.variant % shades.length];
  const shirt = new THREE.Color(c.shirt);
  if (!a.named && !["nilesh", "jyoti", "pooja"].includes(c.id))
    shirt.offsetHSL(
      ((a.variant % 4) - 1.5) * 0.025,
      0,
      ((a.variant % 3) - 1) * 0.055,
    );
  const top = "#" + shirt.getHexString();
  box(0, 1.23, 0, 0.56, 0.65, 0.34, top);
  box(0, 1.83, 0, 0.4, 0.43, 0.4, skin);
  box(0, 2.07, -0.01, 0.44, 0.13, 0.43, c.hair);
  if (["sari", "kurta"].includes(c.style ?? "")) {
    box(0, 0.86, 0, 0.59, c.style === "sari" ? 0.85 : 0.35, 0.38, top);
    box(-0.18, 1.25, 0.19, 0.15, 0.65, 0.04, c.trousers);
    box(0, 0.47, 0.21, 0.59, 0.07, 0.03, c.trousers);
    box(0, 1.98, -0.25, 0.28, 0.25, 0.2, c.hair);
  }
  for (const side of [-1, 1]) {
    box(side * 0.15, 0.5, 0, 0.22, 0.67, 0.25, c.trousers, side);
    box(side * 0.15, 0.12, 0.06, 0.25, 0.17, 0.36, "#35342c");
    box(side * 0.37, 1.21, 0, 0.18, 0.54, 0.22, top, -side * 2);
    box(side * 0.37, 0.92, 0, 0.17, 0.18, 0.2, skin, -side * 2);
    box(side * 0.09, 1.88, 0.207, 0.055, 0.055, 0.018, "#262921");
    box(side * 0.14, 1.4, 0.18, 0.12, 0.12, 0.03, top);
  }
  box(0, 1.72, 0.21, 0.14, 0.025, 0.025, "#694638");
  if (c.moustache) box(0, 1.77, 0.22, 0.2, 0.05, 0.035, c.hair);
  if (["asha", "pooja"].includes(c.id))
    box(0, 1.94, -0.3, 0.21, 0.38, 0.19, c.hair);
  if (c.id === "zoya")
    for (const side of [-1, 1])
      box(side * 0.21, 1.98, -0.06, 0.08, 0.27, 0.34, c.hair);
  if (c.hat) {
    box(0, 2.16, 0, 0.47, 0.16, 0.46, c.hat);
    box(0, 2.08, 0.2, 0.46, 0.04, 0.2, c.hat);
  }
  switch (c.prop) {
    case "towel":
      box(-0.2, 1.48, 0.2, 0.17, 0.55, 0.08, "#e5d7bd");
      break;
    case "chai":
      box(0.41, 1.1, 0.23, 0.24, 0.24, 0.22, "#c2c5be");
      box(0.41, 1.26, 0.23, 0.14, 0.06, 0.12, "#555d58");
      break;
    case "wrench":
      box(0.43, 1.08, 0.18, 0.07, 0.48, 0.08, "#9ca7a8");
      box(0.43, 1.34, 0.18, 0.19, 0.06, 0.08, "#9ca7a8");
      break;
    case "headphones":
      box(0, 1.6, -0.05, 0.48, 0.06, 0.15, "#232c32");
      for (const s of [-1, 1])
        box(s * 0.26, 1.54, 0, 0.13, 0.17, 0.18, "#263a46");
      break;
    case "flowers":
    case "fruit":
    case "crate":
      box(0, 0.96, 0.39, 0.72, 0.28, 0.4, "#98744a");
      for (let i = 0; i < 6; i++)
        box(
          -0.27 + (i % 3) * 0.27,
          1.14,
          0.27 + Math.floor(i / 3) * 0.22,
          0.17,
          0.16,
          0.17,
          c.prop === "flowers"
            ? i % 2
              ? "#f4c63d"
              : "#ec7b2b"
            : i % 2
              ? "#8ba444"
              : "#c86339",
        );
      break;
    case "paper":
    case "sketchbook":
      box(
        0.42,
        1.08,
        0.16,
        0.32,
        0.4,
        0.09,
        c.prop === "paper" ? "#dfddc9" : "#d7b47e",
      );
      box(0.42, 1.2, 0.212, 0.24, 0.025, 0.012, "#656860");
      break;
    case "tiffins":
      for (let i = 0; i < 3; i++)
        box(0.48, 0.8 + i * 0.16, 0.16, 0.25, 0.14, 0.25, "#b8bdb7");
      box(0.48, 1.13, 0.16, 0.04, 0.55, 0.04, "#565d57");
      break;
    case "whistle":
      box(0, 1.48, 0.2, 0.035, 0.27, 0.03, "#b34b3e");
      box(0, 1.31, 0.24, 0.08, 0.07, 0.1, "#b4bcb9");
      break;
    case "badge":
      box(0, 1.43, 0.18, 0.035, 0.3, 0.03, "#455b7b");
      box(0, 1.26, 0.2, 0.13, 0.18, 0.025, "#e4e4d7");
      break;
    case "glasses":
      for (const s of [-1, 1])
        box(s * 0.105, 1.88, 0.23, 0.17, 0.09, 0.03, "#3a4143");
      box(0.42, 0.85, 0, 0.12, 0.42, 0.46, "#6a5039");
      break;
    case "broom":
      box(0.47, 0.94, 0.12, 0.05, 1.6, 0.05, "#947743");
      box(0.47, 0.18, 0.16, 0.3, 0.3, 0.12, "#c2a66c");
      for (const s of [-1, 1])
        box(s * 0.17, 1.26, 0.19, 0.1, 0.6, 0.04, "#c3cd4f");
      break;
    case "camera":
      box(0, 1.26, 0.25, 0.29, 0.2, 0.16, "#343e3a");
      box(0, 1.26, 0.36, 0.13, 0.12, 0.1, "#778383");
      break;
    case "bottle":
      box(0.42, 0.99, 0.17, 0.12, 0.33, 0.12, "#45a5a1");
      box(0.42, 1.18, 0.17, 0.08, 0.05, 0.08, "#e1dfc9");
      break;
    default:
      box(
        0,
        1.25,
        -0.3,
        0.4,
        0.53,
        0.24,
        c.prop === "delivery" ? "#413f3a" : "#775b41",
      );
  }
  if (
    a.named &&
    ["meera", "lata", "farah", "suresh", "sameer"].includes(c.id)
  ) {
    const stationStart = parts.length;
    // Each named shopkeeper gets a recognizable station on the outer pavement.
    box(0, 0.7, -1, 1.55, 0.12, 0.7, "#99784f");
    for (const s of [-1, 1]) box(s * 0.65, 0.35, -1, 0.1, 0.7, 0.5, "#475e52");
    box(0, 2.65, -1, 1.8, 0.13, 0.85, c.shirt);
    for (const s of [-1, 1])
      box(s * 0.73, 1.7, -1.2, 0.06, 1.85, 0.06, "#665a43");
    for (let i = 0; i < 4; i++)
      box(
        -0.5 + i * 0.32,
        0.89,
        -1,
        0.22,
        0.22,
        0.24,
        ["#c4c6b7", "#deb943", "#b8724f", "#9baf69"][i],
      );
    for (const part of parts.slice(stationStart)) part.fixed = true;
  }
  return parts;
}
export function makeCrowd(
  scene: THREE.Scene,
  heightAt: (x: number, z: number) => number,
) {
  const actors = createActors();
  const rules = createPedestrianRules(actors);
  const motion = createCrowdMotion(actors, (a, time) => {
    const hit = rules.reactions.get(a.id);
    return hit && (hit.fatal || time - hit.time < 5) ? hit : undefined;
  });
  const reduced =
    typeof matchMedia !== "undefined" &&
    matchMedia("(prefers-reduced-motion: reduce)").matches;
  const stain = new THREE.Mesh(
    new THREE.CircleGeometry(0.45, 24),
    new THREE.MeshBasicMaterial({
      color: "#782e2b",
      transparent: true,
      opacity: 0.7,
      depthWrite: false,
    }),
  );
  stain.rotation.x = -Math.PI / 2;
  stain.visible = false;
  const rigs = actors.map((a) => partsFor(characters[a.character], a));
  const mesh = new THREE.InstancedMesh(
    new THREE.BoxGeometry(1, 1, 1),
    new THREE.MeshStandardMaterial({ color: "#ffffff", roughness: 0.92 }),
    rigs.reduce((n, r) => n + r.length, 0),
  );
  mesh.name = "Mumbai street characters";
  mesh.frustumCulled = false;
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  scene.add(mesh);
  stain.name = "Incident blood mark";
  scene.add(stain);
  const root = new THREE.Object3D(),
    part = new THREE.Object3D(),
    matrix = new THREE.Matrix4();
  let lastLow = false;
  let last = -1,
    lastX = Infinity,
    lastZ = Infinity;
  let subtitle = { name: "", text: "", clipId: "", until: 0 },
    nextSpeech = 20;
  const spoken = new Map<number, number>();
  return {
    count: actors.length,
    collide(
      before: { x: number; z: number },
      after: { x: number; z: number; yaw: number },
      previousTime: number,
      time: number,
      speed: number,
    ) {
      if (Math.abs(speed) < 0.3) return null;
      const p0 = motion.sample(previousTime),
        p1 = motion.sample(time);
      return rules.collide(before, after, previousTime, time, speed, p0, p1);
    },
    update(time: number, x: number, z: number, low = false) {
      if (
        low === lastLow &&
        Math.floor(time * (low ? 10 : 20)) === last &&
        Math.hypot(x - lastX, z - lastZ) < 2
      )
        return;
      lastLow = low;
      last = Math.floor(time * (low ? 10 : 20));
      lastX = x;
      lastZ = z;
      const poses = motion.sample(time);
      let index = 0;
      for (let i = 0; i < actors.length; i++) {
        const a = actors[i],
          base = poses[i],
          reaction = rules.reactions.get(a.id),
          reacting = reaction && (reaction.fatal || time - reaction.time < 5),
          p = reacting
            ? {
                x: reaction.x,
                z: reaction.z,
                moving: false,
                yaw: reaction.fatal
                  ? reaction.yaw
                  : Math.atan2(x - reaction.x, z - reaction.z),
              }
            : base;
        if (Math.hypot(p.x - x, p.z - z) > (low ? 90 : 150)) continue;
        const size = a.named ? 1 : 0.94 + (a.variant % 5) * 0.025;
        root.position.set(p.x, heightAt(p.x, p.z), p.z);
        root.rotation.set(0, p.yaw, 0, "YXZ");
        root.scale.setScalar(size);
        root.updateMatrix();
        const standing = root.matrix.clone();
        if (reacting) {
          const position = root.position.clone(),
            rotation = root.quaternion.clone();
          root.position.set(base.x, heightAt(base.x, base.z), base.z);
          root.rotation.set(0, base.yaw, 0, "YXZ");
          root.updateMatrix();
          standing.copy(root.matrix);
          root.position.copy(position);
          root.quaternion.copy(rotation);
          root.updateMatrix();
        }
        if (reacting && reaction.fatal) {
          const fall = fallPose(reaction, time, reduced);
          root.position.set(
            fall.x,
            Math.max(0.14, heightAt(fall.x, fall.z)) + fall.lift,
            fall.z,
          );
          root.rotation.x = fall.tilt;
          root.updateMatrix();
          stain.visible = fall.blood > 0;
          stain.position.set(
            fall.x +
              Math.sin(reaction.yaw) * 0.8 -
              Math.cos(reaction.yaw) * 0.32,
            Math.max(0.14, heightAt(fall.x, fall.z) + 0.015),
            fall.z +
              Math.cos(reaction.yaw) * 0.8 +
              Math.sin(reaction.yaw) * 0.32,
          );
          stain.scale.set(fall.blood, fall.blood * 0.7, 1);
        }
        const swing = p.moving ? Math.sin(time * 5.6 + i) * 0.3 : 0;
        for (const b of rigs[i]) {
          part.position.set(b.x, b.y, b.z);
          part.scale.set(b.w, b.h, b.d);
          part.rotation.set(b.limb ? swing * Math.sign(b.limb) : 0, 0, 0);
          if (
            !reacting &&
            !p.moving &&
            a.activity === "work" &&
            Math.abs(b.limb) === 2
          )
            part.rotation.x = Math.sin(time * 2 + i) * 0.13 - 0.2;
          if (
            !reacting &&
            a.named &&
            a.character === 1 &&
            time < 6 &&
            b.limb === -2
          ) {
            const wave = 2.2 + Math.sin(time * 5) * 0.15;
            const offset = b.y - 1.5;
            part.position.set(
              b.x - Math.sin(wave) * offset,
              1.5 + Math.cos(wave) * offset,
              b.z,
            );
            part.rotation.set(0, 0, wave);
          }
          if (reacting && !reaction.fatal && Math.abs(b.limb) === 2)
            part.rotation.x = -0.9 + Math.sin(time * 9) * 0.16;
          part.updateMatrix();
          matrix.multiplyMatrices(
            b.fixed ? standing : root.matrix,
            part.matrix,
          );
          mesh.setMatrixAt(index, matrix);
          mesh.setColorAt(index, b.color);
          index++;
        }
      }
      mesh.count = index;
      mesh.instanceMatrix.clearUpdateRanges();
      if (index) mesh.instanceMatrix.addUpdateRange(0, index * 16);
      mesh.instanceMatrix.needsUpdate = true;
      if (mesh.instanceColor) {
        mesh.instanceColor.clearUpdateRanges();
        if (index) mesh.instanceColor.addUpdateRange(0, index * 3);
        mesh.instanceColor.needsUpdate = true;
      }
    },
    greeting(time: number, x: number, z: number, speed: number) {
      for (const hit of rules.reactions.values())
        if (!hit.fatal && time - hit.time < 5)
          return {
            name: hit.name,
            text: hit.line,
            clipId: "",
            until: hit.time + 5,
          };
      if (time >= nextSpeech && Math.abs(speed) < 3.3) {
        const actor = actors.find(
          (a) =>
            a.named &&
            a.character !== 7 &&
            Math.hypot(a.home!.x - x, a.home!.z - z) < 10 &&
            time - (spoken.get(a.id) ?? -1000) > 120,
        );
        if (actor) {
          const c = characters[actor.character];
          subtitle = {
            name: c.name,
            text: c.line,
            clipId: `mum_${c.id}_${c.clip}_01`,
            until: time + 5,
          };
          spoken.set(actor.id, time);
          nextSpeech = time + 35;
        }
      }
      return time < subtitle.until
        ? subtitle
        : { name: "", text: "", clipId: "", until: 0 };
    },
  };
}
