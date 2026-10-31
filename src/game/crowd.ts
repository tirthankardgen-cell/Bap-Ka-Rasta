import { createCrowdMotion } from "./crowd-motion.ts";
import { createPedestrianRules, fallPose } from "./pedestrian-rules.ts";
import * as THREE from "three";
import { characters, createActors, type Actor } from "./characters.ts";
import { createDialogueDirector, type SpeechProgress } from "./dialogue.ts";

import {
  CHARACTER_DETAIL_LIMIT,
  CHARACTER_LOW_DETAIL_LIMIT,
  makeCastBatch,
  finishCastBatch,
  type CharacterModels,
} from "./character-models.ts";

/** Vendor furniture belongs to the pavement, independently of actor animation. */
function makeStalls(
  scene: THREE.Scene,
  actors: Actor[],
  heightAt: (x: number, z: number) => number,
) {
  const parts: { matrix: THREE.Matrix4; color: THREE.Color }[] = [];
  const root = new THREE.Object3D(),
    part = new THREE.Object3D();
  for (const a of actors) {
    const c = characters[a.character];
    if (
      !a.named ||
      !["meera", "lata", "farah", "suresh", "sameer"].includes(c.id)
    )
      continue;
    const home = a.home!;
    root.position.set(home.x, heightAt(home.x, home.z), home.z);
    root.rotation.y = home.yaw;
    root.updateMatrix();
    const box = (
      x: number,
      y: number,
      z: number,
      w: number,
      h: number,
      d: number,
      color: string,
    ) => {
      part.position.set(x, y, z);
      part.scale.set(w, h, d);
      part.updateMatrix();
      parts.push({
        matrix: new THREE.Matrix4().multiplyMatrices(root.matrix, part.matrix),
        color: new THREE.Color(color),
      });
    };
    box(0, 0.7, -1, 1.55, 0.12, 0.7, "#99784f");
    for (const side of [-1, 1])
      box(side * 0.65, 0.35, -1, 0.1, 0.7, 0.5, "#475e52");
    box(0, 2.65, -1, 1.8, 0.13, 0.85, c.shirt);
    for (const side of [-1, 1])
      box(side * 0.73, 1.7, -1.2, 0.06, 1.85, 0.06, "#665a43");
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
  }
  const mesh = new THREE.InstancedMesh(
    new THREE.BoxGeometry(),
    new THREE.MeshStandardMaterial({ roughness: 0.9 }),
    parts.length,
  );
  mesh.name = "Named vendors' pavement furniture";
  mesh.receiveShadow = true;
  parts.forEach((p, i) => {
    mesh.setMatrixAt(i, p.matrix);
    mesh.setColorAt(i, p.color);
  });
  mesh.computeBoundingSphere();
  scene.add(mesh);
}

export function makeCrowd(
  scene: THREE.Scene,
  heightAt: (x: number, z: number) => number,
  models: CharacterModels,
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
  scene.add(models.source);
  makeStalls(scene, actors, heightAt);
  const batches = new Map<
    number,
    {
      detail: ReturnType<typeof makeCastBatch>;
      crowd: ReturnType<typeof makeCastBatch>;
    }
  >();
  for (let c = 1; c < characters.length; c++) {
    const capacity = actors.filter((a) => a.character === c).length;
    const template = models.cast.get(characters[c].id)!;
    const detail = makeCastBatch(
      template.detail,
      Math.min(capacity, CHARACTER_DETAIL_LIMIT),
      models,
      `${characters[c].id} | Blender detail`,
      true,
    );
    const crowd = makeCastBatch(
      template.crowd,
      capacity,
      models,
      `${characters[c].id} | Blender crowd`,
      false,
    );
    detail.mesh.userData.characterId = crowd.mesh.userData.characterId =
      characters[c].id;
    scene.add(detail.mesh, crowd.mesh);
    batches.set(c, { detail, crowd });
  }
  const tints = actors.map((a) =>
    a.named
      ? new THREE.Color(1, 1, 1)
      : new THREE.Color().setRGB(
          0.91 + (a.variant % 4) * 0.025,
          0.91 + (a.variant % 3) * 0.025,
          0.9 + (a.variant % 5) * 0.02,
        ),
  );
  stain.name = "Incident blood mark";
  scene.add(stain);
  const root = new THREE.Object3D();
  const stats = { visible: 0, detailed: 0, triangles: 0 };
  let lastLow = false;
  let last = -1,
    lastX = Infinity,
    lastZ = Infinity;
  const dialogue = createDialogueDirector(actors);
  return {
    count: actors.length,
    stats,
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
      models.time.value = time;
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
      const distances = poses.map((p) => Math.hypot(p.x - x, p.z - z));
      const detailed = new Set(
        actors
          .map((_, i) => i)
          .filter((i) => distances[i] < (low ? 22 : 38))
          .sort((a, b) => distances[a] - distances[b] || a - b)
          .slice(0, low ? CHARACTER_LOW_DETAIL_LIMIT : CHARACTER_DETAIL_LIMIT),
      );
      for (const pair of batches.values())
        pair.detail.mesh.count = pair.crowd.mesh.count = 0;
      stats.visible = stats.detailed = stats.triangles = 0;
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
        const partnerId = dialogue.talkingTo(a.id);
        if (!reacting && !p.moving && partnerId !== undefined) {
          const partner = poses[partnerId];
          if (partner) root.rotation.y = Math.atan2(partner.x - p.x, partner.z - p.z);
        }
        root.scale.setScalar(size);
        root.updateMatrix();
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
        const high = detailed.has(i);
        const batch = batches.get(a.character)![high ? "detail" : "crowd"];
        const index = batch.mesh.count++;
        batch.mesh.setMatrixAt(index, root.matrix);
        batch.mesh.setColorAt(index, tints[i]);
        const gesture = reacting
          ? reaction.fatal
            ? 0
            : 3
          : a.named && a.character === 1 && time < 6
            ? 2
            : dialogue.isTalking(a.id) && !p.moving
              ? 2
            : !p.moving && a.activity === "work"
              ? 1
              : 0;
        batch.motion.setXYZW(
          index,
          i,
          p.moving ? 0.3 : 0,
          gesture,
          ["flowers", "crate"].includes(characters[a.character].prop) ? 1 : 0,
        );
        stats.visible++;
        if (high) stats.detailed++;
        stats.triangles +=
          (batch.mesh.geometry.index?.count ??
            batch.mesh.geometry.getAttribute("position").count) / 3;
      }
      for (const pair of batches.values()) {
        finishCastBatch(pair.detail);
        finishCastBatch(pair.crowd);
      }
    },
    greeting(time: number, x: number, z: number, speed: number, clock = time, signal = "") {
      return dialogue.update({ time, clock, x, z, speed, signal, poses: motion.sample(time), reactions: rules.reactions });
    },
    clearDialogue(until = 0) {
      dialogue.clear(until);
    },
    voiceProgress(event: SpeechProgress, clock: number) {
      dialogue.playback(event, clock);
    },
  };
}
