import test from "node:test";
import assert from "node:assert/strict";
import { createVoiceAudio, speechGain, STREET_VOICE_LIMIT, VOICE_LOAD_LIMIT } from "../src/game/voice-audio.ts";
import { createStreetAudio } from "../src/game/audio.ts";
import { introDialogue, characterLines, type DialogueCue } from "../src/game/dialogue.ts";

const tick = () => new Promise<void>((resolve) => setImmediate(resolve));
const position = { x: 0, z: 0, yaw: 0 };
function fakeContext() {
  const sources: Array<ReturnType<typeof source>> = [];
  const gains: Array<{ gain: ReturnType<typeof parameter> }> = [];
  const pans: Array<{ pan: ReturnType<typeof parameter> }> = [];
  const parameter = () => ({ value: 0, setTargetAtTime(value: number) { this.value = value; } });
  const node = () => ({ connect() {}, disconnect() {} });
  const source = () => ({ ...node(), buffer: null, onended: null as (() => void) | null, starts: 0, stops: 0, start() { this.starts++; }, stop() { this.stops++; } });
  const context = {
    currentTime: 0, destination: {},
    decodeAudioData: async (_data: ArrayBuffer) => ({ duration: 3 }),
    createBufferSource() { const value = source(); sources.push(value); return value; },
    createGain() { const value = { ...node(), gain: parameter() }; gains.push(value); return value; },
    createStereoPanner() { const value = { ...node(), pan: parameter() }; pans.push(value); return value; },
  };
  return { context, sources, gains, pans };
}
const response = () => ({ ok: true, arrayBuffer: async () => new ArrayBuffer(8) }) as Response;
const cue = (key: string): DialogueCue => ({ ...introDialogue(0), key, nextLine: undefined });

test("a rejected audio resume releases pending speech so the intro can hand off", async (t) => {
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, "AudioContext");
  const fake = fakeContext();
  const context = { ...fake.context, state: "suspended", resume: async () => { throw new Error("Audio device unavailable"); }, suspend: async () => {}, close: async () => {} };
  Object.defineProperty(globalThis, "AudioContext", { configurable: true, value: function () { return context; } });
  t.after(() => {
    if (descriptor) Object.defineProperty(globalThis, "AudioContext", descriptor);
    else Reflect.deleteProperty(globalThis, "AudioContext");
  });
  let aborted = 0;
  t.mock.method(globalThis, "fetch", (_url, options) => new Promise<Response>((_resolve, reject) => {
    options?.signal?.addEventListener("abort", () => { aborted++; reject(new DOMException("Aborted", "AbortError")); }, { once: true });
  }));
  const reports: string[] = [];
  const audio = createStreetAudio((state) => reports.push(state));
  audio.pause(false);
  audio.dialogue([cue("blocked-opening")], position);
  audio.enable(true);
  await tick();
  assert.ok(reports.includes("unavailable"));
  assert.equal(audio.pendingDialogue, false);
  assert.equal(audio.voiceStats.loading, 0);
  assert.ok(aborted > 0, "Failed resume must cancel pending voice downloads");
  assert.equal(fake.sources.length, 0);
  audio.dispose();
  await tick();
});

test("speech never fetches before sound is enabled and never replays a muted line", async (t) => {
  const fetch = t.mock.method(globalThis, "fetch", async () => response());
  const fake = fakeContext();
  const audio = createVoiceAudio(fake.context as unknown as AudioContext, () => {}, () => {});
  audio.pause(false);
  audio.cue(cue("before-gesture"), position);
  await tick();
  assert.equal(fetch.mock.callCount(), 0);
  audio.enable(true);
  audio.cue(cue("first"), position);
  await tick();
  assert.equal(fake.sources.length, 1);
  audio.enable(false);
  assert.equal(fake.sources[0].stops, 1);
  audio.enable(true);
  audio.cue(cue("first"), position);
  await tick();
  assert.equal(fake.sources.length, 1, "unmuting must not restart an old line");
  audio.cue(cue("next"), position);
  await tick();
  assert.equal(fake.sources.length, 2);
  assert.equal(fetch.mock.callCount(), 1, "subsequent playback should reuse the decoded clip");
  audio.dispose();
});

test("a clip loaded while paused starts only on resume, and further pauses do not replay it", async (t) => {
  t.mock.method(globalThis, "fetch", async () => response());
  const fake = fakeContext();
  const audio = createVoiceAudio(fake.context as unknown as AudioContext, () => {}, () => {});
  audio.enable(true);
  audio.cue(cue("paused-load"), position);
  await tick();
  assert.equal(fake.sources.length, 0);
  audio.pause(false);
  assert.equal(fake.sources.length, 1);
  audio.pause(true);
  audio.pause(false);
  audio.cue(cue("paused-load"), position);
  assert.equal(fake.sources.length, 1);
  assert.equal(fake.sources[0].stops, 0);
  audio.dispose();
});

test("skip and dispose invalidate an audio decode already in flight", async (t) => {
  t.mock.method(globalThis, "fetch", async () => response());
  for (const action of ["clear", "dispose"] as const) {
    const fake = fakeContext();
    let finish!: (value: { duration: number }) => void;
    fake.context.decodeAudioData = () => new Promise((resolve) => { finish = resolve; });
    const audio = createVoiceAudio(fake.context as unknown as AudioContext, () => {}, () => {});
    audio.enable(true); audio.pause(false);
    audio.cue(cue(action), position);
    await tick();
    audio[action]();
    finish({ duration: 3 });
    await tick();
    assert.equal(fake.sources.length, 0, `${action} must prevent stale speech`);
    audio.dispose();
  }
});

test("warnings mix with an ongoing street sentence, pan with distance and stop only on mute", async (t) => {
  t.mock.method(globalThis, "fetch", async () => response());
  const fake = fakeContext(), levels: boolean[] = [];
  const audio = createVoiceAudio(fake.context as unknown as AudioContext, () => {}, (value) => levels.push(value));
  audio.enable(true); audio.pause(false);
  audio.cue({ ...cue("street"), channel: "street:1", audience: "neighbours", actorId: 1, x: 4, z: 0 }, position);
  await tick();
  const warning: DialogueCue = { key: "meera-hit", channel: "foreground", audience: "player", line: characterLines("meera", "warning")[0], name: "Meera Tai", actorId: 2, x: 5, z: 0, priority: 90, started: 1, until: 5 };
  audio.cue(warning, position);
  await tick();
  assert.equal(fake.sources[0].stops, 0, "a new warning must not cut off the street sentence");
  assert.equal(fake.sources[1].starts, 1);
  assert.ok(fake.gains[1].gain.value > 0);
  assert.ok(fake.pans[1].pan.value < 0);
  audio.cue(warning, { x: 500, z: 0, yaw: 0 });
  assert.equal(fake.gains[1].gain.value, 0);
  assert.equal(fake.sources[1].stops, 0, "distance changes gain, not the source lifetime");
  audio.enable(false);
  assert.equal(fake.sources[1].stops, 1);
  assert.equal(fake.sources[0].stops, 1);
  assert.equal(levels.at(-1), false);
  audio.dispose();
});

test("playing speech outlives nominal cue expiry and completes with onended", async (t) => {
  t.mock.method(globalThis, "fetch", async () => response());
  const fake = fakeContext(), events: string[] = [];
  const audio = createVoiceAudio(fake.context as unknown as AudioContext, () => {}, () => {}, (event) => events.push(event.state));
  audio.enable(true); audio.pause(false);
  audio.cue(cue("complete-sentence"), position);
  await tick();
  audio.cue(null, { x: 500, z: 0, yaw: 0 });
  assert.equal(fake.sources[0].stops, 0);
  assert.equal(events.includes("ended"), false);
  fake.sources[0].onended!();
  assert.equal(fake.sources[0].stops, 0);
  assert.equal(events.filter((state) => state === "ended").length, 1);
  assert.equal(audio.stats.playing, 0);
  audio.dispose();
});

test("street speech remains audible beyond twenty metres and fades continuously", () => {
  assert.ok(speechGain(30) > 0.2);
  assert.ok(speechGain(60) > 0.05);
  assert.ok(Math.abs(speechGain(19.99) - speechGain(20.01)) < 0.002);
  assert.ok(speechGain(100) > 0 && speechGain(100) < speechGain(60));
  assert.equal(speechGain(120), 0);
});

test("concurrent crowd playback and decoding stay bounded", async (t) => {
  let loading = 0, maximum = 0;
  const finish: Array<() => void> = [];
  t.mock.method(globalThis, "fetch", (_url, options) => new Promise<Response>((resolve, reject) => {
    loading++; maximum = Math.max(maximum, loading);
    let done = false;
    const stop = (aborted: boolean) => {
      if (done) return;
      done = true; loading--;
      if (aborted) reject(new DOMException("Aborted", "AbortError"));
      else resolve(response());
    };
    options?.signal?.addEventListener("abort", () => stop(true), { once: true });
    finish.push(() => stop(false));
  }));
  const fake = fakeContext();
  const audio = createVoiceAudio(fake.context as unknown as AudioContext, () => {}, () => {});
  audio.enable(true); audio.pause(false);
  const people = ["raju", "meera", "sameer", "aarti", "imran", "lata"];
  audio.scene(people.map((id, i) => ({ ...cue(id), channel: `street:${i}`, audience: "neighbours", actorId: i, x: 15 + i * 5, z: 0, line: characterLines(id, "ambient")[0] })), position);
  await tick();
  assert.equal(maximum, VOICE_LOAD_LIMIT);
  for (let i = 0; i < 8; i++) { finish.shift()?.(); await tick(); }
  assert.equal(fake.sources.length, STREET_VOICE_LIMIT);
  assert.ok(audio.stats.channels <= STREET_VOICE_LIMIT);
  assert.ok(maximum <= VOICE_LOAD_LIMIT);
  audio.dispose();
});

test("missing speech stays silent and does not prevent the following line", async (t) => {
  let missing = true;
  t.mock.method(globalThis, "fetch", async () => missing ? ({ ok: false } as Response) : response());
  const fake = fakeContext(), reports: string[] = [];
  const audio = createVoiceAudio(fake.context as unknown as AudioContext, (state) => reports.push(state), () => {});
  audio.enable(true); audio.pause(false);
  audio.cue(cue("missing"), position);
  await tick();
  assert.equal(fake.sources.length, 0);
  assert.ok(reports.includes("unavailable"));
  missing = false;
  audio.cue(cue("following"), position);
  await tick();
  assert.equal(fake.sources.length, 1);
  audio.dispose();
});
