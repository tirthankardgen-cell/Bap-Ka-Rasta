import test from "node:test";
import assert from "node:assert/strict";
import { streets, junctions, geometry, streetPath, roadContains, isCurved, WORLD_BOUNDS, CENTRAL_PLAZA, roundabouts } from "../src/game/network.ts";
import { landmarkSites, landmarkApproaches } from "../src/game/landmark-layout.ts";
import { buildingLots, footprintPoint, footprintsOverlap, lotFootprint } from "../src/game/buildings.ts";
import { newTraffic } from "../src/game/simulation.ts";
import { trafficDimensions, vehicleContact } from "../src/game/world-scale.ts";
import { trafficCar } from "../src/game/vehicles.ts";
import { Box3, Vector3 } from "three";

test("the enlarged map has connected, curved two-lane streets in every quadrant", () => {
  assert.ok(streets.length >= 200);
  assert.ok((WORLD_BOUNDS.maxX-WORLD_BOUNDS.minX)*(WORLD_BOUNDS.maxZ-WORLD_BOUNDS.minZ) > 3_500_000);
  for (const sx of [-1,1]) for (const sz of [-1,1]) {
    const quarter=streets.filter(e => {
      const g=geometry(e.id);
      return ((g.a.x+g.b.x)/2-CENTRAL_PLAZA.x)*sx>0 && ((g.a.z+g.b.z)/2-CENTRAL_PLAZA.z)*sz>0;
    });
    assert.ok(quarter.filter(e=>!e.oneWay&&e.width===10&&isCurved(e.id)).length >= 8, `curved lanes in ${sx},${sz}`);
    assert.ok(quarter.filter(e=>e.width===24).length>=3, `avenues in ${sx},${sz}`);
  }
  for(const e of streets) {
    assert.notEqual(e.a,e.b);
    const path=streetPath(e.id);
    assert.ok(Math.hypot(path[0].x-junctions[e.a].x,path[0].z-junctions[e.a].z)<.001);
    assert.ok(Math.hypot(path.at(-1)!.x-junctions[e.b].x,path.at(-1)!.z-junctions[e.b].z)<.001);
    for(const n of junctions) {
      if(n.id===e.a||n.id===e.b) continue;
      for(let i=1;i<path.length;i++) {
        const a=path[i-1],b=path[i],dx=b.x-a.x,dz=b.z-a.z;
        const t=((n.x-a.x)*dx+(n.z-a.z)*dz)/(dx*dx+dz*dz);
        if(t>0&&t<1) assert.ok(Math.hypot(n.x-a.x-t*dx,n.z-a.z-t*dz)>.1,`street ${e.id} skips crossing ${n.id}`);
      }
    }
  }
  const fleet=newTraffic();
  assert.ok(fleet.some(t=>t.x>900));
  assert.ok(fleet.some(t=>t.z>860));
  assert.ok(fleet.some(t=>t.z< -1000));
});

test("Mumbai Chowk is at the geometric centre with a clear island for the future feature", () => {
  assert.equal(CENTRAL_PLAZA.x,(WORLD_BOUNDS.minX+WORLD_BOUNDS.maxX)/2);
  assert.equal(CENTRAL_PLAZA.z,(WORLD_BOUNDS.minZ+WORLD_BOUNDS.maxZ)/2);
  const centre=roundabouts.find(r=>r.id==='central')!;
  assert.ok(centre.islandRadius > CENTRAL_PLAZA.radius+20);
  for(let x=-CENTRAL_PLAZA.radius;x<=CENTRAL_PLAZA.radius;x+=2)
    for(let z=-CENTRAL_PLAZA.radius;z<=CENTRAL_PLAZA.radius;z+=2)
      assert.equal(roadContains(CENTRAL_PLAZA.x+x,CENTRAL_PLAZA.z+z,0),false);
  assert.equal(streets.filter(s=>s.roundabout==='central').length,8);
  for(const ring of roundabouts.filter(r=>r.id==='dadar'||r.id==='cuffe')) {
    assert.equal(streets.filter(s=>s.roundabout===ring.id).length,8);
    assert.equal(roadContains(ring.x,ring.z,0),false);
    for(let i=0;i<64;i++) {
      const angle=i*Math.PI/32;
      assert.equal(roadContains(ring.x+Math.sin(angle)*ring.radius,ring.z+Math.cos(angle)*ring.radius,0),true);
    }
  }
});

test("complete landmark and shop forecourts clear every road, building and neighbouring site", () => {
  const lots=buildingLots();
  assert.ok(lots.length>1500);
  for(const site of landmarkSites) {
    for(let x=-site.halfWidth;x<=site.halfWidth;x+=2)
      for(let z=-site.halfLength;z<=site.halfLength;z+=2) {
        const p=footprintPoint(site,x,z);
        assert.equal(roadContains(p.x,p.z,0),false,site.id+' forecourt enters a road');
        assert.ok(p.x>WORLD_BOUNDS.minX&&p.x<WORLD_BOUNDS.maxX&&p.z>WORLD_BOUNDS.minZ&&p.z<WORLD_BOUNDS.maxZ);
      }
    for(const lot of lots) assert.equal(footprintsOverlap(site,lotFootprint(lot)),false,site.id+' intersects ordinary frontage');
    for(const other of landmarkSites) if(site!==other) assert.equal(footprintsOverlap(site,other),false,site.id+' intersects '+other.id);
  }
  const find=(id:string)=>landmarkSites.find(s=>s.id===id)!;
  assert.ok(find('mannat').z<find('antilia').z&&find('galaxy').z<find('antilia').z);
  assert.ok(find('gateway').x>find('taj-palace').x);
  assert.ok(find('csmt').z<find('bmc').z);
  for(const approach of landmarkApproaches) {
    for(let x=-approach.halfWidth;x<=approach.halfWidth;x+=2)
      for(let z=-approach.halfLength;z<=approach.halfLength;z+=2) {
        const p=footprintPoint(approach,x,z);
        assert.equal(roadContains(p.x,p.z,0),false,approach.id+' approach enters a road');
      }
    for(const lot of lots) assert.equal(footprintsOverlap(approach,lotFootprint(lot)),false,approach.id+' approach blocked by frontage');
    for(const site of landmarkSites) if(site.id!==approach.id) assert.equal(footprintsOverlap(approach,site),false,approach.id+' approach crosses '+site.id);
  }
});

test("car and bus meshes use metre-scale bodies with grounded circular wheels", () => {
  for(const kind of [0,1,2,3]) {
    const model=trafficCar(kind), b=new Box3().setFromObject(model);
    const size=b.getSize(new Vector3()), expected=trafficDimensions(kind);
    assert.ok(Math.abs(b.min.y)<.001);
    assert.ok(Math.abs(size.y-expected.height)<.02,`kind ${kind} height ${size.y}`);
    assert.ok(Math.abs(size.z-expected.length)<.05,`kind ${kind} length ${size.z}`);
    assert.ok(size.x>=expected.width&&size.x<expected.width+.35);
  }
});

test("collisions include the front and rear of a full-length bus without blocking adjacent lanes", () => {
  for(const yaw of [0,Math.PI/4,Math.PI/2]) {
    const bus={x:0,z:0,yaw,kind:3};
    for(const direction of [-1,1]) {
      const along=direction*5.5;
      const car={x:Math.sin(yaw)*along,z:Math.cos(yaw)*along,yaw};
      const contact=vehicleContact(car,bus);
      assert.ok(contact,'bus end must collide');
      car.x+=contact.x;car.z+=contact.z;
      assert.equal(vehicleContact(car,bus),null,'minimum translation clears the actual bodies');
    }
    assert.equal(vehicleContact({x:Math.cos(yaw)*2.5,z:-Math.sin(yaw)*2.5,yaw},bus),null);
  }
});
