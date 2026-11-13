import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {WORDS_LIST,getWordById} from '../src/wordsConfig.js';
import {CLASSROOM_WORDS,CLASSROOM_NEW_WORDS} from '../src/classroomVocabulary.js';
import {mergeVocabulary} from '../src/vocabularyMerge.js';
import {ANIMAL_PHRASES,chooseAnimalPhrase} from '../src/animalPhrases.js';
import {AnimalSpeech} from '../src/animalSpeech.js';
import {AudioManager} from '../src/audioManager.js';
import {Game} from '../src/main.js';
const tick=async()=>{await Promise.resolve();await Promise.resolve();};
function deferred(){let resolve;return {promise:new Promise(r=>resolve=r),resolve:()=>resolve()};}
function fixture(){const jobs=[],events=[],audio={playPhrase:p=>{const job=deferred();jobs.push(job);events.push(p.id);return job.promise;},stopPhrase(){}},ui={showAnimalSpeech(){},hideAnimalSpeech(){}},animal={setSpeaking(){}};return {speech:new AnimalSpeech(audio,ui,animal),jobs,events};}
function step(s,time){for(let t=0;t<time;t+=.02)s.update(.02);}

test('teacher messages add exactly eight imageable words, without repeated lessons or metadata',()=>{
 assert.equal(WORDS_LIST.length,47);assert.equal(CLASSROOM_NEW_WORDS.length,8);
 const imported=mergeVocabulary(WORDS_LIST,CLASSROOM_WORDS,CLASSROOM_WORDS);assert.equal(imported.length,47);
 for(const id of ['happy','sunny','fast','slow','tuesday','nov','tap','play'])assert.equal(getWordById(id),null);
 for(const id of ['egg','elbow','envelope','elephant','cup','computer','mooncake','orange'])assert.equal(getWordById(id).word,id);
 assert.equal(getWordById('orange').zh,'橙色');assert.equal(getWordById('orange').category,'colors');
 assert.equal(getWordById('car').sources.filter(s=>s.kind==='teacher-message').length,2);
 assert.equal(getWordById('EGGS.').id,'egg');assert.equal(getWordById('elephants').id,'elephant');
});

test('all imported cards and bilingual/review audio exist, all themes support four distinct concepts',()=>{
 for(const w of CLASSROOM_NEW_WORDS)for(const asset of [w.image,w.audio,w.reviewAudio])assert.ok(fs.statSync('public'+asset).size>300,asset);
 for(const category of new Set(WORDS_LIST.map(w=>w.category)))assert.ok(new Set(WORDS_LIST.filter(w=>w.category===category).map(w=>w.conceptId||w.id)).size>=4,category);
 const manifest=JSON.parse(fs.readFileSync('public/images/words/words-manifest.json'));assert.equal(manifest.length,47);
});

test('phrases are short, recorded, grounded in known words and vary without immediate repetition',()=>{
 for(const p of Object.values(ANIMAL_PHRASES).flat()){assert.ok(p.en.split(' ').length<=6);assert.ok(p.zh);assert.ok(fs.statSync('public'+p.audio).size>2000);for(const id of p.wordIds)assert.ok(getWordById(id));}
 for(const id of ['bunny','cat','dog','frog','dragon','goldenDragon'])for(const phase of ['start','end']){const a=chooseAnimalPhrase(phase,id,null,()=>0);assert.notEqual(chooseAnimalPhrase(phase,id,a.id,()=>0).id,a.id);}
});

test('greeting waits for actual speech ending and a quiet beat before spawning one target',async()=>{
 const {speech,jobs}=fixture();let spawned=0;speech.start('start','cat',()=>spawned++);step(speech,4);assert.equal(spawned,0);jobs[0].resolve();await tick();step(speech,.3);assert.equal(spawned,0);step(speech,1.9);assert.equal(spawned,1);step(speech,8);assert.equal(spawned,1);
});

test('pause hides/stops speech, freezes time, and replays on resume; stale completion cannot advance',async()=>{
 const {speech,jobs}=fixture();let next=0;speech.start('end','dog',()=>next++);step(speech,.4);speech.setPaused(true);const elapsed=speech.elapsed;jobs[0].resolve();await tick();step(speech,10);assert.equal(speech.elapsed,elapsed);assert.equal(next,0);speech.setPaused(false);step(speech,2);assert.equal(speech.done,false);jobs[1].resolve();await tick();step(speech,2.4);assert.equal(next,1);
});

test('restart and exit discard old speech callbacks; a failed voice cannot trap the child',async()=>{
 const {speech,jobs}=fixture();let old=0,next=0;speech.start('start','bunny',()=>old++);speech.cancel();jobs[0].resolve();await tick();step(speech,10);assert.equal(old,0);
 speech.start('start','frog',()=>next++);step(speech,12.4);assert.equal(next,1);assert.equal(speech.active,false);
});

test('greetings and farewells run alongside spawning and escape instead of gating them',()=>{
 const calls=[],g=Object.assign(Object.create(Game.prototype),{state:'PLAYING',activeAnimalId:'cat',collectedCount:0,bubbleManager:{spawnNext:()=>calls.push('bubble')},animalSpeech:{start:(phase,id,done)=>calls.push({phase,id,done})}});
 g.beginRoundGreeting();assert.equal(calls[0].phase,'start');assert.equal(calls[1],'bubble');calls[0].done();assert.equal(calls.length,2);
 g.beginFarewell=()=>calls.push('hat-and-escape');g.startFarewell();assert.equal(calls[2],'hat-and-escape');assert.equal(calls[3].phase,'end');calls[3].done();assert.equal(calls.length,4);
 g.bubbleManager.wordMode=false;g.beginRoundGreeting();g.startFarewell();assert.deepEqual(calls.slice(-2),['bubble','hat-and-escape']);
});

test('phrase and word buffers never collide; speech fallback reads exactly the English sentence',async()=>{
 const a=new AudioManager(),p=ANIMAL_PHRASES.start[0],urls=[],before=globalThis.fetch;
 a.init=()=>{};a.ctx={decodeAudioData:async()=>({})};globalThis.fetch=async url=>{urls.push(url);return {ok:true,arrayBuffer:async()=>new ArrayBuffer(1)};};
 try{await a.loadWordBuffer('egg');await a.loadWordBuffer(p.id,{phrase:p});assert.deepEqual(urls,['/audio/words/egg.mp3',p.audio]);assert.equal(a._wordAudioBuffers.size,2);}finally{globalThis.fetch=before;}
 const prev={window:globalThis.window,U:globalThis.SpeechSynthesisUtterance},spoken=[];globalThis.window={speechSynthesis:{speak:u=>spoken.push(u.text)}};globalThis.SpeechSynthesisUtterance=class{constructor(text){this.text=text;}};
 try{a._speakWordFallback(p.id,()=>{},false,p);assert.deepEqual(spoken,[p.en]);}finally{if(prev.window===undefined)delete globalThis.window;else globalThis.window=prev.window;if(prev.U===undefined)delete globalThis.SpeechSynthesisUtterance;else globalThis.SpeechSynthesisUtterance=prev.U;}
});
