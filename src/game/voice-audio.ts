import type { DialogueCue, VoiceLine } from "./dialogue.ts";

type Listener = { x: number; z: number; yaw: number };
type Playback = { source: AudioBufferSourceNode; gain: GainNode; pan: StereoPannerNode };
export const VOICE_CACHE_LIMIT = 24;

/** Shares the street AudioContext; never calls ElevenLabs from the browser. */
export function createVoiceAudio(
  context: AudioContext,
  report: (state: string, clipId: string) => void,
  duck: (speaking: boolean) => void,
) {
  const cache = new Map<string, AudioBuffer>();
  const requests = new Map<string, { controller: AbortController; promise: Promise<AudioBuffer | null> }>();
  let enabled = false, paused = true, disposed = false, generation = 0;
  let desired: DialogueCue | null = null, ready: AudioBuffer | null = null;
  let playing: Playback | null = null, playedKey = "", silencedKey = "";
  let listener: Listener = { x: 0, z: 0, yaw: 0 };

  function stop() {
    const old = playing;
    playing = null;
    if (old) {
      old.source.onended = null;
      try { old.source.stop(); } catch { /* Already ended. */ }
      old.source.disconnect(); old.gain.disconnect(); old.pan.disconnect();
    }
    duck(false);
  }
  function abortExcept(keep: Set<string>) {
    for (const [id, request] of requests) if (!keep.has(id)) {
      request.controller.abort();
      requests.delete(id);
    }
  }
  function load(line: VoiceLine): Promise<AudioBuffer | null> {
    if (!line.url || disposed) return Promise.resolve(null);
    const buffer = cache.get(line.id);
    if (buffer) {
      cache.delete(line.id); cache.set(line.id, buffer);
      return Promise.resolve(buffer);
    }
    const existing = requests.get(line.id);
    if (existing) return existing.promise;
    const controller = new AbortController();
    const promise = (async () => {
      try {
        const response = await fetch(line.url!, { signal: controller.signal });
        if (!response.ok) return null;
        const data = await response.arrayBuffer();
        if (disposed || controller.signal.aborted) return null;
        const decoded = await context.decodeAudioData(data);
        if (disposed || controller.signal.aborted) return null;
        cache.set(line.id, decoded);
        while (cache.size > VOICE_CACHE_LIMIT) cache.delete(cache.keys().next().value!);
        return decoded;
      } catch { return null; }
      finally {
        if (requests.get(line.id)?.controller === controller) requests.delete(line.id);
      }
    })();
    requests.set(line.id, { controller, promise });
    return promise;
  }
  function spatial() {
    if (!playing || !desired) return;
    const positional = desired.x !== undefined && desired.z !== undefined;
    const dx = positional ? desired.x! - listener.x : 0;
    const dz = positional ? desired.z! - listener.z : 0;
    const distance = Math.hypot(dx, dz);
    const level = positional ? 0.95 * Math.max(0, 1 - distance / 20) : 0.88;
    const pan = positional ? -(dx * Math.cos(listener.yaw) - dz * Math.sin(listener.yaw)) / Math.max(5, distance) : 0;
    playing.gain.gain.setTargetAtTime(level, context.currentTime, 0.08);
    playing.pan.pan.setTargetAtTime(Math.max(-1, Math.min(1, pan)), context.currentTime, 0.08);
  }
  function start() {
    if (disposed || !enabled || paused || !desired || !ready || desired.key === silencedKey) return;
    if (playing) { report("playing", desired.line.id); return; }
    if (playedKey === desired.key) return;
    const source = context.createBufferSource(), gain = context.createGain(), pan = context.createStereoPanner();
    source.buffer = ready;
    gain.gain.value = 0;
    source.connect(gain); gain.connect(pan); pan.connect(context.destination);
    playing = { source, gain, pan };
    playedKey = desired.key;
    spatial();
    source.onended = () => {
      if (playing?.source !== source) return;
      source.disconnect(); gain.disconnect(); pan.disconnect();
      playing = null;
      ready = null;
      duck(false);
      report("idle", "");
    };
    source.start();
    duck(true);
    report("playing", desired.line.id);
  }
  return {
    enable(value: boolean) {
      if (disposed) return;
      enabled = value;
      if (!value) {
        silencedKey = desired?.key ?? "";
        generation++;
        ready = null;
        abortExcept(new Set());
        stop();
        report("muted", "");
      } else start();
    },
    pause(value: boolean) {
      if (disposed) return;
      paused = value;
      if (value && (playing || ready)) report("paused", desired?.line.id ?? "");
      if (!value) start();
    },
    cue(cue: DialogueCue | null, position: Listener) {
      if (disposed) return;
      listener = position;
      if (cue?.key === desired?.key) {
        desired = cue;
        spatial();
        return;
      }
      desired = cue;
      ready = null;
      const ticket = ++generation;
      stop();
      abortExcept(new Set(cue ? [cue.line.id, ...(cue.nextLine ? [cue.nextLine.id] : [])] : []));
      if (!cue) { report(enabled ? "idle" : "muted", ""); return; }
      if (!enabled) { silencedKey = cue.key; return; }
      if (!cue.line.url) { report("unavailable", cue.line.id); return; }
      report("loading", cue.line.id);
      // Fetch at most this turn and its related reply, not the whole cast.
      if (cue.nextLine) void load(cue.nextLine);
      void load(cue.line).then((buffer) => {
        if (disposed || generation !== ticket || desired?.key !== cue.key || !enabled) return;
        ready = buffer;
        if (!buffer) report("unavailable", cue.line.id);
        else start();
      });
    },
    clear() {
      desired = null;
      ready = null;
      generation++;
      abortExcept(new Set());
      stop();
      report(enabled ? "idle" : "muted", "");
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      generation++;
      abortExcept(new Set());
      stop();
      cache.clear();
      desired = null;
      ready = null;
    },
  };
}
