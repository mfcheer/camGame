import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

test('QA-19: 结算弹窗返回首页按钮精简与防换行排版验证', async (t) => {
  const htmlContent = fs.readFileSync(path.resolve('index.html'), 'utf-8');
  const cssContent = fs.readFileSync(path.resolve('src/style.css'), 'utf-8');

  await t.test('1. index.html 中按钮文案精简为「返回首页 🏠」，字数适中且对称', () => {
    assert.ok(htmlContent.includes('id="btn-victory-exit"'), '必须包含 #btn-victory-exit 按钮');
    assert.ok(!htmlContent.includes('换个朋友 / 回首页'), '不应再包含冗长易折行的“换个朋友 / 回首页”文案');
    
    // 匹配按钮内部文本
    const match = htmlContent.match(/<button id="btn-victory-exit"[^>]*>(.*?)<\/button>/);
    assert.ok(match, '应匹配到 #btn-victory-exit 按钮内容');
    const buttonText = match[1].trim();
    assert.equal(buttonText, '返回首页 🏠', '按钮文本应严格为「返回首页 🏠」');
    assert.ok(buttonText.length <= 8, `按钮字符长度应简短（当前为 ${buttonText.length}）`);
  });

  await t.test('2. src/style.css 在基础与多端媒体查询中均强制 white-space: nowrap 防御折行', () => {
    // 基础规则
    assert.match(
      cssContent,
      /\.victory-actions\s+button\s*\{[^}]*white-space:\s*nowrap/i,
      '基础 .victory-actions button 规则必须包含 white-space: nowrap'
    );

    // 移动端/响应式紧凑规则
    assert.match(
      cssContent,
      /\.victory-actions\s*button\s*\{[^}]*flex:\s*1\s+1\s+120px[^}]*white-space:\s*nowrap/i,
      '响应式 .victory-actions button 必须具备 min-width:0 及 white-space: nowrap'
    );

    // 900px 规则
    assert.match(
      cssContent,
      /\.victory-actions\s*button\{[^}]*min-height:\s*38px;white-space:\s*nowrap/i,
      '900px 媒体查询必须包含 white-space: nowrap'
    );

    // 横屏矮视口规则
    assert.match(
      cssContent,
      /\.victory-actions\s+button\s*\{[^}]*flex:\s*1\s+1\s+0;[^}]*white-space:\s*nowrap/i,
      '横屏媒体查询必须包含 white-space: nowrap'
    );
  });

  await t.test('3. 对称性与空间利用测试：再解救一次与返回首页体量相当', () => {
    const playAgainMatch = htmlContent.match(/<button id="btn-play-again"[^>]*>(.*?)<\/button>/);
    const exitMatch = htmlContent.match(/<button id="btn-victory-exit"[^>]*>(.*?)<\/button>/);
    assert.ok(playAgainMatch && exitMatch, '必须同时包含再解救一次和返回首页按钮');

    const playAgainText = playAgainMatch[1].trim(); // "再解救一次 🎈" (7 chars)
    const exitText = exitMatch[1].trim(); // "返回首页 🏠" (6 chars)
    const lenDiff = Math.abs(playAgainText.length - exitText.length);
    assert.ok(lenDiff <= 2, `两按钮文字长度差异应很小以保持视觉平衡（当前差值: ${lenDiff}）`);
  });
});
