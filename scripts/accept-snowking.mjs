import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import http from 'node:http';

let pw;
try {
  pw = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
} catch {
  pw = await import('playwright-core');
}
const { chromium } = pw;
const defaultExec = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || `${process.env.HOME}/Library/Caches/ms-playwright/chromium-1248/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing`;

const OUT_DIR = path.resolve('output/playwright/snowking');
fs.mkdirSync(OUT_DIR, { recursive: true });

async function ensureDevServer() {
  const isUp = () => new Promise(res => {
    const req = http.get('http://127.0.0.1:5175/', r => res(r.statusCode < 500));
    req.on('error', () => res(false));
  });
  if (await isUp()) return null;
  console.log('Starting dev server internally...');
  const proc = spawn('npm', ['run', 'dev:local'], { stdio: 'ignore' });
  for (let i = 0; i < 30; i++) {
    await new Promise(r => setTimeout(r, 300));
    if (await isUp()) {
      console.log('Dev server ready at http://127.0.0.1:5175/');
      return proc;
    }
  }
  throw new Error('Dev server failed to start within 10s');
}

async function getBubbleScreenPosition(page) {
  return await page.evaluate(() => {
    const g = window.gameInstance;
    if (!g || g.state !== 'PLAYING') return null;
    const b = g.bubbleManager?.activeBubble;
    if (!b || b.isPopping) return null;

    const camera = g.sceneManager?.camera;
    if (!camera) return null;

    const pos = b.group.position.clone();
    pos.project(camera);
    const w = window.innerWidth, h = window.innerHeight;
    return {
      x: (pos.x + 1) * w / 2,
      y: (1 - pos.y) * h / 2
    };
  });
}

async function playNaturalToTarget(page, targetScore = 8) {
  const startTime = Date.now();
  while ((Date.now() - startTime) < 90000) {
    const cur = await page.evaluate(() => ({
      score: window.gameInstance?.collectedCount || 0,
      state: window.gameInstance?.state
    }));
    if (cur.score >= targetScore || cur.state !== 'PLAYING') break;

    await page.waitForFunction(
      () => window.gameInstance?.bubbleManager?.activeBubble?.spawnElapsed > 0.5,
      null,
      { timeout: 15000 }
    );
    const before = await page.evaluate(() => {
      const g = window.gameInstance;
      const b = g?.bubbleManager?.activeBubble;
      const cam = g?.sceneManager?.camera;
      if (!b || !cam) return null;
      const p = b.group.position.clone().project(cam);
      const w = window.innerWidth, h = window.innerHeight;
      return {
        score: g.collectedCount || 0,
        x: Math.round((p.x + 1) * w / 2),
        y: Math.round((1 - p.y) * h / 2)
      };
    });

    if (before) {
      await page.mouse.move(before.x > 600 ? 200 : 800, 100);
      await page.mouse.move(before.x, before.y, { steps: 6 });
      await page.waitForFunction(
        score => window.gameInstance?.collectedCount > score,
        before.score,
        { timeout: 8000 }
      );
      await page.mouse.move(before.x > 600 ? 200 : 800, 100);
      console.log(`  Natural pop progress: ${before.score + 1}/${targetScore}`);
    }
  }
  const finalScore = await page.evaluate(() => window.gameInstance?.collectedCount || 0);
  assert.ok(finalScore >= targetScore, `Failed to reach target score naturally, only reached ${finalScore}`);
}

async function runAcceptance() {
  console.log('=== Starting Snow King Full In-Browser Natural Acceptance ===');
  const devProc = await ensureDevServer();
  const browser = await chromium.launch({
    headless: true,
    executablePath: defaultExec,
    args: ['--use-gl=angle', '--use-angle=swiftshader']
  });

  try {
    // ----------------------------------------------------
    // 1. 横屏 iPad 视口 (1194 x 834)
    // ----------------------------------------------------
    console.log('\n[1/4] Testing Landscape Viewport (1194 x 834)...');
    const pageL = await browser.newPage({ viewport: { width: 1194, height: 834 } });
    await pageL.goto('http://127.0.0.1:5175/');
    await pageL.waitForSelector('button[data-animal="snowking"]', { timeout: 10000 });

    // 选择雪王
    await pageL.click('button[data-animal="snowking"]');
    await pageL.waitForTimeout(300);

    // 点击模拟体验进入游戏
    const btnSim = await pageL.$('#btn-start-simulation, .btn-simulation, #btn-demo-mode, #btn-ready-go');
    if (btnSim) await btnSim.click();
    await pageL.waitForFunction(() => window.gameInstance?.state === 'PLAYING', null, { timeout: 10000 });
    await pageL.waitForTimeout(800);

    // 截图 01: 横屏受困待机游玩画面
    const p1 = path.join(OUT_DIR, '01_landscape_playing.png');
    await pageL.screenshot({ path: p1 });
    console.log('  Saved:', p1);

    // 真实手指/鼠标滑动碰破 8 颗泡泡
    console.log('  Naturally popping 8 bubbles via mouse moves...');
    await playNaturalToTarget(pageL, 8);

    // 等待自然问答并进入 choosing 阶段
    console.log('  Waiting for dialogue question choosing stage...');
    await pageL.waitForFunction(() => window.gameInstance?.dialogue?.stage === 'choosing', null, { timeout: 15000 });
    await pageL.waitForTimeout(400);

    // 截图 02: 横屏问答互动画面
    const p2 = path.join(OUT_DIR, '02_landscape_dialogue.png');
    await pageL.screenshot({ path: p2 });
    console.log('  Saved:', p2);

    // 真实触发 pointerdown 选中回答选项
    console.log('  Selecting answer bubble...');
    await pageL.dispatchEvent('.dialogue-bubble:not([disabled])', 'pointerdown');

    // 等待进入告别状态
    console.log('  Waiting for farewell animation...');
    await pageL.waitForFunction(() => window.gameInstance?.rescueAnimal?.state === 'WAVING', null, { timeout: 25000 });
    await pageL.waitForTimeout(400);

    // 截图 03: 横屏告别画面
    const p3 = path.join(OUT_DIR, '03_landscape_farewell.png');
    await pageL.screenshot({ path: p3 });
    console.log('  Saved:', p3);

    // 等待进入结算与开心小演出
    console.log('  Waiting for victory performance & results...');
    await pageL.waitForFunction(() => window.gameInstance?.resultVisible || window.gameInstance?.rescueAnimal?.state === 'ESCAPED', null, { timeout: 35000 });
    await pageL.waitForTimeout(1000);

    // 截图 04: 横屏开心小演出与结算
    const p4 = path.join(OUT_DIR, '04_landscape_victory_performance.png');
    await pageL.screenshot({ path: p4 });
    console.log('  Saved:', p4);

    await pageL.close();

    // ----------------------------------------------------
    // 2. 竖屏 iPad 视口 (834 x 1194)
    // ----------------------------------------------------
    console.log('\n[2/4] Testing Portrait Viewport (834 x 1194)...');
    const pageP = await browser.newPage({ viewport: { width: 834, height: 1194 } });
    await pageP.goto('http://127.0.0.1:5175/');
    await pageP.waitForSelector('button[data-animal="snowking"]', { timeout: 10000 });

    // 选择雪王并开始
    await pageP.click('button[data-animal="snowking"]');
    await pageP.waitForTimeout(300);
    const btnSimP = await pageP.$('#btn-start-simulation, .btn-simulation, #btn-demo-mode, #btn-ready-go');
    if (btnSimP) await btnSimP.click();
    await pageP.waitForFunction(() => window.gameInstance?.state === 'PLAYING', null, { timeout: 10000 });
    await pageP.waitForTimeout(800);

    // 截图 05: 竖屏游玩
    const p5 = path.join(OUT_DIR, '05_portrait_playing.png');
    await pageP.screenshot({ path: p5 });
    console.log('  Saved:', p5);

    // 碰破 8 颗泡泡
    console.log('  Naturally popping 8 bubbles in portrait mode...');
    await playNaturalToTarget(pageP, 8);

    // 问答 choosing 阶段
    console.log('  Waiting for portrait dialogue choosing stage...');
    await pageP.waitForFunction(() => window.gameInstance?.dialogue?.stage === 'choosing', null, { timeout: 15000 });
    await pageP.waitForTimeout(400);
    const p6 = path.join(OUT_DIR, '06_portrait_dialogue.png');
    await pageP.screenshot({ path: p6 });
    console.log('  Saved:', p6);

    // 选中回答选项
    await pageP.dispatchEvent('.dialogue-bubble:not([disabled])', 'pointerdown');

    // 告别
    await pageP.waitForFunction(() => window.gameInstance?.rescueAnimal?.state === 'WAVING', null, { timeout: 25000 });
    await pageP.waitForTimeout(400);
    const p7 = path.join(OUT_DIR, '07_portrait_farewell.png');
    await pageP.screenshot({ path: p7 });
    console.log('  Saved:', p7);

    // 结算
    await pageP.waitForFunction(() => window.gameInstance?.resultVisible || window.gameInstance?.rescueAnimal?.state === 'ESCAPED', null, { timeout: 35000 });
    await pageP.waitForTimeout(1000);
    const p8 = path.join(OUT_DIR, '08_portrait_victory.png');
    await pageP.screenshot({ path: p8 });
    console.log('  Saved:', p8);

    await pageP.close();

    // ----------------------------------------------------
    // 3. GLB 加载失败平滑降级回退原生 Three.js 模型验证
    // ----------------------------------------------------
    console.log('\n[3/4] Testing GLB Fallback to Native Three.js Model...');
    const pageF = await browser.newPage({ viewport: { width: 1194, height: 834 } });
    await pageF.route('**/models/snowking.glb', route => route.abort('failed'));
    await pageF.goto('http://127.0.0.1:5175/');
    await pageF.waitForSelector('button[data-animal="snowking"]', { timeout: 10000 });
    await pageF.click('button[data-animal="snowking"]');
    await pageF.waitForTimeout(300);
    const btnSimF = await pageF.$('#btn-start-simulation, .btn-simulation, #btn-demo-mode, #btn-ready-go');
    if (btnSimF) await btnSimF.click();
    await pageF.waitForFunction(() => window.gameInstance?.state === 'PLAYING', null, { timeout: 10000 });
    await pageF.waitForTimeout(800);

    const assetStatus = await pageF.evaluate(() => window.gameInstance?.rescueAnimal?.assetStatus);
    assert.ok(assetStatus === 'fallback' || assetStatus === 'native', 'Animal should fall back smoothly to native Three.js model');
    const p9 = path.join(OUT_DIR, '09_glb_fallback_playing.png');
    await pageF.screenshot({ path: p9 });
    console.log('  Saved:', p9);
    await pageF.close();

    // ----------------------------------------------------
    // 4. 独立开心小演出姿态中段目检截图
    // ----------------------------------------------------
    console.log('\n[4/4] Testing Performance Mid-action Poses...');
    const pagePerf = await browser.newPage({ viewport: { width: 1194, height: 834 } });
    await pagePerf.goto('http://127.0.0.1:5175/');
    await pagePerf.waitForSelector('button[data-animal="snowking"]', { timeout: 10000 });
    await pagePerf.click('button[data-animal="snowking"]');
    const btnSimPerf = await pagePerf.$('#btn-start-simulation, .btn-simulation, #btn-demo-mode, #btn-ready-go');
    if (btnSimPerf) await btnSimPerf.click();
    await pagePerf.waitForFunction(() => window.gameInstance?.state === 'PLAYING', null, { timeout: 10000 });

    const actions = await pagePerf.evaluate(() => {
      const g = window.gameInstance;
      const hp = g.friendInteraction;
      const plan = hp.start();
      return plan;
    });
    console.log('  Performance plan actions:', actions);

    await pagePerf.waitForTimeout(900);
    const p10 = path.join(OUT_DIR, '10_performance_stage_waltz.png');
    await pagePerf.screenshot({ path: p10 });
    console.log('  Saved:', p10);

    await pagePerf.waitForTimeout(2000);
    const p11 = path.join(OUT_DIR, '11_performance_stage_finale.png');
    await pagePerf.screenshot({ path: p11 });
    console.log('  Saved:', p11);

    await pagePerf.close();
  } finally {
    await browser.close();
    if (devProc) devProc.kill();
  }
  console.log('\n=== All Snow King In-Browser Natural Acceptance Tests Completed Successfully! ===');
}

runAcceptance().catch(err => {
  console.error('Acceptance test failed:', err);
  process.exit(1);
});
