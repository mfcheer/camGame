// Teacher's next lesson and familiar objects selected for picture-first learning.
const data = [
 ['star','星形','shapes'],['heart','心形','shapes'],['oval','椭圆形','shapes'],
 ['pink','粉色','colors'],['white','白色','colors'],['black','黑色','colors'],['brown','棕色','colors'],
 ['eraser','橡皮','school'],['ruler','尺子','school'],['schoolbag','书包','school'],['scissors','剪刀','school'],
 ['puzzle','拼图','toys'],['balloon','气球','toys'],['slide','滑梯','toys'],['swing','秋千','toys'],
 ['rabbit','兔子','animals'],['duck','鸭子','animals'],['frog','青蛙','animals'],['sheep','绵羊','animals'],
 ['face','脸','body'],['eye','眼睛','body'],['ear','耳朵','body'],['mouth','嘴巴','body'],['nose','鼻子','body'],['hair','头发','body'],
 ['weather','天气','everyday'],['one','一','two_book'],['happy','开心','everyday']
];
const lessonIds=new Set(['face','eye','ear','mouth','nose','hair','weather','one','happy','red','blue','circle']);
const source=id=>({bookId:'classroom-next-lesson',form:id,kind:'teacher-photo'});
const redrawn = new Set(['face','eye','ear','mouth','nose','hair','happy','sheep']);
export const EXPANDED_NEW_WORDS=data.map(([id,zh,category])=>{
 const fallback=`/images/words/learning/${id}.svg`;
 const image=redrawn.has(id)?`/images/words/learning/${id}-v2.webp`:fallback;
 return {id,word:id,zh,wordCn:zh,chinese:zh,category,accent:'#688f83',aliases:[],sources:lessonIds.has(id)?[source(id)]:[],image,itemImage:image,bubbleImage:image,svg:fallback,itemSvg:fallback,bubbleSvg:fallback,audio:`/audio/words/${id}.mp3`,reviewAudio:`/audio/words/review/${id}.mp3`};
});
export const EXPANDED_WORDS=[...EXPANDED_NEW_WORDS,...['red','blue','circle'].map(id=>({id,sources:[source(id)]}))];
