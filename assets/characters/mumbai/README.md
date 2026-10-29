# Mumbai character library

Twenty original Blender characters built from the project's [main cast](../../../docs/mumbai-characters/images/01-mumbai-main-cast.png) and [street crowd](../../../docs/mumbai-characters/images/02-mumbai-street-crowd.png) concepts. The written [character brief](../../../docs/mumbai-characters/README.md) governs names, clothing and props. Patil is male.

- [Editable Blender library](mumbai-characters.blend): twenty labelled rigs in a review studio, packed textile textures and both concept boards as editor references. The distant meshes and player cabin parts are hidden in the Outliner. Enable them to edit them.
- [Main-cast renders](../../../docs/mumbai-characters/renders/main-cast.jpg) and [street-crowd renders](../../../docs/mumbai-characters/renders/street-crowd.jpg): views of the actual meshes rendered in Blender.
- [Runtime GLB](../../../public/models/mumbai-characters.glb): both levels of detail for all twenty characters, seated Sachin, his first-person hands and intro keys. The studio, labels and reference-image planes are excluded.
- [Manifest](manifest.json): character/reference mapping, triangle counts, final byte size and SHA-256. [Atlas](atlas.json): the original textile/prop tile definitions.

The models retain rounded block heads and bodies, with sculpted eyes, noses, smiles, ears, eyebrows, moustaches, curled/swept/bun/ponytail hair, clothing layers and recognisable accessories. Saris have pleats and gold borders; kurtas and workwear use original painted motifs. Kettles, tiffins, flowers, glasses, bags, phones, a wrench, broom, camera and other props are geometry. These are game interpretations of the illustrated concepts; the concept pixels are never used as people in the game.

## Rebuild

Use Node 22.18+ (22.x) or 24.x and Blender 3.5.x with its glTF exporter. The source was built and inspected in Blender 3.5.1. Install Python's small painting dependency once:

```sh
python -m pip install -r scripts/characters/requirements.txt
npm ci
```

From the repository root, with Blender on `PATH` (or replace `blender` with its executable path):

```sh
python scripts/characters/make_atlas.py
blender --background --factory-startup --threads 4 --python scripts/characters/build_mumbai_characters.py
npm run assets:characters:pack
blender --background assets/characters/mumbai/mumbai-characters.blend --threads 4 --python scripts/characters/render_mumbai_characters.py
python scripts/characters/make_contact_sheets.py
```

The builder exports each character at the origin before arranging the editable studio. Run the pack step after every Blender export. It converts the atlas to WebP, compresses geometry with Meshopt and verifies that all named nodes survive. It also preserves the authored roughness/metallic channels rather than Blender 3.5's faulty packed-image export. `MUMBAI_RENDER_IDS=sachin,meera` limits portrait rendering during modelling. Portrait intermediates and build logs belong under `output/playwright/`.

## Runtime and verification

`loadGameAssets` downloads the auto and character library concurrently, with bounded timeouts, cancellation and cleanup when either fails or the game screen closes. Gameplay starts after both are ready. Retry creates fresh resources.

`character-models.ts` reads the real Blender skin weights, correctly applies quantized inverse-bind transforms, then instances the resulting meshes. The vertex shader articulates arms, legs and held accessories; it also drives matching shadow poses. Each archetype has a shared high-detail and distant batch. At most 24 people use the detailed model, or 12 with Low graphics; the remaining visible actors use the simpler mesh. Both levels preserve identity, outfit and accessories. The original 1,542 identities, homes, crossing paths, avoidance, reactions and subtitle logic remain in the existing simulation.

Sachin's seated mesh fits the existing auto's seat, handlebar, footboard and canopy. First-person mode hides his body and shows the matching hand assets. Intro skipping, camera changes and scene disposal use the same engine lifecycle as before.

For interactive review, start `npm run dev -- --port 4176` and open `http://localhost:4176/tests/browser/fixtures/cast.html`. The development-only viewer loads the shipped compressed GLB with the same material and animation code as the game. It supports every character, walking, distant models and the seated driver. It is not a production game route.

`npm test` validates the actual shipped GLB's twenty characters, dimensions, articulation data, level-of-detail bounds, cabin fit, manifest hash and crowd limits. Browser checks cover the existing intro, cameras, movement, collisions, loading/retry and mobile flows.

## Provenance

Original project models and original procedurally painted textures. Authored using Blender's mesh, armature and glTF tools with the scripts in `scripts/characters/`. The source concept boards are the project's previously generated artwork. No third-party character meshes, external clothing textures, voices or likeness assets were imported.
