import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as THREE from 'three';
import {GAME_CONFIG,PLAYABLE_ANIMALS,resolveAnimal} from '../src/config.js';
import {CAMP_ANIMALS,CampManager} from '../src/campManager.js';
import {RescueAnimal} from '../src/rescueAnimal.js';
import {HappyPerformance} from '../src/happyPerformance.js';
import {getAnimalPlayStyle} from '../src/animalPlayStyles.js';
const ids=['mcqueen','wolf','teddy'];
const camera=()=>{const c=new THREE.PerspectiveCamera(48,1194/834,.1,100);c.position.z=7.5;c.updateMatrixWorld();return c;};
test('three friends have assets, configuration, random selection and camp records',()=>{
 const camp=new CampManager();
 for(const id of ids){const profile=GAME_CONFIG.animals[id];assert.ok(PLAYABLE_ANIMALS.includes(id));assert.equal(resolveAnimal(id),id);assert.ok(CAMP_ANIMALS.some(a=>a.id===id));assert.equal(camp.recordRescue(id),1);assert.ok(camp.isUnlocked(id));assert.ok(getAnimalPlayStyle(id).name);for(const file of [`public/models/${id}-preview.png`,`public/models/${profile.asset}.glb`])assert.ok(fs.statSync(file).size>1000,file);}
 assert.equal(camp.getUnlockedCount(),3);
 const car=fs.readFileSync('public/models/lightning-mcqueen.glb');const gltf=JSON.parse(car.toString('utf8',20,20+car.readUInt32LE(12)).trim());
 for(const name of ['Red_Racing_Body','Windshield','Front_Wheel','Lightning_Bolt'])assert.ok(gltf.nodes.some(n=>n.name===name),`${name} missing from the car GLB`);
 assert.ok(!PLAYABLE_ANIMALS.includes('vampire'));assert.ok(!CAMP_ANIMALS.some(a=>a.id==='vampire'));
});
test('new character rigs react, pause, reset and run distinct signature performances',()=>{
 for(const id of ids){const scene=new THREE.Scene(),cam=camera(),a=new RescueAnimal(scene,cam,id);a.setEnergy(2);for(let i=0;i<30;i++)a.update(1/60,i/60);assert.equal(a.happyMouth.visible,true,id);a.setPaused(true);const t=a.idleTime;a.update(1,2);assert.equal(a.idleTime,t);a.setPaused(false);a.reset();assert.equal(a.happyMouth.visible,false);const p=new HappyPerformance(scene,cam,a,{playAnimalSound(){}});p.start();assert.ok(p.plan.every(Boolean),id);assert.ok(p.plan.some(x=>x.animals?.includes(id)),id);for(let i=0;i<600&&p.active;i++){a.update(1/60,i/60);p.update(1/60);}assert.equal(p.active,false,id);p.clear();}
});
