# Mumbai / auto rickshaw — first playable

## Play

From the landing page, press **Mera Bap Ka Rasta**, choose **Mumbai** in the full-screen city gallery, press **Yahin Chalao**, choose **Auto rickshaw** in the full-screen vehicle gallery, then **Drive Mumbai** and **Chal Chala**. Use the left/right arrows, keyboard arrow keys, or swipe to browse; the selection dots jump directly to a choice. Mumbai and the auto are the only playable selection in this build. Other city cards show their concept art and a coming-soon message.

The fictional Marine Drive-inspired circuit is approximately 2.15 km, with a seafront promenade, palms, buildings, street stalls, pedestrians, a Gateway-inspired arch, and moving traffic. It is a compact closed circuit, not a geographically accurate map. All geometry is authored procedurally in this repository. The auto has three wheels, black/yellow bodywork, a khaki driver, and a rear “Horn OK Please” sign. Current visuals are an initial low-poly implementation of the storyboard direction.

| Action | Keyboard | Touch |
| --- | --- | --- |
| Accelerate | W / Up | Hold Accelerate |
| Brake; reverse after stopping | S / Down | Hold Brake / reverse |
| Steer | A/D or Left/Right | Hold left/right arrow |
| Handbrake | Space | Use brake pedal |
| Horn | H | Horn button |
| Reset to safe road point | R | Reset button |
| Pause | Escape / P | Pause button |

Controls support simultaneous steering and acceleration. Touch cancellation, focus loss, and pausing clear held inputs. Returning to the tab requires explicitly resuming. Reverse waits 0.4 seconds after stopping. Sound starts muted; enable it using the speaker button. Engine and horn sound are synthesized locally, with no downloads or external services.

## Run features

- Fixed 60 Hz arcade simulation, approximately 65 km/h forward and 12 km/h reverse caps, smoothed steering, and chase camera.
- Left-hand traffic on both sides of the circuit. Vehicles slow behind a nearby player; contacts resolve overlap and reduce speed.
- Road boundaries prevent driving through the seawall or buildings. Pedestrians stay on pavements.
- Distance, top speed, ordered lap gates, circuit map, safe reset, pause/resume, end-drive results, and replay.
- Optional local best distance under `bkr:mumbai:auto:best`. Storage failure does not block play.
- Standard and low graphics presets, resize handling, and an explicit retry screen for WebGL context loss or initialization failure.
- Game code loads only when Mumbai is selected. The landing page remains a single-screen hero.

## Source ownership

- `src/game/simulation.ts`: pure movement, traffic, collision, checkpoint, and lap logic in metres and seconds.
- `src/game/world.ts`: shared instanced scenery, original auto/traffic models, procedural signs and landmark.
- `src/game/engine.ts`: Three.js renderer, timing, input, audio, camera, and disposal.
- `src/game/Game.tsx`: React HUD, selection handoff, pause/results overlays, and touch controls.

React owns the interface; an imperative Three.js scene owns frame-by-frame rendering. No React state updates are needed per simulation tick. The HUD publishes at approximately 10 Hz. Static scenery uses shared instanced geometry/materials; fog and frustum culling limit visible scenery. The compact city is generated upfront; no asset streaming or separately downloaded city chunks are required in this prototype. No full physics engine, backend, API keys, or database are used.

## Validation

Use Node.js 22.18+ or 24.

```sh
npm ci
npm test
npm run build
npx playwright install chromium
npm run test:e2e
```

`npm test` covers acceleration, reverse delay, stationary steering, moving steering, barriers, traffic contact, safe reset, and a five-minute simulated circuit drive with ordered lap completion. Browser tests exercise the production build using Vite preview, including desktop driving, touch multi-input, pause, results, saved distance, replay, exit, and WebGL context-loss recovery. An installed browser can be selected with `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`.

Current automated validation ran in Chromium with software WebGL and a simulated touch viewport. This verifies functionality, not frame-rate targets on actual phones or Safari. Real Android/iOS device performance, longer manual driving sessions, and final asset fidelity remain to be evaluated.

## Deployment

The existing Vercel Vite configuration applies unchanged: build `npm run build`, publish `dist`. No new environment variables are required.
