import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as T from 'three';
import {Game} from '../src/main.js';
import {AudioManager} from '../src/audioManager.js';
import {BubbleManager} from '../src/bubbleManager.js';
import {RescueAnimal} from '../src/rescueAnimal.js';
import {HappyPerformance} from '../src/happyPerformance.js';
import {WORDS_LIST,getWordById} from '../src/wordsConfig.js';
const tick=async()=>{await Promise.resolve();await Promise.resolve();};
const deferred=()=>{let resolve;return {promise:new Promise(r=>resolve=r),resolve:v=>resolve(v)};};
function camera(){const c=new T.PerspectiveCamera(48,390/844,.1,100);c.position.z=7.5;c.updateMatrixWorld();return c;}
function fixture(){const events=[];const g=Object.assign(Object.create(Game.prototype),{state:'PLAYING',targetCount:5,collectedCount:0,lifecycleSessionId:1,
 uiManager:{showWordPopup(){},clearWordPopup:a=>{if(!a)events.push('cleared');},updateProgress:n=>events.push(n)},
 audioManager:{stopWord(){},playEnergyCharge(){},playAnimalSound(){}},
 bubbleManager:{update(){},lastPoppedEnergy:1,spawnNext:(...args)=>events.push(['next',...args])}});return {g,events};}
function step(g,time){for(let t=0;t<time-1e-6;t+=.02)g.updateFrame(.02);}
function friend(id){const scene=new T.Scene(),c=camera(),a=new RescueAnimal(scene,c,id),f=new HappyPerformance(scene,c,a,{});f.start();return {a,f,step:(time)=>{for(let t=0;t<time-1e-6;t+=.02){f.update(.02);a.update(.02,t);}}};}

test('every word has a separate non-empty English review recording',()=>{
 for(const w of WORDS_LIST)assert.ok(fs.statSync(`public/audio/words/review/${w.id}.mp3`).size>2000,w.id);
 const a=new AudioManager();assert.equal(a.getWordAudioUrl('car'),'/audio/words/car.mp3');assert.equal(a.getWordAudioUrl('car',{review:true}),'/audio/words/review/car.mp3');
});

test('normal and review audio buffers have independent caches',async()=>{
 const oldFetch=globalThis.fetch,urls=[];globalThis.fetch=async url=>{urls.push(url);return {ok:true,arrayBuffer:async()=>new ArrayBuffer(1)};};
 try{const a=new AudioManager();a.init=()=>{};a.ctx={decodeAudioData:async()=>({id:urls.at(-1)})};const normal=await a.loadWordBuffer('car'),review=await a.loadWordBuffer('car',{review:true});assert.notEqual(normal,review);await a.loadWordBuffer('car',{review:true});assert.equal(urls.length,2);assert.match(review.id,/review\/car/);
 }finally{globalThis.fetch=oldFetch;}
});

test('review speech fallback says English once; the full introduction stays bilingual',()=>{
 const previous={window:globalThis.window,U:globalThis.SpeechSynthesisUtterance},spoken=[];
 globalThis.window={speechSynthesis:{speak:u=>spoken.push([u.text,u.lang])}};globalThis.SpeechSynthesisUtterance=class{constructor(t){this.text=t;}};
 try{new AudioManager()._speakWordFallback('car',()=>{},true);assert.deepEqual(spoken,[['car','en-US']]);}
 finally{if(previous.window===undefined)delete globalThis.window;else globalThis.window=previous.window;if(previous.U===undefined)delete globalThis.SpeechSynthesisUtterance;else globalThis.SpeechSynthesisUtterance=previous.U;}
});

test('a word becomes familiar only on pop, survives resize and resets in a new round',()=>{
 const options=[];const b=new BubbleManager(new T.Scene(),camera(),{playPop(){},playWord:(id,o)=>{options.push(o.review);}},null);
 b.createBubble(0,'normal','car');b.updateLayout();assert.equal(b.roundSeenWords.size,0);b.popBubble(.5,.5);b.createBubble(1,'normal','car');b.popBubble(.5,.5);assert.deepEqual(options,[false,true]);b.clear();b.createBubble(0,'normal','car');b.popBubble(.5,.5);assert.deepEqual(options,[false,true,false]);
});

test('review cards finish sooner, but always wait for their own audio and full exit',async()=>{
 const {g,events}=fixture(),done=deferred();g.presentWord(getWordById('car'),.5,.5,done.promise,{review:true});g.onBubblePopped();step(g,3);assert.ok(g.currentWord);assert.deepEqual(events,[]);done.resolve();await tick();step(g,.24);assert.ok(g.currentWord);step(g,.3);assert.equal(g.currentWord,null);assert.deepEqual(events,['cleared',1,['next',1,false,null,true]]);
 const x=fixture();x.g.presentWord(getWordById('car'),.5,.5,Promise.resolve(),{review:true});await tick();step(x.g,1.45);assert.ok(x.g.currentWord);step(x.g,.3);assert.equal(x.g.currentWord,null);
});

test('replaying waits for the new voice without scoring twice or delivering stale completion',async()=>{
 const {g,events}=fixture(),old=deferred(),replay=deferred();g.audioManager.playWord=(id,o)=>{assert.equal(o.review,true);return replay.promise;};
 g.presentWord(getWordById('car'),.5,.5,old.promise);g.onBubblePopped();g.replayWord();old.resolve();await tick();step(g,2);assert.ok(g.currentWord);assert.equal(g.wordAudioDone,false);assert.equal(g.collectedCount,1);replay.resolve();await tick();step(g,.6);assert.equal(g.currentWord,null);assert.equal(events.filter(e=>Array.isArray(e)&&e[0]==='next').length,1);
});

test('holding the original pop point does not cause an automatic replay; leave and dwell to repeat',()=>{
 const {g}=fixture();g.presentWord(getWordById('car'),.5,.5,new Promise(()=>{}));g.uiManager.getWordReplayTarget=()=>({x:100,y:100,width:60,height:60});let tips=[{px:100,py:100}],replays=0;g.bubbleManager.getInteractionTips=()=>tips;g.replayWord=()=>{replays++;g.wordReplayReady=false;g.wordReplayDwell=0;};g.wordElapsed=1;
 for(let i=0;i<30;i++)g.updateWordReplay(.02);assert.equal(replays,0);tips=[];g.updateWordReplay(.1);tips=[{px:100,py:100}];for(let i=0;i<20;i++)g.updateWordReplay(.02);assert.equal(replays,1);
});

test('the happy performance plays itself: no input, no score change, pause freezes it',()=>{
 for(const id of ['bunny','cat','dog','frog','dragon','goldenDragon']){const x=friend(id);x.step(1.2);
  assert.ok(x.f.active,id);assert.ok(x.f.plan.length>=5&&x.f.plan.length<=6,id);assert.ok(x.f.currentAction(),id);
  assert.ok(x.a.actionPoseFn,id);assert.equal(x.a.energyLevel,0,id);assert.ok(x.a.friendResponse>0,id);
  x.f.setPaused(true);const elapsed=x.f.elapsed,action=x.f.currentAction();x.step(2);
  assert.equal(x.f.elapsed,elapsed,id);assert.equal(x.f.currentAction(),action,id);assert.equal(x.f.group.visible,false,id);
  x.f.setPaused(false);x.step(15);assert.equal(x.f.active,false,id);assert.equal(x.a.actionPoseFn,null,id);x.f.clear();}
});

test('each show draws a fresh plan with a signature move, a finale, and no repeats',()=>{
 const seen=new Set();
 for(let i=0;i<6;i++){const x=friend('cat');const ids=x.f.plan.map(p=>p.id);
  seen.add(ids.join(','));assert.ok(ids.some(sid=>['earWiggle','tailSway'].includes(sid)),'a signature present');
  assert.equal(ids[ids.length-1],'finaleBow','finale closes the show');
  assert.equal(new Set(ids).size,ids.length,'no repeated actions');x.f.clear();}
 assert.ok(seen.size>1,'plans vary between shows');
});

function photoFixture(live=true){
 const events=[];const g=Object.assign(Object.create(Game.prototype),{state:'CELEBRATING',rescueAnimal:{state:'ESCAPED'},photoRemaining:null,resultVisible:false,
 hasLiveCamera:()=>live,cancelAutoNext:()=>events.push('stop-auto'),
 uiManager:{setPhotoCountdown:v=>events.push(['countdown',v]),setPolaroidImage(){},showVictory:v=>events.push(['result',v]),hideVictory:()=>events.push('hide')},
 celebrationAccessories:{slots:[{prop:{visible:true}}],clear:()=>events.push('clear-hats'),start:()=>events.push('hats')}
 });return {g,events};
}

test('live-camera wins show results immediately, keep hats and never auto-start a photo',()=>{
 const {g,events}=photoFixture();g.showVictoryWhenReady();assert.equal(g.resultVisible,true);assert.equal(g.photoRemaining,null);assert.equal(g.photoRequested,false);assert.equal(events.includes('clear-hats'),false);assert.deepEqual(events.at(-1),['result',{hasPhoto:false,canTakePhoto:true}]);
});

test('only an explicit result-screen action can begin a photo; countdown is cancelable',()=>{
 const {g}=photoFixture();g.beginPhoto();assert.notEqual(g.photoRequested,true);g.showVictoryWhenReady();g.beginPhoto();assert.equal(g.photoRequested,true);assert.equal(g.photoRemaining,2.4);assert.equal(g.resultVisible,false);g.cancelPhoto();assert.equal(g.photoRequested,false);assert.equal(g.photoRemaining,null);assert.equal(g.resultVisible,true);
});

test('a photo cannot interrupt friend play or start without a live camera',()=>{
 const {g}=photoFixture();g.resultVisible=true;g.friendInteraction={active:true};g.beginPhoto();assert.notEqual(g.photoRequested,true);
 const x=photoFixture(false);x.g.resultVisible=true;x.g.beginPhoto();assert.equal(x.g.photoRequested,false);assert.equal(x.g.photoRemaining,null);
});

test('capture is inert without a manual request; canceling a retake preserves its previous photo',()=>{
 const {g,events}=photoFixture();g.captureVictoryPhoto();assert.equal(events.length,0);g.resultVisible=true;g.currentPolaroidDataUrl='data:image/png;base64,old';g.beginPhoto(true);g.cancelPhoto();assert.equal(g.currentPolaroidDataUrl,'data:image/png;base64,old');assert.equal(g.resultVisible,true);assert.equal(events.filter(e=>Array.isArray(e)&&e[0]==='result').at(-1)[1].hasPhoto,true);
});

test('a finger already dwelling on replay keeps a short review card open long enough',async()=>{
 const {g}=fixture();g.presentWord(getWordById('car'),.5,.5,Promise.resolve(),{review:true});await tick();g.wordElapsed=1.45;g.wordQuietElapsed=1;g.wordReplayReady=true;
 g.uiManager.getWordReplayTarget=()=>({x:100,y:100,width:60,height:60});g.bubbleManager.getInteractionTips=()=>[{px:100,py:100}];g.audioManager.playWord=()=>new Promise(()=>{});
 step(g,.3);assert.equal(g.wordClosingRemaining,0);assert.ok(g.currentWord);step(g,.1);assert.ok(g.wordElapsed<.2);assert.equal(g.wordAudioDone,false);
});

test('the performance stage fits short landscape and small portrait screens',()=>{
 for(const id of ['cat','dog','frog','dragon','goldenDragon']){
  const x=friend(id);const original=globalThis.window;
  try{globalThis.window={innerWidth:667,innerHeight:240};x.f.camera.aspect=667/240;x.f.camera.updateProjectionMatrix();x.f.updateLayout();x.f.placeAnimal(1);x.step(.5);
   assert.ok(x.f.targetScale>0,id);
   const p=x.a.animalGroup.position.clone().project(x.f.camera);
   assert.ok(p.x>-1.05&&p.x<1.05&&p.y>-1.1&&p.y<1.1,`${id} animal stays on screen ${p.x.toFixed(2)},${p.y.toFixed(2)}`);
  }finally{if(original===undefined)delete globalThis.window;else globalThis.window=original;}
 }
});
