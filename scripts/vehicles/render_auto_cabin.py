"""Review the dashboard and rear-mounted fare meter inside the actual auto."""
import bpy
from pathlib import Path
from mathutils import Vector

ROOT=Path(__file__).resolve().parents[2]
scene=bpy.data.scenes['Gallery Vehicles - Game Assets']; bpy.context.window.scene=scene
auto=next(o for o in scene.objects if o.parent is None and o.get('traffic_kind')==4); camera=scene.camera
point=lambda p: Vector((p[0],-p[2],p[1]))
hidden={o:o.hide_render for o in scene.objects}
position=auto.location.copy()
camera_saved=(camera.matrix_world.copy(),camera.data.type,camera.data.lens,camera.data.clip_start)
render_saved=(scene.render.resolution_x,scene.render.resolution_y,scene.render.filepath)
try:
    own=set(auto.children_recursive)
    for o in scene.objects:
        if o.type=='MESH' and o not in own and o.name!='Lineup studio floor': o.hide_render=True
    auto.location=point((0,0,0)); bpy.context.view_layer.update()
    camera.data.type='PERSP'; camera.data.lens=24; camera.data.clip_start=.025
    scene.render.resolution_x=1280; scene.render.resolution_y=960
    for name,eye,target in [('dashboard',(0,1.56,.06),(0,1.20,.80)),('passenger-meter',(.26,1.41,-.88),(-.30,1.20,-.09))]:
        camera.location=point(eye); camera.rotation_euler=(point(target)-camera.location).to_track_quat('-Z','Y').to_euler()
        scene.render.filepath=str(ROOT/'output/playwright/vehicles'/f'auto-{name}.png')
        bpy.ops.render.render(write_still=True)
finally:
    for o,value in hidden.items(): o.hide_render=value
    auto.location=position
    camera.matrix_world,camera.data.type,camera.data.lens,camera.data.clip_start=camera_saved
    scene.render.resolution_x,scene.render.resolution_y,scene.render.filepath=render_saved
print('Dashboard and passenger-side fare-meter reviews rendered.')
