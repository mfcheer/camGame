import assert from 'node:assert/strict';
import * as T from 'three';
import { AudioManager } from '../src/audioManager.js';
import { BubbleManager } from '../src/bubbleManager.js';
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

// 模拟轻量 Web Audio 环境
function createMockAudioContext() {
  const createdOscillators = [];
  const createdGains = [];
  const createdFilters = [];

  class MockParam {
    constructor(val = 0) {
      this.value = val;
      this.events = [];
    }
    setValueAtTime(v, t) { this.events.push({ type: 'set', v, t }); this.value = v; }
    exponentialRampToValueAtTime(v, t) { this.events.push({ type: 'exp', v, t }); this.value = v; }
    linearRampToValueAtTime(v, t) { this.events.push({ type: 'lin', v, t }); this.value = v; }
    cancelScheduledValues(t) { this.events.push({ type: 'cancel', t }); }
  }

  class MockNode {
    constructor() { this.connections = []; }
    connect(dest) { this.connections.push(dest); return dest; }
    disconnect() { this.connections = []; }
  }

  class MockOscillator extends MockNode {
    constructor() {
      super();
      this.type = 'sine';
      this.frequency = new MockParam(440);
      this.started = false;
      this.stopped = false;
      createdOscillators.push(this);
    }
    start(t) { this.started = true; this.startTime = t; }
    stop(t) { this.stopped = true; this.stopTime = t; }
  }

  class MockGain extends MockNode {
    constructor() {
      super();
      this.gain = new MockParam(1);
      createdGains.push(this);
    }
  }

  class MockFilter extends MockNode {
    constructor() {
      super();
      this.type = 'lowpass';
      this.frequency = new MockParam(1000);
      createdFilters.push(this);
    }
  }

  return {
    currentTime: 10.0,
    destination: new MockNode(),
    state: 'running',
    resume: async () => {},
    createOscillator: () => new MockOscillator(),
    createGain: () => new MockGain(),
    createBiquadFilter: () => new MockFilter(),
    createdOscillators,
    createdGains,
    createdFilters
  };
}

// 1. 拟真卡通泡泡破裂与 Combo 音阶爬升
check('泡泡破裂多振荡器调频微合成与 Combo 音阶阶梯爬升', () => {
  const a = new AudioManager();
  const mockCtx = createMockAudioContext();
  a.ctx = mockCtx;
  a.initialized = true;

  // 1.1 基础单发破裂 (combo 0)
  mockCtx.createdOscillators.length = 0;
  a.playPop(0);
  assert.ok(mockCtx.createdOscillators.length >= 2, '基础破裂应包含主波与调制/水珠多层振荡器');
  assert.equal(mockCtx.createdOscillators[0].type, 'sine');

  // 1.2 Combo 1~7 阶梯爬升频率检验
  const comboExpectedFreqs = [523.25, 587.33, 659.25, 698.46, 783.99, 880.00, 987.77];
  for (let c = 1; c <= 7; c++) {
    mockCtx.createdOscillators.length = 0;
    a.playPop(c);
    assert.ok(mockCtx.createdOscillators.length >= 3, `Combo ${c} 应该激活水晶泛音谐波层 (>=3 osc)`);
    // 主波频率首事件
    const mainFreqEvent = mockCtx.createdOscillators[0].frequency.events.find(e => e.type === 'set');
    const expected = comboExpectedFreqs[c - 1] * 0.85;
    assert.ok(
      Math.abs(mainFreqEvent.v - expected) < 1.0,
      `Combo ${c} 起始主频应当对应音阶，实际 ${mainFreqEvent.v}，期望 ${expected}`
    );
  }

  // 1.3 静音状态阻止声音创建
  a.setMuted(true);
  mockCtx.createdOscillators.length = 0;
  a.playPop(3);
  assert.equal(mockCtx.createdOscillators.length, 0, '静音时不应创建任何振荡器');
});

// 2. 能量注入晶莹风铃与金币充盈感
check('能量注入金属水晶风铃与金币多层泛音', () => {
  const a = new AudioManager();
  const mockCtx = createMockAudioContext();
  a.ctx = mockCtx;
  a.initialized = true;

  mockCtx.createdOscillators.length = 0;
  a.playEnergyCharge(3); // 第 3 步 (E5: 659.25)
  assert.ok(mockCtx.createdOscillators.length >= 4, '应包含主音、金币低音与多层水晶风铃谐波');

  // 验证金币层频率为基频一半 659.25 * 0.5 = 329.625
  const coinOsc = mockCtx.createdOscillators[1];
  const coinSet = coinOsc.frequency.events.find(e => e.type === 'set');
  assert.ok(Math.abs(coinSet.v - (659.25 * 0.5)) < 1.0, '金币充盈层频率应为基频的一半');
});

// 3. 6 位萌宠专属拟声与欢呼
check('6 位萌宠专属拟声 (小兔/橘猫/小狗/青蛙/飞龙/金龙) 能量与逃脱音效', () => {
  const a = new AudioManager();
  const mockCtx = createMockAudioContext();
  a.ctx = mockCtx;
  a.initialized = true;

  const animals = ['cat', 'dog', 'frog', 'dragon', 'goldenDragon', 'bunny'];
  for (const animal of animals) {
    // 能量回应
    mockCtx.createdOscillators.length = 0;
    a.playAnimalSound(animal, 'energy');
    assert.ok(mockCtx.createdOscillators.length > 0, `${animal} energy 应生成振荡器`);

    // 欢呼逃生
    mockCtx.createdOscillators.length = 0;
    a.playAnimalSound(animal, 'escape');
    assert.ok(mockCtx.createdOscillators.length > 0, `${animal} escape 应生成振荡器`);
  }

  // 静音阻断
  a.setMuted(true);
  mockCtx.createdOscillators.length = 0;
  a.playAnimalSound('cat', 'escape');
  assert.equal(mockCtx.createdOscillators.length, 0, '静音时不应播放小动物声音');
});

// 4. 5 大舞台场景童话 BGM 系统
check('5 大舞台场景童话 BGM 启动、切换主题、淡入淡出与低通暂停滤波', () => {
  const a = new AudioManager();
  const mockCtx = createMockAudioContext();
  a.ctx = mockCtx;
  a.initialized = true;
  a._setupBGMGraph();

  assert.ok(a.bgmGainNode, '应成功建立 BGM Gain 节点');
  assert.ok(a.bgmFilterNode, '应成功建立 BGM 低通滤波节点');

  // 启动森林 BGM
  a.startBGM('forest');
  assert.equal(a.isBGMPlaying, true);
  assert.equal(a.currentStageId, 'forest');

  // 切换舞台场景
  const stages = ['brook', 'orchard', 'bamboo', 'cloud', 'forest'];
  for (const s of stages) {
    a.setBGMStage(s);
    assert.equal(a.currentStageId, s, `舞台切换至 ${s}`);
    a._tickBGM(); // 步进测试无报错
  }

  // 暂停与恢复 (柔和低通滤波 400Hz)
  a.pauseBGM();
  assert.equal(a.isBGMPaused, true);
  const filterEvents = a.bgmFilterNode.frequency.events;
  const lastFilterEvent = filterEvents[filterEvents.length - 1];
  assert.equal(lastFilterEvent.v, 400, '暂停时应将滤波平滑降至 400Hz 柔和降噪');

  a.resumeBGM();
  assert.equal(a.isBGMPaused, false);
  const resumeFilterEvent = filterEvents[filterEvents.length - 1];
  assert.equal(resumeFilterEvent.v, 4200, '恢复时滤波应恢复常态 4200Hz');

  // 停止与清理
  a.stopBGM(0.1);
  assert.equal(a.isBGMPlaying, false);
});

// 5. 1.5 秒内连续戳破 Combo 连击状态机
check('BubbleManager 1.5 秒连续戳破连击递增与超时重置', () => {
  const scene = new T.Scene();
  const camera = new T.PerspectiveCamera(48, 16 / 9, 0.1, 100);
  const mockAudio = {
    pops: [],
    playPop(combo) { this.pops.push(combo); }
  };
  const bm = new BubbleManager(scene, camera, mockAudio, null);

  let comboHistory = [];
  bm.onComboChange = (c) => comboHistory.push(c);

  bm.createBubble(0);
  bm.popBubble(0.5, 0.5);
  assert.equal(bm.getComboCount(), 1, '第 1 次戳破 combo 为 1');
  assert.equal(mockAudio.pops[0], 1, '音频应收到 combo=1');

  // 100ms 后立即戳破第 2 个 (在 1.5s 内)
  bm.lastPopTime = performance.now() - 100;
  bm.createBubble(1);
  bm.popBubble(0.5, 0.5);
  assert.equal(bm.getComboCount(), 2, '100ms 内连续戳破 combo 应增至 2');
  assert.equal(mockAudio.pops[1], 2, '音频应收到 combo=2');

  // 再次 200ms 后戳破第 3 个
  bm.lastPopTime = performance.now() - 200;
  bm.createBubble(2);
  bm.popBubble(0.5, 0.5);
  assert.equal(bm.getComboCount(), 3, '连续戳破 combo 应增至 3');

  // 冷却不扣时；下一颗泡泡保护结束后，耗尽1.5秒可操作窗口。
  bm.update(0.016, 0);assert.equal(bm.getComboCount(),3);
  bm.createBubble(3);bm.activeBubble.spawnElapsed=.4;
  for(let i=0;i<27;i++)bm.update(.06,i*.06);
  assert.equal(bm.getComboCount(), 0, '超时 1.5s 后 update 应平滑重置 combo 为 0');
  assert.equal(comboHistory[comboHistory.length - 1], 0, '应派发 0 通知 UI 淡出');
});

// 6. 彩虹微光浪圈与浮动 Combo 徽章 UI 状态联动
check('UIManager 彩虹微光浪圈与 Combo 徽章多级等级样式切换', () => {
  const mockClassList = (initial = ['hidden']) => {
    const set = new Set(initial);
    return {
      add: (...cls) => cls.forEach(c => set.add(c)),
      remove: (...cls) => cls.forEach(c => set.delete(c)),
      contains: (c) => set.has(c),
      has: (c) => set.has(c)
    };
  };

  const wave = { classList: mockClassList(['hidden']), style: {} };
  const badge = { classList: mockClassList(['hidden']), style: {}, offsetHeight: 20 };
  const countNum = { textContent: '' };

  const ui = Object.create(UIManager.prototype);
  ui.dom = {
    comboWave: wave,
    comboBadge: badge,
    comboCountNum: countNum
  };

  // combo 1: 不应展示光浪与徽章 (>= 2 连击才触发)
  ui.updateCombo(1);
  assert.ok(wave.classList.contains('hidden'), 'Combo 1 不显示光浪');
  assert.ok(badge.classList.contains('hidden'), 'Combo 1 不显示徽章');

  // combo 2: 展示 tier-1
  ui.updateCombo(2);
  assert.ok(!wave.classList.contains('hidden'), 'Combo 2 激活光浪');
  assert.ok(wave.classList.contains('combo-tier-1'), 'Combo 2 属于 tier-1');
  assert.equal(countNum.textContent, '2');

  // combo 4: 升级为 tier-2
  ui.updateCombo(4);
  assert.ok(wave.classList.contains('combo-tier-2'), 'Combo 4 升级为 tier-2');
  assert.equal(countNum.textContent, '4');

  // combo 7: 升级为 tier-3
  ui.updateCombo(7);
  assert.ok(wave.classList.contains('combo-tier-3'), 'Combo 7 升级为 tier-3');
  assert.equal(countNum.textContent, '7');

  // 隐藏与重置
  ui.hideCombo();
  assert.ok(wave.classList.contains('hidden'), 'hideCombo 隐藏光浪');
  assert.ok(badge.classList.contains('hidden'), 'hideCombo 隐藏徽章');
});

// 7. 游戏主循环全状态机集成：BGM 与小动物声效响应
check('Game 状态机联动：开局起播 BGM、能量注入小动物声效、逃离欢叫与暂停联动', () => {
  const playedAnimalSounds = [];
  let bgmState = 'stopped';
  let bgmStage = null;

  const mockAudio = {
    playPop() {},
    playEnergyCharge() {},
    playCelebration() {},
    playAnimalSound(id, type) { playedAnimalSounds.push({ id, type }); },
    startBGM(stage) { bgmState = 'playing'; bgmStage = stage; },
    stopBGM() { bgmState = 'stopped'; },
    pauseBGM() { bgmState = 'paused'; },
    resumeBGM() { bgmState = 'playing'; },
    setBGMStage(s) { bgmStage = s; }
  };

  const g = Object.assign(Object.create(Game.prototype), {
    state: 'PLAYING',
    activeAnimalId: 'cat',
    targetCount: 5,
    collectedCount: 0,
    audioManager: mockAudio,
    sceneManager: { stageId: 'brook', randomizeStage() {} },
    uiManager: { updateProgress() {}, updateCombo() {}, hideCombo() {} },
    balloon: { setEnergy() {}, startTakeoff() {} },
    rescueAnimal: { animalId: 'cat', setEnergy() {}, startEscape() {}, setPaused() {} },
    bubbleManager: {
      energyProjectiles: [],
      spawnNext() {},
      resetCombo() {},
      clearActiveBubble() {},
      comboCount: 3
    },
    lifecycleSessionId: 1, poseDetector: { resume() {}, pause() {} }
  });

  // 碰破泡泡递送能量 -> 应触发 cat 的 energy 萌声
  g.onBubblePopped();
  assert.ok(
    playedAnimalSounds.some(s => s.id === 'cat' && s.type === 'energy'),
    '能量递送应触发猫咪 energy 拟声'
  );

  // 达成胜利逃生 -> 应触发 cat 的 escape 欢呼
  g.handleVictory();
  clearTimeout(g.celebrationTimer);
  assert.ok(
    playedAnimalSounds.some(s => s.id === 'cat' && s.type === 'escape'),
    '逃跑欢庆应触发猫咪 escape 欢呼'
  );

  // 暂停游戏 -> BGM 暂停
  g.handleTogglePause(true);
  assert.equal(bgmState, 'paused', '暂停游戏应暂停 BGM');

  // 恢复游戏 -> BGM 恢复
  g.handleResume();
  assert.equal(bgmState, 'playing', '恢复游戏应恢复 BGM');
});

console.log(JSON.stringify({
  scope: 'v13 听觉重塑(拟真卡通音效+萌宠叫声+5大舞台BGM)与Combo连击彩虹光浪自动化测试',
  total: results.length,
  passed: results.filter(r => r.pass).length,
  results
}, null, 2));

const allPass = results.every(r => r.pass);
if (!allPass) process.exit(1);

process.exit(0);
