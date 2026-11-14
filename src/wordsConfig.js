import {mergeVocabulary,normalizeWordKey} from './vocabularyMerge.js';
import {STORYBOOK_WORDS} from './storybookVocabulary.js';
import {CLASSROOM_WORDS} from './classroomVocabulary.js';
import {EXPANDED_WORDS} from './expandedVocabulary.js';

/**
 * 少儿英语启蒙单词库：现有主题 + 幼儿园绘本词汇
 * 分类涵盖：
 * 1. 教室与文具 (school): chair, table, pencil, book, crayon, teacher
 * 2. 基础颜色 (colors): red, yellow, blue, green, purple
 * 3. 几何图形 (shapes): circle, triangle, square, rectangle
 * 4. 玩具交通 (toys): 基础词与 Toys 绘本词
 * 5. Two 绘本主题 (two_book): 数字、动物与小孩
 */

export function resolveAssetUrl(urlPath) {
  if (!urlPath) return '';
  if (urlPath.startsWith('http://') || urlPath.startsWith('https://') || urlPath.startsWith('data:')) return urlPath;
  const base = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.BASE_URL) || '/';
  const cleanBase = base.endsWith('/') ? base : base + '/';
  const cleanPath = urlPath.startsWith('/') ? urlPath.slice(1) : urlPath;
  return cleanBase + cleanPath;
}

const BASE_WORDS_LIST = [
  // 1. 教室与文具
  {
    id: 'chair',
    word: 'chair',
    zh: '椅子',
    wordCn: '椅子',
    chinese: '椅子',
    category: 'school',
    itemImage: '/images/words/learning/chair.svg',
    itemSvg: '/images/words/items/chair.svg',
    bubbleImage: '/images/words/learning/chair.svg',
    bubbleSvg: '/images/words/chair.svg',
    image: '/images/words/learning/chair.svg',
    svg: '/images/words/items/chair.svg',
    audio: '/audio/words/chair.mp3',
    accent: '#D35400'
  },
  {
    id: 'table',
    word: 'table',
    zh: '桌子',
    wordCn: '桌子',
    chinese: '桌子',
    category: 'school',
    itemImage: '/images/words/learning/table.svg',
    itemSvg: '/images/words/items/table.svg',
    bubbleImage: '/images/words/learning/table.svg',
    bubbleSvg: '/images/words/table.svg',
    image: '/images/words/learning/table.svg',
    svg: '/images/words/items/table.svg',
    audio: '/audio/words/table.mp3',
    accent: '#2980B9'
  },
  {
    id: 'pencil',
    word: 'pencil',
    zh: '铅笔',
    wordCn: '铅笔',
    chinese: '铅笔',
    category: 'school',
    itemImage: '/images/words/learning/pencil.svg',
    itemSvg: '/images/words/items/pencil.svg',
    bubbleImage: '/images/words/learning/pencil.svg',
    bubbleSvg: '/images/words/pencil.svg',
    image: '/images/words/learning/pencil.svg',
    svg: '/images/words/items/pencil.svg',
    audio: '/audio/words/pencil.mp3',
    accent: '#F39C12'
  },
  {
    id: 'book',
    word: 'book',
    zh: '书本',
    wordCn: '书本',
    chinese: '书本',
    category: 'school',
    itemImage: '/images/words/learning/book.svg',
    itemSvg: '/images/words/items/book.svg',
    bubbleImage: '/images/words/learning/book.svg',
    bubbleSvg: '/images/words/book.svg',
    image: '/images/words/learning/book.svg',
    svg: '/images/words/items/book.svg',
    audio: '/audio/words/book.mp3',
    accent: '#16A085'
  },
  {
    id: 'crayon',
    word: 'crayon',
    zh: '蜡笔',
    wordCn: '蜡笔',
    chinese: '蜡笔',
    category: 'school',
    itemImage: '/images/words/learning/crayon.svg',
    itemSvg: '/images/words/items/crayon.svg',
    bubbleImage: '/images/words/learning/crayon.svg',
    bubbleSvg: '/images/words/crayon.svg',
    image: '/images/words/learning/crayon.svg',
    svg: '/images/words/items/crayon.svg',
    audio: '/audio/words/crayon.mp3',
    accent: '#E74C3C'
  },
  {
    id: 'teacher',
    word: 'teacher',
    zh: '老师',
    wordCn: '老师',
    chinese: '老师',
    category: 'school',
    itemImage: '/images/words/items/teacher-v2.png',
    itemSvg: '/images/words/items/teacher.svg',
    bubbleImage: '/images/words/items/teacher-v2.png',
    bubbleSvg: '/images/words/teacher.svg',
    image: '/images/words/items/teacher-v2.png',
    svg: '/images/words/items/teacher.svg',
    audio: '/audio/words/teacher.mp3',
    accent: '#F39C12'
  },

  // 2. 基础色彩
  {
    id: 'red',
    word: 'red',
    zh: '红色',
    wordCn: '红色',
    chinese: '红色',
    category: 'colors',
    itemImage: '/images/words/learning/red.svg',
    itemSvg: '/images/words/items/red.svg',
    bubbleImage: '/images/words/learning/red.svg',
    bubbleSvg: '/images/words/red.svg',
    image: '/images/words/learning/red.svg',
    svg: '/images/words/items/red.svg',
    audio: '/audio/words/red.mp3',
    accent: '#E74C3C'
  },
  {
    id: 'yellow',
    word: 'yellow',
    zh: '黄色',
    wordCn: '黄色',
    chinese: '黄色',
    category: 'colors',
    itemImage: '/images/words/learning/yellow.svg',
    itemSvg: '/images/words/items/yellow.svg',
    bubbleImage: '/images/words/learning/yellow.svg',
    bubbleSvg: '/images/words/yellow.svg',
    image: '/images/words/learning/yellow.svg',
    svg: '/images/words/items/yellow.svg',
    audio: '/audio/words/yellow.mp3',
    accent: '#F1C40F'
  },
  {
    id: 'blue',
    word: 'blue',
    zh: '蓝色',
    wordCn: '蓝色',
    chinese: '蓝色',
    category: 'colors',
    itemImage: '/images/words/learning/blue.svg',
    itemSvg: '/images/words/items/blue.svg',
    bubbleImage: '/images/words/learning/blue.svg',
    bubbleSvg: '/images/words/blue.svg',
    image: '/images/words/learning/blue.svg',
    svg: '/images/words/items/blue.svg',
    audio: '/audio/words/blue.mp3',
    accent: '#3498DB'
  },
  {
    id: 'green',
    word: 'green',
    zh: '绿色',
    wordCn: '绿色',
    chinese: '绿色',
    category: 'colors',
    itemImage: '/images/words/learning/green.svg',
    itemSvg: '/images/words/items/green.svg',
    bubbleImage: '/images/words/learning/green.svg',
    bubbleSvg: '/images/words/green.svg',
    image: '/images/words/learning/green.svg',
    svg: '/images/words/items/green.svg',
    audio: '/audio/words/green.mp3',
    accent: '#2ECC71'
  },
  {
    id: 'purple',
    word: 'purple',
    zh: '紫色',
    wordCn: '紫色',
    chinese: '紫色',
    category: 'colors',
    itemImage: '/images/words/learning/purple.svg',
    itemSvg: '/images/words/items/purple.svg',
    bubbleImage: '/images/words/learning/purple.svg',
    bubbleSvg: '/images/words/purple.svg',
    image: '/images/words/learning/purple.svg',
    svg: '/images/words/items/purple.svg',
    audio: '/audio/words/purple.mp3',
    accent: '#9B59B6'
  },

  // 3. 基础几何图形
  {
    id: 'circle',
    word: 'circle',
    zh: '圆形',
    wordCn: '圆形',
    chinese: '圆形',
    category: 'shapes',
    itemImage: '/images/words/learning/circle.svg',
    itemSvg: '/images/words/items/circle.svg',
    bubbleImage: '/images/words/learning/circle.svg',
    bubbleSvg: '/images/words/circle.svg',
    image: '/images/words/learning/circle.svg',
    svg: '/images/words/items/circle.svg',
    audio: '/audio/words/circle.mp3',
    accent: '#E67E22'
  },
  {
    id: 'triangle',
    word: 'triangle',
    zh: '三角形',
    wordCn: '三角形',
    chinese: '三角形',
    category: 'shapes',
    itemImage: '/images/words/learning/triangle.svg',
    itemSvg: '/images/words/items/triangle.svg',
    bubbleImage: '/images/words/learning/triangle.svg',
    bubbleSvg: '/images/words/triangle.svg',
    image: '/images/words/learning/triangle.svg',
    svg: '/images/words/items/triangle.svg',
    audio: '/audio/words/triangle.mp3',
    accent: '#F1C40F'
  },
  {
    id: 'square',
    word: 'square',
    zh: '正方形',
    wordCn: '正方形',
    chinese: '正方形',
    category: 'shapes',
    itemImage: '/images/words/learning/square.svg',
    itemSvg: '/images/words/items/square.svg',
    bubbleImage: '/images/words/learning/square.svg',
    bubbleSvg: '/images/words/square.svg',
    image: '/images/words/learning/square.svg',
    svg: '/images/words/items/square.svg',
    audio: '/audio/words/square.mp3',
    accent: '#1ABC9C'
  },
  {
    id: 'rectangle',
    word: 'rectangle',
    zh: '长方形',
    wordCn: '长方形',
    chinese: '长方形',
    category: 'shapes',
    itemImage: '/images/words/learning/rectangle.svg',
    itemSvg: '/images/words/items/rectangle.svg',
    bubbleImage: '/images/words/learning/rectangle.svg',
    bubbleSvg: '/images/words/rectangle.svg',
    image: '/images/words/learning/rectangle.svg',
    svg: '/images/words/items/rectangle.svg',
    audio: '/audio/words/rectangle.mp3',
    accent: '#3498DB'
  },

  // 4. 玩具与交通工具
  {
    id: 'doll',
    word: 'doll',
    zh: '洋娃娃',
    wordCn: '洋娃娃',
    chinese: '洋娃娃',
    category: 'toys',
    itemImage: '/images/words/learning/doll.svg',
    itemSvg: '/images/words/items/doll.svg',
    bubbleImage: '/images/words/learning/doll.svg',
    bubbleSvg: '/images/words/doll.svg',
    image: '/images/words/learning/doll.svg',
    svg: '/images/words/items/doll.svg',
    audio: '/audio/words/doll.mp3',
    accent: '#E91E63'
  },
  {
    id: 'ball',
    word: 'ball',
    zh: '球',
    wordCn: '球',
    chinese: '球',
    category: 'toys',
    itemImage: '/images/words/learning/ball.svg',
    itemSvg: '/images/words/items/ball.svg',
    bubbleImage: '/images/words/learning/ball.svg',
    bubbleSvg: '/images/words/ball.svg',
    image: '/images/words/learning/ball.svg',
    svg: '/images/words/items/ball.svg',
    audio: '/audio/words/ball.mp3',
    accent: '#2ECC71'
  },
  {
    id: 'car',
    word: 'car',
    zh: '汽车',
    wordCn: '汽车',
    chinese: '汽车',
    category: 'toys',
    itemImage: '/images/words/learning/car.svg',
    itemSvg: '/images/words/items/car.svg',
    bubbleImage: '/images/words/learning/car.svg',
    bubbleSvg: '/images/words/car.svg',
    image: '/images/words/learning/car.svg',
    svg: '/images/words/items/car.svg',
    audio: '/audio/words/car.mp3',
    accent: '#E74C3C'
  },
  {
    id: 'train',
    word: 'train',
    zh: '火车',
    wordCn: '火车',
    chinese: '火车',
    category: 'toys',
    itemImage: '/images/words/learning/train.svg',
    itemSvg: '/images/words/items/train.svg',
    bubbleImage: '/images/words/learning/train.svg',
    bubbleSvg: '/images/words/train.svg',
    image: '/images/words/learning/train.svg',
    svg: '/images/words/items/train.svg',
    audio: '/audio/words/train.mp3',
    accent: '#2980B9'
  },
  {
    id: 'bike',
    word: 'bike',
    zh: '自行车',
    wordCn: '自行车',
    chinese: '自行车',
    category: 'toys',
    itemImage: '/images/words/learning/bike.svg',
    itemSvg: '/images/words/items/bike.svg',
    bubbleImage: '/images/words/learning/bike.svg',
    bubbleSvg: '/images/words/bike.svg',
    image: '/images/words/learning/bike.svg',
    svg: '/images/words/items/bike.svg',
    audio: '/audio/words/bike.mp3',
    accent: '#16A085'
  },
  {
    id: 'teddy',
    conceptId: 'plush-bear',
    word: 'teddy',
    zh: '泰迪熊',
    wordCn: '泰迪熊',
    chinese: '泰迪熊',
    category: 'toys',
    itemImage: '/images/words/learning/teddy.svg',
    itemSvg: '/images/words/items/teddy.svg',
    bubbleImage: '/images/words/learning/teddy.svg',
    bubbleSvg: '/images/words/teddy.svg',
    image: '/images/words/learning/teddy.svg',
    svg: '/images/words/items/teddy.svg',
    audio: '/audio/words/teddy.mp3',
    accent: '#D35400'
  }
];

export const WORDS_LIST = mergeVocabulary(BASE_WORDS_LIST, STORYBOOK_WORDS, CLASSROOM_WORDS, EXPANDED_WORDS);

export const WORDS_MAP = new Map(WORDS_LIST.map(w => [w.id, w]));
const WORD_ALIASES = new Map(WORDS_LIST.flatMap(word=>word.aliases.map(alias=>[alias,word.id])));

/**
 * 随机获取一个单词对象，默认避免连续重复抽取同一个单词
 */
export function getRandomWord(excludeId = null) {
  const excluded=getWordById(excludeId)?.id || normalizeWordKey(excludeId);
  const pool = excluded && WORDS_LIST.length > 1
    ? WORDS_LIST.filter(w => w.id !== excluded)
    : WORDS_LIST;
  const index = Math.floor(Math.random() * pool.length);
  return pool[index];
}

/**
 * 根据 id 获取单词配置
 */
export function getWordById(id) {
  if (!id) return null;
  const key=normalizeWordKey(id);
  return WORDS_MAP.get(WORD_ALIASES.get(key)||key) || null;
}

/**
 * 获取单词中文释义
 */
export function getWordCn(id) {
  const item = getWordById(id);
  return item ? (item.zh || item.wordCn || item.chinese || '') : '';
}
