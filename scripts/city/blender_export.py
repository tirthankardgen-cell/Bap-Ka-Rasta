"""Run in a fresh background Blender process to create editable source and GLB tiles.

blender --background --factory-startup --python scripts/city/blender_export.py --
    --prepared output/playwright/free-city/prepared --output output/playwright/free-city/export
"""
import argparse
import collections
import json
from pathlib import Path
import sys

import bpy
import bmesh


def main():
    if not bpy.app.background:
        raise RuntimeError("Use a fresh background Blender process; do not replace an open working scene")
    parser = argparse.ArgumentParser()
    parser.add_argument("--prepared", required=True)
    parser.add_argument("--output", required=True)
    args = parser.parse_args(sys.argv[sys.argv.index("--") + 1:])
    prepared, output = Path(args.prepared).resolve(), Path(args.output).resolve()
    output.mkdir(parents=True, exist_ok=True)
    (output / "tiles").mkdir(exist_ok=True)
    manifest = json.loads((prepared / "prepared.json").read_text(encoding="utf-8"))
    for obj in list(bpy.data.objects):
        bpy.data.objects.remove(obj, do_unlink=True)
    bpy.context.scene.unit_settings.system = "METRIC"
    bpy.context.scene.unit_settings.scale_length = 1
    materials = {}

    def material(kind, color):
        key = (kind, color)
        if key not in materials:
            mat = bpy.data.materials.new(kind)
            mat.use_nodes = True
            srgb = tuple(int(color[i:i + 2], 16) / 255 for i in (1, 3, 5))
            # Blender shader colours are scene-linear; the palette is sRGB.
            rgb = tuple(c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4 for c in srgb)
            mat.diffuse_color = (*rgb, 1)
            principled = mat.node_tree.nodes.get("Principled BSDF")
            principled.inputs["Base Color"].default_value = (*rgb, 1)
            principled.inputs["Roughness"].default_value = 0.8
            materials[key] = mat
        return materials[key]

    for tile in manifest["tiles"]:
        data = json.loads((prepared / tile["input"]).read_text(encoding="utf-8"))
        collection = bpy.data.collections.new("tile_" + tile["id"])
        bpy.context.scene.collection.children.link(collection)
        groups = collections.defaultdict(list)
        for mesh in data["meshes"]:
            groups[(mesh["kind"], mesh["color"])].append(mesh)
        for (kind, color), pieces in groups.items():
            vertices, faces = [], []
            for piece in pieces:
                offset = len(vertices)
                # Source is X/Y-up/Z; Blender is X/Y-north/Z-up.
                vertices.extend((x, -z, y) for x, y, z in piece["vertices"])
                faces.extend(tuple(i + offset for i in face) for face in piece["faces"])
            mesh = bpy.data.meshes.new(tile["id"] + "_" + kind)
            mesh.from_pydata(vertices, [], faces)
            mesh.update()
            bm = bmesh.new()
            bm.from_mesh(mesh)
            bmesh.ops.recalc_face_normals(bm, faces=list(bm.faces))
            bm.to_mesh(mesh)
            bm.free()
            obj = bpy.data.objects.new(mesh.name, mesh)
            collection.objects.link(obj)
            obj.data.materials.append(material(kind, color))
            obj["kind"] = kind
            obj["source_feature_ids"] = json.dumps(sorted({p["id"] for p in pieces}))
            obj["tile_id"] = tile["id"]
        bpy.ops.object.select_all(action="DESELECT")
        for obj in collection.objects:
            obj.select_set(True)
        tile_file = output / "tiles" / (tile["id"] + ".glb")
        bpy.ops.export_scene.gltf(filepath=str(tile_file), export_format="GLB", use_selection=True, export_extras=True, export_yup=True)
        tile["url"] = "tiles/" + tile_file.name
        tile["bytes"] = tile_file.stat().st_size
        tile["meshCount"] = len(collection.objects)
        print(f"EXPORTED {tile['id']} {tile['bytes']} bytes", flush=True)
    manifest["blenderVersion"] = bpy.app.version_string
    manifest["totalGlbBytes"] = sum(t["bytes"] for t in manifest["tiles"])
    (output / "manifest.json").write_text(json.dumps(manifest, indent=2), encoding="utf-8")
    (output / "roads.json").write_bytes((prepared / "roads.json").read_bytes())
    (output / "buildings.json").write_bytes((prepared / "buildings.json").read_bytes())
    bpy.ops.wm.save_as_mainfile(filepath=str(output / "churchgate-source.blend"))
    print(f"FINISHED {len(manifest['tiles'])} tiles, {manifest['totalGlbBytes']} bytes, Blender {bpy.app.version_string}", flush=True)


if __name__ == "__main__":
    main()
