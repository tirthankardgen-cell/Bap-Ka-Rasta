# Mumbai kaali-peeli auto

Original Blender geometry authored for **Bap ka Rasta** on 28 October 2026.
No downloaded mesh, paid asset, third-party texture, or external asset service is required.
The repository's existing licensing status applies; no new reuse license is granted here.

- Editable source: `mumbai-auto.blend` (the vehicle and a separate studio collection).
- Runtime export: `public/models/mumbai-auto.glb`.
- Generator: `scripts/vehicles/build_mumbai_auto.py`.
- Model statistics: `model-stats.json`.

The design uses Mumbai's black body/canopy and yellow windscreen surround, a curved RE-style
front cowl, twin round lamps, an open side entry, rear passenger bench, handlebar controls,
fare meter, wiper, mirrors, rear ventilation, CNG marking and fictional MH 02 registration.
It is a game model inspired by the vehicle class, not a manufacturer CAD replica.

## References and provenance

Visual references were viewed in Chrome; these photographs are not included in the asset:

- [Mumbai kaali-peeli image references](https://www.bing.com/images/search?q=Mumbai+auto+rickshaw+black+yellow)
- [Bajaj rickshaw structure reference, photographed by Nikkul](https://commons.wikimedia.org/wiki/File:BangaloreRickshaw.jpg) — photograph is CC BY-SA 3.0; viewed for structural reference only.
- [Auto-rickshaw background and Indian regional liveries](https://en.wikipedia.org/wiki/Auto_rickshaw).

## Export contract

GLB uses metres, **Y up**, **+Z forward**, origin on the ground at the vehicle centre.
The three `wheel_rear_left`, `wheel_rear_right` and `wheel_front` nodes have axle-centred
pivots, rotate around local X, and have a 0.265 m radius. `driver` and `cabinRoof` extras
allow the interior cameras to hide only the relevant parts. Materials are glTF PBR;
all surfaces, lettering and trim are geometry, with no texture requests or decoder needed.

The game loads the asset asynchronously before enabling driving. Each game session owns
its resources. Traffic copies are baked into material-based instance batches, with unused
UV attributes removed; those copies do not dispose of the player's shared source geometry.
The player scene is disposed when exiting, and late loads are disposed if the screen was closed.

## Rebuild with the open Blender MCP bridge

Use Python 3.11+ with `pip install -r scripts/vehicles/requirements.txt`.
Set `BLENDER_MCP_DIR` to your installed `blender-codex-mcp` directory and start the
Blender add-on server on `127.0.0.1:9876`.

```powershell
python scripts/blender_mcp.py get_scene_info
python scripts/blender_mcp.py execute_blender_code --file scripts/vehicles/build_mumbai_auto.py
python scripts/blender_mcp.py execute_blender_code --file scripts/vehicles/render_mumbai_auto.py
```

The generator only replaces its named generated scene, preserving other open scenes.
Its checkout path can be overridden with `MUMBAI_AUTO_ROOT` in Blender's environment.
Blender 3.5 was used for the delivered source and GLB. Studio cameras and lights are excluded
from the runtime export. Rendered review images are written to `output/playwright/rickshaw/`.

Run `npm run build`, `npm test` under Node 22.18+ or 24, and the driving/intro browser tests
after exporting. `tests/auto-model.test.ts` checks the actual GLB's ground contact, dimensions,
wheel pivots, orientation, camera visibility tags, and size/triangle budgets.
