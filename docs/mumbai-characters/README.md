# Mumbai characters, crowd variety and voice production

**Implementation update:** the game now includes all 20 procedural character designs (Sachin plus 19 uniquely placed named locals), varied district crowds, a guided driver-entry opening, skip/pause/reduced-motion support and subtitles. Constable Patil is male. Character recordings remain unlinked until audio is supplied; no missing voice assets are fetched. The tables below remain the production brief. Advanced schedules, full on-foot movement, saved camera preferences, passenger jobs, shop purchases and repairs are still future work. See the [playable guide](../Mumbai-Playable.md) for current behaviour.

## Visual references

- [Main cast: eight characters](images/01-mumbai-main-cast.png)
- [Street crowd: twelve additional characters](images/02-mumbai-street-crowd.png)
- [Six-panel walk-up and entry storyboard](images/03-driver-opening.png)

Concept boards generated with OpenAI image generation on 2026-10-26 for this project; the main cast was revised to make Patil male. These are original generated concepts, not imported Roblox assets or finished 3D models. Use blocky heads/bodies for people, with distinct faces, silhouettes and clothing; keep buildings, vehicles and props materially more realistic. The written character table is authoritative if art differs in accessories, uniform detail or labels. The opening board is mood/composition guidance: entry must be from the actual pavement-facing opening, with no invented hinged car door. The third-person transition must avoid passing through the canopy.

## Opening: from pavement to driver

Start in a fictional Mumbai suburban auto stand beside a chai stall, chawl frontage and side lane. This is a better everyday auto setting than presenting a South Mumbai landmark as a legally accurate auto route. The existing map is inspired by Mumbai, not an exact recreation. Keep landmark sightseeing within the game's fictional geography.

| State / timing | View and action | Interaction / voice |
| --- | --- | --- |
| Ready screen | Existing city/vehicle selection leads to `Chal Chala`. Load nearby scene, entry animation and first two clips. | This tap also resumes browser audio; never depend on autoplay before a gesture. Missing voice files must not block play. |
| Approach, ~0–4 s | Driver POV on pavement, khaki cuff and keys; auto 3–4 m ahead. Short guided walk on a protected path. | Raju: “Kay mhantos, Sachin? Aaj kuthe phiraycha?” One greeting only. `Skip intro` always visible. |
| Enter, ~4–6 s | Turn toward the pavement-side open cabin, hand grips frame, foot steps onto floorboard, body settles onto seat. | Keys, footsteps, seat rustle; no car-door slam. Traffic yields at the reserved exit. |
| Seated, ~6–8 s | 1P: hands on handlebar, dashboard and windscreen. Ignition starts actual engine audio. | Sachin: “Chala, Mumbai! Aaj aaramat phirte hain.” Keep the engine audible without covering speech. |
| Camera handoff, ~8–9 s | Brief exterior shot via an unobstructed side route or short fade, then default 3P. | Hold vehicle stationary until handoff completes. Honor a saved camera preference on later drives; `C`/camera button remains available. |
| Driving | Enable throttle, steering, brake and horn; restore normal traffic reservations. | Free roam begins. No mission timer or compulsory passenger task. |

Implementation states: `ready → approach → entering → seated → handoff → driving`. Only the entry controller owns the camera until handoff. Start/retry/skip must call the same idempotent completion routine: driver seated, keys/intro props removed, camera attached, input cleared, engine state correct, exit clear. Pause freezes both animation and speech; exit/dispose cancels scheduled clips and entry reservations. Reset while driving resets the vehicle, not the whole intro.

First visit: play the short intro. Later visits: offer `Walk to auto` and `Seedha drive`. Reduced-motion mode uses static views with short fades and no head bob. Skip jumps directly to a safe seated pose and selected driving camera; no leftover greeting plays afterward. Optional later milestone: free walking within the small auto-stand area using WASD/touch joystick and `E / Baitho` to enter. Do not require a full on-foot city system for the first release.

## Main cast and voice briefs

Use the descriptions as ElevenLabs voice-selection/design prompts. Each is an original voice, natural Indian delivery, conversational and close-mic, without music, reverb or traffic baked into the recording. Keep one stable voice per character across all takes. Names describe fictional people, not celebrity impressions.

| ID / character | Design and street role | Voice prompt / delivery |
| --- | --- | --- |
| `sachin` — Sachin, 32, male | Player driver; khaki short-sleeve pocket shirt/trousers, neat moustache, sandals, keys. | Warm mid-register male, early 30s, easy Mumbai Hindi with clear Marathi words. Quiet confidence, dry humour, medium pace; feels like speaking from the driver's seat. |
| `raju` — Raju Kaka, 58, male | Senior auto driver; khaki uniform, greying moustache, shoulder towel, relaxed stance. One home auto stand. | Lower male register, lightly weathered, affectionate local mentor. Unhurried and gently amused; never a shouting caricature. |
| `meera` — Meera Tai, 43, female | Chai/snack stall owner; green sari, maroon blouse, apron, kettle. | Warm resonant middle-aged female, brisk friendly stall-side delivery. Clear Marathi/Hindi switch, inviting projection rather than yelling. |
| `sameer` — Sameer, 28, male | Mechanic; blue work shirt, dark trousers, wrench, workshop stool. | Youthful medium-low male, practical and relaxed, slightly dry humour, clipped reassuring sentences. |
| `aarti` — Aarti, 27, female | Office commuter; blue kurta, cream trousers, backpack and phone. | Clear mid-high female, focused and lightly hurried, urban Hindi/English mix; no exaggerated accent. |
| `imran` — Imran, 21, male | Student; burgundy hoodie, jeans, headphones and book bag. | Bright youthful male, playful but understated, slightly faster cadence. Short reactions, no nonstop meme shouting. |
| `lata` — Lata Mavshi, 55, female | Flower seller; purple sari, orange blouse, marigold basket. | Textured warm middle-aged female, musical marketplace cadence, gentle Marathi-inflected Hindi, distinct from Meera's brisk rhythm. |
| `patil` — Constable Patil, 45, **male** | Traffic constable; white shirt/cap, khaki trousers, moustache, whistle. Calm signal-side stance. | Grounded mid-low male, firm clear diction, controlled projection, short instructions. Reassuring authority, not aggressive or comic. |

## Twelve more street characters

These are visual archetypes for individually named background variants of the same designs; the named version can have a single home location. Do not spawn multiple copies of the same named person together. Work/age does not restrict which neighbourhood somebody can visit.

| ID / character | Appearance / prop | Activity | Optional background voice prompt |
| --- | --- | --- | --- |
| `nilesh` — Nilesh, 38, male | White kurta-pajama, Gandhi cap, metal tiffins | Check route, sort tiffins, walk to station pickup | Light mid-register male, efficient, friendly, clear short calls |
| `farah` — Farah, 36, female | Teal salwar suit, striped apron, fruit basket | Weigh fruit, hand over bag, chat with shopper | Bright adult female, steady market projection, easy Hindi |
| `suresh` — Suresh, 61, male | Beige checked shirt, dark trousers, newspapers | Sort papers, offer a copy, sit on stool | Older light gravelly male, short rhythmic street calls |
| `pooja` — Pooja, 26, female | Lilac scrubs, ID lanyard, tote | Commute, wait at crossing, check watch | Soft clear female, measured and practical, tired but pleasant |
| `vikram` — Vikram, 35, male | Pale blue shirt, navy trousers, glasses, laptop satchel | Check phone, queue, brisk walk | Medium male, contained office-worker cadence, mild urgency |
| `zoya` — Zoya, 22, female | Rust overshirt, black trousers, bob haircut, sketchbook | Sketch frontage, sit, show friend drawing | Airy mid-register female, curious, expressive but relaxed |
| `bala` — Bala, 25, male | Plain orange jacket, helmet, insulated bag | Park at marked bay, check address, hand off parcel | Energetic mid-register male, quick natural Hindi/English mix |
| `jyoti` — Jyoti, 41, female | Blue workwear, lime vest, gloves, broom | Sweep pavement edge, pause to let people pass | Low-mid female, matter-of-fact and friendly, deliberate speech |
| `shanta` — Shanta Aaji, 70, female | Muted blue sari, grey bun, glasses, shopping bag | Slow walk, rest on bench, greet neighbour | Older soft female, warm measured Marathi/Hindi, never frail parody |
| `dev` — Dev, 30, male | Green overshirt, tan cargos, camera and folding map | Photograph facade from pavement, ask directions | Light male, curious and polite, clear standard Hindi |
| `asha` — Asha, 29, female | Purple sports tee, dark running pants, ponytail, bottle | Jog promenade, stretch, drink water | Clear upbeat female, short lightly breathy phrases, no heavy panting |
| `ganesh` — Ganesh, 40, male | Ochre shirt, grey trousers, shoulder towel, crates | Carry stock between loading bay and shop | Resonant adult male, practical, short projected requests |

## Every few blocks should feel different

Do not increase all 738 current pedestrian agents into expensive detailed actors. First replace the repeated look with shared rigs and local activity groups. Density means busy pavement edges and queues, not filling the driving lane with obstacles.

| Neighbourhood kit | Crowd mix / motion | Distinct scene details | Example voices |
| --- | --- | --- | --- |
| Auto stand + station approach | Raju at one stand; commuter groups, tiffin carriers, newspaper readers; brisk directional flow | Auto queue, tea glasses, station exit, paper stall, luggage, pickup bay | Raju, Aarti, Nilesh, Suresh |
| Bazaar / flower lane | Shoppers pause and browse; sellers mostly stationary; porters make short trips | Fruit scales, flower strings, canvas awnings, crates, sack stacks | Lata, Farah, Ganesh |
| Chawl / residential galli | Neighbours talking, seated elders, occasional delivery; calmer vehicle speeds | Stoops, shared corridor, laundry, parked cycles, small grocery | Shanta, Bala, Meera |
| Office / Art Deco avenue | Laptop bags, scrubs, students; crossing waves during signals | Cafe queue, office lobby, bus-stop shelter, lunch tiffins | Aarti, Vikram, Pooja |
| Workshop / service lane | Mechanics, deliveries, customers and repair queues | Tool bench, stacked tyres, open workshop, loading bay | Sameer, Bala, Ganesh |
| Waterfront promenade | Joggers, strolling pairs, sketchers, visitors, fewer sellers | Benches, palms, viewing rail, juice cart, shaded rest spot | Asha, Zoya, Dev |

Treat these as authored scene kits linked to road segments, not claims about exact real-world geography. Keep the next two blocks different in frontage, activity and dominant silhouettes. Market may lead to workshop, then residential; do not alternate the same two kits indefinitely. Different side streets can mix kits while preserving their neighbourhood character.

Proposed population rules:

- Mark fixed **home anchors** for named cast. A moving named person is one persistent entity, not one per visible block. Sachin appears only as the player.
- Create 4–6 compatible wardrobe/face/prop variants per background archetype. Vary skin tone, hair, age detail, height (~±8%), bags and gait as well as shirt colour. Preserve uniform rules for drivers, traffic staff and workwear. Target 48–72 background combinations; this is a production target, not an implemented count.
- Block seed stores identity and schedule so looking away and back does not reroll people. Reject an identical outfit + hair + prop combination within 50 m; avoid the same named character or distinctive pose on adjacent blocks.
- Group patterns: solo walker, pair chatting, queue of 3–5, seller with two browsers, seated neighbour, carrier moving shop-to-bay. Offset animation phases and pauses. Do not give everyone the same gait, speed or direction.
- Keep approximately 1.5 m of continuous clear footpath where space permits. Reserve doorways, entry animation area, crossings and curb ramps. Use designated loading pockets for carts; never randomly scatter sellers into active lanes.
- Pedestrians enter the road only at signalled or authored crossings. Dense crossing waves stop/clear predictably; traffic yields. Preserve sightlines at 90-degree pavement corners.
- Proposed local visible budgets: busy station/market 24–36 people, residential 10–18, waterfront 14–24 per roughly 100 m block, depending on clear space. Start lower on mobile and measure; these are targets, not performance claims.
- Budget detailed animated NPCs across the whole view (initial target 24 desktop / 12 low mode), with shared-material simplified actors farther away. Reuse rigs, instance distant figures, avoid per-NPC React state and individual shadow maps. Keep simulation identities stable as visual LOD changes.
- Rotate activity states rather than teleporting outfits: browsing → paying → leaving; waiting → crossing → walking. Spawn/despawn only outside view at occluded entrances. Alternate a handful of authored events per district with long cooldowns.

## Voice pack: what to generate

[voice-lines.csv](voice-lines.csv) contains **56 individual clips**: four for each main character and two for each additional character. Each row has a stable filename, Roman-script subtitle, Devanagari TTS text, English meaning, performance direction, exact event, cooldown and priority. `stage` separates **intro**, **ambient**, and **future_interaction** so recorded lines never imply an unimplemented fare/repair system is already available. All statuses start `planned`.

First recording batch: Sachin and Raju's intro rows, then the other main-cast rows (32 main-cast clips total). Add the 24 street-crowd lines once placement/activity variety works. Do not play all 56 in one drive or force dialogue every block. Passenger destination/drop-off and workshop service lines are reserved for later explicit interaction features.

### ElevenLabs workflow

1. Create/select an original voice using each character brief. Audition the same phrase containing “Chala”, “thamba” and “Mumbai” before generating the whole pack. Use a model currently supporting the required Hindi/Marathi delivery; check the selected model's language list in your account. Do not assume every model handles both languages equally.
2. Paste only `tts_text` for the line. Keep the voice brief and `direction` out of the spoken text. If using a model with supported performance controls, add direction through those controls; do not rely on unsupported bracket tags. Roman `subtitle` is for the screen, not necessarily the best phonetic TTS input.
3. Produce two takes per clip with a consistent voice/model/settings combination. Listen for natural code-switching, word stress and the difference between “thamba” and Hindi alternatives. Ask a Marathi speaker to review the first set before generating the full batch; the scripts are draft recording copy.
4. Keep clean lossless masters where available: mono WAV, preferably 48 kHz, 16/24-bit. If only compressed export is available, preserve that original; conversion to WAV does not restore lost detail. No music, engine, traffic, reverb or horn in dialogue files.
5. Trim to about 80–150 ms of lead-in and a short natural tail, with no clipped consonants. Aim for consistent perceived loudness (starting reference around -18 LUFS integrated, true peak ≤ -1 dBTP; very short clips need listening checks). Do not normalize quiet conversation into shouting.
6. Put approved runtime MP3s (mono, 128 kbps is adequate for speech) at `public/audio/mumbai/voices/<character_id>/<filename>`. Keep master takes under `assets/audio/mumbai/voices/<character_id>/` if storing them in this repo; exclude rejected takes. Paths in the CSV describe future assets; they are not existing playable files.
7. Record the selected voice ID, model, settings, generation date and usage/license details in a production manifest when assets arrive. Keep API keys out of the repo. Update the public audio credits for the chosen voice assets. Change row status to `recorded`, then `approved` after listening and implementation checks.

Do not generate live speech during gameplay: use these fixed exported clips. No ElevenLabs API integration or account access is needed for this planning pack.

### Marathi seasoning, with understandable context

| Phrase | Marathi | Meaning / use |
| --- | --- | --- |
| Chala | चला | Let's go / come along; clear departure cue |
| Thamba | थांबा | Wait / stop; pair with “ek minute” for context |
| Bhau | भाऊ | Brother / friendly address; do not add to every sentence |
| Tai | ताई | Respectful older-sister address |
| Kaka | काका | Uncle / respectful older-man address |
| Mavshi | मावशी | Aunt / respectful address |
| Aaji | आजी | Grandmother / respectful elder address |
| Kay mhantos? | काय म्हणतोस? | How's it going? Casual singular address to Sachin |
| Aaramat | आरामात | At ease / take it easy |
| Jhakaas | झकास | Great / excellent; occasional reaction |

Mostly natural Hinglish, with perhaps one short Marathi phrase per line. Use familiar local humour about chai, signals, traffic and the daily commute. Avoid copying film dialogues, celebrity voices or repetitive catchphrases. Always show readable Roman-script subtitles; optionally let players enable English meanings. The spoken text should not assume the player understands Marathi.

### Playback rules and acceptance criteria

- Own one foreground voice channel. Suggested priorities: nearby immediate warning 90, scripted intro 80, explicit interaction 70, idle self-comment 40, background vendor 20. Queue at most one relevant interaction; discard stale ambient calls, never replay a warning after the hazard has passed.
- Ambient eligibility: speaker within 8–14 m, plausible line of sight, player moving slowly (<12 km/h) or stopped, no foreground line, event entered from outside the trigger. Market vendors need a 20 m exit before rearming. No shouting through buildings or repeated calls each frame.
- Outside the scripted intro, keep a global speech gap of at least 8 s after a clip ends; character gap at least 35 s, same-line cooldown from the CSV (typically 90–180 s), district call cooldown 20 s. Warning may interrupt ambient, but must also have a hazard edge and cooldown. Roll eligibility at most once on entry; never roll every frame until it eventually triggers.
- Blend several variants per recurring event before shipping: the pack establishes characters; follow-up production should expand high-frequency triggers to three or more lines. Until then, stay quiet when a line is on cooldown.
- Intro lines follow the state timeline without overlap (at least 0.3 s between clips; delay the next beat if a take is longer), rather than the ambient 8 s gap. Intro lines are non-spatial and centered; nearby street voices are positional and attenuated, passenger voices belong to the cabin. Driver self-talk is quiet and centered. Never couple dialogue rate to horn presses.
- Duck ambience/engine modestly (~3–5 dB) during speech, preserving road cues. Separate speech volume, subtitles, and overall mute; muted sound must not hide subtitles. Audio stays default-on after `Chal Chala`, subject to browser gesture requirements.
- Verification: first start/skip/retry/exit works without double voices; no animation resumes after disposal; 1P/BACK remain inside at 65 km/h and in turns; saved view survives handoff; no two foreground speakers; no cloned named NPCs; no identical outfits on adjacent blocks; crossing/footpath gaps remain traversable; missing voice assets fall back to silence and subtitles.

## Delivery order

1. **Reference pack complete:** concept images, character/voice briefs, crowd design and recording sheet. The current procedural implementation covers the opening, cast and initial crowd variety; recorded dialogue is pending.
2. **Opening prototype:** one stand, Sachin + Raju + Meera, guided walk/entry, skip/reduced-motion/touch support, safe camera handoff. Integrate approved intro clips when provided.
3. **Crowd variety:** implement six neighbourhood kits, 12 shared-rig crowd archetypes, variant selection, seating/queues/browsing and LOD. Review three consecutive blocks and real-phone performance before raising density.
4. **Reactive speech:** add proximity/event scheduler, subtitles, cooldowns and audio settings; wire approved ambient lines. Keep future interaction rows disabled.
5. **Optional later interactions:** passenger rides, workshop service and purchases, only after their gameplay states exist. Free roaming remains available throughout.

See [background identities](background-names.md) for examples of distinct names assigned to each existing character type. Main-cast names stay unchanged.
