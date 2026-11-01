"""Render every vehicle from front, side and rear without changing the saved file.

VEHICLE_REVIEW_NAMES and VEHICLE_REVIEW_VIEWS may be comma-separated filters.
All temporary object visibility and camera changes are restored, even on errors.
"""
import bpy
import os
from pathlib import Path
from mathutils import Vector

ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/'output/playwright/vehicles/review'; OUT.mkdir(parents=True,exist_ok=True)
scene=bpy.data.scenes['Gallery Vehicles - Game Assets']; bpy.context.window.scene=scene
camera=scene.camera
point=lambda p: Vector((p[0],-p[2],p[1]))
roots=[o for o in scene.objects if o.parent is None and 'traffic_kind' in o]
names=os.environ.get('VEHICLE_REVIEW_NAMES','').split(',')
views=os.environ.get('VEHICLE_REVIEW_VIEWS','front,side,rear').split(',')
saved={o:(o.location.copy(),o.hide_render) for o in scene.objects}
saved_camera=(camera.matrix_world.copy(),camera.data.ortho_scale)
saved_render=(scene.render.resolution_x,scene.render.resolution_y,scene.render.filepath)
try:
    for root in roots:
        if names!=[''] and root.name not in names: continue
        for other in roots:
            for o in other.children_recursive:
                if o.type=='MESH': o.hide_render=other!=root or saved[o][1]
        root.location=point((0,0,0)); bpy.context.view_layer.update()
        verts=[o.matrix_world@Vector(c) for o in root.children_recursive if o.type=='MESH' and not o.hide_render for c in o.bound_box]
        lo=Vector([min(v[i] for v in verts) for i in range(3)])
        hi=Vector([max(v[i] for v in verts) for i in range(3)])
        centre=(lo+hi)/2; span=hi-lo
        scene.render.resolution_x=1100; scene.render.resolution_y=850
        for view in views:
            offset={'front':(3.7,2.5,5.7),'side':(7,.55,.0),'rear':(-3.7,2.4,-5.7)}[view]
            camera.location=centre+point(offset)
            camera.rotation_euler=(centre-camera.location).to_track_quat('-Z','Y').to_euler()
            camera.data.ortho_scale=max(span.x,span.y,span.z*1100/850)*1.25
            scene.render.filepath=str(OUT/f'{root.name}-{view}.png')
            bpy.ops.render.render(write_still=True)
        root.location=saved[root][0]
finally:
    for o,(pos,hidden) in saved.items(): o.location=pos; o.hide_render=hidden
    camera.matrix_world=saved_camera[0]; camera.data.ortho_scale=saved_camera[1]
    scene.render.resolution_x,scene.render.resolution_y,scene.render.filepath=saved_render
print('Front, side and rear reviews are in '+str(OUT))
