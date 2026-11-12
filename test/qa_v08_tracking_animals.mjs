import assert from 'node:assert/strict';
import * as T from 'three';
import {HandAssociator,mapVideoPoint} from '../src/handTracking.js';
import {HandPositionFilter,PoseDetector} from '../src/poseDetector.js';
import {BubbleManager} from '../src/bubbleManager.js';
import {RescueAnimal} from '../src/rescueAnimal.js';
import {GAME_CONFIG,resolveAnimal} from '../src/config.js';
import {Game} from '../src/main.js';
const results=[];function check(name,fn){fn();results.push(name);}
const camera=()=>{const c=new T.PerspectiveCamera(48,16/9,.1,100);c.position.z=7.5;c.updateMatrixWorld();return c;};
function hand(x=.3,y=.5){const a=Array.from({length:21},()=>({x,y,z:0}));a[8]={x:x+.04,y:y-.16,z:0};a[5]={x:x-.025,y:y-.07};a[17]={x:x+.025,y:y-.06};a[19]={x:.95,y:.95};return a;}
const identity=p=>({x:p.x,y:p.y});
function people(){return [{id:1,centerX:.3,wrists:[{side:'left',x:.3,y:.5},{side:'right',x:.44,y:.5}]}];}
check('Exact Hand Landmarker #8 is the anchor, not Pose #19 or wrist #0',()=>{
 const players=new HandAssociator().assign(people(),{landmarks:[hand()]},identity,1000);const h=players[0].hands[0];assert.ok(Math.abs(h.x-.34)<1e-8);assert.ok(Math.abs(h.y-.34)<1e-8);assert.equal(h.source,'hand-21');
});
check('Mirror and cover mapping use the same source dimensions',()=>{
 const p=mapVideoPoint({x:.25,y:.4},1280,720,390,844);const scaled=1280*844/720;assert.ok(Math.abs(p.x-(.75*scaled-(scaled-390)/2)/390)<1e-8);assert.equal(p.y,.4);
});
check('Four detected hands belong to distinct selected player/side slots',()=>{
 const a=new HandAssociator();const p=[{id:1,centerX:.3,wrists:[{side:'left',x:.2,y:.5},{side:'right',x:.4,y:.5}]},{id:2,centerX:.7,wrists:[{side:'left',x:.6,y:.5},{side:'right',x:.8,y:.5}]}];a.assign(p,{landmarks:[hand(.8),hand(.2),hand(.6),hand(.4)]},identity,1000);assert.deepEqual(p.map(p=>p.hands.length),[2,2]);assert.ok(p[0].hands.every(h=>h.x<.5));assert.ok(p[1].hands.every(h=>h.x>.5));
});
check('An out-of-frame fingertip never clamps to a hittable edge or falls back to wrist',()=>{
 const h=hand();h[8].x=-.02;const p=new HandAssociator().assign(people(),{landmarks:[h]},identity,1000);assert.equal(p[0].hands.length,0);
});
check('Pixel-space adaptive filtering suppresses jitter and follows fast motion',()=>{
 const f=new HandPositionFilter(1.6,.018,1,450);const stationary=[];
 for(let i=0;i<80;i++)stationary.push(f.filter(600+(i%2?3:-3),300,i*16.67).x);
 assert.ok(Math.max(...stationary.slice(20))-Math.min(...stationary.slice(20))<3);
 let measured;
 for(let i=1;i<=30;i++)measured=f.filter(600+i*10,300,(80+i)*16.67).x;
 assert.ok(900-measured<25,`fast motion lag ${900-measured}`);
});
check('Dedicated mode never uses coarse Pose hand points if the hand model misses',()=>{
 const p=new PoseDetector({});p.useDedicatedHands=true;
 const body=Array.from({length:33},()=>({x:.5,y:.5,visibility:.95}));body[11].x=.4;body[12].x=.6;
 p.processLandmarks({landmarks:[body]},{landmarks:[]},1000);assert.equal(p.trackedPlayers.length,1);assert.equal(p.trackedPlayers[0].hands.length,0);
});
check('Unobserved/predicted points cannot pop a bubble',()=>{
 const scene=new T.Scene(),c=camera(),b=new BubbleManager(scene,c,{playPop(){}},null);b.createBubble(0);const p=b.activeBubble.group.position.clone().project(c);
 assert.equal(b.checkHandCollisions([{id:1,hands:[{x:(p.x+1)/2,y:(1-p.y)/2,isIndexTip:true,observed:false}]}]),false);
});
check('Targets stay inside an inset camera area on desktop and short landscape',()=>{
 for(const [w,h] of [[1280,720],[844,390]]){
  const old=globalThis.window;globalThis.window={innerWidth:w,innerHeight:h};
  try{const c=camera();c.aspect=w/h;c.updateProjectionMatrix();const b=new BubbleManager(new T.Scene(),c,{playPop(){}},null,{getTargetPosition:()=>new T.Vector3()});
   for(let i=0;i<100;i++){const p=b.calculateSpawnPosition().project(c);const x=(p.x+1)/2,y=(1-p.y)/2;assert.ok(x>=.18-1e-8&&x<=.82+1e-8);assert.ok(y<=.72+1e-8);}
  }finally{if(old===undefined)delete globalThis.window;else globalThis.window=old;}
 }
});
check('Losing a hand moves an edge target inward; it does not award a hit',()=>{
 const c=camera(),b=new BubbleManager(new T.Scene(),c,{playPop(){}},null);b.createBubble(0);const vw=2*Math.tan(T.MathUtils.degToRad(24))*7.5*c.aspect;
 b.activeBubble.basePos.x=vw*.30;b.activeBubble.group.position.copy(b.activeBubble.basePos);b.latestTrackedPlayers=[{id:1,hands:[]}];b.idleTimer=1100;const before=b.activeBubble.basePos.x;
 for(let i=0;i<80;i++)b.update(.016,i*.016);
 assert.equal(b.activeBubble.assisted,true);assert.ok(b.activeBubble.basePos.x<before-.5);assert.equal(b.checkHandCollisions(b.latestTrackedPlayers),false);
});
check('Cat requires eight bubbles and loosens ropes across its own progress',()=>{
 const a=new RescueAnimal(new T.Scene(),camera(),'cat');assert.equal(a.targetEnergy,8);a.setEnergy(1);assert.equal(a.ropeCoils[0].loosened,false);a.setEnergy(2);assert.equal(a.ropeCoils[0].loosened,true);a.setEnergy(5);assert.equal(a.ropeCoils.filter(c=>c.loosened).length,3);a.setEnergy(7);assert.equal(a.ropeCoils.every(c=>c.loosened),true);
});
check('Cat trots with alternating paws; rabbit pushes both hind legs together',()=>{
 for(const id of ['cat','bunny']){const a=new RescueAnimal(new T.Scene(),camera(),id);a.startEscape();a.update(1,1);if(id==='cat'){assert.ok(a.leftArm.rotation.x*a.rightArm.rotation.x<0);assert.ok(a.headGroup.position.y<.7);assert.ok(a.leftArm.position.z>a.leftLeg.position.z+.5);}else assert.equal(a.leftLeg.rotation.x,a.rightLeg.rotation.x);}
});
check('Selection/random resolves only playable animals and sets goal before start',()=>{
 assert.equal(resolveAnimal('random',()=>0),'bunny');assert.equal(resolveAnimal('random',()=>.99),'goldenDragon');assert.equal(resolveAnimal('bad'),'bunny');
 const game=Object.assign(Object.create(Game.prototype),{state:'START',rescueAnimal:{animalId:'bunny',setAnimal(id){this.animalId=id;}},uiManager:{}});game.handleSelectAnimal('cat');assert.equal(game.targetCount,8);assert.equal(game.activeAnimalId,'cat');assert.equal(GAME_CONFIG.animals.bunny.targetBubbles,5);
});
check('Render interpolation and collision share the same visible marker',()=>{
 const c=camera(),b=new BubbleManager(new T.Scene(),c,{playPop(){}},null);b.createBubble(0);b.activeBubble.spawnElapsed=.5;
 const point=x=>[{id:1,hands:[{side:'left',x,y:.4,isIndexTip:true,source:'hand-21',observed:true}]}];
 b.updateHandIndicators(point(.2));b.updateHandIndicators(point(.6));b.activeBubble.group.position.copy(b.handIndicators[0].targetPosition);b.activeBubble.basePos.copy(b.handIndicators[0].targetPosition);
 assert.equal(b.checkHandCollisions(point(.6)),false,'raw target cannot pop before the visible point moves');
 b.update(.05,.05);const x=(b.handIndicators[0].group.position.clone().project(c).x+1)/2;assert.ok(x>.2&&x<.6);
 assert.equal(b.checkHandCollisions(point(.6)),true);
});
check('Stale tips and paused markers cannot be reused as new hits',()=>{
 const c=camera(),b=new BubbleManager(new T.Scene(),c,{playPop(){}},null);b.createBubble(0);const p=b.activeBubble.group.position.clone().project(c);
 const players=[{id:1,hands:[{side:'left',x:(p.x+1)/2,y:(1-p.y)/2,isIndexTip:true,source:'hand-21',observed:true}]}];
 b.updateHandIndicators(players);for(let i=0;i<13;i++)b.update(.016,i*.016);assert.equal(b.checkHandCollisions(players),false);
 b.updateHandIndicators(players);b.hideHandIndicators();assert.equal(b.latestTrackedPlayers.length,0);assert.equal(b.handsAgeSeconds,Infinity);
});
check('Coop edge assistance follows the target owner even when the other hand is visible',()=>{
 const c=camera(),b=new BubbleManager(new T.Scene(),c,{playPop(){}},null);b.setPlayerMode('coop');b.createBubble(0);
 assert.equal(b.activeBubble.ownerId,2);const vw=2*Math.tan(T.MathUtils.degToRad(24))*7.5*c.aspect;b.activeBubble.basePos.x=vw*.3;b.idleTimer=1200;
 const players=[{id:1,hands:[{side:'left',x:.3,y:.4,isIndexTip:true}]},{id:2,hands:[]}];
 for(let i=0;i<80;i++){b.updateHandIndicators(players);b.update(.016,i*.016);}assert.equal(b.activeBubble.assisted,true);
});
{
 const previousWorker=globalThis.Worker;let terminated=0,stopped=0,reported=0;
 globalThis.Worker=class {postMessage(){queueMicrotask(()=>this.onmessage({data:{type:'ready',delegate:'CPU'}}));}terminate(){terminated++;}};
 try {
  const p=new PoseDetector({srcObject:{}});p.stream={getTracks:()=>[{stop(){stopped++;}}]};p.isRunning=true;p.onErrorCallback=()=>reported++;
  await p.initWorker();p.worker.onerror({message:'test worker failure'});
  check('A failed tracking worker releases the camera and offers a clean retry',()=>{assert.equal(p.worker,null);assert.equal(p.isRunning,false);assert.equal(p.status,'error');assert.equal(stopped,1);assert.equal(terminated,1);assert.equal(reported,1);});
 } finally {if(previousWorker===undefined)delete globalThis.Worker;else globalThis.Worker=previousWorker;}
}
console.log(JSON.stringify({passed:results.length,results},null,2));
