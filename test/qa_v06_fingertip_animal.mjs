import assert from 'node:assert/strict';
import * as THREE from 'three';
import { Game } from '../src/main.js';
import { RescueAnimal } from '../src/rescueAnimal.js';
import { SceneManager } from '../src/sceneManager.js';
import { BubbleManager } from '../src/bubbleManager.js';
import { PoseDetector, OneEuroFilter1D } from '../src/poseDetector.js';

const results = [];
function check(name, fn) {
  try {
    fn();
    results.push({ name, pass: true });
  } catch (e) {
    results.push({ name, pass: false, actual: e.message });
  }
}

// 1. 食指指尖追踪：只以食指指尖为交互锚点，食指丢失不回退手腕
check('食指指尖单一交互锚点与低置信度不回退手腕', () => {
  const p = new PoseDetector({});
  const landmarks = Array.from({ length: 33 }, () => ({ x: 0.5, y: 0.5, visibility: 0.9 }));
  landmarks[19] = { x: 0.35, y: 0.45, visibility: 0.95 }; // 左食指
  landmarks[20] = { x: 0.65, y: 0.45, visibility: 0.95 }; // 右食指
  landmarks[15] = { x: 0.30, y: 0.60, visibility: 0.95 }; // 左手腕
  landmarks[16] = { x: 0.70, y: 0.60, visibility: 0.95 }; // 右手腕

  p.processLandmarks({ landmarks: [landmarks] });
  assert.equal(p.trackedPlayers.length, 1);
  const hands = p.trackedPlayers[0].hands;
  assert.equal(hands.length, 2);
  assert.equal(hands[0].isIndexTip, true, '交互手点必须标记为食指指尖');

  // 当食指丢失 (置信度 <= 0.35)
  landmarks[19] = { x: 0.35, y: 0.45, visibility: 0.20 };
  landmarks[20] = { x: 0.65, y: 0.45, visibility: 0.20 };
  p.processLandmarks({ landmarks: [landmarks] });
  assert.equal(p.trackedPlayers[0].hands.length, 0, '食指低置信度时不得静默退回手腕生成可戳点');
  assert.equal(p.trackedPlayers[0].hasBodyPresence, true, '身体在场状态应仍然被保留');

  // 当模型仅输出前17个关节点（无19/20食指点）时，坚决不回退手腕
  const shortLandmarks = landmarks.slice(0, 17);
  shortLandmarks[15] = { x: 0.30, y: 0.60, visibility: 0.95 }; // 虽有手腕
  shortLandmarks[16] = { x: 0.70, y: 0.60, visibility: 0.95 };
  p.processLandmarks({ landmarks: [shortLandmarks] });
  assert.equal(p.trackedPlayers[0].hands.length, 0, '无19/20食指时绝对不回退手腕');
  assert.equal(p.trackedPlayers[0].hasBodyPresence, true, '手腕仍作为身体在场判断');

  // 当食指重新出现（在全新的远端坐标）：滤波器已重置，直接以新位置淡入，不从旧点瞬移拉丝
  landmarks[19] = { x: 0.15, y: 0.25, visibility: 0.95 };
  p.processLandmarks({ landmarks: [landmarks] });
  assert.equal(p.trackedPlayers[0].hands.length, 1);
  assert.ok(Math.abs(p.trackedPlayers[0].hands[0].x - (1 - 0.15)) < 0.05, '重新捕获时滤波器重置，直接定位新指尖');
});

// 2. 手腕扫过泡泡不误破，必须食指指尖触碰才破
check('手腕扫过泡泡不误破，仅食指指尖命中才触发破裂', () => {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(48, 16/9, 0.1, 1000);
  camera.position.z = 7.5;
  camera.updateMatrixWorld();
  const bm = new BubbleManager(scene, camera, { playPop() {} }, { group: { visible: false } });

  bm.createBubble(0);
  const b = bm.activeBubble;
  const screenCoord = b.group.position.clone().project(camera);
  const bX = (screenCoord.x + 1) / 2;
  const bY = (1 - screenCoord.y) / 2;

  // 手腕坐标（标记为 isIndexTip: false）扫过泡泡
  const wristHit = bm.checkHandCollisions([{
    id: 1,
    hands: [{ side: 'left', x: bX, y: bY, isIndexTip: false }]
  }]);
  assert.equal(wristHit, false, '手腕或非指尖点不可触破泡泡');
  assert.ok(bm.activeBubble, '泡泡应当存活');

  // 食指指尖触碰泡泡
  const tipHit = bm.checkHandCollisions([{
    id: 1,
    hands: [{ side: 'left', x: bX, y: bY, isIndexTip: true }]
  }]);
  assert.equal(tipHit, true, '食指指尖触碰必须成功碰破泡泡');
  assert.equal(bm.activeBubble, null, '泡泡已被成功碰破');
});

// 3. 单人模式平滑无缝换人与多人体感容差
check('单人模式换人平滑接替，多人员入框自动过滤边缘旁观者', () => {
  const p = new PoseDetector({});
  p.setPlayerMode('single');

  // 初始原玩家在左侧 0.35 处
  const makePerson = (centerX) => {
    const arr = Array.from({ length: 33 }, () => ({ x: 1 - centerX, y: 0.5, visibility: 0.9 }));
    arr[11].x -= 0.04; arr[12].x += 0.04;
    arr[19] = { x: 1 - centerX - 0.05, y: 0.45, visibility: 0.95 };
    arr[20] = { x: 1 - centerX + 0.05, y: 0.45, visibility: 0.95 };
    return arr;
  };

  p.processLandmarks({ landmarks: [makePerson(0.35)] });
  p.lockPlayers(p.trackedPlayers, 'single');
  assert.equal(p.trackedPlayers[0].id, 1);

  // 原玩家离开，新玩家站在 0.52 处进框：平滑转移控制权
  p.processLandmarks({ landmarks: [makePerson(0.52)] });
  assert.equal(p.trackedPlayers.length, 1, '新玩家进框平滑接管，不发生丢人中断');
  assert.ok(Math.abs(p.trackedPlayers[0].centerX - 0.52) < 0.08);

  // 此时边缘出现路过的旁观者 (x = 0.08)
  p.processLandmarks({ landmarks: [makePerson(0.08), makePerson(0.52)] });
  assert.equal(p.trackedPlayers.length, 1, '多人员同框时必须只追踪中央核心玩家');
  assert.ok(Math.abs(p.trackedPlayers[0].centerX - 0.52) < 0.08, '边缘旁观者被自动忽略');
});

// 4. 姿态丢失改为柔性等待，人站回瞬间自动恢复
check('姿态丢失触发柔性等待（无阻断黑底遮罩），站回镜头前自动继续', () => {
  const g = Object.assign(Object.create(Game.prototype), {
    state: 'PLAYING',
    prePauseState: 'PLAYING',
    playerMode: 'single',
    noPoseDetectedTime: 0,
    isSoftWaiting: false,
    poseDetector: { resume() {}, pause() {} },
    uiManager: {
      showPauseCalled: false,
      alertText: null,
      showPause() { this.showPauseCalled = true; },
      setPoseLostAlert(vis, txt) { this.alertText = vis ? txt : null; }
    },
    bubbleManager: { updateHandIndicators() {}, checkHandCollisions() { return false; } }
  });

  g.setupPoseCallbacks();

  // 模拟丢失姿态超过 1.0 秒
  for (let i = 0; i < 70; i++) {
    g.poseDetector.onResultsCallback({ players: [] });
  }

  assert.equal(g.state, 'PAUSED', '长时间丢失姿态应进入暂停');
  assert.equal(g.isSoftWaiting, true, '应标记为柔性等待');
  assert.equal(g.uiManager.showPauseCalled, false, '柔性等待绝不可弹出大黑底阻断式暂停遮罩');
  assert.ok(g.uiManager.alertText && g.uiManager.alertText.includes('等你回来'), '应显示温馨轻量等待提示');

  // 玩家站回镜头前：瞬间自动恢复继续
  g.poseDetector.onResultsCallback({
    players: [{ id: 1, hands: [{ side: 'left', x: 0.5, y: 0.5, isIndexTip: true }] }]
  });

  assert.equal(g.state, 'PLAYING', '检测到玩家回归后应自动恢复 PLAYING 状态');
  assert.equal(g.isSoftWaiting, false, '柔性等待状态解除');
  assert.equal(g.uiManager.alertText, null, '温馨等待提示自动清除');
});

// 5. 小动物模型精塑、小领结视觉落点与绳圈逐圈松开
check('小动物精致造型、小领结视觉落点与绳圈逐圈松解淡出', () => {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(48, 16/9, 0.1, 1000);
  camera.position.z = 7.5;
  camera.updateMatrixWorld();

  const animal = new RescueAnimal(scene, camera);
  assert.ok(animal.bowtieGroup, '小白兔必须配备颈部童话小领结');
  assert.ok(animal.headGroup, '小白兔必须具备独立头部与耳部组');
  assert.ok(animal.eyesGroup, '小白兔必须具备大眼与高光组');

  // 能量汇聚点精确对齐领结
  const target = animal.getTargetPosition();
  assert.ok(target.distanceTo(animal.bowtieGroup.getWorldPosition(new THREE.Vector3())) < 1e-6, '能量汇聚必须使用领结实际世界坐标，随模型缩放和动作同步');

  // 得 2 分（小兔 6 能量的首个松绳档）：第一圈绳圈先进入"松弛下垂"预告段，而非立即坠落
  animal.setEnergy(2);
  assert.equal(animal.ropeCoils[0].loosened, true);
  assert.equal(animal.ropeCoils[0].falling, false, '里程碑先进松弛段（绷紧→松弛→崩断三段式）');

  // 松弛段（450ms）结束后进入崩断坠落，再推进 400ms 完成淡出
  animal.update(0.5, 0.5);
  animal.update(0.4, 0.9);
  assert.equal(animal.ropeCoils[0].group.visible, false, '绳圈在松弛+坠落全流程后淡出隐藏');
  assert.equal(animal.ropeCoils[1].group.visible, true, '未达到的绳圈保持绑缚');
});

// 6. 跑道与布景严格符合 ≤8% 视口底沿高度限制
check('立体小径居底、角色与花门分置两角', () => {
  const fakeContainer = { appendChild() {} };
  const sm = new SceneManager(fakeContainer);

  const vHeight = 2 * Math.tan(THREE.MathUtils.degToRad(24)) * 7.5;
  const bottomY = -vHeight / 2;

  assert.ok(sm.bottomStripGroup, '鹅卵石跑道底板必须存在');
  assert.ok(sm.leftFrame, '左侧小雏菊与相框必须存在');
  assert.ok(sm.rightFrame, '右侧花门终点相框必须存在');
  assert.ok(sm.mushroom, '右侧彩色蘑菇路标必须存在');

  // 检查底板垂直位移
  assert.ok(sm.bottomStripGroup.position.y < bottomY + vHeight * 0.08, '中央路面落脚线位于底部8%范围，两角允许展示完整角色');
});


// 7. 光点、碰撞与避手生成三者完全统一为食指尖坐标；食指丢失淡出与重捕获淡入
check('光点、碰撞与避手生成统一为食指尖，丢失180ms淡出与重获平滑淡入', () => {
  const oldDoc = globalThis.document;
  globalThis.document = { createElement() {} };
  try {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(48, 16/9, 0.1, 1000);
  camera.position.z = 7.5;
  camera.updateMatrixWorld();
  const bm = new BubbleManager(scene, camera, { playPop() {} }, { group: { visible: false } });

  const fingertip = { side: 'left', x: 0.40, y: 0.45, isIndexTip: true };
  const wrist = { side: 'left', x: 0.20, y: 0.70, isIndexTip: false };

  // 1. 光晕更新：只对食指尖生效
  bm.updateHandIndicators([{ id: 1, hands: [fingertip, wrist] }]);
  const ind = bm.handIndicators[0];
  assert.equal(ind.active, true, '食指尖光点激活');
  assert.equal(bm.handIndicators[1].active, false, '手腕点不激活光点');

  // 2. 食指尖丢失：光点进入淡出倒计时 (fadeTimer = 0.18)
  bm.updateHandIndicators([{ id: 1, hands: [wrist] }]);
  assert.equal(ind.active, false, '食指丢失后光点失活');
  assert.ok(ind.fadeTimer > 0, '启动平滑淡出');

  // 推进 200ms (多帧更新) 淡出完毕
  for (let t = 0; t < 5; t++) bm.update(0.05, 0.05 * (t + 1));
  assert.equal(ind.group.visible, false, '180ms淡出结束后完全隐藏');

  // 3. 食指尖重新捕获：位置瞬间更新至新位置，开始平滑淡入
  const newFingertip = { side: 'left', x: 0.80, y: 0.30, isIndexTip: true };
  bm.updateHandIndicators([{ id: 1, hands: [newFingertip] }]);
  assert.equal(ind.active, true);
  assert.equal(ind.group.visible, true);
  assert.ok(ind.currentOpacity <= 0.35, '重新捕获时光点从轻量透明度开始淡入');

  // 推进 150ms (多帧更新) 淡入至常态
  for (let t = 0; t < 3; t++) bm.update(0.05, 0.05 * t);
  assert.ok(ind.currentOpacity >= 0.90, '平滑淡入至正常可见度');
  } finally {
    if (oldDoc === undefined) delete globalThis.document;
    else globalThis.document = oldDoc;
  }
});

const out = {
  at: new Date().toISOString(),
  scope: 'v0.6 食指指尖交互、平滑换人、柔性等待与小动物打磨专项测试',
  total: results.length,
  passed: results.filter(x => x.pass).length,
  results
};
console.log(JSON.stringify(out, null, 2));
process.exitCode = results.every(x => x.pass) ? 0 : 1;
