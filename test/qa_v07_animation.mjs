import assert from 'node:assert/strict';
import * as T from 'three';
import fs from 'node:fs';
import {RescueAnimal} from '../src/rescueAnimal.js';
import {BubbleManager} from '../src/bubbleManager.js';
import {Game} from '../src/main.js';
const results=[];
function check(name,fn){fn();results.push(name);}
function fixture(){const scene=new T.Scene(),camera=new T.PerspectiveCamera(48,16/9,.1,100);camera.position.z=7.5;camera.updateMatrixWorld();return {scene,camera,animal:new RescueAnimal(scene,camera)};}
check('Shipped GLB is a real binary glTF with the named animation rig',()=>{
  const b=fs.readFileSync(new URL('../public/models/forest-bunny.glb',import.meta.url));assert.equal(b.toString('ascii',0,4),'glTF');
  const json=JSON.parse(b.toString('utf8',20,20+b.readUInt32LE(12)).trim());
  for(const name of ['Head','Ear_L','Ear_R','Leg_L','Leg_R','Bow'])assert.ok(json.nodes.some(n=>n.name===name));
});
check('Target follows actual bow through scaling and hops',()=>{
  const {animal}=fixture();animal.setEnergy(2);animal.update(.3,.3);
  assert.ok(animal.getTargetPosition().distanceTo(animal.bowtieGroup.getWorldPosition(new T.Vector3()))<1e-7);
  assert.ok(animal.currentY>animal.groundY);
});
check('Pause freezes actor, falling ropes and dust; reset restores visible materials',()=>{
  const {animal}=fixture();animal.setEnergy(1);animal.update(.08,.08);animal.setPaused(true);
  const y=animal.currentY,rope=animal.ropeCoils[0].fallTimer;animal.update(4,4);
  assert.equal(animal.currentY,y);assert.equal(animal.ropeCoils[0].fallTimer,rope);
  animal.setPaused(false);animal.startEscape();animal.update(4.2,4.2);assert.equal(animal.state,'ESCAPED');
  animal.reset();assert.equal(animal.animalGroup.visible,true);assert.equal(animal.ropeCoils.every(c=>c.group.visible),true);
  assert.equal([...animal.furMaterials].every(m=>m.opacity===1),true);
});
check('Rabbit plants its feet, reaches visible gate, waves once then fades',()=>{
  const {animal}=fixture();let reached=0;animal.onReachedExit=()=>reached++;animal.startEscape();
  for(let i=0;i<42;i++)animal.update(1/60,i/60);
  const x=animal.currentX;animal.update(.02,1);assert.equal(animal.currentX,x,'no sliding in first contact phase');
  while(animal.escapeElapsed<3.3)animal.update(1/60,0);
  assert.equal(animal.state,'WAVING');assert.equal(animal.currentX,animal.endX);assert.equal(reached,1);assert.equal(animal.animalGroup.visible,true);
  for(let i=0;i<60;i++)animal.update(1/60,0);assert.equal(animal.state,'ESCAPED');assert.equal(reached,1);
});
check('Resizing mid-hop preserves path progress and puts the gate inside the viewport',()=>{
  const {animal,camera}=fixture();animal.startEscape();for(let i=0;i<100;i++)animal.update(1/60,0);
  const progress=(animal.currentX-animal.startX)/(animal.endX-animal.startX);
  camera.aspect=844/390;camera.updateProjectionMatrix();animal.updateLayout(844,390,camera);
  assert.ok(Math.abs((animal.currentX-animal.startX)/(animal.endX-animal.startX)-progress)<1e-6);
  assert.ok(Math.abs(new T.Vector3(animal.endX,animal.groundY,0).project(camera).x)<1);
});
check('Energy delivery is exactly once and gets cancelled by clear',()=>{
  const {scene,camera,animal}=fixture();const bm=new BubbleManager(scene,camera,{playPop(){}},null,animal);let delivered=0;
  bm.spawnEnergyProjectile(new T.Vector3(),0xffaa00);bm.energyProjectiles[0].onArrive=()=>delivered++;
  for(let i=0;i<20;i++)bm.update(.016,i*.016);assert.equal(delivered,0);
  for(let i=0;i<15;i++)bm.update(.016,i*.016);assert.equal(delivered,1);
  bm.spawnEnergyProjectile(new T.Vector3(),0xffaa00);bm.energyProjectiles[0].onArrive=()=>delivered++;
  bm.clear();for(let i=0;i<40;i++)bm.update(.016,i*.016);assert.equal(delivered,1);
});
check('Burst particles expire by active seconds at 30 and 60 fps',()=>{
  for(const fps of [30,60]){const {scene,camera}=fixture();const bm=new BubbleManager(scene,camera,{playPop(){}},null);bm.spawnBurstParticles(new T.Vector3(),0xffaa00);for(let i=0;i<fps;i++)bm.update(1/fps,i/fps);assert.equal(bm.particles.length,0);}
});
check('Slow-render victory waits for goodbye; pause preserves that wait',()=>{
  let shown=0;
  const game=Object.assign(Object.create(Game.prototype),{state:'CELEBRATING',rescueAnimal:{state:'WAVING'},uiManager:{showVictory(){shown++;}}});
  game.showVictoryWhenReady();assert.equal(shown,0);assert.equal(game.waitingForEscape,true);
  game.state='PAUSED';game.rescueAnimal.state='ESCAPED';game.showVictoryWhenReady();assert.equal(shown,0);
  game.state='CELEBRATING';game.showVictoryWhenReady();assert.equal(shown,1);assert.equal(game.waitingForEscape,false);
});
console.log(JSON.stringify({passed:results.length,results},null,2));
