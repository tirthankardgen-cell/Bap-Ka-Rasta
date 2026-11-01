"""Everyday Mumbai cars, modelled from the supplied Indian-car contact sheet.

Each silhouette has its own bonnet, glasshouse, lamps and wheelbase. All cabins
are hollow with seats and right-hand-drive controls; the runtime keeps dark glass.
"""
import math
from vehicle_primitives import VehicleKit
from reference_vehicles import BLACK, GLASS, METAL, LAMP, hull, wheel_cuts, cabin_cut, window, cabin_frame, car_interior


SPECS = [
    dict(name='traffic_hatchback',kind=9,reference='Swift hatchback',paint='c83d3b',half=1.88,width=1.735,roof=1.49,sill=1.02,hood=.80,wind=.29,back=-1.64,backtop=-1.26,axles=(-1.20,1.19),radius=.30),
    dict(name='traffic_wagon',kind=10,reference='Wagon R tall hatchback',paint='abb3b7',half=1.80,width=1.625,roof=1.685,sill=1.04,hood=.86,wind=.61,back=-1.68,backtop=-1.52,axles=(-1.18,1.17),radius=.29),
    dict(name='traffic_crossover',kind=11,reference='Creta compact SUV',paint='deded6',half=2.13,width=1.79,roof=1.66,sill=1.13,hood=1.04,wind=.50,back=-1.89,backtop=-1.66,axles=(-1.30,1.31),radius=.335),
    dict(name='traffic_mpv',kind=12,reference='Innova family MPV',paint='959fa6',half=2.37,width=1.83,roof=1.79,sill=1.22,hood=1.08,wind=.37,back=-2.18,backtop=-1.98,axles=(-1.46,1.47),radius=.343),
]


def supporting_car(scene,spec):
    d=spec; k=VehicleKit(scene,d['name'],d['kind'])
    k.root['reference_model']=d['reference']
    k.root['cabin']='Hollow cabin, seats, independent glass and right-hand-drive controls'
    paint=d['paint']; w=d['width']/2; f=d['half']; rear=-f
    y=d['sill']; h=d['roof']; hb=d['hood']; wt=d['wind']; rb=d['back']; rt=d['backtop']
    SUV=d['kind'] in (11,12); r=d['radius']; axles=d['axles']
    body=hull(k,'Pressed body with crowned shoulders',[
        (rear,w*.85,.44,y-.11),(rear+.13,w*.96,.36,y-.04),
        (axles[0],w,.35,y),(-.12,w,.36,y+.014),
        (hb,w*.985,.39,y+.027),(f-.23,w*.96,.45,y-.02),(f,w*.85,.51,y-.14),
    ],paint)
    wheel_cuts(k,body,axles,r+.063)
    cabin_cut(k,body,hb-.07,rb+.10,d['width']-.24,y-.56)
    hull(k,'Sloping bonnet',[(hb,w*.86,y-.018,y+.035),(hb+.17,w*.91,y+.014,y+.058),(f-.08,w*.81,y-.10,y-.061)],paint)
    cw=w*1.87; rw=w*1.63
    cabin_frame(k,hb,wt,rb,rt,y+.018,h-.045,cw,rw,paint,[-.23,-1.22] if d['kind']==12 else [-.24])
    roofpaint=BLACK if d['kind']==11 else paint
    k.box('Rounded roof',(0,h-.006,(wt+rt)/2),(rw+.035,.087,wt-rt+.13),roofpaint,.056)
    car_interior(k,hb-.16,rb+.12,d['width']-.28,y-.36,d['kind']==12)
    front=[(-cw*.435,y+.070,hb+.007),(cw*.435,y+.070,hb+.007),(rw*.457,h-.092,wt+.016),(-rw*.457,h-.092,wt+.016)]
    window(k,'Front windscreen',front,'30434b','glass',.115)
    window(k,'Rear windscreen',[(-cw*.427,y+.085,rb-.009),(cw*.427,y+.085,rb-.009),(rw*.452,h-.095,rt-.016),(-rw*.452,h-.095,rt-.016)],'30434b','glass',.10)
    for s in [-1,1]:
        segments=[(hb-.063,-.19,wt-.055,-.19),(-.30,rb+.105,-.30,rt+.075)]
        if d['kind']==12: segments=[(hb-.063,-.19,wt-.06,-.19),(-.30,-1.17,-.30,-1.20),(-1.29,rb+.09,-1.29,rt+.06)]
        for a,b,c,e in segments:
            window(k,'Side window with tapered upper edge',[(s*cw*.504,y+.074,a),(s*cw*.504,y+.074,b),(s*rw*.497,h-.105,e),(s*rw*.497,h-.105,c)],'30434b','glass',.12)
        k.tube('Window lower brightwork',[(s*cw*.509,y+.044,hb-.08),(s*cw*.509,y+.044,rb+.08)],.009,METAL)
        for z in [-.24,rb+.23]:
            k.tube('Door shut line',[(s*w*1.006,.49,z),(s*w*1.006,y-.07,z),(s*cw*.506,y+.047,z)],.0045,BLACK,'rubber')
            k.box('Recessed door handle',(s*w*1.008,y-.072,z+.14),(.028,.035,.145),METAL if SUV else paint,.010,'metal' if SUV else 'paint')
        k.box('Black sill moulding',(s*w*.996,.416,-.06),(.065,.07,axles[1]-axles[0]-.46),BLACK,.022,'rubber')
        k.tube('Mirror stem',[(s*cw*.49,y+.19,hb-.18),(s*(w+.07),y+.22,hb-.20)],.015,BLACK)
        k.box('Painted mirror',(s*(w+.10),y+.235,hb-.21),(.176,.111,.162),paint,.049)
        k.box('Mirror glass',(s*(w+.10),y+.235,hb-.297),(.139,.082,.008),'7b939d',.024,'glass')
        k.box('Mirror indicator',(s*(w+.112),y+.217,hb-.124),(.103,.012,.005),LAMP,.004,'lamp')
        for z in axles:
            k.wheel(s*(w-.048),z,r,.225 if SUV else .205,spokes=8 if SUV else 6)
            if SUV: k.arch('Black wheel arch trim',s*(w-.004),z,r,r+.067,.093,BLACK)
        k.tube('Front wiper',[(s*cw*.38,y+.085,hb+.013),(s*.12,y+.117,hb-.04)],.006,BLACK,'rubber')
        if SUV:
            k.tube('Low roof rail',[(s*rw*.42,h+.032,rt+.14),(s*rw*.42,h+.071,rt+.24),(s*rw*.42,h+.071,wt-.23),(s*rw*.42,h+.032,wt-.12)],.015,'4b555b')
    k.box('Front bumper',(0,.574,f+.003),(d['width']-.05,.18,.13),paint,.052)
    k.box('Rear bumper',(0,.528,rear+.012),(d['width']-.045,.18,.135),paint,.052)
    if d['kind']==11:
        # Creta-like split front lamps and a full-width daytime-running light.
        k.box('Wide dark grille',(0,.913,f+.025),(1.44,.255,.033),BLACK,.035)
        for i in range(7): k.box('Grille block',(i*.185-.555,.906,f+.047),(.10,.065,.014),'727d81',.009,'metal')
        k.tube('Continuous LED signature',[(-.76,1.035,f+.053),(.76,1.035,f+.053)],.012,LAMP,'lamp')
        for s in [-1,1]:
            k.box('Split lamp housing',(s*.725,.836,f+.054),(.18,.235,.036),BLACK,.024)
            for yy in [.785,.875]: k.box('Split LED projector',(s*.725,yy,f+.077),(.126,.051,.011),LAMP,.013,'lamp')
            k.box('Horizontal rear lamp',(s*.56,1.09,rear-.025),(.52,.116,.033),'b22227',.021,'lamp')
        k.tube('Rear connected light',[(.77,1.075,rear-.048),(-.77,1.075,rear-.048)],.012,'b22227','lamp')
        k.box('Front grey skid plate',(0,.454,f+.01),(1.15,.081,.079),'7b8384',.02,'metal')
    elif d['kind']==10:
        # Wagon R: upright glasshouse, short high bonnet and long rear lamps.
        k.box('Narrow grille',(0,.822,f+.042),(.70,.123,.026),BLACK,.02)
        k.box('Grille chrome blade',(0,.879,f+.06),(.88,.021,.017),METAL,.006,'metal')
        for s in [-1,1]:
            k.box('Tall front headlamp',(s*.57,.946,f-.006),(.27,.236,.044),LAMP,.041,'lamp')
            k.box('Vertical rear lamp',(s*.67,1.281,rear+.045),(.13,.55,.06),'ad2729',.027,'lamp')
            k.box('Rear reversing strip',(s*.67,1.261,rear+.008),(.113,.088,.012),LAMP,.009,'lamp')
    else:
        grille=[(-.53,.927 if SUV else .80,f+.038),(.53,.927 if SUV else .80,f+.038),(.39,.638,f+.054),(-.39,.638,f+.054)]
        window(k,'Deep trapezoidal radiator grille',grille,BLACK,'rubber',.11)
        for yy in ([.69,.765,.84,.90] if SUV else [.665,.715,.765]):
            k.box('Grille horizontal blade',(0,yy,f+.064),(.79,.015,.016),METAL if SUV else '40474b',.004,'metal')
        for s in [-1,1]:
            window(k,'Swept headlight',[(s*.45,y-.063,f+.036),(s*w*.94,y+.052,f-.19),(s*w*.90,y-.133,f-.086),(s*.50,y-.157,f+.044)],LAMP,'lamp',.10)
            k.cylinder('Recessed fog light',(s*w*.73,.603,f+.059),.041,.012,LAMP,(0,0,1),'lamp')
            k.box('Rear combination lamp',(s*w*.74,y-.02,rear+.001),(.31,.183,.05),'ac2928',.039,'lamp')
            k.box('Rear clear lamp strip',(s*w*.74,y+.01,rear-.028),(.26,.031,.009),LAMP,.009,'lamp')
    k.box('Front plate',(0,.557,f+.080),(.33,.087,.008),'d8dfd7',.007)
    k.text('Front registration','MH 02 BK 2026',(0,.557,f+.087),.032,BLACK)
    k.box('Rear plate recess',(0,.77,rear-.033),(.39,.112,.014),BLACK,.016)
    k.box('Rear registration',(0,.77,rear-.043),(.32,.078,.008),'d8dfd7',.005)
    k.text('Rear registration letters','MH 02 BK 2026',(0,.77,rear-.05),.032,BLACK,'rear')
    k.tube('Rear wiper',[(.22,y+.098,rb-.024),(-.22,y+.145,rb+.005)],.007,BLACK,'rubber')
    k.box('High rear brake light',(0,h-.079,rt-.029),(.24,.024,.012),'bd2829',.007,'lamp')
    k.box('Rear hatch release',(0,y-.04,rear-.041),(.16,.024,.018),METAL,.007,'metal')
    k.text('Tailgate model name',d['reference'].split()[0].upper(),(0,y-.133,rear-.049),.046,METAL,'rear')
    k.tube('Exhaust tip',[(w*.61,.36,rear+.16),(w*.61,.35,rear-.024)],.023,'555e62')
    k.finish()
    return k


def supporting_vehicles(scene):
    return [supporting_car(scene,spec) for spec in SPECS]
