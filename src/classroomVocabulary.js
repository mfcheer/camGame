// Hand-selected from the teacher's messages; dates, emojis and song titles are not vocabulary.
const entry=(id,zh,category='everyday',aliases=[])=>({id,word:id,zh,wordCn:zh,chinese:zh,category,aliases,
  accent:'#D69345',image:`/images/words/learning/${id}.svg`,itemImage:`/images/words/learning/${id}.svg`,bubbleImage:`/images/words/learning/${id}.svg`,
  svg:`/images/words/learning/${id}.svg`,itemSvg:`/images/words/learning/${id}.svg`,bubbleSvg:`/images/words/learning/${id}.svg`,
  audio:`/audio/words/${id}.mp3`,reviewAudio:`/audio/words/review/${id}.mp3`,sources:[]});
const lesson=(date,words)=>words.map(id=>({...entry(id,''),sources:[{bookId:`classroom-${date}`,form:id,date,kind:'teacher-message'}]}));
export const CLASSROOM_NEW_WORDS=[
  entry('egg','鸡蛋','everyday',['eggs']),entry('elbow','手肘','everyday',['elbows']),
  entry('envelope','信封','everyday',['envelopes']),entry('elephant','大象','everyday',['elephants']),
  entry('cup','杯子','everyday',['cups']),entry('computer','电脑','everyday',['computers']),
  entry('mooncake','月饼','everyday',['mooncakes']),entry('orange','橙色','colors')
];
export const CLASSROOM_WORDS=[...CLASSROOM_NEW_WORDS,
  ...lesson('2026-11-12',['doll','ball','car','train','bike','teddy','egg','elbow','envelope','elephant']),
  ...lesson('2026-10-12',['teacher','table','chair','pencil','book','crayon','red','yellow','blue','green','orange','cat','car','cup','computer']),
  ...lesson('2026-09-16',['mooncake','circle'])
];
