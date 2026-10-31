import test from "node:test";
import assert from "node:assert/strict";
import { createVoiceAudio } from "../src/game/voice-audio.ts";
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

test("warnings stop the previous source, pan with the listener and silence on mute", async (t) => {
  t.mock.method(globalThis, "fetch", async () => response());
  const fake = fakeContext(), levels: boolean[] = [];
  const audio = createVoiceAudio(fake.context as unknown as AudioContext, () => {}, (value) => levels.push(value));
  audio.enable(true); audio.pause(false);
  audio.cue(cue("intro"), position);
  await tick();
  const warning: DialogueCue = { key: "meera-hit", line: characterLines("meera", "warning")[0], name: "Meera Tai", actorId: 1, x: 5, z: 0, priority: 90, started: 1, until: 5 };
  audio.cue(warning, position);
  await tick();
  assert.equal(fake.sources[0].stops, 1);
  assert.equal(fake.sources[1].starts, 1);
  assert.ok(fake.gains[1].gain.value > 0);
  assert.ok(fake.pans[1].pan.value < 0);
  audio.cue(warning, { x: 30, z: 0, yaw: 0 });
  assert.equal(fake.gains[1].gain.value, 0);
  audio.enable(false);
  assert.equal(fake.sources[1].stops, 1);
  assert.equal(levels.at(-1), false);
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
