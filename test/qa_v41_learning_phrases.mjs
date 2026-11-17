import assert from 'node:assert/strict';
import {LEARNING_PHRASES as phrases} from '../src/learningPhrases.js';
import {WORDS_LIST,getWordById} from '../src/wordsConfig.js';
import {conflicts,mixPhrase,preparePhraseMedia} from '../src/contentSelection.js';
import {AudioManager} from '../src/audioManager.js';
import {existsSync} from 'node:fs';
const car=phrases.find(p=>p.id==='red-car'),train=phrases.find(p=>p.id==='red-train');
for(const word of ['car','red']){assert(conflicts(car,getWordById(word)));assert(conflicts(getWordById(word),car));}
assert(!conflicts(car,train));assert(!conflicts(car,getWordById('ball')));
const seen={};const selected=[];
for(let round=0;round<phrases.length*2;round++){
 const pool=mixPhrase(WORDS_LIST,WORDS_LIST,3,{seen});assert.equal(pool.length,3);
 const p=pool[0];selected.push(p.id);seen[p.id]=(seen[p.id]||0)+1;
 for(let a=0;a<pool.length;a++)for(let b=a+1;b<pool.length;b++)assert(!conflicts(pool[a],pool[b]));
}
assert.equal(new Set(selected.slice(0,phrases.length)).size,phrases.length);
for(const p of phrases){assert.equal(getWordById(p.id),p);for(const key of ['image','audio','audioEn','audioZh'])assert(existsSync('public'+p[key]),p[key]);
 const audio=new AudioManager();assert(audio.getWordAudioUrl(p.id,{review:true}).endsWith(p.audioEn));assert(audio.getWordAudioUrl(p.id,{lang:'zh'}).endsWith(p.audioZh));}
const fetchBefore=globalThis.fetch;globalThis.fetch=async()=>({ok:false});assert.deepEqual(await preparePhraseMedia([car],x=>x),[null]);globalThis.fetch=fetchBefore;
console.log('短语关联、双向冲突、全部短语覆盖、资源路径和失败检查通过');
