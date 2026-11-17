// Complete expressions own their media. Relations are word IDs, not selection rules.
export const LEARNING_PHRASES = [
  ['green-doll','green doll','绿色的娃娃','green','doll'],
  ['blue-ball','blue ball','蓝色的球','blue','ball'],
  ['red-car','red car','红色的小汽车','red','car'],
  ['red-train','red train','红色的小火车','red','train'],
  ['red-bike','red bike','红色的自行车','red','bike'],
  ['purple-teddy','purple teddy','紫色的泰迪熊','purple','teddy'],
  ['bounce-the-ball','bounce the ball','拍球','ball'],
  ['move-the-train','move the train','移动小火车','train'],
  ['move-the-car','move the car','移动小汽车','car'],
  ['ride-the-bike','ride the bike','骑自行车','bike'],
  ['red-apple','red apple','红苹果','red','apple'],
  ['yellow-banana','yellow banana','黄香蕉','yellow','banana'],
  ['yellow-duck','yellow duck','黄色的小鸭','yellow','duck'],
  ['red-heart','red heart','红色的爱心','red','heart'],
  ['blue-circle','blue circle','蓝色的圆形','blue','circle'],
  ['two-cats','two cats','两只猫','two','cat'],
  ['two-balls','two balls','两个球','two','ball'],
  ['three-apples','three apples','三个苹果','three','apple'],
  ['eat-an-apple','eat an apple','吃苹果','apple'],
  ['drink-water','drink water','喝水','water'],
  ['kick-the-ball','kick the ball','踢球','ball'],
  ['hug-the-teddy','hug the teddy','抱抱泰迪熊','teddy']
].map(([id,word,zh,...relatedWordIds])=>({
  id,kind:'phrase',word,zh,wordCn:zh,chinese:zh,relatedWordIds,category:'learning-phrases',
  image:`/images/learning-phrases/${id}.svg`,itemImage:`/images/learning-phrases/${id}.svg`,
  bubbleImage:`/images/learning-phrases/${id}.svg`,
  ...(['bounce-the-ball','move-the-train','move-the-car','ride-the-bike','eat-an-apple','drink-water','kick-the-ball','hug-the-teddy'].includes(id)?{motion:{src:`/images/learning-phrases/${id}-motion.svg`,frames:16,duration:2}}:{}),
  audio:`/audio/learning-phrases/${id}.mp3`,
  audioEn:`/audio/learning-phrases/review/${id}.mp3`,audioZh:`/audio/learning-phrases/zh/${id}.mp3`,accent:'#8e62cc'
}));
