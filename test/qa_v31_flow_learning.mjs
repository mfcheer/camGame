import test from 'node:test';import assert from 'node:assert/strict';import * as T from 'three';
import {SpeechPolicy} from '../src/speechPolicy.js';
import {VoiceQueue} from '../src/voiceQueue.js';import {Game} from '../src/main.js';import {BubbleManager} from '../src/bubbleManager.js';import {getWordById} from '../src/wordsConfig.js';import {AnimalSpeech} from '../src/animalSpeech.js';
const tick=async()=>{for(let i=0;i<5;i++)await Promise.resolve();};
function voice(){const jobs=[],calls=[],audio={playWord(id,options){calls.push(['word',id,options]);let done;const p=new Promise(r=>done=r);jobs.push(done);return p;},playPhrase(p){calls.push(['phrase',p.id]);let done;const promise=new Promise(r=>done=r);jobs.push(done);return promise;},stopWord(){jobs.at(-1)?.();}};return {q:new VoiceQueue(audio),audio,jobs,calls};}

test('fast pops retain only the latest pending English word with no overlapping speech',async()=>{
 const {q,calls,jobs}=voice();q.playWord('egg');let skipped=false;q.playWord('cup').then(()=>skipped=true);q.playWord('cat');await tick();assert.equal(skipped,true);assert.equal(calls.length,1);assert.equal(q.toJSON().pendingWord,'cat');jobs[0]();await tick();assert.equal(calls.length,2);assert.deepEqual(calls[1],['word','cat',{review:true}]);jobs[1]();await tick();assert.equal(q.current,null);
});

test('greeting finishes naturally, then the most recent word plays; caption dismissal cannot stop it',async()=>{
 const {q,calls,jobs}=voice();q.playPhrase({id:'hello-play'});q.playWord('egg');q.playWord('dog');assert.equal(calls.length,1);jobs[0]();await tick();assert.deepEqual(calls[1],['word','dog',{review:true}]);q.stopPhrase();assert.equal(q.current.value,'dog');jobs[1]();await tick();assert.equal(q.current,null);
});

test('explicit phrase replay replaces its own old voice and farewell discards stale word backlog',async()=>{
 const {q,calls,jobs}=voice();q.playPhrase({id:'hello-play'});q.playPhrase({id:'hello-play'});await tick();assert.equal(calls.length,2);q.playWord('egg');q.playPhrase({id:'goodbye'});await tick();assert.equal(q.pendingWord,null);assert.equal(q.current.value.id,'goodbye');jobs.at(-1)();await tick();assert.equal(q.current,null);
});

test('pause freezes the voice queue and resumes only the latest interrupted word, never stale jobs',async()=>{
 const {q,calls,jobs}=voice();q.playWord('egg');q.playWord('cat');q.pause();q.pause();await tick();assert.equal(q.current,null);assert.equal(q.resumeWord.value,'cat');assert.equal(calls.length,1);q.resume();q.resumePending();await tick();assert.equal(calls.length,2);assert.equal(q.current.value,'cat');jobs[0]();await tick();assert.equal(q.current.value,'cat');q.cancel();await tick();assert.equal(q.current,null);
});

test('finished parallel greeting captions do not replay speech on resume',async()=>{
 const {q,jobs,calls}=voice();const speech=new AnimalSpeech(q,{showAnimalSpeech(){},hideAnimalSpeech(){},setAnimalSpeechListening(){}},{});speech.nonBlocking=true;speech.start('start','cat',()=>{});jobs[0]();await tick();assert.equal(speech.done,true);q.pause();speech.setPaused(true);q.resume();speech.setPaused(false);q.resumePending();await tick();assert.equal(calls.length,1);assert.equal(speech.active,true);speech.cancel();
});

test('normal play delivers energy and schedules a target while the word voice is still pending',()=>{
 const events=[],g=Object.assign(Object.create(Game.prototype),{state:'PLAYING',collectedCount:0,targetCount:5,voiceQueue:{current:{kind:'word'}},uiManager:{updateProgress:n=>events.push(['progress',n])},balloon:{setEnergy:n=>events.push(['balloon',n])},rescueAnimal:{setEnergy:n=>events.push(['animal',n])},audioManager:{playEnergyCharge:n=>events.push(['charge',n])},bubbleManager:{lastPoppedEnergy:1,completedBubbleCount:1,energyProjectiles:[{}],spawnNext:(...args)=>events.push(['spawn',...args])}});
 g.onBubblePopped();assert.equal(g.collectedCount,1);assert.ok(events.some(e=>e[0]==='animal'&&e[1]===1));assert.deepEqual(events.at(-1),['spawn',1,false,null,true]);assert.equal(g.pendingWordDelivery,undefined);assert.equal(g.bubbleManager.energyProjectiles[0].onArrive,undefined);
});

test('the last hit starts rescue immediately without waiting for word audio',()=>{
 let wins=0;const g=Object.assign(Object.create(Game.prototype),{state:'PLAYING',collectedCount:4,targetCount:5,voiceQueue:{current:{}},bubbleManager:{lastPoppedEnergy:1},audioManager:{playEnergyCharge(){}},handleVictory:()=>wins++});g.onBubblePopped();assert.equal(wins,1);assert.equal(g.collectedCount,5);
});

test('an allowed automatic word gives a cue throughout speech, not a blocking presentation or bilingual recording',async()=>{
 const {q,calls,jobs}=voice(),shown=[];q.policy=new SpeechPolicy(null);q.policy.setAutomatic(true);const g=Object.assign(Object.create(Game.prototype),{state:'PLAYING',collectedCount:0,targetCount:5,voiceQueue:q,uiManager:{setLastWordAvailable(){},showWordCue:w=>shown.push(w.id)}});g.presentPlayWord(getWordById('egg'));assert.equal(g.currentWord,undefined);assert.equal(g.wordPresentationRemaining,undefined);assert.deepEqual(shown,['egg']);assert.equal(g.wordCueRemaining,Infinity);assert.equal(calls[0][2].review,true);jobs[0]();await tick();assert.equal(g.wordCueRemaining,.65);q.cancel();
});

test('the bubble speaker can use the flow queue without also calling the legacy voice channel',()=>{
 const camera=new T.PerspectiveCamera(48,1,.1,100);camera.position.z=7.5;camera.updateMatrixWorld();let legacy=0,flow=0;const b=new BubbleManager(new T.Scene(),camera,{playPop(){},playWord:()=>legacy++},null);b.wordAudioHandler=word=>{assert.equal(word.id,'egg');flow++;};b.createBubble(0,'normal','egg');b.popBubble(.5,.5);assert.equal(flow,1);assert.equal(legacy,0);
});

test('a round keeps one word while consecutive rounds avoid recent words',()=>{
 const camera=new T.PerspectiveCamera(48,1,.1,100);camera.position.z=7.5;camera.updateMatrixWorld();const b=new BubbleManager(new T.Scene(),camera,{},null),ids=[];
 for(let n=0;n<15;n++){b.clear();b.beginWordRound();const w=b.chooseRoundWord();assert.equal(b.chooseRoundWord(),w);assert.ok(!ids.slice(-3).includes(w.id));ids.push(w.id);}
});

test('opening a word detail deliberately pauses, clears auto-resume voice and never scores',()=>{
 const events=[],g=Object.assign(Object.create(Game.prototype),{state:'PLAYING',lastPlayWord:getWordById('egg'),collectedCount:2,voiceQueue:{resumeWord:{}},handleTogglePause:()=>events.push('pause'),animalSpeech:{cancel:()=>events.push('cancel-greeting')},uiManager:{clearWordCue(){}},wordFocus:{open:w=>events.push(w.id)}});g.openWordDetail();assert.deepEqual(events,['pause','cancel-greeting','egg']);assert.equal(g.voiceQueue.resumeWord,null);assert.equal(g.collectedCount,2);
});

 test('round startup preloads only its three short English recordings without consuming the first word',()=>{
 const camera=new T.PerspectiveCamera(48,1,.1,100);camera.position.z=7.5;const bm=new BubbleManager(new T.Scene(),camera,{},null),calls=[];bm.spawnNext=()=>{};
 const g=Object.assign(Object.create(Game.prototype),{state:'PLAYING',collectedCount:0,speechPolicy:{automaticEnabled:true,beginRound(){}},bubbleManager:bm,audioManager:{preloadWordAudios:(ids,options)=>calls.push({ids,options})}});g.beginRoundGreeting();assert.equal(calls.length,1);assert.equal(calls[0].ids.length,3);assert.equal(calls[0].options.review,true);assert.equal(bm.wordQueue.length,2);assert.ok(calls[0].ids.includes(bm.chooseRoundWord().id));
 });
