import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {AudioManager} from '../src/audioManager.js';
import {Game} from '../src/main.js';
import {BubbleManager} from '../src/bubbleManager.js';
import {getWordById} from '../src/wordsConfig.js';
const deferred=()=>{let resolve;const promise=new Promise(r=>resolve=r);return {promise,resolve};};
const tick=async()=>{await Promise.resolve();await Promise.resolve();};
function audioFixture(){
 const a=new AudioManager(),sources=[],ramps=[];
 a.init=()=>{};
 a.ctx={currentTime:0,destination:{},createGain:()=>({gain:{value:0},connect(){}}),createBufferSource(){const s={connect(){},start(){this.started=true;},stop(){this.onended?.();}};sources.push(s);return s;}};
 a.bgmGainNode={gain:{cancelScheduledValues(){},setTargetAtTime:v=>ramps.push(v)}};
 return {a,sources,ramps};
}
function gameFixture(){
 const events=[];
 const g=Object.assign(Object.create(Game.prototype),{state:'PLAYING',targetCount:5,collectedCount:0,lifecycleSessionId:1,
  uiManager:{showWordPopup:w=>events.push(w.id),clearWordPopup:animate=>{if(!animate)events.push('clear');},setWordPopupPaused:p=>events.push(p?'hide':'show'),updateProgress:n=>events.push(n)},
  audioManager:{stopWord(){},playEnergyCharge(){},playAnimalSound(){}},
  bubbleManager:{update(){},lastPoppedEnergy:1,spawnNext:()=>events.push('next')},handleVictory:()=>events.push('friend')});
 return {g,events};
}
function step(g,seconds){for(let t=0;t<seconds-1e-6;t+=.02)g.updateFrame(.02);}

test('word Promise follows actual buffer ended, ducks music and restores it afterward',async()=>{
 const {a,sources,ramps}=audioFixture();a.loadWordBuffer=async()=>({duration:7});
 let done=false;const p=a.playWord('rectangle').then(()=>done=true);await tick();assert.equal(done,false);assert.equal(sources[0].started,true);assert.ok(ramps.includes(.025));
 sources[0].onended();await p;assert.equal(done,true);assert.equal(ramps.at(-1),.08);
});

test('stopped or replaced asynchronous loads cannot start stale audio',async()=>{
 const {a,sources}=audioFixture(),old=deferred();a.loadWordBuffer=id=>id==='chair'?old.promise:Promise.resolve({});
 const first=a.playWord('chair');const second=a.playWord('book');await first;await tick();assert.equal(sources.length,1);
 old.resolve({});await tick();assert.equal(sources.length,1);sources[0].onended();await second;
});

test('mute stops an in-flight voice and resolves its completion',async()=>{
 const {a,sources}=audioFixture();a.loadWordBuffer=async()=>({});const p=a.playWord('car');await tick();a.setMuted(true);await p;assert.equal(a._activeWordSource,null);assert.equal(a.isMuted,true);assert.equal(sources.length,1);
});

test('HTML audio fallback waits for ended and stop pauses it',async()=>{
 const previous=globalThis.Audio,instances=[];
 globalThis.Audio=class{constructor(){instances.push(this);}play(){return Promise.resolve();}pause(){this.paused=true;}};
 try{const a=new AudioManager();a.init=()=>{};let done=false;const p=a.playWord('book').then(()=>done=true);await tick();assert.equal(done,false);instances[0].onended();await p;assert.equal(done,true);
 const p2=a.playWord('car');a.stopWord();await p2;assert.equal(instances[1].paused,true);
 }finally{if(previous===undefined)delete globalThis.Audio;else globalThis.Audio=previous;}
});

test('failed media falls back once, with completion after the final bilingual phrase',async()=>{
 const previous={Audio:globalThis.Audio,window:globalThis.window,Utterance:globalThis.SpeechSynthesisUtterance},spoken=[];
 globalThis.window={speechSynthesis:{cancel(){},speak:u=>spoken.push(u)}};
 globalThis.SpeechSynthesisUtterance=class{constructor(text){this.text=text;}};
 globalThis.Audio=class{play(){queueMicrotask(()=>this.onerror());return Promise.reject(new Error('missing'));}pause(){}};
 try{const a=new AudioManager();a.init=()=>{};let done=false;const p=a.playWord('table').then(()=>done=true);await tick();assert.deepEqual(spoken.map(u=>u.text),['桌子','table','桌子','table']);spoken[0].onend();await tick();assert.equal(done,false);spoken[3].onend();await p;assert.equal(done,true);
 }finally{for(const [key,value]of Object.entries({Audio:previous.Audio,window:previous.window,SpeechSynthesisUtterance:previous.Utterance})){if(value===undefined)delete globalThis[key];else globalThis[key]=value;}}
});

test('a slow recording blocks next target and animal energy past the former fixed deadline',async()=>{
 const {g,events}=gameFixture(),done=deferred();g.presentWord(getWordById('book'),.5,.5,done.promise);g.onBubblePopped();step(g,8);
 assert.equal(g.collectedCount,1);assert.deepEqual(events,['book']);assert.ok(g.currentWord);
 done.resolve();await tick();step(g,.5);assert.deepEqual(events,['book']);step(g,.3);assert.deepEqual(events,['book','clear',1,'next']);assert.equal(g.currentWord,null);
});

test('the last word finishes and leaves a reading beat before the friend interaction',async()=>{
 const {g,events}=gameFixture(),done=deferred();g.collectedCount=4;g.presentWord(getWordById('teacher'),.5,.5,done.promise);g.onBubblePopped();step(g,4);assert.equal(events.includes('friend'),false);done.resolve();await tick();step(g,.8);assert.deepEqual(events,['teacher','clear',5,'friend']);
});

test('silent or failed playback keeps a readable minimum without stalling the game',async()=>{
 const {g,events}=gameFixture();g.presentWord(getWordById('rectangle'),.99,0,Promise.resolve());g.onBubblePopped();await tick();step(g,2.7);assert.ok(g.currentWord);step(g,.34);assert.equal(events.at(-1),'next');
});

test('a media device that never emits ended is bounded by an active-time watchdog',()=>{
 const {g,events}=gameFixture();g.presentWord(getWordById('car'),.5,.5,new Promise(()=>{}));g.onBubblePopped();step(g,11.9);assert.ok(g.currentWord);step(g,.36);assert.equal(events.at(-1),'next');
});

test('pause hides the card, freezes reading, and replays on resume; old completion is ignored',async()=>{
 const {g,events}=gameFixture(),original=deferred(),replayed=deferred();g.audioManager.playWord=()=>replayed.promise;
 g.presentWord(getWordById('ball'),.5,.5,original.promise);g.onBubblePopped();step(g,1);g.handleTogglePause(true);const elapsed=g.wordElapsed;step(g,20);assert.equal(g.wordElapsed,elapsed);assert.equal(events.at(-1),'hide');original.resolve();await tick();assert.equal(g.wordAudioDone,false);
 g.handleResume();assert.equal(events.at(-1),'show');step(g,4);assert.ok(g.currentWord);replayed.resolve();await tick();step(g,.8);assert.equal(events.at(-1),'next');
});

test('canceling a round removes its card and forbids deferred effects',async()=>{
 const {g,events}=gameFixture(),old=deferred();g.presentWord(getWordById('car'),.5,.5,old.promise);g.onBubblePopped();g.cancelWordPresentation();old.resolve();await tick();step(g,15);assert.deepEqual(events,['car','clear']);assert.equal(g.pendingWordDelivery,null);
});

test('later rounds avoid recently seen concepts',()=>{
 const camera=new T.PerspectiveCamera(48,1,.1,100);camera.position.z=7.5;
 const b=new BubbleManager(new T.Scene(),camera,{},null),seen=[];
 for(let i=0;i<12;i++){b.clear();b.beginWordRound();const w=b.chooseRoundWord();const key=w.conceptId||w.id;assert.ok(!seen.slice(-5).includes(key));seen.push(key);}
 b.clear();assert.equal(b.wordPool.length,0);assert.equal(b.wordQueue.length,0);
});

test('pure game targets survive resize and pop without word speech or popup',()=>{
 const camera=new T.PerspectiveCamera(48,1,.1,100);camera.position.z=7.5;
 let words=0;const b=new BubbleManager(new T.Scene(),camera,{playPop(){},playWord(){words++;}},null);b.wordMode=false;b.onWordPop=()=>words++;
 b.createBubble(0,'normal');assert.equal(b.activeBubble.word,null);assert.ok(b.activeBubble.core.children.length);b.updateLayout();assert.equal(b.activeBubble.word,null);b.popBubble(.5,.5);assert.equal(words,0);assert.equal(b.activeBubble,null);
});


test('card exit finishes before delivery and pausing during exit safely restores the word',async()=>{
 const {g,events}=gameFixture();g.audioManager.playWord=()=>Promise.resolve();
 g.presentWord(getWordById('book'),.5,.5,Promise.resolve());g.onBubblePopped();await tick();step(g,2.82);
 assert.ok(g.wordClosingRemaining>0);assert.equal(events.includes('next'),false);
 g.handleTogglePause(true);g.handleResume();await tick();assert.equal(g.wordClosingRemaining,0);assert.equal(g.wordElapsed,0);assert.equal(events.filter(e=>e==='book').length,2);
 step(g,3.1);assert.equal(events.at(-1),'next');
});
