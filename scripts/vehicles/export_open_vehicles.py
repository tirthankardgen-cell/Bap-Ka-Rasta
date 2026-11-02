"""Save and export the edited fleet without running the procedural builders.

Run through scripts/landmarks/blender_bridge.py, then pack_gallery_traffic.mjs.
The open session and previous deliverables are backed up under output/playwright.
Studio placement, hidden riders, selection and the active scene are restored.
"""
import bpy
import json
import shutil
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
AUTO_SOURCE = ROOT / 'assets/vehicles/mumbai-auto/mumbai-auto.blend'
TRAFFIC_SOURCE = ROOT / 'assets/vehicles/gallery-traffic/gallery-traffic.blend'
AUTO_GLB = ROOT / 'public/models/mumbai-auto.glb'
TRAFFIC_GLB = ROOT / 'public/models/gallery-traffic.glb'
AUTO_STATS = AUTO_SOURCE.with_name('model-stats.json')
TRAFFIC_MANIFEST = TRAFFIC_SOURCE.with_name('manifest.json')


def write_json(path, value):
    path.write_text(json.dumps(value, indent=2) + '\n', encoding='utf-8')


def geometry_stats(objects):
    meshes = [obj for obj in objects if obj.type == 'MESH']
    return {
        'triangles': sum(len(face.vertices) - 2 for obj in meshes for face in obj.data.polygons),
        'meshes': len(meshes),
    }


def export_scene(scene, objects, path, roots=()):
    bpy.context.window.scene = scene
    layer = bpy.context.view_layer
    selected = [obj for obj in scene.objects if obj.select_get()]
    active = layer.objects.active
    visibility = [(obj, obj.hide_get(), obj.hide_viewport, obj.hide_render) for obj in objects]
    transforms = [(obj, obj.matrix_basis.copy()) for obj in roots]
    try:
        for obj in scene.objects:
            obj.select_set(False)
        # Fleet roots are arranged for the studio; the game supplies placement.
        for obj in roots:
            obj.location = (0, 0, 0)
            obj.rotation_euler = (0, 0, 0)
        for obj in objects:
            obj.hide_viewport = False
            obj.hide_set(False)
            obj.hide_render = False
            obj.select_set(True)
        layer.update()
        bpy.ops.export_scene.gltf(
            filepath=str(path), export_format='GLB', use_selection=True,
            use_active_scene=True, export_extras=True, export_yup=True,
            export_apply=True, export_texcoords=False,
        )
        stats = geometry_stats(objects)
        entries = []
        for root in roots:
            descendants = list(root.children_recursive)
            vertices = [obj.matrix_world @ vertex.co for obj in descendants
                        if obj.type == 'MESH' for vertex in obj.data.vertices]
            minimum = [min(v[i] for v in vertices) for i in range(3)]
            maximum = [max(v[i] for v in vertices) for i in range(3)]
            entries.append({
                'name': root.name, 'kind': root['traffic_kind'],
                'reference': root.get('reference', ''),
                'reference_model': root.get('reference_model', root.name.removeprefix('traffic_')),
                **geometry_stats(descendants),
                'width': maximum[0] - minimum[0], 'height': maximum[2] - minimum[2],
                'length': maximum[1] - minimum[1],
                'parts': sorted({obj.get('part', 'body') for obj in descendants if obj.type == 'MESH'}),
                'wheels': [{'node': obj.name, 'centre': [round(v, 6) for v in (
                            obj.matrix_world.translation.x, obj.matrix_world.translation.z,
                            -obj.matrix_world.translation.y)],
                            'radius': obj['wheelRadius']}
                           for obj in sorted(descendants, key=lambda o: ('rear' not in o.name, o.name))
                           if 'wheelRadius' in obj],
            })
        return stats, entries
    finally:
        for obj, matrix in transforms:
            obj.matrix_basis = matrix
        for obj in scene.objects:
            obj.select_set(False)
        for obj in selected:
            obj.select_set(True)
        for obj, hidden, viewport, render in visibility:
            obj.hide_viewport = viewport
            obj.hide_set(hidden)
            obj.hide_render = render
        layer.objects.active = active
        layer.update()


def main():
    if bpy.context.mode != 'OBJECT':
        raise RuntimeError('Finish the current edit and switch to Object Mode before exporting.')
    auto_scene = bpy.data.scenes['Mumbai Auto - Game Asset']
    traffic_scene = bpy.data.scenes['Gallery Vehicles - Game Assets']
    collections = [c for c in auto_scene.collection.children if c.name.startswith('Mumbai Auto | export')]
    if len(collections) != 1:
        raise RuntimeError('Expected exactly one auto export collection.')
    auto_objects = list(collections[0].all_objects)
    auto_parts = {obj.get('part') for obj in auto_objects}
    if not {'partition', 'fare_meter', 'gauge', 'gauge_needle'} <= auto_parts:
        raise RuntimeError('The open auto is missing required cabin parts.')
    traffic_manifest = json.loads(TRAFFIC_MANIFEST.read_text(encoding='utf-8'))
    roots = [traffic_scene.objects[entry['name']] for entry in traffic_manifest['models']]
    if sorted(obj['traffic_kind'] for obj in roots) != [0, 1, 2, 3, 5, 6, 7, 8, 9, 10, 11, 12]:
        raise RuntimeError('The open gallery must contain all twelve traffic templates.')
    traffic_objects = [obj for root in roots for obj in [root, *root.children_recursive]]

    backup = ROOT / 'output/playwright' / ('saved-models-' + datetime.now().strftime('%Y%m%d-%H%M%S-%f'))
    backup.mkdir(parents=True)
    for path in [AUTO_SOURCE, TRAFFIC_SOURCE, AUTO_GLB, TRAFFIC_GLB, AUTO_STATS, TRAFFIC_MANIFEST]:
        if path.is_file():
            destination = backup / path.relative_to(ROOT)
            destination.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(path, destination)
    bpy.ops.wm.save_as_mainfile(filepath=str(backup / 'open-session.blend'),
                              compress=True, copy=True, relative_remap=False)
    original_scene = bpy.context.window.scene
    try:
        stats, _ = export_scene(auto_scene, auto_objects, AUTO_GLB)
        auto_stats = json.loads(AUTO_STATS.read_text(encoding='utf-8'))
        auto_stats.update(stats, bytes=AUTO_GLB.stat().st_size)
        write_json(AUTO_STATS, auto_stats)
        _, entries = export_scene(traffic_scene, traffic_objects, TRAFFIC_GLB, roots)
        traffic_manifest.update(models=entries, bytes=TRAFFIC_GLB.stat().st_size)
        for key in ['compression', 'sha256', 'uncompressed_bytes']:
            traffic_manifest.pop(key, None)
        write_json(TRAFFIC_MANIFEST, traffic_manifest)
        bpy.data.libraries.write(str(AUTO_SOURCE), {auto_scene}, fake_user=True, compress=True)
        bpy.data.libraries.write(str(TRAFFIC_SOURCE), {traffic_scene}, fake_user=True, compress=True)
    finally:
        bpy.context.window.scene = original_scene
    print(json.dumps({'saved': [str(AUTO_SOURCE), str(TRAFFIC_SOURCE)],
                      'exported': [str(AUTO_GLB), str(TRAFFIC_GLB)],
                      'backup': str(backup), 'traffic_models': len(roots), 'auto': stats}))


if __name__ == '__main__':
    main()
