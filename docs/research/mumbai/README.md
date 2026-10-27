# Mumbai map reference

Fetched on 25 October 2026: [DataMeet Mumbai municipal ward map](https://github.com/datameet/Municipal_Spatial_Data/blob/master/Mumbai/BMC_Wards.geojson). The exact source revision and downloaded-file checksum are recorded in [source.json](source.json).

[View the South Mumbai reference map](municipal-reference.svg).

The downloaded data contains 24 municipal ward polygons, not a street graph. It supplies geographic context for the peninsula/coastal setting. The attempted live Overpass street query was blocked by the environment's network proxy (403). No live street-map request or map API is required by the deployed game.

The game's connected streets are independently authored and compressed: Marine Drive on the west coast, inland Churchgate/Fort and a station district, with Colaba and a Gateway-inspired waterfront to the south/east. Names and landmark relationships are thematic references; road geometry, intersections, distances, and traffic cycles are fictional gameplay arrangements. This is not a geographically accurate navigation map or a reconstruction of fetched street geometry.

## Attribution and license

Municipal dataset: DataMeet Trust, Pune chapter, shared under [Creative Commons Attribution-ShareAlike 2.5 India](https://creativecommons.org/licenses/by-sa/2.5/in/). Source license: [Mumbai README](https://github.com/datameet/Municipal_Spatial_Data/blob/master/Mumbai/Readme.md).

`municipal-reference.svg` is a derived reference illustration: polygons were projected into an SVG viewport, cropped to South Mumbai, and styled with land/water colours and an attribution footer. This illustration is shared under the same CC BY-SA 2.5 India license. The municipal polygons are not bundled into the runtime game.

## Branded full-Mumbai map

The [BR map PNG](br-mumbai-map.png) and [vector SVG](br-mumbai-map.svg) show all 24 municipal ward polygons from the same pinned DataMeet revision, projected in Web Mercator and styled with the landing page's BR identity. Ward labels are source codes. The [GeoJSON snapshot](BMC_Wards.geojson) and [download/checksum record](branding-map-source.json) are checked in for reproducibility. The re-download on 27 October 2026 matches the earlier SHA-256 exactly. This is the dataset's geographic snapshot, not a claim that its ward boundaries are administratively current in 2026.

Derived map illustration and source data: **CC BY-SA 2.5 India**, attribution **DataMeet Trust, Pune chapter**. Modifications: projection, cropping to the full municipal extent, ward colours/labels, BR layout and attribution footer. No road geometry has been invented or presented as fetched map data. Rebuild with `python scripts/build_brand_assets.py` followed by `node scripts/render-brand-assets.mjs`.
