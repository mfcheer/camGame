// Complete expressions own their media. Relations are word IDs, not selection rules.
export const LEARNING_PHRASES = [
  ['green-doll','green doll','绿色的娃娃','green','doll'],
  ['blue-ball','blue ball','蓝色的球','blue','ball'],
  ['red-car','red car','红色的小汽车','red','car'],
  ['red-train','red train','红色的小火车','red','train'],
  ['red-bike','red bike','红色的自行车','red','bike'],
  ['purple-teddy','purple teddy','紫色的泰迪熊','purple','teddy']
].map(([id,word,zh,...relatedWordIds])=>({
  id,kind:'phrase',word,zh,wordCn:zh,chinese:zh,relatedWordIds,category:'learning-phrases',
  image:`/images/learning-phrases/${id}.svg`,itemImage:`/images/learning-phrases/${id}.svg`,
  bubbleImage:`/images/learning-phrases/${id}.svg`,
  audio:`/audio/learning-phrases/${id}.mp3`,
  audioEn:`/audio/learning-phrases/review/${id}.mp3`,audioZh:`/audio/learning-phrases/zh/${id}.mp3`,accent:'#8e62cc'
}));
