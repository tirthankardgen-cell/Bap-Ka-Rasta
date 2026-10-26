# Roadmap

Bap ka Rasta is developing from a playable Mumbai/auto-rickshaw prototype toward the broader scope in the [game design plan](Bap-ka-Rasta-Game-Plan.md). This roadmap records priorities, not committed delivery dates.

## Current milestone

The current build provides:

- Landing, city selection, and vehicle selection screens.
- Free driving through an authored South Mumbai-inspired street network.
- An auto rickshaw, NPC traffic, pedestrians, crossings, and roadside activity.
- A skippable driver-entry opening, twenty character designs, neighbourhood crowd variety and text greetings; character audio recording/integration is pending.
- Keyboard and touch input, pause/resume, safe reset, sound, and graphics controls.
- Recorded engine, horn, traffic, and market audio with attribution.
- Simulation/layout tests, browser flows, and a static production build.

Mumbai and the auto rickshaw are the only playable combination. See the [playable guide](Mumbai-Playable.md) for the detailed implementation.

## Validation and reliability

- [ ] Resolve the long desktop browser flow exceeding its software-WebGL time budget. Pause now publishes the current HUD state immediately; continue checking pause/resume consistency.
- [ ] Measure frame rate, loading time, memory, and touch behavior on real Android and iOS devices.
- [ ] Validate Safari/WebKit behavior, including WebGL recovery and browser audio restrictions.
- [ ] Extend manual drives through congested intersections and test repeated start/pause/reset/exit sessions.
- [ ] Review download size, draw calls, resource cleanup, and graphics quality tradeoffs using measurements.
- [ ] Review keyboard focus, control labels, reduced-motion behavior, and touch-target accessibility.

The automated repository checks cover the build, simulation/layout tests, and audio manifest. The existing Playwright suite remains a separate check; it is not presented as consistently passing while the long desktop flow still times out under software WebGL.

## Planned content expansion

- [ ] Add playable Delhi, Kolkata, Chennai, and Bangalore environments.
- [ ] Add the planned Thar, Fortuner, Scooty, and KTM player-vehicle roles with appropriate handling and original visuals.
- [ ] Reuse the existing road, vehicle, interface, and asset conventions as content grows.
- [ ] Validate each new city/vehicle combination on desktop and touch devices before marking it available.

The original plan also discusses results and local best-distance storage. Reconfirm those features against the current open-ended driving direction before implementing them.

## Later ideas

Passenger jobs, timed challenges, upgrades, dynamic weather, a day/night cycle, online leaderboards, and multiplayer require separate design and technical decisions. They are not features of the current build or promised parts of the next update.

Use the [feature-proposal form](https://github.com/tirthankardgen-cell/Bap-Ka-Rasta/issues/new?template=feature_request.yml) to suggest a focused improvement. Include the player problem, proposed behavior, and validation approach.
