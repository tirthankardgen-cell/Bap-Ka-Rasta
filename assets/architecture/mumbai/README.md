# Mumbai architectural library

29 original Blender models supply the live game: 22 landmark/residential sites and seven shops. They include Taj Mahal Palace, Gateway of India, Antilia, CSMT, BMC, Rajabai, Crawford Market, Asiatic Library, Eros, Regal, Flora Fountain, Mannat, Galaxy Apartments, Jalsa, Mount Mary, Siddhivinayak, World One, Royal Opera House, Nehru Centre, Bombay High Court, BSE and World Trade Centre; the shop set is Leopold, Mondegar, Kyani, Yazdani, Kitab Khana, Fashion Street and Bademiya.

[Numbered map](../../../docs/maps/mumbai-game-map.png) · [Full site, height and source catalogue](../../../docs/Mumbai-Landmarks.md)

## Files and ownership

- `mumbai-landmarks.blend`: compressed, editable Blender 3.5 source. District/site collections contain separate near/far meshes, grouped by material. The saved scene shows the actual game placement and a context-only road network.
- `../../../public/models/mumbai-landmarks.glb`: approximately 15.4 MiB, with Meshopt geometry compression and WebP textures. `manifest.json` records the exact byte size, SHA-256, source version and per-model triangle counts.
- `textures/`: fourteen original 512 × 512 masonry/plaster/roof albedo and normal images. The Blender file also packs them internally.
- `layout.json`: exported game coordinates, full approach reservations and exact sampled road paths. The authoritative layout is `src/game/landmark-layout.ts`; edit that file and re-export.

Geometry and surface textures were generated for this project. Public exterior photographs were viewed in Chrome as architectural references; they are not redistributed as game textures. Source URLs and dated research records live in `docs/research/mumbai/{landmarks,celebrity-house,expansion}-sources.json`. Residences are approximate public exteriors, with no interior layouts. The repository's licensing notice applies to these original assets.

## Metre and placement contract

One runtime unit is one metre. GLB templates have local +Y up, +Z toward the principal façade and a grounded base. The Blender scene converts these axes and arranges each site at the authored game coordinates. Heights with published references are labelled in the catalogue; other heights and all footprints are visual approximations. Streets and district spacing are intentionally compressed, not geographic navigation data.

Every template has an exact root ID and `ID__near` / `ID__far` children. Runtime placement applies the site's position and yaw once. Model bounds, approach clearance, real GLB dimensions, distant silhouettes and compressed file fingerprints are checked by the asset/layout tests. Pavement and traffic use the same metre scale.

Complete forecourts and unobstructed approaches are reserved before ordinary building lots. The game's Mumbai Chowk is at `(450, -40)`, with a clear 20 m radius centre at Y = 0.32 m for the future feature. The site library does not occupy it.

## Rebuild

Use Node 24 (or 22.18+), Python 3 with Pillow, Blender 3.5+ and the repository's npm dependencies. From the repository root:

```sh
node scripts/landmarks/export_layout.mts
python scripts/landmarks/make_materials.py
python scripts/landmarks/blender_bridge.py --info
python scripts/landmarks/blender_bridge.py scripts/landmarks/build_mumbai_landmarks.py
node scripts/landmarks/pack_landmarks.mjs
node scripts/landmarks/build_catalogue.mts
node scripts/build-game-map.mts
node scripts/render-game-map.mjs
```

The stdlib bridge connects to the existing Blender add-on on `127.0.0.1:9876`; it has no Python MCP dependency. Alternatively, run `blender --background --factory-startup --python scripts/landmarks/build_mumbai_landmarks.py` after exporting layout/materials, then pack the GLB with Node.

The builder replaces only its named `Mumbai | Landmark Districts` scene. On the first use of a dirty open scene it writes a safety copy under ignored `output/playwright/`; other scenes are retained. Generated `.blend1` backups are ignored. Always run packing after building: the Blender exporter initially writes an uncompressed GLB.

## Review and verify

```sh
python scripts/landmarks/blender_bridge.py scripts/landmarks/render_landmarks.py
node --experimental-strip-types --test tests/landmark-models.test.ts tests/mumbai-expansion.test.ts
npm run build
npm run dev
```

Open `/tools/landmark-preview/` on the development server. The viewer uses the actual game world and shipped assets, with landmark presets, street views, Standard/Low graphics and a common-ground lineup of people, scooter, auto, car and bus. It renders on demand while retaining orbit controls. The viewer is excluded from the production build.

Original Blender and game review PNGs are written to ignored `output/playwright/landmark-renders/`. Selected original previews are included in `docs/mumbai-landmarks/`. Physical phone performance is not established by desktop Chrome checks.
