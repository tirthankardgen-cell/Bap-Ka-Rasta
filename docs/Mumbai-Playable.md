# Mumbai / auto rickshaw — connected streets

## Play

From the landing page, press **Mera Bap Ka Rasta**, choose **Mumbai**, press **Yahin Chalao**, choose **Auto rickshaw**, then **Drive Mumbai** and **Chal Chala**. Both selection screens are full-screen galleries with arrows, keyboard navigation, swipe and direct selection dots. Vehicle selection uses a perspective oval of five clickable vehicle previews, with the selected ride enlarged above centered details; future vehicles remain locked. The implementation follows the repository’s circular-gallery concept using the existing vehicle artwork. Only Mumbai and the auto are playable in this build. **Chal Chala** starts a guided, approximately 10-second driver POV opening with Raju Kaka and Meera Tai beside the kerbside auto. The driver walks over, enters, sits at the controls and hands off to third-person driving. **Seedha drive** or Enter skips the intro; the ready screen also offers **Drive without intro**. Pause, reset, exit and reduced-motion mode are supported.

## City environment

The old oval circuit has been replaced by an independently authored South Mumbai-inspired street network:

- 75 connected road segments, approximately 13.34 km of road centreline, with four-lane avenues, cross streets, T-junctions, and alternate routes through city blocks.
- 47 graph junctions, including eight nodes around a clockwise Fort-inspired roundabout; 34 intersections have working traffic signals.
- 29 narrow 10 m streets have one lane in each direction. Traffic uses the correct side and slows in these lanes; crossings and stop lines fit their widths. New northern/eastern connections expand the neighbourhood.
- Perimeter masonry, seafront walls, closed-end barriers and signs make the limits visible; shared road boundaries keep both player and traffic inside.
- Marine Drive's west-coast promenade, inland Churchgate/Fort streets, a station-inspired landmark, a central maidan, Colaba market connections, and a Gateway-inspired waterfront.
- 112 moving vehicles: taxis, cars, red buses, autos and scooters. Vehicles choose routes at intersections, queue behind traffic/player vehicles, and obey red/amber signals. Intersection reservations keep competing NPC turns from entering simultaneously.
- 1,542 crowd actors, including 19 uniquely placed main NPCs and individually named background walkers, chatting pairs, browsers, workers and crossing pedestrians. Twenty visual character profiles include Sachin as the player, male Constable Patil, Raju, Meera, Sameer, Aarti, Imran, Lata and twelve other Mumbai locals. Signal-controlled crossings coexist with 201 independently timed mid-block walkers who can step into traffic on green. The player does not automatically slow for them.
- Pavement surfaces sit at 0.42 m, around 0.35 m above the road, including junction corners; raised geometry is clipped against all road corridors to keep turns open. Vendors and walkers are raised with their supporting surface.
- Regular footpaths narrowed to 3.3 m per side, closer-set taller buildings, and kerbside chai, vada-pav, fruit and bhel carts with sellers/customers. Cart footprints stay outside driving lanes and junction crossings.
- Zebra crossings, stop lines, lane markings, lights, street signs, shopfronts, balconies, chai/vada-pav stalls, bus shelters, benches, palms, parked vehicles, and cones.

The [map-reference notes](research/mumbai/README.md) document the real Mumbai municipal data fetched for geographic context and its attribution. Municipal polygons are not a road map: the runtime streets are authored gameplay geometry and are not an exact recreation of Mumbai. The detailed generated storyboard remains an art-direction reference; the scene uses procedural geometry and is not an exact reproduction of that artwork. Vehicles now have curved bodywork, rounded canopies, detailed wheels, glass, chrome and paint materials. Asphalt and walls have procedural surface grain, water has animated ripples, and warm sunlight casts local shadows with sky reflections. NPC people retain their blocky style. The supplied Roblox screenshot informs the warmer sunset, open auto cabin, diamond-patterned seat, round front lamp and cyan/green trim. Buildings use four Mumbai-inspired types: coastal Art Deco with curved balconies, Fort-style stone arches/columns, tiled-roof chawls with shared galleries and laundry, and mixed-use apartments with AC units, signs and tanks. These are authored procedural interpretations, not extracted Roblox models or exact replicas of individual Mumbai buildings.

## Characters and opening

Six neighbourhood crowd mixes cover the waterfront, station approaches, bazaar, residential streets, offices and workshops. Actors have stable identities, distinct skin/hair/outfit combinations, work props and different walking speeds. Named sellers have small stalls; Patil is stationed near a junction. Walkers detour around the opening area; traffic and driving input remain held until entry completes. NPC detail uses a shared instanced box mesh and is limited to 150 m (90 m in Low graphics), rather than creating a separate renderer object per body part.

Intro and nearby named-character dialogue currently appears as **subtitles only**, with stable clip IDs matching the [recording sheet](mumbai-characters/voice-lines.csv). No character audio files are requested or fabricated; the existing engine/traffic/horn recordings continue working. Nearby greetings have a 35-second global gap and a 120-second repeat cooldown. Passenger fares, purchases and repairs are not implemented. The generated cast boards guide the procedural models; these are not exact mesh reproductions of the illustrations.

## Mobile orientation

On touch phones, city selection, vehicle selection and gameplay share a landscape canvas. An upright phone displays this canvas rotated clockwise; turning the phone sideways restores the unrotated landscape view. Swipes use the canvas coordinates, and the 3D camera measures the landscape container rather than the physical screen. There is no rotation dialog, forced browser fullscreen, orientation lock or orientation-triggered pause. The home page follows the device normally. Compact layouts preserve touch controls and adapt to the canvas size.

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
| Cycle camera: third person ↔ driver | C | Camera button (3P / 1P) |

Two camera modes toggle with C or the camera button. Drag the scene with a mouse or finger to look around; releasing smoothly returns to the default view. The driver-eye view hides the driver avatar to avoid head clipping. Camera switching preserves the vehicle position and current drive.

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

Automated road-shape/branding/character/intro/camera/simulation/layout checks cover icon and cover dimensions, the shared BR master, map source integrity, unique cast placement, deterministic neighbourhood variety, off-road pedestrian routes, intro stages/pause/reduced motion, cabin cameras staying attached at speed and through turns/reverse, third-person camera smoothing and reset, continuous right-angle pavement corners without asphalt notches, raised pavements staying outside drivable roads, graph connectivity, multiple lanes, the roundabout, braking/reverse, steering, barriers, vehicle contacts, safe resets, non-conflicting signals, red-light stops and green releases, pedestrian phases, route continuity, spacing and impact reactions, three simulated minutes of dense traffic, and a five-minute drive through multiple streets/districts.

Production-browser checks cover public branding metadata, automatic landscape layouts, rotated gallery swipes and driving across orientation changes, the opening, its pause/resume and mobile skip flow, absence of unprovided voice requests, selection galleries, driving, steering, pause/focus loss, reset, recorded-audio decoding, mute/pause/exit audio-context lifecycle, sound/horn controls, exit/fresh drives, multi-touch controls, orientation changes, two camera modes via button/keyboard, absence of map/objectives, dense traffic presence and renderer console errors and WebGL context-loss recovery. `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` can select an already installed browser.

Validation here used Chromium with software WebGL and simulated touch input. The extended desktop control flow uses Low graphics; mobile layout/touch and graphics recovery run in Standard. Standard rendering is slow under software WebGL; these checks establish functionality, not a hardware frame-rate target. Real Android/iOS device frame rates, Safari, extended manual drives and final asset fidelity remain to be checked. Low graphics renders at 0.65 pixel ratio and reduces fog distance and disables shadows. Traffic rendering is limited to vehicles within 280 metres; all vehicles continue simulating. Graphics loss displays an explicit retry screen.

## Vercel

Build `npm run build`; publish `dist`. The existing deployment configuration applies. No new environment variables are needed.

## Road layout and game map

Marine Drive and Harbour Avenue remain wide main roads. Station Road, Colaba Causeway, Maidan Avenue and Colaba Market Road are two-way, two-lane side corridors throughout. Bazaar Galli, Chawl Lane and Dukaan Lane have gentle bends. Fort Circle follows a circular centreline; traffic, asphalt and collision queries use the same sampled paths. The three inland edges have continuous mixed-use building frontages and pavements; the western seafront retains its seawall. Road-end warning boards have been removed.

The [playable map](maps/mumbai-game-map.svg) is generated from `network.ts` and `boundaries.ts`; it is the authored game environment, not a municipal map.

Palm trees are restricted to the western beach promenade. Inland street lights and other street furniture remain in place.

The speed display is centered at the top in a translucent glass panel. Braking takes priority over simultaneous throttle, and the GLB front wheel steers with the physics. Player speed is not automatically limited by signals or crossing pedestrians; vehicle, curb and obstacle collisions still apply. Nearby traffic honks when the player directly blocks its lane, with per-car and shared cooldowns. These directional honks reuse the credited runtime horn recording with a lower pitch; they are not new car-specific recordings.

Street-front buildings reserve junction corners before filling the rest of each block. Corner façades wrap windows, cornices and ground-floor shops onto the end walls. Placement checks the full rotated building envelope, including balconies and eaves, against roads, other buildings, the maidan and the perimeter; the seaside stays open. Curved-street façades follow the local road direction.


## Pedestrian encounters

Actual contact below 20 km/h makes a pedestrian stop briefly, face the auto and scold the driver in a Hinglish subtitle. Repeated slow contact has an eight-second cooldown. There is no automatic slowing before pedestrians or signals.

Contact at 20 km/h or above ends the drive. Controls lock immediately; the affected character moves about 55 cm, falls, and a small stylized blood mark appears. A side-view camera pan leads into a folded-paper “Mumbai Ki Khabar” report with the character's identity, role, street, recorded impact speed and a locally captured frame of the actual scene. The button returns directly to the landing page. This is fictional gameplay reporting, not an external news service. Character scoldings remain text-only until voice clips are supplied.

The cinematic respects reduced motion, stops advancing in a hidden tab, and cannot be bypassed with reset/camera/pedal keys. Road and vehicle collisions still apply. The speed cutoff is a gameplay setting in `src/game/pedestrian-rules.ts`, not a real-world injury prediction.


Background people reuse the same 20 character designs. Main-cast names are unchanged; background identities are deterministic and unique within the city, including multiple differently named delivery workers. Their identity follows them into scolding subtitles and incident reports. Mid-block routes include diagonal crossings, pavement sections and independent short pauses, without signal permission. A shared 20 Hz crowd simulation makes nearby walkers sidestep and maintain body clearance, and supplies the same positions to vehicle-hit detection. Named locals stay at their original homes.

### Loading and roadside cones

Both game-code and auto-model loading show a lightweight road-building animation with two workers, shovels and traffic cones. Reduced-motion settings show the static illustration; retry and home navigation remain available when a download fails.

There are 43 movable cones in small roadside work zones. Player impacts use swept contact detection, including reverse: slow contact tips a cone nearby, while faster contact launches it a few metres with gravity, a small bounce and a sideways landing. Cones do not block or brake the auto. Fallen cones remain in place and can be knocked again after the auto moves away. Reset restores the work zones. These props use the existing scene resource cleanup.

### Four-speed automatic-clutch gears

Start in first gear. Select **1 / 2 / 3 / 4** with the centre buttons, number-row keys or numpad. The arcade speed limits are **12 / 25 / 45 / 65 km/h**. Holding the accelerator gradually reaches the selected limit; release to coast, or use the existing brake/reverse control. Upshifts preserve current speed and downshifts apply gradual engine braking, including while accelerating. No clutch button or stalling is required. Engine pitch follows speed within the chosen gear. Reset returns to first gear; gear changes are disabled during the intro, pause and incident sequence.

### Rendering and frame pacing

Static city batches keep only nearby instances on the GPU, refreshing after 12 metres of travel and preserving large overlapping ground/road surfaces. Standard and Low draw radii are 350/270 metres, beyond their fog ranges. Instance buffers upload only their populated ranges. Crowd separation uses numeric spatial keys instead of repeatedly allocating strings; the full cast and collision behaviour remain active.

Standard graphics adapts pixel density to sustained frame time, recovering gradually when there is headroom. Mobile starts at at most native CSS-pixel resolution with dynamic shadows disabled; desktop starts at at most 1.25× and disables shadows if sustained frame times are high. Low remains an explicit fixed-quality option. The auto and its camera share an interpolated pose between physics steps, while collisions remain fixed-step.

For a repeatable city-scene benchmark, run the development server on port 4176, then `node scripts/measure-rendering.mjs` (set `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` if needed). It reports submitted triangles, calls, scene-update time and render time at a fixed coastal viewpoint. The measured change was 1,967,036 → 460,204 submitted triangles (about 77% fewer); timing and playable FPS depend on the device. This development fixture is not included in the production build.
