// Complete sentences use independent recordings, never stitched word clips.
export const DIALOGUE_LINES = [
  ['how-are-you','How are you today?','你今天感觉怎么样？'],
  ['im-happy',"I'm happy.",'我很开心。'],
  ['im-sad',"I'm sad.",'我有点难过。'],
  ['hows-weather',"How’s the weather today?",'今天天气怎么样？'],
  ['its-sunny',"It's sunny.",'今天是晴天。'],
  ['its-rainy',"It's rainy.",'今天下雨。']
].map(([id,word,zh])=>({id:`dialogue-${id}`,word,zh,
  audio:`/audio/dialogue/${id}.mp3`,audioEn:`/audio/dialogue/review/${id}.mp3`,audioZh:`/audio/dialogue/zh/${id}.mp3`}));
export const dialogueLine=id=>DIALOGUE_LINES.find(l=>l.id===`dialogue-${id}`);
export const DIALOGUES=[
  {id:'feelings',question:'how-are-you',free:true,options:[{id:'happy',line:'im-happy',label:'开心'},{id:'sad',line:'im-sad',label:'难过'}]},
  {id:'weather',question:'hows-weather',free:false,options:[{id:'sunny',line:'its-sunny',label:'晴天'},{id:'rainy',line:'its-rainy',label:'下雨'}]}
];
