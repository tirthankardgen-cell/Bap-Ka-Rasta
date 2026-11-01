"""Small Blender modelling kit in game coordinates: X right, Y up, Z forward."""
import bpy
import bmesh
import math
from mathutils import Vector


def point(p):
    return Vector((p[0], -p[2], p[1]))


class VehicleKit:
    def __init__(self, scene, name, kind):
        self.collection = bpy.data.collections.new(name)
        scene.collection.children.link(self.collection)
        self.root = bpy.data.objects.new(name, None)
        self.collection.objects.link(self.root)
        self.root['traffic_kind'] = kind
        self.root['reference'] = {
            0: 'ref vech/thar actual.png', 1: 'ref vech/fortuner actual.png',
            2: 'ref vech/e riksha actual .png', 5: 'ref vech/scooty actual .png',
            6: 'ref vech/Ktm actual.png', 3: 'ref vech/mumbai red bus.jfif',
        }.get(kind, 'ref vech/extra cars images.jfif')
        self.root['axis_contract'] = 'metres; +Y up and +Z forward in GLB; ground origin'
        self.materials = {}
        self.parts = []
        self.rider = False
        self.section = 'body'
        self.wheels = {}

    def mat(self, color, finish='paint'):
        key = ('rider_' if self.rider else '') + color + '_' + finish
        if key in self.materials:
            return self.materials[key]
        m = bpy.data.materials.new(self.root.name + '_' + key)
        m.use_nodes = True
        rgb = [int(color[i:i+2], 16)/255 for i in (0, 2, 4)]
        rgb = [v/12.92 if v <= .04045 else ((v+.055)/1.055)**2.4 for v in rgb]
        m.diffuse_color = (*rgb, 1)
        p = m.node_tree.nodes.get('Principled BSDF')
        p.inputs['Base Color'].default_value = (*rgb, 1)
        p.inputs['Roughness'].default_value = {'paint': .29, 'rubber': .85, 'glass': .17, 'metal': .28, 'seat': .65, 'lamp': .20}.get(finish, .5)
        p.inputs['Metallic'].default_value = {'paint': .18, 'metal': .72, 'glass': .25}.get(finish, 0)
        self.materials[key] = m
        return m

    def register(self, o, name, color, finish):
        o.name = name
        for c in list(o.users_collection):
            c.objects.unlink(o)
        self.collection.objects.link(o)
        o.data.materials.append(self.mat(color, finish))
        o['part'] = 'rider' if self.rider else 'glass' if finish == 'glass' else self.section
        self.parts.append(o)
        return o

    def box(self, name, pos, size, color, bevel=.025, finish='paint'):
        bpy.ops.mesh.primitive_cube_add(size=1, location=point(pos))
        o = self.register(bpy.context.object, name, color, finish)
        o.scale = (size[0], size[2], size[1])
        bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
        if bevel:
            mod = o.modifiers.new('Soft manufactured edges', 'BEVEL')
            mod.width = min(bevel, min(size)*.45)
            mod.segments = 4 if bevel >= .06 else 3
            bpy.ops.object.modifier_apply(modifier=mod.name)
            for poly in o.data.polygons: poly.use_smooth = True
            mod = o.modifiers.new('Weighted normals', 'WEIGHTED_NORMAL')
            bpy.ops.object.modifier_apply(modifier=mod.name)
        return o

    def mesh(self, name, verts, faces, color, finish='paint', smooth=False, bevel=0):
        data = bpy.data.meshes.new(name)
        data.from_pydata([point(v) for v in verts], [], faces)
        data.update()
        bm = bmesh.new(); bm.from_mesh(data)
        bmesh.ops.recalc_face_normals(bm, faces=list(bm.faces))
        bm.to_mesh(data); bm.free()
        o = bpy.data.objects.new(name, data)
        self.collection.objects.link(o)
        data.materials.append(self.mat(color, finish)); self.parts.append(o)
        o['part'] = 'rider' if self.rider else 'glass' if finish == 'glass' else self.section
        for p in data.polygons:
            p.use_smooth = smooth
        if bevel:
            bpy.context.view_layer.objects.active = o
            mod = o.modifiers.new('Panel edge radius', 'BEVEL'); mod.width = bevel; mod.segments = 2
            bpy.ops.object.modifier_apply(modifier=mod.name)
            mod = o.modifiers.new('Weighted normals', 'WEIGHTED_NORMAL')
            bpy.ops.object.modifier_apply(modifier=mod.name)
        return o

    def profile(self, name, yz, width, color, bevel=.02, finish='paint'):
        """Extrude a side silhouette across X. Each entry may specify its own width."""
        verts = [(s*(v[2] if len(v)>2 else width)/2, v[0], v[1]) for s in [-1, 1] for v in yz]
        n = len(yz)
        faces = [tuple(range(n-1,-1,-1)), tuple(range(n,2*n))]
        faces += [(i,(i+1)%n,(i+1)%n+n,i+n) for i in range(n)]
        return self.mesh(name, verts, faces, color, finish, bevel=bevel)

    def sphere(self, name, pos, size, color, finish='paint'):
        bpy.ops.mesh.primitive_uv_sphere_add(segments=16, ring_count=10, location=point(pos))
        o = self.register(bpy.context.object, name, color, finish)
        o.scale = (size[0], size[2], size[1])
        bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
        for p in o.data.polygons: p.use_smooth = True
        return o

    def tube(self, name, pts, radius, color, finish='metal'):
        cv = bpy.data.curves.new(name, 'CURVE'); cv.dimensions = '3D'
        cv.resolution_u = 1; cv.bevel_depth = radius; cv.bevel_resolution = 1; cv.use_fill_caps = True
        sp = cv.splines.new('POLY'); sp.points.add(len(pts)-1)
        for v, p in zip(sp.points, pts): v.co = (*point(p), 1)
        o = bpy.data.objects.new(name, cv); self.collection.objects.link(o)
        cv.materials.append(self.mat(color, finish)); self.parts.append(o)
        o['part'] = 'rider' if self.rider else self.section
        return o

    def text(self, name, value, pos, size, color, facing='front'):
        cv = bpy.data.curves.new(name, 'FONT')
        cv.body = value; cv.align_x = 'CENTER'; cv.align_y = 'CENTER'
        cv.size = size; cv.resolution_u = 2; cv.extrude = 0
        o = bpy.data.objects.new(name, cv); self.collection.objects.link(o)
        o.location = point(pos)
        o.rotation_euler = (math.pi/2, 0, 0 if facing == 'front' else math.pi)
        if facing in ('left', 'right'):
            o.rotation_euler.z = math.pi/2 if facing == 'right' else -math.pi/2
        cv.materials.append(self.mat(color, 'paint'))
        o['part'] = self.section; self.parts.append(o)
        return o

    def cylinder(self, name, pos, radius, depth, color, axis=(1,0,0), finish='metal', segments=24):
        bpy.ops.mesh.primitive_cylinder_add(vertices=segments, radius=radius, depth=depth, location=point(pos))
        o = self.register(bpy.context.object, name, color, finish)
        o.rotation_euler = point(axis).to_track_quat('Z','Y').to_euler()
        for p in o.data.polygons: p.use_smooth = len(p.vertices)==4
        return o

    def wheel(self, x, z, r=.37, width=.25, offroad=False, sport=False, rim=None, spokes=5, steel=False):
        first=len(self.parts)
        tag='wheel_'+('front' if z>0 else 'rear')+('_left' if x<0 else '_right' if x>0 else '')
        self.wheels[tag]=(x,r,z)
        steps = 32
        profile = [(-.5,.61),(-.52,.78),(-.44,.94),(-.27,1),(.27,1),(.44,.94),(.52,.78),(.5,.61)]
        verts = [(x+px*width, r+pr*r*math.sin(i*2*math.pi/steps), z+pr*r*math.cos(i*2*math.pi/steps)) for px,pr in profile for i in range(steps)]
        faces = []
        for j in range(len(profile)-1):
            for i in range(steps):
                a=j*steps+i; b=j*steps+(i+1)%steps
                faces.append((a,b,b+steps,a+steps))
        self.mesh('Rounded pneumatic tyre',verts,faces,'222326','rubber',True)
        for side in [-1,1]:
            xx = x+side*width*.49
            self.cylinder('Alloy rim', (xx,r,z),r*.64,.023,rim or ('393b3f' if sport else '9e998e'))
            self.cylinder('Recessed wheel dish',(xx+side*.014,r,z),r*.52,.027,'343439')
            if steel:
                self.cylinder('Pressed steel wheel disc',(xx+side*.033,r,z),r*.515,.020,'7c8585')
                for j in range(8):
                    a=j*math.tau/8
                    self.cylinder('Steel wheel vent',(xx+side*.046,r+r*.387*math.sin(a),z+r*.387*math.cos(a)),r*.072,.004,'343b3d',segments=12)
                    self.cylinder('Wheel lug',(xx+side*.052,r+r*.22*math.sin(a),z+r*.22*math.cos(a)),r*.029,.015,'adb5b2',segments=6)
            else:
                for j in range(spokes):
                    a=j*2*math.pi/spokes
                    self.tube('Alloy spoke',[(xx+side*.036,r+r*.14*math.sin(a),z+r*.14*math.cos(a)),(xx+side*.036,r+r*.47*math.sin(a+.12),z+r*.47*math.cos(a+.12))],r*(.042 if spokes>6 else .060),rim or ('575a60' if sport else 'ada79b'))
            self.cylinder('Wheel centre',(xx+side*.04,r,z),r*.17,.035,'b9b3a4')
        if offroad:
            for i in range(24):
                a=i*2*math.pi/24
                for side in [-1,1]:
                    o = self.box('All terrain shoulder block',(x+side*width*.36,r+r*.968*math.sin(a),z+r*.968*math.cos(a)),(width*.30,r*.095,r*.16),'29292b',0,'rubber')
                    o.rotation_euler.x = a-math.pi/2
        if sport:
            self.cylinder('Front brake disc',(x-width*.62,r,z),r*.62,.013,'b7b4ac')
            for i in range(12):
                a=i*math.pi/6
                self.cylinder('Disc perforation',(x-width*.69,r+r*.49*math.sin(a),z+r*.49*math.cos(a)),.014,.003,'343439',segments=8)
            caliper = self.box('Brake caliper',(x-width*.68,r+.04,z-.16),(.06,.15,.08),'4d4d4c',.013,'metal')
            caliper['stationary'] = True
        if not offroad:
            for i in range(18):
                a=i*2*math.pi/18
                self.tube('Tyre groove',[(x-width*.35,r+r*.982*math.sin(a-.04),z+r*.982*math.cos(a-.04)),(x,r+r*math.sin(a),z+r*math.cos(a)),(x+width*.35,r+r*.982*math.sin(a+.04),z+r*.982*math.cos(a+.04))],.0035,'15171a','rubber')
        for o in self.parts[first:]:
            if not o.get('stationary'): o['wheel_tag']=tag

    def arch(self, name, x, z, y, radius, width, color, start=-.15, end=math.pi+.15):
        steps=20; verts=[]; faces=[]
        for xx,rr in [(-width/2,radius-.035),(-width/2,radius),(width/2,radius),(width/2,radius-.035)]:
            for i in range(steps+1):
                a=start+(end-start)*i/steps
                verts.append((x+xx,y+rr*math.sin(a),z+rr*math.cos(a)))
        for j in range(4):
            for i in range(steps):
                a=j*(steps+1)+i; b=((j+1)%4)*(steps+1)+i
                faces.append((a,a+1,b+1,b))
        faces.extend([(0,steps+1,2*(steps+1),3*(steps+1)),(steps,2*steps+1,3*steps+2,4*steps+3)])
        self.mesh(name,verts,faces,color,smooth=True)

    def deform_body(self, transform):
        """Bake a silhouette change before adding independently sized road wheels."""
        bpy.ops.object.select_all(action='DESELECT')
        for o in self.parts: o.select_set(True)
        bpy.context.view_layer.objects.active=self.parts[0]
        bpy.ops.object.convert(target='MESH')
        bpy.ops.object.transform_apply(location=True,rotation=True,scale=True)
        for o in self.collection.objects:
            if o.type != 'MESH': continue
            for v in o.data.vertices:
                v.co = point(transform((v.co.x,v.co.z,-v.co.y)))
            o.data.update()
        self.parts = [o for o in self.collection.objects if o.type=='MESH']

    def finish(self):
        bpy.ops.object.select_all(action='DESELECT')
        for o in self.parts: o.select_set(True)
        bpy.context.view_layer.objects.active=self.parts[0]
        bpy.ops.object.convert(target='MESH')
        groups={}
        for o in list(self.collection.objects):
            if o.type=='MESH': groups.setdefault((o.get('wheel_tag',o.get('part','body')),o.data.materials[0].name),[]).append(o)
        pivots={}
        for tag,centre in self.wheels.items():
            pivot=bpy.data.objects.new(self.root.name+'__'+tag,None)
            self.collection.objects.link(pivot); pivot.parent=self.root
            pivot.location=point(centre); pivot['wheelRadius']=centre[1]
            pivots[tag]=pivot
        bpy.context.view_layer.update()
        for (tag,material),objects in groups.items():
            bpy.ops.object.select_all(action='DESELECT')
            for o in objects: o.select_set(True)
            bpy.context.view_layer.objects.active=objects[0]
            if len(objects)>1: bpy.ops.object.join()
            o=bpy.context.object
            o.name=self.root.name+'__'+tag+'__'+material.split(self.root.name+'_')[-1]
            o['part'] = tag
            if tag == 'glass': o['glass'] = True
            if '_rider_' in material: o['rider'] = True
            bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
            world=o.matrix_world.copy(); o.parent=pivots.get(tag,self.root); o.matrix_world=world
        return self.root
