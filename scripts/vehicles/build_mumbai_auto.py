"""Original Mumbai kaali-peeli, authored in Blender; game axes are X/right Y/up Z/front.

Execute through scripts/blender_mcp.py, or Blender --background --python this_file.
Set MUMBAI_AUTO_ROOT when building outside this checkout.
"""
import bpy
import bmesh
import json
import math
import os
from pathlib import Path
from mathutils import Vector

ROOT = Path(os.environ.get('MUMBAI_AUTO_ROOT', str(Path(__file__).resolve().parents[2])))
OUT = ROOT / 'assets/vehicles/mumbai-auto'
OUT.mkdir(parents=True, exist_ok=True)
SCENE_NAME = 'Mumbai Auto - Game Asset'
# Keep the user's other scenes intact. Only replace our own generated scene.
previous = bpy.data.scenes.get(SCENE_NAME)
if previous:
    for obj in list(previous.objects):
        bpy.data.objects.remove(obj, do_unlink=True)
    bpy.data.scenes.remove(previous)
scene = bpy.data.scenes.new(SCENE_NAME)
bpy.context.window.scene = scene
scene.unit_settings.system = 'METRIC'
scene.render.engine = 'CYCLES'
scene.cycles.samples = 32
scene.view_settings.view_transform = 'AgX' if bpy.app.version >= (4,0,0) else 'Filmic'
asset = bpy.data.collections.new('Mumbai Auto | export')
scene.collection.children.link(asset)
parts = []
M = {}

def point(p):
    x, y, z = p
    return Vector((x, -z, y))

def material(name, color, rough=0.4, metal=0, alpha=1):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    c = [int(color[i:i+2], 16)/255 for i in (0,2,4)]
    c = [v/12.92 if v <= .04045 else ((v+.055)/1.055)**2.4 for v in c]
    m.diffuse_color = (*c, alpha)
    p = m.node_tree.nodes.get('Principled BSDF')
    p.inputs['Base Color'].default_value = (*c, alpha)
    p.inputs['Roughness'].default_value = rough
    p.inputs['Metallic'].default_value = metal
    p.inputs['Alpha'].default_value = alpha
    if alpha < 1:
        if hasattr(m, 'surface_render_method'):
            m.surface_render_method = 'DITHERED'
        else:
            m.blend_method = 'BLEND'
        m.use_backface_culling = False
    M[name] = m
    return m

material('Midnight black enamel', '161b1d', .3, .38)
material('Mumbai taxi yellow', 'f4ba16', .32, .22)
material('Tarpaulin black', '252824', .92)
material('Rubber', '17191a', .92)
material('Chassis', '292e2e', .58, .45)
material('Chrome', 'a5acaa', .24, .85)
material('Steel wheel', 'a3a18c', .4, .7)
material('Warm vinyl', 'b7541e', .60)
material('Seat piping', 'e28d46', .74)
material('Window glass', 'b9d8d4', .16, .12, .19)
material('Headlamp lens', 'efe7c8', .18, .24)
material('Amber lens', 'ff7d13', .25, .1)
material('Red lens', 'bf231a', .28, .12)
material('Lettering cream', 'f1e4ad', .65)
material('CNG green', '287547', .65)
material('Meter screen', 'a9cda2', .55)
material('Dashboard moulding', '686357', .72)
material('Khaki cotton', '9e8460', .91)
material('Skin', 'a46d47', .8)
material('Hair', '24221e', .95)

def register(o, name, mat=None, tag='body'):
    o.name = name
    for coll in list(o.users_collection):
        coll.objects.unlink(o)
    asset.objects.link(o)
    if mat:
        o.data.materials.append(M[mat])
    o['part'] = tag
    parts.append(o)
    return o

def mesh(name, verts, faces, mat, tag='body', smooth=True):
    data = bpy.data.meshes.new(name)
    data.from_pydata([point(v) for v in verts], [], faces)
    data.update()
    bm = bmesh.new(); bm.from_mesh(data)
    bmesh.ops.recalc_face_normals(bm, faces=list(bm.faces))
    bm.to_mesh(data); bm.free()
    o = bpy.data.objects.new(name, data)
    asset.objects.link(o)
    o.data.materials.append(M[mat]); o['part'] = tag; parts.append(o)
    for p in data.polygons: p.use_smooth = smooth
    return o

def box(name, loc, size, mat, bevel=.025, tag='body'):
    bpy.ops.mesh.primitive_cube_add(size=1, location=point(loc))
    o = register(bpy.context.object, name, mat, tag)
    o.scale = (size[0], size[2], size[1])
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    if bevel:
        m = o.modifiers.new('Pressed rounded edges', 'BEVEL')
        m.width = min(bevel, min(size)*.45); m.segments = 2
        bpy.ops.object.modifier_apply(modifier=m.name)
        n = o.modifiers.new('Weighted corner normals', 'WEIGHTED_NORMAL')
        bpy.ops.object.modifier_apply(modifier=n.name)
    return o

def tube(name, pts, radius, mat, tag='body', sides=8):
    cv = bpy.data.curves.new(name, 'CURVE'); cv.dimensions = '3D'
    cv.resolution_u = 1; cv.bevel_depth = radius; cv.bevel_resolution = 1
    cv.resolution_u = 1; cv.use_fill_caps = True
    spline = cv.splines.new('POLY'); spline.points.add(len(pts)-1)
    for v,p in zip(spline.points, pts): v.co = (*point(p), 1)
    o = bpy.data.objects.new(name, cv); asset.objects.link(o)
    o.data.materials.append(M[mat]); o['part'] = tag; parts.append(o)
    return o

def cylinder(name, loc, radius, depth, mat, axis=(1,0,0), tag='body', segments=24):
    bpy.ops.mesh.primitive_cylinder_add(vertices=segments, radius=radius, depth=depth, location=point(loc))
    o = register(bpy.context.object, name, mat, tag)
    o.rotation_euler = point(axis).to_track_quat('Z', 'Y').to_euler()
    for p in o.data.polygons: p.use_smooth = len(p.vertices)==4
    if radius >= .02:
        m=o.modifiers.new('Rolled edge','BEVEL'); m.width=min(.007,depth*.35); m.segments=2
        bpy.ops.object.modifier_apply(modifier=m.name)
    return o

def ellipsoid(name, loc, scale, mat, tag='body'):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=16, ring_count=10, location=point(loc))
    o=register(bpy.context.object,name,mat,tag)
    o.scale=(scale[0],scale[2],scale[1])
    bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    for p in o.data.polygons: p.use_smooth=True
    return o

def text(name, value, loc, size, mat, facing='rear'):
    cv=bpy.data.curves.new(name,'FONT'); cv.body=value; cv.align_x='CENTER'; cv.align_y='CENTER'
    cv.size=size; cv.extrude=0; cv.resolution_u=2
    o=bpy.data.objects.new(name,cv); asset.objects.link(o)
    o.location=point(loc)
    # Font local +Y maps to game +Y, with normal facing the road.
    o.rotation_euler=(math.pi/2,0,0 if facing=='front' else math.pi)
    cv.materials.append(M[mat]); o['part']='body'; parts.append(o)
    return o

BLACK='Midnight black enamel'; YELLOW='Mumbai taxi yellow'; TAR='Tarpaulin black'
CHROME='Chrome'; RUBBER='Rubber'; STEEL='Steel wheel'; FRAME='Chassis'

# Floor, pressed-steel rear tub and engine bay. Actual RE envelope: 2.64 x 1.30 m.
box('Underframe', (0,.35,-.10), (1.12,.12,1.96), FRAME)
box('Passenger floor', (0,.47,-.23), (1.30,.12,1.92), BLACK,.045)
box('Engine housing', (0,.69,-.92), (1.29,.44,.45), BLACK,.08)
box('Rear steel panel', (0,.90,-1.145), (1.30,.57,.10), BLACK,.045)
box('Rear yellow waist rail', (0,1.195,-1.16), (1.32,.11,.085), YELLOW,.02)
for s in [-1,1]:
    box('Rear quarter panel', (s*.636,.87,-.84), (.066,.63,.58), BLACK,.025)
    box('Passenger step', (s*.69,.355,-.16), (.19,.055,.70), FRAME,.02)
    tube('Step edge', [(s*.776,.386,.18),(s*.776,.386,-.49)], .011, CHROME)
    for j in range(3):
        tube('Pressed panel rib', [(s*.674,.78+j*.10,-1.08),(s*.674,.78+j*.10,-.59)], .008, FRAME)
    box('Yellow side belt', (s*.677,1.195,-.87), (.025,.105,.58), YELLOW,.01)

# Curved tapering front leg shield/cowl. The varying ellipse sections form a real shell.
rings=[(.46,.32,.92,.22),(.62,.48,.89,.29),(.87,.59,.855,.33),(1.13,.65,.825,.335),(1.265,.65,.80,.32)]
verts=[]; faces=[]; N=32
for y,w,z,d in rings:
    for i in range(N+1):
        a=-math.pi/2+math.pi*i/N
        # Broad, almost flat nose with rounded corners, as on the gallery auto.
        verts.append((w*math.copysign(abs(math.sin(a))**.48,math.sin(a)),y,
                      z+d*math.copysign(abs(math.cos(a))**.48,math.cos(a))))
for r in range(len(rings)-1):
    for i in range(N):
        a=r*(N+1)+i; b=a+1
        faces.append((a,b,b+N+1,a+N+1))
# A pressed shell, not a solid elliptical volume filling the driver's knees and
# controls. Its open rear exposes the independent handlebar and footwell.
cowl=mesh('Open backed front cowl',verts,faces,BLACK)
solid=cowl.modifiers.new('Pressed steel shell thickness','SOLIDIFY'); solid.thickness=.018
bpy.context.view_layer.objects.active=cowl; bpy.ops.object.modifier_apply(modifier=solid.name)

# Sloping rounded windscreen: an actual open surround and single transparent pane.
def screen_outline(w,h):
    points=[]
    for i in range(64):
        a=2*math.pi*i/64
        x=w*math.copysign(abs(math.cos(a))**.38, math.cos(a))
        v=h*math.copysign(abs(math.sin(a))**.38, math.sin(a))
        points.append((x,1.64+v,.895-.43*v))
    return points
outer=screen_outline(.671,.397); inner=screen_outline(.607,.347)
mesh('Yellow windscreen surround',outer+inner,[(i,(i+1)%64,(i+1)%64+64,i+64) for i in range(64)],YELLOW)
tube('Windscreen rubber gasket',inner+[inner[0]],.017,RUBBER)
glass=mesh('Windscreen glass',inner,[tuple(range(64))],'Window glass',smooth=False)
glass['glass']=True
tube('Windscreen outer rolled edge',outer+[outer[0]],.013,YELLOW)
# Pressed side returns connect the screen frame to the canopy supports. Without
# these narrow yellow cheeks the windshield looked detached in a side view.
for s in [-1,1]:
    cheek=[(s*.642,1.28,1.038),(s*.671,1.64,.895),(s*.615,1.93,.770),
           (s*.579,1.985,.687),(s*.636,1.80,.680),(s*.644,1.28,.786)]
    o=mesh('Yellow A-pillar return',cheek,[tuple(range(6))],YELLOW,smooth=False)
    mod=o.modifiers.new('Folded screen surround','SOLIDIFY'); mod.thickness=.010
    bpy.context.view_layer.objects.active=o; bpy.ops.object.modifier_apply(modifier=mod.name)
tube('Single windscreen wiper',[(.25,1.395,1.039),(.10,1.71,.879)],.010,RUBBER)
tube('Wiper blade',[(.20,1.56,.948),(-.045,1.90,.792)],.013,RUBBER)

# Supplied real auto front: broad yellow indicator band, two round lamps in
# moulded black pods, recessed centre vents and a black wheel mudguard.
box('Yellow windscreen sill',(0,1.268,1.079),(1.29,.147,.080),YELLOW,.024)
for s in [-1,1]:
    box('Indicator seal',(s*.451,1.267,1.125),(.259,.074,.015),RUBBER,.019,'front_lamps')
    box('Amber front indicator',(s*.474,1.267,1.136),(.187,.050,.013),'Amber lens',.013,'front_lamps')
    box('Indicator clear end',(s*.363,1.267,1.137),(.045,.049,.014),'Headlamp lens',.012,'front_lamps')
    pod=box('Sculpted headlamp pod',(s*.438,1.059,1.16),(.379,.276,.115),BLACK,.056,'front_lamps')
    pod.rotation_euler.y=s*.07
    cylinder('Headlamp rubber socket',(s*.453,1.055,1.224),.111,.045,RUBBER,(0,0,1),'front_lamps',32)
    cylinder('Headlamp chrome bezel',(s*.453,1.055,1.251),.097,.019,CHROME,(0,0,1),'front_lamps',32)
    cylinder('Round headlamp reflector',(s*.453,1.055,1.263),.083,.011,'Headlamp lens',(0,0,1),'front_lamps',32)
    for i in range(-3,4):
        h=math.sqrt(max(0,.077**2-(i*.020)**2))
        tube('Fluted headlamp lens',[(s*.453+i*.020,1.055-h,1.270),(s*.453+i*.020,1.055+h,1.270)],.0018,'Lettering cream','front_lamps')
    for x,y in [(s*.282,1.15),(s*.588,1.15),(s*.282,.97)]:
        cylinder('Lamp pod fastener',(x,y,1.224),.006,.006,CHROME,(0,0,1),'front_lamps',8)
    tube('Pressed cowl cheek',[(s*.58,1.00,1.14),(s*.43,.91,1.183),(s*.34,.74,1.184),(s*.33,.53,1.105)],.009,FRAME)
box('Centre service panel',(0,.992,1.197),(.287,.341,.027),FRAME,.057)
for i in range(4): box('Front cooling slot',(0,.891+i*.033,1.218),(.155,.014,.009),RUBBER,.004)
box('Original BR nose badge',(0,1.080,1.219),(.089,.072,.012),CHROME,.014)
box('Nose badge inset',(0,1.080,1.227),(.070,.054,.006),RUBBER,.009)
text('Nose badge letters','BR',(0,1.080,1.233),.033,'Lettering cream',facing='front')
box('Front registration plate',(0,1.244,1.142),(.25,.083,.014),YELLOW,.007)
text('Front registration','MH 02',(0,1.244,1.154),.040,RUBBER,facing='front')

# Gently crowned fabric canopy, substantially flatter than the previous semicircle.
roof=[]; faces=[]; nx=24; nz=16
for j in range(nz+1):
    t=j/nz; z=-1.185+1.855*t
    for i in range(nx+1):
        u=-1+2*i/nx
        y=1.825+.237*math.sqrt(max(0,1-u*u))-.028*(2*t-1)**6
        roof.append((u*(.706-.042*t**5),y,z))
for j in range(nz):
    for i in range(nx):
        k=j*(nx+1)+i; faces.append((k,k+1,k+nx+2,k+nx+1))
canopy=mesh('Canopy',roof,faces,TAR,'canopy'); canopy['cabinRoof']=True
solid=canopy.modifiers.new('Canvas thickness','SOLIDIFY'); solid.thickness=.013
bpy.context.view_layer.objects.active=canopy
bpy.ops.object.modifier_apply(modifier=solid.name)
for j,z in enumerate([-.98,-.25,.57]):
    pts=[]
    for i in range(25):
        u=-1+2*i/24
        pts.append((u*.704,1.833+.237*math.sqrt(max(0,1-u*u)),z))
    tube('Canopy stitched seam',pts,.004,'Chassis','canopy')
for s in [-1,1]:
    tube('Canopy edge binding',[(s*.706,1.827,-1.17),(s*.706,1.84,-.35),(s*.665,1.813,.67)],.014,RUBBER,'canopy')
    mesh('Rear canvas side',[(s*.69,1.23,-1.17),(s*.706,1.83,-1.17),(s*.704,1.85,-.59),(s*.69,1.23,-.59)],[(0,1,2,3)],TAR,smooth=False)
    tube('Rear curtain welt',[(s*.715,1.21,-.59),(s*.719,1.81,-.59)],.012,RUBBER)
    for y in [1.27,1.50,1.73]:
        ellipsoid('Canvas press stud',(s*.72,y,-.60),(.012,.012,.012),CHROME)
    tube('Front roof pillar',[(s*.626,.59,.65),(s*.638,1.27,.59),(s*.615,1.82,.67),(s*.575,1.945,.68)],.023,YELLOW)
    tube('Passenger grab rail',[(s*.626,.53,-.50),(s*.65,1.24,-.50),(s*.674,1.85,-.52)],.019,CHROME)
    tube('Rear passenger safety rail',[(s*.68,1.15,-1.08),(s*.68,1.15,-.47)],.017,CHROME)

# Rear canvas frame leaves a real window aperture.
box('Rear canvas lower',(0,1.315,-1.19),(1.37,.18,.027),TAR,.014)
# Follow the roof crown instead of putting a rectangular slab above its corners.
rear_top=[(-.67,1.80,-1.184),(.67,1.80,-1.184)]
for i in range(25):
    u=1-2*i/24
    rear_top.append((u*.70,1.80+.236*math.sqrt(max(0,1-u*u)),-1.184))
mesh('Rear canvas top',rear_top,[tuple(range(len(rear_top)))],TAR,smooth=False)
for s in [-1,1]: box('Rear canvas side frame',(s*.584,1.60,-1.19),(.20,.48,.028),TAR,.022)
box('Rear window',(0,1.60,-1.20),(.978,.371,.014),'Window glass',.025)
for y in [1.398,1.80]: tube('Rear window trim',[(-.49,y,-1.215),(.49,y,-1.215)],.014,RUBBER)
for s in [-1,1]: tube('Rear window trim',[(s*.49,1.40,-1.215),(s*.49,1.80,-1.215)],.014,RUBBER)

# Interior bench, separate driver seat, handlebar controls and fare meter.
box('Rear bench base',(0,.81,-.80),(1.13,.19,.50),'Warm vinyl',.07)
box('Rear bench back',(0,1.105,-1.038),(1.13,.47,.115),'Warm vinyl',.05)
for x in [-.38,-.19,0,.19,.38]:
    tube('Bench stitched channel',[(x,.912,-.59),(x,.917,-.97),(x,1.28,-.970)],.004,'Seat piping')
tube('Bench front piping',[(-.52,.86,-.546),(.52,.86,-.546)],.008,'Seat piping')
box('Driver seat pedestal',(0,.62,.17),(.46,.24,.41),BLACK,.045)
box('Driver saddle',(0,.802,.15),(.53,.135,.45),'Warm vinyl',.068)
box('Driver back pad',(0,.999,-.042),(.49,.29,.07),'Warm vinyl',.032)
box('Lower dashboard shelf',(0,1.098,.835),(1.13,.075,.33),'Dashboard moulding',.03,'dashboard')
box('Centre storage lid',(0,1.205,.927),(.48,.082,.20),'Dashboard moulding',.04,'dashboard')
for s in [-1,1]:
    tube('Inner leg shield edge',[(s*.56,.54,.89),(s*.63,1.20,.80)],.012,RUBBER)
    mesh('Moulded dashboard wing',[(s*.23,1.095,.75),(s*.34,1.18,.92),(s*.58,1.19,.86),(s*.60,1.01,.61),(s*.33,.987,.61)],[(0,1,2,3,4)],'Dashboard moulding','dashboard')
    box('Dash pocket recess',(s*.425,1.137,.807),(.18,.016,.105),RUBBER,.015,'dashboard')
    tube('Pocket lip',[(s*.33,1.127,.74),(s*.53,1.127,.74)],.010,'Dashboard moulding','dashboard')
tube('Continuous steering stem',[(0,.58,.95),(0,.73,.83),(0,.91,.74),(0,1.222,.589)],.032,FRAME,'steering_column')
tube('Fork crown',[(-.124,.72,.83),(0,.73,.83),(.124,.72,.83)],.028,FRAME,'steering_column')
box('Handlebar clamp',(0,1.207,.585),(.11,.056,.068),FRAME,.012)
tube('Handlebar',[(-.35,1.2,.46),(-.22,1.23,.57),(0,1.21,.59),(.22,1.23,.57),(.35,1.2,.46)],.019,CHROME)
for s in [-1,1]:
    tube('Rubber handle grip',[(s*.245,1.211,.514),(s*.359,1.20,.452)],.027,RUBBER)
    tube('Brake lever',[(s*.25,1.185,.52),(s*.35,1.174,.54)],.009,CHROME)
    box('Handlebar switch housing',(s*.235,1.221,.551),(.058,.053,.07),RUBBER,.013)
    box('Indicator switch',(s*.235,1.251,.54),(.021,.012,.022),'Lettering cream',.003)
    tube('Control cable',[(s*.24,1.20,.57),(s*.17,1.09,.65),(s*.10,.71,.70)],.006,RUBBER)
# A readable gauge pod mounted ON the steering head, tilted toward the driver.
# Build it flat, then tilt its semantic parent; the independent needle rotates in
# the local dial plane at runtime and does not need to rebuild any geometry.
gauge_centre=(0,1.31,.59)
box('Instrument mounting neck',(0,1.26,.592),(.075,.10,.07),FRAME,.016)
cylinder('Instrument pod',(0,1.299,.59),.107,.062,FRAME,(0,1,0),'gauge',32)
cylinder('Speedometer bezel',(0,1.331,.59),.097,.018,CHROME,(0,1,0),'gauge',32)
cylinder('Speedometer face',(0,1.342,.59),.087,.008,RUBBER,(0,1,0),'gauge',32)
for i in range(41):
    # Driver looks toward +Z: positive game X is on the dial's screen-left.
    a=2.35-i*4.7/40; major=i%5==0
    tube('Speedometer tick',[(math.sin(a)*(.064 if major else .073),1.348,.59+math.cos(a)*(.064 if major else .073)),(math.sin(a)*.081,1.348,.59+math.cos(a)*.081)],.002 if major else .001,'Lettering cream','gauge')
    if i%10==0:
        label=text('Dial speed',str(i*2),(math.sin(a)*.052,1.349,.59+math.cos(a)*.052),.018,'Lettering cream')
        label.rotation_euler=(0,0,math.pi); label['part']='gauge'
label=text('Dial units','km/h',(0,1.349,.56),.016,'Lettering cream'); label.rotation_euler=(0,0,math.pi); label['part']='gauge'
mesh('Working gauge needle',[(-.004,1.355,.577),(.004,1.355,.577),(0,1.355,.663)],[(0,1,2)],'Amber lens','gauge_needle',False)
cylinder('Gauge centre',(0,1.358,.59),.009,.006,CHROME,(0,1,0),'gauge',12)
for s in [-1,1]:
    cylinder('Dashboard status light',(s*.145,1.143,.823),.012,.010,'CNG green' if s<0 else 'Amber lens',(0,1,0),segments=12)
box('Ignition switch',(.19,1.122,.687),(.07,.048,.04),FRAME,.009)
cylinder('Key barrel',(.19,1.122,.661),.015,.009,CHROME,(0,0,1),segments=12)
for x in [-.31,.31]:
    for j in range(5):
        box('Dashboard vent',(x+j*.026,1.14,.85),(.013,.005,.07),RUBBER,.001)
# Seat-back partition: its front face touches the back pad. The side rods tie it
# into the canopy, as in the gallery, while leaving the passenger doors open.
box('Driver passenger partition',(0,.79,-.11),(1.19,.55,.065),BLACK,.026,'partition')
box('Partition padded top',(0,1.075,-.11),(1.21,.07,.085),RUBBER,.025,'partition')
for s in [-1,1]:
    tube('Partition roof support',[(s*.59,.51,-.11),(s*.62,1.12,-.11),(s*.64,1.92,-.11)],.023,CHROME,'partition')
tube('Passenger grab bar',[(-.62,1.19,-.11),(.62,1.19,-.11)],.018,CHROME,'partition')
box('Meter mounting foot',(-.38,1.113,-.13),(.14,.055,.10),FRAME,.009,'fare_meter')
box('Fare meter',(-.38,1.242,-.145),(.25,.20,.15),FRAME,.018,'fare_meter')
box('Fare LCD',(-.38,1.250,-.226),(.199,.075,.008),'Meter screen',.004,'fare_meter')
text('Fare display','23.00',(-.38,1.25,-.234),.046,RUBBER)['part']='fare_meter'
text('Meter label','FARE',(-.38,1.311,-.233),.023,'Lettering cream')['part']='fare_meter'
for x in [-.455,-.415,-.375]:
    cylinder('Meter button',(x,1.176,-.226),.011,.008,RUBBER,(0,0,1),'fare_meter',12)
for s in [-1,1]:
    tube('Mirror stalk',[(s*.60,1.40,.66),(s*.82,1.54,.68),(s*.85,1.65,.66)],.012,CHROME)
    ellipsoid('Mirror housing',(s*.855,1.682,.67),(.104,.12,.04),RUBBER)
    ellipsoid('Mirror silver',(s*.855,1.682,.636),(.087,.102,.008),CHROME)

# Three independent rolling groups with proper axle centres and tire profiles.
wheel_centres={'wheel_rear_left':(-.635,.265,-.78),'wheel_rear_right':(.635,.265,-.78),'wheel_front':(0,.265,1.015)}
for tag,centre in wheel_centres.items():
    cx,cy,cz=centre
    profile=[(-.092,.173),(-.09,.223),(-.065,.253),(-.032,.265),(.032,.265),(.065,.253),(.09,.223),(.092,.173)]
    vv=[]; ff=[]; steps=32
    for x,r in profile:
        for i in range(steps):
            a=2*math.pi*i/steps; vv.append((cx+x,cy+r*math.sin(a),cz+r*math.cos(a)))
    for j in range(len(profile)-1):
        for i in range(steps):
            k=j*steps+i; ff.append((k,j*steps+(i+1)%steps,(j+1)*steps+(i+1)%steps,k+steps))
    mesh('Pneumatic tire',vv,ff,RUBBER,tag)
    for s in [-1,1]:
        cylinder('Pressed steel rim',(cx+s*.090,cy,cz),.171,.015,STEEL,tag=tag)
        cylinder('Wheel dish',(cx+s*.104,cy,cz),.112,.025,FRAME,tag=tag)
        cylinder('Wheel hub',(cx+s*.126,cy,cz),.059,.032,STEEL,tag=tag)
        for j in range(5):
            a=j*2*math.pi/5
            cylinder('Wheel bolt',(cx+s*.132,cy+.082*math.sin(a),cz+.082*math.cos(a)),.010,.008,CHROME,tag=tag,segments=6)
    for i in range(32):
        a=2*math.pi*i/32
        tube('Tire tread',[(cx-.047,cy+.263*math.sin(a-.018),cz+.263*math.cos(a-.018)),(cx+.047,cy+.263*math.sin(a+.018),cz+.263*math.cos(a+.018))],.003,FRAME,tag)

def mudguard(name,cx,cy,cz,width,radius,mat):
    vv=[]; ff=[]; count=24
    for j,x in enumerate([-width/2,0,width/2]):
        for i in range(count+1):
            a=-.28+(math.pi+.56)*i/count
            r=radius+(.025 if j==1 else 0)
            vv.append((cx+x,cy+r*math.sin(a),cz+r*math.cos(a)))
    for j in range(2):
        for i in range(count):
            k=j*(count+1)+i; ff.append((k,k+1,k+count+2,k+count+1))
    o=mesh(name,vv,ff,mat)
    m=o.modifiers.new('Steel thickness','SOLIDIFY'); m.thickness=.012
    bpy.context.view_layer.objects.active=o; bpy.ops.object.modifier_apply(modifier=m.name)
mudguard('Front sweeping mudguard',0,.265,1.015,.35,.315,BLACK)
for s in [-1,1]:
    mudguard('Rear wheel arch',s*.635,.265,-.78,.245,.313,BLACK)
    box('Rear mudflap',(s*.63,.25,-1.07),(.205,.29,.026),RUBBER,.008)
    tube('Front fork',[(s*.124,.28,1.015),(s*.124,.72,.83)],.025,CHROME)
    coil=[]
    for i in range(65):
        t=i/64; a=t*math.pi*16
        coil.append((s*.124+.039*math.cos(a),.40+t*.24+.015*math.sin(a),.965-t*.096+.034*math.sin(a)))
    tube('Front suspension spring',coil,.007,FRAME)
tube('Rear bumper',[(-.67,.48,-1.19),(-.60,.44,-1.26),(.60,.44,-1.26),(.67,.48,-1.19)],.026,CHROME)
cylinder('Rear axle',(0,.29,-.78),.045,1.28,FRAME)

# Rear identifiers and practical street details.
box('Rear number plate',(0,.642,-1.213),(.45,.12,.019),YELLOW,.005)
text('Rear registration','MH 02 DK 7860',(0,.644,-1.225),.054,RUBBER)
text('Horn lettering','HORN OK PLEASE',(0,1.06,-1.203),.062,'Lettering cream')
box('CNG decal',(.405,.875,-1.204),(.20,.105,.008),'CNG green',.005)
text('CNG lettering','CNG',(.405,.878,-1.212),.054,'Lettering cream')
for i in range(5):
    box('Engine cooling louvre',(-.17,.76+i*.043,-1.203),(.38,.018,.018),FRAME,.004)
for s in [-1,1]:
    box('Tail lamp housing',(s*.542,.747,-1.203),(.137,.233,.044),RUBBER,.022)
    box('Rear red lamp',(s*.542,.71,-1.23),(.11,.118,.015),'Red lens',.014)
    box('Rear indicator',(s*.542,.811,-1.23),(.11,.063,.015),'Amber lens',.01)
    cylinder('Rear reflector',(s*.535,.516,-1.224),.032,.009,'Red lens',(0,0,1),segments=12)

# Seated driver sized to the new cabin; all parts hide together for first person.
ellipsoid('Driver torso',(0,1.125,.115),(.217,.30,.148),'Khaki cotton','driver')
ellipsoid('Driver head',(0,1.542,.18),(.125,.16,.121),'Skin','driver')
ellipsoid('Driver hair',(0,1.643,.157),(.126,.072,.116),'Hair','driver')
ellipsoid('Driver nose',(0,1.526,.294),(.032,.041,.03),'Skin','driver')
for s in [-1,1]:
    ellipsoid('Driver ear',(s*.121,1.535,.18),(.019,.039,.025),'Skin','driver')
    tube('Driver upper arm',[(s*.185,1.32,.14),(s*.261,1.12,.32)],.067,'Khaki cotton','driver')
    tube('Driver forearm',[(s*.261,1.12,.32),(s*.31,1.198,.462)],.047,'Skin','driver')
    ellipsoid('Driver hand',(s*.313,1.20,.469),(.054,.044,.052),'Skin','driver')
    tube('Driver trouser leg',[(s*.13,.85,.22),(s*.20,.74,.48),(s*.18,.52,.51)],.071,'Khaki cotton','driver')
    ellipsoid('Driver shoe',(s*.18,.512,.568),(.079,.046,.13),RUBBER,'driver')

# Convert/apply, then merge by material and semantic part for low draw-call cost.
bpy.ops.object.select_all(action='DESELECT')
for o in parts: o.select_set(True)
bpy.context.view_layer.objects.active=parts[0]
bpy.ops.object.convert(target='MESH')
groups={}
for o in list(asset.objects):
    if o.type=='MESH': groups.setdefault((o.get('part','body'),o.data.materials[0].name),[]).append(o)
for (tag,mat),objs in groups.items():
    bpy.ops.object.select_all(action='DESELECT')
    for o in objs: o.select_set(True)
    bpy.context.view_layer.objects.active=objs[0]
    if len(objs)>1: bpy.ops.object.join()
    o=bpy.context.object; o.name=tag+'__'+mat
    o['part']=tag
    if tag=='canopy': o['cabinRoof']=True
    if tag=='driver': o['driver']=True
    bpy.ops.object.transform_apply(location=False,rotation=True,scale=True)

for tag,centre in wheel_centres.items():
    pivot=bpy.data.objects.new(tag,None); asset.objects.link(pivot)
    pivot.location=point(centre); pivot['wheelRadius']=.265
    bpy.context.view_layer.update()
    for o in list(asset.objects):
        if o.type=='MESH' and o.get('part')==tag:
            world=o.matrix_world.copy(); o.parent=pivot; o.matrix_world=world

gauge=bpy.data.objects.new('speedometer_gauge',None); asset.objects.link(gauge)
gauge.location=point(gauge_centre)
needle=bpy.data.objects.new('speedometer_needle',None); asset.objects.link(needle)
needle.parent=gauge
bpy.context.view_layer.update()
for o in list(asset.objects):
    if o.type=='MESH' and o.get('part') in ['gauge','gauge_needle']:
        world=o.matrix_world.copy(); o.parent=needle if o.get('part')=='gauge_needle' else gauge; o.matrix_world=world
gauge.rotation_euler.x=-.55
# Blender Z corresponds to game Y. This is the 0 km/h end of the printed scale.
needle.rotation_euler.z=2.35

scene['asset']='Original Mumbai kaali-peeli auto rickshaw'
scene['reference']='ref vech/auto front.png; ref vech/auto side.png; ref vech/auto.png'
scene['axis_contract']='GLB: Y up, +Z forward, metres, ground at Y=0'
scene['authorship']='Original procedural Blender mesh created for Bap ka Rasta; no third-party mesh or textures.'
bpy.ops.object.select_all(action='DESELECT')
for o in asset.objects: o.select_set(True)
glb=ROOT/'public/models/mumbai-auto.glb'
glb.parent.mkdir(parents=True,exist_ok=True)
bpy.ops.export_scene.gltf(filepath=str(glb),export_format='GLB',use_selection=True,use_active_scene=True,export_extras=True,export_yup=True,export_apply=True,export_texcoords=False)
triangles=sum(sum(len(p.vertices)-2 for p in o.data.polygons) for o in asset.objects if o.type=='MESH')
stats={'triangles':triangles,'meshes':sum(o.type=='MESH' for o in asset.objects),'bytes':glb.stat().st_size,'wheel_radius':.265,'source':'original Blender geometry','front':'+Z','up':'+Y',
       'references':['ref vech/auto front.png','ref vech/auto side.png','ref vech/auto.png','ref vech/auto interior dashboard.png'],
       'features':['twin round headlamps','pressed open-backed cowl','black front mudguard','driver-passenger partition','passenger-facing rear fare meter','working speedometer','independent wheel pivots']}
(OUT/'model-stats.json').write_text(json.dumps(stats,indent=2)+'\n')

# A separate studio collection remains editable in the source, and is excluded from GLB.
studio=bpy.data.collections.new('Studio | not exported'); scene.collection.children.link(studio)
def studio_link(o):
    for c in list(o.users_collection): c.objects.unlink(o)
    studio.objects.link(o)
bpy.ops.mesh.primitive_plane_add(size=200,location=(0,0,-.012))
ground=bpy.context.object; ground.name='Studio floor'; studio_link(ground)
ground.data.materials.append(material('Studio warm grey','666b6c',.88))
for name,loc,energy,size in [('Key',(3,-4,6),650,5),('Fill',(-4,-2,3),450,4),('Rim',(1,4,5),850,3)]:
    bpy.ops.object.light_add(type='AREA',location=loc)
    light=bpy.context.object; light.name=name; light.data.energy=energy; light.data.shape='DISK'; light.data.size=size
    light.rotation_euler=(Vector((0,0,1))-light.location).to_track_quat('-Z','Y').to_euler(); studio_link(light)
bpy.ops.object.camera_add(location=(3.4,-4.8,2.6))
camera=bpy.context.object; camera.name='Auto studio camera'; studio_link(camera)
camera.rotation_euler=(Vector((0,0,1.02))-camera.location).to_track_quat('-Z','Y').to_euler()
camera.data.type='ORTHO'; camera.data.ortho_scale=4.05; scene.camera=camera
scene.world=bpy.data.worlds.new('Soft studio environment'); scene.world.use_nodes=True
scene.world.node_tree.nodes['Background'].inputs[0].default_value=(.35,.39,.42,1)
scene.world.node_tree.nodes['Background'].inputs[1].default_value=.55
scene.render.resolution_x=1280; scene.render.resolution_y=960; scene.render.resolution_percentage=100
scene.render.image_settings.file_format='PNG'
scene.render.filepath=str(ROOT/'output/playwright/rickshaw/blender-front.png')
bpy.ops.object.select_all(action='DESELECT')
for o in asset.objects: o.select_set(True)
for area in bpy.context.screen.areas:
    if area.type=='VIEW_3D':
        area.spaces.active.region_3d.view_perspective='CAMERA'
        area.spaces.active.shading.type='MATERIAL'
# Write only this vehicle scene, excluding other projects open in Blender.
bpy.data.libraries.write(str(OUT/'mumbai-auto.blend'),{scene},fake_user=True,compress=True)
print(json.dumps(stats))
