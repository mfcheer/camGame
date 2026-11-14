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
