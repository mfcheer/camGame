import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import * as THREE from 'three';
import {ANIMAL_MODELS,RescueAnimal} from '../src/rescueAnimal.js';import {HappyPerformance} from '../src/happyPerformance.js';import {GAME_CONFIG} from '../src/config.js';
const features={wolf:['Wolf_Long_Muzzle','Tall_Wolf_Ear','Bushy_Wolf_Tail','Tail_White_Tip','Patched_Hat','Hat_Patch','Face_Stitch','Yellow_Scarf','Belly_Cross','Right_Ear_Notch'],chase:['Police_Cap','Cap_Badge','Blue_Rescue_Vest','Rescue_Backpack','Chase_Lower_Jaw'],jett:['Helmet_Brow','Jet_Engine','Airplane_Wing','Tail_Fin'],peppa:['Pink_Pig_Head','Pig_Snout','Red_Dress','Curly_Pig_Tail'],thomas:['Blue_Boiler','Boiler_Stripe','Smokebox_Ring','Train_Funnel','Wheel_Spoke','Brow_L','Side_Tank','Round_Buffer'],tayo:['Blue_Bus_Body','White_Bus_Roof','Bus_Windshield','Route_Badge_120'],triceratops:['Dino_Plump_Body','Neck_Frill','Horn_Brow_L','Horn_Brow_R','Horn_Nose'],krashy:['Krashy_Ball_Body','Krashy_Belly_Spot','Ear_L','Ear_R','Krashy_Tail_Pom']};
const camera=()=>{const c=new THREE.PerspectiveCamera(48,1194/834,.1,100);c.position.z=7.5;c.updateMatrixWorld();return c;};
test('each rebuilt model and shipped GLB contain the right distinctive details',()=>{for(const [id,names] of Object.entries(features)){const model=ANIMAL_MODELS[id]();const data=fs.readFileSync(`public/models/${GAME_CONFIG.animals[id].asset}.glb`);const gltf=JSON.parse(data.toString('utf8',20,20+data.readUInt32LE(12)).trim());for(const name of names){assert.ok(model.getObjectByName(name),`${id} native: ${name}`);assert.ok(gltf.nodes.some(n=>n.name===name),`${id} glb: ${name}`);}assert.ok(model.getObjectByName('Head'));assert.ok(model.getObjectByName('Eye_L'));assert.ok(model.getObjectByName('Tail'));}});
test('each updated character reacts, resets and completes its signature performance',()=>{for(const id of Object.keys(features)){const scene=new THREE.Scene(),c=camera(),a=new RescueAnimal(scene,c,id);a.setEnergy(2);for(let n=0;n<30;n++)a.update(1/60,n/60);assert.equal(a.happyMouth.visible,true,id);a.reset();assert.equal(a.happyMouth.visible,false,id);const show=new HappyPerformance(scene,c,a,{playAnimalSound(){}});show.start();assert.ok(show.plan.some(x=>x.animals?.includes(id)),id);for(let n=0;n<600&&show.active;n++){a.update(1/60,n/60);show.update(1/60);}assert.equal(show.active,false,id);show.clear();}});

test('Thomas keeps his face anchored through whistle, celebration and rightward drive',()=>{
 const scene=new THREE.Scene(),cam=camera(),a=new RescueAnimal(scene,cam,'thomas');
 assert.equal(a.headGroup.parent,a.bodyMesh);
 const rest=a.headRestPosition.clone(),originalRandom=Math.random;
 let show;
 try{Math.random=()=>.999;show=new HappyPerformance(scene,cam,a,{playAnimalSound(){}});show.start();}
 finally{Math.random=originalRandom;}
 assert.equal(show.plan[0].id,'trainWhistle');
 for(let n=0;n<600&&show.active;n++){
  a.update(1/60,n/60);show.update(1/60);
  assert.ok(Math.abs(a.headGroup.position.y-rest.y)<.023,`face dropped during ${show.currentAction()}`);
 }
 assert.equal(show.active,false);show.clear();
 a.startEscape();
 let drove=false;
 for(let n=0;n<270&&a.state!=='ESCAPED';n++){
  a.update(1/60,n/60);
  if(a.state==='ESCAPING')drove=true;
  assert.ok(a.headGroup.position.distanceTo(rest)<.002,`face detached during ${a.state}`);
 }
 assert.equal(drove,true);
 assert.equal(a.state,'ESCAPED');
});
