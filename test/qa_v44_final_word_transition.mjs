import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../src/main.js';
import {VoiceQueue} from '../src/voiceQueue.js';
import {SpeechPolicy} from '../src/speechPolicy.js';
import {getWordById} from '../src/wordsConfig.js';

const flush=async()=>{for(let n=0;n<12;n++)await Promise.resolve();};
function fixture(){
  const jobs=[],events=[];
  const audio={playWord(id,options){events.push(options.lang);return new Promise(resolve=>jobs.push(resolve));},stopWord(){events.push('stop');jobs.at(-1)?.();},playEnergyCharge(){},playCelebration(){events.push('celebrate');}};
  const policy=new SpeechPolicy(null);policy.setAutomatic(true);
  const queue=new VoiceQueue(audio,policy);
  const g=Object.assign(Object.create(Game.prototype),{state:'PLAYING',collectedCount:5,targetCount:6,activeAnimalId:'bunny',voiceQueue:queue,speechPolicy:policy,audioManager:audio,
    uiManager:{showWordCue(){events.push('cue');},clearWordCue(){events.push('clear');}},
    bubbleManager:{lastPoppedEnergy:1,clearActiveBubble(){events.push('remove');},hideHandIndicators(){},update(){}},
    friendInteraction:{setPaused(){},start(){events.push('friend');}},animalSpeech:{update(){},setPaused(){},cancel(){events.push('animal-cancel');},start(){events.push('speech-card');}},
    sceneManager:{update(){},render(){}}});
  return {g,jobs,events,queue};
}
for(const pair of [false,true])test(`final ${pair?'bilingual pair':'single word'} finishes before celebration and card`,async()=>{
  const {g,jobs,events}=fixture();
  const spoken=g.presentPlayWord(getWordById('ball'),pair?{}:{lang:'en',review:true});
  g.onBubblePopped();
  assert.equal(g.collectedCount,6);assert.equal(g.state,'PLAYING');assert.equal(g.pendingVictory,true);
  assert.ok(!events.includes('animal-cancel'));assert.ok(!events.includes('speech-card'));
  g.updateFrame(5);assert.equal(g.state,'PLAYING','slow audio must not be replaced');
  g.onBubblePopped();assert.equal(events.filter(e=>e==='remove').length,1,'no repeat scoring/transition');
  jobs[0]();await flush();
  if(pair){assert.equal(events.at(-1),'en');g.updateFrame(2);assert.equal(g.state,'PLAYING');jobs[1]();}
  await spoken;
  g.updateFrame(.3);assert.equal(g.state,'PLAYING');g.updateFrame(.36);
  assert.equal(g.state,'CELEBRATING');assert.equal(g.pendingVictory,false);
  assert.ok(events.indexOf('speech-card')>events.indexOf('clear'));
});
test('pause discards final audio, freezes transition, resumes without replay',async()=>{
  const {g,jobs,events}=fixture();const spoken=g.presentPlayWord(getWordById('ball'),{lang:'en'});g.onBubblePopped();
  g.handleTogglePause(true);await spoken;g.updateFrame(10);
  assert.equal(g.state,'PAUSED');assert.ok(!events.includes('speech-card'));
  g.handleResume();g.updateFrame(.01);
  assert.equal(g.state,'CELEBRATING');assert.equal(jobs.length,1);
});
test('no automatic reading means no artificial end-of-round delay',()=>{
  const {g}=fixture();g.onBubblePopped();assert.equal(g.state,'CELEBRATING');assert.equal(g.pendingVictory,false);
});
test('cancelled old reading cannot trigger a result after leaving play',async()=>{
  const {g,queue,jobs,events}=fixture();const spoken=g.presentPlayWord(getWordById('ball'));g.onBubblePopped();
  g.state='START';g.pendingVictory=false;queue.cancel();g.clearPlayWordCue();jobs[0]();await spoken;g.updateFrame(20);
  assert.equal(g.state,'START');assert.ok(!events.includes('speech-card'));
});
