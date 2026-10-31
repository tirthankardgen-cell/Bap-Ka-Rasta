import { enginePitch, type Gear } from "./gears.ts";
import { createVoiceAudio } from "./voice-audio.ts";
import type { DialogueCue } from "./dialogue.ts";
// Field-recorded stems, fetched only after the player's sound gesture.
export function createStreetAudio(
  report: (state: string) => void,
  reportVoice: (state: string, clipId: string) => void = () => {},
) {
  let context: AudioContext | null = null,
    enabled = false,
    paused = true,
    disposed = false;
  let loading: Promise<void> | null = null;
  let voice: ReturnType<typeof createVoiceAudio> | null = null;
  let dialogue: DialogueCue | null = null;
  let listener = { x: 0, z: 0, yaw: 0 };
  let speaking = false;
  const abort = new AbortController();
  const loops = new Map<
    string,
    { source: AudioBufferSourceNode; gain: GainNode; level: number }
  >();
  const shots = new Set<AudioBufferSourceNode>();
  let hornBuffer: AudioBuffer | null = null,
    lastHorn = -10;
  function level(name: string, value: number, fade: number) {
    const loop = loops.get(name);
    if (!loop || !context) return;
    loop.level = value;
    loop.gain.gain.setTargetAtTime(value * (speaking ? 0.63 : 1), context.currentTime, fade);
  }
  function duck(value: boolean) {
    speaking = value;
    for (const [name, loop] of loops) level(name, loop.level, value ? 0.06 : 0.25);
  }
  function crossfade(buffer: AudioBuffer) {
    const overlap = Math.min(
      Math.floor(buffer.sampleRate * 0.25),
      Math.floor(buffer.length / 4),
    );
    const result = context!.createBuffer(
      buffer.numberOfChannels,
      buffer.length - overlap,
      buffer.sampleRate,
    );
    for (let c = 0; c < buffer.numberOfChannels; c++) {
      const input = buffer.getChannelData(c),
        output = result.getChannelData(c);
      output.set(input.subarray(0, output.length));
      for (let i = 0; i < overlap; i++) {
        const mix = i / overlap;
        output[i] = input[output.length + i] * (1 - mix) + input[i] * mix;
      }
    }
    return result;
  }
  function sync() {
    if (!context || disposed) return;
    voice?.pause(paused);
    if (enabled && !paused)
      void context.resume().catch(() => report("unavailable"));
    else {
      for (const source of shots) source.stop();
      shots.clear();
      void context.suspend().catch(() => {});
    }
  }
  async function load() {
    report("loading");
    try {
      const clips = await Promise.all(
        ["engine", "traffic", "market", "horn"].map(async (name) => {
          const response = await fetch(`/audio/mumbai/${name}.mp3`, {
            signal: abort.signal,
          });
          if (!response.ok)
            throw new Error(`Audio ${name}: ${response.status}`);
          const buffer = await context!.decodeAudioData(
            await response.arrayBuffer(),
          );
          return { name, buffer };
        }),
      );
      if (disposed) return;
      for (const { name, buffer } of clips) {
        if (name === "horn") {
          hornBuffer = buffer;
          continue;
        }
        const source = context!.createBufferSource(),
          gain = context!.createGain();
        source.buffer = crossfade(buffer);
        source.loop = true;
        gain.gain.value =
          name === "engine" ? 0.65 : name === "traffic" ? 0.22 : 0;
        source.connect(gain);
        gain.connect(context!.destination);
        source.start();
        loops.set(name, { source, gain, level: gain.gain.value });
        level(name, gain.gain.value, 0.06);
      }
      report("ready");
      sync();
    } catch {
      if (!disposed) {
        report("unavailable");
        loading = null;
      }
    }
  }
  return {
    enable(value: boolean) {
      if (disposed) return false;
      enabled = value;
      try {
        if (value) {
          context ??= new AudioContext();
          voice ??= createVoiceAudio(context, reportVoice, duck);
          voice.enable(true);
          sync();
          voice.cue(dialogue, listener);
          loading ??= load();
        } else {
          voice?.enable(false);
          sync();
        }
        return enabled;
      } catch {
        report("unavailable");
        enabled = false;
        return false;
      }
    },
    pause(value: boolean) {
      paused = value;
      sync();
    },
    dialogue(cue: DialogueCue | null, position: { x: number; z: number; yaw: number }) {
      dialogue = cue;
      listener = position;
      voice?.cue(cue, position);
    },
    clearDialogue() {
      dialogue = null;
      voice?.clear();
    },
    update(
      speed: number,
      throttle: boolean,
      nearby: number,
      market: number,
      gear: Gear,
    ) {
      if (!context || !enabled || paused) return;
      const engine = loops.get("engine"),
        traffic = loops.get("traffic"),
        crowd = loops.get("market");
      if (engine) {
        engine.source.playbackRate.setTargetAtTime(
          enginePitch(speed, gear, throttle),
          context.currentTime,
          0.25,
        );
        level("engine", throttle ? 0.8 : 0.5, 0.2);
      }
      if (traffic) level("traffic", 0.15 + Math.min(nearby / 12, 1) * 0.22, 0.8);
      if (crowd) level("market", market * 0.3, 0.8);
    },
    horn() {
      if (
        !context ||
        !hornBuffer ||
        !enabled ||
        paused ||
        context.currentTime - lastHorn < 0.4
      )
        return;
      lastHorn = context.currentTime;
      const source = context.createBufferSource(),
        gain = context.createGain();
      source.buffer = hornBuffer;
      gain.gain.value = 0.85;
      source.connect(gain);
      gain.connect(context.destination);
      shots.add(source);
      source.onended = () => {
        shots.delete(source);
        source.disconnect();
        gain.disconnect();
      };
      source.start();
    },
    trafficHorn(distance: number, pan: number) {
      if (!context || !hornBuffer || !enabled || paused || disposed) return;
      const source = context.createBufferSource();
      const gain = context.createGain();
      const stereo = context.createStereoPanner();
      source.buffer = hornBuffer;
      source.playbackRate.value = 0.85;
      gain.gain.value = 0.55 * Math.max(0, 1 - distance / 24);
      stereo.pan.value = Math.max(-1, Math.min(1, pan));
      source.connect(gain);
      gain.connect(stereo);
      stereo.connect(context.destination);
      shots.add(source);
      source.onended = () => {
        shots.delete(source);
        source.disconnect();
        gain.disconnect();
        stereo.disconnect();
      };
      source.start(0, 0, Math.min(0.65, hornBuffer.duration));
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      abort.abort();
      voice?.dispose();
      for (const { source, gain } of loops.values()) {
        source.stop();
        source.disconnect();
        gain.disconnect();
      }
      loops.clear();
      for (const source of shots) source.stop();
      shots.clear();
      if (context) void context.close().catch(() => {});
    },
  };
}
