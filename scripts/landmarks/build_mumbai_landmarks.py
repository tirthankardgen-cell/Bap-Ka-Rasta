"""Build an original Mumbai architectural library in the OPEN Blender session.

First run make_materials.py and export_layout.mts. Execute with blender_bridge.py,
or Blender --background --factory-startup --python this_file. Metres throughout.
Only this generator's named scene is replaced. Other open scenes are preserved.
"""
import bpy
import json
import math
import random
from contextlib import contextmanager
from pathlib import Path
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'assets/architecture/mumbai'
RUNTIME = ROOT / 'public/models'
LAYOUT = json.loads((OUT / 'layout.json').read_text())
NAME = 'Mumbai | Landmark Districts'
TAU = math.tau

# Preserve the open unsaved scene before adding an independently named city scene.
if bpy.data.is_dirty and not bpy.data.scenes.get(NAME):
    backup = ROOT / 'output/playwright/blender-before-mumbai.blend'
    backup.parent.mkdir(parents=True, exist_ok=True)
    bpy.ops.wm.save_as_mainfile(filepath=str(backup), copy=True)
old = bpy.data.scenes.get(NAME)
if old:
    for obj in list(old.objects):
        bpy.data.objects.remove(obj, do_unlink=True)
    bpy.data.scenes.remove(old)
scene = bpy.data.scenes.new(NAME)
bpy.context.window.scene = scene
scene.unit_settings.system = 'METRIC'
scene.unit_settings.scale_length = 1
scene.render.engine = 'BLENDER_EEVEE'
scene.eevee.use_gtao = True
scene.eevee.gtao_distance = 4
scene.eevee.gtao_factor = 1.2
scene.eevee.taa_render_samples = 48
scene.view_settings.view_transform = 'Filmic'
scene.view_settings.look = 'Medium High Contrast'
scene.world = bpy.data.worlds.new('Mumbai warm daylight')
scene.world.use_nodes = True
scene.world.node_tree.nodes['Background'].inputs[0].default_value = (.55, .65, .75, 1)
scene.world.node_tree.nodes['Background'].inputs[1].default_value = .65


def point(p):
    return (p[0], -p[2], p[1])


def linear(hex_color):
    rgb = [int(hex_color[i:i+2], 16)/255 for i in (0, 2, 4)]
    return [v/12.92 if v <= .04045 else ((v+.055)/1.055)**2.4 for v in rgb]


M = {}
def material(name, color='ffffff', roughness=.82, metallic=0, texture=None, emission=0):
    mat = bpy.data.materials.new('Mumbai | ' + name)
    mat.use_nodes = True
    mat.diffuse_color = (*linear(color), 1)
    bsdf = mat.node_tree.nodes.get('Principled BSDF')
    bsdf.inputs['Base Color'].default_value = (*linear(color), 1)
    bsdf.inputs['Roughness'].default_value = roughness
    bsdf.inputs['Metallic'].default_value = metallic
    if emission:
        bsdf.inputs['Emission'].default_value = (*linear(color), 1)
        bsdf.inputs['Emission Strength'].default_value = emission
    if texture:
        for channel in ('color', 'normal'):
            tex = mat.node_tree.nodes.new('ShaderNodeTexImage')
            tex.image = bpy.data.images.load(str(OUT / 'textures' / (texture + '-' + channel + '.png')), check_existing=True)
            tex.image.pack()
            tex.extension = 'REPEAT'
            if channel == 'normal':
                tex.image.colorspace_settings.name = 'Non-Color'
                normal = mat.node_tree.nodes.new('ShaderNodeNormalMap')
                normal.inputs['Strength'].default_value = .45
                mat.node_tree.links.new(tex.outputs['Color'], normal.inputs['Color'])
                mat.node_tree.links.new(normal.outputs['Normal'], bsdf.inputs['Normal'])
            else:
                mat.node_tree.links.new(tex.outputs['Color'], bsdf.inputs['Base Color'])
    M[name] = mat


for surface in ('sandstone', 'limestone', 'basalt', 'redstone', 'terracotta', 'plaster', 'paving'):
    material(surface, texture=surface)
for name, color, rough, metal in [
    ('glass', '3d5961', .23, .35), ('glass-light', '6c8790', .24, .3),
    ('iron', '303f41', .5, .7), ('bronze', 'a68e61', .48, .55),
    ('timber', '603e2e', .82, 0), ('shade', '192b2c', .95, 0),
    ('leaf', '486448', .95, 0), ('leaf-light', '657a4e', .95, 0),
    ('red', '962f25', .76, 0), ('green', '234f47', .78, 0),
    ('blue', '3d6875', .75, 0), ('ochre', 'c68c37', .8, 0),
    ('cream', 'eddfb7', .7, 0), ('water', '467a7b', .18, .3),
]:
    material(name, color, rough, metal)
material('lamp', 'ffe0a0', .3, .1, emission=.6)


class Builder:
    """Accumulate geometry by material: bounded draw calls, named near/far groups."""
    def __init__(self, site):
        self.site = site
        self.data = {}
        self.rng = random.Random(site['id'])
        self.transforms = []

    @contextmanager
    def frame(self, x=0, y=0, z=0, yaw=0):
        """Place reusable facade details on any side, in the game's +Y-up axes."""
        self.transforms.append((x,y,z,math.cos(yaw),math.sin(yaw)))
        try:
            yield
        finally:
            self.transforms.pop()

    def mesh(self, verts, faces, mat, detail=False, smooth=False, lods=None):
        for x,y,z,c,s in reversed(self.transforms):
            verts=[(vx*c+vz*s+x,vy+y,-vx*s+vz*c+z) for vx,vy,vz in verts]
        for lod in lods or (('near',) if detail else ('near', 'far')):
            data = self.data.setdefault((lod, mat), [[], [], [], []])
            offset = len(data[0])
            data[0].extend(verts)
            data[1].extend(tuple(offset+i for i in face) for face in faces)
            data[2].extend([smooth]*len(faces))
            # Planar metre-space UVs keep masonry scale consistent across buildings.
            for face in faces:
                p = [Vector(verts[i]) for i in face]
                n = (p[1]-p[0]).cross(p[2]-p[0])
                major = max(range(3), key=lambda k: abs(n[k]))
                axes = [i for i in range(3) if i != major]
                data[3].append([(v[axes[0]]/4, v[axes[1]]/4) for v in p])

    def box(self, x, y, z, w, h, d, mat='sandstone', detail=False):
        verts = [(x+sx*w/2, y+sy*h/2, z+sz*d/2) for sx,sy,sz in
                 [(-1,-1,-1),(1,-1,-1),(1,1,-1),(-1,1,-1),(-1,-1,1),(1,-1,1),(1,1,1),(-1,1,1)]]
        self.mesh(verts, [(0,3,2,1),(4,5,6,7),(0,1,5,4),(3,7,6,2),(0,4,7,3),(1,2,6,5)], mat, detail)

    def lathe(self, x, z, profile, mat='sandstone', segments=24, detail=False):
        for lod in ('near',) if detail else ('near','far'):
            count=segments if lod=='near' or segments<20 else max(12,segments//3)
            verts = [(x+r*math.cos(i*TAU/count), y, z+r*math.sin(i*TAU/count)) for r,y in profile for i in range(count)]
            faces=[]
            for j in range(len(profile)-1):
                for i in range(count):
                    k=j*count+i; nxt=j*count+(i+1)%count
                    faces.append((k,k+count,nxt+count,nxt))
            faces.extend([tuple(reversed(range(count))), tuple((len(profile)-1)*count+i for i in range(count))])
            self.mesh(verts,faces,mat,smooth=segments>=20,lods=(lod,))

    def cylinder(self, x, y, z, r, h, mat='limestone', segments=16, detail=False):
        self.lathe(x,z,[(r,y-h/2),(r,y+h/2)],mat,segments,detail)

    def dome(self, x, y, z, r, h, mat='terracotta', detail=False):
        profile=[(r*.95,y),(r,y+.07*h),(r*.96,y+.22*h),(r*.80,y+.48*h),(r*.57,y+.69*h),(r*.28,y+.86*h),(r*.10,y+.96*h),(0,y+h)]
        self.lathe(x,z,profile,mat,32,detail)

    def beam(self, a, b, width, mat='iron', detail=True):
        start,end=Vector(a),Vector(b); axis=(end-start).normalized()
        ref=Vector((0,1,0)) if abs(axis.y)<.95 else Vector((1,0,0))
        u=axis.cross(ref).normalized()*width/2; v=axis.cross(u).normalized()*width/2
        verts=[tuple(p+u*su+v*sv) for p in (start,end) for su,sv in [(-1,-1),(1,-1),(1,1),(-1,1)]]
        self.mesh(verts,[(0,3,2,1),(4,5,6,7),(0,1,5,4),(1,2,6,5),(2,3,7,6),(3,0,4,7)],mat,detail)

    def arch(self, x, y, z, width, height, depth=.45, mat='limestone', detail=True, thickness=.4):
        r=width/2; inner=max(.1,r-thickness); spring=y+height-r
        self.box(x-r+thickness/2,(y+spring)/2,z,thickness,spring-y,depth,mat,detail)
        self.box(x+r-thickness/2,(y+spring)/2,z,thickness,spring-y,depth,mat,detail)
        for i in range(16):
            a=i*math.pi/16+.008; b=(i+1)*math.pi/16-.008
            verts=[(x+rr*math.cos(t),spring+rr*math.sin(t),z+zz) for zz in (-depth/2,depth/2) for rr,t in [(inner,a),(r,a),(r,b),(inner,b)]]
            self.mesh(verts,[(0,3,2,1),(4,5,6,7),(0,1,5,4),(1,2,6,5),(2,3,7,6),(3,0,4,7)],mat,detail)

    def window(self, x, y, z, w=2.3, h=3.4, arch=True, frame='limestone', detail=True, glazed=True):
        # Recessed dark pane, projecting carved surround, sill and mullions.
        def pane(px,py,pz,pw,ph,mat):
            if not arch:
                self.mesh([(px-pw/2,py,pz),(px+pw/2,py,pz),(px+pw/2,py+ph,pz),(px-pw/2,py+ph,pz)],[(0,1,2,3)],mat)
                return
            r=pw/2; spring=py+ph-r
            verts=[(px-r,py,pz),(px+r,py,pz)]+[(px+r*math.cos(i*math.pi/16),spring+r*math.sin(i*math.pi/16),pz) for i in range(17)]
            # Keep the inexpensive window silhouette in the distant LOD too.
            self.mesh(verts,[tuple(range(len(verts)))],mat)
        pane(x,y,z,w,h,'shade')
        if arch:
            self.arch(x,y-.12,z+.15,w+.48,h+.30,.32,frame,detail,.26)
        else:
            self.box(x,y+h+.1,z+.1,w+.45,.23,.35,frame,detail)
            for side in (-1,1): self.box(x+side*(w/2+.12),y+h/2,z+.1,.22,h,.35,frame,detail)
        if glazed:
            pane(x,y+.12,z+.12,w*.83,h-.30,'glass')
            self.box(x,y+h*.45,z+.20,w,.065,.12,frame,detail)
            self.box(x,y+h/2,z+.21,.075,h,.13,frame,detail)
        self.box(x,y-.16,z+.20,w+.65,.25,.65,frame,detail)

    def facade(self,x,z,yaw,width,levels,step=6,window_h=3.5,arched=True,frame='limestone'):
        with self.frame(x=x,z=z,yaw=yaw):
            count=max(1,int(width/step))
            for y in levels:
                self.box(0,y-.6,.12,width,.3,.65,frame,True)
                for i in range(count):
                    xx=(i-(count-1)/2)*step
                    self.window(xx,y,.05,min(step*.55,4.2),window_h,arched,frame)

    def radial_windows(self,x,z,r,y,w,h,count=8,glazed=True):
        for i in range(count):
            a=(i+.5)*TAU/count
            with self.frame(x=x+math.sin(a)*r,z=z+math.cos(a)*r,yaw=a):
                self.window(0,y,.04,w,h,glazed=glazed)

    def gothic_window(self,x,y,z,w,h):
        spring=y+h-w*.7
        verts=[(x-w/2,y,z),(x+w/2,y,z),(x+w/2,spring,z),(x,y+h,z),(x-w/2,spring,z)]
        self.mesh(verts,[(0,1,2,3,4)],'glass')
        for side in (-1,1):
            self.box(x+side*(w/2+.16),(y+spring)/2,z+.14,.28,spring-y,.4,'limestone',True)
            self.beam((x+side*(w/2+.1),spring,z+.2),(x,y+h+.25,z+.2),.32,'limestone')
        self.box(x,y-.18,z+.18,w+.8,.28,.75,'limestone',True)
        self.box(x,y+h*.36,z+.18,.12,h*.72,.2,'limestone',True)
        self.box(x,y+h*.42,z+.17,w,.14,.21,'limestone',True)

    def rose_window(self,x,y,z,r):
        self.mesh([(x,y,z)]+[(x+r*math.cos(i*TAU/40),y+r*math.sin(i*TAU/40),z) for i in range(40)],[(0,i+1,(i+1)%40+1) for i in range(40)],'glass')
        for i in range(16):
            a=i*TAU/16; c=(i+1)*TAU/16
            self.beam((x+r*math.cos(a),y+r*math.sin(a),z+.1),(x+r*math.cos(c),y+r*math.sin(c),z+.1),.24,'limestone')
            if i%2==0: self.beam((x,y,z+.12),(x+r*math.cos(a),y+r*math.sin(a),z+.12),.14,'limestone')

    def roof(self, x, y, z, width, depth, rise, mat='terracotta'):
        w=width/2; d=depth/2
        self.mesh([(x-w,y,z-d),(x+w,y,z-d),(x+w,y,z+d),(x-w,y,z+d),(x,y+rise,z-d),(x,y+rise,z+d)],[(0,4,1),(3,2,5),(0,3,5,4),(1,4,5,2),(0,1,2,3)],mat)

    def pediment(self,x,y,z,w,h,mat='limestone'):
        self.mesh([(x-w/2,y,z-.4),(x+w/2,y,z-.4),(x,y+h,z-.4),(x-w/2,y,z+.4),(x+w/2,y,z+.4),(x,y+h,z+.4)],[(0,2,1),(3,4,5),(0,1,4,3),(1,2,5,4),(2,0,3,5)],mat)
        self.beam((x-w/2,y,z+.5),(x,y+h,z+.5),.35,mat)
        self.beam((x+w/2,y,z+.5),(x,y+h,z+.5),.35,mat)

    def text(self, label, x, y, z, size, mat='cream', width=None):
        curve=bpy.data.curves.new('Lettering | '+label,'FONT'); curve.body=label
        curve.align_x='CENTER'; curve.size=size; curve.extrude=.012; curve.resolution_u=3
        obj=bpy.data.objects.new('Lettering | '+label,curve); scene.collection.objects.link(obj)
        obj.location=point((x,y,z)); obj.rotation_euler=(math.pi/2,0,0)
        bpy.context.view_layer.update()
        if width and obj.dimensions.x > width: obj.scale.x=width/obj.dimensions.x
        deps=bpy.context.evaluated_depsgraph_get(); evaluated=obj.evaluated_get(deps)
        mesh=evaluated.to_mesh(); matrix=obj.matrix_world
        verts=[]
        for vert in mesh.vertices:
            p=matrix@vert.co; verts.append((p.x,p.z,-p.y))
        self.mesh(verts,[tuple(p.vertices) for p in mesh.polygons],mat,True)
        evaluated.to_mesh_clear(); bpy.data.objects.remove(obj,do_unlink=True); bpy.data.curves.remove(curve)

    def clock(self,x,y,z,r=2):
        # Circular face is a real mesh in the facade plane, with radial tick marks.
        verts=[(x,y,z)]+[(x+r*math.cos(i*TAU/48),y+r*math.sin(i*TAU/48),z) for i in range(48)]
        self.mesh(verts,[(0,i+1,(i+1)%48+1) for i in range(48)],'cream',True)
        for i in range(12):
            a=i*TAU/12
            self.beam((x+r*.78*math.sin(a),y+r*.78*math.cos(a),z+.03),(x+r*.91*math.sin(a),y+r*.91*math.cos(a),z+.03),.11,'iron')
        self.beam((x,y,z+.09),(x+r*.18,y+r*.62,z+.09),.13,'iron')
        self.beam((x,y,z+.10),(x-r*.65,y-r*.25,z+.10),.11,'iron')

    def rail(self,x,y,z,w,mat='iron'):
        for dy in (0,.8): self.box(x,y+dy,z,w,.065,.07,mat,True)
        for i in range(int(w/.6)+1): self.box(x-w/2+i*.6,y+.4,z,.045,.8,.045,mat,True)

    def tree(self,x,z,h=7):
        self.cylinder(x,h*.30,z,.14,h*.60,'timber',8,True)
        for i in range(5):
            a=i*TAU/5; xx=x+math.cos(a)*h*.14; zz=z+math.sin(a)*h*.14
            self.dome(xx,h*.47,zz,h*.20,h*.36,'leaf' if i%2 else 'leaf-light',True)

    def plaza(self):
        s=self.site; w=min(s['width']+8,2*s['halfWidth']); d=min(s['depth']+8,2*s['halfLength'])
        self.box(0,.08,0,w,.16,d,'paving')
        approach=next((a for a in LAYOUT.get('approaches',[]) if a['id']==s['id']),None)
        if approach:
            front=s['halfLength']+approach['halfLength']
            self.box(0,.04,front,s['width'],.08,approach['halfLength']*2,'paving')
        if s['kind']=='shop' or s['id']=='flora': return
        for x in (-w/2+2,w/2-2):
            for z in (-d/2+3,d/2-3):
                self.box(x,.35,z,3.4,.7,3.4,'limestone',True)
                self.box(x,.74,z,3,.15,3,'leaf',True)
                if s['id']!='gateway': self.tree(x,z,6)
                self.cylinder(x,2.2,z+2,.065,4.4,'iron',8,True)
                self.box(x,4.45,z+2,.42,.7,.42,'lamp',True)
        for x in (-w*.3,w*.3):
            self.box(x,.47,d/2+1,3,.14,.65,'timber',True)
            self.box(x,.86,d/2+1.3,3,.65,.09,'timber',True)
            for dx in (-1.1,1.1): self.box(x+dx,.22,d/2+1,.07,.44,.5,'iron',True)
        # Human-scale bollards, kept wholly in the reserved forecourt.
        for i in range(int(w/4)):
            x=-w/2+2+i*4
            self.cylinder(x,.45,d/2+2,.12,.9,'iron',10,True)

    def finish(self):
        site=self.site
        collection=bpy.data.collections.new(site['district']+' | '+site['name'])
        scene.collection.children.link(collection)
        root=bpy.data.objects.new(site['id'],None); collection.objects.link(root)
        root['landmark_id']=site['id']; root['height_m']=site['height']; root['reference']=site['reference'] if site['reference'].startswith('https://') else 'https://en.wikipedia.org/wiki/'+site['reference']
        groups={}
        top=max(v[1] for (lod,_),d in self.data.items() if lod=='near' for v in d[0])
        scale=site['height']/top
        for lod in ('near','far'):
            group=bpy.data.objects.new(site['id']+'__'+lod,None); group.parent=root
            group['lod']=lod; collection.objects.link(group); groups[lod]=group
        triangles={'near':0,'far':0}
        for (lod,mat), (verts,faces,smooth,uvs) in self.data.items():
            mesh=bpy.data.meshes.new(site['id']+' | '+lod+' | '+mat)
            mesh.from_pydata([point((x,y*scale,z)) for x,y,z in verts],[],faces)
            mesh.materials.append(M[mat]); mesh.update()
            uv=mesh.uv_layers.new(name='Masonry metres')
            for poly,sm,faceuv in zip(mesh.polygons,smooth,uvs):
                poly.use_smooth=sm
                for loop,coord in zip(poly.loop_indices,faceuv): uv.data[loop].uv=coord
            obj=bpy.data.objects.new(mesh.name,mesh); collection.objects.link(obj); obj.parent=groups[lod]
            obj['landmark_id']=site['id']; obj['lod']=lod
            triangles[lod]+=sum(len(face)-2 for face in faces)
        return root,groups,triangles


def taj(b):
    # Six storeys, a courtyard plan, red dome and four articulated corner pavilions.
    b.box(0,19,23,104,38,16,'sandstone')
    b.box(0,18,-25,112,36,12,'sandstone')
    for x in (-50,50):
        b.box(x,19,0,20,38,62,'sandstone')
        b.roof(x,38,0,21,63,4)
    b.roof(0,38,23,110,17,4)
    for side in (-1,1):
        b.facade(side*60.05,0,side*math.pi/2,60,[1.4+f*5.25 for f in range(7)],6,4.1)
    b.facade(0,-31.05,math.pi,110,[1.4+f*5.25 for f in range(7)],6,4.1)
    for floor in range(8): b.box(0,1+floor*5.25,31.4,118,.42,.85,'limestone',True)
    for x in range(-54,55,6):
        b.box(x,20,31.3,.52,37,.6,'redstone',True)
        for floor in range(7):
            y=1.4+floor*5.25
            b.window(x,y,31.7,3.8,4.1,arch=floor in (0,1,5))
            if floor in (2,3,4):
                b.box(x,y+.1,32.4,4.8,.25,1.8,'limestone',True)
                b.rail(x,y+.35,33.2,4.4)
        b.pediment(x,39.8,30.5,4.8,2.5)
    for x in (-51,51):
        for z in (-25,26):
            b.cylinder(x,21,z,7.3,42,'limestone',16)
            for y in (4,12,20,28,36):
                b.lathe(x,z,[(7.5,y),(7.8,y+.3),(7.5,y+.6)],'limestone',16,True)
                b.radial_windows(x,z,7.22,y+.8,2.8,4)
            b.dome(x,42,z,7.8,9.5)
            b.lathe(x,z,[(.7,51.5),(.45,53),(0,55)],'bronze',16)
    b.box(0,22,25,24,44,19,'limestone')
    for y in (5,13,22,31,38):
        for x in (-7,0,7): b.window(x,y,34.6,4.2,5,frame='limestone')
    for y in (12,21,30,37,44): b.box(0,y,25,25,.55,20,'limestone',True)
    b.lathe(0,25,[(11.2,44),(11.8,45),(10.4,46),(10.4,56),(11.7,57),(11.7,58)],'limestone',8)
    b.radial_windows(0,25,9.7,47,4,7.2)
    for y in (45.6,55.8,57.7): b.lathe(0,25,[(11.7,y),(11.9,y+.3),(11.7,y+.5)],'limestone',8,True)
    b.dome(0,58,25,11.8,11.5)
    b.lathe(0,25,[(1.1,68.4),(.65,70.1),(.9,70.4),(.3,72),(0,73)],'bronze',20)
    b.box(0,3.6,35,16,.6,8,'limestone')
    for x in (-7,7): b.cylinder(x,1.8,37,.35,3.5,'limestone',12,True)
    b.text('THE TAJ MAHAL PALACE',0,4.3,39.05,.82,'bronze',15)


def gateway(b):
    for i in range(3): b.box(0,.12+i*.17,0,48-i*1.2,.20,28-i*1.2,'limestone')
    for x in (-16,16): b.box(x,9.2,0,12,17.5,18,'sandstone')
    for x in (-8.8,8.8): b.box(x,10.4,0,3.6,19.8,18,'sandstone')
    b.arch(0,.5,0,14,17,18,'sandstone',False,1.05)
    # Spandrel above the curved opening: leave the passage truly open.
    for i in range(28):
        xx=-6.75+i*.5; low=10.5+math.sqrt(max(0,49-xx*xx))
        b.box(xx,(low+21.3)/2,0,.5,21.3-low,18,'sandstone')
    for y,w in ((18.1,45),(18.55,45.5),(20.4,22.2),(21.4,23.5),(21.85,24)):
        b.box(0,y,0,w,.38,19,'sandstone')
    # Recessed open arches and pierced stone screens; the Gateway has no glazing.
    for side in (-1,1):
        with b.frame(z=side*9.12,yaw=0 if side==1 else math.pi):
            b.arch(0,.5,0,14,17,.6,'limestone',True,.38)
            for x in (-18.6,-13.7,13.7,18.6):
                b.window(x,1,0,3.8,7.2,glazed=False)
                b.window(x,10.8,0,3.1,4.1,glazed=False)
                for xx in (-.9,-.3,.3,.9):
                    b.box(x+xx,12.8,.2,.085,3.8,.08,'sandstone',True)
                for yy in (11.5,12.3,13.1,13.9): b.box(x,yy,.23,2.8,.10,.10,'sandstone',True)
            for x in range(-21,22,2):
                top=22.65 if abs(x)<11 else 19.3
                b.box(x,top,.2,1.2,.9,.42,'sandstone',True)
                b.box(x,17.6,.15,.65,.8,.8,'limestone',True)
            b.text('GATEWAY OF INDIA',0,19.1,.55,.55,'bronze',11)
    for x in (-10.1,10.1):
        for z in (-7.8,7.8):
            b.lathe(x,z,[(1.6,16.6),(2.2,17.4),(1.8,18),(1.8,22.3),(2.35,22.6),(2.35,23)],'sandstone',8)
            b.radial_windows(x,z,1.70,19,.72,2.5,8,False)
            b.dome(x,23,z,2.3,2.3,'sandstone')
            b.lathe(x,z,[(.45,25.15),(.3,25.65),(0,26)],'bronze',12)


def antilia(b):
    b.box(0,11.5,0,46,23,44,'basalt')
    for y in range(3,23,3):
        b.box(0,y,22.2,44,.35,.7,'bronze',True)
        b.box(0,y+1,22.1,43,1.25,.1,'shade',True)
    b.box(-3,24,1,51,2,48,'bronze')
    b.box(3,43,-4,39,34,30,'glass')
    b.box(-8,59,0,40,3,48,'limestone')
    b.box(-8,62,0,38,3,46,'leaf')
    b.box(6,86,-2,39,43,37,'glass-light')
    b.box(1,108,0,51,3,47,'bronze')
    b.box(1,111,0,48,3,44,'leaf')
    b.box(8,137,-2,36,47,39,'glass')
    for x,z,yaw,w,levels in ((-16.6,-4,-math.pi/2,29,range(28,58,5)),(22.6,-4,math.pi/2,29,range(28,58,5)),(-13.6,-2,-math.pi/2,36,range(69,105,5)),(25.6,-2,math.pi/2,36,range(69,105,5)),(-10.1,-2,-math.pi/2,38,range(119,158,5)),(26.1,-2,math.pi/2,38,range(119,158,5))):
        with b.frame(x=x,z=z,yaw=yaw):
            for y in levels:
                b.box(0,y,.12,w,.3,.55,'bronze',True)
            for xx in range(-int(w/2)+2,int(w/2),4): b.box(xx,(min(levels)+max(levels))/2,.16,.2,max(levels)-min(levels)+4,.4,'bronze',True)
    # Cantilevered terraces and tall structural braces are the defining silhouette.
    for x in (-20,18):
        b.beam((x,25,20),(x+8,58,20),1.25,'bronze',False)
        b.beam((x+8,58,20),(x,108,20),1.25,'bronze',False)
    for y in list(range(67,107,5))+list(range(118,160,5)):
        width=40 if y<108 else 38
        b.box(6,y,18.3,width,.35,1,'bronze',True)
        b.box(6,y,-21.6,width,.35,.5,'bronze',True)
    for x in range(-11,25,4):
        b.box(x,139,17.8,.32,45,.65,'limestone',True)
        b.box(x,86,16.8,.26,40,.5,'bronze',True)
    for x in (-23,24): b.box(x,148,0,1.1,44,43,'bronze')
    b.box(0,169,0,55,2,49,'bronze')
    b.box(0,170.4,0,53,.8,47,'limestone')
    for x in range(-25,26,3): b.box(x,168,0,.24,1,47,'iron',True)
    b.cylinder(0,171.8,0,.08,2.4,'iron',8,True)
    for x in (-16,-5,6,17):
        for z in (-17,17):
            b.tree(x,z,5)
            for y in (60,109): b.box(x,y+1.7,z,6,2.8,4,'leaf-light',True)
    b.box(0,1.5,26,54,3,.8,'basalt')
    b.box(9,1.5,26.5,12,2.8,.25,'iron',True)
    b.text('ANTILIA',-9,1.8,26.45,.65,'bronze',10)


def heritage(b, bmc=False):
    width=108 if bmc else 130; wall=27 if bmc else 28
    b.box(0,wall/2,12,width-5,wall,29,'sandstone')
    for x in (-width*.40,width*.40):
        b.box(x,wall/2,-6,20,wall,54,'sandstone')
        b.roof(x,wall,-6,22,57,7,'terracotta')
    b.roof(0,wall,12,width-3,32,7,'terracotta')
    for side in (-1,1):
        b.facade(side*(width*.40+10.1),-6,side*math.pi/2,52,(2,10,18),6,5.4)
    b.facade(0,-2.6,math.pi,width-8,(2,10,18),6,5.4)
    for y in (1,8,16,24,28): b.box(0,y,27.1,width,.48,1.3,'limestone',True)
    for x in range(-int(width/2)+5,int(width/2),6):
        b.box(x,wall/2,27.5,.52,wall,1,'limestone',True)
        for y in (1.8,9.5,18): b.window(x+2.2,y,27.7,3.3,5.4)
        if x%2: b.pediment(x,29,27,5.5,5,'sandstone')
    for x in (-width*.41,width*.41):
        b.box(x,20,20,16,40,19,'sandstone')
        b.box(x,40,20,18,1,21,'limestone')
        b.lathe(x,20,[(8.2,40),(7.8,42),(6,48),(2.5,53),(0,58)],'basalt',8)
        b.clock(x,34,29.6,2.3)
        for zz,yaw in ((29.6,0),(10.4,math.pi)):
            b.facade(x,zz,yaw,14,(2,10,18,26),6,5.5)
        for side in (-1,1): b.facade(x+side*8.1,20,side*math.pi/2,17,(2,10,18,26),6,5.5)
        for y in (9,17,25,32,39): b.box(x,y,20,16.8,.42,19.8,'limestone',True)
        for dx in (-6,6):
            b.cylinder(x+dx,24,30,.45,34,'limestone',8,True)
            b.lathe(x+dx,30,[(.8,41),(.4,46),(0,49)],'basalt',8)
    # Central octagonal tower, recessed arches, cornices, dome and finial.
    b.box(0,22.5,19,25,45,24,'sandstone')
    b.lathe(0,18,[(13,40),(13.8,42),(11.5,44),(11.5,56),(13,57)],'limestone' if bmc else 'sandstone',8)
    b.radial_windows(0,18,10.9,46,4.5,7.4)
    for y in (6,16,27,44):
        for x in (-7,0,7): b.window(x,y,31.2,4.2,7.3)
    for x in (-12,12):
        b.cylinder(x,36,30,.55,49,'limestone',10,True)
        b.dome(x,60,30,1.3,4,'basalt')
    b.clock(0,37,31.55,2.7)
    b.dome(0,57,18,13,15,'basalt' if not bmc else 'sandstone')
    for i in range(12):
        a=i*TAU/12
        b.beam((12.7*math.cos(a),58,18+12.7*math.sin(a)),(2.5*math.cos(a),71,18+2.5*math.sin(a)),.25,'limestone')
    b.lathe(0,18,[(1.8,71.4),(1.1,73),(1.3,74.2),(.5,76),(0,78)],'bronze',16)
    b.pediment(0,30,32,25,8,'sandstone')
    b.text('BMC HEADQUARTERS' if bmc else 'CHHATRAPATI SHIVAJI MAHARAJ TERMINUS',0,3.6,31.9,.63,'cream',23)


def rajabai(b):
    b.box(0,9,-4,42,18,31,'sandstone')
    b.roof(0,18,-4,43,32,7,'terracotta')
    for x in (-15,-7,7,15):
        for y in (1,9): b.window(x,y,11.7,4,6)
    b.box(0,24,6,14,48,16,'sandstone')
    for y in (9,20,33,46,57):
        b.box(0,y,6,16,.75,18,'limestone')
        for x in (-3.1,3.1): b.window(x,y+1,14.2,3.4,8)
    b.box(0,58,6,12,20,14,'sandstone')
    b.clock(0,58,13.2,3.1)
    b.lathe(0,6,[(7.4,66),(7.8,67),(6.4,69),(5.9,75),(4.3,79),(1,84),(0,85)],'sandstone',8)
    for x in (-7,7):
        for z in (-2,14):
            b.box(x,33,z,.85,65,.85,'limestone',True)
            b.lathe(x,z,[(1.4,66),(.5,74),(0,78)],'sandstone',8)


def crawford(b):
    b.box(0,6,0,104,12,57,'sandstone')
    for x in (-26,26): b.roof(x,12,-1,54,60,9,'terracotta')
    for x in range(-46,47,8):
        b.window(x,1.4,28.7,5.5,7.6)
        b.pediment(x,12,29,7.5,4,'limestone')
    b.box(0,10,27,15,20,14,'sandstone')
    b.box(0,20,27,17,.7,16,'limestone')
    b.box(0,24,27,11,8,11,'limestone')
    b.clock(0,24,32.6,2.8)
    b.roof(0,28,27,13,13,4,'basalt')
    for x in (-38,-20,20,38):
        b.box(x,3.2,32,12,.2,5,'green',True)
        for dx in (-4,0,4):
            b.box(x+dx,.8,32,2,1.6,1.3,'timber',True)
            b.dome(x+dx,1.5,32,.7,.55,'ochre',True)
    b.text('MAHATMA JYOTIBA PHULE MANDAI',0,8.1,34.1,.63,'cream',32)
    b.text('CRAWFORD MARKET',0,6.8,34.1,.72,'cream',19)


def asiatic(b):
    for i in range(12): b.box(0,.12+i*.22,22-i*.55,73-i*.2,.24,12-i*.55,'limestone')
    b.box(0,11,-3,74,18,30,'plaster')
    b.box(0,4,15,72,2,13,'limestone')
    for x in (-28,-20,-12,-4,4,12,20,28):
        b.lathe(x,19,[(1.5,5),(1.5,5.5),(1.06,5.8),(.88,17),(1.25,17.4),(1.4,18.2)],'limestone',24)
        # Fluted Doric shafts and square capitals.
        b.box(x,18.3,19,3,.6,3,'limestone',True)
    b.box(0,19,18,75,1.1,12,'limestone')
    b.pediment(0,19.7,24,73,4.3,'limestone')
    for x in range(-29,30,10): b.window(x,6,12.2,5,9,False,'limestone')
    b.text('THE ASIATIC SOCIETY OF MUMBAI',0,19.1,24.51,.72,'bronze',44)


def cinema(b, eros=False):
    width=66 if eros else 52
    b.box(0,10,0,width,20,34,'redstone' if eros else 'plaster')
    b.box(0,20.8,0,width+1,.8,35,'limestone')
    if eros:
        b.cylinder(0,15,13,11,30,'plaster',40)
        for i in range(4): b.cylinder(0,27+i*1.7,13,10-i*1.7,1.8,'limestone',40)
        for y in (5,10,15,20,25): b.lathe(0,13,[(11.1,y),(11.4,y+.2),(11.1,y+.5)],'limestone',40,True)
        for x in (-27,-19,19,27):
            for y in (6,12): b.window(x,y,17.2,5.2,3.3,False)
        b.text('E R O S',0,23.5,24.4,2.2,'red',17)
        b.box(0,33.7,13,2,.6,3,'bronze')
    else:
        b.box(0,13,15,23,24,6,'plaster')
        for x in (-9,-6,6,9): b.box(x,13,18.2,.5,22,.7,'limestone',True)
        b.box(0,24.5,15,25,1,8,'limestone')
        b.text('R E G A L',0,17.9,18.7,2,'red',21)
        for x in (-18,18):
            for y in (7,13): b.window(x,y,17.2,7,3.5,False)
    b.box(0,4.7,20,width*.82,.45,9,'green')
    b.box(0,4.65,24.6,width*.82,.7,.22,'cream',True)
    b.text('C I N E M A',0,4.38,24.8,.75,'red',15)
    for x in (-15,-10,-5,0,5,10,15):
        b.box(x,1.8,18,3.1,3.5,.18,'timber',True)
        b.box(x,2,18.15,2.6,2.8,.05,'glass',True)
        if x in (-15,15):
            b.box(x,2,18.25,2.3,2.6,.08,'ochre',True)
            b.text('MUMBAI',x,2.3,18.32,.25,'cream',2)


def flora(b):
    b.lathe(0,0,[(6,0),(6,.4),(5.6,.65),(5.6,.9),(5,.9)],'limestone',48)
    b.cylinder(0,.7,0,4.9,.15,'water',48)
    b.box(0,2,0,3.3,3.5,3.3,'limestone')
    b.lathe(0,0,[(2.2,3.6),(3.7,4),(3.8,4.3),(2,4.6),(1.3,5),(1.2,7.2),(2.5,7.5),(2.6,7.8),(1,8.2),(.7,9)],'limestone',32)
    # Sculptural human figure, skirt folds, shoulders, head and extended arms.
    b.lathe(0,0,[(.7,8.3),(.62,9),(.38,10.4),(.42,10.7),(.28,11.1)],'limestone',16)
    b.dome(0,11.05,0,.29,.65,'limestone')
    b.beam((-.32,10.7,0),(-1.1,10.35,.12),.2,'limestone',False)
    b.beam((.32,10.7,0),(.7,11.5,0),.2,'limestone',False)
    b.cylinder(.75,11.65,0,.12,.7,'limestone',8)
    for a in (0,math.pi/2,math.pi,math.pi*1.5):
        x=math.cos(a)*2; z=math.sin(a)*2
        b.lathe(x,z,[(.5,1),(.4,1.9),(.22,2.4)],'limestone',12,True)
        b.dome(x,2.4,z,.28,.5,'limestone',True)


def shop(b):
    s=b.site; ident=s['id']; w=s['width']; d=s['depth']; h=s['height']
    color={'leopold':'red','mondegar':'green','kyani':'cream','yazdani':'blue','kitab':'green','fashion':'blue','bademiya':'red'}[ident]
    b.box(0,h/2-.1,0,w,h-.2,d,'plaster' if ident!='kitab' else 'sandstone')
    b.box(0,h-.12,0,w+.6,.24,d+.6,'limestone')
    front=d/2+.1
    for x in (-w*.32,0,w*.32):
        b.box(x,1.25,front,w*.27,2.5,.15,'shade',True)
        for dx in (-w*.13,w*.13): b.box(x+dx,1.3,front+.13,.12,2.6,.2,'timber',True)
        if ident not in ('fashion','bademiya'):
            b.box(x,1.3,front+.08,w*.24,2.4,.06,'glass',True)
            b.box(x,1.3,front+.18,.06,2.4,.08,'bronze',True)
    b.box(0,3.05,front+.5,w+.35,.8,.8,color)
    b.text(s['name'].upper(),0,2.79,front+.94,.6,'bronze' if ident=='kyani' else 'cream',w-.7)
    b.box(0,2.5,front+1,w,.13,2.2,color,True)
    for y in range(5,int(h)-1,3):
        for x in (-w*.32,0,w*.32):
            b.window(x,y,front,2,1.9,arch=ident in ('leopold','kitab'))
        b.box(0,y-.4,front+.2,w+.2,.22,.6,'limestone',True)
    if ident=='fashion':
        for i in range(10):
            x=-w/2+1+i*(w-2)/10
            b.beam((x,1.1,front+.45),(x,2.3,front+.45),.05,'iron')
            b.box(x,1.75,front+.5,.72,.95,.15,['red','blue','ochre','green','cream'][i%5],True)
    elif ident=='bademiya':
        b.box(0,1,front+1,9,.85,1.6,'iron',True)
        b.box(0,1.5,front+1,9,.1,1.8,'bronze',True)
        b.box(2,4.4,0,1,2.8,1,'iron',True)
        for x in (-3,-1,1,3): b.cylinder(x,1.7,front+1,.25,.28,'iron',12,True)
    else:
        for x in (-w*.28,w*.28):
            b.cylinder(x,.76,front+1.8,.56,.07,'timber',16,True)
            b.cylinder(x,.39,front+1.8,.04,.73,'iron',8,True)
            for dx in (-.78,.78):
                b.box(x+dx,.44,front+1.8,.45,.08,.45,'timber',True)
                b.box(x+dx,.7,front+2,.45,.5,.07,'timber',True)
    b.box(w*.32,h+.28,-d*.25,2,.7,1.6,'iron')


def celebrity_home(b):
    # Public exterior interpretations only: no interior rooms or private layouts.
    ident=b.site['id']
    if ident=='mannat':
        # White heritage bungalow in front of the taller glazed residential annex.
        b.box(0,17,-13,37,30,24,'plaster')
        for y in range(5,31,4):
            b.box(0,y,-.8,39,.35,1.6,'limestone',True)
            b.box(0,y+1.7,-.75,34,2.6,.15,'glass',True)
            for x in range(-15,16,5): b.box(x,y+1.7,-.5,.13,2.6,.3,'bronze',True)
        b.box(0,31.6,-13,41,.8,27,'limestone')
        for side in (-1,1): b.facade(side*18.6,-13,side*math.pi/2,22,range(5,30,4),5,2.6,False)
        b.facade(0,-25.1,math.pi,36,range(5,30,4),6,2.6,False)
        b.box(0,6.5,14,48,13,20,'plaster')
        b.box(0,13.5,14,51,1,22,'limestone')
        for side in (-1,1): b.facade(side*24.1,14,side*math.pi/2,18,(1.6,7.6),6,4.2)
        b.pediment(0,14,24.8,20,4.1,'limestone')
        for x in (-6,-2,2,6): b.cylinder(x,6.6,25.1,.42,12.8,'limestone',24,True)
        for x in (-21,-14,-7,7,14,21):
            b.window(x,1.6,24.15,3.3,4.4)
            b.window(x,7.6,24.15,3.3,4.2)
            b.cylinder(x+2.25,6.8,24.5,.35,12,'limestone',16,True)
        b.box(0,3.2,25.7,14,.65,5,'limestone')
        for x in (-6,6): b.cylinder(x,1.7,27,.35,3.2,'limestone',16,True)
        b.box(0,1.7,28,48,3.4,.7,'basalt')
        b.box(0,1.55,28.5,11,3.1,.25,'iron',True)
        b.text('MANNAT',-13,1.85,28.41,.68,'bronze',9)
    elif ident=='galaxy':
        # Low, pale apartment slab, stacked balconies and street-level enclosure.
        b.box(0,12.6,0,24,25.2,23,'plaster')
        b.box(0,25.65,0,26,.7,25,'limestone')
        for side in (-1,1): b.facade(side*12.1,0,side*math.pi/2,21,[1+f*3.35 for f in range(7)],5,2.2,False,'plaster')
        b.facade(0,-11.6,math.pi,23,[1+f*3.35 for f in range(7)],5,2.2,False,'plaster')
        for floor in range(7):
            y=1+floor*3.35
            b.box(0,y+2.9,12.7,26,.26,2.6,'limestone')
            for x in (-8,-2.7,2.7,8):
                b.window(x,y,11.7,3.3,2.2,False,'plaster')
                b.rail(x,y+.2,14,4.7,'iron')
                b.box(x,y+.48,13.9,4.5,.5,.15,'plaster',True)
                if floor%2==0: b.box(x+1.5,y+1.7,12.25,.7,.55,.6,'iron',True)
        for x in (-12,0,12): b.box(x,12.5,12.8,.5,25,2.5,'plaster')
        b.box(0,1.1,15.5,26,2.2,.65,'plaster')
        b.box(3,1.15,15.9,6,2.3,.18,'iron',True)
        b.text('GALAXY APARTMENTS',-3,2.65,15.91,.48,'bronze',21)
    else:
        # Jalsa: low bungalow, warm tiled pitched roof, trees and a modest gate.
        b.box(0,5.4,-1,42,10.8,31,'plaster')
        b.roof(0,10.8,-1,47,37,4.2,'terracotta')
        b.box(-12,4.9,13,14,9.8,10,'plaster')
        b.roof(-12,9.8,13,17,13,3.1,'terracotta')
        for x in (-15,-5,5,15):
            b.window(x,2,15,3.5,3,False,'timber')
            b.window(x,6.5,15,3.5,2.5,False,'timber')
        b.box(0,1.7,21,47,3.4,.75,'basalt')
        b.box(0,1.55,21.45,10,3.1,.20,'timber',True)
        for x in range(-4,5): b.box(x,1.6,21.59,.05,2.9,.04,'bronze',True)
        b.text('JALSA',-11,1.95,21.46,.6,'bronze',7)
        for x in (-18,18): b.tree(x,12,10)


def mount_mary(b):
    b.box(0,11,-1,28,22,61,'basalt')
    b.roof(0,22,-1,31,63,7,'terracotta')
    b.box(0,12,29,34,24,6,'basalt')
    b.pediment(0,24,32.3,28,7,'basalt')
    b.gothic_window(0,.6,32.15,5.4,9.2)
    for x in (-8,0,8): b.gothic_window(x,12,32.15,4.1,8)
    b.rose_window(0,26.6,32.8,2.1)
    for x in (-18,18):
        b.box(x,15,24,12,30,16,'basalt')
        for y in (1,10,20,29.8): b.box(x,y,24,13,.55,17,'limestone')
        for y in (2,12,22):
            b.gothic_window(x,y,32.2,6,6.8)
            for side in (-1,1):
                with b.frame(x=x+side*6.1,z=24,yaw=side*math.pi/2): b.gothic_window(0,y,0,5,6.8)
        for dx in (-5.8,5.8): b.box(x+dx,15,32.3,.55,30,.7,'limestone',True)
        b.lathe(x,24,[(7.2,30),(6.3,31.5),(2.6,37),(.55,43),(0,43.6)],'limestone',8)
        b.box(x,44.2,24,.17,1.6,.17,'bronze')
        b.box(x,44.45,24,1,.16,.16,'bronze')
        for dx in (-5.3,5.3):
            for zz in (18,30): b.lathe(x+dx,zz,[(.85,29),(.75,32.5),(0,35)],'limestone',8,True)
    for side in (-1,1):
        with b.frame(x=side*14.1,z=-5,yaw=side*math.pi/2):
            for x in range(-22,23,8):
                b.gothic_window(x,4,0,4.4,12)
                b.box(x+3.6,11,.25,.8,22,1,'limestone',True)
    b.text('MOUNT MARY BASILICA',0,10.4,32.7,.58,'cream',22)


def siddhivinayak(b):
    b.lathe(0,0,[(25,0),(25,2),(23.7,2.5),(23.7,24),(24.4,24.5)],'plaster',8)
    for y in (2,7.5,13,18.5,24):
        b.lathe(0,0,[(24.2,y),(24.8,y+.32),(24.1,y+.6)],'limestone',8)
    for y in (3,8.5,14,19.5): b.radial_windows(0,0,22.1,y,4.6,3.3,8,False)
    # A stepped mandir roof with smaller gilded shikharas around the main shrine.
    for i in range(8):
        a=(i+.5)*TAU/8; x=math.sin(a)*20; z=math.cos(a)*20
        b.lathe(x,z,[(2.7,21),(2.7,25),(2.3,26),(1.4,29),(.4,30.5)],'plaster',8)
        b.lathe(x,z,[(.6,30.2),(.75,30.7),(.45,31.4),(0,32.5)],'bronze',16)
        b.cylinder(x,14,z,.48,22,'limestone',8,True)
    b.lathe(0,0,[(12,24),(11,26),(9,28),(7,30),(5,32),(3,34),(.9,35.5)],'plaster',12)
    for y,r in ((26,11),(28,9),(30,7),(32,5),(34,3)): b.lathe(0,0,[(r+.6,y),(r+.6,y+.35),(r,y+.55)],'limestone',12,True)
    b.lathe(0,0,[(.8,35),(.95,35.6),(.6,36.2),(.4,37.2),(0,38)],'bronze',20)
    b.box(0,2.8,24.6,18,.5,5,'limestone')
    b.text('SHREE SIDDHIVINAYAK',0,3.3,27.16,.68,'bronze',18)


def world_one(b):
    b.box(0,6,0,65,12,58,'limestone')
    b.facade(0,29.1,0,60,(2,7),6,3,False)
    # Three rounded residential wings, floor ribbons and a stepped central crown.
    for x,z,r,height in ((0,3,17,280.2),(-15,-8,13,263),(15,-8,13,263)):
        b.lathe(x,z,[(r,12),(r,height-3),(r*.87,height)],'glass',48)
        for y in range(14,int(height)-2,3):
            b.lathe(x,z,[(r+.45,y),(r+.45,y+.38),(r,y+.52)],'limestone',48)
        for i in range(24):
            a=i*TAU/24
            b.box(x+math.cos(a)*(r+.12),(height+12)/2,z+math.sin(a)*(r+.12),.22,height-12,.22,'limestone',True)
    b.box(0,1.7,30.8,28,3.4,.8,'basalt')
    b.text('WORLD ONE',0,2,31.24,1.1,'bronze',21)


def opera_house(b):
    b.box(0,10,0,54,20,35,'plaster')
    b.roof(0,20,-1,56,37,4,'terracotta')
    for y in (1,7,14,20.6): b.box(0,y,18.1,56,.6,1.3,'limestone')
    for x in (-21,-14,-7,0,7,14,21):
        b.window(x,1.1,17.65,4.5,5.5,frame='limestone',glazed=False)
        b.window(x,8.2,17.65,4.5,4.8)
        b.window(x,15,17.65,4.5,3.8)
        if x!=21: b.cylinder(x+3.5,13.6,18,.35,13.3,'limestone',16,True)
    b.pediment(0,21.2,18.6,49,5.2,'limestone')
    b.rose_window(0,23.2,19.1,1.45)
    for x in (-21,21):
        b.box(x,21.3,17.8,5,.9,3,'limestone',True)
        b.dome(x,21.8,17.8,1.1,1.5,'limestone',True)
    b.lathe(0,18,[(.9,26.4),(.6,27.2),(.35,27.5),(0,28)],'limestone',12)
    for side in (-1,1): b.facade(side*27.1,0,side*math.pi/2,33,(2,9,15),6,3.5)
    b.text('ROYAL OPERA HOUSE',0,6.5,18.85,.68,'bronze',29)


def nehru_centre(b):
    b.box(0,2.1,0,59,4.2,50,'limestone')
    b.lathe(0,0,[(18,4),(19.5,10),(22,40),(24,75),(24,89),(23,91)],'glass-light',56)
    def radius(y):
        if y<10: return 18+(y-4)*.25+.4
        if y<40: return 19.5+(y-10)/12+.4
        if y<75: return 22+(y-40)*2/35+.4
        return 24.4
    # The full diamond lattice is structural silhouette, retained in both LODs.
    for i in range(16):
        start=i*TAU/16
        for direction in (-1,1):
            for y in range(6,86,5):
                a=start+direction*(y-6)*.031; c=start+direction*(y-1)*.031
                b.beam((math.sin(a)*radius(y),y,math.cos(a)*radius(y)),(math.sin(c)*radius(y+5),y+5,math.cos(c)*radius(y+5)),.50,'limestone',False)
    for y in range(7,88,5): b.lathe(0,0,[(radius(y)-.18,y),(radius(y)-.18,y+.2)],'bronze',56,True)
    b.lathe(0,0,[(24.5,89.3),(24.5,90.3),(23,91)],'limestone',56)
    b.box(0,2,27,28,4,.6,'basalt')
    b.text('NEHRU CENTRE',0,2.3,27.34,1,'cream',23)


def high_court(b):
    b.box(0,12,0,78,24,44,'basalt')
    b.roof(0,24,0,80,46,10,'terracotta')
    for y in (2,10,19):
        for x in range(-34,35,7): b.gothic_window(x,y,22.15,3.8,6.6)
        b.box(0,y-.6,22.4,80,.45,1,'limestone',True)
    for side in (-1,1): b.facade(side*39.1,0,side*math.pi/2,40,(2,10,18),6,5.5)
    b.box(0,19,19,21,38,14,'basalt')
    for y in (2,14,26): b.gothic_window(0,y,26.16,8,9)
    b.roof(0,38,19,24,18,14,'terracotta')
    b.pediment(0,38,28.2,22,12,'sandstone')
    b.rose_window(0,40.6,28.7,2.3)
    for x in (-34,34):
        b.box(x,16,21,8,32,9,'sandstone')
        b.lathe(x,21,[(5,32),(4.7,33),(1.6,43),(0,46)],'sandstone',8)
        b.gothic_window(x,22,25.7,3,6)
    b.text('BOMBAY HIGH COURT',0,12.2,26.7,.75,'cream',20)


def stock_exchange(b):
    b.box(0,5,0,50,10,45,'limestone')
    # Cream curving office wings flank the narrow vertical glazed service spine.
    for side in (-1,1):
        with b.frame(x=side*10,z=-2):
            b.lathe(0,0,[(14,10),(14,109),(12.8,112)],'glass',48)
            for y in range(12,111,4): b.lathe(0,0,[(14.5,y),(14.5,y+.55),(14,y+.8)],'limestone',48)
    b.box(0,62,11,11,112,22,'limestone')
    b.box(0,62,22.15,7.8,110,.18,'glass')
    for x in (-3.5,0,3.5): b.box(x,62,22.4,.20,110,.4,'bronze',True)
    b.box(0,117,11,11,2,22,'limestone')
    b.box(0,5.5,23.5,35,1.7,.45,'blue')
    b.text('BOMBAY STOCK EXCHANGE',0,5.05,23.76,.8,'cream',33)


def world_trade_centre(b):
    b.box(0,4,0,102,8,52,'limestone')
    for x,h in ((-26,155.9),(27,125)):
        b.box(x,h/2,0,32,h,30,'glass')
        for xx in (-16,-7.5,7.5,16): b.box(x+xx,h/2,0,1.8,h,32,'limestone')
        for zz in (-15.5,15.5): b.box(x,h/2,zz,34,h,.8,'limestone')
        for side in (-1,1):
            with b.frame(x=x,z=side*16,yaw=0 if side==1 else math.pi):
                for y in range(10,int(h)-7,4):
                    for xx in (-11,0,11):
                        b.box(xx,y+1.1,.1,7.5,2.1,.14,'glass')
                        b.box(xx,y-.18,.3,8,.45,.6,'limestone',True)
        for y in range(12,int(h)-6,4): b.box(x,y,0,34,.38,32,'limestone',True)
        b.box(x,h-2.5,0,34,5,32,'limestone')
        b.text('WTC',x,h-3.8,16.45,2.3,'blue',18)
    b.text('WORLD TRADE CENTRE',0,5.2,26.2,1.2,'bronze',61)


builders={'taj-palace':taj,'gateway':gateway,'antilia':antilia,'csmt':heritage,'bmc':lambda b:heritage(b,True),'rajabai':rajabai,'crawford':crawford,'asiatic':asiatic,'eros':lambda b:cinema(b,True),'regal':cinema,'flora':flora,'mannat':celebrity_home,'galaxy':celebrity_home,'jalsa':celebrity_home,'mount-mary':mount_mary,'siddhivinayak':siddhivinayak,'world-one':world_one,'opera-house':opera_house,'nehru-centre':nehru_centre,'high-court':high_court,'bse':stock_exchange,'world-trade-centre':world_trade_centre}
assets=[]; stats=[]
for site in LAYOUT['sites']:
    b=Builder(site); b.plaza(); builders.get(site['id'],shop)(b)
    root,groups,triangles=b.finish(); assets.append((site,root,groups))
    stats.append({'id':site['id'],'name':site['name'],'height_m':site['height'],'triangles':triangles})
    print('BUILT',site['id'],triangles,flush=True)

# Export every local-origin template, including both visibility levels.
for obj in bpy.context.view_layer.objects: obj.select_set(False)
for _,root,_ in assets:
    root.select_set(True)
    for obj in root.children_recursive: obj.select_set(True)
RUNTIME.mkdir(parents=True,exist_ok=True)
glb=RUNTIME/'mumbai-landmarks.glb'
bpy.ops.export_scene.gltf(filepath=str(glb),export_format='GLB',use_selection=True,use_active_scene=True,export_extras=True,export_yup=True,export_apply=True)

# The editable Blender file shows the actual game placement and named districts.
for site,root,groups in assets:
    root.location=point((site['x'],0,site['z'])); root.rotation_euler.z=site['yaw']
    for obj in [groups['far'],*groups['far'].children_recursive]: obj.hide_set(True); obj.hide_render=True

context=bpy.data.collections.new('00 | Actual game roads - context only, not exported')
scene.collection.children.link(context)
def context_mesh(name, verts, faces, mat):
    mesh=bpy.data.meshes.new(name); mesh.from_pydata([point(p) for p in verts],[],faces); mesh.materials.append(M[mat])
    obj=bpy.data.objects.new(name,mesh); context.objects.link(obj); return obj
for street in LAYOUT['streets']:
    verts=[]; faces=[]
    for a,b in zip(street['points'],street['points'][1:]):
        dx=b['x']-a['x']; dz=b['z']-a['z']; l=math.hypot(dx,dz); w=street['width']/2
        nx=dz/l*w; nz=-dx/l*w; k=len(verts)
        verts.extend([(a['x']-nx,.025,a['z']-nz),(a['x']+nx,.025,a['z']+nz),(b['x']+nx,.025,b['z']+nz),(b['x']-nx,.025,b['z']-nz)])
        faces.append((k,k+1,k+2,k+3))
    context_mesh(street['name']+' | '+str(street['id']),verts,faces,'basalt')
bounds=LAYOUT['bounds']
context_mesh('Mumbai land',[(bounds['minX'],-.02,bounds['minZ']),(bounds['minX'],-.02,bounds['maxZ']),(bounds['maxX'],-.02,bounds['maxZ']),(bounds['maxX'],-.02,bounds['minZ'])],[(0,1,2,3)],'paving')
sun_data=bpy.data.lights.new('Mumbai sun','SUN'); sun_data.energy=3.2; sun_data.angle=.12
sun=bpy.data.objects.new('Mumbai sun',sun_data); context.objects.link(sun); sun.rotation_euler=(math.radians(28),math.radians(-20),math.radians(-35))
camera_data=bpy.data.cameras.new('Mumbai overview'); camera=bpy.data.objects.new('Mumbai overview',camera_data); context.objects.link(camera)
camera.location=point((1700,1800,1800)); camera.rotation_euler=(Vector(point((450,0,-40)))-camera.location).to_track_quat('-Z','Y').to_euler()
camera_data.type='ORTHO'; camera_data.ortho_scale=3200; camera_data.clip_end=6000; scene.camera=camera
scene.render.resolution_x=1800; scene.render.resolution_y=1350; scene.render.resolution_percentage=100
for area in bpy.context.screen.areas:
    if area.type=='VIEW_3D':
        area.spaces.active.region_3d.view_distance=2400
        area.spaces.active.region_3d.view_location=Vector(point((450,0,-40)))
        area.spaces.active.clip_end=6000
        area.spaces.active.shading.type='MATERIAL'
scene['axis_contract']='GLB +Y up, +Z facade, metres. Source arranged at exact authored game sites.'
scene['authorship']='Original geometry and original PBR textures. Photo URLs documented as reference only.'
bpy.data.libraries.write(str(OUT/'mumbai-landmarks.blend'),{scene},fake_user=True,compress=True)
(OUT/'manifest.json').write_text(json.dumps({'generator':'Blender '+bpy.app.version_string,'runtime':'/models/mumbai-landmarks.glb','bytes':glb.stat().st_size,'models':stats,'source':'mumbai-landmarks.blend','units':'metres'},indent=2)+'\n')
print('MUMBAI_LANDMARKS_COMPLETE',len(assets),glb.stat().st_size,flush=True)
