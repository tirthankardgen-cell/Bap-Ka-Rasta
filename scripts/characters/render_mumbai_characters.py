"""Render the actual Blender meshes, never the concept artwork.

blender -b assets/characters/mumbai/mumbai-characters.blend --python scripts/characters/render_mumbai_characters.py
Optional MUMBAI_RENDER_IDS=sachin,meera for a quick modelling check.
"""
import bpy
import os
from pathlib import Path
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "output/playwright/character-renders"
OUT.mkdir(parents=True, exist_ok=True)
scene = bpy.data.scenes["Mumbai Characters | Reference Cast"]
bpy.context.window.scene = scene
for obj in scene.objects:
    if obj.type in ("LIGHT", "FONT"):
        obj.hide_render = True


def point(p):
    return Vector((p[0], -p[2], p[1]))


def aim(obj, at):
    obj.rotation_euler = (point(at) - obj.location).to_track_quat("-Z", "Y").to_euler()


camera_data = bpy.data.cameras.new("Cast portrait camera")
camera = bpy.data.objects.new("Cast portrait camera", camera_data)
scene.collection.objects.link(camera)
camera.location = point((3.4, 2.32, 8))
aim(camera, (0, .97, 0))
camera_data.type = "ORTHO"
camera_data.ortho_scale = 2.28
scene.camera = camera
scene.render.engine = "BLENDER_EEVEE"
scene.eevee.use_gtao = True
scene.eevee.gtao_distance = .6
scene.eevee.gtao_factor = 1.13
scene.eevee.use_soft_shadows = True
scene.eevee.taa_render_samples = 96
scene.render.resolution_x = 600
scene.render.resolution_y = 720
scene.render.resolution_percentage = 100
scene.view_settings.view_transform = "Standard"
scene.view_settings.look = "Medium High Contrast"
scene.view_settings.exposure = -.5
scene.world = bpy.data.worlds.new("Warm cast studio")
scene.world.use_nodes = True
scene.world.node_tree.nodes["Background"].inputs[0].default_value = (.32, .36, .42, 1)
scene.world.node_tree.nodes["Background"].inputs[1].default_value = .55
for name, position, power, size, color in [
    ("warm key", (-3.5, 5, 5), 430, 4, (1, .87, .72)),
    ("cool fill", (4, 2.8, 2.5), 220, 3, (.76, .85, 1)),
    ("hair rim", (-1, 4, -3), 550, 3, (1, .84, .62)),
]:
    data = bpy.data.lights.new(name, "AREA")
    data.energy, data.size, data.color = power, size, color
    obj = bpy.data.objects.new(name, data)
    scene.collection.objects.link(obj)
    obj.location = point(position)
    aim(obj, (0, 1, 0))
plane_data = bpy.data.meshes.new("studio floor")
plane_data.from_pydata([(-100, -100, -.009), (100, -100, -.009), (100, 100, -.009), (-100, 100, -.009)], [], [(0, 1, 2, 3)])
floor = bpy.data.objects.new("studio floor", plane_data)
scene.collection.objects.link(floor)
mat = bpy.data.materials.new("Warm sand studio")
mat.use_nodes = True
mat.node_tree.nodes["Principled BSDF"].inputs["Base Color"].default_value = (.69, .59, .45, 1)
mat.node_tree.nodes["Principled BSDF"].inputs["Roughness"].default_value = 1
floor.data.materials.append(mat)
meshes = [o for o in scene.objects if o.get("lod") == "detail"]
requested = os.environ.get("MUMBAI_RENDER_IDS", "").split(",")
for obj in scene.objects:
    if obj.type == "MESH" and obj != floor:
        obj.hide_render = True
for obj in meshes:
    ident = obj["cast_id"]
    if requested != [""] and ident not in requested:
        continue
    original_position = obj.parent.location.copy()
    obj.parent.location = (0, 0, 0)
    obj.hide_render = False
    scene.render.filepath = str(OUT / (ident + ".png"))
    bpy.ops.render.render(write_still=True)
    obj.hide_render = True
    obj.parent.location = original_position
    print("CAST_RENDER", ident, flush=True)
