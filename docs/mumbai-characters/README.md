# Mumbai characters, crowd variety and voice production

**Implementation update:** all 20 designs have Blender-authored models and **119 recorded Mumbai voice lines**. Sachin, the 19 named locals and all 1,523 background people have gender-matched voice assignments. Neighbours gossip independently of the auto's location and speed; distance changes their volume. Sentences finish before replies, and captions appear only for speech directed at the player. Pause, mute, skip and missing-file fallbacks preserve free roaming. The free-account voice presets approximate the character briefs below; they are not native Mumbai actors. See the [new line list](VOICE-LINES.md), [every person's assignment](people-voices.csv), [voice production guide](../../assets/audio/mumbai/voices/README.md), [Blender library](../../assets/characters/mumbai/README.md), and [playable guide](../Mumbai-Playable.md). Full on-foot movement, saved camera preferences, passenger jobs, purchases and repairs remain future work.

## Visual references

- [Main cast: eight characters](images/01-mumbai-main-cast.png)
- [Street crowd: twelve additional characters](images/02-mumbai-street-crowd.png)
- [Six-panel walk-up and entry storyboard](images/03-driver-opening.png)

Actual Blender models: [main-cast renders](renders/main-cast.jpg) · [street-crowd renders](renders/street-crowd.jpg) · [editable .blend](../../assets/characters/mumbai/mumbai-characters.blend).

Concept boards generated with OpenAI image generation on 2026-10-26 for this project; the main cast was revised to make Patil male. These are original generated concepts, not imported Roblox assets or finished 3D models. Use blocky heads/bodies for people, with distinct faces, silhouettes and clothing; keep buildings, vehicles and props materially more realistic. The written character table is authoritative if art differs in accessories, uniform detail or labels. The opening board is mood/composition guidance: entry must be from the actual pavement-facing opening, with no invented hinged car door. The third-person transition must avoid passing through the canopy.

## Opening: from pavement to driver

Start in a fictional Mumbai suburban auto stand beside a chai stall, chawl frontage and side lane. This is a better everyday auto setting than presenting a South Mumbai landmark as a legally accurate auto route. The existing map is inspired by Mumbai, not an exact recreation. Keep landmark sightseeing within the game's fictional geography.

| State / timing | View and action | Interaction / voice |
| --- | --- | --- |
| Ready screen | Existing city/vehicle selection leads to `Chal Chala`. Load nearby scene, entry animation and first two clips. | This tap also resumes browser audio; never depend on autoplay before a gesture. Missing voice files must not block play. |
| Approach, ~0–3 s | Driver POV on pavement, khaki cuff and keys; auto 3–4 m ahead. Short guided walk on a protected path. | Raju: “Arre Sachin bhau! Aaj kidhar ki sawaari?” One greeting only. `Skip intro` always visible. |
| Enter, ~3–6 s | Turn toward the pavement-side open cabin, hand grips frame, foot steps onto floorboard, body settles onto seat. | Raju's greeting finishes before Sachin's reply. Traffic yields at the reserved exit. |
| Seated, ~6–8 s | 1P: hands on handlebar, dashboard and windscreen. | Sachin: “Chala, Mumbai! Aaram se chalenge, maza aayega.” The engine ducks modestly under speech. |
| Camera handoff, ~8–9 s | Brief exterior shot via an unobstructed side route or short fade, then default 3P. | Hold vehicle stationary until handoff completes. Honor a saved camera preference on later drives; `C`/camera button remains available. |
| Driving | Enable throttle, steering, brake and horn; restore normal traffic reservations. | Free roam begins. No mission timer or compulsory passenger task. |

Implementation states: `ready → approach → entering → seated → handoff → driving`. Only the entry controller owns the camera until handoff. Start/retry/skip must call the same idempotent completion routine: driver seated, keys/intro props removed, camera attached, input cleared, engine state correct, exit clear. Pause freezes both animation and speech; exit/dispose cancels scheduled clips and entry reservations. Reset while driving resets the vehicle, not the whole intro.

First visit: play the short intro. Later visits: offer `Walk to auto` and `Seedha drive`. Reduced-motion mode uses static views with short fades and no head bob. Skip jumps directly to a safe seated pose and selected driving camera; no leftover greeting plays afterward. Optional later milestone: free walking within the small auto-stand area using WASD/touch joystick and `E / Baitho` to enter. Do not require a full on-foot city system for the first release.

## Main cast and voice briefs

The descriptions below are artistic voice targets. The [actual casting](../../assets/audio/mumbai/voices/cast.json) uses only included free ElevenLabs presets, with consistent settings per character and clean speech without added music, reverb or traffic. Names describe fictional people, not celebrity impressions. Eighteen presets cover twenty roles; the limited free female selection means Aarti/Pooja share Sarah and Lata/Shanta share Lily with different delivery settings.

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

Do not increase all 1,542 pedestrian agents into expensive detailed actors. Use shared rigs and local activity groups. Density means busy pavement edges and queues, not filling the driving lane with obstacles.

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

## Recorded voice pack

[voice-lines.csv](voice-lines.csv) contains **119 recorded clips**, with stable IDs, Roman subtitles, Devanagari synthesis text, English meanings, performance direction, free voice IDs, durations and deployed paths. The [readable list](VOICE-LINES.md) groups them by character. The [people register](people-voices.csv) maps all 1,543 people, including the player, to their voice profile and available lines.

Sachin has the opening and three contextual comments. Raju has the other opening line, two ambient lines, a reaction and a conversation pair. Every other local has three ambient lines, a reaction and a conversation pair. Lines last roughly 2–5 seconds. `chat` and `reply` use matching topics so neighbouring people answer coherently. The pack does not add passenger or shop mechanics.

### ElevenLabs workflow

Use the [production guide](../../assets/audio/mumbai/voices/README.md) and `npm run voices:generate`, then rebuild the catalogue and verify the assets. The generator reads the ignored `.env.local`, uses the current `eleven_v4` model with Hindi/Marathi support, and refuses paid/library voices or gender mismatches. It preserves downloaded originals and resumes completed work without spending credits again. Direction is separate from spoken text.

No live speech is generated during gameplay. The SDK is used only by the offline production script. Free-generated audio requires non-commercial use and ElevenLabs attribution; see the deployed [audio credits](../../public/audio/credits.html).

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

Mostly natural Hinglish, with occasional short Marathi phrases. Use familiar local humour about daily life, prices, cricket, rain and the commute. Avoid copying film dialogues, celebrity voices or repetitive catchphrases. Show readable Roman-script subtitles and English meanings only when someone addresses the player. The spoken text should not assume the player understands Marathi.

### Playback rules and acceptance criteria

- Up to four street voices and one foreground voice. A mild impact waits for the current sentence, discards the social reply and queues the person's own warning.
- Conversation partners must be stopped, within 7.5 m, and have a clear pavement path. World schedules do not depend on the listener's position or speed. Replies match the topic and use the responding person's identity.
- Related turns wait 0.55–0.71 s after actual playback completion. World scans run every 0.5 s; actor rest periods and a 30 s audible-clip cooldown prevent constant repetition.
- Volume fades continuously with distance, reaching silence at 120 m. Driving away or cue expiry never cuts off a playing recording. Intro handoff waits for the last opening clip to finish; skip remains immediate.
- Only player-directed lines have captions. Foreground speech ducks ambience and street voices. Pause suspends the shared audio context; mute/skip/reset/exit explicitly stop speech.
- Downloads hold audible turns until playback or failure without blocking play. At most two fetch/decode jobs run concurrently, with 24 decoded clips cached and only selected lines/their related replies requested.

## Delivery order

1. **Reference pack and Blender cast complete:** concept images, twenty models, crowd design and recording sheet.
2. **Voiced opening complete:** Sachin and Raju, guided entry, skip/pause/reduced-motion support and safe camera handoff.
3. **Crowd variety:** shared models, district mixes, walking/browsing/work activity and distance-based detail. Full schedules and real-phone performance remain follow-up work.
4. **Recorded dialogue complete:** nearby exchanges, street calls, reactions, subtitles, cooldowns and shared audio lifecycle.
5. **Optional later interactions:** passenger rides, workshop service and purchases, only after their gameplay states exist. Free roaming remains available throughout.

See [background identities](background-names.md) for examples of distinct names assigned to each existing character type. Main-cast names stay unchanged.
