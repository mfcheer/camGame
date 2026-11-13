/**
 * 21 个少儿英语启蒙自然拼读单词库配置
 * 分类涵盖：
 * 1. 教室与文具 (school): chair, table, pencil, book, crayon, teacher
 * 2. 基础颜色 (colors): red, yellow, blue, green, purple
 * 3. 几何图形 (shapes): circle, triangle, square, rectangle
 * 4. 玩具交通 (toys): doll, ball, car, train, bike, teddy
 */

export function resolveAssetUrl(urlPath) {
  if (!urlPath) return '';
  if (urlPath.startsWith('http://') || urlPath.startsWith('https://') || urlPath.startsWith('data:')) return urlPath;
  const base = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.BASE_URL) || '/';
  const cleanBase = base.endsWith('/') ? base : base + '/';
  const cleanPath = urlPath.startsWith('/') ? urlPath.slice(1) : urlPath;
  return cleanBase + cleanPath;
}

export const WORDS_LIST = [
  // 1. 教室与文具
  {
    id: 'chair',
    word: 'chair',
    category: 'school',
    itemImage: '/images/words/items/chair.png',
    itemSvg: '/images/words/items/chair.svg',
    bubbleImage: '/images/words/chair.png',
    bubbleSvg: '/images/words/chair.svg',
    image: '/images/words/items/chair.png',
    svg: '/images/words/items/chair.svg',
    audio: '/audio/words/chair.mp3',
    accent: '#D35400'
  },
  {
    id: 'table',
    word: 'table',
    category: 'school',
    itemImage: '/images/words/items/table.png',
    itemSvg: '/images/words/items/table.svg',
    bubbleImage: '/images/words/table.png',
    bubbleSvg: '/images/words/table.svg',
    image: '/images/words/items/table.png',
    svg: '/images/words/items/table.svg',
    audio: '/audio/words/table.mp3',
    accent: '#2980B9'
  },
  {
    id: 'pencil',
    word: 'pencil',
    category: 'school',
    itemImage: '/images/words/items/pencil.png',
    itemSvg: '/images/words/items/pencil.svg',
    bubbleImage: '/images/words/pencil.png',
    bubbleSvg: '/images/words/pencil.svg',
    image: '/images/words/items/pencil.png',
    svg: '/images/words/items/pencil.svg',
    audio: '/audio/words/pencil.mp3',
    accent: '#F39C12'
  },
  {
    id: 'book',
    word: 'book',
    category: 'school',
    itemImage: '/images/words/items/book.png',
    itemSvg: '/images/words/items/book.svg',
    bubbleImage: '/images/words/book.png',
    bubbleSvg: '/images/words/book.svg',
    image: '/images/words/items/book.png',
    svg: '/images/words/items/book.svg',
    audio: '/audio/words/book.mp3',
    accent: '#16A085'
  },
  {
    id: 'crayon',
    word: 'crayon',
    category: 'school',
    itemImage: '/images/words/items/crayon.png',
    itemSvg: '/images/words/items/crayon.svg',
    bubbleImage: '/images/words/crayon.png',
    bubbleSvg: '/images/words/crayon.svg',
    image: '/images/words/items/crayon.png',
    svg: '/images/words/items/crayon.svg',
    audio: '/audio/words/crayon.mp3',
    accent: '#E74C3C'
  },
  {
    id: 'teacher',
    word: 'teacher',
    category: 'school',
    itemImage: '/images/words/items/teacher.png',
    itemSvg: '/images/words/items/teacher.svg',
    bubbleImage: '/images/words/teacher.png',
    bubbleSvg: '/images/words/teacher.svg',
    image: '/images/words/items/teacher.png',
    svg: '/images/words/items/teacher.svg',
    audio: '/audio/words/teacher.mp3',
    accent: '#F39C12'
  },

  // 2. 基础色彩
  {
    id: 'red',
    word: 'red',
    category: 'colors',
    itemImage: '/images/words/items/red.png',
    itemSvg: '/images/words/items/red.svg',
    bubbleImage: '/images/words/red.png',
    bubbleSvg: '/images/words/red.svg',
    image: '/images/words/items/red.png',
    svg: '/images/words/items/red.svg',
    audio: '/audio/words/red.mp3',
    accent: '#E74C3C'
  },
  {
    id: 'yellow',
    word: 'yellow',
    category: 'colors',
    itemImage: '/images/words/items/yellow.png',
    itemSvg: '/images/words/items/yellow.svg',
    bubbleImage: '/images/words/yellow.png',
    bubbleSvg: '/images/words/yellow.svg',
    image: '/images/words/items/yellow.png',
    svg: '/images/words/items/yellow.svg',
    audio: '/audio/words/yellow.mp3',
    accent: '#F1C40F'
  },
  {
    id: 'blue',
    word: 'blue',
    category: 'colors',
    itemImage: '/images/words/items/blue.png',
    itemSvg: '/images/words/items/blue.svg',
    bubbleImage: '/images/words/blue.png',
    bubbleSvg: '/images/words/blue.svg',
    image: '/images/words/items/blue.png',
    svg: '/images/words/items/blue.svg',
    audio: '/audio/words/blue.mp3',
    accent: '#3498DB'
  },
  {
    id: 'green',
    word: 'green',
    category: 'colors',
    itemImage: '/images/words/items/green.png',
    itemSvg: '/images/words/items/green.svg',
    bubbleImage: '/images/words/green.png',
    bubbleSvg: '/images/words/green.svg',
    image: '/images/words/items/green.png',
    svg: '/images/words/items/green.svg',
    audio: '/audio/words/green.mp3',
    accent: '#2ECC71'
  },
  {
    id: 'purple',
    word: 'purple',
    category: 'colors',
    itemImage: '/images/words/items/purple.png',
    itemSvg: '/images/words/items/purple.svg',
    bubbleImage: '/images/words/purple.png',
    bubbleSvg: '/images/words/purple.svg',
    image: '/images/words/items/purple.png',
    svg: '/images/words/items/purple.svg',
    audio: '/audio/words/purple.mp3',
    accent: '#9B59B6'
  },

  // 3. 基础几何图形
  {
    id: 'circle',
    word: 'circle',
    category: 'shapes',
    itemImage: '/images/words/items/circle.png',
    itemSvg: '/images/words/items/circle.svg',
    bubbleImage: '/images/words/circle.png',
    bubbleSvg: '/images/words/circle.svg',
    image: '/images/words/items/circle.png',
    svg: '/images/words/items/circle.svg',
    audio: '/audio/words/circle.mp3',
    accent: '#E67E22'
  },
  {
    id: 'triangle',
    word: 'triangle',
    category: 'shapes',
    itemImage: '/images/words/items/triangle.png',
    itemSvg: '/images/words/items/triangle.svg',
    bubbleImage: '/images/words/triangle.png',
    bubbleSvg: '/images/words/triangle.svg',
    image: '/images/words/items/triangle.png',
    svg: '/images/words/items/triangle.svg',
    audio: '/audio/words/triangle.mp3',
    accent: '#F1C40F'
  },
  {
    id: 'square',
    word: 'square',
    category: 'shapes',
    itemImage: '/images/words/items/square.png',
    itemSvg: '/images/words/items/square.svg',
    bubbleImage: '/images/words/square.png',
    bubbleSvg: '/images/words/square.svg',
    image: '/images/words/items/square.png',
    svg: '/images/words/items/square.svg',
    audio: '/audio/words/square.mp3',
    accent: '#1ABC9C'
  },
  {
    id: 'rectangle',
    word: 'rectangle',
    category: 'shapes',
    itemImage: '/images/words/items/rectangle.png',
    itemSvg: '/images/words/items/rectangle.svg',
    bubbleImage: '/images/words/rectangle.png',
    bubbleSvg: '/images/words/rectangle.svg',
    image: '/images/words/items/rectangle.png',
    svg: '/images/words/items/rectangle.svg',
    audio: '/audio/words/rectangle.mp3',
    accent: '#3498DB'
  },

  // 4. 玩具与交通工具
  {
    id: 'doll',
    word: 'doll',
    category: 'toys',
    itemImage: '/images/words/items/doll.png',
    itemSvg: '/images/words/items/doll.svg',
    bubbleImage: '/images/words/doll.png',
    bubbleSvg: '/images/words/doll.svg',
    image: '/images/words/items/doll.png',
    svg: '/images/words/items/doll.svg',
    audio: '/audio/words/doll.mp3',
    accent: '#E91E63'
  },
  {
    id: 'ball',
    word: 'ball',
    category: 'toys',
    itemImage: '/images/words/items/ball.png',
    itemSvg: '/images/words/items/ball.svg',
    bubbleImage: '/images/words/ball.png',
    bubbleSvg: '/images/words/ball.svg',
    image: '/images/words/items/ball.png',
    svg: '/images/words/items/ball.svg',
    audio: '/audio/words/ball.mp3',
    accent: '#2ECC71'
  },
  {
    id: 'car',
    word: 'car',
    category: 'toys',
    itemImage: '/images/words/items/car.png',
    itemSvg: '/images/words/items/car.svg',
    bubbleImage: '/images/words/car.png',
    bubbleSvg: '/images/words/car.svg',
    image: '/images/words/items/car.png',
    svg: '/images/words/items/car.svg',
    audio: '/audio/words/car.mp3',
    accent: '#E74C3C'
  },
  {
    id: 'train',
    word: 'train',
    category: 'toys',
    itemImage: '/images/words/items/train.png',
    itemSvg: '/images/words/items/train.svg',
    bubbleImage: '/images/words/train.png',
    bubbleSvg: '/images/words/train.svg',
    image: '/images/words/items/train.png',
    svg: '/images/words/items/train.svg',
    audio: '/audio/words/train.mp3',
    accent: '#2980B9'
  },
  {
    id: 'bike',
    word: 'bike',
    category: 'toys',
    itemImage: '/images/words/items/bike.png',
    itemSvg: '/images/words/items/bike.svg',
    bubbleImage: '/images/words/bike.png',
    bubbleSvg: '/images/words/bike.svg',
    image: '/images/words/items/bike.png',
    svg: '/images/words/items/bike.svg',
    audio: '/audio/words/bike.mp3',
    accent: '#16A085'
  },
  {
    id: 'teddy',
    word: 'teddy',
    category: 'toys',
    itemImage: '/images/words/items/teddy.png',
    itemSvg: '/images/words/items/teddy.svg',
    bubbleImage: '/images/words/teddy.png',
    bubbleSvg: '/images/words/teddy.svg',
    image: '/images/words/items/teddy.png',
    svg: '/images/words/items/teddy.svg',
    audio: '/audio/words/teddy.mp3',
    accent: '#D35400'
  }
];

export const WORDS_MAP = new Map(WORDS_LIST.map(w => [w.id, w]));

/**
 * 随机获取一个单词对象，默认避免连续重复抽取同一个单词
 */
export function getRandomWord(excludeId = null) {
  const pool = excludeId && WORDS_LIST.length > 1
    ? WORDS_LIST.filter(w => w.id !== excludeId)
    : WORDS_LIST;
  const index = Math.floor(Math.random() * pool.length);
  return pool[index];
}

/**
 * 根据 id 获取单词配置
 */
export function getWordById(id) {
  if (!id) return null;
  return WORDS_MAP.get(String(id).trim().toLowerCase()) || null;
}
