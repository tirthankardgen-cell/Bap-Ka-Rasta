# Changelog

Changes are recorded here for contributors and maintainers. Entries under Unreleased describe work on the development branch and do not imply a published release or tag.

## Unreleased

### Added

- Contribution, security, conduct, and support guidance.
- A documentation index, roadmap, maintainer guide, and licensing/attribution notice.
- Structured bug, feature, and support issue forms and a pull-request template.
- GitHub Actions checks for the production build, simulation/layout tests, and research-audio manifest.
- Weekly Dependabot configuration for npm dependencies and GitHub Actions.
- Editor, line-ending, and Node-version configuration for consistent checkouts.

### Changed

- Reorganized the README around current gameplay, setup, controls, architecture, deployment, and reference documents.
- Added package description, repository links, keywords, supported Node versions, and an explicit `UNLICENSED` marker.
- Expanded ignore rules for local environment files, Python caches, and operating-system metadata.

### Known limitations

- Mumbai and the auto rickshaw remain the only playable combination.
- The desktop browser test can fail on the distance displayed immediately after pausing; the simulation and HUD update on different schedules.
- Real Android/iOS performance, Safari compatibility, and extended manual driving still need validation.

## Prototype baseline

The existing prototype includes the landing page and city/vehicle galleries, an authored South Mumbai-inspired road network, arcade auto-rickshaw driving, traffic and pedestrians, keyboard/touch input, pause/reset controls, recorded audio, and static Vercel deployment configuration.

The package version is `0.1.0`. For the full development history, see the [commit log](https://github.com/tirthankardgen-cell/Bap-Ka-Rasta/commits/main). The [original design plan](docs/Bap-ka-Rasta-Game-Plan.md) describes the broader intended release.
