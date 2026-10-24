# Bap ka Rasta

A lightweight Indian driving game in development. The responsive React landing page is ready to deploy to Vercel; playable driving is the next milestone.

The first-stage research and architecture specification is complete:

- [Game design and architecture](docs/Bap-ka-Rasta-Game-Plan.md)
- [Readable PDF](output/pdf/Bap-ka-Rasta-Game-Plan.pdf)
- [Browser document](output/Bap-ka-Rasta-Game-Plan.html)
- [Primary source verification record](docs/research/source-checks.json)
- [Visual storyboard: cities, characters, vehicles, and player journey](docs/storyboard/README.md)

The plan covers Mumbai, Delhi, Kolkata, Chennai, and Bangalore, with auto rickshaw, Thar, Fortuner, scooty, and KTM available at launch. The intended flow is landing page, Mera Bap Ka Rasta, city selection, vehicle selection, then driving. Revision 1 adds original street humour, explicit controller axes, local chunk activation, first playable build tasks, and a generated content manifest contract.

## Website development

The landing page uses React, TypeScript, and Vite. It includes original Mumbai hero art, five city previews, a vehicle and character section, a keyboard/touch controls guide, and responsive navigation. City selection opens a concept preview; it does not start a playable game yet. No credentials or backend are required.

Use Node.js 22 or newer:

```sh
npm ci
npm run dev
```

For production validation:

```sh
npm run build
npm run preview
```

The build runs TypeScript checks and outputs the static site to `dist/`. Fonts and images are served locally. The two WebP images together are approximately 690 KB. The controls guide describes planned gameplay controls.

## Deploy to Vercel

1. Import `tirthankardgen-cell/Bap-Ka-Rasta` in Vercel.
2. Keep the repository root as the Root Directory and select the Vite framework preset.
3. Use `npm run build` as the build command and `dist` as the output directory; these are also declared in `vercel.json`.
4. Deploy. No environment variables are required.

Future pushes to the connected production branch can deploy automatically. This repository has not been deployed by the assistant.

## Landing page validation

The production build and TypeScript checks pass. Chromium checks cover desktop and mobile layouts, city preview selection, controls dialog, Escape dismissal, mobile navigation, image loading, and horizontal overflow. The first playable Mumbai/auto slice will add Three.js and React Three Fiber after this landing-page milestone.

## Website artwork

`public/images/landing-hero.webp` is original generated concept art based on the approved blocky city/character storyboard. `public/images/world-board.webp` is the approved world storyboard, displayed through CSS panel windows for the city and cast previews. Both were encoded as WebP for delivery. The hero was generated on 24 October 2026; the images are promotional concept art, not screenshots of working gameplay. Font packages include their upstream licenses in `node_modules/@fontsource/`.

## Document tools

`scripts/research_sources.py` retrieves the primary references and writes the verification record. Its recorded research date is 24 October 2026; change that constant when performing a later research refresh.

`scripts/build_game_plan.py` builds the PDF from the Markdown source using ReportLab and writes a browser-readable HTML copy to `output/`. It requires the project's document dependencies, not the future game's JavaScript packages.

These files are research and documentation tools. No game server, user account, secret key, or database is required to use the specification.
