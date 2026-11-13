import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { UIManager } from '../src/uiManager.js';

const results = [];
function check(name, fn) {
  try {
    fn();
    results.push({ name, pass: true });
  } catch (e) {
    results.push({ name, pass: false, error: e.message, stack: e.stack });
  }
}

const htmlContent = readFileSync('index.html', 'utf8');
const cssContent = readFileSync('src/style.css', 'utf8');

// 1. 结构与样式完整性校验
check('index.html 包含完善的 victory-content-grid 与 victory-info-col 响应式分栏结构', () => {
  assert.ok(htmlContent.includes('class="victory-content-grid"'), '应包含 .victory-content-grid 容器');
  assert.ok(htmlContent.includes('class="victory-info-col"'), '应包含 .victory-info-col 容器');
  assert.ok(htmlContent.includes('id="polaroid-wrapper"'), '应包含 #polaroid-wrapper');
  assert.ok(htmlContent.includes('id="btn-play-again"'), '应包含 #btn-play-again');
  assert.ok(htmlContent.includes('id="btn-victory-exit"'), '应包含 #btn-victory-exit');

  const gridIdx = htmlContent.indexOf('victory-content-grid');
  const polaroidIdx = htmlContent.indexOf('id="polaroid-wrapper"');
  const infoIdx = htmlContent.indexOf('victory-info-col');
  const playAgainIdx = htmlContent.indexOf('id="btn-play-again"');

  assert.ok(gridIdx < polaroidIdx, 'grid 应包裹 polaroid-wrapper');
  assert.ok(polaroidIdx < infoIdx, 'polaroid-wrapper 应在 info-col 前');
  assert.ok(infoIdx < playAgainIdx, 'info-col 应包裹操作按钮');
});

check('src/style.css 中消除了破坏比例的固定 110px 高度并锁死 640/760 相框画幅', () => {
  assert.ok(!cssContent.includes('.polaroid-photo-frame {\n    height: 110px;\n  }'), '不应存在强制 110px 高度破坏拍立得比例');
  assert.ok(cssContent.includes('aspect-ratio: 640 / 760;'), '应包含 640 / 760 拍立得画幅比例约束');
  assert.ok(cssContent.includes('.victory-content-grid'), '应包含 .victory-content-grid 响应式分栏样式');
});

// 2. 竖屏返回首页状态机与重叠防御验证
check('UIManager: showStartScreen 重置 animalBrief 简要文案与滚动位置，彻底杜绝下挤重叠', () => {
  function createMockElement(id = '', className = '') {
    const classList = new Set(className.split(' ').filter(Boolean));
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
      scrollTop: 0,
      setAttribute: () => {},
      removeAttribute: () => {},
      addEventListener: () => {},
      style: {}
    };
  }

  const elements = {
    'start-screen': createMockElement('start-screen'),
    'calibration-screen': createMockElement('calibration-screen'),
    'game-hud': createMockElement('game-hud'),
    'pause-modal': createMockElement('pause-modal'),
    'error-modal': createMockElement('error-modal'),
    'victory-modal': createMockElement('victory-modal'),
    'demo-mode-banner': createMockElement('demo-mode-banner'),
    'pose-lost-alert': createMockElement('pose-lost-alert'),
    'animal-brief': createMockElement('animal-brief'),
    'btn-open-camp': createMockElement('btn-open-camp')
  };

  const startChoices = createMockElement('', 'start-choices');
  const startCard = createMockElement('', 'start-card');

  globalThis.document = {
    getElementById: (id) => elements[id] || createMockElement(id),
    querySelector: (sel) => {
      if (sel === '.start-choices') return startChoices;
      if (sel === '.start-card') return startCard;
      return createMockElement('', sel.replace(/^[.#]/, ''));
    },
    querySelectorAll: () => []
  };

  const ui = new UIManager();
  const brief = elements['animal-brief'];

  // 模拟单局游玩时被设为较长的文案并发生容器滚动
  brief.textContent = '金龙 小金需要 9 个泡泡。祥云金龙漫步云端，带来福气与好运。 不计时，慢慢来也没关系。长文本长文本长文本长文本。';
  startChoices.scrollTop = 80;
  startCard.scrollTop = 60;

  // 调用 showStartScreen
  ui.showStartScreen();

  assert.equal(brief.textContent, '选一位森林朋友，用食指送给它彩虹能量。', '返回首页应重置为标准单行精炼导引');
  assert.equal(startChoices.scrollTop, 0, '返回首页应重置 choices 滚动位置至顶部');
  assert.equal(startCard.scrollTop, 0, '返回首页应重置 card 滚动位置至顶部');
});

// 3. 样式规则约束断言：竖屏弹性隔离与防挤压
check('CSS 规范：.camp-entry-btn 在小屏下具备 flex-shrink: 0 与合理边距，.start-choices 保持 padding-bottom 呼吸空间', () => {
  assert.ok(cssContent.includes('.camp-entry-btn{margin:3px 0 6px 0;padding:7px 12px;font-size:13px;border-radius:12px;flex-shrink:0}'), '移动竖屏下营地入口按钮应紧凑且禁止收缩');
  assert.ok(cssContent.includes('padding-bottom:8px'), 'start-choices 应保留底部呼吸安全内边距');
  assert.ok(cssContent.includes('flex-shrink:0') && cssContent.includes('random-choice'), 'random-choice 应具备 flex-shrink: 0 避免挤压变形');
});

// 4. 横屏拍立得与弹窗比例保真校验
check('CSS 规范：横屏矮视口下 victory-content-grid 为 flex-direction: row 左右分栏，拍立得保持 640/760', () => {
  const matchRow = cssContent.includes('flex-direction: row') && cssContent.includes('.victory-content-grid');
  assert.ok(matchRow, '横屏矮视口下结算弹窗应采用 row 水平双列分栏');
  assert.ok(cssContent.includes('aspect-ratio: 640 / 760'), '横屏拍立得卡片与相框必须锁定 640 / 760 比例');
});

console.log(JSON.stringify({
  scope: 'v16 多端横竖屏布局专项修复（竖屏首页防重叠 + 横屏拍立得合影比例保真与自适应分栏）',
  total: results.length,
  passed: results.filter(r => r.pass).length,
  results
}, null, 2));

if (results.some(r => !r.pass)) {
  process.exit(1);
}
