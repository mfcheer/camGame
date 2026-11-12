import assert from 'node:assert/strict';
import * as THREE from 'three';
import fs from 'node:fs';
import { PoseDetector } from '../src/poseDetector.js';
import { BubbleManager } from '../src/bubbleManager.js';
globalThis.window={innerWidth:1280,innerHeight:720,addEventListener(){}};
globalThis.requestAnimationFrame=()=>1;
const {Game}=await import('../src/main.js');
const nativePerformance=globalThis.performance;
let now=1000,timers=new Map(),seq=0;
globalThis.performance={now:()=>now};
globalThis.setTimeout=(fn,ms)=>{timers.set(++seq,{fn,ms});return seq;};
globalThis.clearTimeout=id=>timers.delete(id);
function fixture(){
 now=1000;timers.clear();
 const camera=new THREE.PerspectiveCamera(48,16/9,.1,1000);camera.position.z=7.5;camera.updateMatrixWorld();
 const pose=new PoseDetector({srcObject:null});
 const audio={init(){},playCelebration(){}};
 const bubble=new BubbleManager(new THREE.Scene(),camera,audio,{});
 const ui=new Proxy({},{get:()=>()=>{}});
 const g=Object.assign(Object.create(Game.prototype),{state:'START',playerMode:'single',isDemoMode:false,lifecycleSessionId:0,poseDetector:pose,bubbleManager:bubble,audioManager:audio,uiManager:ui,balloon:{reset(){},startTakeoff(){}},targetCount:5});
 g.setupPoseCallbacks();return g;
}
function points(center,visibility=1){const p=Array.from({length:33},()=>({x:1-center,y:.5,visibility}));p[11].x-=.04;p[12].x+=.04;return p;}
function deferred(){let resolve;const promise=new Promise(r=>resolve=r);return {promise,resolve};}
const results=[];
async function check(name,fn){try{await fn();results.push({name,pass:true});}catch(e){results.push({name,pass:false,actual:e.message});}}
await check('庆祝消耗2秒、暂停跨20秒后剩3秒，恢复一次结算；退出取消旧回调',()=>{
 const g=fixture();let won=0;g.uiManager=new Proxy({showVictory(){won++;}},{get:(t,k)=>t[k]||(()=>{})});
 g.handleVictory();now+=2000;g.handleTogglePause(true);assert.equal(g.celebrationRemainingMs,3000);assert.equal(timers.size,0);
 now+=20000;g.handleResume();assert.equal([...timers.values()][0].ms,3000);[...timers.values()][0].fn();assert.equal(won,1);
 g.handleVictory();const old=[...timers.values()].at(-1).fn;g.handleExit();old();assert.equal(won,1);
});
await check('单人模式平滑无缝换人：原玩家离框后新玩家入框自动平滑转移控制权',()=>{
 const g=fixture(),p=g.poseDetector;p.processLandmarks({landmarks:[points(.30)]});p.lockPlayers(p.trackedPlayers,'single');
 p.processLandmarks({landmarks:[points(.55)]});assert.equal(p.trackedPlayers.length,1,'新玩家入框后应平滑转移控制权继续追踪');
 assert.ok(Math.abs(p.trackedPlayers[0].centerX-.55)<.1,'控制权应平滑转移至新玩家');
});
await check('低可见度且无有效手的姿态不能完成舒适伸手校准',()=>{
 const p=fixture().poseDetector;p.processLandmarks({landmarks:[points(.5,0)]});assert.equal(p.getCalibrationStatus('single').ready,false,`hands=${p.trackedPlayers[0]?.hands.length} 时仍就绪`);
});
await check('就绪门禁必须确认引擎和摄像头已运行',()=>{
 const g=fixture();g.state='CALIBRATING';g.poseDetector.processLandmarks({landmarks:[points(.5)]});assert.equal(g.poseDetector.status,'uninitialized');
 assert.equal(g.handleReadyToPlay(),false,'uninitialized / 无stream 仍进入PLAYING');
});
await check('单人下方舒适区生成目标保持在已校准区内',()=>{
 const g=fixture(),b=g.bubbleManager;const cz={minX:.40,maxX:.60,minY:.65,maxY:.80};b.setPlayerComfortZones([{id:1,centerX:.5,comfortZone:cz}]);
 const pos=b.calculateSpawnPosition().project(b.camera);const y=(1-pos.y)/2;assert.ok(y>=cz.minY&&y<=cz.maxY,`目标y=${y.toFixed(3)}，校准区y=[.65,.80]`);
});
await check('双人同在画面左侧，轮换目标仍留在各自舒适区',()=>{
 const b=fixture().bubbleManager;b.setPlayerMode('coop');const cz={minX:.15,maxX:.35,minY:.25,maxY:.40};b.setPlayerComfortZones([{id:1,centerX:.12,comfortZone:cz},{id:2,centerX:.32,comfortZone:cz}]);
 const pos=b.calculateSpawnPosition().project(b.camera);const x=(pos.x+1)/2;assert.ok(x>=cz.minX&&x<=cz.maxX,`目标x=${x.toFixed(3)}，两位玩家均在左侧`);
});
await check('旧请求失败不得将退出后的START覆盖成ERROR',async()=>{
 const g=fixture(),d=deferred();g.poseDetector.init=async()=>{await d.promise;g.poseDetector.onErrorCallback(new Error('旧轮模型失败'));return false;};
 const start=g.handleStart('single');g.handleExit();d.resolve();await start;assert.equal(g.state,'START');
});
await check('旧摄像头请求结束不得停止已就绪的新轮摄像头',async()=>{
 const g=fixture(),d=deferred();g.poseDetector.init=async()=>true;let n=0;
 g.poseDetector.startCamera=async()=>{if(++n===1){await d.promise;}else{g.poseDetector.stream={getTracks:()=>[]};g.poseDetector.isRunning=true;}return true;};
 const old=g.handleStart('single');await Promise.resolve();g.handleExit();await g.handleStart('single');assert.equal(g.poseDetector.isRunning,true);
 d.resolve();await old;assert.equal(g.poseDetector.isRunning,true,'旧请求清理共享poseDetector，关闭了新轮');
});
await check('退出后晚到的真实startCamera结果不可绑定或启用轨道',async()=>{
 const g=fixture(),d=deferred();let stopped=0;const track={stop(){stopped++;}};
 Object.defineProperty(globalThis,'navigator',{configurable:true,value:{mediaDevices:{getUserMedia:()=>d.promise}}});
 g.poseDetector.video.play=()=>Promise.resolve();g.poseDetector.init=async()=>true;
 const run=g.handleStart('single');await Promise.resolve();g.handleExit();d.resolve({getTracks:()=>[track]});await Promise.resolve();await Promise.resolve();
 assert.equal(g.poseDetector.video.srcObject,null,`退出后重新绑定stream；stop次数=${stopped}，仍在等metadata`);
});
await check('演示退出再摄像头开始必须清除演示标志',async()=>{
 const g=fixture();g.handleEnableDemo('single');g.handleExit();g.poseDetector.init=async()=>true;g.poseDetector.startCamera=async()=>true;await g.handleStart('single');
 assert.equal(g.isDemoMode,false,'Game.isDemoMode仍为true，可绕过人数和就绪校验');
});
await check('390x844和1280x720最大助力半径四边可见',()=>{
 for(const [w,h] of [[390,844],[1280,720]]){const b=fixture().bubbleManager;b.camera.aspect=w/h;b.camera.updateProjectionMatrix();
 for(let i=0;i<20;i++){const p=b.calculateSpawnPosition();for(const [x,y] of [[1.3075,0],[-1.3075,0],[0,1.3075],[0,-1.3075]]){const edge=p.clone().add(new THREE.Vector3(x,y,0)).project(b.camera);assert.ok(Math.abs(edge.x)<=1&&Math.abs(edge.y)<=1);}}}
});
await check('320x932窄竖屏最大助力球体边缘可见',()=>{
 const b=fixture().bubbleManager;b.camera.aspect=320/932;b.camera.updateProjectionMatrix();const p=b.calculateSpawnPosition();const edge=p.clone().add(new THREE.Vector3(.95*1.25,0,0)).project(b.camera);assert.ok(edge.x<=1,`右边缘NDC=${edge.x.toFixed(3)}>1`);
});
globalThis.performance=nativePerformance;
const output={type:'独立收尾源码行为检查；UI、摄像头、计时器为替身；非真机',at:new Date().toISOString(),totalCount:results.length,passCount:results.filter(r=>r.pass).length,results};
fs.writeFileSync(new URL('qa_closeout_results.json',import.meta.url),JSON.stringify(output,null,2));console.log(JSON.stringify(output,null,2));process.exitCode=results.some(r=>!r.pass)?1:0;
