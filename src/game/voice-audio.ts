import type { DialogueCue, SpeechProgress, VoiceLine } from "./dialogue.ts";

type Listener = { x: number; z: number; yaw: number };
type Playback = { source: AudioBufferSourceNode; gain: GainNode; pan: StereoPannerNode };
type Slot = {
  cue: DialogueCue;
  state: "loading" | "ready" | "playing" | "waiting";
  buffer: AudioBuffer | null;
  playback: Playback | null;
  reserveUntil: number;
};
type Request = { line: VoiceLine; controller: AbortController; resolve: (buffer: AudioBuffer | null) => void; promise: Promise<AudioBuffer | null> };
export const VOICE_CACHE_LIMIT = 24;
export const STREET_VOICE_LIMIT = 4;
export const VOICE_LOAD_LIMIT = 2;
export const SPEECH_DISTANCE = 120;

/** Continuous falloff: crossing the old 16/20 metre boundary cannot cut speech. */
export function speechGain(distance: number) {
  const taper = Math.max(0, Math.min(1, (SPEECH_DISTANCE - distance) / 35));
  return taper * taper * (3 - 2 * taper) / (1 + (Math.max(0, distance) / 18) ** 2);
}

/** A bounded spatial mixer. Once a sentence starts, only an explicit stop cancels it. */
export function createVoiceAudio(
  context: AudioContext,
  report: (state: string, clipId: string) => void,
  duck: (speaking: boolean) => void,
  progress: (event: SpeechProgress) => void = () => {},
) {
  const cache = new Map<string, AudioBuffer>();
  const requests = new Map<string, Request>();
  const queue: Request[] = [];
  const slots = new Map<string, Slot>();
  const completed = new Set<string>();
  const recent = new Map<string, number>();
  let activeLoads = 0, enabled = false, paused = true, disposed = false;
  let desired: readonly DialogueCue[] = [];
  let listener: Listener = { x: 0, z: 0, yaw: 0 };
  let lastReport = "", ducked = false;

  function remember(key: string) {
    completed.add(key);
    while (completed.size > 256) completed.delete(completed.values().next().value!);
  }
  function pump() {
    while (!disposed && activeLoads < VOICE_LOAD_LIMIT && queue.length) {
      const request = queue.shift()!;
      if (request.controller.signal.aborted) { request.resolve(null); continue; }
      activeLoads++;
      void (async () => {
        let buffer: AudioBuffer | null = null;
        const timer = setTimeout(() => request.controller.abort(), 10_000);
        try {
          const response = await fetch(request.line.url!, { signal: request.controller.signal });
          if (response.ok) {
            const bytes = await response.arrayBuffer();
            if (!disposed && !request.controller.signal.aborted) {
              const decoded = await context.decodeAudioData(bytes);
              if (!disposed && !request.controller.signal.aborted) {
                buffer = decoded;
                cache.set(request.line.id, decoded);
                while (cache.size > VOICE_CACHE_LIMIT) cache.delete(cache.keys().next().value!);
              }
            }
          }
        } catch { /* A failed asset leaves the street running. */ }
        finally {
          clearTimeout(timer);
          if (requests.get(request.line.id) === request) requests.delete(request.line.id);
          activeLoads--;
          request.resolve(buffer);
          pump();
        }
      })();
    }
  }
  function load(line: VoiceLine): Promise<AudioBuffer | null> {
    if (!line.url || disposed) return Promise.resolve(null);
    const found = cache.get(line.id);
    if (found) { cache.delete(line.id); cache.set(line.id, found); return Promise.resolve(found); }
    const existing = requests.get(line.id);
    if (existing) return existing.promise;
    let resolve!: Request["resolve"];
    const promise = new Promise<AudioBuffer | null>((done) => { resolve = done; });
    const request = { line, controller: new AbortController(), promise, resolve };
    requests.set(line.id, request);
    queue.push(request);
    pump();
    return promise;
  }
  function abortExcept(keep: Set<string>) {
    for (const [id, request] of requests) if (!keep.has(id)) {
      request.controller.abort();
      requests.delete(id);
    }
    for (let i = queue.length - 1; i >= 0; i--) if (queue[i].controller.signal.aborted) {
      queue[i].resolve(null); queue.splice(i, 1);
    }
  }
  function distance(cue: DialogueCue) {
    return cue.x === undefined || cue.z === undefined ? 0 : Math.hypot(cue.x - listener.x, cue.z - listener.z);
  }
  function spatial(slot: Slot) {
    if (!slot.playback) return;
    const { cue } = slot;
    const positional = cue.x !== undefined && cue.z !== undefined;
    const dx = positional ? cue.x! - listener.x : 0, dz = positional ? cue.z! - listener.z : 0;
    const d = Math.hypot(dx, dz);
    const foreground = cue.channel === "foreground";
    const gain = (positional ? speechGain(d) : 1) * (foreground ? 0.92 : 0.72) * (!foreground && ducked ? 0.48 : 1);
    const pan = positional ? -(dx * Math.cos(listener.yaw) - dz * Math.sin(listener.yaw)) / Math.max(5, d) : 0;
    slot.playback.gain.gain.setTargetAtTime(gain, context.currentTime, 0.12);
    slot.playback.pan.pan.setTargetAtTime(Math.max(-1, Math.min(1, pan)), context.currentTime, 0.12);
  }
  function publish() {
    const active = [...slots.values()].filter((slot) => slot.state !== "waiting");
    active.sort((a, b) => b.cue.priority - a.cue.priority || distance(a.cue) - distance(b.cue));
    const current = active[0];
    const state = !enabled ? "muted" : paused && current ? "paused" : current?.state === "playing" ? "playing" : current ? "loading" : "idle";
    const id = current?.cue.line.id ?? "";
    const signature = `${state}:${id}`;
    if (signature !== lastReport) { lastReport = signature; report(state, id); }
    const foreground = slots.get("foreground")?.state === "playing";
    if (ducked !== foreground) { ducked = foreground; duck(ducked); }
    for (const slot of slots.values()) spatial(slot);
  }
  function disconnect(slot: Slot, stop: boolean) {
    const playback = slot.playback;
    slot.playback = null;
    if (!playback) return;
    playback.source.onended = null;
    if (stop) try { playback.source.stop(); } catch { /* Already ended. */ }
    playback.source.disconnect(); playback.gain.disconnect(); playback.pan.disconnect();
  }
  function cancel(slot: Slot) {
    disconnect(slot, true);
    slots.delete(slot.cue.channel);
    remember(slot.cue.key);
    progress({ key: slot.cue.key, state: "cancelled" });
  }
  function start(slot: Slot) {
    if (disposed || !enabled || paused || slot.state !== "ready" || !slot.buffer) return;
    const source = context.createBufferSource(), gain = context.createGain(), pan = context.createStereoPanner();
    source.buffer = slot.buffer;
    gain.gain.value = 0;
    source.connect(gain); gain.connect(pan); pan.connect(context.destination);
    slot.playback = { source, gain, pan };
    slot.state = "playing";
    recent.set(slot.cue.line.id, context.currentTime);
    source.onended = () => {
      if (disposed || slot.playback?.source !== source) return;
      disconnect(slot, false);
      slot.buffer = null;
      remember(slot.cue.key);
      progress({ key: slot.cue.key, state: "ended" });
      if (slot.cue.nextLine && slot.cue.channel !== "foreground") {
        slot.state = "waiting";
        slot.reserveUntil = context.currentTime + 2;
      } else slots.delete(slot.cue.channel);
      reconcile();
    };
    source.start();
    progress({ key: slot.cue.key, state: "playing", duration: slot.buffer.duration });
    publish();
  }
  function accept(cue: DialogueCue) {
    const slot: Slot = { cue, state: "loading", buffer: null, playback: null, reserveUntil: 0 };
    slots.set(cue.channel, slot);
    progress({ key: cue.key, state: "loading" });
    void load(cue.line).then((buffer) => {
      if (disposed || !enabled || slots.get(cue.channel) !== slot) return;
      if (!buffer) {
        remember(cue.key);
        slots.delete(cue.channel);
        progress({ key: cue.key, state: "unavailable" });
        report("unavailable", cue.line.id);
        reconcile();
      } else {
        slot.buffer = buffer;
        slot.state = "ready";
        start(slot);
      }
    });
    if (cue.nextLine) void load(cue.nextLine);
  }
  function reconcile() {
    if (disposed) return;
    const present = new Map(desired.map((cue) => [cue.key, cue]));
    for (const [channel, slot] of slots) {
      const cue = present.get(slot.cue.key);
      if (cue) slot.cue = cue;
      if (slot.state === "waiting" && context.currentTime >= slot.reserveUntil) slots.delete(channel);
      // Never stop a playing sentence because a scheduler moved on or the auto left.
      else if ((slot.state === "loading" || slot.state === "ready") && !cue) cancel(slot);
    }
    if (enabled) {
      const foreground = desired.find((cue) => cue.channel === "foreground" && !completed.has(cue.key));
      if (foreground && !slots.has("foreground")) accept(foreground);
      const candidates = desired.filter((cue) => cue.channel !== "foreground" && !completed.has(cue.key) && speechGain(distance(cue)) > 0)
        .sort((a, b) => distance(a) - distance(b));
      for (const cue of candidates) {
        const existing = slots.get(cue.channel);
        if (existing && existing.state !== "waiting") continue;
        if ([...slots.values()].some((slot) => slot.state !== "waiting" && slot.cue.line.characterId === cue.line.characterId)) continue;
        if (context.currentTime - (recent.get(cue.line.id) ?? -1000) < 30) continue;
        const worldCount = [...slots.keys()].filter((channel) => channel !== "foreground").length;
        if (!existing && worldCount >= STREET_VOICE_LIMIT) continue;
        accept(cue);
      }
      for (const slot of slots.values()) if (slot.state === "ready") start(slot);
    }
    const keep = new Set<string>();
    for (const slot of slots.values()) {
      keep.add(slot.cue.line.id);
      if (slot.cue.nextLine) keep.add(slot.cue.nextLine.id);
    }
    abortExcept(keep);
    publish();
  }
  return {
    get caption() {
      const slot = slots.get("foreground");
      return slot && slot.state !== "waiting" && slot.cue.audience === "player" ? slot.cue : null;
    },
    get pendingForeground() {
      return enabled && (!!slots.get("foreground") || desired.some((cue) => cue.channel === "foreground" && !completed.has(cue.key)));
    },
    get stats() {
      return { playing: [...slots.values()].filter((slot) => slot.state === "playing").length, loading: requests.size, cached: cache.size, channels: slots.size };
    },
    enable(value: boolean) {
      if (disposed) return;
      enabled = value;
      if (!value) {
        for (const cue of desired) remember(cue.key);
        for (const slot of slots.values()) cancel(slot);
        abortExcept(new Set());
      }
      reconcile();
    },
    pause(value: boolean) { if (!disposed) { paused = value; reconcile(); } },
    scene(cues: readonly DialogueCue[], position: Listener) {
      if (disposed) return;
      desired = cues;
      listener = position;
      if (!enabled) for (const cue of cues) remember(cue.key);
      reconcile();
    },
    cue(cue: DialogueCue | null, position: Listener) { this.scene(cue ? [cue] : [], position); },
    clear() {
      desired = [];
      for (const slot of slots.values()) cancel(slot);
      abortExcept(new Set());
      publish();
    },
    dispose() {
      if (disposed) return;
      this.clear();
      disposed = true;
      cache.clear(); completed.clear(); recent.clear();
    },
  };
}
