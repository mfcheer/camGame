import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { BubbleManager } from '../src/bubbleManager.js';
import { UIManager } from '../src/uiManager.js';
import { AudioManager } from '../src/audioManager.js';
import { getWordById } from '../src/wordsConfig.js';

function createCamera() {
  const camera = new THREE.PerspectiveCamera(48, 1280 / 720, 0.1, 100);
  camera.position.z = 7.5;
  camera.updateMatrixWorld();
  return camera;
}

test('1. 偶数次卡池生成规则：10次卡片出现5种、8次出现4种、6次出现3种，且每种恰好出现2次', () => {
  const scene = new THREE.Scene();
  const camera = createCamera();
  const bm = new BubbleManager(scene, camera, {}, null);

  // 测试用例 A: 10次卡片 -> 5种单词，各出现2次
  bm.beginWordRound(10);
  const words10 = [];
  for (let i = 0; i < 10; i++) {
    const w = bm.chooseRoundWord();
    assert.ok(w && w.id, '应当成功取出单词');
    words10.push(w.id);
  }
  const counts10 = {};
  for (const id of words10) {
    counts10[id] = (counts10[id] || 0) + 1;
  }
  const uniqueKeys10 = Object.keys(counts10);
  assert.equal(uniqueKeys10.length, 5, '10个气泡应当刚好包含5种不同单词');
  for (const id of uniqueKeys10) {
    assert.equal(counts10[id], 2, `单词 ${id} 应当恰好出现偶数次 (2次)`);
  }

  // 测试用例 B: 8次卡片 -> 4种单词，各出现2次
  bm.beginWordRound(8);
  const words8 = [];
  for (let i = 0; i < 8; i++) {
    words8.push(bm.chooseRoundWord().id);
  }
  const counts8 = {};
  for (const id of words8) {
    counts8[id] = (counts8[id] || 0) + 1;
  }
  const uniqueKeys8 = Object.keys(counts8);
  assert.equal(uniqueKeys8.length, 4, '8个气泡应当刚好包含4种不同单词');
  for (const id of uniqueKeys8) {
    assert.equal(counts8[id], 2, `单词 ${id} 应当恰好出现偶数次 (2次)`);
  }

  // 测试用例 C: 6次卡片 -> 3种单词，各出现2次
  bm.beginWordRound(6);
  const words6 = [];
  for (let i = 0; i < 6; i++) {
    words6.push(bm.chooseRoundWord().id);
  }
  const counts6 = {};
  for (const id of words6) {
    counts6[id] = (counts6[id] || 0) + 1;
  }
  const uniqueKeys6 = Object.keys(counts6);
  assert.equal(uniqueKeys6.length, 3, '6个气泡应当刚好包含3种不同单词');
  for (const id of uniqueKeys6) {
    assert.equal(counts6[id], 2, `单词 ${id} 应当恰好出现偶数次 (2次)`);
  }
});

test('2. 偶数次播报规则：同种卡片第1次碰破播报汉语(zh)，第2次碰破播报英语(en)', () => {
  const scene = new THREE.Scene();
  const camera = createCamera();
  const playedAudios = [];
  const mockAudio = {
    playPop() {},
    playWord(wordId, opts) {
      playedAudios.push({ wordId, ...opts });
    }
  };
  const bm = new BubbleManager(scene, camera, mockAudio, null);
  bm.beginWordRound(10);

  const wordPopCalls = [];
  bm.onWordPop = (word, x, y, audioDone, opts) => {
    wordPopCalls.push({ wordId: word.id, ...opts });
  };

  // 第 1 次生成并碰破 table
  bm.createBubble(0, 'normal', 'table');
  bm.popBubble(0.5, 0.5);

  assert.equal(playedAudios.length, 1);
  assert.equal(playedAudios[0].wordId, 'table');
  assert.equal(playedAudios[0].lang, 'zh', '第1次碰破必须播报汉语 (zh)');
  assert.equal(playedAudios[0].review, false, '第1次碰破不是复习/二度');
  assert.equal(playedAudios[0].hitCount, 1, '命中计数为1');

  assert.equal(wordPopCalls.length, 1);
  assert.equal(wordPopCalls[0].lang, 'zh');
  assert.equal(wordPopCalls[0].hitCount, 1);

  // 第 2 次生成并碰破 table
  bm.createBubble(1, 'normal', 'table');
  bm.popBubble(0.5, 0.5);

  assert.equal(playedAudios.length, 2);
  assert.equal(playedAudios[1].wordId, 'table');
  assert.equal(playedAudios[1].lang, 'en', '第2次碰破必须播报英语 (en)');
  assert.equal(playedAudios[1].review, true, '第2次碰破是复习/二度');
  assert.equal(playedAudios[1].hitCount, 2, '命中计数为2');

  assert.equal(wordPopCalls.length, 2);
  assert.equal(wordPopCalls[1].lang, 'en');
  assert.equal(wordPopCalls[1].hitCount, 2);
});

test('3. 实物卡片双语弹窗呈现：第1次强化中文标记，第2次强化英文标记', () => {
  const fakeApp = {
    children: [],
    appendChild(child) { this.children.push(child); }
  };
  globalThis.document = {
    getElementById(id) { if (id === "app") return fakeApp; return null; },
    createElement(tag) {
      return {
        tag,
        className: "",
        style: {
          properties: {},
          setProperty(k, v) { this.properties[k] = v; }
        },
        children: [],
        appendChild(c) { this.children.push(c); },
        setAttribute(k, v) { this[k] = v; },
        remove() { fakeApp.children = fakeApp.children.filter(x => x !== this); }
      };
    }
  };

  const ui = Object.create(UIManager.prototype);
  const wordObj = getWordById("table");

  // 第 1 次弹出（中文模式）
  const popupZh = ui.showWordPopup(wordObj, 0.5, 0.4, { lang: 'zh', hitCount: 1, review: false });
  assert.ok(popupZh.className.includes('is-lang-zh'), '第1次弹窗应包含 is-lang-zh 类');
  assert.equal(popupZh.cnSpan.textContent, '桌子');
  assert.equal(popupZh.textSpan.textContent, 'table');
  assert.ok(popupZh.photo.src.includes('table'));

  // 第 2 次弹出（英文模式）
  const popupEn = ui.showWordPopup(wordObj, 0.5, 0.4, { lang: 'en', hitCount: 2, review: true });
  assert.ok(popupEn.className.includes('is-lang-en'), '第2次弹窗应包含 is-lang-en 类');
  assert.equal(popupEn.cnSpan.textContent, '桌子');
  assert.equal(popupEn.textSpan.textContent, 'table');
  assert.ok(popupEn.photo.src.includes('table'));
});
