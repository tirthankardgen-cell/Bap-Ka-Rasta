"""Render front and rear reference views of the authored Blender asset."""
import bpy
from pathlib import Path
from mathutils import Vector

root = Path(bpy.data.filepath).parents[3]
scene = bpy.context.scene
scene.render.engine = 'BLENDER_EEVEE_NEXT' if bpy.app.version >= (4,2,0) else 'BLENDER_EEVEE'
if hasattr(scene, 'eevee'):
    scene.eevee.use_gtao = True
    scene.eevee.gtao_distance = 3
    scene.eevee.gtao_factor = 1.2
    scene.eevee.taa_render_samples = 64
for view, position in [('front',(3.4,-4.8,2.6)),('rear',(-3.4,4.8,2.7))]:
    scene.camera.location = position
    scene.camera.rotation_euler = (Vector((0,0,1.02))-scene.camera.location).to_track_quat('-Z','Y').to_euler()
    scene.render.filepath = str(root / 'output/playwright/rickshaw' / ('blender-'+view+'.png'))
    bpy.ops.render.render(write_still=True)
scene.camera.location = (3.4,-4.8,2.6)
scene.camera.rotation_euler = (Vector((0,0,1.02))-scene.camera.location).to_track_quat('-Z','Y').to_euler()
print('Rendered front and rear views')
