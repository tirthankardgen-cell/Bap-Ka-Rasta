import test from "node:test";
import assert from "node:assert/strict";
import { createDialogueDirector, characterLines, introDialogue } from "../src/game/dialogue.ts";
import { createActors, actorIdentity, actorPose, type Actor } from "../src/game/characters.ts";
import type { PedestrianHit } from "../src/game/pedestrian-rules.ts";

const stand = createActors().filter((actor) => actor.named && [1, 2].includes(actor.character));
function frame(clock: number, overrides = {}) {
  return { clock, time: clock, x: -274, z: 326.8, speed: 0, signal: "", poses: stand.map((actor) => ({ ...actor.home!, moving: false })), reactions: new Map<number, PedestrianHit>(), ...overrides };
}

test("neighbours converse independently of the listener's distance and driving speed", () => {
  const near = createDialogueDirector(stand, () => true);
  const distant = createDialogueDirector(stand, () => true);
  for (const clock of [0, 2, 3, 7, 8, 12, 50, 51]) {
    const a = near.update(frame(clock)).filter((cue) => cue.audience === "neighbours");
    const b = distant.update(frame(clock, { x: 900, z: -900, speed: 18 })).filter((cue) => cue.audience === "neighbours");
    assert.deepEqual(b, a, "moving the auto cannot trigger, cancel or reschedule a conversation");
  }
});

test("a slow download and a long recording delay the reply until actual playback finishes", () => {
  const director = createDialogueDirector(stand, () => true);
  const question = director.update(frame(2))[0];
  assert.equal(question.line.event, "chat");
  assert.equal(question.name, "Raju Kaka");
  director.playback({ key: question.key, state: "loading" }, 2);
  assert.equal(director.update(frame(20, { x: 500, speed: 18 }))[0].key, question.key);
  director.playback({ key: question.key, state: "playing", duration: 7 }, 20);
  assert.equal(director.update(frame(30))[0].key, question.key, "the timer cannot stop an active source");
  director.playback({ key: question.key, state: "ended" }, 30);
  assert.equal(director.update(frame(30.2)).filter((cue) => cue.audience === "neighbours").length, 0);
  assert.equal(director.talkingTo(stand[0].id), stand[1].id, "keep facing the partner through the gap");
  const answer = director.update(frame(30.7)).find((cue) => cue.line.event === "reply")!;
  assert.equal(answer.line.event, "reply");
  assert.equal(answer.line.topic, question.line.topic);
  assert.equal(answer.name, "Meera Tai");
  assert.equal(answer.audience, "neighbours");
  assert.notEqual(answer.actorId, question.actorId);
});

test("background actors keep their identities and chat even far from the player", () => {
  const actors: Actor[] = stand.map((actor, i) => ({ ...actor, id: 101 + i, named: false, variant: 1 }));
  const director = createDialogueDirector(actors, () => true);
  const question = director.update(frame(65, { x: 900, z: 900, speed: 18 })).find((cue) => cue.line.event === "chat")!;
  const speaker = actors.find((actor) => actor.id === question.actorId)!;
  assert.equal(question.name, actorIdentity(speaker).name);
  assert.equal(question.audience, "neighbours");
  const answer = director.update(frame(question.until + 0.8)).find((cue) => cue.line.event === "reply")!;
  assert.notEqual(answer.name, question.name);
  assert.notEqual(answer.line.characterId, question.line.characterId);
});

test("the whole crowd runs staggered conversations, with each person in at most one exchange", () => {
  const actors = createActors();
  const poses = actors.map((actor) => actorPose(actor, 0));
  const director = createDialogueDirector(actors);
  let maximum = 0, heardFar = false;
  for (let clock = 0; clock < 40; clock += 0.5) {
    const cues = director.update(frame(clock, { poses, x: 5000, z: 5000, speed: 18 }));
    const street = cues.filter((cue) => cue.audience === "neighbours");
    maximum = Math.max(maximum, street.length);
    assert.equal(new Set(street.map((cue) => cue.actorId)).size, street.length);
    for (const cue of street) {
      if (cue.line.event === "chat") heardFar = true;
      assert.notEqual(cue.audience, "player", "gossip must never become a player caption");
    }
  }
  assert.ok(maximum > 20, "different streets must converse concurrently");
  assert.ok(heardFar);
});

test("people do not answer through obstructions or when their neighbour leaves", () => {
  const obstructed = createDialogueDirector(stand, () => false);
  assert.equal(obstructed.update(frame(2))[0].line.event, "ambient");
  const director = createDialogueDirector(stand, () => true);
  const question = director.update(frame(2))[0];
  const poses = stand.map((actor, i) => ({ ...actor.home!, x: actor.home!.x + i * 40, moving: false }));
  assert.equal(director.update(frame(question.until + 0.8, { poses })).some((cue) => cue.line.event === "reply"), false);
});

test("a mild impact preserves the sentence then addresses the player in the struck woman's voice", () => {
  const director = createDialogueDirector(stand, () => true);
  const question = director.update(frame(2))[0];
  director.playback({ key: question.key, state: "playing", duration: 4 }, 2);
  const actor = stand[1];
  const hit: PedestrianHit = { actorId: actor.id, name: "Meera Tai", role: "Chai seller", time: 2.2, x: actor.home!.x, z: actor.home!.z, yaw: 0, speed: 2, fatal: false, line: "" };
  const reactions = new Map([[actor.id, hit]]);
  assert.equal(director.update(frame(2.2, { reactions }))[0].key, question.key);
  director.playback({ key: question.key, state: "ended" }, 6);
  const warning = director.update(frame(6, { reactions })).find((cue) => cue.audience === "player")!;
  assert.equal(warning.line.characterId, "meera");
  assert.equal(warning.line.event, "warning");
  assert.equal(warning.priority, 90);
  assert.equal(director.talkingTo(stand[0].id), undefined);
  assert.equal(director.update(frame(warning.until + 1, { reactions })).some((cue) => cue.line.event === "reply"), false);
});

test("driver self-talk stays out of captions and respects a prolonged red stop", () => {
  const director = createDialogueDirector([]);
  const stopped = (clock: number) => frame(clock, { x: 0, z: 0, poses: [], signal: "red" });
  assert.equal(director.update(stopped(0)).length, 0);
  const line = director.update(stopped(8))[0];
  assert.equal(line.line.event, "red_wait");
  assert.equal(line.audience, "self");
  assert.equal(director.update(stopped(120)).length, 0);
});

test("opening and reactions explicitly address the player", () => {
  const raju = introDialogue(0), sachin = introDialogue(6);
  assert.equal(raju.name, "Raju Kaka");
  assert.equal(sachin.name, "Sachin");
  assert.equal(raju.audience, "player");
  assert.equal(sachin.channel, "foreground");
  assert.equal(characterLines("patil", "warning").length, 1);
});
