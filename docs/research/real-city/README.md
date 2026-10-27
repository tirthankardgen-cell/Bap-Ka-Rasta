# Real Mumbai for Bap ka Rasta: sources, realism, and import options

Research checked on **27 October 2026** using visible Google Chrome, public primary documentation, product pages, and the current game source. The main target is the existing **Three.js browser game**. Roblox is an optional destination for the same owned or appropriately licensed assets.

[Curated Mumbai plan and real-building references](curated-mumbai.md) · [Tested free process](free-process.md) · [Browser implementation plan](browser-plan.md) · [Source and verification index](sources.json)

## Recommendation

Build a **curated, compact Mumbai**, using actual famous buildings, reference-based chawls/shopfronts and selected real road shapes arranged around the existing game's connected layout. The user's updated direction is to preserve the current map's driving feel and replace generic buildings, rather than reproduce the whole city's geography. The [curated plan and catalog](curated-mumbai.md) now lead the recommendation.

Use OpenStreetMap/Overture selectively for footprints, road shapes and proportions. Model the actual façades in Blender from free licensed references, export spatially divided GLB files, and progressively load them in the existing Three.js engine. The Churchgate extract below remains a useful technical test.

The **free pipeline has now been tested**: a bounded OSM/Overture crop, Blender 3.5.1 export, and a Chrome preview that loads nearby tiles and a forward corridor. See [the runnable process](free-process.md) for measured results and commands. The current geometry uses generic materials and mostly estimated heights.

For higher fidelity, detail route-facing buildings from your own/licensed references, or obtain a licensed textured survey/reality mesh. Large survey datasets should use **3D Tiles**, which the open-source `3d-tiles-renderer` package can render inside Three.js. Keep a separate stable road graph and collision representation for gameplay.

**Research did not establish a freely downloadable, complete, photorealistic Mumbai city that is both ready for ground-level driving and licensed for redistribution in this game.** There are real map datasets, prebuilt GIS city meshes, commercial digital-twin services, and photorealistic map-streaming APIs. These solve different parts of the problem.

Do not build the browser environment around a Roblox map conversion. A common Blender/geospatial source gives control of scale, geometry, materials, distribution rights, and browser performance. Export to Roblox later if useful.

## What “actual and realistic” requires

| Layer | What makes it accurate | What the usual map download supplies |
| --- | --- | --- |
| Geography | Actual road alignments, coastline, blocks and distances | OSM and other geographic datasets provide a useful base |
| Building shape | Correct footprints, setbacks, roofs and measured heights | Footprints are common; heights and roofs vary in completeness |
| Appearance | The particular building's windows, balconies, signs and wall textures | OSM does not provide photographed façades; generic texturing is an approximation |
| Street detail | Correct pavements, dividers, poles, stalls and entrances | Some tagged features exist; much requires reference and modelling |
| Driving | Continuous surfaces, valid intersections, lane directions and collisions | A visible mesh is not a functioning traffic network or collision system |

Extruding an accurate footprint with an estimated height and a generic material creates an approximate version of a real building. It does not produce an exact visual replica. Keep measured, inferred and manually authored properties identifiable.

The current repository uses authored Mumbai-inspired roads and procedural buildings. `src/game/network.ts` explicitly says it is not a street-map export; the existing DataMeet download contains municipal **ward boundaries**, not street or building detail. The proposed work is a new data and asset pipeline, not a claim that the existing map already represents real Mumbai.

## Where to obtain the map and environment

Prices below are observations from this research, not purchase quotations. Product contents, account requirements and prices can change.

| Source | What you get | Cost observed | Browser suitability | Recommendation |
| --- | --- | --- | --- | --- |
| [OpenStreetMap](https://www.openstreetmap.org/) / [Geofabrik India](https://download.geofabrik.de/asia/india.html) | Real road geometry, names, building footprints and available tags | Data is free under ODbL | Excellent input for an offline preparation pipeline | Primary geographic base |
| [Overture buildings](https://docs.overturemaps.org/guides/buildings/) | Global building/roof footprints, available heights and building parts | Free open data; buildings theme uses ODbL | Useful supplementary input; crop by district | Compare against OSM; resolve duplicates |
| [CADmapper](https://cadmapper.com/) | Free whole-city 2D road/water DXF; custom areas with available data | Whole-city files free; custom areas up to 1 km² free with account | Good layout reference; needs conversion for gameplay | Easy starting point, not a finished 3D city |
| [Blosm base](https://prochitecture.gumroad.com/l/blender-osm) | Blender importer for OSM buildings, roads, terrain and other geometry | Base version can be obtained free | Good preparation tool, followed by GLB export | Start here for a GUI workflow |
| [Blosm Pro](https://prochitecture.gumroad.com/l/blosm) | Adds default textured façades, UVs, trees and other features | ₹1,889.99 displayed for solo/hobby | Saves preparation effort; material baking/export still requires validation | Useful convenience purchase after a free pilot |
| [OSM2World](https://osm2world.org/) | Generates 3D OSM scenes with materials, supported road details and LOD | Open-source tool; data and asset licenses still apply | Exports glTF/GLB and OBJ; suitable for automated builds | Strong free alternative to trial alongside Blosm |
| [BlenderGIS](https://github.com/domlysz/BlenderGIS) | GIS bridge for geographic files, projections and elevation workflows | Open-source | Useful where projection and custom datasets matter | Supporting tool, not instant photorealism |
| [CityArt Mumbai model on CGTrader](https://www.cgtrader.com/3d-models/exterior/cityscape/mumbai-india-50km) | Prebuilt GIS city; advertised 8 km downtown / 50 km full-city variants | $49.50 sale, $99 regular displayed | Heavy source asset needing crop, material work and optimization | Obtain a street-level/export sample before buying |
| [Jinda Mumbai urban model](https://sketchfab.com/3d-models/mumbai-india-city-and-urban-35661ddb268347c1b2f95f0caf3d9e8a) | Blender/OSM urban model; viewer reports 2.5 million triangles | Purchase/download redirects to Fab; price not verified | Potential preparation shortcut; crop and optimize | Candidate, not a verified photorealistic/game-ready city |
| [Genesys 3D Digital Twin](https://www.igenesys.com/3d-digital-twin) | Commercial reality modelling / engineering-grade geospatial services | No public game-use quotation established | Potential source of actual textured geometry if the relevant district and rights are available | Best avenue to investigate for higher-budget survey fidelity |
| [Google Photorealistic 3D Tiles](https://developers.google.com/maps/documentation/tile/3d-tiles) | Streamed aerial imagery textured onto 3D mesh where covered | Metered API; billing account and key required | Technically renderable through CesiumJS or a compatible Three.js renderer | Conditional visualization option; Mumbai coverage and game-use terms need confirmation |
| [Roblox WorldLoader](https://create.roblox.com/store/asset/76005743851966/WorldLoader-Import-Real-life-places) | Generates an OSM-derived world directly in Studio | Store displayed “Get Plugin”; no numeric price shown | Roblox-specific output; additional work for browser assets | Optional Roblox prototype path |

### The particularly useful free Mumbai download

CADmapper explicitly lists **Mumbai** among its free whole-city downloads. Its whole-city files are described as **simplified two-dimensional DXF road networks**, including three road levels and bodies of water. They do not contain a textured, driveable 3D Mumbai.

The public [Mumbai ZIP](https://cityfiles.cadmapper.com/cityfiles/mumbai.zip) returned HTTP 200 during this research, with an advertised size of **3,485,231 bytes**, approximately 3.49 MB. The archive was not imported or validated as game geometry. Use it as an easy geographic layout source; OSM data is more useful when lane/one-way tags and stable feature IDs are needed.

### What Blosm actually does

The [maintainer's repository](https://github.com/vvoovv/blosm) says the free version imports **untextured** OSM buildings, uses building height/floor tags when present, supports roof shapes, and represents roads/railways with profiled Blender curves. Its terrain source is approximately **30 m resolution**: useful for broad terrain, insufficient for kerbs or detailed road grading.

Pro adds generic tileable building textures and UV mapping. Its own purchase page states:

> “the addon does not provide real textures for each imported building”

It also describes texture export as experimental. Blender materials and geometry nodes therefore need to be baked/applied into exportable meshes and standard materials before judging browser or Roblox appearance. Generic Pro façades cannot substantiate a claim that every Mumbai building looks exactly like its real counterpart.

### What the purchasable Mumbai models actually contain

The CityArt CGTrader page was opened successfully in Chrome. Its description states:

- GIS data from **2022**, with advertised downtown and full-city variants.
- **Flat surface, no elevation**.
- Satellite texture setup and several effects are specific to the native **Cinema 4D** file.
- Listed exchange formats include OBJ and FBX; the native files were listed at **550 MB**.
- Its descriptive text mentions **5 million+ polygons in big cities**; the structured “1 polygon / 1 vertex” field is inconsistent and should not be treated as an actual mesh budget.
- Some cities in the seller's collection use AI-generated building shapes that may vary from their originals. The page does not establish which individual Mumbai buildings this affects.

This may save layout work. It does not prove detailed ground-level façades, correct road elevations, functioning collisions or mobile performance. The correct evaluation is a sample of the exact district in the **FBX/OBJ export**, not only a native-software aerial render.

Jinda's [urban](https://sketchfab.com/3d-models/mumbai-india-city-and-urban-35661ddb268347c1b2f95f0caf3d9e8a) and [mass-building](https://sketchfab.com/3d-models/mumbai-india-city-and-mass-buildings-2dd627352e3b44ce9513ad0e41fba957) pages identify Blender and OSM as their source and report approximately **2.5M** and **1.1M triangles** respectively. The pages link to [urban on Fab](https://www.fab.com/listings/886cd7fb-79f7-425b-8146-ce875c396448) and [mass buildings on Fab](https://www.fab.com/listings/93b2c56d-ce1a-4fb1-a37b-0172c789b7e3). No purchase, native-file inspection, or final Fab price/license validation was performed.

Search also surfaced [TurboCG's 50 km Mumbai on 3DOcean](https://3docean.net/item/mumbai-city-3d-model-50km/28619372) and an [ArtStation Mumbai city model](https://www.artstation.com/marketplace/p/50Dwx/mumbai-3d-city-model). Their product pages were access-restricted during checking. They remain leads; search snippets are insufficient to endorse their contents, price or rights.

### Highest fidelity: licensed reality mesh or detailed reconstruction

For actual façades and roof shapes across many buildings, the suitable source is a **textured reality mesh**, photogrammetry survey, street/aerial imagery with explicit derivative rights, or accurately modelled building assets. LiDAR alone primarily supplies geometry, not complete wall photography. A city-scale digital twin service also does not automatically provide a downloadable game license.

Genesys's primary product page establishes that it offers engineering-grade 3D digital-twin/reality-modelling services. Research did **not** establish a public Mumbai download, its district-level availability, a final delivered survey date, or permission to redistribute it in a consumer browser game. Treat it as a commercial data/service lead.

A useful vendor request would specify the target district and ask for: a 100–200 m street sample, capture date, textured building/road mesh, GLB/3D Tiles or conversion rights, geographic coordinate system, LODs, file sizes, commercial browser-game distribution, allowed hosting/cache, and any additional rights needed for a later Roblox upload. No vendors were contacted.

For an indie budget, use the geographic base and accurately reconstruct the buildings seen most often. Spend detail on the actual street façades and landmarks along the player's route; retain coarse but geographically positioned geometry for the skyline and distant blocks.

### Actual Mumbai landmark examples

These examples show the difference between an actual captured structure, a detailed reconstruction and a lightweight interpretation. They are useful for a later Colaba/Gateway extension; these locations are outside the suggested Churchgate pilot.

| Example checked | What the primary page establishes | Use in this game |
| --- | --- | --- |
| [CyArk: Gateway of India scan](https://sketchfab.com/3d-models/gateway-of-india-mumbai-38a652e9f3bf49039026ef65ef61ac92) | Actual LiDAR + DSLR/drone photogrammetry captured in February 2019; viewer reports 1.5M triangles | Strong fidelity reference. No downloadable commercial game-use license was established; obtain appropriate source rights before reuse. |
| [Akshat: Taj Hotel model](https://sketchfab.com/3d-models/taj-hotel-3d-model-iconic-indian-landmark-d57b30000d494bbf93f9b9ab1379f32f) | Detailed model/texturing project made for a client in 2023; viewer reports 9.4M triangles | Candidate for a licensed, heavily optimized reconstruction; neither downloadable source nor game-use permission was established. |
| [RakeshCreates: low-poly Gateway](https://sketchfab.com/3d-models/gateway-of-india-stylized-low-poly-3d-model-acb12c35de1f42e8a2c4f7fa73102992) | Downloadable, 6.5k triangles, explicitly stylized, **CC Attribution-NonCommercial** | Lightweight example, but its current noncommercial license is unsuitable for commercial use without separate permission. It is not an exact photorealistic scan. |

The CyArk scan establishes that high-fidelity data exists for at least one real Mumbai monument. It does not establish full-city coverage or permission to extract the viewer's asset.

## Google 3D imagery: useful technology, conditional fit

Google's API supplies a textured 3D mesh where it has coverage. [CesiumJS](https://cesium.com/learn/cesiumjs-learn/cesiumjs-photorealistic-3d-tiles/) demonstrates browser streaming, and the [Three.js 3D Tiles renderer](https://github.com/NASA-AMMOS/3DTilesRendererJS) includes a Google provider example.

**Mumbai photorealistic coverage was not independently verified with a live tileset.** Google's [coverage table](https://developers.google.com/maps/coverage) groups “Map Tiles 2D / 3D” together and gives India a positive marker in that combined column, while “Maps JavaScript 3D” has a dash. This does not establish detailed photorealistic tiles for the intended Mumbai streets. Street View availability, satellite imagery and an aerial 3D reality mesh are different products. Google search AI summaries were used only to discover sources, not to establish coverage.

The API requires billing and attribution. Current published [global pricing](https://developers.google.com/maps/billing-and-pricing/pricing) lists a 1,000-event free usage cap and $6 per 1,000 events in the first paid tier for Photorealistic 3D Tiles; the [India pricing table](https://developers.google.com/maps/billing-and-pricing/pricing-india) lists 7,000 and $3.30 respectively for eligible India pricing. Pricing eligibility and billable-event definitions matter: do not assume game players equal billing events. Root tileset requests establish sessions, and repeat requests can add cost. Do not rely on older tutorials describing a perpetual $200 monthly credit.

Google's [Map Tiles policies](https://developers.google.com/maps/documentation/tile/policies) restrict unauthorized prefetching, caching, extraction and offline storage. Its [terms](https://cloud.google.com/maps-platform/terms) also restrict scraping and creating content from Google Maps content. **A Blender importer or paid API key does not grant permission to extract Google city meshes and ship them as your own GLB or Roblox assets.** A Google streaming route requires separate review of the actual intended gameplay, audience and overlays under the applicable terms. It is not the default recommendation for this game's owned, static asset pipeline.

## Licensing that changes the implementation choice

| Material | Practical consequence |
| --- | --- |
| OSM / Overture buildings | Retain feature provenance and [OSM attribution](https://www.openstreetmap.org/copyright). If publishing an adapted database, ODbL obligations can apply. A game render and a distributable geographic database need distinct consideration; this does not automatically require licensing unrelated game code under ODbL. |
| CADmapper output | Preserve the underlying data attribution and review the downloaded file's notices. “Free download” does not cancel source-data terms. |
| Blender/OSM2World tool code | A tool's software license and the resulting data/assets' licenses are separate. Preserve notices for bundled materials and third-party textures. |
| [Poly Haven](https://polyhaven.com/license) | CC0 materials are useful for general asphalt, stone, concrete and other surfaces. They do not supply the actual photograph of a specific Mumbai façade. |
| Purchased city/landmark assets | Confirm the exact license permits consumer game use, modification, browser delivery and any Roblox upload. “Royalty free” is not a blanket right to redistribute source files. |
| Public browser repository | Ordinary models placed in `public/` become directly downloadable. Some stock licenses require incorporation and restrict standalone access; obtain an appropriate license or choose open/owned assets. |
| Existing Roblox experiences | Visiting a game does not provide its map files or reuse rights. Use creator-supplied licensed source assets or obtain permission; do not plan around ripping an experience. |

The [CGTrader terms](https://www.cgtrader.com/pages/terms-and-conditions) define incorporated products and include conditions for game distribution; the [Sketchfab license summary](https://sketchfab.com/licenses) prohibits standalone model access under its stock license. Apply the actual purchased license, including custom provisions. Attribution alone is insufficient where the underlying license does not allow the intended distribution.

## If a Roblox version is wanted later

Use the same metre-based source scene, with a **separate Roblox export preset**. The [current Studio importer](https://create.roblox.com/docs/studio/importer) supports FBX, OBJ, glTF and documents GLB import hierarchy. It is accessed from **File → Import**; older tutorials may show older tab/menu locations.

1. Crop the district and divide it into buildings or spatial blocks. Apply curves/modifiers and bake exportable materials in Blender.
2. Keep each mesh within the [current 20,000-triangle limit](https://create.roblox.com/docs/art/modeling/specifications). This is per mesh, not the whole city. Avoid merging the entire district into one MeshPart.
3. Export uncompressed compatible FBX/glTF/GLB for Studio. Browser-specific KTX2/Meshopt files should have a separate ordinary texture/mesh export for Roblox; do not assume extension support is identical.
4. Set the importer unit to match the metre-based scene. Roblox's [standard conversion](https://create.roblox.com/docs/physics/units) is **1 stud = 0.28 m**, or **1 m ≈ 3.571 studs**. A 10 m test object should measure approximately 35.71 studs. Avoid applying the conversion twice.
5. Enable **Anchored** for static scenery; inspect pivots, scale and alignment in the preview.
6. Use [SurfaceAppearance/PBR](https://create.roblox.com/docs/art/modeling/surface-appearance). Budget common textures at 512–1024 px and reserve higher resolutions for close landmarks. The texture documentation supports up to 4K but contains a conflicting older UV-section 1024 statement; validate the actual asset/import path rather than treating every texture type as interchangeable.
7. Build simple road, wall and building collision proxies. Roblox's [collision-fidelity options](https://create.roblox.com/docs/workspace/collisions) trade precision against cost; precise convex decomposition is still not a perfect visual-mesh collision.
8. Enable [instance streaming](https://create.roblox.com/docs/workspace/streaming) in Workspace properties. Keep the target radius larger than the minimum radius, allow scenery to stream, and validate driving into newly loaded areas.
9. Ensure the experience has permission to use restricted mesh/image assets. Import into the intended creator/group and follow [asset privacy](https://create.roblox.com/docs/projects/assets/privacy) requirements.

WorldLoader is the quickest Roblox-only experiment: its [documentation](https://devforum.roblox.com/t/worldloader-plugin-documentation/3187419) describes selecting an area Part, entering geographic coordinates, downloading and generating OSM features. It gives a **2048 × 2048 stud** selection-Part limit, about **573 × 573 m** at standard scale, and describes adjoining imports using the same coordinates while moving the Part. This is the plugin's documented workflow, not a general Roblox city-size limit.

The Store page listed an update on **3 May 2026**, but its reviews and the [forum thread](https://devforum.roblox.com/t/worldloader-plugin-import-real-life-places-into-studio/3190878) contain download/connection and water-feature complaints. It was not installed or tested. Its output remains OSM-derived geometry, not photographed façades or ready traffic AI.

## Research verification and limits

- Opened Google searches and primary pages in **visible Chrome**, including Blosm Pro, Roblox import documentation, WorldLoader's Store/forum, and the CityArt Mumbai product.
- Checked public documentation for OSM, Overture, CADmapper, OSM2World, Blender, Three.js loaders/3D Tiles, Google policies/pricing, asset licenses and Roblox constraints. Recorded URLs, responses, evidence and unsuccessful checks in [sources.json](sources.json).
- Verified that the public CADmapper Mumbai ZIP is available. Did not claim to have imported it.
- Initial Overpass attempts failed. The bounded direct OSM map API subsequently worked, and Overture release `2026-10-21.0` downloaded successfully. The combined crop produced 197 building polygon pieces, 216 road/path ways and 80 GLB tiles. See [the free-process guide](free-process.md) for source quality and measured loading results.
- Created an editable Blender source, exported and inspected its geometry in Chrome, and verified partial loading, reversal, eviction and cancellation. The prototype is separate from production gameplay.
- No paid files were bought, no plugin was installed, and no billing/API account was created. Photorealistic Mumbai tiles and Roblox import remain untested.

The research and free preparation/streaming demonstration are complete. Detailed façades, production road/collision integration and device profiling are the next stages. See the [free process](free-process.md) and [browser plan](browser-plan.md).
