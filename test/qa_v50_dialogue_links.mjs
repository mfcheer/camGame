import test from 'node:test';
import assert from 'node:assert/strict';
import {selectDialogue,DIALOGUE_LINKS} from '../src/dialogueSelection.js';
import {DialoguePractice} from '../src/dialoguePractice.js';
import {Game} from '../src/main.js';
import {BubbleManager} from '../src/bubbleManager.js';
import {getWordById} from '../src/wordsConfig.js';
import {LEARNING_PHRASES} from '../src/learningPhrases.js';
const make=()=>new DialoguePractice({cancel(){},resume(){},playPhrase(){return new Promise(()=>{});}},null,()=>{});
test('exact links resolve existing content and pin every observation to its matching option',()=>{
 for(const [id,[topic,correct]] of Object.entries(DIALOGUE_LINKS)){
  assert(getWordById(id)||LEARNING_PHRASES.some(p=>p.id===id),id);
  const d=make();d.start([id]);assert.equal(d.topic.id,topic,id);assert.equal(d.correct,correct||null,id);
  assert.equal(d.toJSON().contentId,id);if(correct)assert(d.topic.options.some(o=>o.id===correct));
 }
});
test('unrelated colors, counts, actions and character identities never imply observation topics',()=>{
 const s=selectDialogue(['red-apple','two-cats','kick-the-ball','bounce-the-ball','red-train','ball','two','blue','cat-character']);
 assert.equal(s.topic.id,'likes');
 assert.equal(selectDialogue(['two-cats','ball','blue','red-train']).linked,false);
});
test('topic weight ignores duplicate hits; least asked topic wins and ties remain selectable',()=>{
 assert.equal(selectDialogue(['cat','cat','cat','apple'],{counts:{identify:2,likes:0}}).topic.id,'likes');
 assert.equal(selectDialogue(['cat','apple'],{random:()=>0}).topic.id,'identify');
 assert.equal(selectDialogue(['cat','apple'],{random:()=>.99}).topic.id,'likes');
 const scenes=new Set([0,.99].map(n=>selectDialogue(['cat','dog'],{random:()=>n}).correct));assert.equal(scenes.size,2);
});
test('associated rounds exclude previous topic and preserve independent fallback progress',()=>{
 const d=make();d.start([]);assert.equal(d.topic.id,'feelings');
 d.start(['blue-ball']);assert.equal(d.correct,'blue');
 d.start(['blue-ball']);assert.equal(d.topic.id,'weather');assert.equal(d.selection.linked,false);
 d.start([]);assert.equal(d.topic.id,'identify');
 for(let i=0;i<30;i++){const last=d.lastTopic;d.start(['cat','dog','apple','milk','happy','sunny','blue-ball','two-balls']);assert.notEqual(d.topic.id,last);}
});
test('pause, replay and late voice completion cannot reselect or change the pinned scene',()=>{
 const d=make();d.start(['blue-ball']);const selection=d.selection;d.update(1);d.setPaused(true);d.update(60);d.setPaused(false);
 assert.equal(d.selection,selection);assert.equal(d.correct,'blue');assert.equal(d.stage,'choosing');d.update(.5);d.replay();assert.equal(d.selection,selection);assert.equal(d.topicCounts.color,1);
 d.clear();d.start([]);assert.equal(d.selection.linked,false);assert.equal(d.topic.id,'feelings');
});
test('Game passes popped set snapshot before cleanup; prepared pool does not influence selection',()=>{
 const d=make(),b={roundSeenWords:new Set(['two-balls']),wordPool:[{id:'apple'}],clearActiveBubble(){this.roundSeenWords.clear();},resetCombo(){}};
 const g=Object.assign(Object.create(Game.prototype),{state:'PLAYING',dialogue:d,bubbleManager:b,audioManager:{playCelebration(){}},cancelAutoNext(){}});
 g.handleVictory();assert.equal(d.topic.id,'count');assert.equal(d.correct,'two-balls');assert.equal(d.selection.contentId,'two-balls');
});
test('existing round reset clears popped evidence and prepared-but-unpopped entries stay excluded',()=>{
 const b=Object.assign(Object.create(BubbleManager.prototype),{visualDemo:{hide(){}},proximityOffset:{set(){}},roundSeenWords:new Set(['apple']),popRings:[],particles:[],energyProjectiles:[],handIndicators:[],resetCombo(){}});
 b.clear();assert.equal(b.roundSeenWords.size,0);const d=make();d.start(b.roundSeenWords);assert.equal(d.selection.linked,false);
});
