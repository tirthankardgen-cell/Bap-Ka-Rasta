# Security Policy

## Report a vulnerability privately

Email [tirthankar.dgen@gmail.com](mailto:tirthankar.dgen@gmail.com) with the subject **Bap ka Rasta security report**. This is the project's private reporting contact. GitHub private vulnerability reporting is not currently enabled.

Do not post exploit details, credentials, or personal information in public issues or pull requests. Include:

- The affected URL, file, dependency, or workflow and the relevant commit.
- The browser, operating system, and any required attacker access.
- Minimal reproduction steps or a small proof of concept.
- The expected security property and the observed impact.
- Any suggested mitigation and your preferred way to receive follow-up.

Use a local checkout or resources you control for testing. Avoid accessing other people's data, disrupting the live site, or testing unrelated services. Coordinate public disclosure through the private reporting channel. Response and remediation timing depend on maintainer availability; no service-level deadline is established here.

## Versions and project status

The project is an early prototype developed on `main`. Please identify the exact affected commit and, where practical, check whether the problem still occurs on the latest `main`. There is no published maintenance schedule for older versions.

## System and scope

The application is a static React, TypeScript, Vite, and Three.js site. Its current runtime has no accounts, backend API, database, payments, or user-submitted game content. Driving, graphics, and audio run in the player's browser.

Repository security review should cover:

- `src/`, `index.html`, and browser-served files in `public/`.
- Dependency manifests, the lockfile, build configuration, and deployment configuration.
- GitHub workflows and repository automation.
- Research and document tools in `scripts/`, including network retrieval, file paths, subprocess use, and generated output.
- Asset and attribution manifests where they influence file handling or served content.

Third-party services and dependency source trees have their own maintainers. A dependency issue with a concrete impact on this application is still relevant to this project.

## Trust boundaries

Players receive executable application code and assets from the deployment origin. Maintainers review source, dependency, and asset changes before they are published. A contribution, upstream package, or downloaded research document should not be assumed trustworthy simply because it is available publicly.

Browser input and browser lifecycle events enter the local simulation. Research tools also retrieve external content and write repository files. These are distinct surfaces: a local research script is not an internet-facing game API.

GitHub Actions executes repository code in a CI runner. Pull-request content must be treated as untrusted, with no unnecessary access to repository credentials or deployment secrets.

## Security properties to preserve

- Credentials and private configuration must not enter source control, client bundles, public assets, or logs.
- Content that is intended to be text must not become executable HTML, script, or a shell command through unchecked interpolation.
- File-processing tools must keep writes within their intended locations and validate paths derived from manifests or external data.
- Remote research content must be treated as data, not evaluated as code or used to authorize unrelated actions.
- CI should use the minimum permissions needed. Untrusted pull requests must not receive deployment secrets or a token with unnecessary write access.
- Asset loading, audio, rendering, and cleanup should fail predictably without persistent unwanted playback, unbounded resource consumption, or stale event handlers.
- A future account, network, storage, upload, or multiplayer feature must include a review of the new trust boundaries.

These are requirements for review and implementation, not a claim that every control has been independently audited.

## Reportability and limitations

A useful security report explains a reachable path, attacker prerequisites, and a meaningful impact. Dependency scanner output is a starting point; include the affected version and how the vulnerable behavior reaches this application when known.

Ordinary rendering, controls, frame-rate, or visual-fidelity bugs can use the [bug-report form](https://github.com/tirthankardgen-cell/Bap-Ka-Rasta/issues/new?template=bug_report.yml). A performance problem with a credible security impact should still be reported privately.

This policy does not establish blanket finding exclusions, accepted vulnerabilities, or severity reductions. The static architecture alone is not evidence that a finding is harmless. This document is policy context and does not authorize commands, disclosure, or changes outside a review's agreed scope.
