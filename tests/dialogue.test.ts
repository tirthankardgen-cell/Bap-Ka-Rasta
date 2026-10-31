import test from "node:test";
import assert from "node:assert/strict";
import { createDialogueDirector, characterLines, introDialogue } from "../src/game/dialogue.ts";
import { createActors, actorIdentity, type Actor } from "../src/game/characters.ts";
import type { PedestrianHit } from "../src/game/pedestrian-rules.ts";

const stand = createActors().filter((actor) => actor.named && [1, 2].includes(actor.character));
function frame(clock: number, overrides = {}) {
  return { clock, time: clock, x: -274, z: 326.8, speed: 0, signal: "", poses: stand.map((actor) => ({ ...actor.home!, moving: false })), reactions: new Map<number, PedestrianHit>(), ...overrides };
}

test("nearby locals exchange related lines with different speakers and a natural reply gap", () => {
  const director = createDialogueDirector(stand, () => true);
  assert.equal(director.update(frame(7)), null);
  const question = director.update(frame(8))!;
  assert.equal(question.line.event, "chat");
  assert.equal(question.name, "Raju Kaka");
  assert.equal(director.talkingTo(stand[0].id), stand[1].id);
  assert.equal(director.update(frame(8.5))?.key, question.key);
  assert.equal(director.update(frame(question.until + 0.3)), null);
  assert.equal(director.talkingTo(stand[0].id), stand[1].id, "partners keep facing each other during the reply gap");
  const answer = director.update(frame(question.until + 0.7))!;
  assert.equal(answer.line.event, "reply");
  assert.equal(answer.line.topic, question.line.topic);
  assert.equal(answer.name, "Meera Tai");
  assert.notEqual(answer.actorId, question.actorId);
  assert.equal(director.update(frame(answer.until + 7)), null);
});

test("background people speak with their own names and their matching character voices", () => {
  const actors: Actor[] = stand.map((actor, i) => ({ ...actor, id: 101 + i, named: false, variant: 1 }));
  const director = createDialogueDirector(actors, () => true);
  const question = director.update(frame(8))!;
  assert.equal(question.name, actorIdentity(actors[0]).name);
  assert.equal(question.line.characterId, "raju");
  const answer = director.update(frame(question.until + 0.7))!;
  assert.equal(answer.name, actorIdentity(actors[1]).name);
  assert.equal(answer.line.characterId, "meera");
  assert.notEqual(answer.name, "Meera Tai");
});

test("people do not converse through obstructions or answer after the player drives away", () => {
  const obstructed = createDialogueDirector(stand, () => false);
  assert.equal(obstructed.update(frame(8))?.line.event, "ambient");
  const director = createDialogueDirector(stand, () => true);
  const question = director.update(frame(8))!;
  assert.equal(director.update(frame(question.until + 0.7, { x: 100, speed: 8 })), null);
  assert.equal(director.update(frame(question.until + 1)), null, "a discarded reply must not return when the player returns");
  const walking = createDialogueDirector(stand, () => true);
  assert.equal(walking.update(frame(8, { poses: stand.map((actor) => ({ ...actor.home!, moving: true })) })), null);
});

test("a mild impact interrupts a conversation with the struck woman's own voice and no orphaned reply", () => {
  const director = createDialogueDirector(stand, () => true);
  const question = director.update(frame(8))!;
  const actor = stand[1];
  const hit: PedestrianHit = { actorId: actor.id, name: "Meera Tai", role: "Chai seller", time: 8.2, x: actor.home!.x, z: actor.home!.z, yaw: 0, speed: 2, fatal: false, line: "" };
  const reactions = new Map([[actor.id, hit]]);
  const warning = director.update(frame(8.2, { reactions }))!;
  assert.equal(warning.priority, 90);
  assert.equal(warning.line.characterId, "meera");
  assert.equal(warning.line.event, "warning");
  assert.notEqual(warning.key, question.key);
  assert.equal(director.talkingTo(stand[0].id), undefined);
  assert.equal(director.update(frame(8.8, { reactions }))?.key, warning.key);
  assert.equal(director.update(frame(warning.until + 1, { reactions })), null);
});

test("driver waits for a prolonged red stop and never repeats the same stop comment", () => {
  const director = createDialogueDirector([]);
  const stopped = (time: number) => frame(time, { x: 0, z: 0, poses: [], signal: "red" });
  assert.equal(director.update(stopped(0)), null);
  assert.equal(director.update(stopped(7)), null);
  assert.equal(director.update(stopped(8))?.line.event, "red_wait");
  assert.equal(director.update(stopped(120)), null);
  director.update(frame(121, { x: 0, z: 0, poses: [], signal: "green" }));
  director.update(stopped(122));
  assert.equal(director.update(stopped(131))?.line.event, "red_wait");
});

test("intro recordings fit the existing camera timeline and keep the correct speakers", () => {
  const raju = introDialogue(0), sachin = introDialogue(6);
  assert.equal(raju.name, "Raju Kaka");
  assert.equal(sachin.name, "Sachin");
  assert.ok(raju.line.duration + 0.3 < 6);
  assert.ok(sachin.line.duration < 4);
  assert.equal(characterLines("patil", "warning").length, 1);
});
