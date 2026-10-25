# Mumbai / auto rickshaw — connected streets

## Play

From the landing page, press **Mera Bap Ka Rasta**, choose **Mumbai**, press **Yahin Chalao**, choose **Auto rickshaw**, then **Drive Mumbai** and **Chal Chala**. Both selection screens are full-screen galleries with arrows, keyboard navigation, swipe and direct selection dots. Only Mumbai and the auto are playable in this build.

## City environment

The old oval circuit has been replaced by an independently authored South Mumbai-inspired street network:

- 42 connected road segments, approximately 7.15 km of road centreline, with four-lane avenues, cross streets, T-junctions, and alternate routes through city blocks.
- 29 graph junctions, including eight nodes around a clockwise Fort-inspired roundabout; 16 intersections have working traffic signals.
- Marine Drive's west-coast promenade, inland Churchgate/Fort streets, a station-inspired landmark, a central maidan, Colaba market connections, and a Gateway-inspired waterfront.
- 64 moving vehicles: taxis, cars, red buses, autos and scooters. Vehicles choose routes at intersections, queue behind traffic/player vehicles, and obey red/amber signals. Intersection reservations keep competing NPC turns from entering simultaneously.
- 202 moving pedestrians: pavement walkers and signal-controlled crossings. Pedestrians cross during an all-red phase; the auto slows when approaching a pedestrian crossing its path.
- Zebra crossings, stop lines, lane markings, lights, street signs, shopfronts, balconies, chai/vada-pav stalls, bus shelters, benches, palms, parked vehicles, and cones.

The [map-reference notes](research/mumbai/README.md) document the real Mumbai municipal data fetched for geographic context and its attribution. Municipal polygons are not a road map: the runtime streets are authored gameplay geometry and are not an exact recreation of Mumbai. The detailed generated storyboard remains an art-direction reference; current geometry is a lightweight procedural low-poly scene.

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

Controls support simultaneous steering/acceleration. Touch cancellation, focus loss and pausing clear held inputs. Returning to a tab requires explicitly resuming. Reverse waits 0.4 seconds after stopping. Sound starts muted and is synthesized locally when enabled.

## Run features

The player can turn freely at intersections and explore alternate routes. A network minimap shows the roads, player direction and signal state; the HUD names the current street and warns about approaching red/amber signals. Lap counting has been replaced with seven discoverable areas. Distance, top speed, safe reset, pause/resume, results and replay remain available. The optional best distance is saved locally; unavailable storage never blocks play.

The simulation uses metres/seconds with a 60 Hz fixed step and a catch-up cap. Forward speed is capped near 65 km/h, reverse near 12 km/h. Road-corridor/intersection collision boundaries prevent driving through city blocks and into the sea. A separate roundabout island boundary keeps the centre non-driveable. Parked cars and cones have matching collision shapes. Signal timing has separate north/south, east/west and pedestrian phases. The player is warned at red lights rather than stopped by an invisible barrier.

## Source ownership

- `src/game/network.ts`: authored graph, lanes, road containment, signals, crosswalk positions, districts and static obstacles.
- `src/game/simulation.ts`: movement, graph-based traffic paths, intersection turns, following, signals, collisions, exploration and resets.
- `src/game/world.ts`: instanced road/scenery geometry, lights, moving pedestrians, original auto/traffic models and landmarks.
- `src/game/engine.ts`: Three.js renderer, timing, input, synthesized audio, camera and resource cleanup.
- `src/game/Game.tsx`: React HUD, network minimap, run overlays and touch controls.

React owns the interface; Three.js owns rendering. HUD updates run at approximately 10 Hz, pedestrian poses at 12 Hz and signal colours at 4 Hz. Scenery and traffic meshes are instanced/shared by material. Game code is loaded after vehicle selection. No backend, live maps, secrets, database or external game assets are required.

## Validation

Use Node.js 22.18+ or 24:

```sh
npm ci
npm test
npm run build
npx playwright install chromium
npm run test:e2e
```

Twelve simulation checks cover graph connectivity, multiple lanes, the roundabout, braking/reverse, steering, barriers, vehicle contacts, safe resets, non-conflicting signals, red-light stops and green releases, pedestrian phases/continuity/yielding, three simulated minutes of dense traffic, and a five-minute drive through multiple streets/districts.

Production-browser checks cover selection galleries, driving, steering, pause/focus loss, reset, sound/horn controls, results, stored best distance, replay/exit, multi-touch controls, orientation changes, minimap/traffic presence and WebGL context-loss recovery. `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` can select an already installed browser.

Validation here used Chromium with software WebGL and simulated touch input. Real Android/iOS device frame rates, Safari, extended manual drives and final asset fidelity remain to be checked. Low graphics reduces pixel ratio and fog distance. Graphics loss displays an explicit retry screen.

## Vercel

Build `npm run build`; publish `dist`. The existing deployment configuration applies. No new environment variables are needed.
