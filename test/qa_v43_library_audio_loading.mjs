import test from 'node:test';
import assert from 'node:assert/strict';
import {AudioManager} from '../src/audioManager.js';
import {WordLibrary} from '../src/wordLibrary.js';

const deferred=()=>{let resolve;return {promise:new Promise(r=>resolve=r),resolve};};
const flush=async()=>{for(let i=0;i<8;i++)await Promise.resolve();};

test('a response with stalled body is aborted, releases its cache slot and can be retried',async()=>{
  const saved=globalThis.fetch,late=deferred();let signal,decodes=0,requests=0;
  const audio=new AudioManager();audio.wordLoadTimeoutMs=20;audio.init=()=>{};
  audio.ctx={decodeAudioData:async()=>{decodes++;return {duration:1};}};
  globalThis.fetch=async(_url,options)=>{
    signal=options.signal;requests++;
    return {ok:true,arrayBuffer:()=>requests===1?late.promise:Promise.resolve(new ArrayBuffer(4))};
  };
  try{
    assert.equal(await audio.loadWordBuffer('chair',{review:true}),null);
    assert.equal(signal.aborted,true);assert.equal(audio._wordAudioPromises.size,0);
    assert.equal(decodes,0);
    late.resolve(new ArrayBuffer(4));await flush();assert.equal(decodes,0);
    assert.deepEqual(await audio.loadWordBuffer('chair',{review:true}),{duration:1});
    assert.equal(requests,2);assert.equal(decodes,1);
  }finally{globalThis.fetch=saved;}
});

test('synchronous download errors do not leave a permanently failed promise in the cache',async()=>{
  const saved=globalThis.fetch;globalThis.fetch=()=>{throw Error('offline');};
  try{
    const audio=new AudioManager();
    assert.equal(await audio.loadWordBuffer('chair'),null);
    assert.equal(audio._wordAudioPromises.size,0);
  }finally{globalThis.fetch=saved;}
});

test('previous-category completions release their slots for the current category',async()=>{
  const pending=[],started=[];
  const library=Object.assign(Object.create(WordLibrary.prototype),{
    overlay:{},preloadToken:1,preloadQueue:['chair','table'],preloadSeen:new Set(),preloadActive:0,
    audio:{loadWordBuffer:id=>{started.push(id);const job=deferred();pending.push(job);return job.promise;}}
  });
  library.pumpAudioPreload(1);
  library.preloadToken=2;library.preloadQueue=['red','blue'];
  library.pumpAudioPreload(2);assert.deepEqual(started,['chair','table']);
  pending[0].resolve();await flush();assert.deepEqual(started,['chair','table','red']);
  assert.equal(library.preloadActive,2);
  library.overlay=null;library.preloadToken++;library.preloadQueue=[];
  pending[1].resolve();pending[2].resolve();await flush();
  assert.equal(library.preloadActive,0);assert.equal(started.length,3);
});

test('a failed voice shows retry feedback and stale completion cannot clear the next card',async()=>{
  const pending=[],marked=new Set(),card=id=>({classList:{add:()=>marked.add(id),remove:()=>marked.delete(id)}});
  const library=new WordLibrary({isMuted:false,lastVoiceStatus:'timeout',recoverFromGesture(){}},()=>{},{
    stopWord(){},playWord(){const job=deferred();pending.push(job);return job.promise;}
  });
  library.status={textContent:''};
  const first=library.playWord({id:'chair',word:'chair',zh:'椅子'},card('chair'));
  const next=library.playWord({id:'red',word:'red',zh:'红色'},card('red'));
  pending[0].resolve();await first;
  assert.match(library.status.textContent,/red/);assert.deepEqual([...marked],['red']);
  pending[1].resolve();await next;
  assert.match(library.status.textContent,/重试/);assert.equal(marked.size,0);
});
