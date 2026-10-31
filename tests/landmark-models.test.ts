import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/addons/libs/meshopt_decoder.module.js";
import { Box3, Vector3, Scene } from "three";
import { prepareLandmarkModels, placeLandmarks } from "../src/game/landmark-models.ts";
import { landmarkSites, landmarkApproaches } from "../src/game/landmark-layout.ts";
import { disposeAutoModel } from "../src/game/auto-model.ts";

async function readModels() {
  const file=await readFile(new URL('../public/models/mumbai-landmarks.glb',import.meta.url));
  const jsonLength=file.readUInt32LE(12);
  const json=JSON.parse(file.subarray(20,20+jsonLength).toString());
  // Node omits image decoding; all geometry, transforms and compression are real.
  json.materials=json.materials.map((m:{name:string})=>({name:m.name,pbrMetallicRoughness:{roughnessFactor:.8}}));
  delete json.images;delete json.textures;delete json.samplers;
  json.extensionsRequired=json.extensionsRequired.filter((e:string)=>e!=='EXT_texture_webp');
  json.extensionsUsed=json.extensionsUsed.filter((e:string)=>e!=='EXT_texture_webp');
  const text=Buffer.from(JSON.stringify(json));
  const padded=Buffer.alloc(Math.ceil(text.length/4)*4,32);text.copy(padded);
  const header=Buffer.from(file.subarray(0,20));
  header.writeUInt32LE(20+padded.length+file.length-20-jsonLength,8);
  header.writeUInt32LE(padded.length,12);
  const glb=Buffer.concat([header,padded,file.subarray(20+jsonLength)]);
  const {scene}=await new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).parseAsync(glb.buffer.slice(glb.byteOffset,glb.byteOffset+glb.byteLength),'');
  return {file,models:prepareLandmarkModels(scene)};
}

test("every shipped landmark has measured height, a reserved footprint and a matching far silhouette",async()=>{
  const {file,models}=await readModels();
  assert.equal(models.sites.length,landmarkSites.length);
  models.source.updateMatrixWorld(true);
  for(let i=0;i<landmarkSites.length;i++) {
    const site=landmarkSites[i],asset=models.sites[i];
    const near=new Box3().setFromObject(asset.near);
    const far=new Box3().setFromObject(asset.far);
    assert.ok(Math.abs(near.min.y)<.02,site.id+' is grounded');
    assert.ok(Math.abs(near.getSize(new Vector3()).y-site.height)<.10,site.id+' measured height');
    const local=near.clone().applyMatrix4(asset.root.matrixWorld.clone().invert());
    assert.ok(local.min.x>=-site.halfWidth-.05&&local.max.x<=site.halfWidth+.05,site.id+' full width in reservation');
    const frontage=landmarkApproaches.find(a=>a.id===site.id)?.end??site.halfLength;
    assert.ok(local.min.z>=-site.halfLength-.05&&local.max.z<=frontage+.05,site.id+' full depth in reservation');
    assert.ok(far.max.y>near.max.y*.90,site.id+' far silhouette retains roof height');
  }
  const manifest=JSON.parse(await readFile(new URL('../assets/architecture/mumbai/manifest.json',import.meta.url),'utf8'));
  assert.equal(file.length,manifest.bytes);
  assert.equal(createHash('sha256').update(file).digest('hex'),manifest.sha256);
  assert.ok(file.length<20*1048576,'bounded total landmark download for the expanded city');
  const scene=new Scene(),update=placeLandmarks(scene,models);
  const taj=models.sites.find(s=>s.root.name==='taj-palace')!;
  update(taj.x,taj.z);
  assert.equal(taj.near.visible,true);assert.equal(taj.far.visible,false);
  update(taj.x+450,taj.z);
  assert.equal(taj.near.visible,false);assert.equal(taj.far.visible,true);
  update(taj.x+2000,taj.z);
  assert.equal(taj.root.visible,false);
  disposeAutoModel(models.source);
});
