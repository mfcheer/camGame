import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as T from 'three';
import {RescueAnimal} from '../src/rescueAnimal.js';
import {HappyPerformance} from '../src/happyPerformance.js';
import {PLAYABLE_ANIMALS,resolveAnimal} from '../src/config.js';
import {CAMP_ANIMALS} from '../src/campManager.js';
import {modelxWings,modelxDance,modelxDeparture,resetModelX} from '../src/modelxMotion.js';
const camera=new T.PerspectiveCamera(48,1194/834,.1,100);camera.position.z=7.5;
const make=()=>new RescueAnimal(new T.Scene(),camera,'modelx');
const step=(a,s)=>{for(let i=0;i<s*60;i++)a.update(1/60,i/60);};
assert.equal(resolveAnimal('random',()=>.999),'modelx');assert.ok(PLAYABLE_ANIMALS.includes('modelx'));assert.ok(CAMP_ANIMALS.some(a=>a.id==='modelx'&&a.target===8));
for(const file of ['pearl-modelx.glb','modelx-preview.png'])assert.ok(fs.statSync('public/models/'+file).size>1000);
const b=fs.readFileSync('public/models/pearl-modelx.glb'),gltf=JSON.parse(b.toString('utf8',20,20+b.readUInt32LE(12)).trim());
for(const name of ['Falcon_L','Falcon_R','Panoramic_Roof','Windshield','Brow_L','Head','Happy_Mouth','Tire'])assert.ok(gltf.nodes.some(n=>n.name===name),name);
for(const reduced of [false,true]){
 const a=make();a.reducedMotion=reduced;
 for(let energy=1;energy<=3;energy++){
  a.reset();a.setEnergy(energy);step(a,.35);
  assert.equal(a.headGroup.rotation.x,0,'face attached');assert.equal(a.headGroup.rotation.z,0);
  assert.equal(a.leftArm.rotation.z,0,'wheels never wave');assert.equal(a.rightArm.rotation.z,0);
  assert.equal(a.model.getObjectByName('Eye_L').visible,true);
  const eye=a.model.getObjectByName('Eye_L'),pos=new T.Vector3();a.group.updateMatrixWorld(true);eye.getWorldPosition(pos);a.eyesGroup.scale.y=.08;a.group.updateMatrixWorld(true);assert.ok(pos.distanceTo(eye.getWorldPosition(new T.Vector3()))<.006,'blink keeps eye centers on windshield');a.eyesGroup.scale.y=1;
  const door=a.model.getObjectByName('Falcon_L');if(energy===1)assert.ok(door.rotation.z<-.1);
  const pose=door.rotation.z;a.setPaused(true);step(a,1);assert.equal(door.rotation.z,pose);a.setPaused(false);step(a,1);assert.ok(Math.abs(door.rotation.z)<1e-6);
 }
 a.reset();a.startFriendPlay();const poses=[];
 for(const fn of [modelxWings,modelxDance,modelxDeparture]){
  a.actionPoseFn=t=>fn(a,t,reduced?.25:1);a.actionPoseT=.38;step(a,.02);
  poses.push([a.model.getObjectByName('Falcon_L').rotation.z,a.model.getObjectByName('Falcon_R').rotation.z,a.model.rotation.z,a.model.rotation.x].join(','));
  assert.equal(a.leftArm.rotation.z,0);resetModelX(a);
 }
 assert.equal(new Set(poses).size,3);a.actionPoseFn=null;
 const perf=new HappyPerformance(a.scene,camera,a,null);perf.start();assert.equal(perf.plan.length,3);assert.ok(perf.plan.every(p=>p.id.startsWith('modelx')));
 for(let i=0;i<1200&&perf.active;i++){perf.update(1/60);a.update(1/60,i/60);}assert.equal(perf.active,false);assert.equal(a.model.getObjectByName('Falcon_L').rotation.z,0);
 a.startEscape();let count=0;a.onReachedExit=()=>count++;step(a,3.6);assert.equal(a.state,'WAVING');assert.ok(a.model.getObjectByName('Falcon_L').rotation.z<0);assert.equal(a.headGroup.rotation.x,0);step(a,1);assert.equal(a.state,'ESCAPED');assert.equal(count,1);a.reset();assert.equal(a.model.getObjectByName('Falcon_L').rotation.z,0);
}
for(const [w,h] of [[1194,834],[834,1194]]){
 camera.aspect=w/h;camera.updateProjectionMatrix();camera.updateMatrixWorld();const a=make();a.updateLayout(w,h,camera);
 for(const farewell of [false,true]){
  if(farewell){a.startFriendPlay();a.startEscape();step(a,3.58);}a.group.updateMatrixWorld(true);
  a.model.traverse(mesh=>{if(!mesh.isMesh)return;const ps=mesh.geometry.attributes.position;for(let i=0;i<ps.count;i++){
   const p=new T.Vector3().fromBufferAttribute(ps,i).applyMatrix4(mesh.matrixWorld).project(camera),x=(p.x+1)*w/2,y=(1-p.y)*h/2;
   assert.ok(x>=8&&x<=w-8,`${w}: x ${x}`);assert.ok(y>=84&&y<=h-8,`${h}: y ${y}`);
  }});
 }
}
console.log('Model X: assets, falcon wings, attached face, grounded wheels, unique performances, pause/reduced/reset, farewell and tablet bounds passed');
