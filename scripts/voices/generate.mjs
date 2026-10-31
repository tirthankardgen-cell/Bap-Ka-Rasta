import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";
import { createHash } from "node:crypto";
import { mkdir, readFile, rename, stat, writeFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import { dialogue, recordingLines } from "./dialogue.mjs";
import { freeCast } from "./free-cast.mjs";

const root = fileURLToPath(new URL("../../", import.meta.url));
const assetRoot = join(root, "assets/audio/mumbai/voices");
const manifestPath = join(assetRoot, "manifest.json");
const modelId = "eleven_v4";
const format = "mp3_44100_128";
const hash = (data) => createHash("sha256").update(data).digest("hex");
const args = process.argv.slice(2);
const only = args.find((arg) => arg.startsWith("--only="))?.slice(7);
const allLines = recordingLines();
const lines = allLines.filter((line) => !only || line.id.includes(only));
if (!lines.length) throw new Error("No recording lines matched --only.");
let manifest;
try {
  manifest = JSON.parse(await readFile(manifestPath, "utf8"));
} catch (error) {
  if (error.code !== "ENOENT") throw error;
  manifest = {
    version: 1,
    provider: "ElevenLabs",
    modelId,
    outputFormat: format,
    accountTier: "free",
    voiceSource: "Included premade voices only; no paid library voices.",
    language: "Hindi with familiar Marathi words, Mumbai only",
    license: "ElevenLabs free-plan output: non-commercial use with ElevenLabs attribution; not Creative Commons.",
    termsUrl: "https://elevenlabs.io/terms-of-use",
    clips: [],
  };
}
const byId = new Map(manifest.clips.map((clip) => [clip.id, clip]));
function settingsFor(line) {
  return { stability: freeCast[line.characterId][1], similarityBoost: 0.75 };
}
function signature(line) {
  return hash(JSON.stringify({ text: line.text, voiceId: freeCast[line.characterId][0], modelId, settings: settingsFor(line), format }));
}
const pending = [];
for (const line of lines) {
  const old = byId.get(line.id);
  if (old?.inputSha256 === signature(line)) {
    try {
      const bytes = await readFile(join(root, "public", old.url));
      if (hash(bytes) === old.sha256) continue;
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }
  }
  pending.push(line);
}
const required = pending.reduce((sum, line) => sum + [...line.text].length, 0);
console.log(JSON.stringify({ totalClips: allLines.length, selected: lines.length, pending: pending.length, estimatedCharacters: required, modelId, freeVoicesOnly: true }));
if (args.includes("--dry-run") || !pending.length) process.exit(0);
if (!process.env.ELEVENLABS_API_KEY) throw new Error("Load ELEVENLABS_API_KEY from your private environment before generating speech.");
const client = new ElevenLabsClient();

async function api(path) {
  const response = await fetch(`https://api.elevenlabs.io${path}`, {
    headers: { "xi-api-key": process.env.ELEVENLABS_API_KEY },
    signal: AbortSignal.timeout(30_000),
  });
  const body = await response.json();
  if (!response.ok) throw new Error(`ElevenLabs ${response.status}: ${body.detail?.message ?? "request failed"}`);
  return body;
}
function run(binary, parameters) {
  const result = spawnSync(binary, parameters, { encoding: "utf8", windowsHide: true, timeout: 60_000, maxBuffer: 8 * 1024 * 1024 });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${binary} failed: ${result.stderr?.slice(-1500)}`);
  return result;
}
const ffmpeg = process.env.FFMPEG_PATH || "ffmpeg";
const ffprobe = process.env.FFPROBE_PATH || "ffprobe";
run(ffmpeg, ["-version"]);
run(ffprobe, ["-version"]);
const subscription = await api("/v1/user/subscription");
const remaining = subscription.character_limit - subscription.character_count;
if (required > remaining) throw new Error(`Insufficient included credits: need about ${required}, have ${remaining}. No speech was requested.`);
// Never accept a library voice just because its listing says free_users_allowed:
// the API still paywalls those voices. Only account-included premade voices pass.
const account = await api("/v2/voices?page_size=100");
const available = new Map(account.voices.map((voice) => [voice.voice_id, voice]));
const cast = dialogue.map((character) => {
  const [voiceId, stability, reason] = freeCast[character.id];
  const voice = available.get(voiceId);
  if (!voice || voice.category !== "premade") throw new Error(`${character.id}: refusing a voice outside the free premade cast.`);
  if (voice.labels?.gender !== character.gender) throw new Error(`${character.id}: voice gender mismatch.`);
  return {
    characterId: character.id,
    characterAge: character.age,
    gender: character.gender,
    voiceId,
    voiceName: voice.name,
    category: voice.category,
    sourceAccent: voice.labels?.accent,
    sourceLanguage: voice.labels?.language ?? "en",
    sourceAge: voice.labels?.age,
    settings: { stability, similarityBoost: 0.75 },
    direction: character.direction,
    reason,
  };
});
await mkdir(assetRoot, { recursive: true });
await writeFile(join(assetRoot, "cast.json"), JSON.stringify({ version: 1, policy: "Free account; included premade voices only. Hindi synthesis with Marathi words. These presets are not native Mumbai actors.", cast }, null, 2) + "\n");

function probe(path) {
  return JSON.parse(run(ffprobe, ["-v", "error", "-show_entries", "format=duration:stream=codec_name,sample_rate,channels", "-of", "json", path]).stdout);
}
async function saveManifest() {
  manifest.clips = allLines.flatMap((line) => byId.has(line.id) ? [byId.get(line.id)] : []);
  await writeFile(manifestPath + ".tmp", JSON.stringify(manifest, null, 2) + "\n");
  await rename(manifestPath + ".tmp", manifestPath);
}
for (const [index, line] of pending.entries()) {
  const voiceId = freeCast[line.characterId][0];
  const masterRelative = `assets/audio/mumbai/voices/masters/${line.characterId}/${line.id}.mp3`;
  const masterPath = join(root, masterRelative);
  const url = `audio/mumbai/voices/${line.characterId}/${line.id}.mp3`;
  const outputPath = join(root, "public", url);
  await mkdir(join(root, "assets/audio/mumbai/voices/masters", line.characterId), { recursive: true });
  await mkdir(join(root, "public/audio/mumbai/voices", line.characterId), { recursive: true });
  // Resume from an already downloaded master without spending credits again.
  let reuseMaster = false;
  try {
    const receipt = JSON.parse(await readFile(masterPath + ".json", "utf8"));
    reuseMaster = receipt.inputSha256 === signature(line) && (await stat(masterPath)).size > 1000;
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
  let createdAt = new Date().toISOString();
  if (!reuseMaster) {
    try {
      const audio = await client.textToSpeech.convert(voiceId, {
        text: line.text,
        modelId,
        outputFormat: format,
        languageCode: "hi",
        voiceSettings: settingsFor(line),
      }, { maxRetries: 0, timeoutInSeconds: 120 });
      const chunks = [];
      for await (const chunk of audio) chunks.push(chunk);
      const data = Buffer.concat(chunks);
      if (data.length < 1000) throw new Error(`${line.id}: empty or truncated audio response.`);
      await writeFile(masterPath + ".part", data);
      await rename(masterPath + ".part", masterPath);
      await writeFile(masterPath + ".json", JSON.stringify({ inputSha256: signature(line), createdAt }) + "\n");
    } catch (error) {
      await saveManifest();
      // SDK errors can include request details. Keep the key and headers out of logs.
      const detail = error.body?.detail;
      console.error(JSON.stringify({ clip: line.id, status: error.statusCode, code: detail?.code ?? detail?.status, message: detail?.message ?? "Generation failed; completed recordings are preserved." }));
      process.exit(1);
    }
  } else {
    createdAt = JSON.parse(await readFile(masterPath + ".json", "utf8")).createdAt;
  }
  const trim = "silenceremove=start_periods=1:start_duration=0.015:start_threshold=-50dB,areverse,silenceremove=start_periods=1:start_duration=0.015:start_threshold=-50dB,areverse,aformat=channel_layouts=mono,adelay=80,apad=pad_dur=0.12";
  run(ffmpeg, ["-hide_banner", "-loglevel", "error", "-y", "-i", masterPath, "-af", `${trim},loudnorm=I=-18:TP=-1.5:LRA=9`, "-ac", "1", "-ar", "44100", "-codec:a", "libmp3lame", "-b:a", "128k", "-f", "mp3", outputPath + ".part"]);
  const metadata = probe(outputPath + ".part");
  const duration = Number(metadata.format.duration);
  if (!Number.isFinite(duration) || duration < 0.4 || duration > 7) throw new Error(`${line.id}: unexpected duration ${duration}; downloaded master kept for review.`);
  await rename(outputPath + ".part", outputPath);
  const bytes = await readFile(outputPath);
  byId.set(line.id, {
    id: line.id, characterId: line.characterId, voiceId, modelId,
    voiceSettings: settingsFor(line), languageCode: "hi", secondaryLanguage: "mr",
    text: line.text, inputSha256: signature(line), createdAt, url,
    masterPath: masterRelative, masterSha256: hash(await readFile(masterPath)),
    sha256: hash(bytes), bytes: bytes.length, duration: Math.round(duration * 1000) / 1000,
    sampleRate: 44100, channels: 1, bitrate: 128000,
    processing: "Edge silence trimmed, 80 ms lead-in, 120 ms tail, mono 44.1 kHz MP3; -18 LUFS / -1.5 dBTP loudness target.",
  });
  await saveManifest();
  console.log(`${index + 1}/${pending.length} ${line.id} ${duration.toFixed(2)}s`);
}
const after = await api("/v1/user/subscription");
manifest.lastGenerationUsage = { before: subscription.character_count, after: after.character_count, includedLimit: after.character_limit };
await saveManifest();
console.log(JSON.stringify({ complete: true, files: manifest.clips.length, creditsRemaining: after.character_limit - after.character_count }));
