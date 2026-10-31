import { characters, actorIdentity, type Actor } from "./characters.ts";
import { roadContains, SPAWN } from "./network.ts";
import type { PedestrianHit } from "./pedestrian-rules.ts";
import { voiceLines, type VoiceLine, type VoiceEvent } from "./voice-lines.generated.ts";

export { voiceLines, type VoiceLine } from "./voice-lines.generated.ts";
const byId = new Map(voiceLines.map((line) => [line.id, line]));
const byCharacter = new Map<string, VoiceLine[]>();
for (const line of voiceLines) {
  const list = byCharacter.get(line.characterId) ?? [];
  list.push(line);
  byCharacter.set(line.characterId, list);
}
export const voiceLine = (id: string) => byId.get(id);
export const characterLines = (id: string, event: VoiceEvent) =>
  (byCharacter.get(id) ?? []).filter((line) => line.event === event);

export type DialogueCue = {
  key: string;
  line: VoiceLine;
  name: string;
  actorId: number | null;
  partnerId?: number;
  x?: number;
  z?: number;
  started: number;
  until: number;
  priority: number;
  nextLine?: VoiceLine;
};
export type SpeakerPose = { x: number; z: number; moving: boolean };
type DialogueFrame = {
  clock: number;
  time: number;
  x: number;
  z: number;
  speed: number;
  signal: string;
  poses: readonly SpeakerPose[];
  reactions: ReadonlyMap<number, PedestrianHit>;
};

export function introDialogue(time: number): DialogueCue {
  const first = time < 6;
  const line = voiceLine(first ? "mum_raju_greet_intro_01" : "mum_sachin_ignition_01")!;
  return {
    key: line.id,
    line,
    name: first ? "Raju Kaka" : "Sachin",
    actorId: null,
    started: first ? 0 : 6,
    until: first ? 6 : 10,
    priority: 80,
    ...(first ? { nextLine: voiceLine("mum_sachin_ignition_01") } : {}),
  };
}

/** Short, local exchanges. All timing is the pause-aware real-time dialogue clock. */
export function createDialogueDirector(
  actors: readonly Actor[],
  clearPath = (a: SpeakerPose, b: SpeakerPose) =>
    [0.25, 0.5, 0.75].every((t) => !roadContains(a.x + (b.x - a.x) * t, a.z + (b.z - a.z) * t, 0)),
) {
  const indices = new Map(actors.map((actor, index) => [actor.id, index]));
  const spoken = new Map<number, number>();
  const lastLine = new Map<string, number>();
  const warned = new Map<number, number>();
  let current: DialogueCue | null = null;
  let reply: { from: number; to: number; line: VoiceLine; at: number; expires: number } | null = null;
  let nextAt = 8, nextCheck = 0, sequence = 0;
  let redSince: number | null = null, redSpoken = false, leftStand = false;
  const lineReady = (line: VoiceLine, now: number) => now - (lastLine.get(line.id) ?? -1000) >= 100;
  function position(id: number, frame: DialogueFrame) {
    const index = indices.get(id);
    return index === undefined ? undefined : frame.poses[index];
  }
  function local(id: number, frame: DialogueFrame) {
    const p = position(id, frame), reaction = frame.reactions.get(id);
    return !!p && !p.moving && Math.hypot(p.x - frame.x, p.z - frame.z) < 16 &&
      !(reaction && (reaction.fatal || frame.time - reaction.time < 5));
  }
  function pairPresent(a: number, b: number, frame: DialogueFrame) {
    if (!local(a, frame) || !local(b, frame)) return false;
    const p = position(a, frame)!, q = position(b, frame)!;
    return Math.hypot(p.x - q.x, p.z - q.z) <= 5.5 && clearPath(p, q);
  }
  function speak(line: VoiceLine, actor: Actor | null, frame: DialogueFrame, priority: number, partnerId?: number) {
    const p = actor ? position(actor.id, frame) : undefined;
    current = {
      key: `${actor?.id ?? "driver"}:${line.id}:${frame.clock.toFixed(3)}`,
      line,
      name: actor ? actorIdentity(actor).name : "Sachin",
      actorId: actor?.id ?? null,
      ...(p ? { x: p.x, z: p.z } : {}),
      ...(partnerId !== undefined ? { partnerId } : {}),
      started: frame.clock,
      until: frame.clock + line.duration + 0.2,
      priority,
    };
    lastLine.set(line.id, frame.clock);
    if (actor) spoken.set(actor.id, frame.clock);
    nextAt = current.until + 8 + (sequence++ % 5);
    return current;
  }
  function driverLine(frame: DialogueFrame) {
    let event: VoiceEvent | null = null;
    if (redSince !== null && !redSpoken && frame.clock - redSince >= 8) event = "red_wait";
    else if (leftStand && Math.hypot(frame.x - SPAWN.x, frame.z - SPAWN.z) < 15) event = "stand";
    else if (frame.clock > 30 && frame.x < -230) event = "waterfront";
    if (!event) return null;
    const line = characterLines("sachin", event)[0];
    if (!line || !lineReady(line, frame.clock)) return null;
    if (event === "red_wait") redSpoken = true;
    if (event === "stand") leftStand = false;
    return speak(line, null, frame, 40);
  }
  return {
    get cue() { return current; },
    talkingTo(id: number) {
      if (current?.partnerId !== undefined) {
        if (current.actorId === id) return current.partnerId;
        if (current.partnerId === id) return current.actorId ?? undefined;
      }
      if (reply?.from === id) return reply.to;
      if (reply?.to === id) return reply.from;
      return undefined;
    },
    clear(until = 0) {
      current = null;
      reply = null;
      nextAt = Math.max(nextAt, until);
    },
    update(frame: DialogueFrame): DialogueCue | null {
      const now = frame.clock;
      if (Math.hypot(frame.x - SPAWN.x, frame.z - SPAWN.z) > 45) leftStand = true;
      if (frame.signal === "red" && Math.abs(frame.speed) < 0.28) redSince ??= now;
      else { redSince = null; redSpoken = false; }
      // An actual mild impact preempts chatter; each impact is spoken only once.
      const hits = [...frame.reactions.values()].filter((hit) =>
        !hit.fatal && frame.time - hit.time >= 0 && frame.time - hit.time < 5 &&
        warned.get(hit.actorId) !== hit.time && Math.hypot(hit.x - frame.x, hit.z - frame.z) < 18,
      ).sort((a, b) => b.time - a.time);
      if (hits.length && !(current?.priority === 90 && now - current.started < 1.5)) {
        const hit = hits[0], index = indices.get(hit.actorId);
        warned.set(hit.actorId, hit.time);
        if (index !== undefined) {
          const actor = actors[index], line = characterLines(characters[actor.character].id, "warning")[0];
          if (line) {
            reply = null;
            return speak(line, actor, frame, 90);
          }
        }
      }
      if (current) {
        const p = current.actorId === null ? undefined : position(current.actorId, frame);
        const outOfRange = p && Math.hypot(p.x - frame.x, p.z - frame.z) > 20;
        if (now < current.until && !outOfRange && !(current.priority < 40 && Math.abs(frame.speed) > 4.5)) {
          if (p) { current.x = p.x; current.z = p.z; }
          return current;
        }
        if (outOfRange || Math.abs(frame.speed) > 4.5) reply = null;
        current = null;
      }
      if (reply) {
        if (now > reply.expires || Math.abs(frame.speed) > 3.3 || !pairPresent(reply.from, reply.to, frame)) reply = null;
        else if (now >= reply.at) {
          const pending = reply;
          reply = null;
          return speak(pending.line, actors[indices.get(pending.to)!], frame, 20, pending.from);
        } else return null;
      }
      if (now < nextAt || now < nextCheck || Math.abs(frame.speed) > 3.3) return null;
      nextCheck = now + 0.75;
      if (sequence % 4 === 3) {
        const line = driverLine(frame);
        if (line) return line;
      }
      const nearby = actors.filter((actor) => local(actor.id, frame) && now - (spoken.get(actor.id) ?? -1000) >= 45)
        .sort((a, b) => {
          const pa = position(a.id, frame)!, pb = position(b.id, frame)!;
          return (spoken.get(a.id) ?? -1000) - (spoken.get(b.id) ?? -1000) ||
            Math.hypot(pa.x - frame.x, pa.z - frame.z) - Math.hypot(pb.x - frame.x, pb.z - frame.z);
        });
      // Two neighbours exchange related lines, with a natural gap between turns.
      if (sequence % 3 !== 2) for (const actor of nearby) {
        const question = characterLines(characters[actor.character].id, "chat")[0];
        if (!question || !lineReady(question, now)) continue;
        for (const partner of nearby) {
          if (partner.id === actor.id || partner.character === actor.character || !pairPresent(actor.id, partner.id, frame)) continue;
          const answer = characterLines(characters[partner.character].id, "reply").find((line) => line.topic === question.topic && lineReady(line, now));
          if (!answer) continue;
          const cue = speak(question, actor, frame, 20, partner.id);
          cue.nextLine = answer;
          spoken.set(partner.id, now);
          reply = { from: actor.id, to: partner.id, line: answer, at: cue.until + 0.65, expires: cue.until + 2.5 };
          return cue;
        }
      }
      for (const actor of nearby) {
        const choices = characterLines(characters[actor.character].id, "ambient").filter((line) => lineReady(line, now));
        if (choices.length) return speak(choices[(actor.id + sequence) % choices.length], actor, frame, 20);
      }
      return driverLine(frame);
    },
  };
}
