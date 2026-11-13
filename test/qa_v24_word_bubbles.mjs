import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import * as THREE from 'three';

import { WORDS_LIST, WORDS_MAP, getRandomWord, getWordById } from '../src/wordsConfig.js';
import { BubbleManager } from '../src/bubbleManager.js';
import { AudioManager } from '../src/audioManager.js';
import { UIManager } from '../src/uiManager.js';

const EXPECTED_WORDS = [
  // 教室与文具 (6)
  'chair', 'table', 'pencil', 'book', 'crayon', 'teacher',
  // 基础颜色 (5)
  'red', 'yellow', 'blue', 'green', 'purple',
  // 几何图形 (4)
  'circle', 'triangle', 'square', 'rectangle',
  // 玩具与交通 (6)
  'doll', 'ball', 'car', 'train', 'bike', 'teddy'
];

function createCamera(w = 1280, h = 720) {
  const camera = new THREE.PerspectiveCamera(48, w / h, 0.1, 100);
  camera.position.z = 7.5;
  camera.updateMatrixWorld();
  return camera;
}

test('1. 单词配置与 21 个图案/发音资源完整性验证', () => {
  assert.equal(WORDS_LIST.length, 21, 'WORDS_LIST 应包含 21 个单词');
  assert.equal(WORDS_MAP.size, 21, 'WORDS_MAP 应索引全部 21 个单词');

  // 验证每个指定单词均存在
  for (const id of EXPECTED_WORDS) {
    const item = getWordById(id);
    assert.ok(item, `单词 ${id} 应存在于配置中`);
    assert.equal(item.id, id);
    assert.equal(item.word, id);
    assert.ok(item.accent, `${id} 应有高亮主题色`);

    // 检查音频文件
    const audioPath = path.resolve('public', item.audio.replace(/^\//, ''));
    assert.ok(fs.existsSync(audioPath), `音频文件应存在: ${audioPath}`);
    const audioStat = fs.statSync(audioPath);
    assert.ok(audioStat.size > 2000, `音频文件 ${id}.mp3 应具备有效体积 (${audioStat.size} 字节)`);

    // 检查透明 PNG 与矢量 SVG 贴图
    const pngPath = path.resolve('public', item.image.replace(/^\//, ''));
    const svgPath = path.resolve('public', item.svg.replace(/^\//, ''));
    assert.ok(fs.existsSync(pngPath), `PNG 图像应存在: ${pngPath}`);
    assert.ok(fs.existsSync(svgPath), `SVG 图像应存在: ${svgPath}`);
    assert.ok(fs.statSync(pngPath).size > 1000, `${id}.png 体积应有效`);
    assert.ok(fs.statSync(svgPath).size > 500, `${id}.svg 体积应有效`);
  }

  // 验证分类统计
  const categories = { school: 0, colors: 0, shapes: 0, toys: 0 };
  for (const w of WORDS_LIST) {
    categories[w.category] = (categories[w.category] || 0) + 1;
  }
  assert.equal(categories.school, 6, '文具与教室类应包含 6 个单词');
  assert.equal(categories.colors, 5, '色彩类应包含 5 个单词');
  assert.equal(categories.shapes, 4, '图形类应包含 4 个单词');
  assert.equal(categories.toys, 6, '玩具交通类应包含 6 个单词');

  // 验证随机抽取与排除机制
  const sample1 = getRandomWord();
  assert.ok(sample1 && sample1.id, 'getRandomWord 应返回有效单词对象');
  for (let i = 0; i < 20; i++) {
    const next = getRandomWord('chair');
    assert.notEqual(next.id, 'chair', '排除 chair 时随机结果不得为 chair');
  }
});

test('2. 气泡内部单词卡片 Mesh 构建与随机/指定生成机制', () => {
  const scene = new THREE.Scene();
  const camera = createCamera();
  const mockAudio = { playPop() {}, playWord() {} };
  const bm = new BubbleManager(scene, camera, mockAudio, null);

  // 默认随机生成
  bm.createBubble(0, 'normal');
  const b1 = bm.activeBubble;
  assert.ok(b1, '应当生成活跃泡泡');
  assert.ok(b1.word, '泡泡应当绑定 word 元数据');
  assert.ok(EXPECTED_WORDS.includes(b1.word.id), `绑定的单词 id (${b1.word.id}) 应当属于 21 个词库之一`);
  assert.ok(b1.cardGroup, '应当包含 cardGroup 容器');
  assert.ok(b1.core, '应当将 cardGroup 挂载为 core');
  assert.equal(b1.cardGroup.userData.word.id, b1.word.id, 'cardGroup 的 userData 应当记录相同单词');

  // 验证内部 cardMesh
  const cardMesh = b1.cardGroup.userData.cardMesh;
  assert.ok(cardMesh, '应当包含 cardMesh 平面几何体');
  assert.equal(cardMesh.name, `word_card_${b1.word.id}`);
  assert.equal(cardMesh.geometry.type, 'PlaneGeometry', '卡片应当采用 PlaneGeometry');

  // 指定单词注入生成
  bm.disposeBubble(b1.group);
  bm.activeBubble = null;
  bm.createBubble(1, 'normal', 'pencil');
  const b2 = bm.activeBubble;
  assert.equal(b2.word.id, 'pencil', '指定 pencil 生成时泡泡内部应为 pencil');

  // 彩虹泡泡与果冻泡泡同样应挂载单词卡片
  bm.disposeBubble(b2.group);
  bm.activeBubble = null;
  bm.createBubble(2, 'rainbow', 'teddy');
  assert.equal(bm.activeBubble.word.id, 'teddy', '彩虹泡泡应支持挂载单词卡片');

  bm.disposeBubble(bm.activeBubble.group);
  bm.activeBubble = null;
  bm.createBubble(3, 'jelly', 'car');
  assert.equal(bm.activeBubble.word.id, 'car', '果冻泡泡应支持挂载单词卡片');

  // 视口更新时保留当前单词不被重置
  const currentWord = bm.activeBubble.word;
  bm.updateLayout();
  assert.equal(bm.activeBubble.word.id, currentWord.id, 'updateLayout 后应保留相同的单词');
});

test('3. 碰破气泡时播报单词发音与 UI 回调触发', () => {
  const scene = new THREE.Scene();
  const camera = createCamera();
  const playedAudios = [];
  const mockAudio = {
    playPop(combo) { playedAudios.push({ type: 'pop', combo }); },
    playWord(wordId) { playedAudios.push({ type: 'word', wordId }); }
  };
  const bm = new BubbleManager(scene, camera, mockAudio, null);

  const wordPopEvents = [];
  bm.onWordPop = (word, x, y) => {
    wordPopEvents.push({ word, x, y });
  };

  // 生成指定 book 泡泡
  bm.createBubble(0, 'normal', 'book');
  assert.equal(bm.activeBubble.word.id, 'book');

  // 碰破泡泡
  const hitX = 0.45;
  const hitY = 0.60;
  bm.popBubble(hitX, hitY);

  // 验证同时触发了 pop 水泡音与 word 发音
  const popCall = playedAudios.find(a => a.type === 'pop');
  const wordCall = playedAudios.find(a => a.type === 'word');
  assert.ok(popCall, '碰破时应当调用 audio.playPop');
  assert.ok(wordCall, '碰破时应当调用 audio.playWord');
  assert.equal(wordCall.wordId, 'book', '播放的单词 ID 应为 book');

  // 验证 onWordPop 回调
  assert.equal(wordPopEvents.length, 1, '应当触发 1 次 onWordPop 回调');
  assert.equal(wordPopEvents[0].word.id, 'book');
  assert.equal(wordPopEvents[0].x, hitX);
  assert.equal(wordPopEvents[0].y, hitY);

  // 泡泡对象已安全销毁
  assert.equal(bm.activeBubble, null);
});

test('4. AudioManager 单词发音播报、静音控制与容错机制', () => {
  const audio = new AudioManager();
  assert.equal(audio.lastPlayedWord, null);

  // 在静音状态下调用 playWord
  audio.setMuted(true);
  audio.playWord('chair');
  assert.equal(audio.lastPlayedWord, null, '静音状态下不应记录播放单词');

  // 解除静音后调用 playWord
  audio.setMuted(false);
  audio.playWord('chair');
  assert.equal(audio.lastPlayedWord, 'chair', '解除静音后应当记录并触发播放 chair');

  audio.playWord({ id: 'table', word: 'table' });
  assert.equal(audio.lastPlayedWord, 'table', '支持传入对象结构');

  // 容错机制：空值安全
  audio.playWord('');
  audio.playWord(null);
  assert.equal(audio.lastPlayedWord, 'table', '非法入参不应影响已记录状态');
});

test('5. UIManager 浮动单词药丸与 CSS 规范验证', () => {
  // DOM 模拟测试
  const fakeApp = {
    children: [],
    appendChild(child) { this.children.push(child); }
  };
  globalThis.document = {
    getElementById(id) { if (id === 'app') return fakeApp; return null; },
    createElement(tag) {
      return {
        tag,
        className: '',
        style: {
          properties: {},
          setProperty(k, v) { this.properties[k] = v; }
        },
        appendChild(c) { this.child = c; },
        remove() { fakeApp.children = fakeApp.children.filter(x => x !== this); }
      };
    }
  };

  const ui = Object.create(UIManager.prototype);
  const wordObj = getWordById('crayon');
  ui.showWordPopup(wordObj, 0.5, 0.4);

  assert.equal(fakeApp.children.length, 1, '应当向容器添加 1 个弹窗元素');
  const pill = fakeApp.children[0];
  assert.equal(pill.className, 'word-popup-pill');
  assert.equal(pill.style.properties['--word-accent'], '#E74C3C');
  assert.equal(pill.child.textContent, 'CRAYON', '单词文本应当转换为大写展示');

  // 验证 CSS 样式文件规范
  const css = fs.readFileSync('src/style.css', 'utf8');
  assert.ok(css.includes('.word-popup-pill'), 'CSS 应包含 .word-popup-pill 规范');
  assert.ok(css.includes('@keyframes wordPillPop'), 'CSS 应包含 @keyframes wordPillPop 动画定义');
  assert.ok(css.includes('--word-accent'), 'CSS 应当使用 --word-accent 动态主题色');
});
