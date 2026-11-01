"""Save the complete editable fleet with packed real-photo references.

Run after both builders. Only this gallery scene is saved; other open projects
are preserved. Studio and reference boards never enter the game GLB.
"""
import bpy
import json
import math
from pathlib import Path
from mathutils import Vector

ROOT=Path(__file__).resolve().parents[2]
scene=bpy.data.scenes['Gallery Vehicles - Game Assets']
bpy.context.window.scene=scene
point=lambda p: Vector((p[0],-p[2],p[1]))
manifest=json.loads((ROOT/'assets/vehicles/gallery-traffic/manifest.json').read_text())
names=[m['name'] for m in manifest['models']]
roots=[scene.objects[name] for name in names]

for old in list(scene.collection.children):
    # Blender suffixes reused datablock names after a scene rebuild. Clear our
    # suffixed studio collections too, otherwise a second staging adds an auto.
    if any(old.name==name or old.name.startswith(name+'.')
           for name in ['Lineup | auto and studio','References | real vehicles']):
        for o in list(old.objects): bpy.data.objects.remove(o,do_unlink=True)
        bpy.data.collections.remove(old)
studio=bpy.data.collections.new('Lineup | auto and studio'); scene.collection.children.link(studio)
auto=bpy.data.objects.new('lineup_mumbai_auto',None); studio.objects.link(auto)
auto['reference']='ref vech/auto front.png; ref vech/auto side.png; ref vech/auto interior dashboard.png'
auto['traffic_kind']=4
source=bpy.data.scenes.get('Mumbai Auto - Game Asset')
if not source: raise RuntimeError('Build the auto first to include it in the lineup')
copies={}
for original in source.objects:
    if 'part' not in original and not original.name.startswith(('wheel_','speedometer_')): continue
    obj=original.copy(); studio.objects.link(obj); copies[original]=obj
for original,obj in copies.items():
    obj.parent=copies.get(original.parent,auto)
layout=[['lineup_mumbai_auto','traffic_scooty','traffic_ktm','traffic_toto','traffic_thar'],
        ['traffic_fortuner','traffic_sedan','traffic_taxi','traffic_hatchback','traffic_wagon'],
        ['traffic_crossover','traffic_mpv','traffic_best_bus']]
by_name={root.name:root for root in roots}; by_name['lineup_mumbai_auto']=auto
for row,row_names in enumerate(layout):
    for col,name in enumerate(row_names):
        root=by_name[name]
        root.location=point(((col-(len(row_names)-1)/2)*4.5,0,4.8-row*7.0))
        root['lineup_position']=list(root.location)
        root.empty_display_size=.25
# Rider geometry remains in the runtime export; the studio shows unobstructed shapes.
for o in scene.objects:
    if o.get('rider') or o.get('driver'):
        o.hide_set(True); o.hide_render=True

def link(o):
    for coll in list(o.users_collection): coll.objects.unlink(o)
    studio.objects.link(o)

bpy.ops.mesh.primitive_plane_add(size=200,location=(0,0,-.017))
floor=bpy.context.object; floor.name='Lineup studio floor'; link(floor)
mat=bpy.data.materials.new('Lineup warm ivory'); mat.diffuse_color=(.63,.63,.60,1); mat.use_nodes=True
mat.node_tree.nodes['Principled BSDF'].inputs['Base Color'].default_value=(.63,.63,.60,1)
mat.node_tree.nodes['Principled BSDF'].inputs['Roughness'].default_value=.87
floor.data.materials.append(mat)
for name,pos,energy,size in [('Key',(-8,13,10),3300,10),('Fill',(10,10,3),2400,9),('Rim',(0,14,-12),3800,10)]:
    bpy.ops.object.light_add(type='AREA',location=point(pos)); o=bpy.context.object; link(o)
    o.name='Lineup '+name; o.data.energy=energy; o.data.shape='DISK'; o.data.size=size
    o.rotation_euler=(point((0,1,-2))-o.location).to_track_quat('-Z','Y').to_euler()
bpy.ops.object.camera_add(location=point((20,23,31)))
camera=bpy.context.object; camera.name='Complete vehicle lineup'; link(camera)
camera.rotation_euler=(point((0,.8,-2.2))-camera.location).to_track_quat('-Z','Y').to_euler()
camera.data.type='ORTHO'; camera.data.ortho_scale=33; scene.camera=camera
scene.render.engine='BLENDER_EEVEE_NEXT' if bpy.app.version >= (4,2,0) else 'BLENDER_EEVEE'
if hasattr(scene,'eevee'):
    scene.eevee.use_gtao=True; scene.eevee.gtao_distance=3; scene.eevee.gtao_factor=1.17; scene.eevee.taa_render_samples=32
scene.view_settings.view_transform='AgX' if bpy.app.version >= (4,0,0) else 'Filmic'
if bpy.app.version < (4,0,0): scene.view_settings.look='Medium High Contrast'
scene.view_settings.exposure=0; scene.view_settings.gamma=1
scene.render.resolution_x=1920; scene.render.resolution_y=1280; scene.render.resolution_percentage=100
scene.render.image_settings.file_format='PNG'
scene.render.filepath=str(ROOT/'output/playwright/vehicles/lineup.png')
(ROOT/'output/playwright/vehicles').mkdir(parents=True,exist_ok=True)

# Packed image empties remain available for modelling alongside the fleet.
references=bpy.data.collections.new('References | real vehicles'); scene.collection.children.link(references)
paths=sorted(set(manifest['reference_images']+[str(p.relative_to(ROOT)).replace('\\','/') for p in (ROOT/'ref vech').glob('auto*.png')]))
for i,rel in enumerate(paths):
    path=ROOT/rel
    if not path.is_file(): continue
    im=bpy.data.images.load(str(path),check_existing=True)
    if not im.packed_file: im.pack()
    obj=bpy.data.objects.new(path.stem+' | reference',None); references.objects.link(obj)
    obj.empty_display_type='IMAGE'; obj.data=im; obj.empty_display_size=3.8
    obj.rotation_euler=(math.pi/2,0,0)
    obj.location=point(((i%5-2)*4.6,2.8+(i//5)*3.5,-17))
    obj.hide_render=True; obj['reference_path']=rel
references.hide_render=True
scene['vehicle_count']=len(roots)+1
scene['asset_contract']='Thirteen vehicles in one scene. GLBs: ground origin, Y up, +Z forward, independent wheel pivots. Studio and photo boards excluded from runtime.'
scene['review']='Photo-derived geometry with the gallery palette. Dark glazing and simplified cabins for the browser game.'
for area in bpy.context.screen.areas:
    if area.type=='VIEW_3D':
        area.spaces.active.region_3d.view_perspective='CAMERA'
        area.spaces.active.shading.type='MATERIAL'
        area.spaces.active.overlay.show_overlays=False
bpy.ops.object.select_all(action='DESELECT')
bpy.data.libraries.write(str(ROOT/'assets/vehicles/gallery-traffic/gallery-traffic.blend'),{scene},fake_user=True,compress=True)
bpy.ops.render.render(write_still=True)
print(f'Saved {len(roots)+1} editable vehicles, packed references and the lineup render.')
