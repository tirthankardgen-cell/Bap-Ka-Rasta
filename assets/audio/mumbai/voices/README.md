# Mumbai character voices

118 downloaded ElevenLabs MP3 recordings, made for this game on 2026-10-31. The script uses short Hindi lines with familiar Marathi words. Spoken lines last about 2–5 seconds. This voice pack is only for Mumbai.

- [Full line list, grouped by character](../../../../docs/mumbai-characters/VOICE-LINES.md)
- [Recording sheet](../../../../docs/mumbai-characters/voice-lines.csv)
- [Every person's assignment](../../../../docs/mumbai-characters/people-voices.csv)
- [Cast, settings and selection reasons](cast.json)
- [Generation, processing and checksum manifest](manifest.json)
- [Transcription checks for 24 samples across all twenty characters](qa.json)
- [Listen to the recordings](../../../../public/audio/mumbai/voices/index.html)

The player and all 1,542 street people have voice assignments. Background people retain their own names and use their character design's gender and role. Nearby stationary people can exchange a question and reply on the same topic: chai, the breeze, or the daily rush. They turn toward each other during their exchange. Vendors also make occasional short calls, and mild impacts produce the struck person's own reaction.

## Free-account casting and usage

The user requested free options only. All synthesis uses **included premade voices**, with 18 voice presets for 20 roles. Sarah is shared by Aarti/Pooja, and Lily by Lata/Shanta, using different stability settings and separately recorded lines. Every role has the correct male/female voice. Hindi synthesis plus the Marathi script supplies the language; these presets are **not native Mumbai actors**, and the older female voice is an approximation. Paid Indian library voices and custom voice design were unavailable through this free account's API and were not used for these recordings.

**Free-plan output is for non-commercial use and requires ElevenLabs attribution.** The deployed [audio credits](../../../../public/audio/credits.html) credit [ElevenLabs](https://elevenlabs.io). The recordings are not covered by the field recordings' Creative Commons licenses. Do not treat later subscription upgrades as a retroactive commercial license for this free-generated pack; replace it with appropriately licensed recordings before commercial/advertising use. See the [ElevenLabs terms](https://elevenlabs.io/terms-of-use).

## Production

The ElevenLabs SDK is a development dependency, used only by the offline generation script. The game makes no ElevenLabs requests and does not need a key or server.

1. Edit [dialogue.mjs](../../../../scripts/voices/dialogue.mjs). Only `text` is synthesized; direction and English meanings never enter the spoken script. Keep Roman subtitles at 13 words or fewer. `chat` and `reply` clips are paired by topic.
2. Keep `ELEVENLABS_API_KEY` in the ignored `.env.local`. Never add `VITE_` to its name. The `.env.example` has an empty placeholder.
3. Install FFmpeg and ffprobe, or set `FFMPEG_PATH` and `FFPROBE_PATH` to their executables. Use the project's supported Node.js 22.18+ or 24 runtime.
4. Preview work without any API call: `npm run voices:generate -- --dry-run`.
5. Generate: `npm run voices:generate`. Optionally select one character/clip with `-- --only=meera` or `-- --only=mum_meera_chat_01`.
6. Run `npm run voices:catalogue`, `npm run voices:verify`, `npm test`, and `npm run build`. Use `npm run voices:verify -- --decode` for full FFmpeg decoding.

Generation refuses voices outside the free premade cast, checks gender metadata and remaining included credits before synthesis, disables automatic synthesis retries, and saves each completed file immediately. Re-running skips matching recordings. Original compressed outputs are retained under `masters/`; per-file receipts let an interrupted normalization resume without requesting speech again. These MP3 originals are not lossless masters.

Runtime MP3s live under `public/audio/mumbai/voices/<character>/`. Processing trims only edge silence, adds 80 ms of lead-in and a 120 ms tail, converts to mono 44.1 kHz / 128 kbps MP3, and targets -18 LUFS with a -1.5 dBTP ceiling. No music, traffic, pitch-shifting, celebrity imitation or cloned voice samples are added.

## Playback and verification

One foreground voice plays at a time. Neighbours must be stopped within 5.5 metres of each other and on the same pavement, with the listener within 16 metres. Related replies follow a short gap; leaving the area, driving away, an impact, skip, reset or exit discards stale dialogue. Actor and line cooldowns prevent repeated calls. The existing recorded market bed supplies distant crowd sound.

Speech shares the street audio context, ducks engine/ambience by about 4 dB, and uses distance and stereo placement. Pause suspends speech with the scene; mute stops it while retaining subtitles. Loading is asynchronous, caches at most 24 decoded clips, and prefetches only the current line and its related reply. A missing/slow asset falls back to subtitles; it never blocks driving or starts after disposal.

The verification script checks every cast assignment, every person's coverage, complete recordings, text/subtitle consistency, short durations, source and runtime SHA-256 hashes, attribution, and optional full MP3 decoding. Runtime tests cover paired conversation timing, distance/occlusion rejection, warnings, pause, mute and stale fetches. Automated checks do not certify a native accent or replace a native Marathi listener's review.
