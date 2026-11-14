import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as THREE from 'three';
import {WORDS_LIST,getWordById} from '../src/wordsConfig.js';
import {EXPANDED_NEW_WORDS} from '../src/expandedVocabulary.js';
import {libraryWords,WORD_CATEGORIES} from '../src/wordLibrary.js';
import {BubbleManager} from '../src/bubbleManager.js';
import {AudioManager} from '../src/audioManager.js';

test('new lesson and suggested concepts are unique, categorised and retain the teacher photo source',()=>{
 assert.equal(WORDS_LIST.length,75);assert.equal(EXPANDED_NEW_WORDS.length,28);assert.equal(new Set(WORDS_LIST.map(w=>w.id)).size,75);
 for(const id of ['face','eye','ear','mouth','nose','hair','weather','one','happy','red','blue','circle']){
  const word=getWordById(id);assert.ok(word,`${id} exists`);assert.equal(WORDS_LIST.filter(w=>w.id===id).length,1);assert.ok(word.sources.some(s=>s.bookId==='classroom-next-lesson'),id);
 }
 for(const w of WORDS_LIST)assert.ok(WORD_CATEGORIES.some(([id])=>id===w.category),w.id);
 assert.equal(libraryWords('body').length,6);assert.equal(libraryWords('animals').length,4);
});

test('each new card has its own image and complete Chinese, English and bilingual sound assets',()=>{
 for(const word of EXPANDED_NEW_WORDS){
  const paths=[word.image,word.audio,word.reviewAudio,`/audio/words/zh/${word.id}.mp3`];
  for(const path of paths)assert.ok(fs.statSync('public'+path).size>200,`${word.id}: ${path}`);
 }
 const manifest=JSON.parse(fs.readFileSync('public/images/words/words-manifest.json','utf8'));
 assert.deepEqual(manifest.map(w=>w.id),WORDS_LIST.map(w=>w.id));
 const audio=new AudioManager();
 for(const word of EXPANDED_NEW_WORDS){
  assert.equal(audio.getWordAudioUrl(word.id,{review:true}),word.reviewAudio);
  assert.equal(audio.getWordAudioUrl(word.id,{lang:'zh'}),`/audio/words/zh/${word.id}.mp3`);
 }
});

test('recent concepts stay out of five subsequent rounds and each round keeps one featured word',()=>{
 const camera=new THREE.PerspectiveCamera(48,1,.1,100);camera.position.z=7.5;camera.updateMatrixWorld();
 const b=new BubbleManager(new THREE.Scene(),camera,{},null),seen=[];
 for(let i=0;i<250;i++){
  b.clear();b.beginWordRound();const word=b.chooseRoundWord(),concept=word.conceptId||word.id;
  assert.equal(b.chooseRoundWord(),word);assert.ok(!seen.slice(-5).includes(concept),`repeated ${concept}`);seen.push(concept);
 }
});
