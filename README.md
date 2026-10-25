# Bap ka Rasta

**Apna sheher. Apni sawaari. Apna rasta.**

A single-player, browser-based 3D driving game inspired by Indian streets. Explore a South Mumbai-inspired neighbourhood in a black-and-yellow auto rickshaw, sharing the roads with traffic, pedestrians, and street vendors.

Built with React, TypeScript, Vite, and Three.js. The game runs entirely in the browser and can be deployed as a static site without accounts, a backend, API keys, or a database.

![Bap ka Rasta concept artwork: an auto rickshaw and its driver on Mumbai's seafront](public/images/landing-hero.webp)

*Original generated promotional artwork used on the landing page. Gameplay uses procedural 3D geometry.*

[Quick start](#quick-start) · [How to play](#how-to-play) · [Development](#development) · [Project structure](#project-structure) · [Deployment](#deployment) · [Documentation](#documentation) · [Credits and licensing](#credits-and-licensing)

## Current build

The project is an early playable prototype. Mumbai and the auto rickshaw are available; the remaining city and vehicle galleries show concept previews.

| Content | Playable now | Planned content shown in the galleries |
| --- | --- | --- |
| Cities | Mumbai | Delhi, Kolkata, Chennai, Bangalore |
| Player vehicles | Auto rickshaw | Thar, Fortuner, Scooty, KTM |

The current build includes:

- **Connected streets:** 42 road segments, 16 signalized intersections, and a clockwise roundabout, with routes through Marine Drive, Churchgate, Fort, and Colaba-inspired areas.
- **Street activity:** 112 moving traffic vehicles, 372 moving pedestrians, raised pavements, and roadside food carts with sellers and customers.
- **Arcade driving:** acceleration, steering, braking, delayed reverse, vehicle and roadside collisions, and safe vehicle reset. The auto reaches approximately 65 km/h.
- **Desktop and touch controls:** simultaneous steering and acceleration, responsive galleries, a chase camera, and a HUD with speed, street names, and signal warnings.
- **Recorded street audio:** an engine loop, horn, traffic, and market ambience, with driving-sensitive engine sound and nearby activity mixing.
- **Session controls:** pause/resume, sound toggle, Standard/Low graphics, automatic pause on focus loss, and a retry screen for graphics context loss.

Driving is open-ended free roaming. There are no laps, objectives, minimap, results screen, or saved progress in this build. The [original game plan](docs/Bap-ka-Rasta-Game-Plan.md) describes a broader release scope; the [playable guide](docs/Mumbai-Playable.md) describes the implementation.

## Quick start

### Requirements

- **Node.js 24** (recommended), or **Node.js 22.18+** on the 22.x release line, with npm. The simulation tests use Node's native TypeScript support.
- **Git** to clone the repository.
- A modern browser with **WebGL 2** and hardware acceleration enabled.

```sh
git clone https://github.com/tirthankardgen-cell/Bap-Ka-Rasta.git
cd Bap-Ka-Rasta
npm ci
npm run dev
```

Open [http://localhost:5173](http://localhost:5173), or the URL printed by Vite if that port is occupied. No `.env` file is required.

The development server binds to `0.0.0.0`. To try touch controls on a phone connected to the same network, use the Network URL printed by Vite and allow the development server through your local firewall if needed.

## How to play

1. Select **Mera Bap Ka Rasta** on the landing page.
2. Choose **Mumbai**, then select **Yahin Chalao**.
3. Choose **Auto rickshaw**, then select **Drive Mumbai**.
4. Select **Chal Chala** to start driving and unlock browser audio.

The city and vehicle galleries support arrow buttons, Left/Right arrow keys, swipe gestures, and selection dots. **Escape** returns to the previous screen. Entries marked **Coming soon** cannot start a drive.

### Driving controls

| Action | Keyboard | On-screen control |
| --- | --- | --- |
| Accelerate | `W` / `ArrowUp` | Hold **Chalao** (up arrow) |
| Brake, then reverse | `S` / `ArrowDown` | Hold **Ruko / reverse** (down arrow) |
| Steer left / right | `A` / `D` or `ArrowLeft` / `ArrowRight` | Hold the steering arrows |
| Handbrake | `Space` | Use the brake/reverse pedal for touch braking |
| Horn | `H` | Horn button |
| Reset to a safe road position | `R` | Reset button |
| Pause | `Escape` / `P` | Pause button |
| Resume | Select the resume button | **Chal, phir niklein** in the pause panel |
| Sound on / off | Select the sound button | Speaker button or pause-panel sound toggle |

Keep holding brake after stopping to reverse; reverse engages after a short delay. Steering and acceleration can be held together. Switching tabs or losing focus pauses the game and clears held inputs; resume explicitly when returning.

The pause panel also lets you change graphics quality and end the drive. **Aaj ka ho gaya** and **Ghar chalo** return to the landing page.

## Development

### Technology

| Area | Implementation |
| --- | --- |
| Interface | React 19, TypeScript, CSS, and Lucide icons |
| Rendering | Three.js with an imperative renderer and procedural geometry |
| Driving and traffic | Custom TypeScript simulation with a 60 Hz fixed step |
| Audio | Web Audio API with locally served MP3 excerpts |
| Build tooling | Vite 6 and TypeScript 5.9 |
| Tests | Node.js built-in test runner and Playwright |
| Fonts | Barlow Condensed and DM Sans, served locally through Fontsource |

Dependency versions are recorded in [package.json](package.json) and [package-lock.json](package-lock.json). Use `npm ci` for a reproducible installation.

### Commands

Run these commands from the repository root:

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the Vite development server, normally on port 5173 |
| `npm run build` | Run TypeScript checks and create the static production build in `dist/` |
| `npm run preview` | Serve the existing production build locally, normally on port 4173 |
| `npm test` | Run simulation and pavement-layout tests |
| `npm run test:e2e` | Run Playwright browser tests against a production build |

### Verification

```sh
npm test
npm run build
npx playwright install chromium
npm run test:e2e
```

The browser installation is needed on first setup and may be needed after a Playwright upgrade. Build before running browser tests: Playwright starts `npm run preview -- --port 4175` and uses the existing `dist/` directory; it does not build the app itself.

- **Simulation and layout tests** cover road connectivity, pavements, speed limits, braking/reverse, steering, collisions, safe resets, signal phases, pedestrian yielding, and extended simulated traffic and driving.
- **Browser tests** cover city/vehicle selection, responsive galleries, driving controls, touch input, pause/reset/exit, audio loading and lifecycle, and graphics context-loss recovery.

The browser configuration uses Chromium with software WebGL. `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` can point to an installed Chromium-compatible browser. See [playwright.config.ts](playwright.config.ts) for the server, timeout, and browser settings. Screenshots and test output are written to `test-results/`.

Before submitting a change, run the checks relevant to it and update documentation when controls, availability, or setup steps change. Keep audio attribution alongside any added or edited recordings.

## Project structure

```text
src/
  main.tsx                Landing page, screen navigation, and lazy game loading
  style.css               Landing-page and shared styles
  selection/              City and vehicle galleries
  game/
    Game.tsx              HUD, start/pause/error panels, and touch controls
    engine.ts             Renderer, game loop, input, camera, and cleanup
    simulation.ts         Vehicle movement, traffic, collisions, and resets
    network.ts            Road graph, lanes, signals, crossings, and obstacles
    pavements.ts          Raised-pavement layout and road clearance
    world.ts              City geometry, landmarks, pedestrians, and traffic rendering
    vehicles.ts           Player and traffic vehicle geometry
    atmosphere.ts         Sky, lighting, reflections, fog, and shadows
    audio.ts              Recorded audio loading, playback, mixing, and cleanup
    game.css              Driving interface styles
public/
  images/                 WebP landing and gallery artwork
  audio/                  Four gameplay audio clips, deployed credits, and licenses
assets/audio/mumbai/      Research recordings, listening catalogue, and manifest
tests/                   Simulation/layout tests and browser flows
docs/                    Playable guide, game plan, storyboards, and research
scripts/                 Documentation generation and research/audio verification
output/                  Generated HTML and PDF editions of the game plan
```

React owns the screens and HUD; the game engine owns rendering and simulation. The game module loads after vehicle selection. Simulation runs at a fixed step with bounded catch-up, while HUD updates are throttled to approximately 10 Hz. Repeated scenery and traffic use shared or instanced geometry. Ending a drive disposes renderer resources, input listeners, and audio.

Vite copies `public/` into the build. The full audio research collection in `assets/`, the design documents, and generated document previews are outside the game bundle. Only the four selected gameplay recordings are served by the app.

## Deployment

### Vercel

1. Import [tirthankardgen-cell/Bap-Ka-Rasta](https://github.com/tirthankardgen-cell/Bap-Ka-Rasta) into Vercel.
2. Use the repository root as the **Root Directory**.
3. Select the **Vite** framework preset and a supported Node.js version from the requirements above.
4. Use **`npm run build`** as the build command and **`dist`** as the output directory.
5. Deploy. No environment variables are required.

The framework, build command, and output directory are already declared in [vercel.json](vercel.json).

### Other static hosts

Run `npm run build` and publish the contents of `dist/` at the site's root. Asset URLs use absolute paths such as `/images/` and `/audio/`; hosting beneath a subdirectory requires corresponding code and build-path changes. `npm run preview` is for local verification, not a production hosting service.

## Documentation

| Resource | What it covers |
| --- | --- |
| [Mumbai playable guide](docs/Mumbai-Playable.md) | Current gameplay, controls, runtime modules, and validation limits |
| [Game design and architecture](docs/Bap-ka-Rasta-Game-Plan.md) | Original product scope, proposed architecture, and development milestones |
| [Game plan PDF](output/pdf/Bap-ka-Rasta-Game-Plan.pdf) / [HTML edition](output/Bap-ka-Rasta-Game-Plan.html) | Generated, readable editions of the design document |
| [Visual storyboards](docs/storyboard/README.md) | City, vehicle, character, and player-journey concept references |
| [Mumbai map research](docs/research/mumbai/README.md) | Geographic references, authored-map boundaries, and attribution |
| [Street audio research](docs/research/mumbai/audio/README.md) | Recording sources, locations, licenses, and coverage |
| [Audio library](assets/audio/mumbai/README.md) / [listening catalogue](assets/audio/mumbai/listen.html) | Local source recordings and playback |
| [Primary source verification](docs/research/source-checks.json) | Recorded research evidence for the design document |

The game plan and storyboards describe intended features and technology choices. For example, the plan proposes React Three Fiber and Vitest; the current code uses direct Three.js and Node's test runner. Use this README and the playable guide for current setup and behavior.

### Optional documentation and research tools

Python is needed only for these utilities. The game itself uses the npm workflow above.

| Command | Requirements and output |
| --- | --- |
| `python scripts/verify_audio_assets.py` | Python 3.9+; checks the research audio manifest, file sizes, SHA-256 hashes, credits, and license files using the standard library |
| `python scripts/research_sources.py` | Python and `requests`; fetches primary references and rewrites `docs/research/source-checks.json` |
| `python scripts/build_game_plan.py` | Python, `reportlab`, and `pypdf`; generates the game plan PDF/HTML and document checks |

Optional audio inspection:

```sh
python scripts/verify_audio_assets.py --ffprobe ffprobe --ffmpeg ffmpeg
```

This requires FFmpeg and ffprobe on `PATH`; each flag also accepts an executable path. `--ffprobe` validates stream metadata and `--ffmpeg` fully decodes each recording. Both checks are optional.

For the research and document-generation tools, install the relevant Python packages in your preferred virtual environment:

```sh
python -m pip install requests reportlab pypdf
```

The PDF builder currently uses Segoe UI and Consolas from `C:/Windows/Fonts`. On another operating system, update `register_fonts()` in `scripts/build_game_plan.py` to use available fonts. The source-research script records a fixed `CHECKED` date of `2026-10-24`; update it when refreshing the research. The PDF builder also checks the saved source-verification record.

## Known limitations and troubleshooting

- **Prototype scope:** Mumbai and the auto rickshaw are the only playable combination. The other galleries and design documents contain future content.
- **Map fidelity:** the streets are independently authored, compressed gameplay geometry inspired by South Mumbai. Municipal ward data provides geographic context; there is no live map integration.
- **Device coverage:** automated browser checks use Chromium and simulated touch. Real Android/iOS performance, Safari compatibility, and extended manual playtesting still need validation.
- **Low frame rate:** enable browser hardware acceleration and switch to **Low graphics** in the pause panel. This reduces rendering resolution and fog distance and disables shadows.
- **Graphics unavailable:** use a WebGL 2-capable browser. If the graphics context is lost during a drive, use the retry action shown on screen.
- **No sound:** select **Chal Chala** first, check the speaker toggle, and toggle sound off/on to retry a failed audio download.
- **Test runner rejects `--experimental-strip-types`:** check `node --version` and switch to the Node.js version listed under requirements.
- **Browser tests cannot start:** build the app, install Chromium, and ensure port `4175` is available or already serving this project's current production build.

## Credits and licensing

Audio is drawn from credited Freesound recordings. The [research library attribution](assets/audio/mumbai/ATTRIBUTION.md), [manifest](assets/audio/mumbai/manifest.json), and [license texts](assets/audio/mumbai/licenses/) record each source and its terms. The collection uses CC0 1.0, CC BY 4.0, and CC BY 3.0 licenses.

The four gameplay excerpts have their own [deployed credits](public/audio/credits.html), available at `/audio/credits.html` and through the pause panel. The horn excerpt comes from a Jaipur electric-rickshaw recording; its provenance is documented with the other clips. Preserve the credits and modification notes when reusing audio.

The municipal reference illustration uses DataMeet data under **CC BY-SA 2.5 India**; see the [map attribution](docs/research/mumbai/README.md). Landing/gallery images and storyboards are original generated concept artwork. Font licenses are included with their upstream Fontsource packages.

This repository currently has no project-wide `LICENSE` file. Individual asset and dependency licenses apply to their respective materials and do not establish a license for the game code.
