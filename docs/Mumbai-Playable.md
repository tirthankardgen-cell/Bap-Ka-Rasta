# Mumbai / auto rickshaw — connected streets

## Play

From the landing page, press **Mera Bap Ka Rasta**, choose **Mumbai**, press **Yahin Chalao**, choose **Auto rickshaw**, then **Drive Mumbai** and **Chal Chala**. Both selection screens are full-screen galleries with arrows, keyboard navigation, swipe and direct selection dots. Only Mumbai and the auto are playable in this build. **Chal Chala** starts a guided, approximately 10-second driver POV opening with Raju Kaka and Meera Tai beside the kerbside auto. The driver walks over, enters, sits at the controls and hands off to third-person driving. **Seedha drive** or Enter skips the intro; the ready screen also offers **Drive without intro**. Pause, reset, exit and reduced-motion mode are supported.

## City environment

The old oval circuit has been replaced by an independently authored South Mumbai-inspired street network:

- 75 connected road segments, approximately 13.34 km of road centreline, with four-lane avenues, cross streets, T-junctions, and alternate routes through city blocks.
- 47 graph junctions, including eight nodes around a clockwise Fort-inspired roundabout; 34 intersections have working traffic signals.
- 29 narrow 10 m streets have one lane in each direction. Traffic uses the correct side and slows in these lanes; crossings and stop lines fit their widths. New northern/eastern connections expand the neighbourhood.
- Perimeter masonry, seafront walls, closed-end barriers and signs make the limits visible; shared road boundaries keep both player and traffic inside.
- Marine Drive's west-coast promenade, inland Churchgate/Fort streets, a station-inspired landmark, a central maidan, Colaba market connections, and a Gateway-inspired waterfront.
- 112 moving vehicles: taxis, cars, red buses, autos and scooters. Vehicles choose routes at intersections, queue behind traffic/player vehicles, and obey red/amber signals. Intersection reservations keep competing NPC turns from entering simultaneously.
- 939 crowd actors, including 19 uniquely placed named NPCs plus varied background walkers, chatting pairs, browsers, workers and signal-controlled crossings. Twenty visual character profiles include Sachin as the player, male Constable Patil, Raju, Meera, Sameer, Aarti, Imran, Lata and twelve other Mumbai locals. Pedestrians cross during an all-red phase; the auto slows when approaching a pedestrian crossing its path.
- Pavement surfaces sit at 0.42 m, around 0.35 m above the road, including junction corners; raised geometry is clipped against all road corridors to keep turns open. Vendors and walkers are raised with their supporting surface.
- Regular footpaths narrowed to 3.3 m per side, closer-set taller buildings, and kerbside chai, vada-pav, fruit and bhel carts with sellers/customers. Cart footprints stay outside driving lanes and junction crossings.
- Zebra crossings, stop lines, lane markings, lights, street signs, shopfronts, balconies, chai/vada-pav stalls, bus shelters, benches, palms, parked vehicles, and cones.

The [map-reference notes](research/mumbai/README.md) document the real Mumbai municipal data fetched for geographic context and its attribution. Municipal polygons are not a road map: the runtime streets are authored gameplay geometry and are not an exact recreation of Mumbai. The detailed generated storyboard remains an art-direction reference; the scene uses procedural geometry and is not an exact reproduction of that artwork. Vehicles now have curved bodywork, rounded canopies, detailed wheels, glass, chrome and paint materials. Asphalt and walls have procedural surface grain, water has animated ripples, and warm sunlight casts local shadows with sky reflections. NPC people retain their blocky style. The supplied Roblox screenshot informs the warmer sunset, open auto cabin, diamond-patterned seat, round front lamp and cyan/green trim. Buildings use four Mumbai-inspired types: coastal Art Deco with curved balconies, Fort-style stone arches/columns, tiled-roof chawls with shared galleries and laundry, and mixed-use apartments with AC units, signs and tanks. These are authored procedural interpretations, not extracted Roblox models or exact replicas of individual Mumbai buildings.

## Characters and opening

Six neighbourhood crowd mixes cover the waterfront, station approaches, bazaar, residential streets, offices and workshops. Actors have stable identities, distinct skin/hair/outfit combinations, work props and different walking speeds. Named sellers have small stalls; Patil is stationed near a junction. Walkers detour around the opening area; traffic and driving input remain held until entry completes. NPC detail uses a shared instanced box mesh and is limited to 150 m (90 m in Low graphics), rather than creating a separate renderer object per body part.

Intro and nearby named-character dialogue currently appears as **subtitles only**, with stable clip IDs matching the [recording sheet](mumbai-characters/voice-lines.csv). No character audio files are requested or fabricated; the existing engine/traffic/horn recordings continue working. Nearby greetings have a 35-second global gap and a 120-second repeat cooldown. Passenger fares, purchases and repairs are not implemented. The generated cast boards guide the procedural models; these are not exact mesh reproductions of the illustrations.

## Controls

| Action | Keyboard | Touch |
| --- | --- | --- |
| Accelerate | W / Up | Hold Accelerate |
| Brake; reverse after stopping | S / Down | Hold Brake / reverse |
| Steer | A/D or Left/Right | Hold left/right arrow |
| Handbrake | Space | Use brake pedal |
| Horn | H | Horn button |
| Reset to a safe road point | R | Reset button |
| Pause | Escape / P | Pause button |
| Cycle camera: third person → behind driver → driver | C | Camera button (3P / BACK / 1P) |

Three camera modes cycle with C or the camera button. The rear-seat view uses a roof cutaway to keep the road visible; the driver-eye view hides the driver avatar to avoid head clipping. Camera switching preserves the vehicle position and current drive.

Controls support simultaneous steering/acceleration. Touch cancellation, focus loss and pausing clear held inputs. Returning to a tab requires explicitly resuming. Reverse waits 0.4 seconds after stopping. Sound is enabled by default and starts on the Chal Chala gesture. Starting it fetches four edited field recordings (about 690 KB total): an auto engine, a recorded Jaipur electric-rickshaw horn (not a verified Mumbai Bajaj horn), Mumbai street traffic and a CSMT-area market. Engine pitch/gain respond to driving, traffic gets louder near vehicles, and market sound fades in near carts. Loops have crossfaded seams. Pause/mute suspends audio; exiting closes the audio context. Loading/failure messages appear in the HUD; toggling sound retries a failed download. Audio credits are linked from the pause panel.

The landing page, city/vehicle descriptions and driving messages use playful Roman-script Hinglish. Sound is on by default for each new drive; the first start gesture unlocks browser audio, and the speaker button can mute it.

## Run features

The player can turn freely at intersections and roam without laps, checkpoints, area objectives or a finish condition. There is no minimap, score screen or saved best distance. The HUD shows speed, the current street and crossing/signal warnings. Pause/resume and safe reset remain available; End drive returns directly to the landing page.

The simulation uses metres/seconds with a 60 Hz fixed step and a catch-up cap. Forward speed is capped near 65 km/h, reverse near 12 km/h. Road-corridor/intersection collision boundaries prevent driving through city blocks and into the sea. A separate roundabout island boundary keeps the centre non-driveable. Parked cars and cones have matching collision shapes. Signal timing has separate north/south, east/west and pedestrian phases. The player is warned at red lights rather than stopped by an invisible barrier.

## Source ownership

- `src/game/network.ts`: authored graph, lanes, road containment, signals, crosswalk positions, districts and static obstacles.
- `src/game/simulation.ts`: movement, graph-based traffic paths, intersection turns, following, signals, collisions and resets.
- `src/game/world.ts`: instanced road/scenery geometry, lights, moving pedestrians, landmarks and traffic batching.
- `src/game/vehicles.ts`: curved vehicle bodies, wheels, trim and blocky drivers.
- `src/game/atmosphere.ts`: sky, reflections, fog and local sunlight shadows.
- `src/game/audio.ts`: lazy-loaded field-recorded loops, horn one-shot, spatial ambience mixing and audio cleanup.
- `src/game/characters.ts` / `crowd.ts`: cast profiles, district populations, shared NPC geometry, activity routes and subtitle greetings.
- `src/game/intro.ts` / `intro-visuals.ts`: guided opening timeline, reduced-motion poses and first-person hands/keys.
- `src/game/engine.ts`: Three.js renderer, timing, input, camera and resource cleanup.
- `src/game/Game.tsx`: React HUD, pause/start overlays and touch controls.

React owns the interface; Three.js owns rendering. HUD updates run at approximately 10 Hz, nearby crowd poses at 10 Hz and signal colours at 4 Hz. Scenery and traffic meshes are instanced/shared by material. Game code is loaded after vehicle selection. No backend, live maps, secrets, database or external game assets are required.

## Validation

Use Node.js 22.18+ or 24:

```sh
npm ci
npm test
npm run build
npx playwright install chromium
npm run test:e2e
```

Twenty-three character/intro/camera/simulation/layout checks cover unique cast placement, deterministic neighbourhood variety, off-road pedestrian routes, intro stages/pause/reduced motion, cabin cameras staying attached at speed and through turns/reverse, third-person camera smoothing and reset, continuous right-angle pavement corners without asphalt notches, raised pavements staying outside drivable roads, graph connectivity, multiple lanes, the roundabout, braking/reverse, steering, barriers, vehicle contacts, safe resets, non-conflicting signals, red-light stops and green releases, pedestrian phases/continuity/yielding, three simulated minutes of dense traffic, and a five-minute drive through multiple streets/districts.

Production-browser checks cover the opening, its pause/resume and mobile skip flow, absence of unprovided voice requests, selection galleries, driving, steering, pause/focus loss, reset, recorded-audio decoding, mute/pause/exit audio-context lifecycle, sound/horn controls, exit/fresh drives, multi-touch controls, orientation changes, three camera modes via button/keyboard, absence of map/objectives, dense traffic presence and renderer console errors and WebGL context-loss recovery. `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` can select an already installed browser.

Validation here used Chromium with software WebGL and simulated touch input. The extended desktop control flow uses Low graphics; mobile layout/touch and graphics recovery run in Standard. Standard rendering is slow under software WebGL; these checks establish functionality, not a hardware frame-rate target. Real Android/iOS device frame rates, Safari, extended manual drives and final asset fidelity remain to be checked. Low graphics renders at 0.65 pixel ratio and reduces fog distance and disables shadows. Traffic rendering is limited to vehicles within 280 metres; all vehicles continue simulating. Graphics loss displays an explicit retry screen.

## Vercel

Build `npm run build`; publish `dist`. The existing deployment configuration applies. No new environment variables are needed.
