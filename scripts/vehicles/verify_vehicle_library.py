"""Read-only source-library check: run in a fresh background Blender process."""
import bpy
import json
import math
from pathlib import Path

if not bpy.app.background:
    raise RuntimeError('Run with Blender --background --factory-startup; this check must not alter an open editing session.')
ROOT=Path(__file__).resolve().parents[2]
path=ROOT/'assets/vehicles/gallery-traffic/gallery-traffic.blend'
with bpy.data.libraries.load(str(path),link=False) as (source,loaded):
    assert source.scenes==['Gallery Vehicles - Game Assets'], source.scenes
    loaded.scenes=list(source.scenes)
scene=loaded.scenes[0]
roots=[o for o in scene.objects if o.parent is None and 'traffic_kind' in o]
assert sorted(o['traffic_kind'] for o in roots)==list(range(13)), [(o.name,o['traffic_kind']) for o in roots]
report=[]
for root in roots:
    wheels=[o for o in root.children_recursive if 'wheelRadius' in o]
    kind=root['traffic_kind']; expected=3 if kind in (2,4) else 2 if kind in (5,6) else 4
    assert len(wheels)==expected, (root.name,len(wheels))
    assert all(o.type=='EMPTY' and o['wheelRadius']>0 for o in wheels)
    for o in root.children_recursive:
        if o.type=='MESH':
            assert all(math.isfinite(v) for vertex in o.data.vertices for v in vertex.co), o.name
    report.append({'name':root.name,'kind':kind,'wheels':len(wheels)})
refs=[o for o in scene.objects if o.type=='EMPTY' and o.empty_display_type=='IMAGE']
assert len(refs)>=10
assert all(o.data and o.data.packed_file for o in refs)
auto=next(o for o in roots if o['traffic_kind']==4)
parts={o.get('part') for o in auto.children_recursive}
assert {'partition','fare_meter','gauge','gauge_needle'} <= parts
with bpy.data.libraries.load(str(ROOT/'assets/vehicles/mumbai-auto/mumbai-auto.blend'),link=False) as (source,loaded):
    assert source.scenes==['Mumbai Auto - Game Asset'], source.scenes
print(json.dumps({'vehicles':sorted(report,key=lambda o:o['kind']),'packed_reference_boards':len(refs),'scene_isolated':True,'all_checks_passed':True}))
