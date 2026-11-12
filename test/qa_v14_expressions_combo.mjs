import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as T from 'three';
import {AudioManager} from '../src/audioManager.js';
import {BubbleManager} from '../src/bubbleManager.js';
import {RescueAnimal} from '../src/rescueAnimal.js';
import {PLAYABLE_ANIMALS} from '../src/config.js';
const results=[];function check(name,fn){fn();results.push(name);}
const camera=()=>{const c=new T.PerspectiveCamera(48,16/9,.1,100);c.position.z=7.5;return c;};
const bubbles=()=>new BubbleManager(new T.Scene(),camera(),{playPop(){}},null);
check('Unmuting after a muted new round restarts BGM without duplicate sequencers',()=>{
 const a=new AudioManager();a.ctx={currentTime:1,state:'running'};a.initialized=true;a.setMuted(true);a.startBGM('brook');assert.equal(a.bgmInterval,null);a.setMuted(false);assert.ok(a.bgmInterval);const interval=a.bgmInterval;a.setMuted(false);assert.equal(a.bgmInterval,interval);a.stopBGM();assert.equal(a.bgmInterval,null);a.setMuted(false);assert.equal(a.bgmInterval,null);
});
check('Combo retains its full operation window during cooldown and bubble protection',()=>{
 const bm=bubbles();bm.createBubble(0);bm.popBubble(.5,.5);for(let i=0;i<40;i++)bm.update(.06,i*.06);assert.equal(bm.comboCount,1);assert.equal(bm.comboRemainingMs,1500);
 bm.createBubble(1);for(let i=0;i<6;i++)bm.update(.06,i*.06);assert.equal(bm.comboRemainingMs,1500);bm.update(.06,.42);assert.ok(bm.comboRemainingMs>1470&&bm.comboRemainingMs<1490);bm.popBubble(.5,.5);assert.equal(bm.comboCount,2);
});
check('An unpopped ready bubble expires a combo; pause and clear remove old streaks',()=>{
 const bm=bubbles();bm.createBubble(0);bm.popBubble(.5,.5);bm.createBubble(1);for(let i=0;i<33;i++)bm.update(.06,i*.06);assert.equal(bm.comboCount,0);bm.popBubble(.5,.5);assert.equal(bm.comboCount,1);bm.clear();assert.equal(bm.comboRemainingMs,0);assert.equal(bm.comboCount,0);
});
check('Every animal has actual smiling eyelids and a bounded head pitch over the whole reaction',()=>{
 for(const id of PLAYABLE_ANIMALS){const a=new RescueAnimal(new T.Scene(),camera(),id);a.setEnergy(2);let seenSmile=false;for(let i=0;i<60;i++){seenSmile ||= a.expressionRig.smileEyes.some(e=>e.smile.visible);a.update(1/60,i/60);assert.ok(Math.abs(a.headGroup.rotation.x)<.5,`${id} pitch accumulates`);}assert.ok(seenSmile,`${id} missing smile`);assert.equal(a.happyMouth.visible,true);}
});
check('Expression effects are reused and reset restores eyes, mouth, pupils and response state',()=>{
 for(const id of PLAYABLE_ANIMALS){const a=new RescueAnimal(new T.Scene(),camera(),id),glyphs=a.expressionRig.glyphs;a.setPlayerFocus([{face:{x:.8,y:.3}}]);for(let i=0;i<20;i++){a.setEnergy(i+1);a.update(.06,i*.06);}assert.equal(a.expressionRig.glyphs,glyphs);assert.equal(glyphs.length,3);a.reset();assert.equal(a.emotion,'content');assert.equal(a.happyMouth.visible,false);assert.equal(a.expressionRig.effects.visible,false);for(const e of a.expressionRig.smileEyes){assert.equal(e.eye.visible,true);assert.equal(e.smile.visible,false);}for(const p of a.expressionRig.pupils)assert.deepEqual(p.node.position,p.base);}
});
check('Combo acknowledgement and approaching-hand curiosity never grant animal energy',()=>{
 for(const id of PLAYABLE_ANIMALS){const a=new RescueAnimal(new T.Scene(),camera(),id);a.setAnticipation(true);a.update(.016,.016);assert.equal(a.emotion,'curious');a.reactToCombo(3);a.update(.016,.032);assert.equal(a.emotion,'delighted');assert.equal(a.energyLevel,0);a.setPaused(true);const timer=a.reactionTimer;a.update(4,4.032);assert.equal(a.reactionTimer,timer);}
});
check('Frog vocal sac, puppy wink and feline slow blink have different visible expressions',()=>{
 const frog=new RescueAnimal(new T.Scene(),camera(),'frog');frog.setEnergy(1);frog.update(.25,.25);assert.ok(frog.expressionRig.sac.scale.y>.025);
 const dog=new RescueAnimal(new T.Scene(),camera(),'dog');dog.setEnergy(2);dog.update(.3,.3);assert.equal(dog.expressionRig.smileEyes.filter(e=>e.smile.visible).length,1);assert.ok(dog.happyTongue.scale.y<.06);dog.reset();assert.equal(dog.happyTongue.scale.y,.048);
 const cat=new RescueAnimal(new T.Scene(),camera(),'cat');cat.setEnergy(1);cat.update(.05,.05);assert.equal(cat.expressionRig.smileEyes.filter(e=>e.smile.visible).length,0);cat.update(.2,.25);assert.equal(cat.expressionRig.smileEyes.filter(e=>e.smile.visible).length,2);
});
check('The exported cat contains almond eyes, pointed ears and grounded front paws',()=>{
 const b=fs.readFileSync(new URL('../public/models/marmalade-cat.glb',import.meta.url));const j=JSON.parse(b.toString('utf8',20,20+b.readUInt32LE(12)).trim());for(const name of ['Almond_Iris','Pointed_Ear','Grounded_Forepaw','Cat_Heart_Nose'])assert.ok(j.nodes.some(n=>n.name===name));
 const cat=new RescueAnimal(new T.Scene(),camera(),'cat');cat.setQuadrupedPosture(1);const bounds=new T.Box3().setFromObject(cat.model.getObjectByName('Grounded_Forepaw'));assert.ok(bounds.min.y>cat.groundY-.12,'paws should not sink through path');
});
console.log(JSON.stringify({passed:results.length,results},null,2));
