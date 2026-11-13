import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { Game } from '../src/main.js';
import { UIManager } from '../src/uiManager.js';
import { CampManager, CAMP_ANIMALS } from '../src/campManager.js';

const results = [];
function check(name, fn) {
  try {
    fn();
    results.push({ name, pass: true });
  } catch (e) {
    results.push({ name, pass: false, error: e.message, stack: e.stack });
  }
}

const cssContent = readFileSync('src/style.css', 'utf8');

// 1. CSS 规范断言：横屏下森林营地弹窗紧凑全景一屏览（方案 A）
check('CSS 规范：横屏矮视口下 #camp-modal 与 .camp-card 具备居中和紧凑内边距与最大宽度放宽', () => {
  assert.ok(cssContent.includes('#camp-modal {'), '必须包含 #camp-modal 横屏适配规则');
  assert.ok(cssContent.includes('.camp-card {'), '必须包含 .camp-card 横屏卡片样式');
  assert.ok(cssContent.includes('width: min(100%, 780px)'), '横屏卡片最大宽度应适度放宽至 780px 以容纳全景 6 列');
  assert.ok(cssContent.includes('padding: 8px 14px 8px 14px'), '横屏卡片纵向内边距应压缩至 8px 保证极致空间利用');
});

check('CSS 规范：横屏矮视口下 .camp-header 紧凑横向排布，标题与统计文案不堆叠挤占高度', () => {
  assert.ok(cssContent.includes('.camp-header {') && cssContent.includes('justify-content: space-between'), '营地头部在横屏应采用水平左右两端对齐/弹性分流');
  assert.ok(cssContent.includes('.camp-header h2 {') && cssContent.includes('font-size: 15px'), '营地标题在横屏应精简至 15px');
  assert.ok(cssContent.includes('.camp-tip {') && cssContent.includes('font-size: 10px'), '营地提示小字在横屏应精简至 10px');
});

check('CSS 规范：标准横屏下 .camp-grid 采用 6 列全景一排平铺，动物头像与文字比例自适应紧凑', () => {
  assert.ok(cssContent.includes('grid-template-columns: repeat(6, minmax(0, 1fr))'), '标准横屏下应呈现 1 行 6 列一屏尽收眼底');
  assert.ok(cssContent.includes('.camp-animal-avatar-wrapper {') && cssContent.includes('height: 38px'), '横屏头像容器高度压缩至 38px');
  assert.ok(cssContent.includes('.camp-animal-name {') && cssContent.includes('text-overflow: ellipsis'), '动物名字应配置单行截断防御防撑爆');
  assert.ok(cssContent.includes('.camp-animal-status {') && cssContent.includes('text-overflow: ellipsis'), '状态文字配置截断防御');
});

check('CSS 规范：针对超窄横屏（<=620px）自适应切换为 3 列 2 行模式，保障小屏不溢出', () => {
  assert.ok(cssContent.includes('@media (max-height: 500px) and (max-width: 620px) and (min-aspect-ratio: 1/1)'), '包含超窄横屏专项媒体查询');
  assert.ok(cssContent.includes('grid-template-columns: repeat(3, minmax(0, 1fr))'), '超窄横屏应平滑回退为 2 行 3 列');
});

// 2. DOM 交互与营地数据驱动校验
check('UIManager: showCamp 生成 6 位动物卡片，正确区分已解救与未解锁状态及动效事件', () => {
  function createMockElement(id = '', className = '') {
    const classList = new Set(className.split(' ').filter(Boolean));
    const children = [];
    const listeners = {};
    return {
      id,
      className,
      classList: {
        add: (c) => classList.add(c),
        remove: (c) => classList.delete(c),
        contains: (c) => classList.has(c),
        toggle: (c, v) => (v ?? !classList.has(c)) ? classList.add(c) : classList.delete(c)
      },
      textContent: '',
      innerHTML: '',
      appendChild: (node) => children.push(node),
      get children() { return children; },
      setAttribute: () => {},
      removeAttribute: () => {},
      addEventListener: (evt, fn) => { listeners[evt] = fn; },
      trigger: (evt) => listeners[evt]?.(),
      style: {}
    };
  }

  const elements = {
    'camp-modal': createMockElement('camp-modal', 'modal-overlay hidden'),
    'camp-grid': createMockElement('camp-grid'),
    'camp-unlocked-count': createMockElement('camp-unlocked-count'),
    'camp-total-count': createMockElement('camp-total-count'),
    'btn-close-camp': createMockElement('btn-close-camp')
  };

  globalThis.document = {
    getElementById: (id) => elements[id] || createMockElement(id),
    createElement: (tag) => createMockElement('', tag),
    querySelector: () => null,
    querySelectorAll: () => []
  };

  const mockStorage = {
    _data: {},
    getItem: (k) => mockStorage._data[k] || null,
    setItem: (k, v) => { mockStorage._data[k] = String(v); },
    removeItem: (k) => { delete mockStorage._data[k]; }
  };
  const camp = new CampManager(mockStorage);
  camp.recordRescue('bunny');
  camp.recordRescue('cat');

  let playedSounds = [];
  const mockAudio = {
    playAnimalSound: (id, action) => { playedSounds.push({ id, action }); }
  };

  const ui = new UIManager();
  ui.showCamp(camp, mockAudio);

  assert.equal(elements['camp-modal'].classList.contains('hidden'), false, '营地弹窗应展示');
  assert.equal(elements['camp-unlocked-count'].textContent, '2', '解锁数应显示 2');
  assert.equal(elements['camp-total-count'].textContent, '2', '累计解救数应显示 2');
  assert.equal(elements['camp-grid'].children.length, 6, '必须生成全部 6 位小动物卡片');

  const bunnyCard = elements['camp-grid'].children[0];
  assert.ok(bunnyCard.className.includes('unlocked'), '小兔应为 unlocked 状态');
  bunnyCard.trigger('click');
  assert.ok(bunnyCard.classList.contains('camp-card-bounce'), '已点亮卡片点击应附加 bounce 动画');
  assert.equal(playedSounds.length, 1);
  assert.equal(playedSounds[0].id, 'bunny');

  const frogCard = elements['camp-grid'].children[2];
  assert.ok(frogCard.className.includes('locked'), '青蛙应为 locked 状态');
  frogCard.trigger('click');
  assert.ok(frogCard.classList.contains('camp-card-shake'), '未解锁卡片点击应附加 shake 抖动动画');

  ui.hideCamp();
  assert.equal(elements['camp-modal'].classList.contains('hidden'), true, '关闭营地弹窗后应恢复 hidden');
});


// 3. 胜利结算智能驻留与 12 秒倒计时优化（方案 A）
check('Game: startAutoNext 放宽至 12 秒倒计时，cancelAutoNext(true, "keep_photo") 正确切换友好驻留文案', () => {
  const previousSet = globalThis.setTimeout;
  const previousClear = globalThis.clearTimeout;
  let scheduledDelay = 0;
  let statusMessage = "";

  globalThis.setTimeout = (fn, ms) => { scheduledDelay = ms; return 999; };
  globalThis.clearTimeout = () => {};

  try {
    const g = Object.assign(Object.create(Game.prototype), {
      state: "CELEBRATING",
      resultVisible: true,
      celebrationSessionId: 1,
      uiManager: {
        setAutoNextCountdown(sec, customMsg) {
          statusMessage = customMsg || (sec === null ? "合影已为你保留，想玩时点击「再玩一次」" : `${sec} 秒后随机遇见下一位朋友`);
        }
      }
    });

    g.startAutoNext();
    assert.equal(scheduledDelay, 12000, "自动开始倒计时应由 5 秒放宽到 12 秒");
    assert.equal(statusMessage, "12 秒后随机遇见下一位朋友");

    // 智能驻留取消
    g.cancelAutoNext(true, "keep_photo");
    assert.equal(statusMessage, "合影已为你保留，想玩时点击「再玩一次」", "驻留文案必须明确提示已保留合影");
  } finally {
    globalThis.setTimeout = previousSet;
    globalThis.clearTimeout = previousClear;
  }
});

check('UIManager: markPolaroidSaved 将按钮变为绿色“已保存 ✓”并附带 btn-saved，showVictory 重置按钮状态', () => {
  function createMockElem(id = "", className = "") {
    const classList = new Set(className.split(" ").filter(Boolean));
    return {
      id,
      className,
      classList: {
        add: (c) => classList.add(c),
        remove: (c) => classList.delete(c),
        contains: (c) => classList.has(c)
      },
      textContent: "保存合影 📸"
    };
  }

  const saveBtn = createMockElem("btn-save-polaroid", "btn-primary btn-save-photo");
  const modal = createMockElem("victory-modal", "modal-overlay hidden");
  const ui = new UIManager();
  ui.dom = { btnSavePolaroid: saveBtn, victoryModal: modal };

  ui.markPolaroidSaved();
  assert.equal(saveBtn.textContent, "已保存 ✓", "保存后按钮文字应变为 已保存 ✓");
  assert.ok(saveBtn.classList.contains("btn-saved"), "保存后按钮应包含 btn-saved 类");

  ui.showVictory();
  assert.equal(saveBtn.textContent, "保存合影 📸", "新一轮胜利弹窗应重置按钮文字为 保存合影 📸");
  assert.equal(saveBtn.classList.contains("btn-saved"), false, "新一轮胜利弹窗应清除 btn-saved 类");
});

console.log(JSON.stringify({
  scope: 'v17 森林营地图鉴横屏全景与胜利拍立得12秒智能驻留（方案 A）',
  total: results.length,
  passed: results.filter(r => r.pass).length,
  results
}, null, 2));

if (results.some(r => !r.pass)) {
  process.exit(1);
}
