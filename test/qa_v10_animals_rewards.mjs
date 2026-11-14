import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as T from 'three';
import {RescueAnimal,ANIMAL_MODELS} from '../src/rescueAnimal.js';
import {GAME_CONFIG,PLAYABLE_ANIMALS,resolveAnimal} from '../src/config.js';
import {SceneManager} from '../src/sceneManager.js';
import {Game} from '../src/main.js';
import {createAccessory,CelebrationAccessories} from '../src/celebrationAccessories.js';
const results=[];function check(name,fn){fn();results.push(name);}
const camera=()=>{const c=new T.PerspectiveCamera(48,16/9,.1,100);c.position.z=7.5;c.updateMatrixWorld();return c;};
check('All selections and random intervals resolve to playable animals',()=>{
 assert.deepEqual(PLAYABLE_ANIMALS,['bunny','cat','frog','dog','dragon','goldenDragon','mcqueen','wolf','teddy','chase','jett','peppa','thomas']);assert.deepEqual(PLAYABLE_ANIMALS.map((_,i)=>resolveAnimal('random',()=>(i+.5)/PLAYABLE_ANIMALS.length)),PLAYABLE_ANIMALS);
 for(const id of PLAYABLE_ANIMALS)assert.equal(resolveAnimal(id),id);
});
check('Frog and dog assets are real GLBs with complete compatible animation pivots',()=>{
 for(const id of ['frog','dog','dragon']){
  const profile=GAME_CONFIG.animals[id],b=fs.readFileSync(new URL(`../public/models/${profile.asset}.glb`,import.meta.url));assert.equal(b.toString('ascii',0,4),'glTF');
  const json=JSON.parse(b.toString('utf8',20,20+b.readUInt32LE(12)).trim());
  for(const name of ['Head','Eyes','Eye_L','Eye_R','Arm_L','Arm_R','Leg_L','Leg_R','Bow','Tail'])assert.ok(json.nodes.some(n=>n.name===name),`${id} missing ${name}`);
  const model=ANIMAL_MODELS[id]();const box=new T.Box3().setFromObject(model);assert.ok(box.max.y>.8&&box.min.y>-.10);
 }
});
check('Selecting new animals sets their own goals before the game starts',()=>{
 const game=Object.assign(Object.create(Game.prototype),{state:'START',rescueAnimal:{animalId:'bunny',setAnimal(id){this.animalId=id;}},uiManager:{}});
 for(const [id,target]of [['frog',8],['dog',14],['dragon',16]]){game.handleSelectAnimal(id);assert.equal(game.activeAnimalId,id);assert.equal(game.targetCount,target);assert.equal(game.rescueAnimal.animalId,id);}
});
check('Frog launches in larger jumps; puppy uses an alternating four-footed gait and wag',()=>{
 const frog=new RescueAnimal(new T.Scene(),camera(),'frog'),dog=new RescueAnimal(new T.Scene(),camera(),'dog');
 frog.startEscape();dog.startEscape();
 for(let i=0;i<22;i++){frog.update(.05,1.1);dog.update(.05,1.1);}
 assert.ok(frog.currentY-frog.groundY>.12);assert.ok(dog.currentY-dog.groundY<.06);
 assert.equal(frog.leftLeg.rotation.x,frog.rightLeg.rotation.x);assert.ok(dog.leftLeg.rotation.x*dog.rightLeg.rotation.x<0);assert.ok(dog.leftArm.position.z>dog.leftLeg.position.z+.5);assert.ok(Math.abs(dog.tailGroup.rotation.y)>.1);
});
check('Both new animals pause and reset after completing the whole escape',()=>{
 for(const id of ['frog','dog','dragon']){
  const a=new RescueAnimal(new T.Scene(),camera(),id);a.setEnergy(a.targetEnergy);a.startEscape();a.update(1.2,1.2);a.setPaused(true);const x=a.currentX,elapsed=a.escapeElapsed;a.update(10,11.2);assert.equal(a.currentX,x);assert.equal(a.escapeElapsed,elapsed);
  a.setPaused(false);a.update(3,4.2);assert.equal(a.state,'ESCAPED');a.reset();assert.equal(a.animalGroup.visible,true);assert.equal(a.state,'TRAPPED');assert.equal(a.energyLevel,0);assert.ok(a.ropeCoils.every(c=>c.group.visible));assert.ok([...a.furMaterials].every(m=>m.opacity===1));
 }
});
check('Fourteen-point puppy progress loosens ropes gradually instead of releasing on the first point',()=>{
 const a=new RescueAnimal(new T.Scene(),camera(),'dog');a.setEnergy(1);assert.equal(a.ropeCoils[0].loosened,false);a.setEnergy(6);assert.equal(a.ropeCoils.filter(c=>c.loosened).length,2);a.setEnergy(9);assert.equal(a.ropeCoils.filter(c=>c.loosened).length,3);a.setEnergy(12);assert.equal(a.ropeCoils.filter(c=>c.loosened).length,4);
});
check('Pond and puppy garden themes have independent decorations and colours',()=>{
 const s=new SceneManager({appendChild(){}});s.setAnimalTheme('frog');const pond=s.pathMaterial.color.getHex();assert.equal(s.frogExtras.visible,true);assert.equal(s.dogExtras.visible,false);assert.equal(s.catExtras.visible,false);
 s.setAnimalTheme('dog');assert.notEqual(s.pathMaterial.color.getHex(),pond);assert.equal(s.frogExtras.visible,false);assert.equal(s.dogExtras.visible,true);assert.equal(s.dogTrail.visible,true);
});
check('Redesigned rewards fit a head-sized slot and batch their detailed geometry',()=>{
 for(let style=0;style<3;style++){
  const prop=createAccessory(style);assert.equal(prop.userData.designVersion,2);const size=new T.Box3().setFromObject(prop).getSize(new T.Vector3());assert.ok(size.x>.8&&size.x<1.5);assert.ok(size.y>.3&&size.y<.8);assert.ok(size.z>.2&&size.z<.9);assert.ok(prop.children.length<20,'static detail should be batched');
 }
 const ar=new CelebrationAccessories(new T.Scene(),camera());ar.start([{id:1,face:{x:.3,y:.24,width:.12}},{id:2,face:{x:.7,y:.24,width:.12}}],false,()=>.9);ar.update(.016,1280,720);assert.equal(ar.slots.filter(s=>s.prop.visible).length,2);ar.clear();assert.equal(ar.slots.length,0);
});
check('Dragon energy response flaps actual wings; pause freezes them',()=>{
 const a=new RescueAnimal(new T.Scene(),camera(),'dragon');const wing=a.model.getObjectByName('Wing_L');assert.ok(wing);a.setEnergy(1);a.update(.12,.12);const angle=wing.rotation.y;assert.ok(Math.abs(angle)>.2);a.setPaused(true);a.update(1,1.12);assert.equal(wing.rotation.y,angle);
});
check('Dragon glides continuously above the path and resets wings after farewell',()=>{
 const a=new RescueAnimal(new T.Scene(),camera(),'dragon');a.startEscape();a.update(1.4,1.4);assert.equal(a.state,'ESCAPING');assert.ok(a.currentY-a.groundY>.15);const wing=a.model.getObjectByName('Wing_R');a.reset();assert.equal(a.currentY,a.groundY);assert.equal(wing.rotation.y,.18);assert.equal(a.leftLeg.rotation.x,0);
});
check('Sixteen-point dragon only releases its final rope on the final energy',()=>{
 const a=new RescueAnimal(new T.Scene(),camera(),'dragon');a.setEnergy(13);assert.equal(a.ropeCoils.filter(c=>c.loosened).length,4);a.setEnergy(16);assert.ok(a.ropeCoils.every(c=>c.loosened));
});
check('Cloud crystal scenery is exclusive to the dragon and switches away cleanly',()=>{
 const s=new SceneManager({appendChild(){}});s.setAnimalTheme('dragon');assert.equal(s.dragonExtras.visible,true);assert.equal(s.dogTrail.visible,false);assert.equal(s.frogExtras.visible,false);s.setAnimalTheme('bunny');assert.equal(s.dragonExtras.visible,false);assert.equal(s.bunnyExtras.visible,true);
});
check('Rope release plays in three beats: taut tease, slack sag, snap with recoil',()=>{
 const a=new RescueAnimal(new T.Scene(),camera(),'bunny');
 a.update(.2,.2);assert.equal(a.ropeCoils[0].loosened,false);
 a.setEnergy(2);
 assert.equal(a.ropeCoils[0].loosened,true);assert.equal(a.ropeCoils[0].falling,false,'milestone enters slack first');
 a.update(.2,.4);assert.ok(a.ropeCoils[0].group.position.y<0,'slack sags downward');
 let snapped=false;a.onRopeSnap=()=>snapped=true;
 a.update(.3,.7);assert.equal(a.ropeCoils[0].falling,true,'snap transition fires');
 assert.ok(snapped,'onRopeSnap callback fired');assert.ok(a.recoilTimer>0,'animal recoils');
 a.update(.4,1.1);assert.equal(a.ropeCoils[0].group.visible,false,'rope gone after slack+fall');
 a.reset();assert.equal(a.ropeCoils[0].group.visible,true);assert.equal(a.recoilTimer,0);assert.equal(a.ropeCoils[0].taut,false);
});
check('Energy arrival squash: arms open additively, bow flares, pause freezes and it settles',()=>{
 const a=new RescueAnimal(new T.Scene(),camera(),'cat');
 a.receiveEnergyImpact(1);assert.equal(a.receiveTimer,.5);
 a.receiveEnergyImpact(2);assert.equal(a.receivePower,1.25,'multi-energy hits harder');
 const armZ=a.leftArm.rotation.z;
 a.update(.15,.15);
 assert.ok(a.leftArm.rotation.z<armZ-.15,'arms open outward');
 assert.ok(a.model.scale.y<1&&a.model.scale.x>1,'arrival squash');
 assert.ok(a.bowMaterials[0].emissiveIntensity>0,'bow flares');
 a.setPaused(true);const rt=a.receiveTimer;a.update(2,2.15);assert.equal(a.receiveTimer,rt);
 a.setPaused(false);a.update(.6,.75);assert.equal(a.receiveTimer,0);
 assert.ok(Math.abs(a.model.scale.y-1)<.02,'scale settles back');
});
check('Combo of three triggers a spin flourish that lands cleanly',()=>{
 const a=new RescueAnimal(new T.Scene(),camera(),'cat');
 a.reactToCombo(2);assert.equal(a.comboMoveTimer,0,'combo 2 stays a small reaction');
 a.reactToCombo(3);assert.ok(a.comboMoveTimer>0);
 a.update(.85,.85);assert.equal(a.comboMoveTimer,0);
 a.update(.016,.866);
 assert.ok(Math.abs(a.animalGroup.rotation.y-(.15+Math.sin(a.idleTime*.85)*.07))<1e-6,'rotation restored by idle pose');
 const d=new RescueAnimal(new T.Scene(),camera(),'dragon');
 d.reactToCombo(3);d.update(.9,.9);d.update(.016,.916);
 assert.equal(d.model.rotation.z,0,'dragon roll resets exactly');
});
check('Trapped mood eases from worried to excited with a persistent smile',()=>{
 const a=new RescueAnimal(new T.Scene(),camera(),'bunny');
 for(let i=0;i<45;i++)a.update(1/45,i/45);
 assert.ok(a.moodWorried>.5,'worried at empty energy');
 assert.ok(a.leftEarGroup.rotation.z<.1,'ears droop when worried');
 a.setEnergy(4);
 for(let i=0;i<75;i++)a.update(1/60,1+i/60);
 assert.ok(a.moodExcited>.5,'excited near rescue');
 assert.equal(a.happyMouth.visible,true,'persistent smile');
 a.setEnergy(0);
 for(let i=0;i<80;i++)a.update(1/60,2+i/60);
 assert.ok(a.moodWorried>.5);assert.ok(a.moodExcited<.3);
 assert.equal(a.happyMouth.visible,false,'smile fades when energy drains');
});
console.log(JSON.stringify({passed:results.length,results},null,2));
