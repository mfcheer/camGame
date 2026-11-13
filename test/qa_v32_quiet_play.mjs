import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {SpeechPolicy,AUTO_ENGLISH_KEY} from '../src/speechPolicy.js';
import {VoiceQueue} from '../src/voiceQueue.js';
import {Game} from '../src/main.js';
import {BubbleManager,getBaseBubbleDiameter} from '../src/bubbleManager.js';
import {getWordById} from '../src/wordsConfig.js';
const tick=async()=>{for(let i=0;i<8;i++)await Promise.resolve();};
function fixture(enabled=false){
  const policy=new SpeechPolicy(null);policy.setAutomatic(enabled);
  const calls=[],jobs=[],audio={playWord(id,options){calls.push({id,options});return new Promise(resolve=>jobs.push(resolve));},playPhrase(phrase){calls.push({phrase});return new Promise(resolve=>jobs.push(resolve));},stopWord(){jobs.at(-1)?.();},recoverFromGesture(){}};
  const queue=new VoiceQueue(audio,policy);
  const g=Object.assign(Object.create(Game.prototype),{state:'PLAYING',collectedCount:0,targetCount:5,speechPolicy:policy,voiceQueue:queue,audioManager:audio,activeAnimalId:'cat',bubbleManager:{lastPoppedEnergy:1},uiManager:{setLastWordAvailable(){},showWordCue(){},clearWordCue(){}}});
  return {g,policy,queue,audio,calls,jobs};
}

test('fresh and inaccessible storage default to no automatic speech; only the explicit new setting persists',()=>{
  const values=new Map(),storage={getItem:k=>values.get(k),setItem:(k,v)=>values.set(k,v)};
  const first=new SpeechPolicy(storage);assert.equal(first.automaticEnabled,false);first.setAutomatic(true);
  assert.equal(values.get(AUTO_ENGLISH_KEY),'true');assert.equal(new SpeechPolicy(storage).automaticEnabled,true);
  first.setAutomatic(false);assert.equal(new SpeechPolicy(storage).automaticEnabled,false);
  const locked=new SpeechPolicy({getItem(){throw Error('blocked');},setItem(){throw Error('blocked');}});locked.setAutomatic(true);assert.equal(locked.automaticEnabled,true);
});

test('default pops retain the latest word for deliberate point-reading without making speech or a cue',async()=>{
  const {g,calls,policy}=fixture();await g.presentPlayWord(getWordById('egg'));await g.presentPlayWord(getWordById('cup'));
  assert.equal(g.lastPlayWord.id,'cup');assert.equal(g.cueWord,undefined);assert.equal(calls.length,0);assert.equal(policy.spokenThisRound,0);
});

test('many rapid pops speak once per round and never enqueue or prolong the matching picture',async()=>{
  const {g,calls,jobs,queue,policy}=fixture(true);const first=g.presentPlayWord(getWordById('egg'));
  await g.presentPlayWord(getWordById('cup'));await g.presentPlayWord(getWordById('cat'));
  assert.equal(calls.length,1);assert.equal(queue.pendingWord,null);assert.equal(g.cueWord.id,'egg');assert.equal(policy.spokenThisRound,1);
  policy.update(2);jobs[0]();await first;assert.equal(g.wordCueRemaining,.65);
  policy.update(20);await g.presentPlayWord(getWordById('cup'));assert.equal(calls.length,1);
});

test('the twelve-second interval starts at voice completion, persists across rounds and cannot be bypassed by enabling again',async()=>{
  const {queue,policy,jobs,calls}=fixture(true);const first=queue.playAutomaticWord('egg');policy.update(10);jobs[0]();await first;
  policy.beginRound();policy.update(11.9);await queue.playAutomaticWord('cup');assert.equal(calls.length,1);assert.equal(policy.spokenThisRound,0);
  policy.setAutomatic(false);policy.setAutomatic(true);await queue.playAutomaticWord('cup');assert.equal(calls.length,1);
  policy.update(.11);const second=queue.playAutomaticWord('cup');assert.equal(calls.length,2);jobs[1]();await second;
});

test('a busy manual phrase skips an automatic opportunity without using its budget or starting a backlog',async()=>{
  const {queue,policy,jobs,calls}=fixture(true);const manual=queue.playPhrase({id:'hello-play'});
  await queue.playAutomaticWord('egg');assert.equal(queue.pendingWord,null);assert.equal(policy.spokenThisRound,0);
  jobs[0]();await manual;await queue.playAutomaticWord('egg');assert.equal(calls.length,1);
  policy.update(12);const next=queue.playAutomaticWord('egg');assert.equal(calls.length,2);jobs[1]();await next;
});

test('manual reading interrupts automatic speech, keeps bilingual options and resets the shared quiet interval',async()=>{
  const {queue,policy,jobs,calls}=fixture(true);queue.playAutomaticWord('egg');policy.update(1);
  const manual=queue.playManualWord('cup',{review:false});assert.deepEqual(calls[1],{id:'cup',options:{review:false}});
  await tick();assert.equal(queue.current.value,'cup');policy.update(2);jobs[1]();await manual;policy.beginRound();
  policy.update(11);await queue.playAutomaticWord('cat');assert.equal(calls.length,2);
});

test('pause discards automatic speech and old completion; resuming never starts it again',async()=>{
  const {g,queue,jobs,calls}=fixture(true);const spoken=g.presentPlayWord(getWordById('egg'));
  queue.pause({discard:true});g.clearPlayWordCue();g.state='PAUSED';await spoken;
  queue.resume();queue.resumePending();g.state='PLAYING';jobs[0]();await tick();
  assert.equal(calls.length,1);assert.equal(queue.resumeWord,null);assert.equal(queue.current,null);assert.equal(g.wordCueRemaining,0);
});

test('disabling automatic English stops its current word and cue immediately without disabling picture bubbles',async()=>{
  const {g,queue,calls}=fixture(true);const spoken=g.presentPlayWord(getWordById('egg'));g.setAutomaticEnglish(false);await spoken;
  assert.equal(queue.current,null);assert.equal(g.wordCueRemaining,0);await g.presentPlayWord(getWordById('cup'));assert.equal(calls.length,1);
  const camera=new T.PerspectiveCamera(48,1,.1,100);camera.position.z=7.5;camera.updateMatrixWorld();
  const bubbles=new BubbleManager(new T.Scene(),camera,{},null);bubbles.createBubble(0);assert.ok(bubbles.activeBubble.word?.id);
});

test('the final hit and the pet stage have no automatic voice that could cross the transition',async()=>{
  const {g,calls}=fixture(true);g.collectedCount=4;await g.presentPlayWord(getWordById('egg'));assert.equal(calls.length,0);
  g.state='CELEBRATING';g.collectedCount=0;await g.presentPlayWord(getWordById('cat'));assert.equal(calls.length,0);
});

test('only active game and pet time count toward quiet intervals, not paused, home or results time',()=>{
  const {g,policy}=fixture();g.sceneManager={render(){},update(){}};g.bubbleManager.update=()=>{};
  g.state='START';g.updateFrame(30);assert.equal(policy.activeSeconds,0);
  g.state='PAUSED';g.updateFrame(30);assert.equal(policy.activeSeconds,0);
  g.state='PLAYING';g.updateFrame(2);assert.equal(policy.activeSeconds,2);
  g.state='CELEBRATING';g.updateFrame(3);assert.equal(policy.activeSeconds,5);
  g.resultVisible=true;g.updateFrame(20);assert.equal(policy.activeSeconds,5);
});

test('animal sentences are requested explicitly and cancel older word pictures',()=>{
  const {g}=fixture();const phases=[];g.animalSpeech={start:(phase,id)=>phases.push([phase,id])};
  g.hearAnimal();assert.deepEqual(phases,[['start','cat']]);g.state='CELEBRATING';g.hearAnimal();assert.deepEqual(phases[1],['end','cat']);
  g.resultVisible=true;g.hearAnimal();g.state='PAUSED';g.hearAnimal();assert.equal(phases.length,2);
});

test('sound recovery does not turn a remembered picture into unsolicited speech',()=>{
  const {g,calls}=fixture(true);g.lastPlayWord=getWordById('egg');g.recoverAudio();assert.equal(calls.length,0);
});

test('muted or blocked sound skips automatic opportunities without consuming the round budget',async()=>{
  const {queue,policy,audio,calls,jobs}=fixture(true);audio.isMuted=true;await queue.playAutomaticWord('egg');audio.isMuted=false;
  audio.recoveryNeeded=true;await queue.playAutomaticWord('egg');assert.equal(calls.length,0);assert.equal(policy.spokenThisRound,0);
  audio.recoveryNeeded=false;const spoken=queue.playAutomaticWord('egg');assert.equal(calls.length,1);jobs[0]();await spoken;
});

test('an old cancelled voice cannot clear the new round cue or reset its quiet clock',async()=>{
  const {g,queue,policy,jobs}=fixture(true);const old=g.presentPlayWord(getWordById('egg'));
  queue.cancel();g.clearPlayWordCue();policy.beginRound();policy.update(12);
  const next=g.presentPlayWord(getWordById('cup'));jobs[0]();await old;
  assert.equal(g.cueWord.id,'cup');assert.equal(g.wordCueRemaining,Infinity);assert.notEqual(policy.speakingToken,null);
  jobs[1]();await next;assert.equal(g.wordCueRemaining,.65);assert.equal(policy.speakingToken,null);
});


test('11-inch tablet targets are larger and consistent across rotation, with room for browser bars',()=>{
  for(const [w,h] of [[834,1194],[820,1180],[834,1210],[744,1194]]){
    assert.ok(getBaseBubbleDiameter(w,h)>=210);assert.equal(getBaseBubbleDiameter(w,h),getBaseBubbleDiameter(h,w));
  }
  assert.equal(getBaseBubbleDiameter(390,844),100);assert.ok(getBaseBubbleDiameter(667,240)<80);
  assert.equal(getBaseBubbleDiameter(1280,720),144);
  const original=globalThis.window;
  try{globalThis.window={matchMedia:()=>({matches:true})};assert.ok(getBaseBubbleDiameter(1194,714)>=210);}
  finally{if(original===undefined)delete globalThis.window;else globalThis.window=original;}
});

test('expanded tablet bubbles and special targets stay on screen for all six animals in both orientations',()=>{
  const original=globalThis.window;
  try{
    for(const [width,height] of [[834,1194],[1194,834],[820,1180],[1180,820],[1194,744],[1194,650]]){
      globalThis.window={innerWidth:width,innerHeight:height,matchMedia:()=>({matches:true})};
      const camera=new T.PerspectiveCamera(48,width/height,.1,100);camera.position.z=7.5;camera.updateMatrixWorld();
      for(const animalId of ['bunny','cat','frog','dog','dragon','goldenDragon'])for(const type of ['normal','rainbow','jelly','coop_heart']){
        const bubbles=new BubbleManager(new T.Scene(),camera,{},null,{animalId,targetEnergy:12});if(type==='coop_heart')bubbles.setPlayerMode('coop');
        bubbles.createBubble(1,type);const group=bubbles.activeBubble.group;group.scale.setScalar(1.25*1.13);group.updateWorldMatrix(true,true);
        group.traverse(mesh=>{if(!mesh.isMesh||!mesh.visible)return;const vertices=mesh.geometry.attributes.position;
          for(let n=0;n<vertices.count;n++){const p=new T.Vector3().fromBufferAttribute(vertices,n).applyMatrix4(mesh.matrixWorld).project(camera);
            assert.ok(p.x>=-1&&p.x<=1&&p.y>=-1&&p.y<=1,`${width}x${height} ${animalId} ${type} clipped`);
          }
        });bubbles.clear();
      }
    }
  }finally{if(original===undefined)delete globalThis.window;else globalThis.window=original;}
});
