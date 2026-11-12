import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as T from 'three';
import { Game } from '../src/main.js';
import { RescueAnimal } from '../src/rescueAnimal.js';
import { BubbleManager } from '../src/bubbleManager.js';
import { PoseDetector } from '../src/poseDetector.js';

const results = [];
function check(name, fn) {
  try {
    fn();
    results.push({ name, pass: true });
  } catch (e) {
    results.push({ name, pass: false, actual: e.message });
  }
}

// 1. 免手触自动就位 3-2-1 倒计时开局
check('免手触自动就位 3-2-1 倒计时自动触发与开局', () => {
  const g = Object.assign(Object.create(Game.prototype), {
    state: 'CALIBRATING',
    playerMode: 'single',
    isAutoCountingDown: false,
    autoCountdownSessionId: 0,
    countdownTimers: [],
    poseDetector: {
      getCalibrationStatus: () => ({ ready: true, players: [{ id: 1, hands: [{ x: 0.5, y: 0.5 }] }] }),
      status: 'running',
      stream: { getTracks: () => [] },
      isRunning: true,
      lockPlayers() {}
    },
    uiManager: {
      showCountdownOverlay: (num, tip) => { overlayNumber = num; },
      hideCountdownOverlay: () => { overlayHidden = true; },
      setCalibrationReady: () => {},
      hideCalibration: () => {},
      resetProgress: () => {},
      showHUD: () => {}
    },
    audioManager: {
      playCountdown: (n) => { playedCountdownAudio.push(n); },
      playCountdownGo: () => { playedGo = true; }
    },
    balloon: { reset() {} },
    rescueAnimal: { reset() {} },
    bubbleManager: { clear() {}, spawnNext() {}, setPlayerComfortZones() {} }
  });

  let overlayNumber = null;
  let overlayHidden = false;
  const playedCountdownAudio = [];
  let playedGo = false;

  // 触发校准检测就位（持续就位约 400ms 防抖）
  g.setupPoseCallbacks();
  for (let i = 0; i < 15; i++) {
    g.poseDetector.onResultsCallback({ players: [{ id: 1 }] });
  }

  assert.equal(g.isAutoCountingDown, true, '持续稳定检测到姿态就位时应自动启动倒计时');
  assert.equal(overlayNumber, '3', '第一步应展示数字 3');
  assert.ok(playedCountdownAudio.includes(3), '应播放 3 提示音');

  // 若期间短暂姿态丢失（丢帧 1~5 帧），处于容差宽限缓冲期，绝不闪现取消倒计时，遮罩保持稳定不闪烁
  g.poseDetector.getCalibrationStatus = () => ({ ready: false, message: '请站在镜头前' });
  for (let i = 0; i < 5; i++) {
    g.poseDetector.onResultsCallback({ players: [] });
  }
  assert.equal(g.isAutoCountingDown, true, '短时间短暂丢帧时处于容差宽限期，绝不取消倒计时');
  assert.equal(overlayHidden, false, '短时间丢帧不隐藏倒计时遮罩，避免屏幕频繁闪烁');

  // 若持续丢失超过 1.0 秒（例如 35 帧），超时才柔和取消倒计时
  for (let i = 0; i < 35; i++) {
    g.poseDetector.onResultsCallback({ players: [] });
  }
  assert.equal(g.isAutoCountingDown, false, '姿态长时间丢失超过宽限期应自动取消倒计时');
  assert.equal(overlayHidden, true, '超时取消倒计时后遮罩应隐藏');
});

// 2. 移除屏幕中央大模型：中央完全留空不遮挡人脸
check('游戏实例中中央大模型已隐藏，正中央视野完全通透留给人像', () => {
  const scene = new T.Scene();
  const camera = new T.PerspectiveCamera(48, 16/9, 0.1, 1000);
  camera.position.z = 7.5;
  camera.updateMatrixWorld();

  const fakeContainer = { appendChild() {} };
  const fakeVideo = { addEventListener() {} };

  globalThis.document = {
    getElementById: (id) => {
      if (id === 'webcam-video') return fakeVideo;
      if (id === 'canvas-container') return fakeContainer;
      return null;
    },
    querySelector: () => null,
    querySelectorAll: () => []
  };

  const g = new Game();
  assert.ok(g.balloon, 'HotAirBalloon 必须保留以供系统协同');
  assert.equal(g.balloon.group.visible, false, '屏幕中央热气球模型必须隐藏(visible=false)，避免遮挡人像');
  assert.ok(g.rescueAnimal, 'RescueAnimal 解救小动物模块必须被挂载');
});

// 3. 底部跑道 + 左侧被困小动物
check('底部跑道与左侧被困小动物（木桩与绳索待救状态）', () => {
  const scene = new T.Scene();
  const camera = new T.PerspectiveCamera(48, 16/9, 0.1, 1000);
  camera.position.z = 7.5;
  camera.updateMatrixWorld();

  const animal = new RescueAnimal(scene, camera);
  assert.equal(animal.state, 'TRAPPED', '初始状态必须为 TRAPPED (被困待救)');
  assert.equal(animal.ropesGroup.visible, true, '被困状态绳索必须可见');
  assert.ok(animal.ropeCoils.length >= 4, '应具备多圈绑缚绳索');
  assert.ok(animal.currentX < -2.0, `被困小动物必须位于画面左侧: x=${animal.currentX}`);

  // 验证世界坐标中心（用于能量球汇聚目标）
  const targetPos = animal.getTargetPosition();
  assert.ok(targetPos.x < -2.0, '能量汇聚目标必须指向左侧被困小动物');
});

// 4. 碰破泡泡能量飞入解救进度与绳索松解
check('碰破泡泡能量飞向小动物，绳索逐步松解', () => {
  const scene = new T.Scene();
  const camera = new T.PerspectiveCamera(48, 16/9, 0.1, 1000);
  camera.position.z = 7.5;
  camera.updateMatrixWorld();

  const animal = new RescueAnimal(scene, camera);
  animal.setEnergy(1);
  assert.equal(animal.energyLevel, 1);
  assert.equal(animal.ropeCoils[0].loosened, true, '获得能量后绳索应松动');
  assert.ok(animal.hopTimer > 0, '获得能量后小动物应展现受到鼓舞的欢跃动作');
});

// 5. 达成 5 分胜利大逃亡：绳索崩解并横向从左一路奔跑到最右侧
check('集满 5 分后绳索崩解，小动物沿底部跑道从左向右横穿屏幕逃生', () => {
  const scene = new T.Scene();
  const camera = new T.PerspectiveCamera(48, 16/9, 0.1, 1000);
  camera.position.z = 7.5;
  camera.updateMatrixWorld();

  const animal = new RescueAnimal(scene, camera);
  const leftX = animal.currentX;

  animal.startEscape();
  assert.equal(animal.ropesGroup.visible, false, '逃生启动后绳索必须彻底崩解隐藏');

  // 推进动画至冲刺奔跑阶段 (1.5s 后)
  animal.update(0.6, 0.6);
  animal.update(1.2, 1.8);

  assert.equal(animal.state, 'ESCAPING', '应处于 ESCAPING 飞奔逃生状态');
  assert.ok(animal.currentX > leftX + 1.0, `小动物应从左向右横向位移: currentX=${animal.currentX}, leftX=${leftX}`);
  assert.equal(animal.animalGroup.rotation.y, Math.PI / 2, '小动物应转向右侧奔跑');

  // 推进动画至完成逃生
  animal.update(2.5, 4.3);
  assert.equal(animal.state, 'ESCAPED', '小动物横穿屏幕出屏后应进入 ESCAPED 状态');
  assert.equal(animal.animalGroup.visible, false, '逃生跑出屏幕后暂时隐藏');

  // 再来一次时，小动物必须完全复位恢复可见！
  animal.reset();
  assert.equal(animal.state, 'TRAPPED', '重置后状态必须恢复为 TRAPPED');
  assert.equal(animal.animalGroup.visible, true, '再来一次时小动物必须恢复可见(visible=true)，绝不能丢失！');
  assert.equal(animal.ropesGroup.visible, true, '重置后绳索必须恢复可见绑缚');
  assert.equal(animal.currentX, animal.startX, '重置后小动物必须回到左侧起跑点');
});

// 6. 顶部 HUD 进度计数器水平绝对居中验证
check('顶部 HUD 进度计数器 CSS 绝对水平居中', () => {
  const css = fs.readFileSync(new URL('../src/style.css', import.meta.url), 'utf8');
  assert.ok(
    css.includes('.progress-dots-container {\n  position: absolute;\n  left: 50%;\n  transform: translateX(-50%);'),
    'CSS 中 progress-dots-container 必须在视口水平绝对居中'
  );
});

const out = {
  at: new Date().toISOString(),
  scope: 'v0.5 底部跑道解救小动物模式与免触碰开局验收测试',
  total: results.length,
  passed: results.filter(x => x.pass).length,
  results
};
console.log(JSON.stringify(out, null, 2));
process.exitCode = results.every(x => x.pass) ? 0 : 1;
