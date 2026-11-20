import assert from 'node:assert/strict';
import * as T from 'three';
import {RescueAnimal,ANIMAL_MODELS} from '../src/rescueAnimal.js';
import {ENERGY_REACTIONS} from '../src/energyReactions.js';
const camera=new T.PerspectiveCamera(48,1194/834,.1,100);camera.position.z=7.5;
function pose(a){return [a.model.position.y,...a.model.rotation.toArray().slice(0,3),...a.headGroup.rotation.toArray().slice(0,3),a.leftArm.rotation.x,a.rightArm.rotation.x,a.leftArm.rotation.z,a.rightArm.rotation.z,a.leftEarGroup.rotation.z,a.rightEarGroup.rotation.z,a.tailGroup.rotation.y,...['Boom_Base','Boom_Elbow','Bucket'].map(n=>a.model.getObjectByName(n)?.rotation.z||0)];}
for(const id of Object.keys(ANIMAL_MODELS)){
 assert.equal(new Set(ENERGY_REACTIONS[id]).size,3,id);
 for(const reduced of [false,true]){
  const signatures=[];
  for(let score=1;score<=3;score++){
   const a=new RescueAnimal(new T.Scene(),camera,id);a.reducedMotion=reduced;a.setEnergy(score);
   const variant=a.reactionVariant;a.reactToCombo(3);assert.equal(a.reactionVariant,variant,'combo must preserve reply');
   for(let i=0;i<21;i++)a.update(1/60,i/60);
   assert.equal(a.energyReaction,ENERGY_REACTIONS[id][score-1]);
   const signature=pose(a);assert.ok(signature.every(Number.isFinite));signatures.push(signature.map(v=>v.toFixed(3)).join(','));
   const timer=a.hopTimer;a.setPaused(true);a.update(2,3);assert.equal(a.hopTimer,timer);assert.deepEqual(pose(a),signature);
   a.setPaused(false);for(let i=0;i<100;i++)a.update(1/60,1+i/60);
   assert.equal(a.hopTimer,0);assert.ok(Math.abs(a.model.rotation.x)<.001);assert.ok(Math.abs(a.model.rotation.z)<.001);
   a.reset();assert.equal(a.energyLevel,0);assert.equal(a.energyReaction,'');
   a.startFriendPlay();a.startEscape();for(let i=0;i<280;i++)a.update(1/60,i/60);assert.equal(a.state,'ESCAPED');
  }
  assert.equal(new Set(signatures).size,3,`${id}: three visibly distinct poses (reduced=${reduced})`);
 }
}
console.log(`${Object.keys(ANIMAL_MODELS).length} characters: three replies, combo preservation, pause/resume, reduced motion, reset and farewell passed`);
