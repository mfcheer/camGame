import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as T from 'three';
import {WORDS_LIST,WORDS_MAP,getWordById,getRandomWord} from '../src/wordsConfig.js';
import {STORYBOOK_WORDS,STORYBOOK_SOURCES} from '../src/storybookVocabulary.js';
import {mergeVocabulary} from '../src/vocabularyMerge.js';
import {BubbleManager} from '../src/bubbleManager.js';
import {AudioManager} from '../src/audioManager.js';
const expected=['toy','block','bear','paint','drum','plane','wagon','kite','robot','two','bee','fish','bird','cat','dog','cow','horse','kid'];
const printed={block:3,bear:4,paint:5,drum:6,plane:7,wagon:8,kite:9,robot:10,bee:3,fish:4,bird:5,cat:6,dog:7,cow:8,horse:9,kid:10};
function camera(){const c=new T.PerspectiveCamera(48,1,.1,100);c.position.z=7.5;c.updateMatrixWorld();return c;}

test('the two verified books contribute 18 canonical words with source pages',()=>{
 assert.deepEqual(STORYBOOK_WORDS.map(w=>w.id),expected);assert.equal(WORDS_LIST.length,47);assert.equal(WORDS_MAP.size,47);
 for(const id of expected){const w=getWordById(id);assert.equal(w.word,id);assert.ok(w.zh);const bookSources=w.sources.filter(s=>STORYBOOK_SOURCES[s.bookId]);assert.equal(bookSources.length,1);const s=bookSources[0];assert.ok(STORYBOOK_SOURCES[s.bookId]);assert.ok(s.pdfPages.every(p=>p>=1&&p<=12));if(printed[id])assert.equal(s.printedPage,printed[id]);}
});

test('plural, punctuation, full-width and uppercase forms all resolve to one entry',()=>{
 for(const [alias,id]of Object.entries({TOYS:'toy',blocks:'block',Bees:'bee','FISH.':'fish',birds:'bird',cats:'cat',DOGS:'dog',cows:'cow',horses:'horse',kids:'kid','ＢＥＥＳ':'bee'}))assert.equal(getWordById(alias),getWordById(id),alias);
 assert.equal(new Set(WORDS_LIST.map(w=>w.id)).size,47);assert.equal(WORDS_LIST.filter(w=>w.id==='bee').length,1);
});

test('reimporting the same book or plural spelling does not duplicate entries or replace existing art',()=>{
 const before=getWordById('car').image;
 const merged=mergeVocabulary(WORDS_LIST,STORYBOOK_WORDS,[{id:'CATS',word:'cats',image:'wrong.png',sources:[{bookId:'another',form:'cats'}]}]);
 assert.equal(merged.length,47);assert.equal(merged.find(w=>w.id==='car').image,before);assert.equal(merged.find(w=>w.id==='cat').image,getWordById('cat').image);assert.equal(merged.find(w=>w.id==='cat').sources.length,getWordById('cat').sources.length+1);assert.equal(getWordById('cat').sources.filter(s=>s.bookId==='two').length,1);
 assert.throws(()=>mergeVocabulary([{id:'bee',aliases:['bees']},{id:'cat',aliases:['cats']}],[{id:'wrong',aliases:['bees','cats']}]),/Conflicting/);
});

test('bear reuses the plush illustration while retaining the book word and its pronunciation',()=>{
 assert.equal(getWordById('bear').image,getWordById('teddy').image);assert.notEqual(getWordById('bear').audio,getWordById('teddy').audio);assert.equal(getWordById('bear').zh,'玩具熊');assert.equal(getWordById('two').zh,'二');
});

test('all new words have image, complete bilingual audio and English-only review assets',()=>{
 for(const w of STORYBOOK_WORDS){for(const resource of [w.image,w.bubbleImage,w.audio,w.reviewAudio]){const f='public'+resource;assert.ok(fs.existsSync(f),f);assert.ok(fs.statSync(f).size>300,f);}assert.equal(w.itemImage,w.bubbleImage);}
});

test('book words enter ordinary three-word themed rounds with no immediate repeat',()=>{
 const b=new BubbleManager(new T.Scene(),camera(),{},null);const original=Math.random;
 try{Math.random=()=>([...new Set(WORDS_LIST.map(w=>w.category))].indexOf('two_book')+.1)/new Set(WORDS_LIST.map(w=>w.category)).size;const seen=[];for(let i=0;i<8;i++){const w=b.chooseRoundWord();assert.notEqual(w.id,seen.at(-1));seen.push(w.id);b.lastWordId=w.id;}assert.ok(b.wordPool.every(w=>w.category==='two_book'));assert.equal(new Set(seen.slice(0,3)).size,3);assert.equal(b.wordPool.length,3);}
 finally{Math.random=original;}
});

test('a plural forced target pops as the canonical word and shares its review memory',()=>{
 const calls=[];const b=new BubbleManager(new T.Scene(),camera(),{playPop(){},playWord:(id,o)=>calls.push([id,o.review])},null);
 b.createBubble(0,'normal','BLOCKS');assert.equal(b.activeBubble.word.id,'block');b.popBubble(.5,.5);b.createBubble(1,'normal','block');b.popBubble(.5,.5);assert.deepEqual(calls,[['block',false],['block',true]]);
});

test('audio URLs and preloading use the expanded canonical library',()=>{
 const a=new AudioManager(),loaded=[];a.loadWordBuffer=async id=>loaded.push(id);a.preloadWordAudios();assert.equal(new Set(loaded).size,47);assert.ok(expected.every(id=>loaded.includes(id)));assert.equal(a.getWordAudioUrl('BEES.'),'/audio/words/bee.mp3');assert.equal(a.getWordAudioUrl('KIDS',{review:true}),'/audio/words/review/kid.mp3');
 for(let i=0;i<80;i++)assert.notEqual(getRandomWord('CATS').id,'cat');
});

test('alternate names for the same plush bear do not appear together in a round',()=>{
 const original=Math.random;try{
  for(let seed=1;seed<=50;seed++){
   Math.random=original;const b=new BubbleManager(new T.Scene(),camera(),{},null);
   let value=seed,first=true;Math.random=()=>{if(first){first=false;return ([...new Set(WORDS_LIST.map(w=>w.category))].indexOf('toys')+.1)/new Set(WORDS_LIST.map(w=>w.category)).size;}value=value*16807%2147483647;return value/2147483647;};
   b.chooseRoundWord();assert.ok(b.wordPool.every(w=>w.category==='toys'));assert.equal(new Set(b.wordPool.map(w=>w.conceptId||w.id)).size,b.wordPool.length);
  }
 }finally{Math.random=original;}
});

test('the public vocabulary manifest agrees with the runtime library',()=>{
 const manifest=JSON.parse(fs.readFileSync('public/images/words/words-manifest.json','utf8'));assert.equal(manifest.length,47);assert.deepEqual(manifest.map(w=>w.id),WORDS_LIST.map(w=>w.id));for(const entry of manifest)assert.equal(entry.image,getWordById(entry.id).image);
});

test('a card requested using a book plural displays the canonical picture and lowercase word',async()=>{
 const {UIManager}=await import('../src/uiManager.js');const old=globalThis.document;
 const app={appendChild(){}};
 globalThis.document={getElementById:id=>id==='app'?app:null,createElement:()=>({style:{setProperty(){}},children:[],setAttribute(){},appendChild(c){this.children.push(c);},remove(){}})};
 try{const ui=Object.create(UIManager.prototype);const card=ui.showWordPopup('BEES.');assert.equal(card.textSpan.textContent,'bee');assert.equal(card.cnSpan.textContent,'蜜蜂');assert.equal(card.photo.src,'/images/words/learning/bee.webp');ui.clearWordPopup();}
 finally{if(old===undefined)delete globalThis.document;else globalThis.document=old;}
});
