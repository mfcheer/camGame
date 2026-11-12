import assert from 'node:assert/strict';
import * as THREE from 'three';
import { BubbleManager } from '../src/bubbleManager.js';
import { HotAirBalloon } from '../src/hotAirBalloon.js';
import { PoseDetector } from '../src/poseDetector.js';
import { AudioManager } from '../src/audioManager.js';

globalThis.window = { innerWidth: 1280, innerHeight: 720, addEventListener() {} };
globalThis.requestAnimationFrame = () => 1;
const { Game } = await import('../src/main.js');

let timers = [], timerId = 0;
globalThis.setTimeout = (fn, delay) => { const id = ++timerId; timers.push({ id, fn, delay }); return id; };
globalThis.clearTimeout = id => { timers = timers.filter(t => t.id !== id); };
function flush() { const pending = timers; timers = []; pending.forEach(t => t.fn()); }

const results = [];
function check(name, fn) {
  try {
    const res = fn();
    if (res instanceof Promise) {
      throw new Error('Async test must be run synchronously or handled');
    }
    results.push({ name, pass: true });
  } catch (e) {
    results.push({ name, pass: false, actual: e.message });
  }
}

async function checkAsync(name, fn) {
  try {
    await fn();
    results.push({ name, pass: true });
  } catch (e) {
    results.push({ name, pass: false, actual: e.message });
  }
}

function fixture() {
  timers = [];
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(48, 16/9, .1, 1000);
  camera.position.z = 7.5; camera.updateMatrixWorld();
  const balloon = new HotAirBalloon(scene);
  const audio = { playPop() {}, playEnergyCharge() {}, playCelebration() {}, init() {} };
  const bubble = new BubbleManager(scene, camera, audio, balloon);
  const ui = new Proxy({}, { get: () => () => {} });
  const pose = new PoseDetector({srcObject:null});
  const g = Object.assign(Object.create(Game.prototype), {
    state:'PLAYING', collectedCount:0, targetCount:5, noPoseDetectedTime:0,
    balloon, audioManager:audio, bubbleManager:bubble, uiManager:ui, poseDetector:pose,
    playerMode: 'single'
  });
  g.setupPoseCallbacks();
  return g;
}

function center(g) {
  const p = g.bubbleManager.activeBubble.group.position.clone().project(g.bubbleManager.camera);
  return {x:(p.x+1)/2, y:(1-p.y)/2};
}

function contact(g, players=2) {
  const hand = center(g);
  g.poseDetector.onResultsCallback({players:Array.from({length:players},(_,i)=>({id:i,hands:[hand,hand]}))});
}

// 原始 13 项核心回归测试
check('实际碰撞闭环：0→5、双人同触只加1、能量抵达后庆祝、5秒结算', () => {
  const g=fixture(); let won=0; g.uiManager={showHandGuide(){},updateProgress(){},setPoseLostAlert(){},showVictory(){won++;}};
  g.bubbleManager.createBubble(0);
  for(let n=1;n<=5;n++) {
    contact(g);
    assert.equal(g.collectedCount,n);
    assert.equal(g.state,'PLAYING','能量飞行途中不提前启动庆祝');
    for(let frame=0;frame<26;frame++) g.bubbleManager.update(.016,n+frame*.016);
    assert.equal(g.state,n<5?'PLAYING':'CELEBRATING');
    assert.equal(g.balloon.isTakingOff,n===5);
    if(n<5){g.poseDetector.onResultsCallback({players:[]});assert.equal(g.collectedCount,n);flush();}
  }
  assert.equal(timers.find(t=>t.delay===5000)?.delay,5000);
  flush();
  assert.equal(won,1);
});

check('暂停不计数；恢复可碰；重新开始清零', () => {
  const g=fixture();
  g.bubbleManager.createBubble(0);
  g.handleTogglePause(true);
  contact(g);
  assert.equal(g.collectedCount,0);
  g.handleResume();
  contact(g);
  assert.equal(g.collectedCount,1);
  flush();
  g.handleRestart();
  assert.equal(g.collectedCount,0);
  assert.equal(g.balloon.isTakingOff,false);
  flush();
  assert.ok(g.bubbleManager.activeBubble);
});

check('冷却未结束时重新开始也能生成泡泡', () => {
  const g=fixture();
  g.bubbleManager.createBubble(0);
  contact(g);
  g.handleRestart();
  flush();
  assert.ok(g.bubbleManager.activeBubble,'实际 activeBubble=null，isSpawning='+g.bubbleManager.isSpawning);
});

check('丢失姿态后必须暂停并等待家长继续', () => {
  const g=fixture();
  for(let n=0;n<200;n++) g.poseDetector.onResultsCallback({players:[]});
  assert.equal(g.state,'PAUSED');
});

check('双人只剩一人必须暂停', () => {
  const g=fixture();
  g.playerMode='coop';
  g.bubbleManager.setPlayerMode('coop');
  g.bubbleManager.createBubble(0);
  contact(g,1);
  assert.equal(g.collectedCount,0);
  assert.equal(g.state,'PAUSED');
});

check('退出停止全部视频轨道并清空srcObject', () => {
  const g=fixture();
  let stopped=0;
  g.poseDetector.stream={getTracks:()=>[{stop(){stopped++;}},{stop(){stopped++;}}]};
  g.handleExit();
  assert.equal(stopped,2);
  assert.equal(g.poseDetector.video.srcObject,null);
  assert.equal(g.state,'START');
});

check('双人生成区域左右轮换（仅固定区域，非人体校准）', () => {
  const g=fixture();
  g.bubbleManager.setPlayerMode('coop');
  const xs=Array.from({length:5},()=>g.bubbleManager.calculateSpawnPosition().x);
  assert.deepEqual(xs.map(Math.sign),[1,-1,1,-1,1]);
});

check('手机竖屏双人目标中心必须在可视范围', () => {
  const g=fixture();
  g.bubbleManager.camera.aspect=390/844;
  g.bubbleManager.camera.updateProjectionMatrix();
  g.bubbleManager.setPlayerMode('coop');
  const positions=Array.from({length:10},()=>g.bubbleManager.calculateSpawnPosition().project(g.bubbleManager.camera).x);
  assert.ok(positions.every(x=>Math.abs(x)<=1),'实际NDC x='+positions.map(x=>x.toFixed(2)).join(','));
});

check('宽屏泡泡视觉边缘内的手应当命中', () => {
  const g=fixture();
  g.bubbleManager.createBubble(0);
  const b=g.bubbleManager.activeBubble;
  const p=center(g);
  const edge=b.group.position.clone().add(new THREE.Vector3(b.radius,0,0)).project(g.bubbleManager.camera);
  const r=(edge.x+1)/2-p.x;
  assert.equal(g.bubbleManager.checkHandCollisions([{hands:[{x:p.x+r*.9,y:p.y}]}]),true);
});

check('模型加载失败后点重试必须重新初始化模型', () => {
  const source=Game.prototype.handleRetryCamera.toString();
  assert.ok(source.includes('.init('),'重试只调用startCamera，没有重新init');
});

check('切后台后暂停且返回不自动继续', () => {
  const g=fixture();
  let visibility;
  globalThis.document={hidden:true,addEventListener(name,fn){if(name==='visibilitychange')visibility=fn;}};
  g.setupBackgroundListener();
  visibility();
  assert.equal(g.state,'PAUSED');
  document.hidden=false;
  visibility();
  assert.equal(g.state,'PAUSED');
});

check('16:9视频裁剪至竖屏后，手部坐标跟随cover裁剪', () => {
  const g=fixture();
  g.poseDetector.video.videoWidth=1280;
  g.poseDetector.video.videoHeight=720;
  window.innerWidth=390;
  window.innerHeight=844;
  const landmarks=Array.from({length:33},()=>({x:.6,y:.5,visibility:1}));
  g.poseDetector.onResultsCallback=null;
  g.poseDetector.processLandmarks({landmarks:[landmarks]});
  const actual=g.poseDetector.trackedPlayers[0].hands[0].x;
  const scaledWidth=1280*(844/720);
  const expected=(.4*scaledWidth-(scaledWidth-390)/2)/390;
  window.innerWidth=1280;
  window.innerHeight=720;
  assert.ok(Math.abs(actual-expected)<.001,`实际x=${actual}；cover正确x=${expected.toFixed(3)}`);
});

check('声音开关可往返；静音阻止创建声音', () => {
  const a=new AudioManager();
  assert.equal(a.toggleMute(),true);
  a.ctx={createOscillator(){throw Error('静音仍创建声音');}};
  a.playPop();
  a.playEnergyCharge(1);
  a.playCelebration();
  assert.equal(a.toggleMute(),false);
});

// 新增专项阻断项回归测试 (QA-08 及产品经理收尾要求)
check('QA-08: 就绪门禁自校验、参与人数确认与本轮玩家锁定', () => {
  const g = fixture();
  g.state = 'CALIBRATING';
  g.playerMode = 'coop';

  // 人数不足 (0人) 拒绝进入游戏
  g.poseDetector.trackedPlayers = [];
  assert.equal(g.handleReadyToPlay(), false);

  // 双人模式仅 1 人拒绝进入游戏
  g.poseDetector.trackedPlayers = [{ id: 1, centerX: 0.5, hands: [{ x: 0.5, y: 0.5 }] }];
  assert.equal(g.handleReadyToPlay(), false);

  // 底层未开启摄像头拒绝进入游戏
  g.poseDetector.status = 'uninitialized';
  g.poseDetector.stream = null;
  assert.equal(g.handleReadyToPlay(), false);

  // 摄像头已运行、双人两人就位、双手可见且有效分离，允许进入游戏并锁定玩家
  g.poseDetector.status = 'running';
  g.poseDetector.stream = { getTracks: () => [] };
  g.poseDetector.isRunning = true;
  g.poseDetector.trackedPlayers = [
    { id: 1, centerX: 0.3, hands: [{ x: 0.3, y: 0.5 }] },
    { id: 2, centerX: 0.7, hands: [{ x: 0.7, y: 0.5 }] }
  ];
  assert.equal(g.handleReadyToPlay(), true);
  assert.equal(g.state, 'PLAYING');
  assert.ok(g.poseDetector.lockedPlayers && g.poseDetector.lockedPlayers.length === 2);
});

check('QA-08: 旁观者防替入机制（第三人入框不替代或扰乱已锁定玩家）', () => {
  const pose = new PoseDetector({ srcObject: null });
  const p1 = Array.from({length:33}, () => ({x: 0.7, y: 0.5, visibility: 0.9})); // mirrored ~0.3
  const p2 = Array.from({length:33}, () => ({x: 0.3, y: 0.5, visibility: 0.9})); // mirrored ~0.7
  pose.processLandmarks({ landmarks: [p1, p2] });
  assert.equal(pose.trackedPlayers.length, 2);

  const calib = pose.getCalibrationStatus('coop');
  assert.equal(calib.ready, true);
  pose.lockPlayers(calib.players);

  // 模拟旁观者（在最边缘 x=0.05，mirrored=0.95）入镜，并排在数组最前
  const bystander = Array.from({length:33}, () => ({x: 0.05, y: 0.5, visibility: 0.9}));
  pose.processLandmarks({ landmarks: [bystander, p1, p2] });

  // 追踪玩家必须依然严格匹配锁定的2位核心玩家，旁观者被忽略
  assert.equal(pose.trackedPlayers.length, 2);
  assert.ok(Math.abs(pose.trackedPlayers[0].centerX - 0.3) < 0.15);
  assert.ok(Math.abs(pose.trackedPlayers[1].centerX - 0.7) < 0.15);
});

check('庆祝定时器支持暂停冻结有效时长、恢复结算、重新开始与退出取消旧轮回调', () => {
  const g = fixture();
  let won = 0;
  g.uiManager = { showVictory() { won++; }, setPoseLostAlert() {}, resetProgress() {} };

  g.handleVictory();
  assert.equal(g.state, 'CELEBRATING');
  assert.equal(timers.length, 1);
  assert.equal(timers[0].delay, 5000);

  // 庆祝中暂停：冻结有效时长并清除定时器
  g.handleTogglePause(true);
  assert.equal(g.state, 'PAUSED');
  assert.equal(timers.length, 0);

  // 暂停期间触发 flush 不会弹出胜利
  flush();
  assert.equal(won, 0);

  // 恢复庆祝：定时器恢复继续计算剩余时间
  g.handleResume();
  assert.equal(g.state, 'CELEBRATING');
  assert.equal(timers.length, 1);

  // 重新开始清空旧轮庆祝定时器，旧轮到期不干扰新轮
  g.handleRestart();
  assert.equal(g.state, 'PLAYING');
  flush();
  assert.equal(won, 0);
});

await checkAsync('异步开始与重试具备轮次取消保护，退出后不可重新开摄像头', async () => {
  const g = fixture();
  let cameraStopped = 0;
  g.poseDetector.init = async () => true;
  g.poseDetector.startCamera = async () => {
    await new Promise(r => setTimeout(r, 20));
    return true;
  };
  g.poseDetector.stop = () => { cameraStopped++; };

  const startPromise = g.handleStart('single');
  // 在异步开启摄像头的过程中用户点击退出回首页
  g.handleExit();
  assert.equal(g.state, 'START');

  await startPromise;
  // 必须由于轮次作废而立即调用 stop() 清理释放摄像头
  assert.ok(cameraStopped >= 1, '摄像头未在轮次取消时清理');
});

check('横竖屏（含 390x844）泡泡最大放大边缘（含助力与微浮）全处于可视投影范围', () => {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(48, 390/844, .1, 1000);
  camera.position.z = 7.5; camera.updateMatrixWorld();
  const bubble = new BubbleManager(scene, camera, {}, {});
  bubble.setPlayerMode('coop');

  for (let i = 0; i < 30; i++) {
    const pos = bubble.calculateSpawnPosition();
    // 最大可能物理半径 = 基础 0.95 * 助力 1.25 + 浮动 0.12
    const maxR = 0.95 * 1.25 + 0.12;
    const rightEdge = new THREE.Vector3(pos.x + maxR, pos.y, 0).project(camera);
    const leftEdge = new THREE.Vector3(pos.x - maxR, pos.y, 0).project(camera);
    const topEdge = new THREE.Vector3(pos.x, pos.y + maxR, 0).project(camera);
    const bottomEdge = new THREE.Vector3(pos.x, pos.y - maxR, 0).project(camera);

    assert.ok(rightEdge.x <= 1.0, `rightEdge出屏: ${rightEdge.x}`);
    assert.ok(leftEdge.x >= -1.0, `leftEdge出屏: ${leftEdge.x}`);
    assert.ok(topEdge.y <= 1.0, `topEdge出屏: ${topEdge.y}`);
    assert.ok(bottomEdge.y >= -1.0, `bottomEdge出屏: ${bottomEdge.y}`);
  }
});

console.log(JSON.stringify({
  type: '源码集成与生命周期回归测试；无真实浏览器/摄像头；计时器与UI使用替身',
  totalCount: results.length,
  passCount: results.filter(r => r.pass).length,
  results
}, null, 2));

process.exitCode = results.some(r => !r.pass) ? 1 : 0;
