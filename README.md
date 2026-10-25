# Bap ka Rasta

A lightweight Indian driving game in development. The single-screen React landing page and the playable Mumbai street network and auto-rickshaw drive are ready to deploy to Vercel.

The first-stage research and architecture specification is complete:

- [Game design and architecture](docs/Bap-ka-Rasta-Game-Plan.md)
- [Readable PDF](output/pdf/Bap-ka-Rasta-Game-Plan.pdf)
- [Browser document](output/Bap-ka-Rasta-Game-Plan.html)
- [Primary source verification record](docs/research/source-checks.json)
- [Visual storyboard: cities, characters, vehicles, and player journey](docs/storyboard/README.md)

The plan covers Mumbai, Delhi, Kolkata, Chennai, and Bangalore, with auto rickshaw, Thar, Fortuner, scooty, and KTM available at launch. The intended flow is landing page, Mera Bap Ka Rasta, city selection, vehicle selection, then driving. Revision 1 adds original street humour, explicit controller axes, local chunk activation, first playable build tasks, and a generated content manifest contract.

## Website development

The landing page uses React, TypeScript, and Vite. It is a single-screen hero with original Mumbai artwork, game branding, and one main button opening a full-screen city gallery. Choose Mumbai, press **Yahin Chalao**, choose the auto rickshaw in the full-screen vehicle gallery, then press **Drive Mumbai** and **Chal Chala** to play. Both galleries support left/right arrows, keyboard navigation, swipe gestures, and direct selection dots. The other cities remain concept previews marked coming soon. No credentials or backend are required.

Use Node.js 22.18+ or 24:

```sh
npm ci
npm run dev
```

For production validation:

```sh
npm run build
npm run preview
```

The build runs TypeScript checks and outputs the static site to `dist/`. Fonts and images are served locally. Artwork is delivered as optimized WebP images. The hero fills the viewport on desktop and mobile. City preview artwork preserves its original proportions through SVG viewboxes.

## Deploy to Vercel

1. Import `tirthankardgen-cell/Bap-Ka-Rasta` in Vercel.
2. Keep the repository root as the Root Directory and select the Vite framework preset.
3. Use `npm run build` as the build command and `dist` as the output directory; these are also declared in `vercel.json`.
4. Deploy. No environment variables are required.

Future pushes to the connected production branch can deploy automatically. This repository has not been deployed by the assistant.

## Landing page validation

The production build and TypeScript checks pass. Chromium checks cover six desktop/mobile viewport sizes, single-screen height without page overflow, all five city selections, proportional preview rendering, and Escape/close dismissal. The Mumbai drive uses Three.js for rendering and React for the HUD. See the [playable build guide](docs/Mumbai-Playable.md) for controls, architecture, testing, and current limitations.

## Mumbai streets

Drive a simplified South Mumbai-inspired network with 42 road segments, 16 signalized intersections, a roundabout, 112 moving vehicles, and 202 pedestrians. Turn freely between the coastal avenue, city blocks, station area and Colaba waterfront. Free roaming has no minimap, lap counter, area objectives or score screen. Vehicles have curved bodies, detailed wheels and reflective finishes; warm shadows, surface textures and water ripples improve the city environment while NPC people stay boxy. See [map sources and attribution](docs/research/mumbai/README.md) and the [current playable guide](docs/Mumbai-Playable.md).

## Playable game checks

```sh
npm test
npm run build
npx playwright install chromium
npm run test:e2e
```

Twelve simulation tests and five production-browser flows cover the connected road graph, signals, traffic, pedestrian crossings, driving, collisions, reverse, free roaming, touch controls, pause/reset, exit/fresh drives, and graphics recovery. Browser checks use software WebGL and touch emulation; real-phone frame-rate validation is still pending. No new Vercel settings or secrets are needed.

## Website artwork

`public/images/vehicle-gallery.webp` contains original generated vehicle previews matching the approved art direction. The gallery uses proportional SVG windows, with the auto available and the other four vehicles marked coming soon.


`public/images/landing-hero.webp` is original generated concept art based on the approved blocky city/character storyboard. `public/images/world-board.webp` is the approved world storyboard, displayed through proportional SVG panel windows for the city previews. Both were encoded as WebP for delivery. The hero was generated on 24 October 2026; the images are promotional concept art, not screenshots of working gameplay. Font packages include their upstream licenses in `node_modules/@fontsource/`.

## Street sound research

[Mumbai street audio research](docs/research/mumbai/audio/README.md) contains real Mumbai and Indian recordings of auto-rickshaws, horns, BEST and other buses, vendors, traffic, crowds, trains and street ambience. Downloaded audio, source/license credits, a checksum manifest and a local listening catalogue live in [`assets/audio/mumbai/`](assets/audio/mumbai/README.md). These assets are outside the website's public directory and are not connected to the game yet.

## Document tools

`scripts/research_sources.py` retrieves the primary references and writes the verification record. Its recorded research date is 24 October 2026; change that constant when performing a later research refresh.

`scripts/build_game_plan.py` builds the PDF from the Markdown source using ReportLab and writes a browser-readable HTML copy to `output/`. It requires the project's document dependencies, not the future game's JavaScript packages.

These files are research and documentation tools. No game server, user account, secret key, or database is required to use the specification.
