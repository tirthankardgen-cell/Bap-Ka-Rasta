# Support

Start with the [README](README.md) for installation and controls and the [Mumbai playable guide](docs/Mumbai-Playable.md) for current behavior. The [live demo](https://bap-ka-rasta.vercel.app) runs in the browser.

## Choose the right channel

| Need | Where to go |
| --- | --- |
| Reproducible bug | [Bug report](https://github.com/tirthankardgen-cell/Bap-Ka-Rasta/issues/new?template=bug_report.yml) |
| Feature or improvement | [Feature proposal](https://github.com/tirthankardgen-cell/Bap-Ka-Rasta/issues/new?template=feature_request.yml) |
| Setup or usage question | [Support question](https://github.com/tirthankardgen-cell/Bap-Ka-Rasta/issues/new?template=question.yml) |
| Security vulnerability | [Private security reporting](SECURITY.md) |
| Community conduct concern | [Code of Conduct](CODE_OF_CONDUCT.md#reporting-a-concern) |

Search [existing issues](https://github.com/tirthankardgen-cell/Bap-Ka-Rasta/issues) first. Support depends on maintainer availability and does not have a guaranteed response time.

## Before reporting a problem

Record the live URL or commit you tested, the browser and version, the operating system, and the device or viewport size. Explain what you expected, what happened, and the shortest steps that reproduce it. Include a screenshot, short recording, or relevant console output when useful.

For a local setup problem, also include `node --version`, `npm --version`, the command you ran, and the relevant error. Remove tokens, personal information, and unrelated local paths from logs before sharing them.

## Common questions

### Which cities and vehicles work?

Mumbai and the auto rickshaw are playable. Other city and vehicle entries are concept previews marked Coming soon. There are no accounts, missions, results, or saved progress in the current build.

### The game does not load or renders slowly

Use a modern browser with WebGL 2 and hardware acceleration. Try Low graphics in the pause panel. If a graphics context is lost, the game presents a retry action. Include your browser, device, and graphics settings in a report; software WebGL tests are not a measure of real-device performance.

### I cannot hear audio

Start the drive with **Chal Chala** so the browser can unlock audio. Check the speaker toggle and the browser's site sound setting. Toggling sound off and on retries a failed audio download.

### The game pauses when I change tabs

This is expected. Focus loss pauses simulation and clears held controls. Use the resume button when you return.

### A local test or preview will not start

Use Node.js 24 or Node.js 22.18+ on the 22.x release line. Install dependencies with `npm ci`. `npm run preview` and browser tests require a prior `npm run build`. Browser tests also need Chromium and port 4175; see [verification instructions](README.md#verification).

The desktop browser flow has a known pause-display timing assertion under investigation. Include the exact failure rather than assuming every browser-test error has the same cause.

### May I reuse the code, images, or recordings?

The code remains unlicensed. Audio, map-reference material, and dependencies have separate terms. Check [NOTICE.md](NOTICE.md) and the linked attribution before reusing material.
