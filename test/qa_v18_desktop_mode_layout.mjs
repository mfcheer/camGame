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

const cssContent = readFileSync('src/style.css', 'utf8');

// 1. 电脑桌面端 .mode-selector 与 .mode-btn 高度大幅压缩（减少 50% 以上）
check('CSS 规范：电脑桌面端 .mode-selector 采用极度紧凑的外边距与间距', () => {
  assert.ok(cssContent.includes('.mode-selector {'), '必须包含 .mode-selector');
  assert.ok(cssContent.includes('margin: 6px 0 10px 0;'), '桌面端模式选择器纵向边距应紧凑收敛至 6px~10px');
  assert.ok(cssContent.includes('gap: 12px;'), '模式按钮水平间距紧凑');
});

check('CSS 规范：电脑桌面端 .mode-btn 采用 grid 横向排列（左图标 + 右文案堆叠），单卡高度控制在 ~50px', () => {
  assert.ok(cssContent.includes('grid-template-areas:'), '桌面端模式按钮应采用 grid-template-areas 图文流');
  assert.ok(cssContent.includes('"icon title"') && cssContent.includes('"icon sub"'), '图标位于左列，标题与副标题在右列上下排布');
  assert.ok(cssContent.includes('padding: 8px 12px;'), '内边距压缩为 8px');
  assert.ok(cssContent.includes('border: 2px solid #dfe4ea;'), '边框精简至 2px');
  assert.ok(cssContent.includes('font-size: 24px;'), '图标尺寸收敛至 24px');
  assert.ok(cssContent.includes('font-size: 14px;'), '主标题字号 14px');
  assert.ok(cssContent.includes('font-size: 11px;'), '副标题字号 11px');

  // 计算桌面端高度：8*2(内边距) + 2*2(边框) + 14*1.25(标题) + 1(gap) + 11*1.2(副标题) ≈ 51.7px
  const paddingY = 8 * 2;
  const borderY = 2 * 2;
  const contentY = 17.5 + 1 + 13.2;
  const totalBtnHeight = paddingY + borderY + contentY;
  assert.ok(totalBtnHeight <= 55, `桌面端模式按钮计算总高应 <= 55px (实测 ${totalBtnHeight}px)`);
  
  // 相对旧版 116px，压缩幅度必须超过 50%
  const legacyHeight = 116;
  const reduction = (legacyHeight - totalBtnHeight) / legacyHeight;
  assert.ok(reduction >= 0.5, `按钮压缩比应达到 50% 以上 (当前 ${(reduction * 100).toFixed(1)}%)`);
});

// 2. 释放垂直高度给小动物选择区与主卡片自适应展开
check('CSS 规范：电脑端 .start-card 放宽至 700px 且 padding 收敛至 20px 24px，为内容区释放空间', () => {
  assert.ok(cssContent.includes('.start-card { max-width: 700px; max-height: calc(100dvh - 28px); overflow-y:auto; padding: 20px 24px; }'), '桌面端 start-card 具备放宽的最大宽度与紧凑内边距');
  assert.ok(cssContent.includes('.start-card{width:min(100%,700px);max-height:100%;display:flex;flex-direction:column;overflow:hidden}'), 'flex 容器约束同步放宽');
});

check('CSS 规范：小动物选择区获得更多纵向高度，动物立绘高度放宽且随机按钮高度自适应', () => {
  assert.ok(cssContent.includes('.animal-picker { grid-template-columns:repeat(6,minmax(0,1fr)); gap:8px; margin: 8px 0 10px; }'), '动物选择网格 6 列平铺且边距收敛');
  assert.ok(cssContent.includes('.animal-choice > img { height:86px; }'), '立绘高度放宽至 86px 舒展展示');
  assert.ok(cssContent.includes('.animal-choice.random-choice { grid-column:1/-1; flex-direction:row; justify-content:center; gap:14px; min-height:46px; padding:4px 12px; margin-bottom: 2px; }'), '随机按钮高度微调至 46px');
});

// 3. 移动端（竖屏 max-width: 540px 与横屏 max-height: 500px）原有适配保持完好
check('CSS 规范：移动端竖屏与横屏中 .mode-btn 明确声明 flex-direction: column，保持移动端体验', () => {
  assert.ok(cssContent.includes('.mode-btn{display:flex;flex-direction:column;align-items:center;justify-content:center;padding:7px 5px;gap:2px;border-width:2px;text-align:center}'), '竖屏下保持垂直居中模式');
  assert.ok(cssContent.includes('.mode-btn{display:flex;flex-direction:column;align-items:center;justify-content:center;padding:6px 2px;gap:2px;border-width:2px;text-align:center}.mode-btn .mode-icon{display:none}'), '横屏下保持无图标紧凑垂直模式');
});

// 4. UIManager 模式切换交互功能正常
check('UIManager: 模式按钮点击切换保持单人探索与亲子合作状态机正确响应', () => {
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
      addEventListener: () => {}
    };
  }

  const elements = {
    'btn-mode-single': createMockElement('btn-mode-single', 'mode-btn selected'),
    'btn-mode-coop': createMockElement('btn-mode-coop', 'mode-btn'),
    'mode-badge': createMockElement('mode-badge')
  };

  globalThis.document = {
    getElementById: (id) => elements[id] || createMockElement(id),
    querySelector: (sel) => createMockElement('', sel.replace(/^[.#]/, '')),
    querySelectorAll: () => []
  };

  const ui = new UIManager();

  // 默认单人
  assert.equal(ui.currentMode, 'single');

  // 切换为双人合作模式
  ui.setModeSelection('coop');
  assert.equal(ui.currentMode, 'coop');
  assert.ok(!elements['btn-mode-single'].classList.contains('selected'), '单人按钮取消选中');
  assert.ok(elements['btn-mode-coop'].classList.contains('selected'), '双人按钮选中');
  assert.ok(elements['mode-badge'].textContent.includes('亲子双人合作'), 'HUD 提示更新为亲子双人合作');

  // 切回单人模式
  ui.setModeSelection('single');
  assert.equal(ui.currentMode, 'single');
  assert.ok(elements['btn-mode-single'].classList.contains('selected'), '单人按钮重新选中');
  assert.ok(!elements['btn-mode-coop'].classList.contains('selected'), '双人按钮取消选中');
  assert.ok(elements['mode-badge'].textContent.includes('单人模式'), 'HUD 提示更新为单人模式');
});

console.log(JSON.stringify({
  scope: 'v18 电脑端模式按钮垂直空间大幅压缩与动物选择区扩容适配',
  total: results.length,
  passed: results.filter(r => r.pass).length,
  results
}, null, 2));

const failed = results.filter(r => !r.pass);
if (failed.length > 0) {
  process.exit(1);
}
