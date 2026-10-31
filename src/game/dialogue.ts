import { characters, actorIdentity, type Actor } from "./characters.ts";
import { roadContains, SPAWN } from "./network.ts";
import type { PedestrianHit } from "./pedestrian-rules.ts";
import { voiceLines, type VoiceLine, type VoiceEvent } from "./voice-lines.generated.ts";

export { voiceLines, type VoiceLine } from "./voice-lines.generated.ts";
const byId = new Map(voiceLines.map((line) => [line.id, line]));
const byEvent = new Map<string, VoiceLine[]>();
for (const line of voiceLines) {
  const key = `${line.characterId}:${line.event}`;
  const entries = byEvent.get(key) ?? [];
  entries.push(line);
  byEvent.set(key, entries);
}
export const voiceLine = (id: string) => byId.get(id);
export const characterLines = (id: string, event: VoiceEvent): readonly VoiceLine[] => byEvent.get(`${id}:${event}`) ?? [];

export type DialogueCue = {
  key: string;
  channel: string;
  audience: "player" | "neighbours" | "self";
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
export type SpeechProgress = {
  key: string;
  state: "loading" | "playing" | "ended" | "unavailable" | "cancelled";
  duration?: number;
};
export type SpeakerPose = { x: number; z: number; moving: boolean };
type DialogueFrame = {
  clock: number; time: number; x: number; z: number; speed: number; signal: string;
  poses: readonly SpeakerPose[];
  reactions: ReadonlyMap<number, PedestrianHit>;
};
type Turn = { cue: DialogueCue; held: boolean; ended?: number };
type Exchange = {
  channel: string; from: number; to?: number; turn: Turn | null;
  reply?: VoiceLine; replyAt: number;
};

export function introDialogue(time: number): DialogueCue {
  const first = time < 6;
  const line = voiceLine(first ? "mum_raju_greet_intro_01" : "mum_sachin_ignition_01")!;
  return {
    key: line.id, channel: "foreground", audience: "player", line,
    name: first ? "Raju Kaka" : "Sachin", actorId: null,
    started: first ? 0 : 6, until: first ? 6 : 10, priority: 80,
    ...(first ? { nextLine: voiceLine("mum_sachin_ignition_01") } : {}),
  };
}

/** The street owns its conversations. The listener's location never schedules them. */
export function createDialogueDirector(
  actors: readonly Actor[],
  clearPath = (a: SpeakerPose, b: SpeakerPose) =>
    [0.25, 0.5, 0.75].every((t) => !roadContains(a.x + (b.x - a.x) * t, a.z + (b.z - a.z) * t, 0)),
) {
  const indices = new Map(actors.map((actor, index) => [actor.id, index]));
  const identities = actors.map(actorIdentity);
  const lines = actors.map((actor) => {
    const id = characters[actor.character].id;
    return { chat: characterLines(id, "chat"), reply: characterLines(id, "reply"), ambient: characterLines(id, "ambient"), warning: characterLines(id, "warning") };
  });
  const due = actors.map((actor) => 2 + (actor.id * 13.137) % 68);
  const availableAt = actors.map(() => 0);
  const turns = actors.map(() => 0);
  const busy = new Set<number>();
  const exchanges = new Map<string, Exchange>();
  const active = new Map<string, Turn>();
  const partners = new Map<number, number>();
  const speaking = new Set<number>();
  const warnings = new Map<number, number>();
  const pendingWarnings = new Map<number, PedestrianHit>();
  const driverSpoken = new Map<string, number>();
  const sequences = new Map<string, number>();
  let foreground: Turn | null = null;
  let nextScan = 0, cursor = 0, now = 0;
  let redSince: number | null = null, redSpoken = false, leftStand = false;
  let published: DialogueCue[] = [];

  function pose(index: number, frame: DialogueFrame) { return frame.poses[index]; }
  function able(index: number, frame: DialogueFrame) {
    const reaction = frame.reactions.get(actors[index].id);
    return !!pose(index, frame) && !(reaction && (reaction.fatal || frame.time - reaction.time < 5));
  }
  function close(a: number, b: number, frame: DialogueFrame) {
    const p = pose(a, frame), q = pose(b, frame);
    if (!p || !q || !able(a, frame) || !able(b, frame)) return false;
    if ((p.x - q.x) ** 2 + (p.z - q.z) ** 2 > 7.5 ** 2) return false;
    // Authored neighbours on the same pavement need no repeated road scan.
    const left = actors[a], right = actors[b];
    return (!left.home && !right.home && left.edge === right.edge && left.side === right.side) || clearPath(p, q);
  }
  function start(line: VoiceLine, index: number | null, channel: string, audience: DialogueCue["audience"], frame: DialogueFrame, partner?: number, nextLine?: VoiceLine): Turn {
    const p = index === null ? undefined : pose(index, frame);
    const sequence = sequences.get(channel) ?? 0;
    sequences.set(channel, sequence + 1);
    const cue: DialogueCue = {
      key: `${channel}:${line.id}:${sequence}`, channel, audience, line,
      name: index === null ? "Sachin" : identities[index].name,
      actorId: index === null ? null : actors[index].id,
      ...(p ? { x: p.x, z: p.z } : {}),
      ...(partner !== undefined ? { partnerId: actors[partner].id } : {}),
      ...(nextLine ? { nextLine } : {}),
      started: frame.clock, until: frame.clock + line.duration,
      priority: audience === "player" ? 90 : channel === "foreground" ? 40 : 20,
    };
    const turn = { cue, held: false };
    active.set(cue.key, turn);
    if (index !== null) turns[index]++;
    return turn;
  }
  function finished(turn: Turn) {
    return turn.ended !== undefined || (!turn.held && now >= turn.cue.until);
  }
  function release(exchange: Exchange) {
    for (const index of [exchange.from, exchange.to]) if (index !== undefined) {
      busy.delete(index);
      availableAt[index] = now + 32;
      due[index] = now + 38 + (actors[index].id * 7.37) % 25;
    }
    exchanges.delete(exchange.channel);
  }
  function updateExchanges(frame: DialogueFrame) {
    for (const exchange of exchanges.values()) {
      if (exchange.turn && finished(exchange.turn)) {
        const endedAt = exchange.turn.ended ?? exchange.turn.cue.until;
        active.delete(exchange.turn.cue.key);
        exchange.turn = null;
        exchange.replyAt = endedAt + 0.55 + (exchange.from % 3) * 0.08;
        if (!exchange.reply) { release(exchange); continue; }
      }
      if (!exchange.turn && exchange.reply && now >= exchange.replyAt) {
        if (exchange.to !== undefined && close(exchange.from, exchange.to, frame)) {
          exchange.turn = start(exchange.reply, exchange.to, exchange.channel, "neighbours", frame, exchange.from);
          exchange.reply = undefined;
        } else release(exchange);
      }
    }
  }
  function scanStreet(frame: DialogueFrame) {
    if (now < nextScan || !actors.length) return;
    nextScan = now + 0.5;
    const grid = new Map<number, number[]>();
    const cellKey = (x: number, z: number) => x * 65536 + z;
    for (let i = 0; i < actors.length; i++) {
      const p = pose(i, frame);
      if (!p || p.moving || busy.has(i) || availableAt[i] > now || !able(i, frame) || foreground?.cue.actorId === actors[i].id) continue;
      const key = cellKey(Math.floor(p.x / 8), Math.floor(p.z / 8));
      const bucket = grid.get(key);
      if (bucket) bucket.push(i); else grid.set(key, [i]);
    }
    let started = 0;
    for (let visited = 0; visited < actors.length && started < 24; visited++) {
      const i = cursor++ % actors.length;
      if (due[i] > now || busy.has(i) || availableAt[i] > now || !able(i, frame) || foreground?.cue.actorId === actors[i].id) continue;
      const p = pose(i, frame), choices = lines[i].chat;
      let pair: { partner: number; ask: VoiceLine; answer: VoiceLine; distance: number } | undefined;
      if (!p.moving && choices.length) {
        const gx = Math.floor(p.x / 8), gz = Math.floor(p.z / 8);
        for (let offset = 0; offset < choices.length && !pair; offset++) {
          const ask = choices[(turns[i] + offset) % choices.length];
          for (let x = gx - 1; x <= gx + 1; x++) for (let z = gz - 1; z <= gz + 1; z++) {
            for (const j of grid.get(cellKey(x, z)) ?? []) {
              if (j === i || busy.has(j) || actors[j].character === actors[i].character) continue;
              const answer = lines[j].reply.find((entry) => entry.topic === ask.topic);
              if (!answer) continue;
              const q = pose(j, frame), distance = (q.x - p.x) ** 2 + (q.z - p.z) ** 2;
              if (distance >= (pair?.distance ?? 7.5 ** 2) || !close(i, j, frame)) continue;
              pair = { partner: j, ask, answer, distance };
            }
          }
        }
      }
      const channel = `street:${actors[i].id}`;
      if (pair) {
        const turn = start(pair.ask, i, channel, "neighbours", frame, pair.partner, pair.answer);
        exchanges.set(channel, { channel, from: i, to: pair.partner, turn, reply: pair.answer, replyAt: Infinity });
        busy.add(i); busy.add(pair.partner);
      } else {
        const choices = lines[i].ambient;
        if (!choices.length) { due[i] = now + 10; continue; }
        const turn = start(choices[turns[i] % choices.length], i, channel, "neighbours", frame);
        exchanges.set(channel, { channel, from: i, turn, replyAt: Infinity });
        busy.add(i);
      }
      started++;
    }
  }
  function directSpeech(frame: DialogueFrame) {
    for (const hit of frame.reactions.values()) {
      if (hit.fatal || frame.time - hit.time > 5 || warnings.get(hit.actorId) === hit.time) continue;
      warnings.set(hit.actorId, hit.time);
      pendingWarnings.set(hit.actorId, hit);
      // Let the current sentence finish, but don't continue an interrupted chat.
      const index = indices.get(hit.actorId);
      for (const exchange of exchanges.values()) if (exchange.from === index || exchange.to === index) {
        exchange.reply = undefined;
        if (!exchange.turn) release(exchange);
      }
    }
    if (foreground && finished(foreground)) { active.delete(foreground.cue.key); foreground = null; }
    if (foreground) return;
    for (const [id, hit] of pendingWarnings) {
      const index = indices.get(id);
      if (index === undefined || frame.time - hit.time > 10) { pendingWarnings.delete(id); continue; }
      if (busy.has(index)) continue;
      pendingWarnings.delete(id);
      if (lines[index].warning[0]) {
        foreground = start(lines[index].warning[0], index, "foreground", "player", frame);
        return;
      }
    }
    let event: VoiceEvent | null = null;
    if (redSince !== null && !redSpoken && now - redSince >= 8) event = "red_wait";
    else if (leftStand && Math.hypot(frame.x - SPAWN.x, frame.z - SPAWN.z) < 15) event = "stand";
    else if (now > 45 && frame.x < -230) event = "waterfront";
    if (!event || now - (driverSpoken.get(event) ?? -1000) < 140) return;
    const line = characterLines("sachin", event)[0];
    if (!line) return;
    if (event === "red_wait") redSpoken = true;
    if (event === "stand") leftStand = false;
    driverSpoken.set(event, now);
    foreground = start(line, null, "foreground", "self", frame);
  }
  return {
    get cues(): readonly DialogueCue[] { return published; },
    get cue() { return foreground?.cue ?? null; },
    talkingTo(id: number) { return partners.get(id); },
    isTalking(id: number) { return speaking.has(id); },
    playback(event: SpeechProgress, clock: number) {
      const turn = active.get(event.key);
      if (!turn) return;
      if (event.state === "loading" || event.state === "playing") {
        turn.held = true;
        if (event.state === "playing") turn.cue.until = clock + (event.duration ?? turn.cue.line.duration);
      } else if (event.state === "cancelled") turn.held = false;
      else { turn.held = false; turn.ended = clock; }
    },
    clear(until = now) {
      active.clear(); exchanges.clear(); busy.clear(); partners.clear(); speaking.clear(); pendingWarnings.clear();
      foreground = null; published = [];
      nextScan = until;
      for (let i = 0; i < due.length; i++) due[i] = Math.max(due[i], until + 2 + (actors[i].id * 13.137) % 30);
    },
    update(frame: DialogueFrame): readonly DialogueCue[] {
      now = frame.clock;
      if (Math.hypot(frame.x - SPAWN.x, frame.z - SPAWN.z) > 45) leftStand = true;
      if (frame.signal === "red" && Math.abs(frame.speed) < 0.28) redSince ??= now;
      else { redSince = null; redSpoken = false; }
      updateExchanges(frame);
      directSpeech(frame);
      scanStreet(frame);
      partners.clear(); speaking.clear();
      for (const exchange of exchanges.values()) if (exchange.to !== undefined) {
        partners.set(actors[exchange.from].id, actors[exchange.to].id);
        partners.set(actors[exchange.to].id, actors[exchange.from].id);
      }
      published = [];
      for (const turn of active.values()) {
        const cue = turn.cue;
        if (cue.actorId !== null) {
          speaking.add(cue.actorId);
          const index = indices.get(cue.actorId), p = index === undefined ? undefined : pose(index, frame);
          if (p) { cue.x = p.x; cue.z = p.z; }
        }
        published.push(cue);
      }
      return published;
    },
  };
}
