import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {DIALOGUES,DIALOGUE_LINES,dialogueLine} from '../src/dialogueContent.js';
import {DialoguePractice} from '../src/dialoguePractice.js';
import {LEARNING_PHRASES} from '../src/learningPhrases.js';
import {getWordById} from '../src/wordsConfig.js';
const flush=async()=>{for(let i=0;i<5;i++)await Promise.resolve();};
const make=()=>{const calls=[],jobs=[];let done=0;const d=new DialoguePractice({cancel(){},resume(){},playPhrase(p){calls.push(p);return new Promise(r=>jobs.push(r));}},null,()=>done++);return{d,calls,jobs,get done(){return done;}};};
test('expanded bank keeps every referenced word, picture and complete recording',()=>{
 assert.equal(LEARNING_PHRASES.length,22);assert.equal(DIALOGUES.length,7);assert.equal(DIALOGUE_LINES.length,21);
 for(const p of LEARNING_PHRASES){for(const id of p.relatedWordIds)assert(getWordById(id),`${p.id}: ${id}`);}
 for(const topic of DIALOGUES){assert(dialogueLine(topic.question));assert(topic.prompt);assert.equal(topic.options.length,2);
  for(const o of topic.options){assert(dialogueLine(o.line));for(const id of new Set([o.id,o.scene||o.id])){
   const s=fs.readFileSync(`public/images/dialogue/${id}.svg`,'utf8');assert(!/<script|<animate|<text|https?:\/\/(?!www.w3.org)/.test(s));}
  }if(!topic.free)assert(topic.sceneLabel&&topic.hint);
 }
 const manifest=JSON.parse(fs.readFileSync('docs/voice-manifest.json'));
 for(const item of [...LEARNING_PHRASES.slice(10),...DIALOGUE_LINES.slice(6)])for(const key of ['audio','audioEn','audioZh'])assert(manifest.some(r=>r.id===item.id&&r.assets.some(a=>a.path==='public'+item[key])));
});
test('all seven topics appear once per cycle and observation scenes alternate independently',()=>{
 const f=make(),cycles=[];
 for(let i=0;i<14;i++){f.d.start();cycles.push({topic:f.d.topic.id,correct:f.d.correct});}
 assert.equal(new Set(cycles.slice(0,7).map(x=>x.topic)).size,7);
 for(let i=0;i<7;i++){assert.equal(cycles[i].topic,cycles[i+7].topic);const t=DIALOGUES[i];assert.equal(cycles[i].correct,t.free?null:t.options[0].id);assert.equal(cycles[i+7].correct,t.free?null:t.options[1].id);}
});
test('every new observation topic hints, then models the scene, never reads a wrong answer',async()=>{
 for(const topic of DIALOGUES.filter(t=>!t.free)){
  const f=make();f.d.lastTopic=DIALOGUES[(DIALOGUES.indexOf(topic)+6)%7].id;f.d.start();const [correct,wrong]=topic.options;
  f.jobs[0]();await flush();f.d.update(.5);assert(f.d.choose(wrong.id));assert.equal(f.d.stage,'hint');assert.equal(f.calls.length,1);
  f.d.update(1.7);f.d.update(.5);f.d.choose(wrong.id);assert.equal(f.d.selected,correct.id);assert.equal(f.calls.at(-1).en,dialogueLine(correct.line).word);
  f.jobs.at(-1)();await flush();f.d.update(3.6);assert.equal(f.done,1);
 }
});
test('both preference options accepted; paused replay cannot advance or add rewards',async()=>{
 for(const topic of DIALOGUES.filter(t=>['likes','drinks'].includes(t.id)))for(const option of topic.options){
  const f=make();f.d.lastTopic=DIALOGUES[DIALOGUES.indexOf(topic)-1].id;f.d.start();f.jobs[0]();await flush();f.d.update(.5);assert(f.d.choose(option.id));assert.equal(f.d.selected,option.id);f.jobs[1]();await flush();f.d.update(.5);f.d.replay();assert.equal(f.calls.at(-1).en,dialogueLine(option.line).word);f.d.setPaused(true);f.jobs.at(-1)();await flush();f.d.update(30);assert.equal(f.done,0);f.d.setPaused(false);assert.equal(f.d.stage,'holding');const n=f.calls.length;f.d.update(3.6);assert.equal(f.calls.length,n);assert.equal(f.done,1);
 }
});
