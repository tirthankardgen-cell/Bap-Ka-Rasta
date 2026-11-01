# Vehicle update recovery — 2 November 2026

The interrupted checkout contained **17 modified tracked files**, rather than
only seven, plus the new traffic builder/library and supplied reference folder.
All inherited changes were reviewed before editing. A recovery ZIP, the original
Blender session and baseline logs are kept locally in
`output/playwright/vehicles/recovery-20261102/` (ignored by Git).

## Review of the inherited work

| Files | State found | Resolution |
| --- | --- | --- |
| `scripts/vehicles/build_mumbai_auto.py`, auto GLB, auto `.blend`, `model-stats.json` | Meter, divider, gauge and front-cowl changes existed in source. The saved source mixed several scenes; the mesh exceeded its 45,000-triangle budget. | Kept the useful construction, completed photo-based details, reduced redundant bevel geometry, rebuilt and verified the actual export. The auto is 38,602 triangles. |
| `src/game/auto-model.ts` | Speedometer binding was implemented but lacked a regression check. | Preserved it; verified zero, forward, reverse, capped and invalid speeds. |
| `src/game/intro-visuals.ts`, `src/game/engine.ts` | Vehicle-anchored seated body was implemented but unverified. Traffic setup was incomplete. | Preserved the body fix, verified it against the real character asset, completed traffic ownership and hid the first-person body during the incident camera. |
| `src/game/Game.tsx`, `src/game/game-assets.ts` | Parallel traffic loading/cancellation had been wired into the caller. | Preserved and verified the complete load/retry/disposal flow. |
| `src/game/world.ts` | New instanced traffic path existed, but removed `trafficCar` was still called for parked taxis, preventing compilation. | Parked taxis now use the same Blender assets. Cancelled batch setup releases temporary geometry/materials. |
| `src/game/simulation.ts`, `src/game/world-scale.ts` | Kind count was raised to nine, with provisional dimensions. | Expanded to thirteen kinds and aligned clearances with measured exports; preserved the simulation architecture. |
| `tests/browser/fixtures/incident.tsx`, `tests/browser/fixtures/performance.ts` | New asset arguments were partly wired. | Completed the world signature and checked both affected flows. |
| `tests/mumbai-expansion.test.ts` | Procedural vehicle coverage had been narrowed to the old bus. | Moved geometry coverage to checks of the real auto plus all twelve exported traffic models. Map/collision assertions remain. |
| `assets/architecture/mumbai/mumbai-landmarks.blend` | Unrelated inherited save grew from about 22 MB to 82 MB. | Read-only comparison found matching mesh geometry, transforms and base colours for all 728 mesh/text objects across its two scenes. Left the local file untouched and excluded it from the vehicle commit. |
| `assets/vehicles/mumbai-auto/mumbai-auto.blend1` | Inherited Blender backup changed. | Preserved locally and excluded from the commit. New vehicle backup files are ignored. |
| New traffic source files, GLB and `.blend` | Runtime expected eight models, but the export/manifest contained only five. Extra-car and bus builders had not been exported. | Completed the builders, added four everyday-car silhouettes, exported twelve traffic models, and staged all thirteen vehicles with the auto in one clean Blender file. |

## Per-model and visual review

The [vehicle library guide](../assets/vehicles/gallery-traffic/README.md) maps all
thirteen models to the supplied photos and lists their finished details. Each
model was rendered from front, side and rear. The second pass corrected seat
headrests clipping rear windows, round cage-like car pillars, a disconnected
scooter steering cover, incomplete bus cab glass, inappropriate bus alloy rims,
and solid body decks inside car cabins. Driver controls and interiors sit inside
hollow bodies; the e-rickshaw has an open entry and opposed passenger benches.

The auto's meter is behind the driver, mounted on the partition and facing the
passengers. Its independent handlebar speedometer remains visible from the
driver's seat. The seated torso, arms and legs belong to vehicle space; looking
around changes the camera/head view without rotating that body geometry.

Validation also caught Blender exporting selected objects from other open
scenes. Both builders now explicitly restrict exports to their active scene,
and tests reject multi-scene GLBs or embedded reference photographs.
Repeated staging also left a duplicate auto when Blender suffixed an old studio
collection's name. Staging now clears its base and suffixed collections before
rebuilding the lineup; the saved library was reopened and verified to contain
exactly thirteen vehicle roots.

## Validation

Baseline: TypeScript failed on the parked-car call; 88 of 89 unit tests passed,
with the auto failing the existing triangle budget. The shell's default Node 20
could not run the repository's TypeScript test command, so validation uses the
installed Node 24.22.1 runtime, matching the project's supported versions.

Final validation passed:

- **91 unit tests**, including the actual exported models, wheel pivots, body
  dimensions, meter placement, speedometer and vehicle-anchored driver geometry.
- **25 browser tests** in Chrome, covering desktop/mobile driving, camera
  switching, touch look, loading/retry, graphics-context recovery, intro,
  collisions, fullscreen and galleries.
- Production build and Python script compilation.
- Saved Blender library: thirteen vehicle kinds, correct independent wheel
  counts, finite geometry, thirteen packed photo boards and isolated source scenes.
- Audio verification: 57 research MP3s with credits/checksums; voice verification:
  119 clips, 20 roles and 4,473 people.
- Manual first-person forward and sideways/downward views, plus front/side/rear
  Blender reviews of all thirteen vehicles and close-ups of the auto controls
  and passenger meter.
- `git diff --check`.

Evidence is kept in the local recovery folder above. These browser results use
desktop Chrome with mobile emulation; they do not establish performance on a
physical phone or Safari. Future player driving/unlocking for the other twelve
vehicles is outside this model update; their editable parts and wheel pivots
are retained for that work.
