import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {LEARNING_PHRASES} from '../src/learningPhrases.js';
import {motionFrame} from '../src/contentMotion.js';
import {conflicts,mixPhrase} from '../src/contentSelection.js';
import {WORDS_LIST,getWordById} from '../src/wordsConfig.js';
import * as THREE from 'three';
import {BubbleManager} from '../src/bubbleManager.js';
const actions=LEARNING_PHRASES.filter(p=>p.motion);
assert.equal(actions.length,8);
for(const p of actions){
 assert(conflicts(p,getWordById(p.relatedWordIds[0])));
 assert(!conflicts(p,LEARNING_PHRASES[0]));
 for(const path of [p.image,p.motion.src,p.audio,p.audioEn,p.audioZh])assert(existsSync('public'+path));
 const svg=readFileSync('public'+p.motion.src,'utf8');assert(svg.includes('width="4096"'));assert(!/<animate|<script/.test(svg));
 assert.equal(motionFrame(p.motion,0),0);assert.equal(motionFrame(p.motion,1),8);assert.equal(motionFrame(p.motion,2),0);assert.equal(motionFrame(p.motion,1,true),0);
}
const seen={};
for(let i=0;i<LEARNING_PHRASES.length;i++){const [p]=mixPhrase(WORDS_LIST,WORDS_LIST,3,{seen});assert(!seen[p.id]);seen[p.id]=1;}
// Exercise every action deterministically, including a loader that throws before
// it can call onError (e.g. an unavailable image API). The poster must survive.
const oldDocument=globalThis.document,oldLoad=THREE.TextureLoader.prototype.load;
try{
 globalThis.document={};
 THREE.TextureLoader.prototype.load=()=>{throw Error('image API unavailable');};
 for(const word of actions){
  const poster=new THREE.Texture();
  const manager=Object.assign(Object.create(BubbleManager.prototype),{getWordTexture:()=>poster});
  const mesh=manager.createWordCardMesh(word,.5);
  assert.equal(manager.motionTextures.get(word.id).failed,true);
  assert.equal(manager.motionTextures.get(word.id).texture,null);
  assert(mesh.children.some(child=>child.material?.map===poster));
 }
}finally{
 THREE.TextureLoader.prototype.load=oldLoad;
 if(oldDocument===undefined)delete globalThis.document;else globalThis.document=oldDocument;
}
console.log('八组动作素材、关联去重、帧循环、减少动态效果与全部短语覆盖通过');
