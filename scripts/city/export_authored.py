"""Export a manually detailed scenery .blend into spatial GLB chunks.

Run in fresh background Blender. Parent each building to an Empty carrying a
city_asset string property. All mesh descendants stay together in one tile.
This reads the saved source; it never regenerates or saves over its buildings.
"""
import argparse
import hashlib
import json
import math
from pathlib import Path
import sys

import bpy
from mathutils import Vector


def main():
    if not bpy.app.background:
        raise RuntimeError("Use a fresh background Blender process")
    parser = argparse.ArgumentParser()
    parser.add_argument("--source", required=True, help="Saved static scenery .blend")
    parser.add_argument("--output", required=True)
    parser.add_argument("--tile-size", type=float, default=125)
    parser.add_argument("--all-meshes", action="store_true", help="Export untagged meshes too; use only for a scenery-only scene")
    args = parser.parse_args(sys.argv[sys.argv.index("--") + 1:])
    source, output = Path(args.source).resolve(), Path(args.output).resolve()
    if not source.is_file() or source.suffix.lower() != ".blend":
        raise ValueError("Provide an existing saved .blend source")
    if not 50 <= args.tile_size <= 250:
        raise ValueError("Tile size must be 50–250 metres")
    source_hash = hashlib.sha256(source.read_bytes()).hexdigest()
    bpy.ops.wm.open_mainfile(filepath=str(source))
    if abs(bpy.context.scene.unit_settings.scale_length - 1) > 1e-6:
        raise ValueError("Use metre-based source geometry with scene unit scale 1; convert scale before export")
    output.mkdir(parents=True, exist_ok=True)
    (output / "tiles").mkdir(exist_ok=True)
    depsgraph = bpy.context.evaluated_depsgraph_get()
    groups = {}
    for obj in bpy.context.scene.objects:
        if obj.type != "MESH" or obj.hide_render or obj.get("city_exclude"):
            continue
        root = obj
        while root.parent:
            root = root.parent
        asset_id = root.get("city_asset")
        if not asset_id and not args.all_meshes:
            continue
        key = root.name if asset_id else obj.name
        group = groups.setdefault(key, {"id": str(asset_id or obj.name), "meshes": [], "points": []})
        group["meshes"].append(obj)
        evaluated = obj.evaluated_get(depsgraph)
        for corner in evaluated.bound_box:
            point = evaluated.matrix_world @ Vector(corner)
            group["points"].append((point.x, -point.y, point.z))
    if not groups:
        raise ValueError("No city assets: tag a top-level building Empty with city_asset, or use --all-meshes for a static scenery scene")

    tiles = {}
    for group in groups.values():
        points = group["points"]
        bounds = [min(p[0] for p in points), min(p[1] for p in points), max(p[0] for p in points), max(p[1] for p in points)]
        tx = math.floor((bounds[0] + bounds[2]) / 2 / args.tile_size)
        tz = math.floor((bounds[1] + bounds[3]) / 2 / args.tile_size)
        tile_id = f"{tx}_{tz}"
        tile = tiles.setdefault(tile_id, {"id": tile_id, "groups": []})
        tile["groups"].append(group)
    entries = []
    all_points = []
    for tile in sorted(tiles.values(), key=lambda t: t["id"]):
        bpy.ops.object.select_all(action="DESELECT")
        meshes = [obj for group in tile["groups"] for obj in group["meshes"]]
        selected = set(meshes)
        for obj in meshes:
            parent = obj.parent
            while parent:
                selected.add(parent)
                parent = parent.parent
        for obj in selected:
            obj.hide_set(False)
            obj.hide_select = False
            obj.select_set(True)
        tile_file = output / "tiles" / (tile["id"] + ".glb")
        bpy.ops.export_scene.gltf(filepath=str(tile_file), export_format="GLB", use_selection=True,
                                  export_extras=True, export_yup=True, export_apply=True)
        points = [p for group in tile["groups"] for p in group["points"]]
        all_points.extend(points)
        entries.append({"id": tile["id"], "url": "tiles/" + tile_file.name, "bytes": tile_file.stat().st_size,
                        "bounds": [min(p[0] for p in points), min(p[1] for p in points), max(p[0] for p in points), max(p[1] for p in points)],
                        "assetIds": [group["id"] for group in tile["groups"]], "meshCount": len(meshes)})
    manifest = {"version": 1, "name": "Authored Mumbai scenery", "units": "metres", "axes": {"east": "+X", "up": "+Y", "north": "-Z"},
                "tileSize": args.tile_size, "tiles": entries, "totalGlbBytes": sum(t["bytes"] for t in entries),
                "bounds": [min(p[0] for p in all_points), min(p[1] for p in all_points), max(p[0] for p in all_points), max(p[1] for p in all_points)],
                "source": {"kind": "authored_blend", "file": source.name, "sha256": source_hash},
                "blenderVersion": bpy.app.version_string,
                "notes": ["Building roots stay intact; bounds can extend beyond the nominal tile cell", "Split long roads/ground before export", "Author supplies licences/credits and separate road/collision data"]}
    (output / "manifest.json").write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
    if hashlib.sha256(source.read_bytes()).hexdigest() != source_hash:
        raise RuntimeError("Source file changed during export")
    print(f"FINISHED authored scene: {len(entries)} tiles, {manifest['totalGlbBytes']} bytes; source unchanged", flush=True)


if __name__ == "__main__":
    main()
