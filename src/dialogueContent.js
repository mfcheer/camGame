// Complete sentences use independent recordings, never stitched word clips.
export const DIALOGUE_LINES = [
  ['how-are-you','How are you today?','你今天感觉怎么样？'],
  ['im-happy',"I'm happy.",'我很开心。'],
  ['im-sad',"I'm sad.",'我有点难过。'],
  ['hows-weather',"How’s the weather today?",'今天天气怎么样？'],
  ['its-sunny',"It's sunny.",'今天是晴天。'],
  ['its-rainy',"It's rainy.",'今天下雨。'],
  ['what-is-it','What is it?','这是什么？'],
  ['its-a-cat',"It's a cat.",'这是一只猫。'],
  ['its-a-dog',"It's a dog.",'这是一只狗。'],
  ['what-color','What color is it?','它是什么颜色？'],
  ['its-red',"It's red.",'它是红色的。'],
  ['its-blue',"It's blue.",'它是蓝色的。'],
  ['how-many-balls','How many balls?','有几个球？'],
  ['one-ball','One ball.','一个球。'],
  ['two-balls','Two balls.','两个球。'],
  ['what-like','What do you like?','你喜欢什么？'],
  ['like-apples','I like apples.','我喜欢苹果。'],
  ['like-bananas','I like bananas.','我喜欢香蕉。'],
  ['what-would-like','What would you like?','你想要什么？'],
  ['milk-please','Milk, please.','请给我牛奶。'],
  ['water-please','Water, please.','请给我水。']
].map(([id,word,zh])=>({id:`dialogue-${id}`,word,zh,
  audio:`/audio/dialogue/${id}.mp3`,audioEn:`/audio/dialogue/review/${id}.mp3`,audioZh:`/audio/dialogue/zh/${id}.mp3`}));
export const dialogueLine=id=>DIALOGUE_LINES.find(l=>l.id===`dialogue-${id}`);
// Metadata belongs to each topic so observation prompts never inherit weather wording.
export const DIALOGUES=[
  {id:'feelings',question:'how-are-you',free:true,prompt:'说说你的心情',options:[{id:'happy',line:'im-happy',label:'开心'},{id:'sad',line:'im-sad',label:'难过'}]},
  {id:'weather',question:'hows-weather',free:false,prompt:'看看这里的天气',sceneLabel:'游戏里的天气',hint:'看看上面的天气，再试一次',options:[{id:'sunny',line:'its-sunny',label:'晴天'},{id:'rainy',line:'its-rainy',label:'下雨'}]},
  {id:'identify',question:'what-is-it',free:false,prompt:'看看这是什么动物',sceneLabel:'看看这个动物',hint:'看看上面的动物，再试一次',options:[{id:'cat',line:'its-a-cat',label:'猫'},{id:'dog',line:'its-a-dog',label:'狗'}]},
  {id:'color',question:'what-color',free:false,prompt:'看看它的颜色',sceneLabel:'看看这个球',hint:'看看上面的颜色，再试一次',options:[{id:'red',line:'its-red',label:'红色',scene:'red-ball'},{id:'blue',line:'its-blue',label:'蓝色',scene:'blue-ball'}]},
  {id:'count',question:'how-many-balls',free:false,prompt:'一起数一数',sceneLabel:'数数有几个球',hint:'数数上面的球，再试一次',options:[{id:'one-ball',line:'one-ball',label:'一个球'},{id:'two-balls',line:'two-balls',label:'两个球'}]},
  {id:'likes',question:'what-like',free:true,prompt:'说说你喜欢什么',options:[{id:'apples',line:'like-apples',label:'苹果'},{id:'bananas',line:'like-bananas',label:'香蕉'}]},
  {id:'drinks',question:'what-would-like',free:true,prompt:'选一杯你想喝的',options:[{id:'milk',line:'milk-please',label:'牛奶'},{id:'water',line:'water-please',label:'水'}]}
];
