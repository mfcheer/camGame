import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {Box3,PerspectiveCamera,Scene,Vector3} from 'three';
import {DialoguePractice} from '../src/dialoguePractice.js';
import {DIALOGUE_LINES,DIALOGUES} from '../src/dialogueContent.js';
import {ANIMAL_MODELS,RescueAnimal} from '../src/rescueAnimal.js';
const flush=async()=>{for(let i=0;i<5;i++)await Promise.resolve();};
function fixture(){const jobs=[],spoken=[],reactions=[];let done=0;const voice={cancel(){},resume(){},playPhrase(line){spoken.push(line);return new Promise(resolve=>jobs.push(resolve));}};const d=new DialoguePractice(voice,{startFriendPlay(){},setSpeaking(){},friendReact(n){reactions.push(n);}},()=>done++);return {d,jobs,spoken,reactions,get done(){return done;}};}
test('all complete sentences have static bilingual and short recordings',()=>{for(const line of DIALOGUE_LINES)for(const path of [line.audio,line.audioEn,line.audioZh])assert.ok(fs.statSync(`public${path}`).size>1000);for(const id of ['happy','sad','sunny','rainy'])assert.ok(fs.existsSync(`public/images/dialogue/${id}.svg`));});
test('free expression accepts sadness, no happy reward, one answer and one exit',async()=>{const f=fixture();f.d.start();assert.equal(f.d.choose('sad'),false);f.jobs[0]();await flush();f.d.update(.5);assert.equal(f.d.choose('sad'),true);assert.equal(f.d.choose('happy'),false);assert.equal(f.d.selected,'sad');assert.equal(f.reactions.length,0);assert.equal(f.spoken[1].en,"I'm sad.");f.jobs[1]();await flush();f.d.update(3.6);assert.equal(f.done,1);f.d.update(20);assert.equal(f.done,1);});
test('topics rotate through full bank, weather alternates; first mismatch hints, second models truth',async()=>{const f=fixture();f.d.start();f.d.start();assert.equal(f.d.topic.id,'weather');assert.equal(f.d.correct,'sunny');f.jobs.at(-1)();await flush();f.d.update(.5);f.d.choose('rainy');assert.equal(f.d.stage,'hint');assert.equal(f.spoken.length,2);f.d.update(1.7);f.d.update(.5);f.d.choose('rainy');assert.equal(f.d.selected,'sunny');assert.equal(f.spoken.at(-1).en,"It's sunny.");for(let i=0;i<DIALOGUES.length;i++)f.d.start();assert.equal(f.d.topic.id,'weather');assert.equal(f.d.correct,'rainy');});
test('pause freezes waiting and discards speech callbacks, resume never repeats voice',async()=>{const f=fixture();f.d.start();f.d.setPaused(true);f.jobs[0]();await flush();f.d.update(60);assert.equal(f.d.stage,'asking');f.d.setPaused(false);assert.equal(f.d.stage,'choosing');assert.equal(f.spoken.length,1);f.d.update(5);f.d.setPaused(true);f.d.update(60);f.d.setPaused(false);assert.equal(f.d.elapsed,5);f.d.update(7.1);assert.equal(f.done,1);});
test('failed/hung audio cannot block selection or exit; cancelled round callbacks stay dead',async()=>{const f=fixture();f.d.start();f.d.update(8.1);assert.equal(f.d.stage,'choosing');f.d.update(.5);f.d.choose('happy');f.d.setPaused(true);f.d.setPaused(false);assert.equal(f.d.stage,'holding');f.d.clear();f.jobs.forEach(resolve=>resolve());await flush();assert.equal(f.done,0);assert.equal(f.d.active,false);f.d.start();f.d.update(8.1);f.d.update(12.1);assert.equal(f.done,1);});
test('entry protection requires leaving, stale hands cannot select, a sweep accepts one',async()=>{const f=fixture();f.d.hits=h=>h.x<.4?['happy']:h.x>.6?['sad']:[];const feed=x=>f.d.feed([{id:1,hands:[{x,y:.5,side:'left',isIndexTip:true}]}]);f.d.start();feed(.2);f.jobs[0]();await flush();f.d.update(.5);feed(.2);assert.equal(f.d.stage,'choosing');feed(.5);feed(.2);assert.equal(f.d.selected,'happy');feed(.8);assert.equal(f.d.selected,'happy');});
test('unobserved/non-index points do not trigger choices',async()=>{const f=fixture();f.d.hits=()=>['happy'];f.d.start();f.jobs[0]();await flush();f.d.update(.5);f.d.feed([{id:1,hands:[{x:.2,y:.5,isIndexTip:false},{x:.2,y:.5,observed:false}]}]);assert.equal(f.d.hands.length,0);assert.equal(f.d.stage,'choosing');});

test('game routes camera/simulation fingertips into dialogue and expires only camera observations',async()=>{
  const {Game}=await import('../src/main.js');const f=fixture(),d=f.d;
  const g=Object.assign(Object.create(Game.prototype),{dialogue:d,state:'CELEBRATING',isDemoMode:true,poseDetector:{},sceneManager:{render(){},update(){}},renderWebcamFrame(){}});
  g.setupPoseCallbacks();d.hits=h=>h.x<.4?['happy']:[];d.start();f.jobs[0]();await flush();d.update(.5);
  const frame=x=>g.poseDetector.onResultsCallback({players:[{id:1,hands:[{x,y:.5,side:'right',isIndexTip:true}]}],isDemo:true});
  frame(.5);g.lastPlayersReceivedAt=performance.now()-1000;g.updateFrame(.02);frame(.2);assert.equal(d.selected,'happy');
  d.start();frame(.5);g.isDemoMode=false;g.lastPlayersReceivedAt=performance.now()-1000;g.updateFrame(.02);assert.equal(d.hands.length,0);
});

test('post-dialogue farewell speaks the same Chinese then English and cancellation prevents the second half',async()=>{
  const {AnimalSpeech}=await import('../src/animalSpeech.js');
  const {ANIMAL_PHRASES}=await import('../src/animalPhrases.js');
  const line=ANIMAL_PHRASES.end.find(p=>p.id==='see-you'),calls=[],jobs=[];
  const speech=new AnimalSpeech({stopPhrase(){},playPhrase(p){calls.push(p);return new Promise(r=>jobs.push(r));}},{},{});speech.nonBlocking=true;
  speech.start('end','bunny',()=>{},line,{bilingual:true});assert.equal(calls[0].lang,'zh');assert.equal(calls[0].audio,line.audioZh);
  jobs[0]();await flush();assert.equal(calls[1].lang,'en');assert.equal(calls[1].audio,line.audioEn);jobs[1]();await flush();assert.equal(speech.done,true);
  speech.start('end','bunny',()=>{},line,{bilingual:true});speech.setPaused(true);jobs[2]();await flush();speech.setPaused(false);await flush();assert.equal(calls.length,3,'resume must not replay either half');
  speech.start('end','bunny',()=>{},line,{bilingual:true});speech.cancel();jobs[3]();await flush();assert.equal(calls.length,4,'cancel prevents pending English');
});
test('post-dialogue result waits for bilingual farewell; timeout can release it',async()=>{
  const {Game}=await import('../src/main.js');let shown=0;
  const g=Object.assign(Object.create(Game.prototype),{state:'CELEBRATING',dialogue:{active:false},animalSpeech:{active:true,nonBlocking:true,bilingual:true},rescueAnimal:{state:'ESCAPED'},showVictoryResult(){shown++;}});
  g.showVictoryWhenReady();assert.equal(shown,0);g.animalSpeech.active=false;g.showVictoryWhenReady();assert.equal(shown,1);
});

test('the full character stands above the track during dialogue and after viewport rotation',()=>{
  const camera=new PerspectiveCamera(48,1194/834,.1,100);
  camera.position.z=7.5;camera.updateMatrixWorld();
  const previousWindow=globalThis.window;
  try{
    for(const id of Object.keys(ANIMAL_MODELS)){
      const animal=new RescueAnimal(new Scene(),camera,id);
      const dialogue=new DialoguePractice(null,animal);
      dialogue.start();
      for(const [width,height] of [[1194,834],[834,1194],[667,240]]){
        globalThis.window={innerWidth:width,innerHeight:height};
        camera.aspect=width/height;camera.updateProjectionMatrix();
        animal.updateLayout(width,height,camera);
        dialogue.layoutAnimal();animal.friendReact();animal.update(.016,1);
        animal.animalGroup.updateWorldMatrix(true,false);
        const box=new Box3().setFromObject(animal.model,true);
        assert.ok(box.min.y>=animal.groundY,`${id} at ${width}×${height}: feet above the track`);
        for(const x of [box.min.x,box.max.x])for(const y of [box.min.y,box.max.y])for(const z of [box.min.z,box.max.z]){
          const p=new Vector3(x,y,z).project(camera);
          assert.ok(Math.abs(p.x)<1&&Math.abs(p.y)<1,`${id} at ${width}×${height}: full model in view`);
        }
      }
      delete globalThis.window;
    }
  }finally{
    if(previousWindow===undefined)delete globalThis.window;
    else globalThis.window=previousWindow;
  }
});
