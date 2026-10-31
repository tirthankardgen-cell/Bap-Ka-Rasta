"""Render the real Blender meshes for review; run in the authored open city scene."""
import bpy
import math
import os
from pathlib import Path
from mathutils import Vector

ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/'output/playwright/landmark-renders'
OUT.mkdir(parents=True,exist_ok=True)
scene=bpy.data.scenes['Mumbai | Landmark Districts']
bpy.context.window.scene=scene
camera=scene.camera
saved_camera=(camera.matrix_world.copy(),camera.data.type,camera.data.lens)
saved_resolution=(scene.render.resolution_x,scene.render.resolution_y)
camera.data.type='PERSP'; camera.data.lens=43
scene.render.resolution_x=1280; scene.render.resolution_y=960
scene.render.resolution_percentage=100
scene.render.image_settings.file_format='PNG'
scene.eevee.taa_render_samples=48
roots=[o for o in scene.objects if o.type=='EMPTY' and o.get('height_m')]
ids=os.environ.get('MUMBAI_LANDMARK_RENDER_IDS','taj-palace,gateway,antilia,csmt,mannat,galaxy,jalsa,eros,regal,mount-mary,siddhivinayak,world-one,opera-house,nehru-centre,high-court,bse,world-trade-centre').split(',')
saved={o:o.hide_render for o in scene.objects}
try:
    for ident in ids:
        root=next(o for o in roots if o.name==ident)
        for other in roots:
            for obj in other.children_recursive:
                obj.hide_render=other!=root or obj.get('lod')=='far' or obj.name.endswith('__far')
        h=root['height_m']
        points=[obj.matrix_world@Vector(c) for obj in root.children_recursive if obj.type=='MESH' and not obj.hide_render for c in obj.bound_box]
        lo=Vector([min(p[i] for p in points) for i in range(3)]); hi=Vector([max(p[i] for p in points) for i in range(3)])
        span=max(hi.x-lo.x,hi.y-lo.y,h)
        yaw=root.rotation_euler.z
        # Convert a front three-quarter view from local game coordinates.
        local=Vector((span*.68,-span*1.92,h*.84))
        local.rotate(root.rotation_euler)
        camera.location=root.location+local
        target=root.location+Vector((0,0,h*.50))
        camera.rotation_euler=(target-camera.location).to_track_quat('-Z','Y').to_euler()
        scene.render.filepath=str(OUT/(ident+'.png'))
        bpy.ops.render.render(write_still=True)
        print('RENDERED',ident,flush=True)
finally:
    for obj,value in saved.items(): obj.hide_render=value
    camera.matrix_world,camera.data.type,camera.data.lens=saved_camera
    scene.render.resolution_x,scene.render.resolution_y=saved_resolution
print('MUMBAI_RENDERS_COMPLETE',flush=True)
