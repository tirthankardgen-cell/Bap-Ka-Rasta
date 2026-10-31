# Changelog

- Corrected canonical, social and sitemap URLs to `rasta.vihar.online`; added image sitemap entries. The production build now prerenders the existing React landing screen and hydrates it in the browser, exposing the title and artwork before JavaScript runs while preserving client-side selection and gameplay.
  - Verified with 81 unit tests, the production build and all 25 Playwright browser tests in Chrome. The new check covers the initial HTML, JavaScript-disabled display, domain consistency and hydration into city selection. Social cover images were regenerated with the new domain.

- Rewrote and regenerated the Mumbai script as 119 clips with varied openings and two conversation topics per local. Street gossip now runs independently of the auto, fades with distance and finishes sentences before replies. Captions are limited to player-directed dialogue. Added bounded concurrent audio mixing, cooperative scene construction, cached road geometry and steadier, faster crowd motion.

- Added 118 short Mumbai Hindi/Marathi voice recordings using only free ElevenLabs presets, with a new line list and voice assignments for all 1,543 people. Nearby locals exchange related question/reply clips and turn toward each other; vendors and impact reactions use matching character voices. Added asynchronous positional playback, ambience ducking, pause/mute/skip cleanup, bounded caching, an offline generator, audio verification and non-commercial free-plan attribution.

- Replaced box-part pedestrians with the complete 20-character Blender cast based on the Mumbai concept boards, including shaped faces and hair, patterned clothing, modelled accessories, animated detail/distant meshes, and matching seated Sachin and first-person hands. Added a packed GLB, editable labelled Blender library, comparison renders, reproducible asset scripts, bounded parallel loading and resource cleanup.
- Restyled the Toto e-rickshaw preview with rounded, simplified 3D game artwork matching the vehicle roster; it remains Coming soon.

- Moved loading-worker motion onto compositor layers to keep it moving during scene setup; removed repeated Ghar chalo popup buttons and the newspaper home wording.

- Added a reference-inspired Toto e-rickshaw preview as the sixth vehicle, marked Coming soon, with six-item gallery navigation.

- Reduced distant city rendering and instance uploads, optimized crowd spatial lookups, added adaptive resolution/shadows and interpolated vehicle/camera motion to improve frame pacing.

- Added four automatic-clutch gears with 12/25/45/65 km/h limits, centre touch buttons, number-row/numpad shortcuts, gentle downshifts and gear-aware engine pitch.

- Added an animated road-worker loading screen and 43 knockable roadside cones, with speed-based tosses, tumbling, ground settling and reset support.

- Kept all 20 character designs and original main names; expanded the crowd to 1,542 distinct identities, added staggered mid-block crossings, and shared pedestrian avoidance positions with vehicle-hit detection.

- Added speed-based pedestrian reactions: Hinglish scolding for slow contact, and a locked-control incident sequence with a side camera, scene photo, newspaper report and return-home button for serious impacts.

- Rebuilt street-front placement around reserved corner lots, with wraparound shop façades and whole-building road/overlap checks.

- Centered glass speed display, brake-priority controls and steering animation for the new Mumbai auto; player-controlled speed through crossings and cooldown-based horns from blocked traffic.

Changes are recorded here for contributors and maintainers. Entries under Unreleased describe work on the development branch and do not imply a published release or tag.

## Unreleased

### Added

- Continuous land-side building frontages in place of road-end warning barriers; open seafront retained.
- Smooth Fort Circle and gently curved bazaar streets sharing road, traffic and collision geometry; selected side corridors now have one lane each way.

- Consistent outlined BR identity, SVG/ICO favicons, Apple/app/maskable icons, social and README covers, Open Graph/X metadata, structured data, web manifest, robots and sitemap.
- Branded playable Mumbai map generated from the game road network and boundary buildings.
- Automatic landscape canvas from city selection through driving on phones, with adapted swipes and compact touch layouts; no rotate-phone prompt.
- Palm trees limited to the western beach promenade.

- Playable driver POV opening: walk from the pavement, enter the kerbside auto, see the handlebar view and transition to driving; skip, pause/resume and reduced-motion support included.
- Twenty procedural Mumbai character designs, 19 unique named locals and 939 total crowd actors with six district mixes, props, outfit variations, chatting/browsing/work activity and nearby text greetings. No character voice audio is loaded until recordings are supplied.

- Mumbai character planning pack: 20 character concepts (including male Constable Patil), three reference boards, six neighbourhood crowd kits, a driver-entry sequence and 56 planned voice lines for external recording. These are design assets, not implemented NPC or dialogue features.

- Third-person, behind-driver and driver-eye cameras, switchable with C or the camera button.
- 33 additional road segments, including 29 narrow two-way neighbourhood streets, with lane-aware traffic and crossings.
- Visible city perimeter walls and closed-end barriers, plus regression checks for the new roads and camera controls.

- Contribution, security, conduct, and support guidance.
- A documentation index, roadmap, maintainer guide, and licensing/attribution notice.
- Structured bug, feature, and support issue forms and a pull-request template.
- GitHub Actions checks for the production build, simulation/layout tests, and research-audio manifest.
- Weekly Dependabot configuration for npm dependencies and GitHub Actions.
- Editor, line-ending, and Node-version configuration for consistent checkouts.

### Changed

- Replaced the primitive auto with an original Blender-authored Mumbai kaali-peeli GLB for the player and instanced traffic, including rounded bodywork, open cabin, fare meter, windscreen, independent wheels and matching interior camera heights. Loading waits for the asset and disposes late loads on exit; editable Blender source and export scripts are included.

- Rebuilt vehicle selection around the circular gallery reference: large selected ride, scaled side previews, oval selection arc, centered details and yellow drive button, with drag, preview clicks, keyboard navigation and responsive layouts. Only the auto remains playable.

- Anchored first-person and behind-driver cameras to the cabin during acceleration, steering and reverse; retained smooth following for the third-person view.

- Joined raised footpaths at square 90-degree junction corners, removing asphalt notches and keeping traffic turns and road collision boundaries aligned.

- Reworked buildings into Mumbai-inspired Art Deco, stone-arcade, chawl and apartment types.
- Refined the auto cabin, patterned seats, round headlamp and coloured trim; added warmer sunset lighting and filtered road surface grain.

- Reorganized the README around current gameplay, setup, controls, architecture, deployment, and reference documents.
- Added package description, repository links, keywords, supported Node versions, and an explicit `UNLICENSED` marker.
- Expanded ignore rules for local environment files, Python caches, and operating-system metadata.

### Known limitations

- Mumbai and the auto rickshaw remain the only playable combination.
- The long desktop browser flow still times out under software WebGL; the pause action now publishes HUD state immediately.
- Real Android/iOS performance, Safari compatibility, and extended manual driving still need validation.

## Prototype baseline

The existing prototype includes the landing page and city/vehicle galleries, an authored South Mumbai-inspired road network, arcade auto-rickshaw driving, traffic and pedestrians, keyboard/touch input, pause/reset controls, recorded audio, and static Vercel deployment configuration.

The package version is `0.1.0`. For the full development history, see the [commit log](https://github.com/tirthankardgen-cell/Bap-Ka-Rasta/commits/main). The [original design plan](docs/Bap-ka-Rasta-Game-Plan.md) describes the broader intended release.
