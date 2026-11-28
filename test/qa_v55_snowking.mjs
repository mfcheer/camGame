import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as T from 'three';
import {RescueAnimal} from '../src/rescueAnimal.js';
import {HappyPerformance} from '../src/happyPerformance.js';
import {PLAYABLE_ANIMALS,resolveAnimal} from '../src/config.js';
import {CAMP_ANIMALS} from '../src/campManager.js';
import {snowkingWaltz,snowkingTorch,snowkingCoronation,resetSnowKing,SNOWKING_BASE_ROT_Y} from '../src/snowkingMotion.js';

const camera=new T.PerspectiveCamera(48,1194/834,.1,100);camera.position.z=7.5;
const make=()=>new RescueAnimal(new T.Scene(),camera,'snowking');
const step=(a,s)=>{for(let i=0;i<s*60;i++)a.update(1/60,i/60);};

assert.equal(resolveAnimal('random',()=>.999),'snowking');
assert.ok(PLAYABLE_ANIMALS.includes('snowking'));
assert.ok(CAMP_ANIMALS.some(a=>a.id==='snowking'&&a.target===8));
assert.equal(SNOWKING_BASE_ROT_Y, 0.52, '3/4 perspective isometric base rotation');

for(const file of ['snowking.glb','snowking-preview.png'])assert.ok(fs.statSync('public/models/'+file).size>1000);
const b=fs.readFileSync('public/models/snowking.glb'),gltf=JSON.parse(b.toString('utf8',20,20+b.readUInt32LE(12)).trim());
for(const name of ['Torso','Head','Cape','Cape_Body','Cape_Collar','Crown','Crown_Jewels','Scepter','Cone_Mesh','IceCream_Mesh','Brow_L','Eye_L','Happy_Mouth']) {
  assert.ok(gltf.nodes.some(n=>n.name===name),`GLB node missing: ${name}`);
}
const exportedCape = gltf.nodes.find(n => n.name === 'Cape_Body');
assert.deepEqual(gltf.meshes[exportedCape.mesh].extras.targetNames, ['lift', 'sway']);

{
  const a0 = make();
  a0.reset();
  const scepterPos = new T.Vector3(), headPos = new T.Vector3();
  a0.model.getObjectByName('Scepter').getWorldPosition(scepterPos);
  a0.model.getObjectByName('Head').getWorldPosition(headPos);
  scepterPos.project(camera); headPos.project(camera);
  const separation = Math.abs(scepterPos.x - headPos.x);
  assert.ok(separation > 0.04, 'scepter is kept clear of face center in perspective view');

  const ropeBottom = a0.ropeCoils[0].baseY;
  const ropeTop = a0.ropeCoils[a0.ropeCoils.length - 1].baseY;
  assert.ok(ropeBottom >= 0.15 && ropeTop <= 0.35, 'rope coils securely hug the belly snowball without choking neck');
}

for(const reduced of [false,true]){
 const a=make();a.reducedMotion=reduced;
 for(let energy=1;energy<=3;energy++){
  a.reset();a.setEnergy(energy);step(a,.35);
  assert.ok(a.model.getObjectByName('Eye_L').visible || a.expressionRig?.smileEyes?.[0]?.smile?.visible, 'eye or smile visible');
  const crown=a.model.getObjectByName('Crown');
  if(energy===1)assert.ok(crown.rotation.z!==0||a.rightArm.rotation.x<0, 'check energy 1');
  const fabric=a.model.getObjectByName('Cape_Body');
  if(energy===2){
    const moving=fabric.morphTargetInfluences.slice();
    const points=fabric.geometry.attributes.position;
    const pin=new T.Vector3().fromBufferAttribute(points,0);
    const hem=new T.Vector3().fromBufferAttribute(points,points.count-1);
    assert.ok(fabric.getVertexPosition(points.count-1,new T.Vector3()).distanceTo(hem)>.005,'cape hem visibly moves');
    assert.deepEqual(fabric.getVertexPosition(0,new T.Vector3()),pin,'cape remains attached at the shoulder');
    a.setPaused(true);step(a,.25);assert.deepEqual(fabric.morphTargetInfluences,moving);
    a.setPaused(false);
  }
  if(energy===3)assert.ok(a.rightArm.rotation.x<0, 'check energy 3');
  const poseArm=a.rightArm.rotation.x;
  a.setPaused(true);step(a,1);assert.equal(a.rightArm.rotation.x,poseArm);
  a.setPaused(false);step(a,1);assert.ok(Math.abs(a.rightArm.rotation.x)<0.05);
  assert.ok(fabric.morphTargetInfluences.every(weight=>Math.abs(weight)<1e-6),'cape returns to its rest shape after a reaction');
 }
 a.reset();a.startFriendPlay();const poses=[];
 for(const fn of [snowkingWaltz,snowkingTorch,snowkingCoronation]){
  a.actionPoseFn=t=>fn(a,t,reduced?.25:1);a.actionPoseT=.38;step(a,.02);
  poses.push([
    a.rightArm.rotation.x.toFixed(3),
    a.rightArm.rotation.z.toFixed(3),
    a.model.rotation.z.toFixed(3),
    a.headGroup.rotation.x.toFixed(3)
  ].join(','));
  resetSnowKing(a);
 }
 assert.equal(new Set(poses).size,3,'each performance has distinct poses');a.actionPoseFn=null;
 const perf=new HappyPerformance(a.scene,camera,a,null);perf.start();
 assert.equal(perf.plan.length,3);assert.ok(perf.plan.every(p=>p.id.startsWith('snowking')));
 for(let i=0;i<1200&&perf.active;i++){perf.update(1/60);a.update(1/60,i/60);}
 assert.equal(perf.active,false);assert.equal(a.rightArm.rotation.x,0);

 a.startEscape();let count=0;a.onReachedExit=()=>count++;step(a,3.6);
 assert.equal(a.state,'WAVING');
 assert.ok(Math.abs(a.rightArm.rotation.x) > 0.02);
 step(a,1);assert.equal(a.state,'ESCAPED');assert.equal(count,1);
 a.reset();assert.equal(a.rightArm.rotation.x,0);
}

for(const [w,h] of [[1194,834],[834,1194]]){
 camera.aspect=w/h;camera.updateProjectionMatrix();camera.updateMatrixWorld();const a=make();a.updateLayout(w,h,camera);
 for(const farewell of [false,true]){
  if(farewell){a.startFriendPlay();a.startEscape();step(a,3.58);}
  a.group.updateMatrixWorld(true);
  a.model.traverse(mesh=>{
   if(!mesh.isMesh)return;
   const ps=mesh.geometry.attributes.position;
   for(let i=0;i<ps.count;i++){
    const p=new T.Vector3().fromBufferAttribute(ps,i).applyMatrix4(mesh.matrixWorld).project(camera),x=(p.x+1)*w/2,y=(1-p.y)*h/2;
    assert.ok(x>=8&&x<=w-8,`${w}: x ${x}`);
    assert.ok(y>=84&&y<=h-8,`${h}: y ${y}`);
   }
  });
 }
}
console.log('Snowking: assets, non-choking belly ropes, clear scepter clearance, distinct performances, pause/reduced/reset, farewell and tablet bounds passed');
