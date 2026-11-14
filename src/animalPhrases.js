// One short English utterance per arrival/farewell. No quiz, answer gate or extra click.
const phrase=(id,en,zh,wordIds=[])=>({id,en,zh,wordIds,audio:`/audio/phrases/natural/${id}.mp3`});
export const ANIMAL_PHRASES={
  start:[
    phrase('hello-play',"Hello, let's play!",'你好，一起玩吧！'),
    phrase('how-are-you','How are you today?','你今天好吗？'),
    phrase('happy-today',"I'm happy today!",'我今天很开心！'),
    phrase('like-red','I like red!','我喜欢红色！',['red']),
    phrase('like-yellow','I like yellow!','我喜欢黄色！',['yellow']),
    phrase('like-blue','I like blue!','我喜欢蓝色！',['blue']),
    phrase('like-green','I like green!','我喜欢绿色！',['green']),
    phrase('like-orange','I like orange!','我喜欢橙色！',['orange']),
    phrase('play-ball',"Let's play with a ball!",'一起玩球吧！',['ball'])
  ],
  end:[
    phrase('thank-you','Thank you, my friend!','谢谢你，我的朋友！'),
    phrase('nice-day','Have a nice day!','祝你度过愉快的一天！'),
    phrase('see-you','See you again!','下次再见！'),
    phrase('goodbye','Goodbye, my friend!','再见，我的朋友！')
  ]
};
const favorites={bunny:['hello-play','like-red','how-are-you'],cat:['play-ball','like-orange','happy-today'],
  frog:['how-are-you','like-green','hello-play'],dog:['play-ball','happy-today','like-blue'],
  dragon:['hello-play','like-blue','how-are-you'],goldenDragon:['like-yellow','hello-play','happy-today'],
  mcqueen:['hello-play','like-red','happy-today'],wolf:['play-ball','hello-play','like-green'],teddy:['happy-today','hello-play','like-yellow'],chase:['hello-play','like-blue','play-ball'],jett:['hello-play','like-red','happy-today'],peppa:['hello-play','happy-today','like-red'],thomas:['hello-play','like-blue','happy-today']};
export function chooseAnimalPhrase(phase,animalId,previousId=null,random=Math.random){
  let pool=ANIMAL_PHRASES[phase]||ANIMAL_PHRASES.start;
  if(phase==='start')pool=pool.filter(p=>(favorites[animalId]||favorites.bunny).includes(p.id));
  const fresh=pool.filter(p=>p.id!==previousId);if(fresh.length)pool=fresh;
  return pool[Math.min(pool.length-1,Math.floor(random()*pool.length))];
}
