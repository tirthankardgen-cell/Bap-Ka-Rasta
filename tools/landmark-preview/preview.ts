/** Development viewer: the real game world, shipped GLBs, lighting and LODs. */
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { loadGameAssets } from "../../src/game/game-assets";
import { makeWorld, trafficVisuals, autoRickshaw, scooterModel } from "../../src/game/world";
import { trafficCar } from "../../src/game/vehicles";
import { atmosphere } from "../../src/game/atmosphere";
import { newTraffic } from "../../src/game/simulation";
import { landmarkSites } from "../../src/game/landmark-layout";
import { CENTRAL_PLAZA, roundabouts } from "../../src/game/network";
import { makeCastBatch, finishCastBatch } from "../../src/game/character-models";

document.body.style.cssText="margin:0;background:#ecdfc5;color:#28251c;font:15px system-ui;overflow:hidden";
const bar=document.createElement("div");
bar.style.cssText="position:absolute;z-index:2;top:16px;left:20px;right:20px;display:flex;gap:8px;flex-wrap:wrap;align-items:center";
bar.innerHTML='<strong style="background:#fff8e8;padding:10px 14px;border-radius:8px">Mumbai · world review</strong>';
const select=document.createElement("select");select.setAttribute("aria-label","Landmark");
for(const s of landmarkSites) select.add(new Option(s.name,s.id));
select.add(new Option("Mumbai Chowk · central roundabout","central"));
select.add(new Option("Dadar Garden Circle · small roundabout","circle:dadar"));
select.add(new Option("Cuffe Parade Circle · small roundabout","circle:cuffe"));
select.add(new Option("Street scale · people and vehicles","scale"));
const quality=document.createElement("button");quality.textContent="Standard graphics";
const view=document.createElement("button");view.textContent="Street view";
for(const el of [select,quality,view]) el.style.cssText="padding:10px 14px;border:1px solid #b4a787;border-radius:8px;background:#fff8e8;font:600 14px system-ui;cursor:pointer";
bar.append(select,view,quality);document.body.append(bar);
const caption=document.createElement("div");caption.style.cssText="position:absolute;bottom:20px;left:24px;max-width:90%;background:#fff8e8e8;border-radius:10px;padding:13px 18px;font:600 16px system-ui";caption.textContent="Loading the game world…";document.body.append(caption);
const renderer=new THREE.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});
renderer.setPixelRatio(1);renderer.setSize(innerWidth,innerHeight);
renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=.95;
renderer.domElement.setAttribute("aria-label","Mumbai game world landmark preview");document.body.append(renderer.domElement);
const scene=new THREE.Scene();
const lighting=atmosphere(renderer,scene);
const camera=new THREE.PerspectiveCamera(50,innerWidth/innerHeight,.1,3500);
const orbit=new OrbitControls(camera,renderer.domElement);orbit.enableDamping=true;orbit.maxDistance=2200;orbit.maxPolarAngle=Math.PI*.49;
const assets=await loadGameAssets();
const world=await makeWorld(scene,assets.characterModels,assets.landmarkModels);
const traffic=await trafficVisuals(scene,newTraffic(),assets.autoModel);
const scaleGroup=new THREE.Group();scaleGroup.name="Scale comparison on the central level plaza";scaleGroup.visible=false;scene.add(scaleGroup);
const scaleOrigin=new THREE.Vector3(CENTRAL_PLAZA.x,CENTRAL_PLAZA.height,CENTRAL_PLAZA.z);
const measured:Record<string,{width:number;height:number;length:number}>={};
function addScale(model:THREE.Object3D,name:string,x:number,z=0) {
  const size=new THREE.Box3().setFromObject(model).getSize(new THREE.Vector3());
  measured[name]={width:size.x,height:size.y,length:size.z};
  model.position.set(x,0,z);scaleGroup.add(model);
}
for(const [id,x] of [["patil",-10],["meera",-8.5],["sachin",-7]] as const) {
  const batch=makeCastBatch(assets.characterModels.cast.get(id)!.detail,1,assets.characterModels,id,true);
  batch.mesh.setMatrixAt(0,new THREE.Matrix4());batch.mesh.setColorAt(0,new THREE.Color(1,1,1));batch.mesh.count=1;
  batch.motion.setXYZW(0,0,0,0,0);finishCastBatch(batch);batch.mesh.visible=true;addScale(batch.mesh,id,x);
}
addScale(scooterModel(),"scooter with rider",-4.6);
addScale(autoRickshaw(assets.autoModel).root,"auto",-1.5);
addScale(trafficCar(0),"car",2.2);
addScale(trafficCar(3),"BEST midi bus",6.4,-2);
scaleGroup.position.copy(scaleOrigin);
let low=false,street=false,elapsed=0,focusX=0,focusZ=0,dirty=true;
orbit.addEventListener('change',()=>{dirty=true;});
function show(id=select.value) {
  dirty=true;
  select.value=id;scaleGroup.visible=id==='scale';
  if(id==='central'||id==='scale'||id.startsWith('circle:')) {
    const ring=roundabouts.find(r=>r.id===id.slice(7))??roundabouts[1];
    focusX=ring.x;focusZ=ring.z;
    const scale=id==='scale';
    camera.position.set(focusX+(scale?4:112),scale?3.2:135,focusZ+(scale?24:165));
    camera.fov=scale?38:50;camera.updateProjectionMatrix();
    orbit.target.set(focusX,scale?1.4:0,focusZ);
    caption.textContent=scale?'One world unit = 1 metre · 1.60–1.80 m adults · 2.08 m auto · 1.55 m car · 3.10 m bus':id==='central'?'Mumbai Chowk · 100 m island · central 40 m circle reserved for the future feature':`${ring.name} · ${ring.radius} m road radius · planted neighbourhood island`;
  } else {
    const site=landmarkSites.find(s=>s.id===id)!;
    const tower=site.height>150;
    camera.fov=!street&&tower?70:50;camera.updateProjectionMatrix();
    // Keep tall towers inside the game's normal fog range while fitting their
    // full height. Review uses the same lighting and fog as the playable scene.
    const distance=street?site.halfLength+23:Math.max(site.height*(tower ? .95 : 1.7),site.width*1.35,site.depth*1.6);
    const p=new THREE.Vector3(street?0:site.width*.25,street?2.15:site.height*(tower ? .65 : .75),distance).applyAxisAngle(new THREE.Vector3(0,1,0),site.yaw);
    camera.position.set(site.x+p.x,p.y,site.z+p.z);
    orbit.target.set(site.x,street?Math.min(site.height*.3,18):site.height*(tower ? .5 : .42),site.z);
    focusX=site.x+Math.sin(site.yaw)*(site.halfLength+8);focusZ=site.z+Math.cos(site.yaw)*(site.halfLength+8);
    caption.textContent=`${site.name} · ${site.district} · ${site.height} m (${site.heightBasis})`;
  }
  lighting.quality(low);lighting.update(focusX,focusZ,elapsed+=.3);
  world.update(elapsed,focusX,focusZ,low);traffic(focusX,focusZ);orbit.update();
  document.body.dataset.site=id;document.body.dataset.quality=low?'low':'standard';
}
select.onchange=()=>show();view.onclick=()=>{street=!street;view.textContent=street?'Overview':'Street view';show();};
quality.onclick=()=>{low=!low;quality.textContent=low?'Low graphics':'Standard graphics';show();};
show(new URLSearchParams(location.search).get('id')??'taj-palace');
Object.assign(window,{landmarkReview:{show,world,assets,scene,camera,renderer,orbit,measured,scaleGroup,lighting}});
renderer.setAnimationLoop(()=>{orbit.update();if(!dirty)return;dirty=false;renderer.render(scene,camera);document.body.dataset.drawCalls=String(renderer.info.render.calls);document.body.dataset.triangles=String(renderer.info.render.triangles);});
document.body.dataset.ready='true';
window.addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);dirty=true;});
