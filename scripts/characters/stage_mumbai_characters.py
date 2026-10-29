"""Arrange the editable .blend for inspection after the origin-centred GLB export."""
import bpy
import math
from pathlib import Path
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[2]


def point(p):
    return Vector((p[0], -p[2], p[1]))


def stage(scene):
    previous = bpy.data.collections.get("Mumbai cast | review studio")
    if previous:
        for obj in list(previous.objects):
            bpy.data.objects.remove(obj, do_unlink=True)
        bpy.data.collections.remove(previous)
    studio = bpy.data.collections.new("Mumbai cast | review studio")
    scene.collection.children.link(studio)
    rigs = sorted((o for o in scene.objects if o.type == "ARMATURE" and "reference_index" in o), key=lambda o: o["reference_index"])
    for i, rig in enumerate(rigs):
        x, z = (i % 5 - 2) * 1.65, (1.5 - i // 5) * 2.5
        rig.location = point((x, 0, z))
        rig.show_in_front = False
        label_data = bpy.data.curves.new(rig["display_name"] + " label", "FONT")
        label_data.body = rig["display_name"]
        label_data.align_x = "CENTER"
        label_data.size = .115
        label_data.extrude = .001
        label = bpy.data.objects.new(rig["display_name"] + " label", label_data)
        studio.objects.link(label)
        label.location = point((x, .018, z + .48))
        label.rotation_euler.z = math.pi
    for obj in scene.objects:
        if obj.get("lod") in ("crowd", "player"):
            obj.hide_render = True
            obj.hide_set(True)
    ground_data = bpy.data.meshes.new("Studio pavement")
    ground_data.from_pydata([(-20, -20, -.013), (20, -20, -.013), (20, 20, -.013), (-20, 20, -.013)], [], [(0, 1, 2, 3)])
    ground = bpy.data.objects.new("Studio pavement", ground_data)
    studio.objects.link(ground)
    mat = bpy.data.materials.new("Studio warm limestone")
    mat.diffuse_color = (.61, .51, .37, 1)
    ground.data.materials.append(mat)
    world = bpy.data.worlds.new("Cast studio world")
    world.use_nodes = True
    world.node_tree.nodes["Background"].inputs[0].default_value = (.35, .4, .47, 1)
    world.node_tree.nodes["Background"].inputs[1].default_value = .6
    scene.world = world
    for name, location, energy, size in [
        ("Key softbox", (-5, 10, 7), 1600, 7),
        ("Fill softbox", (7, 7, 3), 1100, 8),
        ("Rim softbox", (1, 9, -7), 2000, 7),
    ]:
        data = bpy.data.lights.new(name, "AREA")
        data.energy, data.size = energy, size
        obj = bpy.data.objects.new(name, data)
        studio.objects.link(obj)
        obj.location = point(location)
        obj.rotation_euler = (point((0, 1, 0)) - obj.location).to_track_quat("-Z", "Y").to_euler()
    data = bpy.data.cameras.new("Cast library camera")
    camera = bpy.data.objects.new("Cast library camera", data)
    studio.objects.link(camera)
    camera.location = point((7.4, 13.8, 17.5))
    camera.rotation_euler = (point((0, .45, 0)) - camera.location).to_track_quat("-Z", "Y").to_euler()
    data.type = "ORTHO"
    data.ortho_scale = 15
    scene.camera = camera
    scene.render.resolution_x, scene.render.resolution_y = 1800, 1500
    scene.render.resolution_percentage = 100
    for i, filename in enumerate(["01-mumbai-main-cast.png", "02-mumbai-street-crowd.png"]):
        reference = bpy.data.objects.new("REFERENCE ONLY | " + filename, None)
        studio.objects.link(reference)
        reference.empty_display_type = "IMAGE"
        reference.data = bpy.data.images.load(str(ROOT / "docs/mumbai-characters/images" / filename), check_existing=True)
        reference.data.pack()
        reference.empty_display_size = 6.5
        reference.location = point((-10, 3.2, 4 - i * 5))
        reference.rotation_euler = (math.pi / 2, 0, 0)
        reference["usage"] = "Authoring reference only; excluded from GLB"
    scene["library_notes"] = "20 editable rigid rigs; distant meshes and player cabin parts are hidden. Regenerate with scripts/characters/build_mumbai_characters.py to export at the origin. Reference boards are editor-only."
    for screen in bpy.data.screens:
        for area in screen.areas:
            if area.type == "VIEW_3D":
                area.spaces.active.region_3d.view_perspective = "CAMERA"
                area.spaces.active.shading.type = "MATERIAL"
                area.spaces.active.overlay.show_overlays = False


if __name__ == "__main__":
    current = bpy.data.scenes["Mumbai Characters | Reference Cast"]
    bpy.context.window.scene = current
    stage(current)
    bpy.ops.wm.save_as_mainfile(filepath=str(ROOT / "assets/characters/mumbai/mumbai-characters.blend"), compress=True)
