import assert from 'node:assert/strict';
import * as THREE from 'three';
import { BubbleManager } from '../src/bubbleManager.js';
import { AudioManager } from '../src/audioManager.js';
import { CampManager, CAMP_ANIMALS, CAMP_STORAGE_KEY } from '../src/campManager.js';
import { PolaroidManager } from '../src/polaroidManager.js';
import { UIManager } from '../src/uiManager.js';
import { Game } from '../src/main.js';

const results = [];
function check(name, fn) {
  try {
    fn();
    results.push({ name, pass: true });
  } catch (e) {
    results.push({ name, pass: false, error: e.message, stack: e.stack });
  }
}

function center(bm) {
  const p = bm.activeBubble.group.position.clone().project(bm.camera);
  return { x: (p.x + 1) / 2, y: (1 - p.y) / 2, isIndexTip: true, observed: true };
}

// 模拟轻量 Web Audio 上下文
function createMockAudio() {
  const calls = [];
  return {
    calls,
    init() {},
    playPop(c) { calls.push({ type: 'playPop', c }); },
    playJellyBoing() { calls.push({ type: 'playJellyBoing' }); },
    playRainbowGlide() { calls.push({ type: 'playRainbowGlide' }); },
    playHeartMerge() { calls.push({ type: 'playHeartMerge' }); },
    playCameraShutter() { calls.push({ type: 'playCameraShutter' }); },
    playCountdown(n) { calls.push({ type: 'playCountdown', n }); },
    playEnergyCharge(n) { calls.push({ type: 'playEnergyCharge', n }); },
    playAnimalSound(id, type) { calls.push({ type: 'playAnimalSound', id, type }); },
    playCelebration() { calls.push({ type: 'playCelebration' }); }
  };
}

// 果冻保留特殊外观、破裂音效与奖励，但只需一次触碰。
check('Q弹果冻一次触碰即破裂，并提供2份能量',()=>{
 const camera=new THREE.PerspectiveCamera(48,16/9,.1,100);camera.position.z=7.5;camera.updateMatrixWorld();
 const audio=createMockAudio(),bm=new BubbleManager(new THREE.Scene(),camera,audio,null);bm.createBubble(0,'jelly');
 assert.equal(bm.activeBubble.hitsNeeded,1);assert.equal(bm.activeBubble.energyValue,2);
 assert.equal(bm.checkHandCollisions([{id:1,hands:[center(bm)]}]),true);assert.equal(bm.activeBubble,null);
 assert.equal(bm.lastPoppedEnergy,2);assert.ok(audio.calls.some(c=>c.type==='playJellyBoing'));
 assert.equal(bm.energyProjectiles[0].energyCount,2);
});

// 2. 彩虹流光泡泡（连击奖励、七彩旋转光晕与清脆滑音）
check('彩虹流光泡泡：连击奖励生成、带旋转光晕并播放彩虹滑音', () => {
  const camera = new THREE.PerspectiveCamera(48, 16 / 9, 0.1, 100);
  camera.position.z = 7.5;
  camera.updateMatrixWorld();
  const audio = createMockAudio();
  const scene = new THREE.Scene();
  const bm = new BubbleManager(scene, camera, audio, null);

  // 设定 Combo >= 2 自动识别为 rainbow
  bm.comboCount = 2;
  const determinedType = bm.determineBubbleType(1);
  assert.equal(determinedType, 'rainbow', '连击达到 2 时应当判定为彩虹流光泡泡');

  bm.createBubble(1, 'rainbow');
  assert.ok(bm.activeBubble);
  assert.equal(bm.activeBubble.type, 'rainbow');
  assert.ok(bm.activeBubble.rainbowRing, '应当包含彩虹旋转外环');

  // 帧更新旋转
  const rotBefore = bm.activeBubble.rainbowRing.rotation.z;
  bm.update(0.03, 1.0);
  assert.ok(bm.activeBubble.rainbowRing.rotation.z > rotBefore, '彩虹环应动态旋转');

  // 推进时间跨越 400ms 出场保护期
  for (let i = 0; i < 26; i++) bm.update(0.016, 1.0 + i * 0.016);

  // 触碰破裂
  const hand = center(bm);
  const hit = bm.checkHandCollisions([{ id: 1, hands: [hand] }]);
  assert.equal(hit, true, '彩虹泡泡 1 次触碰即可破裂');
  assert.ok(audio.calls.some(c => c.type === 'playRainbowGlide'), '应当播放 playRainbowGlide 滑音');
  assert.equal(bm.particles.length, 24, '彩虹泡泡应当产生 24 颗爆发微星光雨');
});

// 爱心只作为不同外观；任一玩家碰一边或中间的图片即可完成。
check('亲子爱心任一玩家一次触碰即破裂，无双触或等待合并',()=>{
 for(const id of [1,2])for(const side of ['left','right','middle']){
  const camera=new THREE.PerspectiveCamera(48,16/9,.1,100);camera.position.z=7.5;camera.updateMatrixWorld();
  const audio=createMockAudio(),bm=new BubbleManager(new THREE.Scene(),camera,audio,null);bm.setPlayerMode('coop');bm.createBubble(3,'coop_heart');
  bm.activeBubble.group.updateWorldMatrix(true,true);const group=side==='middle'?bm.activeBubble.group:bm.activeBubble[side+'HeartGroup'];
  const p=group.getWorldPosition(new THREE.Vector3()).project(camera);
  assert.equal(bm.checkHandCollisions([{id,hands:[{x:(p.x+1)/2,y:(1-p.y)/2,isIndexTip:true,observed:true}]}]),true);
  assert.equal(bm.activeBubble,null);assert.equal(bm.lastPoppedEnergy,2);assert.ok(audio.calls.some(c=>c.type==='playHeartMerge'));
 }
});

// 4. 多端尺寸与横竖屏边界安全校验（手机、平板、桌面超窄超短屏幕下绝不出屏）
check('多端尺寸与横竖屏全场景下特殊泡泡轮廓均在安全区内绝不出屏', () => {
  const viewports = [
    { name: '桌面 1280x720', w: 1280, h: 720 },
    { name: '平板 1024x768', w: 1024, h: 768 },
    { name: '手机竖屏 390x844', w: 390, h: 844 },
    { name: '极窄手机竖屏 320x932', w: 320, h: 932 },
    { name: '手机横屏 844x390', w: 844, h: 390 },
    { name: '超短横屏 568x260', w: 568, h: 260 }
  ];

  const types = ['jelly', 'rainbow', 'coop_heart', 'normal'];

  for (const vp of viewports) {
    globalThis.window = { innerWidth: vp.w, innerHeight: vp.h };
    const camera = new THREE.PerspectiveCamera(48, vp.w / vp.h, 0.1, 100);
    camera.position.z = 7.5;
    camera.updateMatrixWorld();
    const bm = new BubbleManager(new THREE.Scene(), camera, {}, null);

    for (const type of types) {
      bm.clear();
      bm.createBubble(2, type);
      const g = bm.activeBubble.group;
      // 放大测试：1.25x 助力 + 待机呼吸
      g.scale.setScalar(1.25 * 1.12);
      g.updateWorldMatrix(true, true);

      g.traverse(obj => {
        if (!obj.isMesh || !obj.visible || !obj.geometry?.attributes?.position) return;
        const posAttr = obj.geometry.attributes.position;
        for (let i = 0; i < posAttr.count; i++) {
          const v = new THREE.Vector3().fromBufferAttribute(posAttr, i).applyMatrix4(obj.matrixWorld).project(camera);
          assert.ok(
            v.x >= -1.02 && v.x <= 1.02 && v.y >= -1.02 && v.y <= 1.02,
            `${vp.name} 泡泡类型 ${type} 网格顶点出屏: x=${v.x.toFixed(3)}, y=${v.y.toFixed(3)}`
          );
        }
      });
    }
  }
});

// 5. 拍立得照片卡生成器 (PolaroidManager)
check('PolaroidManager：画布生成、样式规范、数据URL导出与下载触发', () => {
  const canvas = PolaroidManager.generateCanvas({
    animalId: 'cat',
    animalName: '橘猫 橘子',
    targetBubbles: 8,
    animalEmoji: '🐱'
  });
  assert.ok(canvas);

  const dataUrl = PolaroidManager.getDataUrl({
    animalId: 'dog',
    animalName: '小狗 旺旺',
    targetBubbles: 10,
    animalEmoji: '🐶'
  });
  assert.ok(typeof dataUrl === 'string' && dataUrl.startsWith('data:image/png;base64,'));

  // 验证下载调用不崩溃
  PolaroidManager.downloadImage(dataUrl, '小狗旺旺');
});

// 6. 森林营地图鉴管理器 (CampManager 本地存储与多动物统计)
check('CampManager：LocalStorage 存储解救计数、点亮判断与全量汇总', () => {
  const fakeStore = {};
  const mockStorage = {
    getItem: (k) => fakeStore[k] || null,
    setItem: (k, v) => { fakeStore[k] = String(v); },
    removeItem: (k) => { delete fakeStore[k]; }
  };
  const camp = new CampManager(mockStorage);

  assert.equal(camp.getTotalRescues(), 0, '初始累计解救应当为 0');
  assert.equal(camp.getUnlockedCount(), 0, '初始已解锁数量应当为 0');
  assert.equal(camp.isUnlocked('bunny'), false);

  // 记录解救小兔 2 次，橘猫 1 次
  camp.recordRescue('bunny');
  camp.recordRescue('bunny');
  camp.recordRescue('cat');

  assert.equal(camp.getAnimalRescueCount('bunny'), 2);
  assert.equal(camp.getAnimalRescueCount('cat'), 1);
  assert.equal(camp.getAnimalRescueCount('frog'), 0);
  assert.equal(camp.getTotalRescues(), 3);
  assert.equal(camp.getUnlockedCount(), 2);
  assert.equal(camp.isUnlocked('bunny'), true);
  assert.equal(camp.isUnlocked('dog'), false);

  // 清除营地数据
  camp.clearCampData();
  assert.equal(camp.getTotalRescues(), 0);
});

// 7. 完整游戏状态机联动：特殊泡泡+2能量充能、胜利拍立得抓拍与营地记录
check('Game 集成闭环：果冻泡泡+2充能、达成通关后手动拍照与营地自动记录', () => {
  const audio = createMockAudio();
  const fakeStore = {};
  const mockStorage = {
    getItem: (k) => fakeStore[k] || null,
    setItem: (k, v) => { fakeStore[k] = String(v); },
    removeItem: (k) => { delete fakeStore[k]; }
  };
  const camp = new CampManager(mockStorage);

  let victoryShown = false;
  let flashTriggered = false;
  let polaroidSet = false;

  const mockUI = {
    showHandGuide() {},
    updateProgress() {},
    setPoseLostAlert() {},
    hideCombo() {},
    triggerCameraFlash() { flashTriggered = true; },
    setPolaroidImage() { polaroidSet = true; },
    updateCampBadge() {},
    showVictory() { victoryShown = true; }
  };

  const g = Object.assign(Object.create(Game.prototype), {
    state: 'PLAYING',
    targetCount: 6,
    collectedCount: 0,
    activeAnimalId: 'frog',
    audioManager: audio,
    uiManager: mockUI,
    campManager: camp,
    balloon: { setEnergy() {}, startTakeoff() {} },
    rescueAnimal: { animalId: 'frog', setEnergy() {}, startEscape() {} },
    bubbleManager: {
      lastPoppedEnergy: 2,
      clearActiveBubble() {},
      resetCombo() {},
      spawnNext() {}
    },
    videoElement: {readyState:2,videoWidth:1280,paused:false,srcObject:{getVideoTracks:()=>[{readyState:'live',enabled:true}]}},
    lifecycleSessionId: 1
  });

  // 模拟果冻大泡泡破裂 (+2 能量)
  g.onBubblePopped(2);
  assert.equal(g.collectedCount, 2, '果冻大泡泡破裂后 collectedCount 应从 0 跃升为 2');

  // 再戳破 2 次（每次+2），达到 6 满分胜利
  g.onBubblePopped(2);
  assert.equal(g.collectedCount, 4);

  g.onBubblePopped(2);
  assert.equal(g.collectedCount, 6);
  assert.equal(g.state, 'CELEBRATING', '满分后应进入 CELEBRATING 状态');

  // 拍照发生在动物挥别与准备完成后，胜利时不提前播放快门。
  assert.equal(audio.calls.some(c => c.type === 'playCameraShutter'), false);
  assert.equal(flashTriggered, false);

  // 验证营地自动记录
  assert.equal(camp.getAnimalRescueCount('frog'), 1, '营地应当已自动记录青蛙解救 1 次');

  // 就绪后先展示成果，只有显式选择拍照才播放快门。
  g.showVictoryWhenReady();
  assert.equal(audio.calls.some(c => c.type === 'playCameraShutter'), false);
  assert.equal(victoryShown, true);
  g.beginPhoto();
  assert.equal(g.photoRequested, true);
  g.captureVictoryPhoto();
  assert.ok(audio.calls.some(c => c.type === 'playCameraShutter'));
  assert.equal(flashTriggered, true);
  assert.equal(polaroidSet, true, '胜利弹窗应包含拍立得图片');
  assert.equal(victoryShown, true, '应当展示胜利弹窗');
});

console.log(JSON.stringify({
  scope: 'v15 特殊机制泡泡(果冻大泡泡+彩虹流光泡泡+双人同心泡泡)与胜利拍立得抓拍+森林营地图鉴',
  total: results.length,
  passed: results.filter(r => r.pass).length,
  results
}, null, 2));

if (results.some(r => !r.pass)) {
  process.exit(1);
}
