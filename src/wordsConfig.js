/**
 * 21 个少儿英语启蒙自然拼读单词库配置
 * 分类涵盖：
 * 1. 教室与文具 (school): chair, table, pencil, book, crayon, teacher
 * 2. 基础颜色 (colors): red, yellow, blue, green, purple
 * 3. 几何图形 (shapes): circle, triangle, square, rectangle
 * 4. 玩具交通 (toys): doll, ball, car, train, bike, teddy
 */

export const WORDS_LIST = [
  // 1. 教室与文具
  {
    id: 'chair',
    word: 'chair',
    category: 'school',
    image: '/images/words/chair.png',
    svg: '/images/words/chair.svg',
    audio: '/audio/words/chair.mp3',
    accent: '#D35400'
  },
  {
    id: 'table',
    word: 'table',
    category: 'school',
    image: '/images/words/table.png',
    svg: '/images/words/table.svg',
    audio: '/audio/words/table.mp3',
    accent: '#2980B9'
  },
  {
    id: 'pencil',
    word: 'pencil',
    category: 'school',
    image: '/images/words/pencil.png',
    svg: '/images/words/pencil.svg',
    audio: '/audio/words/pencil.mp3',
    accent: '#F39C12'
  },
  {
    id: 'book',
    word: 'book',
    category: 'school',
    image: '/images/words/book.png',
    svg: '/images/words/book.svg',
    audio: '/audio/words/book.mp3',
    accent: '#16A085'
  },
  {
    id: 'crayon',
    word: 'crayon',
    category: 'school',
    image: '/images/words/crayon.png',
    svg: '/images/words/crayon.svg',
    audio: '/audio/words/crayon.mp3',
    accent: '#E74C3C'
  },
  {
    id: 'teacher',
    word: 'teacher',
    category: 'school',
    image: '/images/words/teacher.png',
    svg: '/images/words/teacher.svg',
    audio: '/audio/words/teacher.mp3',
    accent: '#F39C12'
  },

  // 2. 基础色彩
  {
    id: 'red',
    word: 'red',
    category: 'colors',
    image: '/images/words/red.png',
    svg: '/images/words/red.svg',
    audio: '/audio/words/red.mp3',
    accent: '#E74C3C'
  },
  {
    id: 'yellow',
    word: 'yellow',
    category: 'colors',
    image: '/images/words/yellow.png',
    svg: '/images/words/yellow.svg',
    audio: '/audio/words/yellow.mp3',
    accent: '#F1C40F'
  },
  {
    id: 'blue',
    word: 'blue',
    category: 'colors',
    image: '/images/words/blue.png',
    svg: '/images/words/blue.svg',
    audio: '/audio/words/blue.mp3',
    accent: '#3498DB'
  },
  {
    id: 'green',
    word: 'green',
    category: 'colors',
    image: '/images/words/green.png',
    svg: '/images/words/green.svg',
    audio: '/audio/words/green.mp3',
    accent: '#2ECC71'
  },
  {
    id: 'purple',
    word: 'purple',
    category: 'colors',
    image: '/images/words/purple.png',
    svg: '/images/words/purple.svg',
    audio: '/audio/words/purple.mp3',
    accent: '#9B59B6'
  },

  // 3. 几何图形
  {
    id: 'circle',
    word: 'circle',
    category: 'shapes',
    image: '/images/words/circle.png',
    svg: '/images/words/circle.svg',
    audio: '/audio/words/circle.mp3',
    accent: '#E67E22'
  },
  {
    id: 'triangle',
    word: 'triangle',
    category: 'shapes',
    image: '/images/words/triangle.png',
    svg: '/images/words/triangle.svg',
    audio: '/audio/words/triangle.mp3',
    accent: '#F1C40F'
  },
  {
    id: 'square',
    word: 'square',
    category: 'shapes',
    image: '/images/words/square.png',
    svg: '/images/words/square.svg',
    audio: '/audio/words/square.mp3',
    accent: '#1ABC9C'
  },
  {
    id: 'rectangle',
    word: 'rectangle',
    category: 'shapes',
    image: '/images/words/rectangle.png',
    svg: '/images/words/rectangle.svg',
    audio: '/audio/words/rectangle.mp3',
    accent: '#3498DB'
  },

  // 4. 玩具与交通
  {
    id: 'doll',
    word: 'doll',
    category: 'toys',
    image: '/images/words/doll.png',
    svg: '/images/words/doll.svg',
    audio: '/audio/words/doll.mp3',
    accent: '#E91E63'
  },
  {
    id: 'ball',
    word: 'ball',
    category: 'toys',
    image: '/images/words/ball.png',
    svg: '/images/words/ball.svg',
    audio: '/audio/words/ball.mp3',
    accent: '#2ECC71'
  },
  {
    id: 'car',
    word: 'car',
    category: 'toys',
    image: '/images/words/car.png',
    svg: '/images/words/car.svg',
    audio: '/audio/words/car.mp3',
    accent: '#E74C3C'
  },
  {
    id: 'train',
    word: 'train',
    category: 'toys',
    image: '/images/words/train.png',
    svg: '/images/words/train.svg',
    audio: '/audio/words/train.mp3',
    accent: '#2980B9'
  },
  {
    id: 'bike',
    word: 'bike',
    category: 'toys',
    image: '/images/words/bike.png',
    svg: '/images/words/bike.svg',
    audio: '/audio/words/bike.mp3',
    accent: '#16A085'
  },
  {
    id: 'teddy',
    word: 'teddy',
    category: 'toys',
    image: '/images/words/teddy.png',
    svg: '/images/words/teddy.svg',
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
