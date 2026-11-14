import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {shouldBlockNavigationWheel,installNavigationGuard} from '../src/navigationGuard.js';
import {AnimalSpeech} from '../src/animalSpeech.js';
import {libraryWords,WORD_CATEGORIES} from '../src/wordLibrary.js';
import {ANIMAL_PHRASES} from '../src/animalPhrases.js';
const tick=async()=>{await Promise.resolve();await Promise.resolve();};
const step=(s,t)=>{for(let n=0;n<t;n+=.02)s.update(.02);};
function fixture(){const jobs=[],events=[];const speech=new AnimalSpeech({stopPhrase(){},playPhrase(){let resolve;const promise=new Promise(r=>resolve=r);jobs.push(resolve);return promise;}},{showAnimalSpeech:()=>events.push('show'),hideAnimalSpeech:animate=>events.push(animate?'fade':'hide'),setAnimalSpeechListening:()=>events.push('listen')},{setSpeaking(){},setSpeechListening(){}});return {speech,jobs,events};}

test('only horizontal simulated-game wheel intent is captured; vertical scrolling and zoom remain available',()=>{
 for(const event of [{deltaX:100,deltaY:0},{deltaX:-300,deltaY:20},{deltaX:80,deltaY:90}])assert.equal(shouldBlockNavigationWheel(event,true),true);
 for(const event of [{deltaX:0,deltaY:100},{deltaX:1,deltaY:100},{deltaX:90,deltaY:0,ctrlKey:true},{deltaX:90,deltaY:0,metaKey:true}])assert.equal(shouldBlockNavigationWheel(event,true),false);
 assert.equal(shouldBlockNavigationWheel({deltaX:100,deltaY:0},false),false);
});

test('navigation guard is non-passive, scoped by current game state, and can be removed',()=>{
 let active=false,handler,options,removed=false;const target={addEventListener:(name,fn,o)=>{assert.equal(name,'wheel');handler=fn;options=o;},removeEventListener:(name,fn)=>{assert.equal(fn,handler);removed=true;}};
 const remove=installNavigationGuard(()=>active,target);assert.deepEqual(options,{capture:true,passive:false});let prevented=0;const e={deltaX:99,deltaY:0,cancelable:true,preventDefault:()=>prevented++};handler(e);active=true;handler(e);assert.equal(prevented,1);handler({...e,cancelable:false});assert.equal(prevented,1);remove();assert.equal(removed,true);
});

test('library shows all 75 unique words with complete categories and shared storybook animals',()=>{
 const all=libraryWords();assert.equal(all.length,75);assert.equal(new Set(all.map(w=>w.id)).size,75);
 assert.equal(libraryWords('colors').length,10);assert.equal(libraryWords('everyday').length,6);assert.equal(libraryWords('toys').length,19);
 const categorized=WORD_CATEGORIES.filter(([id])=>id!=='all').flatMap(([id])=>libraryWords(id));
 assert.equal(new Set(categorized.map(w=>w.id)).size,75);
 for(const id of ['bee','fish','bird','cat','dog','cow','horse'])assert.equal(categorized.filter(w=>w.id===id).length,2);
 assert.deepEqual(libraryWords('unknown'),[]);
});

test('a short phrase stays at least four seconds, leaves 1.8 seconds to echo and fades before advancing',async()=>{
 const {speech,jobs,events}=fixture();let next=0;speech.start('start','cat',()=>next++);step(speech,1);jobs[0]();await tick();assert.ok(events.includes('listen'));step(speech,2.95);assert.equal(next,0);assert.equal(speech.active,true);step(speech,.1);assert.ok(events.includes('fade'));assert.equal(next,0);step(speech,.3);assert.equal(next,1);
});

test('long playback is never cut to a fixed minimum; the echo period starts after its own ending',async()=>{
 const {speech,jobs}=fixture();let next=0;speech.start('end','dog',()=>next++);step(speech,5);assert.equal(speech.done,false);jobs[0]();await tick();step(speech,1.75);assert.equal(speech.closing,0);step(speech,.1);assert.ok(speech.closing>0);step(speech,.3);assert.equal(next,1);
});

test('replay cancels old completion and grants a fresh echo period without advancing twice',async()=>{
 const {speech,jobs}=fixture();let next=0;speech.start('start','bunny',()=>next++);step(speech,1);speech.replay();jobs[0]();await tick();assert.equal(speech.done,false);step(speech,4);assert.equal(next,0);jobs[1]();await tick();step(speech,2.2);assert.equal(next,1);speech.replay();assert.equal(jobs.length,2);
});

test('pause during exit animation resumes with a complete sentence instead of leaking a stale transition',async()=>{
 const {speech,jobs}=fixture();let next=0;speech.start('end','frog',()=>next++);jobs[0]();await tick();step(speech,4.05);assert.ok(speech.closing>0);speech.setPaused(true);step(speech,3);assert.equal(next,0);speech.setPaused(false);assert.equal(speech.closing,0);jobs[1]();await tick();step(speech,4.4);assert.equal(next,1);
});

test('natural phrase clips are static local assets, cover the entire sentence bank and preserve the originals',()=>{
 for(const p of Object.values(ANIMAL_PHRASES).flat()){
  assert.match(p.audio,/\/natural\//);assert.ok(fs.statSync('public'+p.audio).size>5000);assert.ok(fs.existsSync(`public/audio/phrases/${p.id}.mp3`));
 }
});
