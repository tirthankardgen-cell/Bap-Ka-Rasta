"""Author the traffic library from supplied photos and the gallery palette.

Run with the open Blender bridge. Only replaces this script's named scene.
All shapes, including tyres, trims, lamps and riders, are original geometry.
"""
import bpy
import json
import math
import sys
import importlib
from pathlib import Path
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(Path(__file__).resolve().parent))
import vehicle_primitives
importlib.reload(vehicle_primitives)
from vehicle_primitives import VehicleKit, point

OUT = ROOT/'assets/vehicles/gallery-traffic'
OUT.mkdir(parents=True, exist_ok=True)
NAME = 'Gallery Vehicles - Game Assets'
previous = bpy.data.scenes.get(NAME)
if previous:
    for obj in list(previous.objects): bpy.data.objects.remove(obj, do_unlink=True)
    bpy.data.scenes.remove(previous)
scene = bpy.data.scenes.new(NAME)
bpy.context.window.scene = scene
scene.unit_settings.system = 'METRIC'
BLACK='25262b'; GLASS='29313f'; CHROME='b5ae9e'; LAMP='fff0c4'; ORANGE='fa691b'; WHITE='eee9df'; TEAL='06bed0'; BLUE='28569f'
kits=[]


def rider(k, sport=False):
    k.rider=True
    shirt='a98b61' if sport else '915873'; skin='ac7954'
    hip=(0,.88,-.22); shoulder=(0,1.29,.18) if sport else (0,1.31,-.20)
    k.sphere('Rider lower torso',(0,.98,-.19),(.15,.20,.12),shirt,'seat')
    chest=k.sphere('Rider chest',(0,1.18,.05 if sport else -.19),(.175,.23,.12),shirt,'seat')
    if sport: chest.rotation_euler.x = -.43
    head=(0,1.58,.14) if sport else (0,1.64,-.17)
    k.tube('Rider neck',[(0,shoulder[1]+.02,shoulder[2]),(head[0],head[1]-.10,head[2])],.051,skin,'seat')
    k.sphere('Helmet',head,(.145,.168,.148),BLACK,'paint')
    k.sphere('Helmet visor',(0,head[1]+.01,head[2]+.101),(.127,.079,.068),'4c6573','glass')
    if not sport:
        k.tube('Ponytail',[(0,1.58,-.29),(.035,1.43,-.34),(.025,1.32,-.31)],.041,'252226','seat')
    for s in [-1,1]:
        hand=(s*.295,1.205,.43) if sport else (s*.29,1.164,.386)
        elbow=(s*.25,1.12,.30) if sport else (s*.24,1.10,.12)
        k.tube('Rider sleeve',[(s*.145,shoulder[1]-.03,shoulder[2]),elbow],.056,shirt,'seat')
        k.tube('Rider forearm',[elbow,hand],.040,skin,'seat')
        k.sphere('Rider hand',hand,(.046,.038,.047),skin,'seat')
        knee=(s*.20,.67,.28)
        foot=(s*.18,.43,-.06) if sport else (s*.17,.37,.33)
        k.tube('Seated trousers',[(s*.11,.86,-.18),knee,foot],.071,'484f5c','seat')
        k.box('Rider shoe',(foot[0],foot[1]-.024,foot[2]+.04),(.13,.082,.25),BLACK,.026,'rubber')
    k.rider=False


import reference_vehicles
importlib.reload(reference_vehicles)
from reference_vehicles import suv, duke, dio, toto, sedan, bus
import supporting_vehicles
importlib.reload(supporting_vehicles)
kits=[suv(scene,'traffic_thar',0),suv(scene,'traffic_fortuner',1,True),toto(scene),
      dio(scene,rider),duke(scene,rider),sedan(scene,'traffic_sedan',7),
      sedan(scene,'traffic_taxi',8,True),bus(scene)]+supporting_vehicles.supporting_vehicles(scene)

bpy.context.view_layer.update()
manifest={'reference_images':['ref vech/thar actual.png','ref vech/fortuner actual.png','ref vech/Ktm actual.png','ref vech/scooty actual .png','ref vech/e riksha actual .png','ref vech/mumbai red bus.jfif','ref vech/extra cars images.jfif','public/images/vehicle-gallery.webp','public/images/toto-erickshaw.png'],
          'axes':'metres, Y up, +Z forward, wheels on Y=0', 'models':[]}
for k in kits:
    objects=[o for o in k.collection.objects if o.type=='MESH']
    vertices=[o.matrix_world@v.co for o in objects for v in o.data.vertices]
    mins=[min(v[i] for v in vertices) for i in range(3)]
    maxs=[max(v[i] for v in vertices) for i in range(3)]
    manifest['models'].append({'name':k.root.name,'kind':k.root['traffic_kind'],'reference':k.root['reference'],
        'reference_model':k.root.get('reference_model',k.root.name.removeprefix('traffic_')),
        'triangles':sum(sum(len(p.vertices)-2 for p in o.data.polygons) for o in objects),'meshes':len(objects),
        'width':maxs[0]-mins[0],'height':maxs[2]-mins[2],'length':maxs[1]-mins[1],
        'parts':sorted(set(o.get('part','body') for o in objects)),
        'wheels':[{'node':k.root.name+'__'+tag,'centre':list(centre),'radius':centre[1]} for tag,centre in k.wheels.items()]})
bpy.ops.object.select_all(action='DESELECT')
for k in kits:
    for o in k.collection.objects: o.select_set(True)
glb=ROOT/'public/models/gallery-traffic.glb'
bpy.ops.export_scene.gltf(filepath=str(glb),export_format='GLB',use_selection=True,use_active_scene=True,export_extras=True,export_yup=True,export_apply=True,export_texcoords=False)
manifest['bytes']=glb.stat().st_size
(OUT/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')

# Save a clean editable scene: models are arranged only after the runtime export.
for i,k in enumerate(kits): k.root.location=point(((i%4-1.5)*4.2,0,-(i//4)*7))
scene['reference']='Real vehicle photos in ref vech; gallery paint palette. Original authored geometry; source paths on each vehicle root.'
scene.world=bpy.data.worlds.new('Gallery studio world'); scene.world.use_nodes=True
scene.world.node_tree.nodes['Background'].inputs[0].default_value=(.6,.65,.7,1)
scene.world.node_tree.nodes['Background'].inputs[1].default_value=.65
bpy.data.libraries.write(str(OUT/'gallery-traffic.blend'),{scene},fake_user=True,compress=True)
print(json.dumps(manifest))
