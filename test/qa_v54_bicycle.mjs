import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as T from 'three';
import {RescueAnimal} from '../src/rescueAnimal.js';
import {HappyPerformance} from '../src/happyPerformance.js';
import {PLAYABLE_ANIMALS,resolveAnimal} from '../src/config.js';
import {CAMP_ANIMALS} from '../src/campManager.js';
import {bicycleCircle,bicycleDance,bicycleDeparture,resetBicycle,setBicycleFork,BICYCLE_BASE_ROT_Y} from '../src/bicycleMotion.js';

const camera=new T.PerspectiveCamera(48,1194/834,.1,100);camera.position.z=7.5;
const make=()=>new RescueAnimal(new T.Scene(),camera,'bicycle');
const step=(a,s)=>{for(let i=0;i<s*60;i++)a.update(1/60,i/60);};

assert.equal(resolveAnimal('bicycle'),'bicycle');
assert.ok(PLAYABLE_ANIMALS.includes('bicycle'));
assert.ok(CAMP_ANIMALS.some(a=>a.id==='bicycle'&&a.target===8));
assert.equal(BICYCLE_BASE_ROT_Y, 1.25, '3/4 perspective isometric base rotation');

for(const file of ['mint-bicycle.glb','bicycle-preview.png'])assert.ok(fs.statSync('public/models/'+file).size>1000);
const b=fs.readFileSync('public/models/mint-bicycle.glb'),gltf=JSON.parse(b.toString('utf8',20,20+b.readUInt32LE(12)).trim());
for(const name of ['Front_Fork','Bell','Front_Wheel','Rear_Wheel','Basket_Mesh','Saddle','Brow_L','Head','Happy_Mouth']) {
  assert.ok(gltf.nodes.some(n=>n.name===name),`GLB node missing: ${name}`);
}

// The export includes hidden meshes. Test the shipped wheel geometry itself,
// since a hidden cylinder in the source used to become a solid disc in game.
for (const name of ['Front_Wheel', 'Rear_Wheel']) {
  const {mesh} = gltf.nodes.find(node => node.name === name);
  const accessor = gltf.accessors[gltf.meshes[mesh].primitives[0].attributes.POSITION];
  const view = gltf.bufferViews[accessor.bufferView];
  const offset = 28 + b.readUInt32LE(12) + (view.byteOffset ?? 0) + (accessor.byteOffset ?? 0);
  for (let i = 0; i < accessor.count; i++) {
    const at = offset + i * (view.byteStride ?? 12);
    const radius = Math.hypot(b.readFloatLE(at), b.readFloatLE(at + 4));
    assert.ok(radius > .18 && radius < .25, `${name} must be a hollow tire in the GLB`);
  }
}

{
  const a0 = make();
  a0.reset();
  const fwPos = new T.Vector3(), rwPos = new T.Vector3();
  a0.model.getObjectByName('Front_Wheel').getWorldPosition(fwPos);
  a0.model.getObjectByName('Rear_Wheel').getWorldPosition(rwPos);
  fwPos.project(camera); rwPos.project(camera);
  const wheelSep = Math.abs(fwPos.x - rwPos.x);
  assert.ok(wheelSep > 0.08, 'double wheels are clearly separated in perspective projection');

  const basket = a0.model.getObjectByName('Basket_Mesh');
  const basketPos = new T.Vector3(), fwWorld = new T.Vector3();
  basket.getWorldPosition(basketPos);
  a0.model.getObjectByName('Front_Wheel').getWorldPosition(fwWorld);
  assert.ok(basketPos.y > fwWorld.y, 'basket is elevated above front wheel axle');
  assert.ok(basketPos.z >= fwWorld.z, 'basket face extends forward clear of steering fork');
  setBicycleFork(a0, .2);
  const turnedAxle = a0.model.getObjectByName('Front_Wheel').getWorldPosition(new T.Vector3());
  assert.ok(turnedAxle.distanceTo(fwWorld) > .02, 'front wheel steers with the fork');
}

for(const reduced of [false,true]){
 const a=make();a.reducedMotion=reduced;
 for(let energy=1;energy<=3;energy++){
  a.reset();a.setEnergy(energy);step(a,.35);
  assert.equal(a.leftArm.rotation.z,0,'wheels never wave');
  assert.equal(a.rightArm.rotation.z,0);
  assert.equal(a.model.getObjectByName('Eye_L').visible,true);
  const eye=a.model.getObjectByName('Eye_L'),pos=new T.Vector3();
  a.group.updateMatrixWorld(true);eye.getWorldPosition(pos);
  a.eyesGroup.scale.y=.08;a.group.updateMatrixWorld(true);
  assert.ok(pos.distanceTo(eye.getWorldPosition(new T.Vector3()))<.006,'blink keeps eye centers on basket');
  a.eyesGroup.scale.y=1;
  const fork=a.model.getObjectByName('Front_Fork');
  const bell=a.model.getObjectByName('Bell');
  if(energy===3)assert.ok(fork.rotation.y>0||bell.rotation.z!==0);
  const poseFork=fork.rotation.y;
  a.setPaused(true);step(a,1);assert.equal(fork.rotation.y,poseFork);
  a.setPaused(false);step(a,1);assert.ok(Math.abs(fork.rotation.y)<1e-6);
 }
 a.reset();a.startFriendPlay();const poses=[];
 for(const fn of [bicycleCircle,bicycleDance,bicycleDeparture]){
  a.actionPoseFn=t=>fn(a,t,reduced?.25:1);a.actionPoseT=.38;step(a,.02);
  poses.push([
    a.model.getObjectByName('Front_Fork').rotation.y,
    a.model.getObjectByName('Bell').rotation.z,
    a.model.rotation.z,
    a.model.rotation.x
  ].join(','));
  assert.equal(a.leftArm.rotation.z,0);resetBicycle(a);
 }
 assert.equal(new Set(poses).size,3);a.actionPoseFn=null;
 const perf=new HappyPerformance(a.scene,camera,a,null);perf.start();
 assert.equal(perf.plan.length,3);assert.ok(perf.plan.every(p=>p.id.startsWith('bicycle')));
 for(let i=0;i<1200&&perf.active;i++){perf.update(1/60);a.update(1/60,i/60);}
 assert.equal(perf.active,false);assert.equal(a.model.getObjectByName('Front_Fork').rotation.y,0);

 a.startEscape();let count=0;a.onReachedExit=()=>count++;step(a,3.6);
 assert.equal(a.state,'WAVING');
 assert.ok(a.model.getObjectByName('Front_Fork').rotation.y>0);
 assert.equal(a.leftArm.rotation.z,0);
 step(a,1);assert.equal(a.state,'ESCAPED');assert.equal(count,1);
 a.reset();assert.equal(a.model.getObjectByName('Front_Fork').rotation.y,0);
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
console.log('Bicycle: assets, steering fork, attached basket face, grounded wheels, unique performances, pause/reduced/reset, farewell and tablet bounds passed');
