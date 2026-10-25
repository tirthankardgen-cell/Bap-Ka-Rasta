# Contributing to Bap ka Rasta

Bap ka Rasta is a browser driving-game prototype. Contributions should improve the playable Mumbai experience, keep desktop and touch controls usable, and preserve the distinction between implemented features and future plans.

Read the [Code of Conduct](CODE_OF_CONDUCT.md), [current playable guide](docs/Mumbai-Playable.md), and [roadmap](docs/ROADMAP.md) before starting. For vulnerabilities, use the private process in [SECURITY.md](SECURITY.md).

## Find a useful contribution

- Reproduce a bug and provide clear steps, device details, and the affected commit.
- Improve keyboard navigation, touch controls, responsive layouts, or accessibility.
- Help test real devices and measure rendering performance.
- Correct setup instructions, broken links, or gaps in the documentation.
- Improve existing simulation behavior with a focused regression check.
- Contribute original or appropriately licensed assets with complete source information.

Search [existing issues](https://github.com/tirthankardgen-cell/Bap-Ka-Rasta/issues) before opening a new one. For a new city, vehicle, dependency, or substantial architecture change, open a feature proposal first so the scope can be discussed.

## Set up a development checkout

Use Node.js 24, or Node.js 22.18+ on the 22.x line. The repository includes an `.nvmrc` for tools that support it.

```sh
git clone https://github.com/tirthankardgen-cell/Bap-Ka-Rasta.git
cd Bap-Ka-Rasta
npm ci
npm run dev
```

Contributors without repository write access should fork the repository and clone their fork. Create a branch for a focused change:

```sh
git switch -c docs/improve-controls
```

No environment file, API key, game server, or database is required. See the [README](README.md#quick-start) for the local URL and phone-testing instructions.

## Implementation conventions

- Follow the surrounding TypeScript, React, and CSS style and the repository's `.editorconfig`.
- Keep simulation and movement logic in `src/game/simulation.ts` and road rules in `src/game/network.ts`. React owns the interface; `engine.ts` owns the render loop, input, and resource lifecycle.
- Use the existing fixed simulation step. Avoid driving physics through React renders or adding per-frame React state updates.
- Handle both keyboard and pointer input. Clear held controls on cancellation, pause, focus loss, and cleanup.
- Dispose Three.js resources, event listeners, timers, and audio contexts when a drive ends.
- Treat reduced graphics cost, readable controls, and graceful loading failures as part of the experience.
- Keep dependencies focused. Explain why a new dependency is needed and include any resulting lockfile update.
- Use accurate user-facing labels. Mumbai and the auto rickshaw are the current playable combination; preview artwork does not establish playable functionality.

## Validate your change

| Change | Relevant checks |
| --- | --- |
| Documentation or templates | Check links, commands, spelling, and Markdown/YAML formatting |
| Simulation or road layout | `npm test` and `npm run build`; exercise the affected drive behavior |
| Interface, input, audio, or rendering | `npm test`, `npm run build`, and the Playwright browser suite |
| Dependencies or build configuration | `npm ci`, `npm test`, and `npm run build` |
| Research audio | `python scripts/verify_audio_assets.py`; optionally add ffprobe/FFmpeg validation |

For browser tests:

```sh
npm run build
npx playwright install chromium
npm run test:e2e
```

Playwright uses the production build and starts a preview server on port 4175. An existing compatible browser can be selected with `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`.

The desktop browser flow has a known pause-display timing assertion to investigate. Report failures with their output; do not weaken or skip checks merely to obtain a passing result. See [the roadmap](docs/ROADMAP.md#validation-and-reliability).

For a behavior fix, add or update a focused regression test when it helps prove the change. Documentation-only edits do not need new application tests. State which checks you ran and identify anything you could not verify.

## Assets and licensing

The original game code remains unlicensed; see [NOTICE.md](NOTICE.md). This contribution guide does not grant a new license or change third-party terms.

Only submit material you have permission to share. For recordings or other third-party assets, include the creator, original source URL, license and license text, and a description of modifications. Keep research recordings in `assets/audio/mumbai/` and selected runtime excerpts in `public/audio/`. Update the relevant manifest and credits when the audio changes.

Do not submit credentials, local environment files, dependency directories, generated test reports, or unrelated temporary files. Optimized assets and deliberately maintained design-document outputs are part of this repository; avoid replacing them with large working exports.

## Open a pull request

Keep each pull request focused on one change and target `main`. Explain the problem, resulting behavior, and validation using the PR template. Link a relevant issue when one exists. Include screenshots for visible interface changes and describe any device-specific limitations.

Use a clear title such as `docs: clarify touch controls` or `fix: preserve steering on pointer release`. Update the README, playable guide, or changelog when the change affects setup or behavior. Respond to review feedback and keep unrelated cleanup out of the patch.
