"""Vehicle shapes based on the user's Thar, Fortuner, Duke and Dio photographs.

The meshes are original. Reference photos are not copied into the shipped assets.
"""
import bpy
import math
from mathutils import Vector
from vehicle_primitives import VehicleKit, point

BLACK='20242a'; GLASS='222d38'; METAL='a6adb1'; ORANGE='ed681b'; WHITE='e5e7e4'; TEAL='08b8c7'; LAMP='e7ece2'


def window(k,name,corners,color=GLASS,finish='glass',radius=.14):
    """Rounded planar quadrilateral, bilinearly mapped onto a sloping body face."""
    a,b,c,d=[Vector(p) for p in corners]
    verts=[]
    for u,v,start in [(1-radius,1-radius,0),(radius,1-radius,90),(radius,radius,180),(1-radius,radius,270)]:
        for i in range(5):
            angle=math.radians(start+i*22.5)
            x=u+radius*math.cos(angle); y=v+radius*math.sin(angle)
            verts.append(tuple(a*(1-x)*(1-y)+b*x*(1-y)+c*x*y+d*(1-x)*y))
    return k.mesh(name,verts,[tuple(range(len(verts)))],color,finish)


def hull(k,name,sections,color):
    """Rounded body cross sections, with genuine wheel openings cut below."""
    verts=[]
    for z,w,bottom,top in sections:
        for x,y in [(-w*.85,bottom),(-w,bottom+.09),(-w,top-.09),(-w*.92,top),(-w*.65,top+.025),(0,top+.043),(w*.65,top+.025),(w*.92,top),(w,top-.09),(w,bottom+.09),(w*.85,bottom)]:
            verts.append((x,y,z))
    n=11; faces=[tuple(range(n-1,-1,-1))]
    for j in range(len(sections)-1):
        for i in range(n):
            a=j*n+i; b=j*n+(i+1)%n; faces.append((a,b,b+n,a+n))
    faces.append(tuple(range((len(sections)-1)*n,len(sections)*n)))
    return k.mesh(name,verts,faces,color,smooth=True,bevel=.024)


def wheel_cuts(k,body,axles,r):
    for z in axles:
        bpy.ops.mesh.primitive_cylinder_add(vertices=40,radius=r,depth=3.5,location=point((0,r-.045,z)))
        cut=bpy.context.object; cut.rotation_euler.y=math.pi/2
        mod=body.modifiers.new('Open wheel housing','BOOLEAN'); mod.operation='DIFFERENCE'; mod.object=cut
        bpy.context.view_layer.objects.active=body
        bpy.ops.object.modifier_apply(modifier=mod.name)
        bpy.data.objects.remove(cut,do_unlink=True)


def cabin_cut(k,body,front,rear,width,floor):
    """Remove the body deck inside the passenger cell, leaving a real open tub."""
    bpy.ops.mesh.primitive_cube_add(size=1,location=point((0,floor+1.5,(front+rear)/2)))
    cut=bpy.context.object; cut.scale=(width,front-rear,3)
    bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    mod=body.modifiers.new('Hollow passenger compartment','BOOLEAN'); mod.operation='DIFFERENCE'; mod.object=cut
    bpy.context.view_layer.objects.active=body
    bpy.ops.object.modifier_apply(modifier=mod.name)
    bpy.data.objects.remove(cut,do_unlink=True)


def car_interior(k, front, rear, width=1.55, seat_y=.75, third_row=False, driver_only=False):
    """A hollow, usable cabin with independent controls for later player binding."""
    k.section = 'interior'
    k.box('Cabin carpet',(0,seat_y-.20,(front+rear)/2),(width,.055,front-rear),'333638',.015,'seat')
    rows=[front-.62,rear+.72]
    if third_row: rows=[front-.58,front-1.28,rear+.66]
    if driver_only: rows=[front-.62]
    for row,z in enumerate(rows):
        for s in ([1] if driver_only else [-1,1]):
            x=s*width*.25
            k.box('Contoured seat cushion',(x,seat_y,z),(.48,.16,.48),'41484b',.075,'seat')
            back=k.box('Seat backrest',(x,seat_y+.34,z-.24),(.47,.59,.145),'363d40',.070,'seat')
            back.rotation_euler.x=-.10
            k.box('Seat headrest',(x,seat_y+.69,z-.25),(.25,.18,.13),'303639',.044,'seat')
            k.tube('Seat centre stitch',[(x,seat_y+.08,z+.19),(x,seat_y+.08,z-.18)],.003,'777976','seat')
    k.box('Moulded dashboard',(0,seat_y+.33,front),(width,.22,.34),'353c40',.05,'seat')
    k.box('Central screen',(0,seat_y+.42,front-.18),(.22,.13,.022),'7f989b',.015,'glass')
    for x in [-width*.38,width*.38]:
        k.box('Dashboard air vent',(x,seat_y+.35,front-.18),(.18,.057,.019),'161e23',.008,'rubber')
    k.box('Centre console',(0,seat_y-.01,front-.64),(.22,.19,.46),'32383b',.035,'seat')
    k.tube('Gear stick',[(0,seat_y+.07,front-.52),(0,seat_y+.26,front-.55)],.014,METAL)
    k.sphere('Gear knob',(0,seat_y+.275,front-.55),(.034,.035,.032),BLACK,'rubber')
    k.section = 'controls'
    # Indian right-hand drive. The ring is tilted toward the seated driver.
    c=(width*.25,seat_y+.40,front-.29)
    k.tube('Steering column',[(c[0],c[1]-.10,front+.04),c],.030,BLACK)
    rim=[(c[0]+.177*math.cos(a),c[1]+.143*math.sin(a),c[2]-.096*math.sin(a)) for a in [i*math.tau/40 for i in range(41)]]
    k.tube('Steering wheel rim',rim,.016,BLACK,'rubber')
    for a in [0,math.pi,math.pi*1.5]:
        k.tube('Steering spoke',[c,(c[0]+.16*math.cos(a),c[1]+.129*math.sin(a),c[2]-.086*math.sin(a))],.016,'555f61')
    k.box('Steering centre',c,(.13,.065,.068),BLACK,.021)
    k.section = 'body'


def cabin_frame(k, front_bottom, front_top, rear_bottom, rear_top, sill, roof, width, roof_width, paint, pillars):
    """Roof and narrow pillars, leaving real window apertures and an empty cabin."""
    for s in [-1,1]:
        for j,(z0,z1) in enumerate([(front_bottom,front_top),(rear_bottom,rear_top)]+[(z,z) for z in pillars]):
            # Pressed, rectangular A/B/C/D pillars, not cylindrical cage bars.
            reach=.068 if j==1 else .044
            verts=[(s*x,y,z+dz) for x,y,z in [(width/2-.024,sill,z0),(width/2+.015,sill,z0),(roof_width/2+.015,roof,z1),(roof_width/2-.024,roof,z1)] for dz in [-reach,reach]]
            k.mesh('Pressed cabin pillar',verts,[(0,1,3,2),(2,3,5,4),(4,5,7,6),(6,7,1,0),(0,2,4,6),(1,7,5,3)],paint,bevel=.008)
        k.box('Roof rain channel',(s*roof_width/2,roof,(front_top+rear_top)/2),(.041,.033,front_top-rear_top+.08),paint,.009)
        k.box('Window sill',(s*width/2,sill,(front_bottom+rear_bottom)/2),(.041,.032,front_bottom-rear_bottom+.04),paint,.008)
    k.box('Interior roof lining',(0,roof-.045,(front_top+rear_top)/2),(roof_width,.035,front_top-rear_top),'54595b',.015,'seat')


def suv(scene,name,kind,white=False):
    k=VehicleKit(scene,name,kind); paint=WHITE if white else ORANGE
    front=2.35 if white else 1.96; rear=-2.35 if white else -1.93
    axles=[-1.42,1.42] if white else [-1.24,1.24]
    body=hull(k,'Sculpted SUV body',[(rear,.83,.56,1.28),(rear+.14,.95,.48,1.34),(-1.2,.975,.48,1.34),(-.3,.97,.48,1.34),(.7,.95,.50,1.39),(front-.30,.94,.58,1.38),(front,.84,.67,1.28)],paint)
    wheel_cuts(k,body,axles,.525 if white else .54)
    cabin_cut(k,body,(1.01 if white else .69)-.12,rear+.18,1.58,.67)
    # The bonnet has a real crown and its leading edge rolls down into the fascia.
    hoodback=1.01 if white else .69
    hull(k,'Crowned bonnet',[(hoodback,.80,1.31,1.41),(hoodback+.15,.86,1.33,1.43),(front-.18,.80,1.26,1.36),(front-.035,.76,1.25,1.315)],paint)
    roof=1.92 if white else 1.98
    windtop=.50 if white else .43
    backtop=rear+.37 if white else rear+.10
    cabin_frame(k,hoodback,windtop,rear+.04,backtop,1.34,roof-.025,1.81,1.62,paint if white else BLACK,[-.35,-1.31] if white else [-.36])
    car_interior(k,hoodback-.15,rear+.15,1.51,.87,white)
    # Separate window apertures leave painted A/B/C pillars and a deep roof edge.
    corners=[(-.806,1.393,hoodback+.012),(.806,1.393,hoodback+.012),(.725,roof-.084,windtop+.029),(-.725,roof-.084,windtop+.029)]
    window(k,'Windscreen rubber seal',corners,BLACK,'rubber',.16)
    centre=sum((Vector(p) for p in corners),Vector())/4
    window(k,'Large sloping windshield',[tuple(centre+(Vector(p)-centre)*.946+Vector((0,0,.007))) for p in corners],radius=.16)
    for side in [-1,1]:
        # Side glass follows the cabin taper (X grows toward the sill).
        def sideglass(label,z0,z1,top0,top1,backrise=0):
            corners=[(side*.909,1.372,z0),(side*.909,1.372+backrise,z1),(side*.801,roof-.105,top1),(side*.785,roof-.105,top0)]
            window(k,label+' rubber',corners,BLACK,'rubber',.12)
            cc=sum((Vector(p) for p in corners),Vector())/4
            window(k,label,[tuple(cc+(Vector(p)-cc)*.89+Vector((side*.005,0,0))) for p in corners],radius=.12)
        sideglass('Front side window',hoodback-.065,-.30,windtop-.055,-.32)
        if white:
            sideglass('Rear door window',-.37,-1.25,-.39,-1.32,.018)
            sideglass('Swept rear quarter glass',-1.33,rear+.12,-1.40,backtop+.04,.15)
        else:
            sideglass('Rear hardtop window',-.40,rear+.08,-.43,backtop+.045,.008)
        for z in ([-.34,-1.29] if white else [-.34]):
            k.tube('Door shut line',[(side*.972,.61,z),(side*.977,1.28,z),(side*.918,1.35,z)],.0055,BLACK,'rubber')
            k.box('Door handle',(side*.984,1.232,z+.16),(.032,.042,.155),METAL if white else BLACK,.019,'metal' if white else 'rubber')
        k.tube('Window lower chrome edge' if white else 'Door beltline',[(side*.925,1.354,hoodback-.10),(side*.925,1.354,rear+.17)],.010,METAL if white else paint)
        k.tube('Door pressed crease',[(side*.981,.77,axles[0]+.52),(side*.981,.81,axles[1]-.51)],.005,paint,'paint')
        k.box('Running board',(side*.985,.468,-.02),(.19,.075,axles[1]-axles[0]-.45),BLACK,.025,'rubber')
        k.tube('Running board bright edge',[(side*1.069,.484,axles[0]+.26),(side*1.069,.484,axles[1]-.28)],.011,METAL)
        k.tube('Mirror stalk',[(side*.884,1.45,hoodback-.16),(side*1.028,1.46,hoodback-.17)],.025,BLACK)
        k.box('Shaped mirror housing',(side*1.087,1.48,hoodback-.16),(.207,.135,.185),paint if white else BLACK,.061)
        k.box('Mirror reflective face',(side*1.087,1.48,hoodback-.259),(.167,.097,.007),'8c9fa8',.034,'glass')
        if white:
            k.box('Mirror indicator',(side*1.108,1.46,hoodback-.064),(.143,.018,.010),'d9e2db',.006,'lamp')
        if white:
            k.tube('Roof rail',[(side*.67,roof+.023,backtop+.15),(side*.67,roof+.088,backtop+.26),(side*.67,roof+.088,windtop-.23),(side*.67,roof+.023,windtop-.13)],.019,'555a5c','metal')
            window(k,'Swept rear combination lamp',[(side*.47,1.36,rear-.018),(side*.89,1.40,rear+.003),(side*.89,1.21,rear-.036),(side*.63,1.235,rear-.043)],'ad2028','lamp',.07)
            k.tube('Tail light clear blade',[(side*.51,1.335,rear-.037),(side*.86,1.35,rear-.031)],.013,'d3dad4','lamp')
        else:
            k.box('Rectangular tail lamp',(side*.78,1.215,rear-.022),(.19,.20,.045),'ad2028',.035,'lamp')
            k.box('Tail white strip',(side*.78,1.25,rear-.048),(.16,.025,.006),'dccdcc',.006,'lamp')
        # Thar's thick black flares; Fortuner's modest dark wheel surround.
        for z in axles:
            k.arch('Wheel arch cladding',side*.970,z,.45 if white else .46,.550 if white else .575,.225,BLACK,start=-.30,end=math.pi+.30)
            if not white:
                k.box('Fender shoulder',(side*.958,1.025,z),(.26,.135,.63),BLACK,.06,'rubber')
    k.box('Rounded hardtop',(0,roof+.01,(backtop+windtop)/2),(1.70,.12,windtop-backtop+.15),paint if white else BLACK,.07)
    window(k,'Rear windshield',[(-.735,1.40,rear+.01),(.735,1.40,rear+.01),(.727,roof-.10,backtop-.014),(-.727,roof-.10,backtop-.014)])
    k.tube('Rear window wiper',[(.15,1.41,rear-.01),(-.36,1.46,rear+.016)],.009,BLACK,'rubber')
    k.box('High brake lamp',(0,roof-.09,backtop-.021),(.30,.033,.018),'bd2b27',.008,'lamp')
    k.box('Tailgate',(0,1.083,rear-.019),(1.23,.40,.018),paint,.035)
    k.box('Tailgate release',(0,1.319,rear-.036),(.20,.029,.020),METAL if white else BLACK,.010)
    for side in [-1,1]:
        k.box('Rear bumper reflector',(side*.76,.684,rear-.090),(.13,.038,.016),'b92025',.010,'lamp')
        k.box('Rear mudflap',(side*.93,.334,axles[0]-.41),(.25,.27,.034),BLACK,.01,'rubber')
    # Front bumper reaches the fenders; no floating grille/bumper gap.
    k.box('Full front bumper',(0,.742,front+.022),(1.91,.28,.23),paint if white else BLACK,.075)
    k.box('Rear bumper',(0,.645,rear-.004),(1.90,.20,.16),BLACK,.055)
    if white:
        k.box('Continuous upper bumper fascia',(0,.973,front+.014),(1.90,.235,.12),paint,.046)
        grille=[(-.60,1.327,front+.048),(.60,1.327,front+.048),(.43,.972,front+.109),(-.43,.972,front+.109)]
        window(k,'Fortuner chrome grille frame',grille,METAL,'metal',.08)
        cc=sum((Vector(p) for p in grille),Vector())/4
        window(k,'Deep trapezoid grille',[tuple(cc+(Vector(p)-cc)*.89+Vector((0,0,.009))) for p in grille],BLACK,'rubber',.08)
        for y,w in [(1.05,.86),(1.14,.95),(1.23,1.04)]:
            k.box('Grille horizontal chrome blade',(0,y,front+.102),(w,.018,.026),'697477',.006,'metal')
            for x in [-.33,-.16,0,.16,.33]: k.box('Grille mesh upright',(x,y+.033,front+.093),(.023,.060,.025),BLACK,.003,'rubber')
        k.cylinder('Round grille emblem',(0,1.219,front+.136),.061,.012,METAL,(0,0,1),segments=24)
        for s in [-1,1]:
            lamp=[(s*.56,1.302,front+.055),(s*.886,1.342,front-.105),(s*.854,1.257,front-.060),(s*.568,1.254,front+.08)]
            window(k,'Swept dark headlamp housing',lamp,BLACK,'rubber',.08)
            cc=sum((Vector(p) for p in lamp),Vector())/4
            window(k,'Swept silver LED lamp',[tuple(cc+(Vector(p)-cc)*.74+Vector((0,0,.008))) for p in lamp],LAMP,'lamp',.09)
            k.tube('Headlight upper LED blade',[(s*.59,1.298,front+.066),(s*.77,1.318,front-.025),(s*.863,1.326,front-.090)],.010,LAMP,'lamp')
            window(k,'Black bumper intake',[(s*.64,1.017,front+.108),(s*.94,1.062,front+.05),(s*.914,.80,front+.144),(s*.742,.811,front+.153)],BLACK,'rubber')
            k.cylinder('Recessed fog projector',(s*.818,.884,front+.159),.044,.013,'b3b9ac',(0,0,1),'lamp')
            k.tube('Sculpted bumper chrome',[(s*.94,.785,front+.14),(s*.73,.758,front+.162),(s*.47,.947,front+.149)],.026,METAL)
        k.box('Wide lower radiator intake',(0,.832,front+.149),(1.03,.105,.014),BLACK,.018,'rubber')
        k.box('Silver lower skid plate',(0,.59,front+.10),(1.24,.17,.13),'777e7e',.04,'metal')
    else:
        k.box('Orange nose surround',(0,1.207,front-.003),(1.70,.39,.18),paint,.085)
        k.box('Recessed vertical grille',(0,1.20,front+.096),(.89,.345,.024),BLACK,.035,'rubber')
        for x in [-.33,-.22,-.11,0,.11,.22,.33]:
            k.box('Seven grille slots',(x,1.20,front+.115),(.055,.279,.015),'101417',.019,'rubber')
            k.box('Slot edge',(x+.035,1.20,front+.117),(.012,.281,.010),'555c5d',.004,'metal')
        for s in [-1,1]:
            k.cylinder('Headlamp rubber socket',(s*.661,1.234,front+.098),.159,.036,BLACK,(0,0,1),'rubber',32)
            k.cylinder('Chrome round headlamp',(s*.661,1.234,front+.122),.139,.024,METAL,(0,0,1),'metal',32)
            k.cylinder('Headlamp reflector',(s*.661,1.234,front+.138),.118,.012,'bdc5bc',(0,0,1),'metal',32)
            k.cylinder('Headlamp centre',(s*.661,1.234,front+.148),.067,.010,LAMP,(0,0,1),'lamp',24)
            k.box('Fender side indicator',(s*.954,1.032,front-.375),(.055,.045,.155),'e5a244',.014,'lamp')
            k.cylinder('Bumper fog light socket',(s*.744,.778,front+.145),.072,.015,'11151a',(0,0,1),'rubber')
            k.cylinder('Bumper fog lamp',(s*.744,.778,front+.157),.050,.015,LAMP,(0,0,1),'lamp')
            for z in [-.37,.45]: k.box('External door hinge',(s*.981,1.08,z),(.030,.078,.059),paint,.007)
            k.box('Bonnet latch',(s*.889,1.328,front-.45),(.043,.08,.065),BLACK,.006)
        k.box('Grey bumper centre',(0,.727,front+.154),(1.13,.153,.10),'687077',.035,'metal')
        k.cylinder('Rear spare tyre',(0,1.151,rear-.15),.395,.24,'24272b',(0,0,1),'rubber',32)
        k.cylinder('Rear spare alloy',(0,1.151,rear-.278),.255,.019,METAL,(0,0,1))
        k.cylinder('Rear spare hub',(0,1.151,rear-.291),.155,.024,BLACK,(0,0,1))
    for s in [-1,1]:
        k.tube('Parked windscreen wiper',[(s*.58,1.411,hoodback+.01),(s*.17,1.451,hoodback-.029)],.009,BLACK,'rubber')
    k.box('Registration plate',(0,.721,front+.216),(.32,.075,.01),'2d3237',.006)
    k.text('Front plate lettering','MH 02 BK 2026',(0,.721,front+.223),.034,'dfded2')
    k.text('Tailgate name','FORTUNER' if white else 'THAR',(0,1.295,rear-.047),.043,METAL,'rear')
    k.tube('Exhaust outlet',[(.57,.40,rear+.21),(.57,.40,rear-.03)],.037,'545e60')
    for z in axles:
        for side in [-1,1]: k.wheel(side*.951,z,.43 if white else .455,.30 if white else .34,offroad=not white,spokes=10)
        k.cylinder('Axle',(0,.43 if white else .455,z),.037,1.9,BLACK)
        k.sphere('Differential',(0,.43 if white else .455,z),(.13,.10,.13),BLACK,'metal')
    k.finish(); return k


def duke(scene,rider):
    k=VehicleKit(scene,'traffic_ktm',6)
    for z in [-.70,.70]: k.wheel(0,z,.325,.235,sport=True,rim='ef6418',spokes=6)
    # Compact exposed engine, crankcases, exhaust header and orange trellis frame.
    k.box('Engine block',(0,.58,-.03),(.37,.38,.40),'373d42',.045,'metal')
    for side in [-1,1]:
        k.cylinder('Crankcase cover',(side*.213,.50,-.055),.147,.045,'4f565b')
        k.cylinder('Crankcase inset',(side*.24,.50,-.055),.089,.012,'363c40')
        for y in [.65,.685,.72,.755]: k.box('Cylinder cooling rib',(side*.184,y,.10),(.036,.014,.24),'777e7d',.003,'metal')
        k.tube('Orange upper frame',[(side*.17,.72,-.37),(side*.22,.94,-.27),(side*.20,.945,.30),(side*.12,1.01,.46)],.027,ORANGE,'paint')
        k.tube('Orange lower frame',[(side*.17,.72,-.37),(side*.225,.74,.20),(side*.12,1.01,.46)],.025,ORANGE,'paint')
        k.tube('Orange diagonal frame',[(side*.22,.94,-.27),(side*.225,.74,.20),(side*.20,.945,.30)],.023,ORANGE,'paint')
        k.tube('Black rear swingarm',[(side*.14,.50,-.12),(side*.17,.325,-.70)],.045,BLACK)
        k.tube('White tail subframe',[(side*.16,.72,-.34),(side*.145,.99,-.89),(side*.16,1.01,-.48)],.022,WHITE,'paint')
        k.box('Rider footpeg',(side*.23,.47,-.22),(.16,.04,.065),METAL,.008,'metal')
        k.tube('Silver front fork',[(side*.138,.325,.70),(side*.138,1.13,.49)],.024,METAL)
        k.tube('Black lower fork',[(side*.138,.34,.70),(side*.138,.63,.62)],.038,BLACK)
    k.tube('Fork crown',[(-.14,1.03,.52),(.14,1.03,.52)],.039,BLACK)
    k.tube('Exhaust header',[(0,.60,.20),(0,.35,.32),(-.10,.30,.10),(-.17,.31,-.24)],.030,'9b8d78')
    k.profile('Under engine silencer',[(.29,-.36,.28),(.31,.13,.27),(.45,.05,.30),(.44,-.31,.28)],.28,'555c5b',.02,'metal')
    k.profile('Black fuel tank',[(.88,-.34,.38),(1.095,-.17,.45),(1.12,.03,.47),(1.02,.29,.39),(.84,.20,.31)],.4,BLACK,.045)
    for s in [-1,1]:
        panel=[(s*.22,1.095,-.20),(s*.266,1.064,.04),(s*.255,.98,.31),(s*.21,.835,.18),(s*.216,.91,-.25)]
        shroud=k.mesh('White angular tank shroud',panel,[tuple(range(5))],WHITE,bevel=.008)
        mod=shroud.modifiers.new('Moulded shroud thickness','SOLIDIFY'); mod.thickness=.012
        bpy.context.view_layer.objects.active=shroud; bpy.ops.object.modifier_apply(modifier=mod.name)
        k.tube('Orange shroud slash',[(s*.269,1.042,-.15),(s*.272,1.00,.06),(s*.256,.94,.18)],.012,ORANGE,'paint')
        k.mesh('Black knee recess',[(s*.224,.98,-.27),(s*.222,.90,-.25),(s*.19,.89,-.03)],[(0,1,2)],BLACK)
    k.cylinder('Fuel filler',(0,1.127,-.04),.064,.009,METAL,(0,1,0))
    k.profile('Long rider saddle',[(.842,-.63,.31),(.915,-.58,.32),(.933,-.26,.33),(.876,-.12,.31)],.32,BLACK,.03,'seat')
    k.profile('White raised tail',[(.88,-.55,.31),(1.024,-.95,.27),(1.078,-.84,.26),(1.018,-.56,.30)],.28,WHITE,.018)
    k.box('Pillion saddle',(0,1.068,-.76),(.30,.083,.35),BLACK,.04,'seat')
    k.box('Tail light',(0,1.006,-.951),(.19,.043,.02),'b62a28',.009,'lamp')
    k.tube('Rear number bracket',[(0,.98,-.93),(0,.74,-1.07)],.024,BLACK)
    k.box('Rear number plate',(0,.747,-1.086),(.23,.09,.017),WHITE,.006)
    # Upright naked-bike headlight, no fairing and no tall sport windscreen.
    face=[(-.115,1.205,.661),(.115,1.205,.661),(.14,1.09,.748),(0,.943,.807),(-.14,1.09,.748)]
    k.mesh('Duke headlight shell',face+[(x*.9,y,z-.10) for x,y,z in face],[tuple(range(5)),tuple(range(9,4,-1))]+[(i,(i+1)%5,(i+1)%5+5,i+5) for i in range(5)],BLACK,bevel=.012)
    cc=sum((Vector(p) for p in face),Vector())/5
    k.mesh('Pentagonal headlight',[tuple(cc+(Vector(p)-cc)*.76+Vector((0,0,.008))) for p in face],[tuple(range(5))],LAMP,'lamp')
    k.box('Small instrument display',(0,1.214,.496),(.19,.053,.12),BLACK,.022)
    k.box('Instrument screen',(0,1.243,.485),(.145,.008,.079),'58757f',.008,'glass')
    k.tube('Headlight mounting bracket',[(0,1.09,.505),(0,1.10,.654)],.032,BLACK)
    k.box('Radiator',(0,.723,.307),(.305,.215,.072),'293337',.022,'metal')
    for i in range(5): k.box('Radiator fin',(0,.65+i*.035,.348),(.279,.010,.012),'737c7b',.003,'metal')
    for s in [-1,1]:
        k.tube('Upright handlebar',[(0,1.145,.46),(s*.14,1.19,.46),(s*.29,1.205,.43)],.018,METAL)
        k.tube('Rubber grip',[(s*.23,1.205,.43),(s*.37,1.205,.43)],.022,BLACK,'rubber')
        k.tube('Brake clutch lever',[(s*.24,1.19,.45),(s*.365,1.185,.491)],.007,METAL)
        k.tube('Tall mirror stalk',[(s*.25,1.215,.45),(s*.29,1.43,.40)],.010,BLACK)
        k.box('Duke mirror',(s*.30,1.449,.40),(.13,.15,.06),BLACK,.045)
        k.box('Duke mirror glass',(s*.30,1.449,.367),(.102,.121,.006),'789199',.021,'glass')
        for z,y in [(.52,1.09),(-.97,.94)]:
            k.tube('Indicator rubber stalk',[(s*.12,y,z),(s*.23,y,z)],.010,BLACK,'rubber')
            k.box('Amber turn signal',(s*.24,y,z),(.049,.033,.065),'e79131',.010,'lamp')
        k.text('Tank shroud lettering','DUKE',(s*.278,1.008,-.035),.068,'b55822','right' if s>0 else 'left')
    k.arch('White front fender',0,.70,.325,.383,.29,WHITE,start=.54,end=2.6)
    k.cylinder('Chain sprocket',(-.156,.325,-.70),.159,.018,'8e9494')
    k.tube('Drive chain',[(-.17,.48,-.70),(-.17,.59,-.11),(-.17,.43,-.11),(-.17,.17,-.70),(-.17,.48,-.70)],.013,'757d7d')
    coil=[]
    for i in range(80):
        t=i/79; a=t*math.pi*16
        coil.append((.062*math.cos(a),.66+t*.25+.020*math.sin(a),-.48+t*.12+.055*math.sin(a)))
    k.tube('White rear suspension spring',coil,.009,WHITE,'paint')
    rider(k,True); k.finish(); return k


def dio(scene,rider):
    k=VehicleKit(scene,'traffic_scooty',5)
    for z in [-.63,.63]: k.wheel(0,z,.274,.18,rim='8c8c83',spokes=5)
    k.box('Step through floor',(0,.34,.06),(.48,.105,1.16),BLACK,.045,'rubber')
    k.box('Textured footwell',(0,.404,.13),(.41,.031,.58),'34393d',.016,'rubber')
    # Tapered rear panels replace the old rounded Vespa-style engine pod.
    k.profile('Sport scooter rear cowling',[(.36,-.51,.30),(.49,-.88,.45),(.76,-.82,.55),(.84,-.46,.55),(.77,-.15,.46),(.49,-.04,.34)],.48,TEAL,.052)
    k.profile('Long stepped black saddle',[(.77,-.84,.48),(.88,-.79,.47),(.91,-.56,.50),(.854,-.20,.46),(.78,-.10,.36)],.47,BLACK,.055,'seat')
    # Swept forward apron, with black central insert and lamps beneath the bars.
    k.profile('Turquoise sculpted front apron',[(.37,.40,.39),(.48,.69,.53),(.75,.66,.56),(1.025,.49,.48),(1.08,.40,.38),(.89,.33,.36),(.48,.35,.36)],.46,TEAL,.038)
    k.mesh('Black centre apron',[(0,1.055,.465),(-.195,.97,.538),(-.14,.79,.64),(0,.71,.69),(.14,.79,.64),(.195,.97,.538)],[tuple(range(6))],BLACK,bevel=.008)
    for s in [-1,1]:
        lamp=[(s*.028,.775,.679),(s*.20,.951,.568),(s*.235,.856,.618),(s*.122,.735,.692)]
        window(k,'Swept scooter headlamp',lamp,'c8d3d3','lamp',.08)
        k.tube('Headlamp LED edge',[(s*.056,.785,.686),(s*.195,.925,.592)],.009,LAMP,'lamp')
        k.tube('Rear grab rail',[(s*.21,.84,-.90),(s*.24,.94,-.87),(s*.23,.955,-.63)],.020,'676e72')
        k.mesh('Black rear side insert',[(s*.282,.68,-.71),(s*.268,.61,-.39),(s*.207,.47,-.13),(s*.22,.60,-.22)],[(0,1,2,3)],BLACK)
        k.tube('Side sculpting line',[(s*.278,.725,-.72),(s*.284,.69,-.51),(s*.263,.625,-.27)],.006,TEAL,'paint')
        k.tube('Handlebar grip',[(s*.20,1.164,.391),(s*.345,1.164,.386)],.022,BLACK,'rubber')
        k.tube('Mirror stalk',[(s*.22,1.20,.41),(s*.29,1.36,.37)],.009,'606a6f')
        k.box('Scooter mirror',(s*.324,1.397,.357),(.17,.083,.07),BLACK,.038)
        k.tube('Brake lever',[(s*.20,1.145,.419),(s*.335,1.14,.439)],.007,METAL)
        k.tube('Front suspension',[(s*.095,.275,.63),(s*.095,.72,.52)],.020,METAL)
        k.box('Front fork reflector',(s*.122,.55,.67),(.023,.086,.022),'dd872a',.006,'lamp')
    k.profile('Turquoise handlebar nacelle',[(1.08,.36,.40),(1.15,.48,.50),(1.25,.42,.33),(1.28,.32,.23),(1.14,.29,.36)],.41,TEAL,.035)
    k.profile('Connected steering neck cover',[(.96,.34,.25),(1.18,.29,.22),(1.20,.43,.26),(1.035,.49,.29)],.25,BLACK,.024,'rubber')
    k.profile('Black top instrument cowl',[(1.20,.30,.37),(1.31,.29,.19),(1.305,.43,.20),(1.23,.50,.32)],.3,BLACK,.02)
    k.box('Scooter instrument glass',(0,1.266,.29),(.17,.014,.12),'4c636b',.017,'glass')
    k.arch('Turquoise front mudguard',0,.63,.274,.347,.29,TEAL,start=.34,end=2.72)
    k.box('Red tail lamp',(0,.715,-.881),(.25,.08,.038),'c52a2c',.019,'lamp')
    k.box('Rear mudflap',(0,.38,-.878),(.20,.27,.025),BLACK,.009,'rubber')
    k.tube('Black exhaust',[(.23,.31,-.24),(.26,.40,-.78)],.061,BLACK)
    k.tube('Silver heat shield',[(.282,.345,-.36),(.29,.407,-.75)],.050,METAL)
    for z in [-.43,-.52,-.61]: k.box('Heat shield slot',(.337,.381,z),(.008,.015,.053),BLACK,.003)
    k.box('CVT transmission',(-.22,.327,-.43),(.15,.18,.59),'41484a',.065,'metal')
    for s in [-1,1]:
        k.text('Sport scooter side graphic','DIO',(s*.28,.707,-.53),.071,'d5e1dd','right' if s>0 else 'left')
        k.box('Mirror reflective face',(s*.324,1.397,.316),(.13,.058,.007),'839b9d',.016,'glass')
    spring=[]
    for i in range(55):
        t=i/54; a=t*math.pi*12
        spring.append((-.218+.03*math.cos(a),.37+t*.30,-.65+t*.10+.03*math.sin(a)))
    k.tube('Rear coil spring',spring,.006,'8c9698')
    rider(k); k.finish(); return k


def sedan(scene,name,kind,taxi=False):
    k=VehicleKit(scene,name,kind); paint='262a30' if taxi else '4b8394'
    body=hull(k,'Rounded sedan body',[(-2.07,.71,.41,.91),(-1.82,.86,.37,1.00),(-.8,.89,.38,1.02),(.9,.88,.40,1.01),(1.77,.83,.46,.97),(2.07,.72,.51,.86)],paint)
    wheel_cuts(k,body,[-1.27,1.27],.35)
    cabin_cut(k,body,1.01,-1.34,1.47,.44)
    hull(k,'Sedan crowned bonnet',[(1.07,.74,.97,1.032),(1.31,.81,.965,1.026),(1.95,.71,.85,.931)],paint)
    cabin_frame(k,1.09,.33,-1.40,-.83,1.01,1.50,1.60,1.40,paint,[-.16])
    car_interior(k,.82,-1.25,1.40,.64)
    window(k,'Sedan windshield',[(-.70,1.02,1.074),(.70,1.02,1.074),(.628,1.457,.397),(-.628,1.457,.397)])
    k.box('Sedan roof',(0,1.521,-.25),(1.40,.08,1.27),'e2ad27' if taxi else paint,.055)
    window(k,'Sedan rear window',[(-.69,1.038,-1.364),(.69,1.038,-1.364),(.623,1.462,-.846),(-.623,1.462,-.846)])
    for s in [-1,1]:
        for z0,z1,t0,t1 in [(1.0,-.12,.31,-.12),(-.20,-1.27,-.20,-.79)]:
            window(k,'Sedan side window',[(s*.807,1.027,z0),(s*.807,1.027,z1),(s*.713,1.462,t1),(s*.713,1.462,t0)])
        k.box('Mirror',(s*.94,1.115,.68),(.16,.105,.135),paint,.033)
        for z in [-.17,-1.17]:
            k.box('Door handle',(s*.89,.922,z+.13),(.025,.031,.16),METAL,.010,'metal')
            k.tube('Door seam',[(s*.895,.47,z),(s*.895,.92,z),(s*.81,1.02,z)],.0045,BLACK,'rubber')
        k.box('Front headlight',(s*.56,.869,2.04),(.31,.142,.06),LAMP,.035,'lamp')
        k.box('Tail light',(s*.58,.854,-2.059),(.30,.12,.04),'b52326',.025,'lamp')
        for z in [-1.27,1.27]: k.wheel(s*.81,z,.305,.22,spokes=7)
    k.box('Chrome grille',(0,.761,2.085),(.78,.17,.018),BLACK,.022)
    for y in [.72,.76,.80]: k.box('Grille blade',(0,y,2.099),(.70,.012,.012),METAL,.003,'metal')
    k.box('Front bumper',(0,.519,2.023),(1.56,.09,.09),METAL,.022,'metal')
    k.box('Rear bumper',(0,.497,-2.014),(1.56,.09,.10),METAL,.025,'metal')
    for z,facing in [(2.084,'front'),(-2.090,'rear')]:
        k.box('Registration',(0,.614,z),(.35,.095,.012),'e9ba36' if taxi else 'dedfdb',.007)
        k.text('Registration lettering','MH 01 BK 26',(0,.614,z+(.009 if z>0 else -.009)),.034,BLACK,facing)
    for s in [-1,1]: k.tube('Wiper',[(s*.57,1.034,1.058),(s*.16,1.066,1.01)],.006,BLACK,'rubber')
    k.box('High stop lamp',(0,1.461,-.867),(.28,.026,.014),'b52326',.005,'lamp')
    if taxi:
        k.box('Taxi roof sign',(0,1.635,-.16),(.42,.145,.17),'e2ad27',.023)
        k.text('Taxi sign','TAXI',(0,1.635,-.069),.070,BLACK)
        for s in [-1,1]: k.text('Taxi door identity','MUMBAI',(s*.899,.78,-.58),.065,'e2ad27','right' if s>0 else 'left')
    k.finish(); return k


def bus(scene):
    k=VehicleKit(scene,'traffic_best_bus',3); red='c83930'; cream='e2ded1'; yellow='e9ad26'
    k.root['reference_features']='MUTP BEST: rounded white roof, tall flat split windscreen, broad red louvred nose, low round lamps, red bumper'
    body=k.box('BEST lower body',(0,1.065,0),(2.30,1.09,9.15),red,.085)
    wheel_cuts(k,body,[-2.95,2.95],.585)
    cabin_cut(k,body,4.43,-4.43,2.10,.715)
    k.box('Rounded white roof',(0,2.974,0),(2.32,.25,9.16),cream,.12)
    k.box('Cream waist stripe',(0,1.67,0),(2.315,.15,9.16),cream,.018)
    for s in [-1,1]:
        k.box('Red window header',(s*1.121,2.80,0),(.08,.22,9.02),red,.025)
        for z in [-3.62,-2.55,-1.48,-.41,.66,1.73,2.80]:
            k.box('Window pillar',(s*1.127,2.24,z-.505),(.075,1.08,.091),red,.009)
            window(k,'Bus side glass',[(s*1.145,1.78,z-.43),(s*1.145,1.78,z+.43),(s*1.145,2.71,z+.43),(s*1.145,2.71,z-.43)],'48676c','glass',.09)
            k.tube('Window rubber gasket',[(s*1.158,1.79,z-.43),(s*1.158,2.67,z-.43),(s*1.158,2.70,z+.43),(s*1.158,1.79,z+.43),(s*1.158,1.79,z-.43)],.016,BLACK,'rubber')
            for y in [1.99,2.35]: k.tube('Sliding window safety rail',[(s*1.17,y,z-.43),(s*1.17,y,z+.43)],.012,METAL)
            k.box('Passenger window latch',(s*1.18,2.32,z),(.025,.044,.052),BLACK,.006)
        for z in [-2.95,2.95]:
            k.wheel(s*1.075,z,.50,.27,spokes=8,steel=True)
            k.arch('Bus wheel arch',s*1.105,z,.50,.595,.12,red)
            k.box('Bus mudflap',(s*1.06,.38,z-.55),(.30,.35,.032),BLACK,.005,'rubber')
        for z in [-4.22,4.22]: k.box('End window pillar',(s*1.104,2.22,z),(.10,1.08,.10),red,.021)
        window(k,'Front cab side window',[(s*1.15,1.78,3.34),(s*1.15,1.78,4.40),(s*1.15,2.70,4.39),(s*1.15,2.70,3.34)],'48676c','glass',.09)
        window(k,'Rear side quarter glass',[(s*1.15,1.79,-4.10),(s*1.15,1.79,-4.42),(s*1.15,2.68,-4.42),(s*1.15,2.68,-4.10)],'48676c','glass',.08)
        k.box('Side destination',(s*1.165,2.806,2.55),(.015,.155,1.70),'174534',.014)
        k.text('Side destination lettering','86  CHURCHGATE',(s*1.176,2.804,2.55),.10,cream,'right' if s>0 else 'left')
        k.tube('Bus mirror stalk',[(s*1.08,2.54,4.43),(s*1.38,2.62,4.45)],.024,BLACK)
        k.box('Bus mirror',(s*1.39,2.47,4.42),(.16,.35,.12),BLACK,.033)
        k.box('Bus mirror glass',(s*1.39,2.47,4.352),(.126,.296,.009),'91a4a1',.026,'glass')
        k.cylinder('Bus headlamp chrome ring',(s*.82,.993,4.594),.093,.026,METAL,(0,0,1),'metal',28)
        k.cylinder('Bus low round headlamp',(s*.82,.993,4.615),.069,.017,LAMP,(0,0,1),'lamp',28)
        k.box('Bus front indicator',(s*1.024,.99,4.591),(.075,.088,.028),'e9a333',.018,'lamp')
        k.box('Bus tail light',(s*.95,1.04,-4.593),(.14,.32,.024),'9f1721',.026,'lamp')
        for z in [-4.22,0,4.25]:
            k.box('Side amber marker',(s*1.159,.84,z),(.019,.048,.09),'e9a333',.009,'lamp')
        for z in [-1.7,.0,1.65]: k.tube('Body service panel seam',[(s*1.157,.60,z),(s*1.157,1.51,z)],.004,'812b25','paint')
        k.tube('Body white lower pinstripe',[(s*1.16,.66,-4.16),(s*1.16,.66,4.16)],.008,cream,'paint')
    # Empty aperture between A pillars: no solid body block behind the glass.
    for s in [-1,1]: k.tube('Front windscreen pillar',[(s*1.073,1.73,4.58),(s*1.045,2.75,4.54)],.043,cream,'paint')
    window(k,'Front panoramic windshield',[(-1.038,1.761,4.599),(1.038,1.761,4.599),(1.017,2.715,4.552),(-1.017,2.715,4.552)],'48676c','glass',.12)
    k.box('White route board surround',(0,2.90,4.489),(2.16,.33,.18),cream,.135)
    k.box('Green route board',(0,2.898,4.59),(1.94,.25,.015),'174534',.107)
    k.text('Bus destination','BEST   86   MUMBAI',(0,2.902,4.603),.12,cream)
    k.text('Bus fleet identity','MUTP',(0,1.681,4.594),.068,BLACK)
    k.tube('Front windshield divider',[(0,1.77,4.621),(0,2.71,4.566)],.024,red,'paint')
    for s in [-1,1]:
        k.tube('Bus wiper arm',[(s*.84,1.77,4.628),(s*.32,2.13,4.612)],.012,BLACK)
        k.tube('Bus wiper blade',[(s*.49,1.98,4.625),(s*.16,2.33,4.606)],.014,BLACK,'rubber')
        k.box('Yellow windshield handrail',(s*.52,1.803,4.525),(.90,.085,.021),yellow,.008)
    for i in range(10):
        y=.967+i*.055; w=1.00+min(i,5)*.088
        k.box('Broad horizontal radiator slot',(0,y,4.587),(w,.021,.017),'512820',.005,'rubber')
    k.cylinder('Bus nose badge',(0,1.504,4.607),.046,.01,METAL,(0,0,1))
    k.box('Front red bumper',(0,.680,4.606),(2.30,.21,.18),red,.049)
    k.box('Rear red bumper',(0,.680,-4.606),(2.30,.21,.18),red,.049)
    k.text('Bus grille badge','ASHOK LEYLAND',(0,.86,4.59),.072,cream)
    for z,facing in [(4.70,'front'),(-4.70,'rear')]:
        k.box('Bus plate',(0,.668,z),(.38,.104,.013),yellow,.006)
        k.text('Bus plate letters','MH 01 L 9370',(0,.668,z+(.008 if z>0 else -.008)),.038,BLACK,facing)
    window(k,'Rear bus window',[(-.98,1.88,-4.59),(.98,1.88,-4.59),(.98,2.60,-4.57),(-.98,2.60,-4.57)],'48676c','glass',.09)
    k.box('Rear upper panel',(0,2.768,-4.54),(2.18,.32,.095),red,.04)
    k.box('Rear emergency hatch',(0,1.315,-4.588),(1.71,.32,.022),red,.014)
    for i in range(6): k.box('Rear engine louvre',(0,.94+i*.058,-4.594),(1.42,.023,.013),'702d25',.004)
    # Left-hand passenger entrance with split folding glass doors and steps.
    k.box('Bus door surround',(-1.164,1.51,3.83),(.04,1.86,.86),BLACK,.025)
    for z in [3.62,4.04]:
        k.box('Folding door glass',(-1.19,1.94,z),(.015,.92,.34),'345463',.014,'glass')
        k.box('Door lower panel',(-1.19,1.15,z),(.015,.48,.34),red,.014)
    k.box('Entrance step',(-1.23,.49,3.83),(.21,.085,.83),'6c7371',.012,'metal')
    k.tube('Door grab pole',[(-1.085,.72,4.16),(-1.085,2.63,4.16)],.019,yellow,'paint')
    k.section='interior'
    k.box('Bus cabin floor',(0,.713,0),(2.10,.06,8.83),'545b58',.017,'rubber')
    for z in [-3.48,-2.48,-1.48,-.48,.52,1.52,2.52]:
        for s in [-1,1]:
            k.box('Two-person bus cushion',(s*.66,1.155,z),(.72,.13,.45),'63494a',.039,'seat')
            k.box('Two-person bus seat back',(s*.66,1.45,z-.20),(.72,.56,.085),'63494a',.035,'seat')
            k.tube('Seat top handrail',[(s*.99,1.71,z-.22),(s*.33,1.71,z-.22)],.017,METAL)
            for x in [s*.37,s*.92]: k.tube('Seat leg',[(x,.75,z),(x,1.12,z)],.019,METAL)
    k.tube('Overhead aisle rail',[(-.22,2.53,-3.70),(-.22,2.53,3.65)],.017,yellow,'paint')
    for z in [-2.9,-.9,1.1,3.1]: k.tube('Vertical cabin stanchion',[(-.24,.73,z),(-.24,2.7,z)],.022,yellow,'paint')
    k.section='body'
    car_interior(k,4.19,3.10,2.02,1.01,driver_only=True)
    k.finish(); return k


def toto(scene):
    k=VehicleKit(scene,'traffic_toto',2); blue='28569f'; green='4be520'; frame='aeb7b9'
    k.root['passengerSeats']=4
    k.root['seating']='Two transverse two-person benches facing one another, plus a separate forward-facing driver'
    k.box('Long open floor',(0,.408,-.13),(1.34,.105,3.02),blue,.03)
    k.box('Rubber passenger footwell',(0,.469,-.30),(1.20,.023,2.52),'4b5159',.009,'rubber')
    for s in [-1,1]:
        k.tube('Green sill accent',[(s*.682,.444,-1.57),(s*.682,.444,1.28)],.010,green,'paint')
    # Bench one faces rearward (-Z); bench two faces forward (+Z).
    for z,facing in [(0,-1),(-1.28,1)]:
        back=z-facing*.238
        k.box('Passenger battery-seat base',(0,.68,z),(1.16,.38,.47),blue,.035)
        k.box('Two passenger cushion',(0,.932,z),(1.16,.13,.52),'4e555d',.055,'seat')
        k.box('Two passenger backrest',(0,1.208,back),(1.16,.43,.10),'4e555d',.049,'seat')
        k.tube('Bench centre stitch',[(0,.998,z-facing*.20),(0,.998,z+facing*.19)],.004,'4777bd','seat')
        for s in [-1,1]:
            k.tube('Bench armrest',[(s*.601,.90,z+facing*.20),(s*.601,1.12,z+facing*.20),(s*.601,1.14,back)],.021,frame)
            k.box('Battery side cover',(s*.624,.716,z),(.022,.32,.42),blue,.017)
            k.mesh('Green side chevron',[(s*.639,.826,z-.17),(s*.639,.801,z+.17),(s*.639,.749,z+.17),(s*.639,.787,z-.17)],[(0,1,2,3)],green)
            for j in range(3): k.box('Battery vent',(s*.641,.615+j*.045,z),(.008,.015,.18),'172d51',.003)
    k.box('Driver saddle pedestal',(0,.672,.65),(.48,.30,.43),blue,.035)
    k.box('Separate driver saddle',(0,.872,.65),(.56,.12,.48),BLACK,.050,'seat')
    k.box('Driver back pad',(0,1.126,.399),(.52,.39,.072),BLACK,.037,'seat')
    # Just two structural hoops, at the seat frames. No vertical posts through
    # the long open passenger entry between the opposed benches.
    for z in [-1.57,.32]:
        for s in [-1,1]: k.tube('Seat frame roof support',[(s*.625,.46,z),(s*.659,1.925,z)],.024,frame)
        k.tube('Roof crossmember',[(-.66,1.927,z),(.66,1.927,z)],.022,frame)
    for s in [-1,1]:
        k.tube('Roof longitudinal rail',[(s*.66,1.938,-1.60),(s*.66,1.938,.89)],.021,frame)
        k.tube('Rear safety rail',[(s*.62,1.28,-1.58),(s*.62,1.28,-1.35)],.018,frame)
        # Swept windscreen support connects the front cowl directly to the roof.
        curve=[(s*.53,1.14,1.442),(s*.54,1.34,1.365),(s*.55,1.58,1.18),(s*.57,1.81,.99),(s*.60,1.937,.83)]
        k.tube('Curved windscreen hoop',curve,.025,frame)
        for z in [-1.10,-.42,.03]:
            k.tube('Hanging handle strap',[(s*.42,1.93,z),(s*.42,1.80,z)],.009,'e6bd35','paint')
            k.tube('Passenger handhold',[(s*.42,1.80,z),(s*.42,1.70,z-.052),(s*.42,1.70,z+.052),(s*.42,1.80,z)],.011,'e6bd35','paint')
    k.box('Thin blue canopy',(0,1.984,-.38),(1.47,.108,2.68),blue,.045)
    k.box('Black canopy edge',(0,1.94,-.38),(1.49,.026,2.69),BLACK,.012)
    for s in [-1,1]: k.box('Green canopy stripe',(s*.739,1.997,-.54),(.009,.027,.48),green,.003)
    # The real reference has an OPEN bowed front hoop, not a tall glazed cabin.
    k.tube('Front hoop lower brace',[(-.53,1.14,1.442),(.53,1.14,1.442)],.019,frame)
    k.box('Front blue cowl',(0,.903,1.357),(.54,.43,.19),blue,.10)
    k.cylinder('Headlight chrome rim',(0,.985,1.465),.154,.033,frame,(0,0,1),segments=32)
    k.cylinder('Round headlight',(0,.985,1.488),.128,.018,LAMP,(0,0,1),'lamp',32)
    k.tube('Steering stem',[(0,.40,1.52),(0,1.13,1.182)],.030,BLACK)
    for s in [-1,1]:
        k.tube('Front suspension',[(s*.117,.293,1.56),(s*.117,.81,1.33)],.027,frame)
        k.tube('Handlebar',[(0,1.13,1.182),(s*.18,1.18,1.124),(s*.34,1.165,1.063)],.017,frame)
        k.tube('Handle grip',[(s*.25,1.172,1.092),(s*.36,1.159,1.052)],.023,BLACK,'rubber')
        k.cylinder('Amber indicator',(s*.31,.90,1.40),.048,.035,'e9a02b',(0,0,1),'lamp')
        k.tube('Mirror stalk',[(s*.31,1.18,1.10),(s*.61,1.40,1.10)],.010,frame)
        k.sphere('Toto mirror',(s*.64,1.436,1.10),(.085,.10,.027),BLACK)
        k.box('Rear tail lamp',(s*.53,.79,-1.647),(.13,.19,.025),'ad2028',.024,'lamp')
    k.text('E-rickshaw rear name','ELECTRIC',(0,.736,-1.674),.074,'d2ded3','rear')
    k.box('Rear number plate',(0,.551,-1.674),(.28,.08,.018),green,.006)
    k.tube('Electric drive axle',[(-.62,.293,-1.27),(.62,.293,-1.27)],.029,BLACK)
    k.cylinder('Electric differential',(0,.293,-1.27),.092,.29,BLACK)
    # Reference proportions: shorten the long body, then install circular wheels.
    k.deform_body(lambda p:(p[0],p[1],p[2]*.84))
    for s in [-1,1]:
        k.wheel(s*.619,-1.27*.84,.293,.20,spokes=8)
        k.arch('Rear blue wheel cover',s*.62,-1.27*.84,.293,.375,.24,blue)
    k.wheel(0,1.56*.84,.293,.20,spokes=8)
    k.arch('Front mudguard',0,1.56*.84,.293,.363,.31,blue,start=.24,end=2.87)
    k.rider=True
    k.sphere('E-rickshaw driver torso',(0,1.19,.65*.84),(.18,.25,.13),'a58b65','seat')
    k.sphere('E-rickshaw driver head',(0,1.54,.66*.84),(.116,.145,.116),'a5724d','seat')
    k.sphere('E-rickshaw driver hair',(0,1.64,.64*.84),(.117,.061,.114),'292727','seat')
    for s in [-1,1]:
        hand=(s*.30,1.168,1.075*.84)
        k.tube('E-rickshaw driver sleeve',[(s*.17,1.31,.65*.84),(s*.25,1.12,.83*.84)],.053,'a58b65','seat')
        k.tube('E-rickshaw driver arm',[(s*.25,1.12,.83*.84),hand],.039,'a5724d','seat')
        k.sphere('E-rickshaw driver hand',hand,(.045,.035,.044),'a5724d','seat')
        k.tube('E-rickshaw driver trousers',[(s*.12,.91,.67*.84),(s*.20,.73,.96*.84),(s*.20,.49,1.05*.84)],.069,'454c52','seat')
        k.box('E-rickshaw driver shoe',(s*.20,.48,1.14*.84),(.115,.074,.20),BLACK,.02,'rubber')
    k.rider=False
    k.finish(); return k
