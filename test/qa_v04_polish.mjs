import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as T from 'three';
import { BubbleManager } from '../src/bubbleManager.js';
import { HotAirBalloon } from '../src/hotAirBalloon.js';
import { PoseDetector, HandPositionFilter } from '../src/poseDetector.js';
import { SceneManager } from '../src/sceneManager.js';

const results = [];
function check(name, fn) {
  try {
    const res = fn();
    results.push({ name, pass: true });
  } catch (e) {
    results.push({ name, pass: false, actual: e.message });
  }
}

// 1. One-Euro Filter 抖动滤除与跟手特性验证
check('One-Euro Filter 抖动大幅滤除且响应跟手', () => {
  const hf = new HandPositionFilter(1.2, 0.015, 1.0);
  const filtered = [];
  const t0 = 1000;
  for (let i = 0; i < 30; i++) {
    const noise = (i % 2 === 0 ? 0.006 : -0.006);
    const res = hf.filter(0.5 + noise, 0.5 + noise, t0 + i * 16.6);
    filtered.push(res.x);
  }
  const rawSpan = 0.012;
  const filteredSpan = Math.max(...filtered.slice(10)) - Math.min(...filtered.slice(10));
  assert.ok(filteredSpan < rawSpan * 0.5, `Filtered span ${filteredSpan} should be < half raw span ${rawSpan * 0.5}`);
});

// 2. 400ms 出场保护期与防连击秒爆（先移出再移入才触发）
check('400ms 出场保护期与防连击秒爆（必须先出再进才触发）', () => {
  const scene = new T.Scene();
  const camera = new T.PerspectiveCamera(48, 16/9, 0.1, 1000);
  camera.position.z = 7.5;
  camera.updateMatrixWorld();
  const balloon = new HotAirBalloon(scene);
  const bm = new BubbleManager(scene, camera, { playPop() {} }, balloon);

  bm.createBubble(0);
  const b = bm.activeBubble;
  const screenCoord = b.group.position.clone().project(camera);
  const bX = (screenCoord.x + 1) / 2;
  const bY = (1 - screenCoord.y) / 2;

  // 帧更新 1 帧启动保护期
  bm.update(0.016, 0);

  // 400ms 内手停在泡泡上禁止碰破
  const hitProtected = bm.checkHandCollisions([{ id: 1, hands: [{ side: 'left', x: bX, y: bY }] }]);
  assert.equal(hitProtected, false, '保护期内不应触发破裂');
  assert.ok(bm.activeBubble, '保护期内泡泡应当存活');

  // 推进时间跨越 400ms (达到 450ms)
  for (let i = 0; i < 28; i++) {
    bm.update(0.016, 0.016 * (i + 2));
  }
  assert.ok(bm.activeBubble.spawnElapsed >= 0.400);

  // 手仍然停留在泡泡上（未移出过），必须继续压制禁止秒爆
  const hitStillInside = bm.checkHandCollisions([{ id: 1, hands: [{ side: 'left', x: bX, y: bY }] }]);
  assert.equal(hitStillInside, false, '手未离开即秒爆，违背先出再进原则');
  assert.ok(bm.activeBubble, '手未移出前泡泡应当存活');

  // 手离开泡泡
  bm.checkHandCollisions([{ id: 1, hands: [{ side: 'left', x: bX + 0.6, y: bY }] }]);

  // 手重新移入泡泡：有效碰破
  const hitReenter = bm.checkHandCollisions([{ id: 1, hands: [{ side: 'left', x: bX, y: bY }] }]);
  assert.equal(hitReenter, true, '移出后再移入应成功触发碰破');
  assert.equal(bm.activeBubble, null, '碰破后泡泡应当被清理');
});

// 3. 新泡泡防贴手避让
check('新泡泡避手生成（距离当前手部保持安全距离）', () => {
  const scene = new T.Scene();
  const camera = new T.PerspectiveCamera(48, 16/9, 0.1, 1000);
  camera.position.z = 7.5;
  camera.updateMatrixWorld();
  const balloon = new HotAirBalloon(scene);
  const bm = new BubbleManager(scene, camera, { playPop() {} }, balloon);

  bm.latestTrackedPlayers = [{
    id: 1,
    hands: [{ side: 'right', x: 0.35, y: 0.45 }]
  }];
  const spawnPos = bm.calculateSpawnPosition();
  const spProjected = spawnPos.clone().project(camera);
  const spX = (spProjected.x + 1) / 2;
  const spY = (1 - spProjected.y) / 2;
  const distToHand = Math.hypot(spX - 0.35, spY - 0.45);
  assert.ok(distToHand >= 0.12, `生成位置距离手太近: dist=${distToHand.toFixed(3)}`);
});

// 4. 底部相框式场景构图（低矮窄条不挡脸、左右相框边饰）
check('底部相框式构图：高度极低不挡脸且具备左右童话相框', () => {
  const fakeContainer = { appendChild() {} };
  const sm = new SceneManager(fakeContainer);
  assert.ok(sm.bottomStripGroup, 'bottomStripGroup 必须存在');
  assert.ok(sm.leftFrame, 'leftFrame 必须存在');
  assert.ok(sm.rightFrame, 'rightFrame 必须存在');

  const vHeight = 2 * Math.tan(T.MathUtils.degToRad(24)) * 7.5;
  const bottomY = -vHeight / 2;
  assert.ok(sm.bottomStripGroup.position.y < bottomY + vHeight * 0.08, '中央路面落脚线仍位于底部8%范围');
});

// 5. 顶部 HUD 计数器严格视口水平居中
check('顶部 HUD 进度计数器 CSS 绝对水平居中', () => {
  const css = fs.readFileSync(new URL('../src/style.css', import.meta.url), 'utf8');
  assert.ok(
    css.includes('.progress-dots-container {\n  position: absolute;\n  left: 50%;\n  transform: translateX(-50%);'),
    'CSS 中 progress-dots-container 未使用 absolute + left:50% + translateX(-50%) 居中'
  );
});

const out = {
  at: new Date().toISOString(),
  scope: 'v0.4 核心交互与视觉优化验收测试',
  total: results.length,
  passed: results.filter(x => x.pass).length,
  results
};
console.log(JSON.stringify(out, null, 2));
process.exitCode = results.every(x => x.pass) ? 0 : 1;
