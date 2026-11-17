import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {ResourceWarmup} from '../src/resourceWarmup.js';
import {WordLibrary} from '../src/wordLibrary.js';
import {BubbleManager} from '../src/bubbleManager.js';

test('opening the library aborts idle camera transfer before category work begins',async()=>{
  const oldDocument=globalThis.document,oldFetch=globalThis.fetch;
  const requests=[];
  globalThis.document={hidden:false};
  globalThis.fetch=(url,{signal})=>new Promise((resolve,reject)=>{
    requests.push(url);
    signal.addEventListener('abort',()=>reject(Object.assign(new Error('cancelled'),{name:'AbortError'})),{once:true});
  });
  try{
    const warmup=Object.assign(Object.create(ResourceWarmup.prototype),{
      mode:'home',generation:0,finished:new Set(),poseDetector:null,schedule(){}
    });
    const pending=warmup.warm(0);
    await Promise.resolve();
    assert.equal(requests.length,1);
    assert.match(requests[0],/tracking-worker\.js$/);
    warmup.setMode('library');
    await pending;
    assert.equal(requests.length,1);
    assert.equal(warmup.mode,'library');
  }finally{
    if(oldDocument===undefined)delete globalThis.document;else globalThis.document=oldDocument;
    globalThis.fetch=oldFetch;
  }
});

test('a camera engine already in memory leaves idle bandwidth for a small word preview only',async()=>{
  const oldDocument=globalThis.document,oldFetch=globalThis.fetch;
  const requests=[];
  globalThis.document={hidden:false};
  globalThis.fetch=async url=>{requests.push(url);return {ok:true,arrayBuffer:async()=>new ArrayBuffer(0)};};
  try{
    const warmup=Object.assign(Object.create(ResourceWarmup.prototype),{
      mode:'home',generation:0,finished:new Set(),poseDetector:{worker:{}},controller:null
    });
    await warmup.warm(0);
    assert.equal(requests.length,8);
    assert.ok(requests.every(url=>url.includes('/images/words/')));
  }finally{
    if(oldDocument===undefined)delete globalThis.document;else globalThis.document=oldDocument;
    globalThis.fetch=oldFetch;
  }
});

test('a newly visible card cuts ahead of category background audio without waiting for old work',async()=>{
  const started=[],done=[];
  const library=Object.assign(Object.create(WordLibrary.prototype),{
    overlay:{},preloadToken:1,preloadQueue:['chair','table','pencil'],preloadSeen:new Set(),preloadActive:0,
    audio:{loadWordBuffer:id=>{started.push(id);return new Promise(resolve=>done.push(resolve));}}
  });
  library.pumpAudioPreload(1);
  assert.deepEqual(started,['chair','table']);
  library.prioritizeAudio('sunny');
  done[0]();await Promise.resolve();await Promise.resolve();
  assert.deepEqual(started,['chair','table','sunny']);
  library.preloadToken++;library.preloadQueue=[];
  done[1]();await Promise.resolve();await Promise.resolve();
  assert.equal(started.length,3);
});

test('the first round reuses the words prepared during start instead of rerolling after calibration',()=>{
  const camera=new THREE.PerspectiveCamera(48,1,.1,100);
  camera.position.z=7.5;camera.updateMatrixWorld();
  const manager=new BubbleManager(new THREE.Scene(),camera,{},null);
  manager.prepareWordRound(6);
  const expected=manager.preparedWordRound.pool.map(word=>word.id);
  assert.equal(expected.length,3);
  manager.clear();manager.beginWordRound(6);
  assert.deepEqual(manager.wordPool.map(word=>word.id),expected);
  assert.equal(manager.preparedWordRound,null);
});
