import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import crypto from 'node:crypto';import {execFileSync} from 'node:child_process';
import {AudioManager} from '../src/audioManager.js';import {Game} from '../src/main.js';import {getWordById} from '../src/wordsConfig.js';import {withDeadline} from '../src/audioRecovery.js';
const wait=ms=>new Promise(r=>setTimeout(r,ms)),tick=async()=>{await Promise.resolve();await Promise.resolve();};
function deferred(){let resolve;return {promise:new Promise(r=>resolve=r),resolve:v=>resolve(v)};}
function fixture(){const events=[],g=Object.assign(Object.create(Game.prototype),{state:'PLAYING',prePauseState:'PLAYING',lifecycleSessionId:1,collectedCount:0,targetCount:5,
 uiManager:{showWordPopup(){},clearWordPopup(a){if(!a)events.push('clear');},setWordPopupPaused(){},showPause:()=>events.push('pause')},
 audioManager:{stopWord(){},playWord:()=>Promise.resolve(),pauseBGM(){},resumeBGM(){},playEnergyCharge(){},playAnimalSound(){},suspendForBackground:()=>events.push('suspend'),markForeground(){},recoverFromGesture(){}},
 poseDetector:{pause:()=>events.push('detector-pause'),resume(){}},bubbleManager:{update(){},hideHandIndicators(){},spawnNext:()=>events.push('next'),lastPoppedEnergy:1}});return {g,events};}
const step=(g,t)=>{for(let n=0;n<t-1e-6;n+=.02)g.updateFrame(.02);};
function audio(){const a=new AudioManager(),sources=[];a.init=()=>{};a.ctx={state:'running',currentTime:0,destination:{},createGain:()=>({connect(){},gain:{value:0}}),createBufferSource(){const source={connect(){},start(){},stop(){this.stopped=true;}};sources.push(source);return source;}};a.loadWordBuffer=async()=>({duration:2});return {a,sources};}

 test('voice profile and manifest preserve all accepted natural clips and their source text',()=>{
 const p=JSON.parse(fs.readFileSync('scripts/voice-profile.json'));assert.equal(p.voice,'af_heart');assert.equal(p.speed,.92);assert.equal(p.kokoro_version,'0.9.4');assert.equal(p.output_sample_rate,44100);
 const entries=JSON.parse(fs.readFileSync('docs/voice-manifest.json'));assert.equal(entries.length,13);for(const e of entries)for(const asset of e.assets)assert.equal(crypto.createHash('sha256').update(fs.readFileSync(asset.path)).digest('hex'),asset.sha256);
 assert.match(fs.readFileSync('AGENTS.md','utf8'),/VOICE_STANDARD/);assert.match(execFileSync('python3',['scripts/build-natural-phrases.py','--only','hello-play','--dry-run'],{encoding:'utf8'}),/KEEP hello-play/);
 });

 test('pending or rejected resume/decode promises have bounded outcomes',async()=>{assert.equal(await withDeadline(new Promise(()=>{}),10,'fallback'),'fallback');assert.equal(await withDeadline(Promise.reject(Error()),10,false),false);assert.equal(await withDeadline(Promise.resolve(3),10,null),3);});

 test('interrupted contexts are resumed; preload completion cannot resume audio while backgrounded',async()=>{
 const a=new AudioManager();let calls=0;a.initialized=true;a.ctx={state:'interrupted',resume(){calls++;this.state='running';return Promise.resolve();}};a.init();await tick();assert.equal(calls,1);assert.equal(await a.ensureRunning(),true);
 a.ctx.state='suspended';a._audioInBackground=true;a.init();assert.equal(calls,1);a.markForeground();a.init();assert.equal(calls,2);
 });

 test('an interrupted context that rejects resume falls back to independent HTML media',async()=>{
 const before=globalThis.Audio,instances=[];globalThis.Audio=class{constructor(){instances.push(this);}play(){return Promise.resolve();}pause(){}};
 try{const {a,sources}=audio();a.ctx.state='interrupted';a.ctx.resume=()=>Promise.reject(Error('interrupted'));const promise=a.playWord('egg');await wait(5);assert.equal(sources.length,0);assert.equal(instances.length,1);instances[0].onended();await promise;assert.equal(a.recoveryNeeded,true);}finally{globalThis.Audio=before;}
 });

 test('stalled audio clocks detach the buffer and use the media fallback exactly once',async()=>{
 const before=globalThis.Audio,instances=[];globalThis.Audio=class{constructor(){instances.push(this);}play(){return Promise.resolve();}pause(){}};
 try{const {a,sources}=audio();a.voiceStallTimeoutMs=20;const promise=a.playWord('egg');await wait(290);assert.equal(instances.length,1);assert.equal(sources[0].stopped,true);instances[0].onended();await promise;}finally{globalThis.Audio=before;}
 });

 test('a slow buffer load cannot start a second voice after startup fallback or cancellation',async()=>{
 const before=globalThis.Audio,instances=[];globalThis.Audio=class{constructor(){instances.push(this);}play(){return Promise.resolve();}pause(){}};
 try{const {a,sources}=audio(),load=deferred();a.voiceStartupTimeoutMs=10;a.loadWordBuffer=()=>load.promise;const promise=a.playWord('egg');await wait(25);assert.equal(instances.length,1);load.resolve({});await tick();assert.equal(sources.length,0);a.stopWord();await promise;assert.equal(a._activeWordElement,null);}finally{globalThis.Audio=before;}
 });

 test('mobile autoplay denial resolves instead of hanging and exposes a recovery action',async()=>{
 const before=globalThis.Audio;globalThis.Audio=class{play(){return Promise.reject(Object.assign(Error('tap required'),{name:'NotAllowedError'}));}pause(){}};
 try{const a=new AudioManager();a.init=()=>{};await a.playWord('egg');assert.equal(a.recoveryNeeded,true);assert.equal(a.lastVoiceStatus,'blocked');a.setMuted(true);assert.equal(a.recoveryNeeded,false);}finally{globalThis.Audio=before;}
 });

 test('missing ended events are bounded even in the homepage word library',async()=>{
 const {a}=audio();a.voiceTimeoutMs=20;const promise=a.playWord('egg');await wait(35);await promise;assert.equal(a.lastVoiceStatus,'timeout');assert.equal(a._activeWordSource,null);assert.equal(a.recoveryNeeded,true);
 });

 test('a recovery tap rebuilds a broken context while preserving decoded assets',async()=>{
 const before=globalThis.window;let closed=0;globalThis.window={AudioContext:class{constructor(){this.state='running';this.currentTime=0;}}};
 try{const a=new AudioManager();a.preloadWordAudios=()=>{};a.ctx={state:'interrupted',close(){closed++;return Promise.resolve();}};a.initialized=true;a._wordAudioBuffers.set('egg',{cached:true});assert.equal(await a.recoverFromGesture({rebuild:true}),true);assert.equal(closed,1);assert.equal(a.ctx.state,'running');assert.equal(a._wordAudioBuffers.get('egg').cached,true);}finally{globalThis.window=before;}
 });

 test('duplicate pause and background events preserve the original resume destination',()=>{
 const {g}=fixture();g.handleTogglePause(true);g.handleTogglePause(true);assert.equal(g.prePauseState,'PLAYING');g.handlePageBackground();g.handlePageBackground();assert.equal(g.prePauseState,'PLAYING');g.handleResume();assert.equal(g.state,'PLAYING');
 });

 test('backgrounding a soft wait turns it into a real pause and ignores late pose frames',()=>{
 const {g,events}=fixture();g.isSoftWaiting=true;g.state='PAUSED';g.prePauseState='PLAYING';g.handlePageBackground();assert.equal(g.isSoftWaiting,false);assert.ok(events.includes('detector-pause'));assert.ok(events.includes('suspend'));
 g.poseDetector={};g.setupPoseCallbacks();g.poseDetector.onResultsCallback({players:[{id:1}],isDemo:false});assert.equal(g.state,'PAUSED');assert.deepEqual(g.lastPlayers,[]);
 });

 test('a word survives background pause and completes exactly once after a replay',async()=>{
 const {g,events}=fixture(),old=deferred(),again=deferred();g.audioManager.playWord=()=>again.promise;g.presentWord(getWordById('egg'),.5,.5,old.promise);g.onBubblePopped();g.handlePageBackground();old.resolve();await tick();step(g,10);assert.equal(g.wordElapsed,0);g.handlePageForeground();g.handleResume();step(g,2);assert.ok(g.currentWord);again.resolve();await tick();step(g,2);assert.equal(g.currentWord,null);assert.equal(events.filter(e=>e==='next').length,1);assert.equal(g.collectedCount,1);
 });

 test('jittering fingertip re-entry cannot replay forever or keep a word card stuck',async()=>{
 const {g,events}=fixture();g.uiManager.getWordReplayTarget=()=>({x:100,y:100,width:80,height:80});let touching=false,replays=0;g.bubbleManager.getInteractionTips=()=>touching?[{px:100,py:100}]:[];
 g.audioManager.playWord=()=>{replays++;return Promise.resolve();};g.presentWord(getWordById('egg'),.5,.5,Promise.resolve());g.onBubblePopped();await tick();step(g,1);touching=true;step(g,.4);await tick();
 for(let i=0;i<30;i++){touching=i%2===0;step(g,.4);await tick();}
 assert.equal(replays,1);assert.equal(g.currentWord,null);assert.equal(g.collectedCount,1);assert.equal(events.filter(e=>e==='next').length,1);
 });

 test('manual replay remains available after a gesture replay and never adds score',async()=>{
 const {g}=fixture();g.presentWord(getWordById('egg'),.5,.5,Promise.resolve());g.collectedCount=1;g.replayWord({gesture:true});await tick();assert.equal(g.wordGestureReplayCount,1);g.replayWord();await tick();assert.equal(g.wordGestureReplayCount,1);assert.equal(g.collectedCount,1);
 });

 test('a stale resume cannot re-show recovery after a newer successful recovery',async()=>{
 const a=new AudioManager(),first=deferred();a.init=()=>{};let n=0;a.ensureRunning=()=>++n===1?first.promise:Promise.resolve(true);
 const old=a.recoverFromGesture();assert.equal(await a.recoverFromGesture(),true);first.resolve(false);await old;assert.equal(a.recoveryNeeded,false);
 });

 test('HTML playback that starts without advancing its clock also exposes recovery instead of hanging',async()=>{
 const before=globalThis.Audio;globalThis.Audio=class{constructor(){this.currentTime=0;this.ended=false;}play(){return Promise.resolve();}pause(){}};
 try{const a=new AudioManager();a.init=()=>{};a.voiceStallTimeoutMs=20;const promise=a.playWord('egg');await wait(290);await promise;assert.equal(a.lastVoiceStatus,'stalled');assert.equal(a.recoveryNeeded,true);}finally{globalThis.Audio=before;}
 });
