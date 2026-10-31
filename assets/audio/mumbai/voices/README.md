# Mumbai character voices

119 downloaded ElevenLabs MP3 recordings, rewritten and recorded for this game on 2026-10-31. The script uses short Hindi lines with occasional Marathi phrases and 97 different opening words. Spoken lines last about 2–5 seconds. This voice pack is only for Mumbai.

- [Full line list, grouped by character](../../../../docs/mumbai-characters/VOICE-LINES.md)
- [Recording sheet](../../../../docs/mumbai-characters/voice-lines.csv)
- [Every person's assignment](../../../../docs/mumbai-characters/people-voices.csv)
- [Cast, settings and selection reasons](cast.json)
- [Generation, processing and checksum manifest](manifest.json)
- [Transcription checks for eight new samples, including Marathi phrases](qa.json)
- [Listen to the recordings](../../../../public/audio/mumbai/voices/index.html)

The player and all 1,542 street people have voice assignments. Background people retain their own names and use their character design's gender and role. Each local has a street remark, a warning and two question/reply pairs. Stationary neighbours discuss cricket, prices, rain, local trains or rent, turning toward each other during an exchange. Walking people and solo vendors also make occasional remarks. Mild impacts produce the struck person's own reaction.

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

The city schedules staggered conversations independently of the player's position and speed. Stationary partners must be within 7.5 metres, have a clear pavement path, and share a topic. The mixer plays up to four street voices plus one foreground voice. Distance continuously changes volume out to 120 metres; driving away never stops a sentence that has started. A short gap follows actual playback completion before a related reply. A mild impact lets the current sentence finish, discards its pending social reply and queues the struck person's warning. Actor and clip cooldowns limit repetition.

Captions appear only for dialogue directed at the player: the opening and pedestrian warnings. Neighbour gossip and Sachin's self-talk have no captions. Foreground speech ducks street voices and ambience. Pause suspends the shared audio context; mute, skip, reset and exit explicitly stop speech. Muted or missing player-directed audio retains its caption.

Audio loading is asynchronous, with at most two fetch/decode jobs in flight and 24 decoded clips cached. Only selected audible lines and their related replies are fetched. A delayed download holds that turn until it starts or fails, without blocking driving; playback completion controls the end of an audible turn. Missing assets leave the street running, and disposed sessions cannot start late recordings.

The verification script checks every cast assignment, every person's coverage, the exact audio file set, varied openings, topic coverage, text/subtitle consistency, short durations, source/runtime SHA-256 hashes, transcription fingerprints, attribution, and optional full MP3 decoding. Runtime tests cover listener-independent scheduling, delayed downloads, real completion before replies, distance falloff, concurrent voices, player-only captions, warnings, pause, mute and stale fetches. Automated checks do not certify a native accent or replace a native Marathi listener's review.
