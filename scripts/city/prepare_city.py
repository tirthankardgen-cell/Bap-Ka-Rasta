"""Convert a small real OSM district into reproducible Blender input tiles.

Geometry is real footprint/road data. Heights and widths retain explicit
provenance; generic materials are a prototype, not photographed facades.
"""
import argparse
import collections
import datetime
import hashlib
import json
import math
from pathlib import Path
import re
import xml.etree.ElementTree as ET

from pyproj import Transformer
import requests
from shapely import constrained_delaunay_triangles, transform as transform_geometry
from shapely.geometry import LineString, Polygon, box, shape
from shapely.ops import split, unary_union
from shapely.validation import make_valid

DEFAULT_BBOX = (72.819, 18.930, 72.829, 18.937)
WIDTHS = {"primary": 20, "secondary": 14, "tertiary": 10, "residential": 8,
          "service": 5, "footway": 2.2, "pedestrian": 5, "path": 2.2}
COLORS = {"building": "#cabca1", "road": "#414548", "footway": "#aaa49b",
          "park": "#91a277", "water": "#649597", "ground": "#c5bfac"}


def number(value):
    match = re.match(r"^\s*(\d+(?:\.\d+)?)", str(value or ""))
    return float(match.group(1)) * (0.3048 if re.search(r"ft|feet|'", str(value)) else 1) if match else None


def polygons(geometry):
    if geometry.is_empty:
        return []
    if geometry.geom_type == "Polygon":
        return [geometry]
    return [p for child in getattr(geometry, "geoms", []) for p in polygons(child)]


def solid(polygon, bottom, height):
    """Watertight polygon extrusion in Three.js X/Y-up/Z coordinates."""
    vertices, faces, lookup = [], [], {}

    def vertex(x, z, y):
        key = (round(x, 3), round(y, 3), round(z, 3))
        if key not in lookup:
            lookup[key] = len(vertices)
            vertices.append(list(key))
        return lookup[key]

    # Constrained triangulation preserves every concave boundary and courtyard.
    # Filtering unconstrained Delaunay triangles can leave holes in these faces.
    for triangle in constrained_delaunay_triangles(polygon).geoms:
        coords = list(triangle.exterior.coords)[:3]
        base = [vertex(x, z, bottom) for x, z in coords]
        top = [vertex(x, z, bottom + height) for x, z in coords]
        faces.extend([base, top[::-1]])
    for ring in [polygon.exterior, *polygon.interiors]:
        coords = list(ring.coords)
        for (x1, z1), (x2, z2) in zip(coords, coords[1:]):
            faces.append([vertex(x1, z1, bottom), vertex(x2, z2, bottom),
                          vertex(x2, z2, bottom + height), vertex(x1, z1, bottom + height)])
    return vertices, faces


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--bbox", default=",".join(map(str, DEFAULT_BBOX)))
    parser.add_argument("--osm", help="Existing OSM XML, or fetch the bounded map API")
    parser.add_argument("--overture", help="Optional bounded Overture GeoJSON")
    parser.add_argument("--output", default="output/playwright/free-city/prepared")
    parser.add_argument("--tile-size", type=float, default=125)
    args = parser.parse_args()
    west, south, east, north = tuple(map(float, args.bbox.split(",")))
    if not (-180 <= west < east <= 180 and -85 < south < north < 85):
        raise ValueError("Invalid west,south,east,north bbox")
    if (east - west) * (north - south) > 0.0025:
        raise ValueError("Use a small district, at most 0.0025 square degrees")
    if not 50 <= args.tile_size <= 250:
        raise ValueError("Tile size must be between 50 and 250 metres")
    output = Path(args.output)
    output.mkdir(parents=True, exist_ok=True)
    source_url = f"https://api.openstreetmap.org/api/0.6/map?bbox={west},{south},{east},{north}"
    if args.osm:
        raw = Path(args.osm).read_bytes()
    else:
        response = requests.get(source_url, timeout=45, headers={"User-Agent": "BapKaRastaMapPreparation/1.0 (+https://github.com/tirthankardgen-cell/Bap-Ka-Rasta)"})
        response.raise_for_status()
        raw = response.content
    (output / "source.osm").write_bytes(raw)
    root = ET.fromstring(raw)
    if root.tag != "osm":
        raise ValueError("Expected an OSM XML document")
    origin_lon, origin_lat = (west + east) / 2, (south + north) / 2
    zone = math.floor((origin_lon + 180) / 6) + 1
    epsg = (32600 if origin_lat >= 0 else 32700) + zone
    project = Transformer.from_crs(4326, epsg, always_xy=True)
    origin_e, origin_n = project.transform(origin_lon, origin_lat)

    def local(lon, lat):
        e, n = project.transform(lon, lat)
        return e - origin_e, -(n - origin_n)

    corners = [local(lon, lat) for lon, lat in [(west, south), (east, south), (east, north), (west, north)]]
    region = Polygon(corners)
    bounds = region.bounds
    nodes = {n.attrib["id"]: local(float(n.attrib["lon"]), float(n.attrib["lat"])) for n in root.findall("node")}
    ways = {w.attrib["id"]: {"refs": [nd.attrib["ref"] for nd in w.findall("nd")], "tags": {t.attrib["k"]: t.attrib["v"] for t in w.findall("tag")}} for w in root.findall("way")}
    tiles, buildings, roads, warnings = {}, [], [], []

    def tile_at(x, z):
        return f"{math.floor(x / args.tile_size)}_{math.floor(z / args.tile_size)}"

    def append_polygon(geometry, feature_id, kind, bottom, height, details, split=False):
        geometry = make_valid(geometry).intersection(region)
        for part_index, polygon in enumerate(polygons(geometry)):
            if polygon.area < 0.15:
                continue
            pieces = [(tile_at(polygon.centroid.x, polygon.centroid.y), polygon)]
            if split:
                minx, minz, maxx, maxz = polygon.bounds
                pieces = []
                for tx in range(math.floor(minx / args.tile_size), math.floor(maxx / args.tile_size) + 1):
                    for tz in range(math.floor(minz / args.tile_size), math.floor(maxz / args.tile_size) + 1):
                        cell = box(tx * args.tile_size, tz * args.tile_size, (tx + 1) * args.tile_size, (tz + 1) * args.tile_size)
                        pieces.extend((f"{tx}_{tz}", p) for p in polygons(polygon.intersection(cell)) if p.area > 0.15)
            for tile_id, piece in pieces:
                vertices, faces = solid(piece, bottom, height)
                if not faces:
                    continue
                tiles.setdefault(tile_id, {"id": tile_id, "meshes": []})["meshes"].append({"id": f"{feature_id}:{part_index}", "kind": kind, "color": COLORS[kind], "vertices": vertices, "faces": faces, "properties": details})

    def building(geometry, feature_id, tags, data_source):
        for polygon in polygons(make_valid(geometry).intersection(region)):
            if polygon.area < 4:
                continue
            value = number(tags.get("height"))
            floors = number(tags.get("building:levels") or tags.get("num_floors"))
            height = value or ((floors * 3.2) if floors else 15.0)
            if not 1 <= height <= 500:
                warnings.append(f"Invalid height for {feature_id}; using 15m fallback")
                height, value, floors = 15, None, None
            item = {"id": feature_id, "name": tags.get("name"), "source": data_source,
                    "height": round(height, 2), "heightKind": "source_height" if value else "floor_estimate" if floors else "default_estimate",
                    "heightData": value, "levels": floors, "footprint": [[round(x, 3), round(z, 3)] for x, z in polygon.exterior.coords],
                    "sourceRecords": tags.get("sources", []) if data_source == "Overture Maps" else [],
                    "geometry": polygon}
            buildings.append(item)

    relation_members = set()
    for relation in root.findall("relation"):
        tags = {t.attrib["k"]: t.attrib["v"] for t in relation.findall("tag")}
        if "building" not in tags or tags.get("type") != "multipolygon":
            continue
        outers, inners = [], []
        refs = []
        for member in relation.findall("member"):
            way = ways.get(member.attrib.get("ref"))
            if member.attrib.get("type") != "way" or not way:
                continue
            points = [nodes[ref] for ref in way["refs"] if ref in nodes]
            if len(points) >= 4 and points[0] == points[-1]:
                (inners if member.attrib.get("role") == "inner" else outers).append(Polygon(points))
                refs.append(member.attrib["ref"])
        if outers:
            geometry = unary_union(outers).difference(unary_union(inners))
            building(geometry, "osm:relation:" + relation.attrib["id"], tags, "OpenStreetMap")
            relation_members.update(refs)

    for way_id, way in ways.items():
        tags, refs = way["tags"], way["refs"]
        if any(ref not in nodes for ref in refs):
            warnings.append(f"Incomplete way {way_id}")
            continue
        points = [nodes[ref] for ref in refs]
        if "building" in tags and way_id not in relation_members and len(points) >= 4 and points[0] == points[-1]:
            building(Polygon(points), "osm:way:" + way_id, tags, "OpenStreetMap")
        if "highway" in tags and len(points) >= 2:
            classification = tags["highway"]
            if classification not in WIDTHS and not classification.endswith("_link"):
                continue
            lanes = number(tags.get("lanes"))
            tagged_width = number(tags.get("width"))
            width = tagged_width or (lanes * 3.2 + 0.7 if lanes else WIDTHS.get(classification.replace("_link", ""), 7))
            width = min(max(width, 1), 50)
            road = {"id": "osm:way:" + way_id, "name": tags.get("name"), "class": classification,
                    "width": round(width, 2), "widthKind": "source_width" if tagged_width else "lane_estimate" if lanes else "class_estimate",
                    "nodeIds": refs, "coordinates": [[round(x, 3), round(z, 3)] for x, z in points],
                    "tags": {key: tags[key] for key in ["highway", "oneway", "lanes", "width", "bridge", "tunnel", "layer", "access", "junction"] if key in tags}}
            line = LineString(points)
            if not line.intersects(region):
                continue
            roads.append(road)
            kind = "footway" if classification in ["footway", "path", "pedestrian"] else "road"
            append_polygon(line.buffer(width / 2, cap_style=2, join_style=2), road["id"], kind, 0.01 if kind == "road" else 0.10, 0.07, road, split=True)
        if len(points) >= 4 and points[0] == points[-1] and "building" not in tags:
            kind = "water" if tags.get("natural") == "water" or "water" in tags else "park" if tags.get("leisure") in ["park", "pitch", "garden"] else None
            if kind:
                append_polygon(Polygon(points), "osm:way:" + way_id, kind, -0.03, 0.03, {"name": tags.get("name")}, split=True)

    overture_added, overture_duplicates = 0, 0
    if args.overture:
        features = json.loads(Path(args.overture).read_text(encoding="utf-8"))["features"]
        existing = [item["geometry"] for item in buildings]
        for feature in features:
            if not feature.get("geometry"):
                continue
            geometry = transform_geometry(shape(feature["geometry"]), local, interleaved=False)
            for polygon in polygons(make_valid(geometry).intersection(region)):
                if polygon.area < 4:
                    continue
                if any(polygon.intersection(other).area / min(polygon.area, other.area) > 0.5 for other in existing if polygon.intersects(other)):
                    overture_duplicates += 1
                    continue
                tags = feature.get("properties", {})
                name = tags.get("names", {}).get("primary") if isinstance(tags.get("names"), dict) else None
                building(polygon, "overture:" + str(feature.get("id") or tags.get("id")), {**tags, "name": name}, "Overture Maps")
                existing.append(polygon)
                overture_added += 1

    for item in buildings:
        details = {key: value for key, value in item.items() if key != "geometry"}
        append_polygon(item["geometry"], item["id"], "building", 0, item["height"], details)
        item.pop("geometry")

    # This Mumbai pilot has the sea west of the mapped coastline. Split the
    # crop by the actual coastline; retain this regional assumption explicitly.
    coastlines = [LineString([nodes[ref] for ref in w["refs"]]) for w in ways.values()
                  if w["tags"].get("natural") == "coastline" and len(w["refs"]) >= 2 and all(ref in nodes for ref in w["refs"])]
    surface_parts = [region]
    for coast in coastlines:
        surface_parts = [p for surface in surface_parts for p in polygons(split(surface, coast))]
    for index, surface in enumerate(surface_parts):
        marker = surface.representative_point()
        closest = min(coastlines, key=lambda c: c.distance(marker)) if coastlines else None
        kind = "water" if closest and marker.x < closest.interpolate(closest.project(marker)).x else "ground"
        append_polygon(surface, f"surface:{index}", kind, -0.14, 0.10, {"source": "OSM coastline; Mumbai sea-west classification"}, split=True)

    tile_dir = output / "tiles-input"
    tile_dir.mkdir(exist_ok=True)
    for tile_id, tile in tiles.items():
        coords = [v for mesh in tile["meshes"] for v in mesh["vertices"]]
        tile["bounds"] = [min(v[0] for v in coords), min(v[2] for v in coords), max(v[0] for v in coords), max(v[2] for v in coords)]
        (tile_dir / (tile_id + ".json")).write_text(json.dumps(tile, separators=(",", ":")), encoding="utf-8")
    overture_source = None
    if args.overture:
        source_path = Path(args.overture)
        sidecar = source_path.with_suffix(".source.json")
        overture_source = json.loads(sidecar.read_text()) if sidecar.exists() else {}
        overture_source["sha256"] = hashlib.sha256(source_path.read_bytes()).hexdigest()
    manifest = {"version": 1, "name": "Churchgate / Marine Drive real map pilot", "units": "metres", "axes": {"east": "+X", "north": "-Z", "up": "+Y"},
                "origin": {"longitude": origin_lon, "latitude": origin_lat, "epsg": epsg, "easting": origin_e, "northing": origin_n},
                "bbox": [west, south, east, north], "bounds": bounds, "tileSize": args.tile_size,
                "tiles": [{"id": t["id"], "bounds": t["bounds"], "input": f"tiles-input/{t['id']}.json"} for t in tiles.values()],
                "credits": "© OpenStreetMap contributors; Overture Maps Foundation when used. ODbL-1.0. Heights/widths include marked estimates; generic untextured prototype meshes.",
                "source": {"url": source_url, "sha256": hashlib.sha256(raw).hexdigest(), "preparedAtUtc": datetime.datetime.now(datetime.timezone.utc).isoformat(), "overture": overture_source},
                "stats": {"rawNodes": len(nodes), "rawWays": len(ways), "rawBuildingWays": sum("building" in w["tags"] for w in ways.values()), "buildings": len(buildings),
                          "uniqueBuildingIds": len({b["id"] for b in buildings}), "heightKinds": dict(collections.Counter(b["heightKind"] for b in buildings)), "roadAndPathWays": len(roads), "overtureAdded": overture_added, "overtureDuplicates": overture_duplicates, "tiles": len(tiles), "coastlineWays": len(coastlines)},
                "warnings": warnings}
    (output / "prepared.json").write_text(json.dumps(manifest, indent=2), encoding="utf-8")
    (output / "buildings.json").write_text(json.dumps(buildings, separators=(",", ":")), encoding="utf-8")
    (output / "roads.json").write_text(json.dumps(roads, separators=(",", ":")), encoding="utf-8")
    print(json.dumps(manifest["stats"], indent=2))
    print(f"Prepared {output.resolve()}")


if __name__ == "__main__":
    main()
