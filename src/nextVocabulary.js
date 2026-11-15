// Clear, picture-first words for the next round of early learning.
const data = [
  ['head', '头', 'body', '#D98761'],
  ['arm', '手臂', 'body', '#D98761'],
  ['leg', '腿', 'body', '#D98761'],
  ['finger', '手指', 'body', '#D98761'],
  ['three', '三', 'numbers', '#E9A451'],
  ['four', '四', 'numbers', '#72ADBC'],
  ['five', '五', 'numbers', '#A58ACB'],
  ['chick', '小鸡', 'animals', '#EAB855'],
  ['butterfly', '蝴蝶', 'animals', '#BD84CF'],
  ['turtle', '乌龟', 'animals', '#70A983'],
  ['orange-fruit', '橙子', 'fruits', '#EC934C'],
  ['lemon', '柠檬', 'fruits', '#E3C64D'],
  ['paper', '纸', 'school', '#8295BD'],
  ['gray', '灰色', 'colors', '#7C858E'],
  ['bubble', '泡泡', 'toys', '#76B9CB'],
  ['sunny', '晴天', 'everyday', '#E5B654']
];

const svgIds = new Set(['three', 'four', 'five']);
const aliases = {
  head: ['heads'], arm: ['arms'], leg: ['legs'], finger: ['fingers'],
  chick: ['chicks'], butterfly: ['butterflies'], turtle: ['turtles'],
  lemon: ['lemons'], gray: ['grey'], bubble: ['bubbles']
};

export const NEXT_WORDS = data.map(([id, zh, category, accent]) => {
  const word = id === 'orange-fruit' ? 'orange' : id;
  const image = `/images/words/learning/${id}.${svgIds.has(id) ? 'svg' : 'webp'}`;
  const svg = svgIds.has(id) ? image : null;
  return {
    id, word, zh, wordCn: zh, chinese: zh, category, accent,
    aliases: aliases[id] || [], sources: [],
    image, itemImage: image, bubbleImage: image,
    svg, itemSvg: svg, bubbleSvg: svg,
    audio: `/audio/words/${id}.mp3`,
    reviewAudio: `/audio/words/review/${id}.mp3`
  };
});
