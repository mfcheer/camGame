import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as T from 'three';
import {RescueAnimal,ANIMAL_MODELS} from '../src/rescueAnimal.js';
import {GAME_CONFIG} from '../src/config.js';
import {SceneManager} from '../src/sceneManager.js';
import {STAGE_IDS} from '../src/stageDesigns.js';
const camera=()=>{const c=new T.PerspectiveCamera(48,16/9,.1,100);c.position.z=7.5;return c;};
const results=[];const check=(name,fn)=>{fn();results.push(name);};
check('Flying dragon is preserved; golden dragon is an independent yellow, wingless rig with long whiskers',()=>{
 const flying=ANIMAL_MODELS.dragon(),golden=ANIMAL_MODELS.goldenDragon();assert.ok(flying.getObjectByName('Wing_L'));assert.equal(GAME_CONFIG.animals.dragon.name,'飞龙 翼翼');
 assert.equal(golden.getObjectByName('Wing_L'),undefined);assert.ok(golden.getObjectByName('Whisker_L'));assert.ok(golden.getObjectByName('Long_Tapered_Tail'));assert.ok(golden.getObjectByName('Slender_Serpentine_Body').material.color.r>.7);
 const file=fs.readFileSync(new URL('../public/models/golden-dragon.glb',import.meta.url));assert.equal(file.toString('ascii',0,4),'glTF');const json=JSON.parse(file.toString('utf8',20,20+file.readUInt32LE(12)).trim());assert.ok(json.nodes.some(n=>n.name==='Whisker_R'));assert.ok(!json.nodes.some(n=>n.name==='Wing_L'));
});
check('Golden dragon responds, swims, freezes while paused and resets every extra pivot',()=>{
 const a=new RescueAnimal(new T.Scene(),camera(),'goldenDragon');assert.equal(a.targetEnergy,12);a.setEnergy(1);a.update(.3,.3);assert.ok(a.reactionTimer>0);a.startEscape();a.update(1.4,1.7);assert.equal(a.state,'ESCAPING');assert.ok(a.currentY-a.groundY>.15);assert.ok(Math.abs(a.bodyMesh.rotation.z)>.01);
 const angle=a.tailGroup.rotation.y,x=a.currentX;a.setPaused(true);a.update(5,6.7);assert.equal(a.currentX,x);assert.equal(a.tailGroup.rotation.y,angle);a.setPaused(false);a.update(3,9.7);assert.equal(a.state,'ESCAPED');a.reset();assert.equal(a.bodyMesh.rotation.z,0);assert.equal(a.model.getObjectByName('Whisker_L').rotation.y,0);assert.equal(a.animalGroup.visible,true);
});
check('Every stage changes actual road geometry and destination props without stacking other stages',()=>{
 const s=new SceneManager({appendChild(){}});for(const id of STAGE_IDS){s.setStage(id);assert.equal(s.stageId,id);assert.ok(s.stageName);for(const [key,v]of Object.entries(s.stageVariants)){assert.equal(v.trail.visible,key===id);assert.equal(v.right.visible,key===id);assert.ok(v.trail.children.length<10,'road geometry is batched');}assert.equal(s.leftGarden.visible,id==='forest');assert.equal(s.rightGarden.visible,id==='forest');}
});
check('Stage randomisation reaches all alternatives and cannot immediately repeat',()=>{
 const s=new SceneManager({appendChild(){}}),seen=new Set();for(let i=0;i<4;i++){s.setStage('forest');seen.add(s.randomizeStage(()=>(i+.5)/4));}assert.equal(seen.size,4);s.setStage('brook');assert.equal(s.randomizeStage(()=>0),'forest');for(let i=0;i<20;i++){const before=s.stageId;s.randomizeStage();assert.notEqual(s.stageId,before);}
});
check('Changing animals retains the selected stage, with no stale pond, paw or bone overlays',()=>{
 const s=new SceneManager({appendChild(){}});s.setStage('bamboo');const color=s.pathMaterial.color.getHex();for(const id of ['frog','cat','dog','dragon','goldenDragon']){s.setAnimalTheme(id);assert.equal(s.stageId,'bamboo');assert.equal(s.pathMaterial.color.getHex(),color);assert.equal(s.frogExtras.visible,false);assert.equal(s.dogTrail.visible,false);assert.equal(s.catPawTrail.visible,false);}s.setStage('forest');assert.equal(s.dragonExtras.visible,true);
});
check('Stage transitions reuse geometry, and responsive layouts leave destinations in frame',()=>{
 const s=new SceneManager({appendChild(){}}),geometry=s.stageVariants.brook.trail.children[0].geometry;for(let i=0;i<20;i++)s.randomizeStage();assert.equal(s.stageVariants.brook.trail.children[0].geometry,geometry);s.camera.aspect=844/390;s.camera.updateProjectionMatrix();s.updateGroundLayout(844,390);assert.ok(s.rightFrame.position.x>0);s.setStage('cloud');s.triggerRightArchGlow();s.update(.2);assert.ok(s.stageVariants.cloud.right.scale.x>1);s.update(2);assert.equal(s.stageVariants.cloud.right.scale.x,1);
});
console.log(JSON.stringify({passed:results.length,results},null,2));
