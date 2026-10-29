"""Author the Mumbai concept cast in Blender and export the game library.

python scripts/characters/make_atlas.py
blender --background --factory-startup --python scripts/characters/build_mumbai_characters.py

Game coordinates throughout: X right, Y up, Z facing forward, metres.
The .blend retains twenty editable rigid-deformation rigs, packed painted textures,
the seated player and first-person hands. No image planes represent people.
"""
import bpy
import bmesh
import json
import math
import os
import random
import sys
from pathlib import Path
from mathutils import Vector, Matrix

ROOT = Path(os.environ.get("MUMBAI_CHARACTERS_ROOT", str(Path(__file__).resolve().parents[2])))
OUT = ROOT / "assets/characters/mumbai"
RUNTIME = ROOT / "public/models"
OUT.mkdir(parents=True, exist_ok=True)
RUNTIME.mkdir(parents=True, exist_ok=True)
ATLAS = json.loads((OUT / "atlas.json").read_text())
SCENE_NAME = "Mumbai Characters | Reference Cast"
old = bpy.data.scenes.get(SCENE_NAME)
if old:
    for obj in list(old.objects):
        bpy.data.objects.remove(obj, do_unlink=True)
    bpy.data.scenes.remove(old)
scene = bpy.data.scenes.new(SCENE_NAME)
bpy.context.window.scene = scene
scene.unit_settings.system = "METRIC"
scene.render.engine = "BLENDER_EEVEE"
scene.view_settings.view_transform = "Standard"
scene.view_settings.look = "Medium High Contrast"
scene.view_settings.exposure = 0
scene.view_settings.gamma = 1
scene.eevee.use_gtao = True
scene.eevee.gtao_distance = 3
scene.eevee.gtao_factor = 1.2
scene.eevee.taa_render_samples = 96
asset = bpy.data.collections.new("Mumbai cast | export")
scene.collection.children.link(asset)


def point(p):
    return Vector((p[0], -p[2], p[1]))


def game(p):
    return Vector((p[0], p[2], -p[1]))


def linear(color):
    color = color.lstrip("#")
    values = [int(color[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    return tuple(v / 12.92 if v <= .04045 else ((v + .055) / 1.055) ** 2.4 for v in values)


material = bpy.data.materials.new("Mumbai cast | painted cotton, skin and metal")
material.use_nodes = True
material.use_backface_culling = True
nodes = material.node_tree.nodes
links = material.node_tree.links
bsdf = nodes.get("Principled BSDF")
bsdf.inputs["Roughness"].default_value = .8
bsdf.inputs["Specular"].default_value = .28
color_tex = nodes.new("ShaderNodeTexImage")
color_tex.image = bpy.data.images.load(str(OUT / "cast-basecolor.png"), check_existing=True)
color_tex.image.pack()
color_tex.label = "Original hand-drawn textile motifs"
vertex_color = nodes.new("ShaderNodeVertexColor")
vertex_color.layer_name = "Color"
multiply = nodes.new("ShaderNodeMixRGB")
multiply.blend_type = "MULTIPLY"
multiply.inputs[0].default_value = 1
links.new(color_tex.outputs["Color"], multiply.inputs[1])
links.new(vertex_color.outputs["Color"], multiply.inputs[2])
links.new(multiply.outputs[0], bsdf.inputs["Base Color"])
orm_tex = nodes.new("ShaderNodeTexImage")
orm_tex.image = bpy.data.images.load(str(OUT / "cast-orm.png"), check_existing=True)
orm_tex.image.colorspace_settings.name = "Non-Color"
orm_tex.image.pack()
separate = nodes.new("ShaderNodeSeparateRGB")
links.new(orm_tex.outputs["Color"], separate.inputs[0])
links.new(separate.outputs["G"], bsdf.inputs["Roughness"])
links.new(separate.outputs["B"], bsdf.inputs["Metallic"])

CURRENT = ""
PARTS = []
JOINTS = {}
CAST_JOINTS = {}


def register(data, name, fabric="plain", color="ffffff", bone="body", smooth=True):
    obj = bpy.data.objects.new(CURRENT + " | " + name, data)
    asset.objects.link(obj)
    data.materials.append(material)
    # Atlas projection in game space, with a gutter around every tile.
    uv = data.uv_layers.new(name="UVMap")
    tile = ATLAS[fabric]["index"]
    tx, ty = tile % 8, tile // 8
    positions = [game(v.co) for v in data.vertices]
    lows = [min(p[k] for p in positions) for k in range(3)]
    spans = [max(p[k] for p in positions) - lows[k] or 1 for k in range(3)]
    for poly in data.polygons:
        normal = game(poly.normal)
        axis = max(range(3), key=lambda k: abs(normal[k]))
        a, b = (0, 1) if axis == 2 else (2, 1) if axis == 0 else (0, 2)
        for li in poly.loop_indices:
            v = positions[data.loops[li].vertex_index]
            u, w = (v[a] - lows[a]) / spans[a], (v[b] - lows[b]) / spans[b]
            uv.data[li].uv = ((tx + .024 + u * .952) / 8, 1 - (ty + .976 - w * .952) / 8)
        poly.use_smooth = smooth
    colors = data.color_attributes.new(name="Color", type="FLOAT_COLOR", domain="CORNER")
    rgba = (*linear(color), 1)
    colors.data.foreach_set("color", list(rgba) * len(data.loops))
    group = obj.vertex_groups.new(name=bone)
    group.add(list(range(len(data.vertices))), 1, "REPLACE")
    obj["cast_id"] = CURRENT
    obj["part_name"] = name
    PARTS.append(obj)
    return obj


def mesh(name, verts, faces, fabric="plain", color="ffffff", bone="body", smooth=True):
    data = bpy.data.meshes.new(CURRENT + " | " + name)
    data.from_pydata([point(v) for v in verts], [], faces)
    data.update()
    bm = bmesh.new()
    bm.from_mesh(data)
    bmesh.ops.recalc_face_normals(bm, faces=list(bm.faces))
    bm.to_mesh(data)
    bm.free()
    return register(data, name, fabric, color, bone, smooth)


def box(name, center, size, fabric="plain", color="ffffff", bevel=.025, bone="body"):
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1)
    for v in bm.verts:
        v.co.x *= size[0]
        v.co.y *= size[2]
        v.co.z *= size[1]
    if bevel:
        bmesh.ops.bevel(bm, geom=list(bm.edges), offset=min(bevel, min(size) * .45), segments=3, affect="EDGES", profile=.5)
    for v in bm.verts:
        v.co += point(center)
    bmesh.ops.recalc_face_normals(bm, faces=list(bm.faces))
    data = bpy.data.meshes.new(name)
    bm.to_mesh(data)
    bm.free()
    obj = register(data, name, fabric, color, bone)
    # Broad faces stay flat, rounded edges remain smooth.
    for poly in data.polygons:
        poly.use_smooth = len(poly.vertices) <= 4 and poly.area < max(size) ** 2 * .15
    return obj


def oval(name, center, radii, fabric="plain", color="ffffff", bone="body", power=1, segments=20, rings=12):
    def spow(v):
        return math.copysign(abs(v) ** power, v)
    verts, faces = [], []
    for j in range(rings + 1):
        lat = -math.pi / 2 + math.pi * j / rings
        for i in range(segments):
            a = math.tau * i / segments
            verts.append((center[0] + radii[0] * spow(math.cos(lat)) * spow(math.sin(a)),
                          center[1] + radii[1] * spow(math.sin(lat)),
                          center[2] + radii[2] * spow(math.cos(lat)) * spow(math.cos(a))))
    for j in range(rings):
        for i in range(segments):
            a = j * segments + i
            b = j * segments + (i + 1) % segments
            faces.append((a, b, b + segments, a + segments))
    return mesh(name, verts, faces, fabric, color, bone)


def tube(name, points, radius, fabric="plain", color="ffffff", bone="body", sides=8, taper=None):
    verts, faces = [], []
    pts = [Vector(p) for p in points]
    for i, p in enumerate(pts):
        tangent = (pts[min(i + 1, len(pts) - 1)] - pts[max(0, i - 1)]).normalized()
        normal = tangent.cross(Vector((0, 0, 1)))
        if normal.length < .01:
            normal = tangent.cross(Vector((0, 1, 0)))
        normal.normalize()
        bitangent = tangent.cross(normal).normalized()
        r = radius * (taper[i] if taper else 1)
        for j in range(sides):
            a = math.tau * j / sides
            verts.append(p + r * (normal * math.cos(a) + bitangent * math.sin(a)))
    for i in range(len(pts) - 1):
        for j in range(sides):
            a = i * sides + j
            b = i * sides + (j + 1) % sides
            faces.append((a, b, b + sides, a + sides))
    faces += [tuple(reversed(range(sides))), tuple((len(pts) - 1) * sides + j for j in range(sides))]
    return mesh(name, verts, faces, fabric, color, bone)


def curve(name, points, radius, fabric="plain", color="ffffff", bone="body", steps=16, taper=False):
    # Catmull-Rom keeps authored points on the actual visible curve.
    result = []
    controls = [Vector(points[0])] + [Vector(p) for p in points] + [Vector(points[-1])]
    for i in range(1, len(controls) - 2):
        p0, p1, p2, p3 = controls[i - 1:i + 3]
        for k in range(max(2, steps // (len(points) - 1))):
            t = k / max(2, steps // (len(points) - 1))
            result.append(.5 * ((2 * p1) + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t * t + (-p0 + 3 * p1 - 3 * p2 + p3) * t ** 3))
    result.append(Vector(points[-1]))
    scales = [.2 + .8 * math.sin(math.pi * i / (len(result) - 1)) ** .35 for i in range(len(result))] if taper else None
    return tube(name, result, radius, fabric, color, bone, sides=8, taper=scales)


def ring(name, center, radius, thickness, fabric="plain", color="ffffff", bone="body", axis="z", segments=24):
    pts = []
    for i in range(segments + 1):
        a = i * math.tau / segments
        off = (radius * math.cos(a), radius * math.sin(a), 0) if axis == "z" else (radius * math.cos(a), 0, radius * math.sin(a))
        pts.append(tuple(center[k] + off[k] for k in range(3)))
    return tube(name, pts, thickness, fabric, color, bone, sides=6)


def cylinder(name, center, radius, height, fabric="plain", color="ffffff", bone="body", top=None, sides=20):
    verts, faces = [], []
    for y, r in [(-height / 2, radius), (height / 2, top if top is not None else radius)]:
        for i in range(sides):
            a = math.tau * i / sides
            verts.append((center[0] + r * math.cos(a), center[1] + y, center[2] + r * math.sin(a)))
    faces.append(tuple(reversed(range(sides))))
    faces.append(tuple(sides + j for j in range(sides)))
    for j in range(sides):
        faces.append((j, (j + 1) % sides, (j + 1) % sides + sides, j + sides))
    return mesh(name, verts, faces, fabric, color, bone)


def loft(name, levels, fabric, color="ffffff", bone="body", pleats=0):
    verts, faces = [], []
    n = 48 if pleats else 24
    for y, w, d, z in levels:
        for i in range(n):
            a = i * math.tau / n
            x = math.copysign(abs(math.sin(a)) ** .55, math.sin(a)) * w / 2
            depth = math.copysign(abs(math.cos(a)) ** .55, math.cos(a)) * d / 2
            fold = 1 + pleats * math.cos(a * 12)
            verts.append((x * fold, y, z + depth * fold))
    for row in range(len(levels) - 1):
        for i in range(n):
            a = row * n + i
            b = row * n + (i + 1) % n
            faces.append((a, b, b + n, a + n))
    faces += [tuple(reversed(range(n))), tuple((len(levels) - 1) * n + i for i in range(n))]
    return mesh(name, verts, faces, fabric, color, bone)


def ribbon(name, points, width, fabric, bone="body", color="ffffff"):
    verts, faces = [], []
    for i, p in enumerate(points):
        tangent = Vector(points[min(i + 1, len(points) - 1)]) - Vector(points[max(0, i - 1)])
        side = Vector((-tangent.y, tangent.x, 0)).normalized() * width / 2
        verts.extend([Vector(p) + side, Vector(p) - side])
        if i:
            faces.append((i * 2 - 2, i * 2 - 1, i * 2 + 1, i * 2))
    obj = mesh(name, verts, faces, fabric, color, bone)
    solid = obj.modifiers.new("Cloth thickness", "SOLIDIFY")
    solid.thickness = .006
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.modifier_apply(modifier=solid.name)
    return obj


# The palette follows the generated boards; the written brief decides accessory detail.
CAST = [
    dict(id="sachin", name="Sachin", skin="c98b53", hair="191c22", cut="swept", top="khaki", bottom="khaki", moustache=True, prop="keys", footwear="sandals"),
    dict(id="raju", name="Raju Kaka", skin="b47b4b", hair="828587", cut="silver", top="khaki", bottom="khaki", moustache=True, prop="towel", width=1.10, age=True, footwear="sandals"),
    dict(id="meera", name="Meera Tai", skin="c18a58", hair="202027", cut="bun", top="maroon", bottom="green_sari", sari=True, female=True, prop="kettle", width=1.08, jewellery=True, footwear="sandals"),
    dict(id="sameer", name="Sameer", skin="c38b5b", hair="24201d", cut="curly", top="work_blue", bottom="dark", prop="wrench", beard=True, footwear="boots"),
    dict(id="aarti", name="Aarti", skin="d19a68", hair="252125", cut="long", top="blue_kurta", bottom="cream", kurta=True, female=True, prop="phone", jewellery=True, footwear="sneakers"),
    dict(id="imran", name="Imran", skin="c9915d", hair="171c21", cut="curly", top="hoodie", bottom="jeans", prop="headphones", hoodie=True, footwear="sneakers"),
    dict(id="lata", name="Lata Mavshi", skin="ba814f", hair="52504c", cut="bun", top="orange_blouse", bottom="purple_sari", sari=True, female=True, prop="flowers", width=1.08, age=True, jewellery=True, footwear="sandals"),
    dict(id="patil", name="Constable Patil", skin="be8250", hair="202123", cut="short", top="white", bottom="khaki", moustache=True, prop="whistle", hat="police", width=1.05, footwear="boots"),
    dict(id="nilesh", name="Nilesh", skin="c18b57", hair="202025", cut="short", top="white", bottom="white", moustache=True, prop="tiffins", hat="gandhi", footwear="sandals"),
    dict(id="farah", name="Farah", skin="c78e5e", hair="292125", cut="ponytail", top="teal", bottom="teal", kurta=True, female=True, prop="fruit", jewellery=True, width=1.05, footwear="sandals"),
    dict(id="suresh", name="Suresh", skin="b77e51", hair="979890", cut="silver", top="plaid", bottom="dark", moustache=True, prop="paper", age=True, footwear="sandals"),
    dict(id="pooja", name="Pooja", skin="cc9366", hair="211f24", cut="ponytail", top="scrubs", bottom="scrubs", female=True, prop="badge", footwear="sneakers"),
    dict(id="vikram", name="Vikram", skin="c38d60", hair="201d1e", cut="swept", top="pale_blue", bottom="navy", moustache=True, prop="glasses", footwear="boots"),
    dict(id="zoya", name="Zoya", skin="c89061", hair="322425", cut="bob", top="rust", bottom="dark", female=True, prop="sketchbook", footwear="sneakers"),
    dict(id="bala", name="Bala", skin="c48c5a", hair="222124", cut="short", top="orange", bottom="dark", prop="delivery", hat="helmet", footwear="sneakers"),
    dict(id="jyoti", name="Jyoti", skin="b78050", hair="292322", cut="bun", top="blue_workwear", bottom="blue_workwear", female=True, prop="broom", hat="workcap", width=1.06, footwear="boots"),
    dict(id="shanta", name="Shanta Aaji", skin="c5976c", hair="b4b2ac", cut="bun", top="blue_sari", bottom="blue_sari", sari=True, female=True, prop="shopping", age=True, jewellery=True, width=.98, footwear="sandals"),
    dict(id="dev", name="Dev", skin="c08b5d", hair="302522", cut="curly", top="olive", bottom="cargo", prop="camera", beard=True, footwear="boots"),
    dict(id="asha", name="Asha", skin="c99363", hair="272126", cut="ponytail", top="sports", bottom="dark", female=True, prop="bottle", footwear="sneakers"),
    dict(id="ganesh", name="Ganesh", skin="ae774b", hair="302a25", cut="short", top="ochre", bottom="dark", moustache=True, prop="crate", width=1.14, footwear="sandals"),
]


def face(c):
    skin, hair = c["skin"], c["hair"]
    female = c.get("female", False)
    w = .255 if female else .268
    oval("rounded block head", (0, 1.555, 0), (w, .248, .223), color=skin, bone="head", power=.48, segments=32, rings=20)
    oval("neck", (0, 1.335, -.018), (.105, .115, .104), color=skin, bone="body")
    for s in (-1, 1):
        oval("ear", (s * (w + .01), 1.54, -.01), (.049, .079, .053), color=skin, bone="head", segments=12, rings=8)
        oval("ear inner", (s * (w + .018), 1.54, .035), (.026, .047, .012), color="af704e", bone="head", segments=12, rings=8)
        ex = s * .108
        oval("eye white", (ex, 1.578, .22), (.066, .042, .024), color="fff3da", bone="head", segments=20, rings=12)
        oval("brown iris", (ex - s * .009, 1.574, .244), (.030, .032, .012), color="5c3520", bone="head", segments=16, rings=10)
        oval("pupil", (ex - s * .009, 1.575, .253), (.0165, .022, .008), color="141718", bone="head", segments=12, rings=8)
        oval("eye catchlight", (ex - .011, 1.59, .26), (.009, .0105, .004), color="ffffff", bone="head", segments=8, rings=6)
        curve("upper eyelid", [(ex - .064, 1.575, .231), (ex - .038, 1.61, .24), (ex + .03, 1.615, .24), (ex + .064, 1.58, .23)], .008 if female else .006, color="473024", bone="head")
        curve("expressive eyebrow", [(ex - .069, 1.653, .215), (ex - .017, 1.673, .229), (ex + .044, 1.663, .222)], .019 if female else .024, color=hair if not c.get("age") else "55504a", bone="head", taper=True)
        if female:
            curve("eyelash", [(ex + s * .05, 1.603, .24), (ex + s * .072, 1.615, .239)], .006, color=hair, bone="head", steps=4)
        if c.get("age"):
            curve("smile crease", [(s * .163, 1.536, .218), (s * .18, 1.525, .209), (s * .187, 1.51, .198)], .0035, color="9d693e", bone="head", steps=8)
    oval("nose bridge", (0, 1.542, .227), (.035, .064, .04), color=skin, bone="head", segments=16, rings=10)
    oval("rounded nose tip", (0, 1.511, .258), (.049 if not female else .039, .035, .046), color=skin, bone="head", segments=16, rings=10)
    for s in (-1, 1):
        oval("nostril", (s * .027, 1.492, .274), (.009, .006, .006), color="855136", bone="head", segments=8, rings=6)
    # A curved, recessed smile, a little tooth edge and a warm lower lip.
    curve("smile", [(-.109, 1.453, .215), (-.055, 1.426, .224), (.018, 1.421, .228), (.087, 1.443, .217)], .010, color="743e2c", bone="head", taper=True)
    curve("smile tooth edge", [(-.079, 1.441, .226), (-.022, 1.433, .233), (.047, 1.44, .229)], .006, color="fff0d6", bone="head", taper=True)
    curve("lower lip", [(-.057, 1.413, .217), (0, 1.405, .222), (.061, 1.424, .213)], .007, color="ac633f", bone="head", taper=True)
    if c.get("moustache"):
        for s in (-1, 1):
            curve("moustache", [(0, 1.478, .254), (s * .048, 1.478, .255), (s * .094, 1.479, .242), (s * .115, 1.492, .225)], .021, color=hair, bone="head", taper=True)
            if c.get("age"):
                curve("silver moustache strand", [(s * .012, 1.487, .269), (s * .071, 1.49, .258), (s * .10, 1.499, .24)], .004, color="b9b6aa", bone="head", steps=8)
    if c.get("beard"):
        curve("trimmed beard", [(-.198, 1.455, .163), (-.13, 1.363, .165), (0, 1.331, .15), (.13, 1.363, .165), (.198, 1.455, .163)], .017, color=hair, bone="head", steps=22)
        for s in (-1, 1):
            curve("light moustache", [(s * .014, 1.474, .25), (s * .049, 1.47, .249), (s * .087, 1.477, .238)], .01, color=hair, bone="head", taper=True)
    if c.get("jewellery") or c["id"] == "jyoti":
        oval("bindi", (0, 1.673, .226), (.013, .018, .008), color="a42125", bone="head", segments=10, rings=8)
        for s in (-1, 1):
            ring("gold earring", (s * .272, 1.464, .012), .031, .006, "gold", bone="head", segments=16)
    if c["id"] in ("vikram", "shanta"):
        for s in (-1, 1):
            pts = [(s * .108 - .08, 1.621, .255), (s * .108 + .075, 1.621, .255), (s * .108 + .067, 1.526, .255), (s * .108 - .07, 1.526, .255), (s * .108 - .08, 1.621, .255)]
            curve("spectacle frame", pts, .011 if c["id"] == "vikram" else .006, "black" if c["id"] == "vikram" else "gold", bone="head", steps=24)
            tube("spectacle arm", [(s * .183, 1.601, .248), (s * .268, 1.604, .02)], .006, "black", bone="head")
        curve("glasses bridge", [(-.032, 1.592, .26), (0, 1.604, .275), (.032, 1.592, .26)], .006, "black" if c["id"] == "vikram" else "gold", bone="head", steps=8)


def hairstyle(c):
    cut, color = c["cut"], c["hair"]
    rng = random.Random(c["id"])
    oval("hair cap", (0, 1.727, -.035), (.271, .105, .232), color=color, bone="head", power=.7, segments=24, rings=12)
    box("back hair", (0, 1.62, -.203), (.455, .26, .072), color=color, bevel=.032, bone="head")
    for s in (-1, 1):
        box("sideburn", (s * .244, 1.631, -.01), (.035, .142, .115), color=color, bevel=.015, bone="head")
    if c.get("hat") and cut in ("short", "swept", "silver", "curly"):
        # Short covered hair must not poke through caps or the helmet shell.
        return
    if cut == "curly":
        for i in range(19):
            a = i * 2.399963
            radius = .18 * math.sqrt((i + 1) / 19)
            x, z = math.cos(a) * radius * 1.2, math.sin(a) * radius
            y = 1.861 + .032 * rng.random() - .16 * radius
            oval("sculpted curl", (x, y, z - .02), (.065, .061, .064), color=color, bone="head", segments=12, rings=8)
            curve("curl ridge", [(x - .043, y + .009, z + .008), (x, y + .056, z + .012), (x + .036, y + .018, z + .04)], .009, color="3d332d", bone="head", steps=10, taper=True)
        for x in [-.21, -.08, .06, .2]:
            curve("curly fringe", [(x, 1.833, .09), (x + .016, 1.773, .212), (x - .025, 1.697, .203)], .035, color=color, bone="head", taper=True)
        for s in (-1, 1):
            for i in range(3):
                oval("temple curl", (s * (.256 + .005 * i), 1.772 - i * .04, -.015 + i * .047), (.057, .048, .05), color=color, bone="head", segments=12, rings=8)
    elif cut in ("swept", "silver", "short"):
        for i in range(8):
            x = -.23 + i * .061
            curve("swept hair lock", [(x, 1.703 + i * .006, .16), (x - .044, 1.80 + .031 * math.sin(i * .5), .175), (x - .01, 1.877 - abs(x) * .15, .019), (x + .049, 1.774, -.183)], .028 if cut != "short" else .019, color=color, bone="head", steps=20, taper=True)
            curve("hair highlight groove", [(x - .008, 1.763, .191), (x - .012, 1.866 - abs(x) * .15, .039), (x + .034, 1.8, -.14)], .004, color="b2b4b0" if cut == "silver" else "433b32", bone="head", steps=12, taper=True)
    else:
        for s in (-1, 1):
            for i in range(4):
                curve("parted hair sweep", [(s * .015, 1.831, .034 - i * .019), (s * .125, 1.803, .199 - i * .014), (s * .256, 1.68, .061 - i * .039), (s * .231, 1.541, -.086 - i * .02)], .027, color=color, bone="head", steps=20, taper=True)
        if cut == "bun":
            oval("coiled bun", (0, 1.583, -.285), (.128, .135, .105), color=color, bone="head", segments=20, rings=12)
            for i in range(4):
                curve("bun spiral", [(-.10, 1.60 + i * .017, -.327), (0, 1.672 + i * .009, -.37), (.092, 1.61 + i * .01, -.335)], .012, color="9d9990" if c.get("age") else "39302e", bone="head", steps=12)
            if c["id"] == "lata":
                for i in range(7):
                    a = i * .55
                    oval("flowers in hair", (.13 * math.cos(a), 1.59 + .105 * math.sin(a), -.294), (.024, .026, .025), color="f5aa19" if i % 2 else "f0dfad", bone="head", segments=8, rings=6)
        elif cut == "ponytail":
            ring("hair tie", (0, 1.669, -.283), .049, .012, color="693352", bone="head", segments=12)
            for i in range(5):
                x = (i - 2) * .023
                offset = .24 if c["id"] == "asha" else .12
                curve("pony tail lock", [(x, 1.699, -.273), (x + .07, 1.643, -.363), (x + offset, 1.465, -.354), (x + offset * .85, 1.342, -.28)], .033, color=color, bone="head", steps=20, taper=True)
        else:
            end = 1.235 if cut == "long" else 1.435
            for s in (-1, 1):
                for i in range(5):
                    curve("loose wavy hair", [(s * .221, 1.746, .025 - i * .043), (s * .299, 1.595, .093 - i * .04), (s * .324, end + .115, .055 - i * .043), (s * .276, end, .077 - i * .041)], .03, color=color, bone="head", steps=24, taper=True)
                curve("soft hair highlight", [(s * .249, 1.70, .106), (s * .321, 1.553, .105), (s * .315, end + .09, .096)], .004, color="4b3832", bone="head", steps=16, taper=True)


def headwear(c):
    hat = c.get("hat")
    if hat == "gandhi":
        loft("Gandhi cap", [(1.79, .50, .39, 0), (1.865, .49, .36, 0), (1.964, .18, .28, -.005)], "white", bone="head")
        curve("Gandhi cap seam", [(-.24, 1.829, .09), (0, 1.852, .195), (.24, 1.829, .09)], .004, color="d1cbbb", bone="head")
    elif hat in ("police", "workcap"):
        fabric = "white" if hat == "police" else "work_blue"
        oval("uniform cap crown", (0, 1.852, -.026), (.298, .105, .25) if hat == "police" else (.279, .139, .235), fabric, bone="head", power=.6 if hat == "police" else 1)
        box("cap band", (0, 1.79, .005), (.51, .061, .435), "black" if hat == "police" else fabric, bevel=.026, bone="head")
        oval("cap peak", (0, 1.776, .235), (.268, .025, .146), fabric, bone="head")
        if hat == "police":
            oval("police cap badge", (0, 1.857, .226), (.025, .036, .007), "gold", bone="head", segments=12, rings=8)
    elif hat == "helmet":
        # Open-face shell and visible chin strap, rather than a closed head box.
        oval("helmet crown", (0, 1.793, -.035), (.312, .207, .288), "black", bone="head", segments=28, rings=16)
        for s in (-1, 1):
            oval("helmet ear cover", (s * .272, 1.659, -.033), (.054, .157, .173), "black", bone="head")
            oval("helmet rivet", (s * .30, 1.716, .078), (.012, .015, .014), "silver", bone="head", segments=8, rings=6)
        curve("helmet face rim", [(-.277, 1.571, .099), (-.264, 1.755, .183), (0, 1.809, .25), (.264, 1.755, .183), (.277, 1.571, .099)], .012, color="bda37d", bone="head", steps=24)
        curve("chin strap", [(-.255, 1.56, .007), (-.147, 1.342, .045), (.13, 1.342, .045), (.255, 1.56, .007)], .012, "black", bone="head")


def torso(c):
    w = c.get("width", 1)
    female = c.get("female", False)
    top = c["top"]
    levels = [(.79, .55 * w, .335, -.008), (.86, .585 * w, .36, 0), (1.11, (.535 if female else .59) * w, .36, 0), (1.285, .57 * w, .345, -.012), (1.335, .435 * w, .30, -.014)]
    loft("tailored torso", levels, top)
    if c.get("kurta"):
        loft("kurta skirt", [(.575, .64 * w, .415, .007), (.64, .625 * w, .40, .004), (.89, .555 * w, .35, 0)], top)
        ribbon("embroidered kurta hem", [(-.30 * w, .617, .208), (0, .612, .22), (.30 * w, .617, .208)], .025, "gold" if c["id"] == "farah" else "cream")
    if c.get("sari"):
        skirt = c["bottom"]
        loft("pleated sari skirt", [(.105, .74 * w, .44, 0), (.17, .733 * w, .43, 0), (.43, .666 * w, .4, 0), (.7, .595 * w, .376, 0), (.91, .54 * w, .35, 0)], skirt, pleats=.035)
        loft("woven sari border", [(.112, .746 * w, .447, .001), (.155, .738 * w, .441, .001), (.176, .733 * w, .438, .001)], "gold", pleats=.035)
        ribbon("draped sari pallu", [(-.28 * w, .62, .23), (-.15 * w, .87, .208), (.05, 1.085, .205), (.185 * w, 1.292, .182), (.245 * w, 1.352, -.021), (.22 * w, 1.22, -.207), (.20 * w, .67, -.226)], .305, skirt)
        ribbon("gold pallu selvedge", [(-.414 * w, .697, .239), (-.272 * w, .968, .221), (-.073, 1.187, .219), (.094 * w, 1.366, .195)], .014, "gold")
        for i in range(5):
            x = -.18 + i * .07
            curve("front sari fold", [(x * .75, .818, .186), (x, .53, .222), (x * 1.18, .19, .245)], .008, skirt, color="d9d3c6", steps=12)
    elif c.get("hoodie"):
        ring("hood opening", (0, 1.323, -.02), .172, .044, top, axis="y", segments=24)
        box("kangaroo pocket", (0, .945, .194), (.38, .19, .029), top, bevel=.035)
        for s in (-1, 1):
            curve("hood cord", [(s * .072, 1.291, .187), (s * .079, 1.155, .203)], .006, color="e0d4be", steps=6)
            box("cord metal tip", (s * .079, 1.143, .205), (.014, .034, .012), "silver", bevel=.003)
        loft("ribbed hoodie waistband", [(.792, .556, .345, 0), (.833, .571, .358, 0)], top, color="d2c0bd")
    elif c["id"] == "asha":
        ring("sports neckline", (0, 1.318, .004), .115, .009, top, color="bb95c7", axis="y")
        curve("shirt seam", [(-.26, .832, .174), (0, .829, .19), (.26, .832, .174)], .004, top, color="baaac0")
    else:
        # Soft collar points and an actual shirt placket.
        if c["id"] == "pooja":
            ribbon("scrub v neck", [(-.10, 1.328, .11), (0, 1.198, .19), (.10, 1.328, .11)], .02, top, color="c6b5d4")
        else:
            for s in (-1, 1):
                mesh("folded shirt collar", [(s * .035, 1.329, .157), (s * .125, 1.359, .103), (s * .178, 1.235, .201), (s * .07, 1.255, .219)], [(0, 3, 2, 1)] if s > 0 else [(0, 1, 2, 3)], top, bone="body", smooth=False)
            box("shirt placket", (0, 1.048, .19), (.022, .42, .012), top, bevel=.004)
            for y in [.884, .991, 1.093, 1.20]:
                oval("shirt button", (.008, y, .202), (.008, .008, .006), color="655442", segments=8, rings=6)
        if not c.get("kurta"):
            for s in (-1, 1):
                box("breast pocket", (s * .16, 1.14, .183), (.135, .145, .018), top, bevel=.012)
                curve("pocket seam", [(s * .16 - .056, 1.191, .195), (s * .16 + .056, 1.191, .195)], .003, top, color="b8aaa0", steps=4)
        if c["id"] in ("dev", "zoya"):
            mesh("open overshirt t shirt", [(-.077, .853, .198), (.077, .853, .198), (.062, 1.30, .18), (-.062, 1.30, .18)], [(0, 1, 2, 3)], "white" if c["id"] == "dev" else "black", smooth=False)
    if c["id"] in ("patil", "vikram", "sameer", "dev", "zoya"):
        loft("leather belt", [(.801, .555 * w, .35, 0), (.851, .563 * w, .361, 0)], "leather")
        box("belt buckle", (.015, .826, .192), (.083, .047, .018), "silver", bevel=.009)
        box("buckle inset", (.015, .826, .204), (.056, .026, .005), "leather", bevel=.003)
    if c["id"] == "patil":
        for s in (-1, 1):
            box("uniform epaulette", (s * .25, 1.31, -.005), (.12, .025, .16), "white", bevel=.008)
        box("name badge", (-.155, 1.233, .18), (.099, .025, .009), "gold", bevel=.003)
        for i, color in enumerate(["ad3c30", "d9c652", "365b80"]):
            box("service ribbon", (.126 + i * .024, 1.234, .181), (.022, .016, .008), color=color, bevel=.002)
    if c["id"] == "jyoti":
        for s in (-1, 1):
            ribbon("lime safety vest", [(s * .26, .826, .205), (s * .20, 1.08, .205), (s * .22, 1.305, .16), (s * .23, 1.325, -.09), (s * .2, .84, -.195)], .145, "lime")
            ribbon("reflective shoulder tape", [(s * .18, .836, .216), (s * .15, 1.13, .22), (s * .17, 1.311, .177)], .03, "silver")
        ribbon("reflective waist band", [(-.303, .956, .205), (0, .956, .218), (.303, .956, .205)], .033, "silver")
    if c["id"] in ("meera", "farah"):
        box("tied vendor apron", (0, .793, .226), (.445, .393, .025), "apron" if c["id"] == "farah" else "apron_cream", bevel=.021)
        ribbon("apron tie", [(-.296, .976, .061), (-.248, .997, .206), (0, .997, .249), (.248, .997, .206), (.296, .976, .061)], .027, "cream")
        if c["id"] == "meera":
            box("apron pocket", (.105, .78, .244), (.16, .15, .008), "apron_cream", bevel=.01)


def footwear(c, s):
    x = s * .163
    bone = "leg_" + ("l" if s < 0 else "r") + "_lower"
    style = c["footwear"]
    if style == "sandals":
        box("sandal sole", (x, .052, .062), (.263, .067, .373), "black", bevel=.028, bone=bone)
        oval("foot", (x, .099, .031), (.112, .07, .149), color=c["skin"], bone=bone)
        for i in range(4):
            oval("toe", (x - .073 + i * .048, .095, .199 - i * .005), (.024, .025, .04), color=c["skin"], bone=bone, segments=8, rings=6)
        for z in [-.01, .119]:
            curve("sandal strap", [(x - .109, .079, z), (x - .067, .149, z + .009), (x + .067, .149, z + .009), (x + .109, .079, z)], .020, "leather", bone=bone, steps=12)
    else:
        fabric = "cream" if style == "sneakers" else "black"
        box("shoe sole", (x, .049, .066), (.278, .072, .396), "sole" if style == "sneakers" else "black", bevel=.024, bone=bone)
        oval("rounded shoe", (x, .11, .047), (.131, .098, .185), fabric, bone=bone, power=.55, segments=16, rings=10)
        box("shoe tongue", (x, .197, -.007), (.137, .058, .11), fabric, bevel=.022, bone=bone)
        for i in range(3):
            tube("shoe lace", [(x - .063, .197 - i * .009, .034 + i * .032), (x + .063, .197 - i * .009, .034 + i * .032)], .006, "cream" if style == "sneakers" else "leather", bone=bone, sides=6)


def limbs(c):
    w = c.get("width", 1)
    for s in (-1, 1):
        suffix = "l" if s < 0 else "r"
        hip, knee, ankle = (s * .16, .82, 0), (s * .163, .48, .011), (s * .163, .13, .017)
        JOINTS["leg_" + suffix] = (hip, knee, "body")
        JOINTS["leg_" + suffix + "_lower"] = (knee, ankle, "leg_" + suffix)
        if not c.get("sari"):
            tube("tailored trouser thigh", [hip, (s * .163, .66, .005), knee], .13 if c["id"] != "asha" else .117, c["bottom"], bone="leg_" + suffix, sides=12, taper=[1.06, 1.02, .94])
            tube("tailored trouser shin", [knee, (s * .163, .25, .008), (s * .163, .157, .024)], .126 if c["id"] != "asha" else .10, c["bottom"], bone="leg_" + suffix + "_lower", sides=12, taper=[.97, 1.0, 1.08])
            curve("trouser crease", [(s * .162, .755, .133), (s * .162, .606, .135), (s * .162, .495, .125)], .003, c["bottom"], color="ccbeb1", bone="leg_" + suffix)
            if c["id"] in ("sameer", "dev", "bala"):
                box("cargo pocket", (s * .264, .63, .022), (.028, .17, .15), c["bottom"], bevel=.012, bone="leg_" + suffix)
            if c["id"] in ("jyoti", "asha"):
                tube("trouser reflective piping", [(s * .277, .71, .034), (s * .278, .50, .034)], .008, "silver" if c["id"] == "jyoti" else "sports", bone="leg_" + suffix)
        footwear(c, s)
        shoulder = (s * .318 * w, 1.284, -.005)
        elbow = (s * .402 * w, 1.036, .005)
        wrist = (s * .432 * w, .883, .058)
        if c["prop"] in ("flowers", "crate"):
            elbow = (s * .411 * w, 1.032, .022)
            wrist = (s * .316 * w, .97, .344)
        elif c["prop"] in ("phone", "whistle", "fruit", "paper") and s > 0:
            elbow = (.442 * w, 1.043, .02)
            wrist = (.448 * w, 1.277, .29)
        elif c["prop"] == "broom" and s > 0:
            elbow = (.463, 1.10, .009)
            wrist = (.515, 1.348, .10)
        elif c["prop"] == "wrench" and s > 0:
            elbow = (.44, 1.027, .012)
            wrist = (.467, 1.334, .102)
        elif c["prop"] == "kettle" and s > 0:
            elbow = (.46, 1.07, .013)
            wrist = (.49, 1.25, .28)
        JOINTS["arm_" + suffix] = (shoulder, elbow, "body")
        JOINTS["arm_" + suffix + "_lower"] = (elbow, wrist, "arm_" + suffix)
        short = c["id"] in ("sachin", "raju", "meera", "lata", "patil", "suresh", "shanta", "pooja", "asha", "ganesh")
        sleeve_end = Vector(shoulder).lerp(Vector(elbow), .66 if short else 1)
        oval("soft shoulder seam", Vector(shoulder).lerp(Vector(elbow), .16), (.116 * w, .114, .12), c["top"], bone="arm_" + suffix, segments=16, rings=10)
        tube("shirt sleeve", [shoulder, Vector(shoulder).lerp(Vector(elbow), .32), sleeve_end], .122 * w, c["top"], bone="arm_" + suffix, sides=12, taper=[1, 1.04, .88])
        if short:
            tube("upper arm", [sleeve_end, elbow], .089, color=c["skin"], bone="arm_" + suffix, sides=12)
        tube("forearm", [elbow, Vector(elbow).lerp(Vector(wrist), .5), wrist], .087, "plain" if short else c["top"], c["skin"] if short else "ffffff", "arm_" + suffix + "_lower", sides=12, taper=[1.1, 1, .86])
        if not short:
            # Rolled cuffs expose the actual hand.
            cuff = Vector(wrist).lerp(Vector(elbow), .11)
            tube("rolled sleeve cuff", [cuff, wrist], .091, c["top"], "c5bfb6", "arm_" + suffix + "_lower", sides=12)
        hand = Vector(wrist) + Vector((0, -.033, .009))
        handcolor = "d97c24" if c["id"] == "jyoti" else c["skin"]
        box("rounded palm", hand, (.164, .147, .134), color=handcolor, bevel=.041, bone="arm_" + suffix + "_lower")
        oval("thumb", hand + Vector((-s * .076, .012, .045)), (.045, .053, .044), color=handcolor, bone="arm_" + suffix + "_lower", segments=12, rings=8)
        for i in range(3):
            tube("finger crease", [(hand.x - .045 + i * .047, hand.y - .052, hand.z + .064), (hand.x - .045 + i * .047, hand.y - .024, hand.z + .072)], .0025, color="945e3c" if handcolor != "d97c24" else "a75521", bone="arm_" + suffix + "_lower", sides=5)
        if c.get("jewellery"):
            for i in range(2):
                ring("bangle", (wrist[0], wrist[1] + .012 + i * .016, wrist[2]), .083, .009, "gold", bone="arm_" + suffix + "_lower", axis="y", segments=16)


def strap(name, side, fabric="leather", back=True):
    z = -.245 if back else .21
    ribbon(name, [(side * .17, .93, z), (side * .198, 1.18, -.2), (side * .21, 1.34, -.01), (side * .21, 1.275, .185), (side * .238, .96, .21)], .043, fabric)


def bag(c, kind="backpack"):
    if kind in ("backpack", "delivery"):
        fab = "navy" if c["id"] == "aarti" else "black"
        size = (.49, .54, .26) if kind == "backpack" else (.57, .60, .40)
        box("insulated delivery pack" if kind == "delivery" else "backpack", (0, 1.075, -.335), size, fab, bevel=.052)
        box("bag outer pocket", (0, 1.02, -.487 if kind == "backpack" else -.553), (size[0] * .79, .28, .062), fab, bevel=.025)
        for s in (-1, 1):
            strap("padded backpack strap", s, fab)
        curve("pack handle", [(-.075, 1.341, -.34), (-.058, 1.396, -.34), (.058, 1.396, -.34), (.075, 1.341, -.34)], .012, fab)
        if kind == "delivery":
            ribbon("delivery bag orange piping", [(-.253, .801, -.555), (-.253, 1.30, -.555), (.253, 1.30, -.555), (.253, .801, -.555)], .013, "orange")
    else:
        fabric = "cream" if kind == "tote" else "leather"
        x = -.395
        box("canvas tote" if kind == "tote" else "leather satchel", (x, .786, -.042), (.17, .405, .35), fabric, bevel=.028)
        curve("shoulder bag strap", [(x, .937, -.155), (-.231, 1.336, -.07), (-.22, 1.349, .12), (x, .962, .123)], .021, fabric)
        if kind == "satchel":
            box("satchel flap", (x - .088, .85, -.042), (.014, .228, .343), fabric, bevel=.011)
            for z in (-.13, .05):
                box("satchel buckle", (x - .098, .766, z), (.01, .061, .035), "gold", bevel=.003)


def flowers(center, radius=.17, count=18, bone="body"):
    rng = random.Random(792)
    for i in range(count):
        a = i * 2.399963
        r = radius * math.sqrt((i + 1) / count)
        p = Vector(center) + Vector((math.cos(a) * r * 1.8, .025 + rng.random() * .045, math.sin(a) * r))
        col = ["f4b817", "e47a10", "f2dca6", "efaa13"][i % 4]
        oval("marigold bloom", p, (.038, .034, .037), color=col, bone=bone, segments=10, rings=6)
        for j in range(5):
            t = j * math.tau / 5
            oval("marigold petals", p + Vector((.026 * math.cos(t), .014, .026 * math.sin(t))), (.018, .019, .018), color=col, bone=bone, segments=6, rings=4)


def basket(center, bone="body", fruit=False):
    x, y, z = center
    loft("woven selling basket", [(y - .105, .44, .24, z), (y + .08, .63, .35, z), (y + .108, .65, .36, z)], "basket", bone=bone)
    # Shift the loft when a basket is carried at the side.
    if x:
        for v in PARTS[-1].data.vertices:
            v.co.x += x
    pts = [(x + .32 * math.sin(i * math.tau / 32), y + .11, z + .177 * math.cos(i * math.tau / 32)) for i in range(33)]
    tube("basket braided rim", pts, .015, "basket", bone=bone)
    if not fruit:
        flowers((x, y + .107, z), bone=bone)
        for i in range(12):
            oval("hanging marigold garland", (x + .224 + .03 * math.sin(i * .4), y + .12 - i * .031, z + .193), (.029, .026, .024), color="f0ac14" if i % 3 else "f1dfb1", bone=bone, segments=8, rings=6)
    else:
        for i in range(9):
            a = i * 2.4
            oval("fruit in basket", (x + math.cos(a) * .20, y + .145, z + math.sin(a) * .09), (.044, .048, .043), color=["b63223", "e5a929", "85a140"][i % 3], bone=bone, segments=12, rings=8)


def props(c):
    prop = c["prop"]
    right = Vector(JOINTS["arm_r_lower"][1])
    left = Vector(JOINTS["arm_l_lower"][1])
    if prop == "keys":
        first_key = len(PARTS)
        p = right + Vector((.015, -.078, .046))
        ring("key ring", p, .036, .005, "silver", bone="arm_r_lower", segments=16)
        oval("black key fob", p + Vector((0, -.064, 0)), (.028, .035, .012), "black", bone="arm_r_lower", segments=12, rings=8)
        box("key blade", p + Vector((.016, -.115, .003)), (.019, .068, .009), "silver", bevel=.002, bone="arm_r_lower")
        for i in range(3):
            box("key tooth", p + Vector((.028, -.099 - i * .016, .003)), (.014, .008, .009), "silver", bevel=.002, bone="arm_r_lower")
        for obj in PARTS[first_key:]:
            obj.vertex_groups.new(name="hidden_when_seated").add(list(range(len(obj.data.vertices))), 1, "REPLACE")
    if prop in ("towel", "crate"):
        ribbon("cotton shoulder towel", [(-.202, .896, .223), (-.205, 1.194, .211), (-.223, 1.344, -.025), (-.208, 1.30, -.18), (-.213, 1.02, -.216)], .166, "white")
        for y in [.959, .973, 1.013]:
            ribbon("red towel border", [(-.286, y, .23), (-.121, y, .23)], .008, "rust")
        for i in range(9):
            tube("towel fringe", [(-.276 + i * .018, .904, .23), (-.276 + i * .018, .875, .23)], .0025, "white", sides=5)
    if prop == "kettle":
        p = left + Vector((0, -.21, .09))
        cylinder("steel kettle", p, .116, .188, "silver", top=.084)
        cylinder("kettle lid", p + Vector((0, .105, 0)), .092, .022, "silver")
        oval("kettle lid knob", p + Vector((0, .132, 0)), (.026, .025, .023), "black")
        curve("kettle bail handle", [p + Vector((-.093, .034, 0)), p + Vector((-.08, .219, 0)), p + Vector((.06, .226, 0)), p + Vector((.101, .044, 0))], .012, "silver", bone="arm_l_lower")
        curve("kettle spout", [p + Vector((.091, -.02, .03)), p + Vector((.178, .003, .044)), p + Vector((.208, .083, .047))], .027, "silver", bone="arm_l_lower", taper=True)
        # The kettle follows the wrist, including during walking and reactions.
        for obj in PARTS[-5:-2]:
            if obj.vertex_groups.get("body"):
                obj.vertex_groups["body"].name = "arm_l_lower"
        p = right + Vector((0, .016, .089))
        cylinder("cutting chai glass", p, .041, .131, "gold", bone="arm_r_lower", top=.048)
        cylinder("chai surface", p + Vector((0, .067, 0)), .044, .004, color="8d491b", bone="arm_r_lower")
        for i in range(8):
            a = i * math.tau / 8
            tube("glass fluting", [p + Vector((.04 * math.cos(a), -.058, .04 * math.sin(a))), p + Vector((.047 * math.cos(a), .057, .047 * math.sin(a)))], .0025, "silver", bone="arm_r_lower", sides=5)
    elif prop == "wrench":
        p = right + Vector((0, .022, 0))
        box("spanner shaft", p + Vector((-.17, .011, .008)), (.58, .043, .065), "silver", bevel=.01, bone="arm_r_lower")
        for s in (-1, 1):
            end = p + Vector((-.17 + s * .32, .011, .008))
            curve("open spanner jaw", [end + Vector((s * .058, .039, 0)), end + Vector((0, .066, 0)), end + Vector((-s * .045, 0, 0)), end + Vector((0, -.066, 0)), end + Vector((s * .058, -.039, 0))], .026, "silver", bone="arm_r_lower", steps=12)
    elif prop in ("phone", "whistle"):
        if prop == "phone":
            bag(c)
        else:
            ribbon("red whistle lanyard", [(-.09, 1.315, .13), (0, 1.066, .211), (.09, 1.315, .13)], .01, "rust")
            box("police whistle", (0, 1.065, .235), (.043, .054, .033), "silver", bevel=.012)
        p = right + Vector((0, .041, .07))
        box("phone", p, (.089, .184, .022), "black", bevel=.012, bone="arm_r_lower")
        box("phone display", p + Vector((0, .003, .014)), (.072, .144, .003), color="61777e", bevel=.005, bone="arm_r_lower")
        oval("phone camera", p + Vector((-.02, .073, -.014)), (.008, .01, .003), "silver", bone="arm_r_lower", segments=8, rings=6)
    elif prop in ("headphones", "sketchbook"):
        if prop == "headphones":
            bag(c)
        else:
            bag(c, "tote")
        curve("headphones headband", [(-.18, 1.341, .122), (-.164, 1.41, -.075), (0, 1.427, -.141), (.164, 1.41, -.075), (.18, 1.341, .122)], .024, "black", steps=20)
        for s in (-1, 1):
            oval("headphone ear cup", (s * .17, 1.321, .147), (.051, .068, .042), "black")
            oval("headphone metal ring", (s * .17, 1.321, .179), (.037, .051, .01), "silver")
        p = right + Vector((.025, .058, .076))
        box("book pages", p, (.19, .306, .061), "cream", bevel=.006, bone="arm_r_lower")
        for dz in [-.039, .038]:
            box("sketchbook cover" if prop == "sketchbook" else "college book cover", p + Vector((0, 0, dz)), (.202, .317, .009), "leather" if prop == "sketchbook" else "ochre", bevel=.002, bone="arm_r_lower")
        if prop == "sketchbook":
            for i in range(6):
                ring("sketchbook binding", p + Vector((-.109, -.126 + i * .049, .001)), .017, .003, "silver", bone="arm_r_lower", segments=8)
            rng = random.Random(447)
            for i in range(16):
                oval("paint splatter", (-.489, .67 + rng.random() * .30, -.18 + rng.random() * .24), (.006, .015, .017), color=["d88935", "357fa0", "95569a"][i % 3], segments=6, rings=4)
    elif prop == "flowers":
        basket((0, .971, .356))
    elif prop == "tiffins":
        for s in (-1, 1):
            x = s * .381
            for i in range(3):
                cylinder("steel tiffin dabba", (x, .601 + i * .111, .051), .093, .103, "silver")
                ring("tiffin rim", (x, .653 + i * .111, .051), .094, .008, "silver", axis="y", segments=16)
            curve("tiffin carrying frame", [(x - .108, .557, .052), (x - .108, .91, .052), (x + .108, .91, .052), (x + .108, .557, .052)], .011, "silver")
            strap("tiffin shoulder strap", s, "black")
    elif prop == "fruit":
        p = right + Vector((0, .039, .059))
        oval("red apple", p, (.057, .06, .054), color="bb3828", bone="arm_r_lower", segments=16, rings=10)
        tube("apple stem", [p + Vector((0, .055, 0)), p + Vector((.008, .078, -.002))], .005, color="554227", bone="arm_r_lower", sides=6)
        basket((-.445, .664, .134), bone="arm_l_lower", fruit=True)
    elif prop == "paper":
        bag(c, "satchel")
        p = right + Vector((0, .041, .064))
        box("today's newspaper", p, (.176, .292, .018), "newspaper", bevel=.003, bone="arm_r_lower")
        p = left + Vector((0, .017, .099))
        for i in range(5):
            box("folded newspaper bundle", p + Vector((.006 * i, .017 * i, 0)), (.23, .015, .186), "newspaper", bevel=.004, bone="arm_l_lower")
    elif prop == "badge":
        bag(c, "tote")
        ribbon("nurse ID lanyard", [(-.10, 1.325, .115), (0, 1.058, .216), (.10, 1.325, .115)], .014, "work_blue")
        box("nurse ID card", (0, 1.021, .222), (.080, .105, .012), "white", bevel=.004)
        box("ID portrait", (-.012, 1.033, .23), (.03, .038, .003), "pale_blue", bevel=.002)
        for i in range(2):
            box("ID text line", (.003, 1.0 - i * .011, .23), (.047, .003, .002), "navy", bevel=0)
    elif prop == "glasses":
        bag(c, "satchel")
        p = right + Vector((.019, .075, .078))
        box("closed laptop", p, (.214, .301, .028), "silver", bevel=.008, bone="arm_r_lower")
    elif prop == "delivery":
        bag(c, "delivery")
        ribbon("jacket zipper", [(0, .822, .199), (0, 1.297, .188)], .009, "black")
        box("zip pull", (0, 1.24, .206), (.021, .038, .012), "silver", bevel=.004)
    elif prop == "broom":
        p = right
        tube("wooden broom handle", [(p.x, .258, p.z), (p.x, 1.877, p.z)], .015, "leather", bone="arm_r_lower", sides=10)
        for i in range(18):
            dx = -.15 + i * .018
            tube("broom bristle bundle", [(p.x + dx, .029, p.z + .035), (p.x + dx * .47, .188, p.z), (p.x + dx * .1, .409, p.z)], .007, "basket", bone="arm_r_lower", sides=5)
        for y in [.326, .348]:
            ring("broom binding", (p.x, y, p.z), .036, .009, "ochre", bone="arm_r_lower", axis="y", segments=12)
    elif prop == "shopping":
        bag(c, "tote")
        for i in range(5):
            p = left + Vector((-.069, -.095, -.03 + i * .04))
            oval("greens in shopping bag", p, (.058, .077, .035), color="4b7832", segments=10, rings=6)
    elif prop == "camera":
        bag(c)
        ribbon("camera strap", [(-.089, 1.32, .128), (-.099, 1.032, .249), (.099, 1.032, .249), (.089, 1.32, .128)], .021, "black")
        box("camera body", (0, 1.056, .255), (.247, .159, .108), "black", bevel=.018)
        # Lens axis points out from the chest.
        ring("camera lens barrel", (0, 1.056, .333), .064, .025, "black", segments=20)
        oval("camera lens glass", (0, 1.056, .364), (.047, .047, .011), color="486570", segments=16, rings=8)
        box("camera flash", (-.083, 1.108, .314), (.048, .026, .007), "silver", bevel=.003)
        box("folded street map", right + Vector((.01, .036, .08)), (.173, .246, .019), "cream", bevel=.003, bone="arm_r_lower")
        for i in range(4):
            tube("map street", [right + Vector((-.06 + i * .035, -.06, .095)), right + Vector((-.08 + i * .035, .13, .095))], .003, color="698486", bone="arm_r_lower", sides=5)
    elif prop == "bottle":
        p = right + Vector((0, -.132, .024))
        cylinder("teal water bottle", p, .052, .245, color="389c99", bone="arm_r_lower", sides=16)
        cylinder("bottle shoulder", p + Vector((0, .139, 0)), .052, .031, color="389c99", bone="arm_r_lower", top=.031, sides=16)
        cylinder("bottle cap", p + Vector((0, .164, 0)), .035, .035, "black", bone="arm_r_lower", sides=12)
        ring("bottle carry loop", p + Vector((.028, .195, .003)), .026, .006, "black", bone="arm_r_lower", segments=12)
    elif prop == "crate":
        for y in [.874, .947, 1.016]:
            box("produce crate front slat", (0, y, .512), (.681, .056, .026), "basket", bevel=.007)
            box("produce crate rear slat", (0, y, .22), (.681, .056, .026), "basket", bevel=.007)
        for s in (-1, 1):
            box("crate end", (s * .327, .945, .366), (.039, .227, .316), "basket", bevel=.008)
        for i in range(9):
            oval("market produce", (-.25 + (i % 5) * .117, 1.073, .288 + (i // 5) * .139), (.052, .053, .049), color="cc5331" if i % 2 else "619339", segments=10, rings=6)


def join_parts(name):
    bpy.ops.object.select_all(action="DESELECT")
    for p in PARTS:
        p.select_set(True)
    bpy.context.view_layer.objects.active = PARTS[0]
    bpy.ops.object.join()
    obj = bpy.context.object
    obj.name = name
    scene.cursor.location = (0, 0, 0)
    bpy.ops.object.origin_set(type="ORIGIN_CURSOR")
    # Export one material/primitive per character, regardless of how many details.
    for poly in obj.data.polygons:
        poly.material_index = 0
    obj.data.materials.clear()
    obj.data.materials.append(material)
    return obj


def rig_character(c, obj):
    data = bpy.data.armatures.new(c["id"] + " | edit rig")
    rig = bpy.data.objects.new(c["id"], data)
    asset.objects.link(rig)
    bpy.context.view_layer.objects.active = rig
    rig.select_set(True)
    bpy.ops.object.mode_set(mode="EDIT")
    bones = {}
    for name, (head, tail, parent) in JOINTS.items():
        b = data.edit_bones.new(name)
        b.head, b.tail = point(head), point(tail)
        bones[name] = b
        if parent:
            b.parent = bones[parent]
    bpy.ops.object.mode_set(mode="OBJECT")
    rig["cast_id"] = c["id"]
    rig["display_name"] = c["name"]
    rig["reference_board"] = "01-mumbai-main-cast.png" if CAST.index(c) < 8 else "02-mumbai-street-crowd.png"
    rig["reference_index"] = CAST.index(c) + 1
    rig["held_basket"] = c["prop"] in ("flowers", "crate")
    obj.parent = rig
    mod = obj.modifiers.new("Rigid cartoon articulation", "ARMATURE")
    mod.object = rig
    rig.show_in_front = True
    obj["lod"] = "detail"
    obj["cast_id"] = c["id"]
    # A decimated copy keeps the exact same silhouette, textiles, props and weights.
    low = obj.copy()
    low.data = obj.data.copy()
    low.name = c["id"] + "_crowd"
    asset.objects.link(low)
    low["lod"] = "crowd"
    low["cast_id"] = c["id"]
    decimate = low.modifiers.new("Distant silhouette", "DECIMATE")
    decimate.ratio = .17
    decimate.use_collapse_triangulate = True
    bpy.context.view_layer.objects.active = low
    bpy.ops.object.modifier_apply(modifier=decimate.name)
    low.hide_render = True
    return rig, low


def triangles(obj):
    obj.data.calc_loop_triangles()
    return len(obj.data.loop_triangles)


def build_cast():
    global CURRENT, PARTS, JOINTS
    stats = []
    for c in CAST:
        CURRENT, PARTS = c["id"], []
        JOINTS = {"body": ((0, .82, 0), (0, 1.31, 0), None), "head": ((0, 1.333, -.012), (0, 1.8, -.012), "body")}
        face(c)
        hairstyle(c)
        headwear(c)
        torso(c)
        limbs(c)
        props(c)
        # Lift the head clear of the collar; the concept has a visible neck.
        for obj in PARTS:
            if obj.vertex_groups.get("head"):
                for v in obj.data.vertices:
                    v.co.z += .055
        JOINTS["head"] = ((0, 1.38, -.012), (0, 1.855, -.012), "body")
        CAST_JOINTS[c["id"]] = dict(JOINTS)
        model = join_parts(c["id"] + "_detail")
        rig, low = rig_character(c, model)
        stats.append({"id": c["id"], "name": c["name"], "detail_triangles": triangles(model), "crowd_triangles": triangles(low), "joints": list(JOINTS), "prop": c["prop"], "hair": c["cut"], "reference": rig["reference_board"], "reference_index": rig["reference_index"]})
        print("CHARACTER", json.dumps(stats[-1]), flush=True)
    return stats


def player_assets():
    global CURRENT, PARTS
    source = bpy.data.objects["sachin_detail"]
    seated = source.copy()
    seated.data = source.data.copy()
    seated.parent = None
    seated.name = "sachin_seated"
    seated.modifiers.clear()
    seated["lod"] = "player"
    seated["player_part"] = "seated"
    asset.objects.link(seated)
    # Fit shoulders, hips, hands and feet to the authored kaali-peeli cabin.
    joints = CAST_JOINTS["sachin"]
    targets = {}
    scale = .74
    offset = Vector((0, .305, .145))
    for s, side in [(-1, "l"), (1, "r")]:
        targets["arm_" + side] = ((s * .238, 1.256, .14), (s * .285, 1.13, .318))
        targets["arm_" + side + "_lower"] = ((s * .285, 1.13, .318), (s * .31, 1.198, .463))
        targets["leg_" + side] = ((s * .118, .912, .145), (s * .17, .748, .371))
        targets["leg_" + side + "_lower"] = ((s * .17, .748, .371), (s * .17, .526, .452))
    group_names = {g.index: g.name for g in seated.vertex_groups}
    hidden = []
    for v in seated.data.vertices:
        p = game(v.co)
        names = [group_names[g.group] for g in v.groups if g.weight > .5]
        if "hidden_when_seated" in names:
            hidden.append(v.index)
        joint = next((name for name in names if name in joints), "body")
        if joint in targets:
            old_a, old_b, _ = joints[joint]
            new_a, new_b = [Vector(t) for t in targets[joint]]
            old_delta = Vector(old_b) - Vector(old_a)
            new_delta = new_b - new_a
            u = old_delta.normalized()
            rel = p - Vector(old_a)
            length = rel.dot(u)
            perpendicular = rel - u * length
            rotation = u.rotation_difference(new_delta.normalized())
            p = new_a + rotation @ perpendicular * scale + new_delta * (length / old_delta.length)
        else:
            p = p * scale + offset
        v.co = point(p)
    if hidden:
        bm = bmesh.new()
        bm.from_mesh(seated.data)
        bm.verts.ensure_lookup_table()
        bmesh.ops.delete(bm, geom=[bm.verts[i] for i in hidden], context="VERTS")
        bmesh.ops.recalc_face_normals(bm, faces=list(bm.faces))
        bm.to_mesh(seated.data)
        bm.free()
    seated.vertex_groups.clear()
    CURRENT = "sachin"
    for s, side in [(-1, "left"), (1, "right")]:
        PARTS = []
        x = s * .28
        box("first person khaki cuff", (x, -.36, -.39), (.162, .165, .30), "khaki", bevel=.042)
        oval("first person forearm", (x, -.357, -.547), (.068, .072, .098), color=CAST[0]["skin"], segments=16, rings=10)
        box("first person palm", (x, -.352, -.636), (.143, .13, .155), color=CAST[0]["skin"], bevel=.038)
        oval("first person thumb", (x - s * .062, -.323, -.67), (.045, .037, .062), color=CAST[0]["skin"], segments=12, rings=8)
        for i in range(3):
            tube("first person finger crease", [(x - .043 + i * .043, -.329, -.708), (x - .043 + i * .043, -.371, -.706)], .0028, color="915833", sides=5)
        obj = join_parts("sachin_hand_" + side)
        obj["player_part"] = "hand_" + side
        obj["lod"] = "player"
        obj.vertex_groups.clear()
    PARTS = []
    ring("intro key ring", (.28, -.295, -.731), .032, .005, "silver", segments=16)
    oval("intro key fob", (.28, -.345, -.736), (.025, .032, .009), "black", segments=12, rings=8)
    box("intro key blade", (.28, -.394, -.736), (.016, .059, .006), "silver", bevel=.002)
    for i in range(3):
        box("intro key tooth", (.29, -.378 - i * .014, -.736), (.011, .006, .006), "silver", bevel=.002)
    obj = join_parts("sachin_keys")
    obj["player_part"] = "keys"
    obj["lod"] = "player"
    obj.vertex_groups.clear()


def export(stats):
    # Blender 3.5 exports selected objects from other scenes too. Deselect those
    # explicitly so the factory Cube (or an open vehicle scene) cannot leak in.
    for other in bpy.data.scenes:
        bpy.context.window.scene = other
        bpy.ops.object.select_all(action="DESELECT")
    bpy.context.window.scene = scene
    for obj in asset.objects:
        obj.select_set(True)
    bpy.ops.export_scene.gltf(filepath=str(RUNTIME / "mumbai-characters.glb"), export_format="GLB", use_selection=True, export_apply=False, export_yup=True, export_extras=True, export_colors=True, export_animations=False, export_cameras=False, export_lights=False, export_skins=True, export_def_bones=True)
    scene["source_reference"] = "docs/mumbai-characters/images"
    sys.path.insert(0, str(Path(__file__).resolve().parent))
    from stage_mumbai_characters import stage
    stage(scene)
    bpy.ops.wm.save_as_mainfile(filepath=str(OUT / "mumbai-characters.blend"), compress=True)
    manifest = {"generator": "Blender " + bpy.app.version_string, "script": "scripts/characters/build_mumbai_characters.py", "runtime": "/models/mumbai-characters.glb", "bytes": (RUNTIME / "mumbai-characters.glb").stat().st_size, "atlas_size": [2048, 2048], "characters": stats}
    (OUT / "manifest.json").write_text(json.dumps(manifest, indent=2) + "\n")
    print("CAST_EXPORT", json.dumps({"characters": len(stats), "bytes": manifest["bytes"]}), flush=True)


if __name__ == "__main__":
    stats = build_cast()
    player_assets()
    export(stats)
