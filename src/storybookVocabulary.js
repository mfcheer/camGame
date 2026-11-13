// Vocabulary verified against visible PDF pages, not the duplicated/clipped print-layout text layer.
export const STORYBOOK_SOURCES = {
  toys:{title:'Toys',author:'Anthony Curran',sourceFile:'1-1.Toys.pdf'},
  two:{title:'Two',author:'Torran Anderson',sourceFile:'2-2.Two.pdf'}
};
const source=(bookId,form,pdfPages,printedPage)=>({bookId,form,pdfPages,printedPage});
const word=(id,zh,category,accent,aliases,sources,image=`/images/words/learning/${id}.svg`)=>({
  id,word:id,zh,wordCn:zh,chinese:zh,category,accent,aliases,sources,
  itemImage:image,bubbleImage:image,image,
  itemSvg:image.endsWith('.svg')?image:null,bubbleSvg:image.endsWith('.svg')?image:null,svg:image.endsWith('.svg')?image:null,
  audio:`/audio/words/${id}.mp3`,reviewAudio:`/audio/words/review/${id}.mp3`
});
export const STORYBOOK_WORDS = [
  word('toy','玩具','toys','#D78140',['toys'],[source('toys','Toys',[1,2,11,12],'cover')]),
  word('block','积木','toys','#CA6C42',['blocks'],[source('toys','blocks',[3,10],3)]),
  // The book uses bear for a plush toy; reuse the existing teddy illustration.
  {...word('bear','玩具熊','toys','#AD794E',[],[source('toys','bear',[4,9],4)],'/images/words/learning/teddy.svg'),conceptId:'plush-bear'},
  word('paint','颜料','toys','#BD667C',[],[source('toys','paint',[5,8],5)]),
  word('drum','鼓','toys','#C98434',[],[source('toys','drum',[6,7],6)]),
  word('plane','飞机','toys','#4A97BD',['planes'],[source('toys','plane',[6,7],7)]),
  word('wagon','小拉车','toys','#CC634E',['wagons'],[source('toys','wagon',[5,8],8)]),
  word('kite','风筝','toys','#6F9F6B',['kites'],[source('toys','kite',[4,9],9)]),
  word('robot','机器人','toys','#5E92AA',['robots'],[source('toys','robot',[3,10],10)]),
  // Keep the number, children and animals together as the book's coherent learning theme.
  word('two','二','two_book','#DE9A34',[],[source('two','Two',[1,2,3,4,5,6,7,8,9,10,12],'cover / 3–10')]),
  word('bee','蜜蜂','two_book','#C6932E',['bees'],[source('two','bees',[3,10],3)],'/images/words/learning/bee.webp'),
  word('fish','鱼','two_book','#D99737',[],[source('two','fish',[4,9],4)],'/images/words/learning/fish.webp'),
  word('bird','鸟','two_book','#5B9BBB',['birds'],[source('two','birds',[5,8],5)],'/images/words/learning/bird.webp'),
  word('cat','猫','two_book','#D89142',['cats'],[source('two','cats',[6,7],6)],'/models/cat-preview.png'),
  word('dog','狗','two_book','#A57D55',['dogs'],[source('two','dogs',[6,7],7)],'/models/dog-preview.png'),
  word('cow','奶牛','two_book','#668E7B',['cows'],[source('two','cows',[5,8],8)],'/images/words/learning/cow.webp'),
  word('horse','马','two_book','#AF7955',['horses'],[source('two','horses',[4,9],9)],'/images/words/learning/horse.webp'),
  word('kid','小孩','two_book','#D78658',['kids'],[source('two','kids',[3,10],10)],'/images/words/learning/kid.webp')
];
