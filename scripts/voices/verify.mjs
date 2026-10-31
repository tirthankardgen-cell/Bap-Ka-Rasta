import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { join, sep } from "node:path";
import { spawnSync } from "node:child_process";
import { characters, createActors } from "../../src/game/characters.ts";
import { voiceLines } from "../../src/game/voice-lines.generated.ts";
import { recordingLines } from "./dialogue.mjs";
import { freeCast } from "./free-cast.mjs";

const root = fileURLToPath(new URL("../../", import.meta.url));
const readJson = async (path) => JSON.parse(await readFile(join(root, path), "utf8"));
const sha = (bytes) => createHash("sha256").update(bytes).digest("hex");
const script = recordingLines();
const manifest = await readJson("assets/audio/mumbai/voices/manifest.json");
const { cast } = await readJson("assets/audio/mumbai/voices/cast.json");
assert.equal(manifest.accountTier, "free");
assert.equal(cast.length, characters.length);
assert.equal(manifest.clips.length, script.length);
assert.equal(new Set(manifest.clips.map((clip) => clip.id)).size, script.length);
assert.equal(voiceLines.length, script.length);
const clips = new Map(manifest.clips.map((clip) => [clip.id, clip]));
const runtime = new Map(voiceLines.map((line) => [line.id, line]));
const openings = new Map();
for (const line of script) {
  const first = line.subtitle.toLowerCase().match(/[a-z]+/)?.[0];
  assert.ok(first, `${line.id}: missing readable subtitle`);
  openings.set(first, (openings.get(first) ?? 0) + 1);
}
assert.ok(openings.size >= script.length * 0.7, "Vary the opening words across the script");
assert.ok(Math.max(...openings.values()) <= Math.ceil(script.length * 0.1), "One opening word must not dominate the pack");
for (const character of characters) {
  const voice = cast.find((voice) => voice.characterId === character.id);
  assert.ok(voice, `${character.id}: missing cast`);
  assert.equal(voice.gender, character.gender, `${character.id}: wrong voice gender`);
  assert.equal(voice.category, "premade", `${character.id}: paid/library voice is forbidden`);
  assert.equal(voice.voiceId, freeCast[character.id][0]);
  if (character.id !== "sachin") {
    for (const event of ["ambient", "warning", "chat", "reply"])
      assert.ok(script.some((line) => line.characterId === character.id && line.event === event), `${character.id}: missing ${event}`);
    const questions = script.filter((line) => line.characterId === character.id && line.event === "chat");
    assert.ok(new Set(questions.map((line) => line.topic)).size >= 2, `${character.id}: needs two conversation topics`);
    for (const question of questions) assert.ok(script.some((line) => line.characterId !== character.id && line.event === "reply" && line.topic === question.topic), `${question.id}: no neighbour can answer this topic`);
  }
}
for (const actor of createActors()) assert.ok(cast.some((voice) => voice.characterId === characters[actor.character].id));
for (const line of script) {
  const clip = clips.get(line.id), game = runtime.get(line.id);
  assert.ok(clip && game, `${line.id}: missing recording or runtime entry`);
  assert.equal(clip.text, line.text);
  assert.equal(clip.voiceId, freeCast[line.characterId][0]);
  assert.equal(clip.voiceSettings.stability, freeCast[line.characterId][1]);
  assert.equal(clip.modelId, "eleven_v4");
  assert.equal(game.subtitle, line.subtitle);
  assert.equal(game.meaning, line.meaning);
  assert.equal(game.topic, line.topic);
  assert.equal(game.duration, clip.duration);
  assert.equal(game.url, "/" + clip.url);
  assert.equal(clip.url, `audio/mumbai/voices/${line.characterId}/${line.id}.mp3`);
  assert.equal(clip.masterPath, `assets/audio/mumbai/voices/masters/${line.characterId}/${line.id}.mp3`);
  assert.ok(line.subtitle.split(/\s+/).length <= 13, `${line.id}: keep the line short`);
  assert.ok(clip.duration > 0.5 && clip.duration <= 5.5, `${line.id}: clip is not a short street line`);
  assert.equal(clip.channels, 1);
  assert.equal(clip.sampleRate, 44100);
  const [data, master] = await Promise.all([readFile(join(root, "public", clip.url)), readFile(join(root, clip.masterPath))]);
  assert.equal(data.length, clip.bytes);
  assert.equal(sha(data), clip.sha256, `${line.id}: corrupt runtime audio`);
  assert.equal(sha(master), clip.masterSha256, `${line.id}: corrupt source audio`);
  const receipt = await readJson(clip.masterPath + ".json");
  assert.equal(receipt.inputSha256, clip.inputSha256, `${line.id}: stale generation receipt`);
  if (process.argv.includes("--decode")) {
    const decoded = spawnSync(process.env.FFMPEG_PATH || "ffmpeg", ["-v", "error", "-xerror", "-i", join(root, "public", clip.url), "-f", "null", "-"], { encoding: "utf8", windowsHide: true, timeout: 20_000 });
    if (decoded.error) throw decoded.error;
    assert.equal(decoded.status, 0, `${line.id}: decode failed: ${decoded.stderr}`);
  }
}
const filesBelow = async (path) => (await readdir(join(root, path), { recursive: true })).map((name) => name.split(sep).join("/"));
const publicFiles = await filesBelow("public/audio/mumbai/voices");
const masterFiles = await filesBelow("assets/audio/mumbai/voices/masters");
const expectedAudio = manifest.clips.map((clip) => `${clip.characterId}/${clip.id}.mp3`).sort();
assert.deepEqual(publicFiles.filter((file) => file.endsWith(".mp3")).sort(), expectedAudio, "Remove obsolete runtime recordings");
assert.deepEqual(masterFiles.filter((file) => file.endsWith(".mp3")).sort(), expectedAudio, "Source recordings must match the script");
assert.deepEqual(masterFiles.filter((file) => file.endsWith(".json")).sort(), expectedAudio.map((file) => file + ".json"), "Generation receipts must match the script");
const qa = await readJson("assets/audio/mumbai/voices/qa.json");
assert.equal(qa.scriptSha256, sha(JSON.stringify(manifest.clips.map((clip) => [clip.id, clip.inputSha256]))), "Content QA belongs to an older script");
for (const sample of qa.samples) assert.equal(sample.sha256, clips.get(sample.id)?.sha256, `${sample.id}: transcription belongs to an older recording`);
assert.ok(clips.get("mum_raju_greet_intro_01").duration < 5.5);
assert.ok(clips.get("mum_sachin_ignition_01").duration < 4);
const people = await readFile(join(root, "docs/mumbai-characters/people-voices.csv"), "utf8");
assert.equal(people.trim().split("\n").length - 1, createActors().length + 1);
const credits = await readFile(join(root, "public/audio/credits.html"), "utf8");
assert.match(credits, /ElevenLabs/);
assert.match(credits, /non-commercial/i);
console.log(`Verified ${script.length} short Mumbai clips, ${cast.length} gender-matched roles, and ${createActors().length + 1} people. ${process.argv.includes("--decode") ? "Every MP3 fully decoded." : "Source and runtime checksums match."}`);
