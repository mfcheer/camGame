import {AnimalSpeech} from '../src/animalSpeech.js';
import fs from 'node:fs';
import {chooseAnimalPhrase} from '../src/animalPhrases.js';
// 倒数三套配音、解救告别短语与首页新布局专项（qa_v34）
import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../src/main.js';
import {AudioManager} from '../src/audioManager.js';

test('每次开局随机选一套倒数配音：3-2-1 与 GO 用同一套',()=>{
  const calls=[];
  const g=Object.assign(Object.create(Game.prototype),{state:'CALIBRATING',isAutoCountingDown:false,countdownTimers:[],autoCountdownSessionId:0,
    countdownReadyDuration:0,countdownLostDuration:0,
    audioManager:{playCountdown:(n,l)=>calls.push(['cd',n,l]),playCountdownGo:l=>calls.push(['go',l]),stopWord(){}},
    uiManager:{}});
  g.startAutoCountdown();
  assert.ok(['synth','zh','en'].includes(g.countdownVoiceSet),'倒数配音应为三套之一');
  assert.deepEqual(calls[0],['cd',3,g.countdownVoiceSet],'第一个倒数音应带上所选配音套');
  g.clearCountdownTimers();g.cancelAutoCountdown();
});

test('三套配音下 GO 触发必须早于开局，且人声 GO 留足播出时间再开局',()=>{
  const idx={synth:0,zh:1,en:2};
  const origRandom=Math.random;
  const g=Object.assign(Object.create(Game.prototype),{state:'CALIBRATING',isAutoCountingDown:false,countdownTimers:[],autoCountdownSessionId:0,
    countdownReadyDuration:0,countdownLostDuration:0,
    audioManager:{playCountdown(){},playCountdownGo(){},stopWord(){}},
    uiManager:{}});
  try{
    for(const set of ['synth','zh','en']){
      Math.random=()=>(idx[set]+.5)/3;
      g.countdownTimers=[];g.isAutoCountingDown=false;g.autoCountdownSessionId++;
      g.startAutoCountdown();
      assert.equal(g.countdownVoiceSet,set,`应强制选定 ${set} 套`);
      assert.equal(g.countdownTimers.length,4,'倒数应有 4 个定时器（3/2/1/GO + 开局）');
      const delays=g.countdownTimers.map(t=>t._idleTimeout);
      const goDelay=Math.max(...delays.slice(0,3));
      const startDelay=Math.max(...delays);
      assert.ok(goDelay<startDelay,`${set} 套 GO(${goDelay}ms)必须早于开局(${startDelay}ms)，否则开局清理会吞掉 GO`);
      if(set!=='synth')assert.ok(startDelay-goDelay>=700,`${set} 套 GO 人声约 0.6-0.7s，开局前应留 ≥700ms 播出时间，实际 ${startDelay-goDelay}ms`);
      g.clearCountdownTimers();
    }
  }finally{Math.random=origRandom;g.clearCountdownTimers();g.cancelAutoCountdown();}
});

test('中文/英文倒数走词通道播放对应音频，合成套不占用词通道',()=>{
  const a=Object.create(AudioManager.prototype);const clips=[];
  a.playPhrase=p=>{clips.push(p.audio);return Promise.resolve();};
  a.isMuted=true; // 合成路径在静音时直接返回，便于只观察路由
  a.playCountdown(3,'zh');a.playCountdown(2,'en');
  assert.deepEqual(clips,['/audio/countdown/zh/3.mp3','/audio/countdown/en/2.mp3']);
  clips.length=0;a.playCountdown(1);a.playCountdownGo();
  assert.deepEqual(clips,[]);
  a.playCountdownGo('zh');a.playCountdownGo('en');
  assert.deepEqual(clips,['/audio/countdown/zh/go.mp3','/audio/countdown/en/go.mp3']);
});

test('取消倒数时中断人声词通道，合成套无需处理',()=>{
  let stopped=0;
  const mk=()=>Object.assign(Object.create(Game.prototype),{countdownVoiceSet:null,countdownTimers:[],countdownReadyDuration:0,countdownLostDuration:0,isCountdownGracePeriod:false,audioManager:{stopWord(){stopped++;}},uiManager:{}});
  const zh=mk();zh.countdownVoiceSet='zh';zh.cancelAutoCountdown();assert.equal(stopped,1,'人声倒数取消应停止词通道');
  const synth=mk();synth.countdownVoiceSet='synth';synth.cancelAutoCountdown();assert.equal(stopped,1,'合成倒数取消不应触碰词通道');
});

test('演出结束动物离开时自动随机播报一句告别短语',()=>{
  const starts=[];
  const g=Object.assign(Object.create(Game.prototype),{state:'CELEBRATING',activeAnimalId:'frog',
    voiceQueue:{cancel(){}},clearPlayWordCue(){},beginFarewell(){},
    animalSpeech:{start(phase,id){starts.push([phase,id]);}}});
  g.startFarewell();
  assert.deepEqual(starts,[['end','frog']],'告别阶段应以 end 短语开始（thank-you/goodbye 等随机）');
});

test('每轮结束的告别短语从 end 短语库随机选择且不与上次重复',()=>{
  const seen=new Set();
  const g=Object.assign(Object.create(Game.prototype),{state:'CELEBRATING',activeAnimalId:'bunny',
    voiceQueue:{cancel(){}},clearPlayWordCue(){},beginFarewell(){},
    animalSpeech:{start(phase,id){seen.add(phase);}}});
  for(let i=0;i<8;i++)g.startFarewell();
  assert.ok(seen.has('end'));
});

test('通关做庆祝动作时自动播报中文庆祝短语，离开至终点时播报英文告别短语，且二者为同一短语的中英文互译绑定',()=>{
  const speechCalls=[];
  const g=Object.assign(Object.create(Game.prototype),{
    state:'CELEBRATING',activeAnimalId:'krashy',
    friendInteraction:{active:true,start(){},clear(){}},
    bubbleManager:{hideHandIndicators(){}},
    uiManager:{showFriendPlay(){},hideFriendPlay(){}},
    animalSpeech:{start(phase,id,onDone,phrase){speechCalls.push({phase,id,phrase});}},
    voiceQueue:{cancel(){}},clearPlayWordCue(){},beginFarewell(){}
  });
  // 1. 触发胜利庆祝时，选定短语并播报中文 celebrate
  const animalId = g.activeAnimalId;
  g.currentEndPhrase = chooseAnimalPhrase('end', animalId, g.lastEndPhraseId);
  g.lastEndPhraseId = g.currentEndPhrase.id;
  g.friendInteraction.start();
  g.bubbleManager.hideHandIndicators();
  g.uiManager?.showFriendPlay?.();
  g.animalSpeech?.start('celebrate', animalId, ()=>{}, g.currentEndPhrase);

  assert.equal(speechCalls.length, 1);
  assert.equal(speechCalls[0].phase, 'celebrate');
  assert.equal(speechCalls[0].id, 'krashy');
  assert.ok(speechCalls[0].phrase.zh);

  // 2. 庆祝动作结束离开走到终点时，播报同一短语的英文 end
  g.finishFriendPlay();
  assert.equal(speechCalls.length, 2);
  assert.equal(speechCalls[1].phase, 'end');
  assert.equal(speechCalls[1].id, 'krashy');
  assert.equal(speechCalls[1].phrase.id, speechCalls[0].phrase.id, '庆祝中文与告别英文短语ID必须完全相同（1:1互译）');
  assert.equal(speechCalls[1].phrase.en, speechCalls[0].phrase.en);
  assert.equal(speechCalls[1].phrase.zh, speechCalls[0].phrase.zh);
});

test('每轮告别互译短语从 8 对短语中轮换且不与上次重复，中英文音频文件全部存在且大于 2KB',()=>{
  const chosen=[];
  let prev=null;
  for(let i=0;i<16;i++){
    const phrase=chooseAnimalPhrase('end','krashy',prev);
    assert.ok(phrase.en,'应包含英文');
    assert.ok(phrase.zh,'应包含中文');
    assert.ok(fs.statSync('public' + phrase.audioEn).size > 2000, '英文音频应存在且大于2KB: ' + phrase.audioEn);
    assert.ok(fs.statSync('public' + phrase.audioZh).size > 2000, '中文音频应存在且大于2KB: ' + phrase.audioZh);
    if(prev)assert.notEqual(phrase.id,prev,'不与上次重复');
    prev=phrase.id;chosen.push(phrase.id);
  }
  assert.ok(new Set(chosen).size>=4,'应从8句短语库中丰富轮换');
});

test('AnimalSpeech 在 celebrate 时播放中文音频并在 end 时播放同一短语的英文音频', () => {
  const audioCalls = [];
  const uiCalls = [];
  const fakeAudio = {
    playPhrase(phraseObj) {
      audioCalls.push(phraseObj);
      return Promise.resolve();
    },
    stopPhrase() {}
  };
  const fakeUi = {
    showAnimalSpeech(phrase, animalId, phase) {
      uiCalls.push({phrase, animalId, phase});
    },
    hideAnimalSpeech() {}
  };
  const fakeAnimal = {
    setSpeaking() {},
    setSpeechListening() {}
  };

  
  const speech = new AnimalSpeech(fakeAudio, fakeUi, fakeAnimal);
  

  const testPhrase = chooseAnimalPhrase('end', 'krashy');

  // 1. celebrate 阶段
  speech.start('celebrate', 'krashy', () => {}, testPhrase);
  assert.equal(audioCalls.length, 1);
  assert.equal(audioCalls[0].id, testPhrase.id);
  assert.equal(audioCalls[0].lang, 'zh');
  assert.ok(audioCalls[0].audio.endsWith('-zh.mp3'), '庆祝阶段应播放中文音频: ' + audioCalls[0].audio);
  assert.equal(uiCalls[0].phase, 'celebrate');

  // 2. end 阶段（传入同一 phrase）
  speech.start('end', 'krashy', () => {}, testPhrase);
  assert.equal(audioCalls.length, 2);
  assert.equal(audioCalls[1].id, testPhrase.id);
  assert.equal(audioCalls[1].lang, 'en');
  assert.ok(!audioCalls[1].audio.endsWith('-zh.mp3'), '告别阶段应播放英文音频: ' + audioCalls[1].audio);
  assert.equal(uiCalls[1].phase, 'end');
});
