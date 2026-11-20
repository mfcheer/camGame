import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as T from 'three';
import {RescueAnimal,ANIMAL_MODELS} from '../src/rescueAnimal.js';
import {HappyPerformance} from '../src/happyPerformance.js';
import {GAME_CONFIG,PLAYABLE_ANIMALS,resolveAnimal} from '../src/config.js';
import {CAMP_ANIMALS,CampManager} from '../src/campManager.js';
import {getAnimalPlayStyle} from '../src/animalPlayStyles.js';
import {airplaneTaxi,airplaneBank,airplaneTakeoff,resetAirplaneMotion} from '../src/airplaneMotion.js';
const camera=new T.PerspectiveCamera(48,1194/834,.1,100);camera.position.z=7.5;
const make=()=>new RescueAnimal(new T.Scene(),camera,'airplane');
const step=(a,n)=>{for(let t=0;t<n;t+=1/60)a.update(1/60,t);};
assert.ok(PLAYABLE_ANIMALS.includes('airplane'));assert.equal(resolveAnimal('airplane',()=>.999),'airplane');
assert.ok(CAMP_ANIMALS.some(a=>a.id==='airplane'&&a.target===8));assert.equal(getAnimalPlayStyle('airplane').motion,'arc');
for(const p of ['public/models/cloud-airplane.glb','public/models/airplane-preview.png'])assert.ok(fs.statSync(p).size>1000);
const glb=fs.readFileSync('public/models/cloud-airplane.glb');const gltf=JSON.parse(glb.toString('utf8',20,20+glb.readUInt32LE(12)).trim());
for(const n of ['Cockpit','Wing_L','Wing_R','Tail_Fin','Brow_L','Pupil','Landing_Wheel'])assert.ok(gltf.nodes.some(o=>o.name===n),`GLB ${n}`);
const camp=new CampManager();camp.recordRescue('bunny');camp.recordRescue('airplane');assert.equal(camp.getRescues().bunny,1);assert.equal(camp.getRescues().airplane,1);
for(const reduced of [false,true]){
 const a=make();a.reducedMotion=reduced;
 for(const n of ['Head','Torso','Eyes','Eye_L','Eye_R','Arm_L','Arm_R','Leg_L','Leg_R','Ear_L','Ear_R','Tail','Bow','Happy_Mouth','Wing_L','Wing_R','Tail_Fin'])assert.ok(a.model.getObjectByName(n),n);
 for(let i=1;i<=3;i++){
  a.reset();assert.equal(a.model.getObjectByName('Wing_L').rotation.y,0);a.setEnergy(i);step(a,.35);
  for(const p of [a.leftArm,a.rightArm,a.leftLeg,a.rightLeg])assert.ok(p.rotation.toArray().slice(0,3).every(n=>Math.abs(n)<1e-6),'fixed wings/struts');
  const eye=a.model.getObjectByName('Eye_L');assert.equal(eye.visible,true,'cockpit eyes preserved');
 }
 a.reset();a.startFriendPlay();
 const poses=[];
 for(const fn of [airplaneTaxi,airplaneBank,airplaneTakeoff]){
  a.actionPoseFn=t=>fn(a,t,reduced?.25:1);a.actionPoseT=.38;step(a,.016);
  poses.push([a.model.position.y,a.model.rotation.x,a.model.rotation.z].map(n=>n.toFixed(3)).join(','));
  resetAirplaneMotion(a);assert.equal(a.tailGroup.rotation.y,0);assert.equal(a.model.rotation.x,0);
 }
 assert.equal(new Set(poses).size,3);
 a.actionPoseFn=null;
 const perf=new HappyPerformance(a.scene,camera,a,null);perf.start();assert.equal(perf.plan.length,3);assert.ok(perf.plan.every(p=>p.id.startsWith('airplane')));
 let loops=0;while(perf.active&&loops++<1200){perf.update(1/60);a.update(1/60,loops/60);}assert.equal(perf.active,false);
 assert.equal(a.model.rotation.x,0);assert.equal(a.model.position.y,0);
 a.startEscape();step(a,1.8);assert.equal(a.state,'ESCAPING');assert.ok(a.animalGroup.position.y>a.groundY);const elapsed=a.escapeElapsed;
 a.setPaused(true);step(a,1);assert.equal(a.escapeElapsed,elapsed);a.setPaused(false);
 let exits=0;a.onReachedExit=()=>exits++;step(a,3);assert.equal(a.state,'ESCAPED');assert.equal(exits,1);
 a.reset();assert.equal(a.tailGroup.rotation.y,0);assert.equal(a.model.rotation.x,0);assert.equal(a.model.position.y,0);assert.equal(a.state,'TRAPPED');
}
for(const [width,height] of [[1194,834],[834,1194]]){
 camera.aspect=width/height;camera.updateProjectionMatrix();camera.updateMatrixWorld();
 const a=make();a.updateLayout(width,height,camera);
 for(const farewell of [false,true]){
  if(farewell){a.startFriendPlay();a.startEscape();step(a,3.6);}
  a.group.updateMatrixWorld(true);
  // Project actual vertices; mixing an AABB's nearest depth and widest wing
  // invents corners outside the airplane and gives false clipping failures.
  a.model.traverse(mesh=>{if(!mesh.isMesh)return;const position=mesh.geometry.attributes.position;
   for(let i=0;i<position.count;i++){
    const point=new T.Vector3().fromBufferAttribute(position,i).applyMatrix4(mesh.matrixWorld).project(camera);
    const px=(point.x+1)*width/2,py=(1-point.y)*height/2;
    assert.ok(px>=8&&px<=width-8,`${width}: airplane wing margin ${px}`);
    assert.ok(py>=84&&py<=height-8,`${height}: airplane vertical bound ${py}`);
   }
  });
 }
}
assert.notEqual(ANIMAL_MODELS.jett,ANIMAL_MODELS.airplane);assert.equal(GAME_CONFIG.animals.airplane.targetBubbles,8);
console.log('Airplane: integration, assets, fixed wings, cockpit, three reactions/actions, reduced motion, pause, reset and single farewell passed');
