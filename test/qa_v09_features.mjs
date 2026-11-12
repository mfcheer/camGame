import assert from 'node:assert/strict';
import * as T from 'three';
import {pointerPalette,relativeLuminance,PointerContrastSampler,inverseCoverPoint} from '../src/pointerContrast.js';
import {createAccessory,CelebrationAccessories} from '../src/celebrationAccessories.js';
import {PoseDetector} from '../src/poseDetector.js';
import {RescueAnimal} from '../src/rescueAnimal.js';
import {SceneManager} from '../src/sceneManager.js';
import {BubbleManager} from '../src/bubbleManager.js';
import {Game} from '../src/main.js';
const results=[];function check(name,fn){fn();results.push(name);}
const camera=()=>{const c=new T.PerspectiveCamera(48,16/9,.1,100);c.position.z=7.5;c.updateMatrixWorld();return c;};
check('Local contrast chooses ink on white and a light tip on black, with hysteresis',()=>{
 assert.equal(pointerPalette(1,'light').mode,'ink');assert.equal(pointerPalette(0,'ink').mode,'light');assert.equal(pointerPalette(.4,'ink').mode,'ink');assert.equal(pointerPalette(.4,'light').mode,'light');assert.equal(relativeLuminance(255,255,255),1);assert.equal(relativeLuminance(0,0,0),0);
});
check('Contrast samples each local background through the mirrored video mapping',()=>{
 const s=new PointerContrastSampler({videoWidth:160,videoHeight:90});s.pixels=new Uint8ClampedArray(160*90*4);
 for(let y=0;y<90;y++)for(let x=80;x<160;x++)for(let c=0;c<3;c++)s.pixels[(x+y*160)*4+c]=255;
 assert.ok(s.sample(.2,.5,160,90)>.9);assert.ok(s.sample(.8,.5,160,90)<.1);assert.ok(Math.abs(inverseCoverPoint(.2,.5,160,90,160,90).x-.8)<1e-6);
});
check('Three different native 3D rewards can be chosen',()=>{
 assert.deepEqual([0,1,2].map(i=>createAccessory(i).name),['crown','flower-crown','explorer-hat']);
});
check('Face anchors come from the selected player and decorations disappear when tracking is stale',()=>{
 const p=new PoseDetector({});const body=Array.from({length:33},()=>({x:.5,y:.4,visibility:.95}));
 body[2]={x:.47,y:.22,visibility:.95};body[5]={x:.53,y:.22,visibility:.95};body[7]={x:.42,y:.25,visibility:.95};body[8]={x:.58,y:.25,visibility:.95};body[11].x=.4;body[12].x=.6;
 p.processLandmarks({landmarks:[body]});assert.ok(p.trackedPlayers[0].face.y<.22);
 const ar=new CelebrationAccessories(new T.Scene(),camera());ar.start(p.trackedPlayers,false,()=>0);ar.update(.016,1280,720);assert.equal(ar.slots[0].prop.visible,true);assert.equal(ar.slots[1].prop.visible,false);ar.update(.5,1280,720);assert.equal(ar.slots[0].prop.visible,false);ar.clear();assert.equal(ar.slots.length,0);
});
check('Animal replies include eye contact and an actual smile that resets after the reaction',()=>{
 const a=new RescueAnimal(new T.Scene(),camera(),'cat');a.setEnergy(2);a.update(.1,.1);assert.equal(a.happyMouth.visible,true);assert.ok(Math.abs(a.headGroup.rotation.y)<.1);for(let i=0;i<90;i++)a.update(1/60,i/60);assert.equal(a.happyMouth.visible,false);
});
check('Cat and rabbit use different road palettes and unique decorations',()=>{
 const s=new SceneManager({appendChild(){}});const original=s.pathMaterial.color.getHex();s.setAnimalTheme('cat');assert.notEqual(s.pathMaterial.color.getHex(),original);assert.equal(s.catExtras.visible,true);assert.equal(s.catPawTrail.visible,true);assert.equal(s.bunnyExtras.visible,false);s.setAnimalTheme('bunny');assert.equal(s.bunnyExtras.visible,true);
});
check('An idle bubble relocates without scoring or changing the cooperative turn',()=>{
 let pops=0;const b=new BubbleManager(new T.Scene(),camera(),{playPop(){pops++;}},null);b.setPlayerMode('coop');b.createBubble(3);const old=b.activeBubble,side=b.lastPopPlayerSide;old.relocateAfterMs=10;b.idleTimer=20;
 for(let i=0;i<14;i++)b.update(.02,i*.02);
 assert.notEqual(b.activeBubble,old);assert.equal(b.bubbleIndex,3);assert.equal(b.lastPopPlayerSide,side);assert.equal(pops,0);assert.equal(b.energyProjectiles.length,0);assert.ok(b.activeBubble.spawnElapsed<.4);
});
check('An approaching hand prevents idle relocation; pop rings expire and reset cleanly',()=>{
 const b=new BubbleManager(new T.Scene(),camera(),{playPop(){}},null);b.createBubble(0);const old=b.activeBubble;old.relocateAfterMs=10;b.idleTimer=20;b.isNearHand=true;
 for(let i=0;i<14;i++)b.update(.02,i*.02);assert.equal(b.activeBubble,old);
 b.spawnPopRing(new T.Vector3(),0xffaaaa,.6);for(let i=0;i<25;i++)b.update(.02,i*.02);assert.equal(b.popRings.length,0);b.spawnPopRing(new T.Vector3(),0xffaaaa,.6);b.clear();assert.equal(b.popRings.length,0);
});
check('The automatic next round waits five seconds and cancels on pause/absence',()=>{
 const previousSet=globalThis.setTimeout,previousClear=globalThis.clearTimeout,previousDoc=globalThis.document;let callback,delay,started=0;
 globalThis.setTimeout=(fn,ms)=>{callback=fn;delay=ms;return 22;};globalThis.clearTimeout=()=>{};
 try{
  const g=Object.assign(Object.create(Game.prototype),{state:'CELEBRATING',resultVisible:true,celebrationSessionId:1,isDemoMode:true,playerMode:'single',uiManager:{setAutoNextCountdown(){},hideVictory(){},setAnimalSelection(){}},prepareAnimal(){},handleRestart(){started++;}});
  g.startAutoNext();assert.equal(delay,5000);callback();assert.equal(started,1);assert.equal(g.animalSelection,'random');
  g.startAutoNext();g.cancelAutoNext();callback();assert.equal(started,1,'a cancelled timeout already in the event queue must stay cancelled');
  g.startAutoNext();Game.prototype.handleTogglePause.call(g,true);callback();assert.equal(started,1);
  g.state='CELEBRATING';g.isDemoMode=false;g.lastPlayers=[];g.startAutoNext();callback();assert.equal(started,1);
  g.isDemoMode=true;globalThis.document={hidden:true};g.startAutoNext();callback();assert.equal(started,1);
 }finally{globalThis.setTimeout=previousSet;globalThis.clearTimeout=previousClear;if(previousDoc===undefined)delete globalThis.document;else globalThis.document=previousDoc;}
});
console.log(JSON.stringify({passed:results.length,results},null,2));
