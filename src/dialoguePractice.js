import * as THREE from 'three';
import {DIALOGUES,dialogueLine} from './dialogueContent.js';
import {assetUrl} from './assetUrl.js';
import {getViewport} from './viewport.js';

// One active-time state machine. Async voice completion never advances an old screen.
export class DialoguePractice {
  constructor(voice,animal,onDone){this.voice=voice;this.animal=animal;this.onDone=onDone;this.ticket=0;this.active=false;this.lastTopic=null;this.weatherIndex=0;this.hands=[];}
  start(){
    this.clear();this.active=true;this.paused=false;this.attempts=0;this.selected=null;
    this.topic=DIALOGUES.find(t=>t.id!==this.lastTopic)||DIALOGUES[0];this.lastTopic=this.topic.id;
    this.correct=this.topic.free?null:['sunny','rainy'][this.weatherIndex++%2];
    this.animal?.startFriendPlay?.();this.measureAnimal();this.layoutAnimal();this.setStage('asking');
    this.say(this.topic.question,()=>this.setStage('choosing'));
  }
  measureAnimal(){
    const a=this.animal;if(!a?.model)return;
    a.group.updateWorldMatrix(true,true);const box=new THREE.Box3().setFromObject(a.model),scale=a.animalGroup.scale.y||1;
    this.localSize=box.getSize(new THREE.Vector3()).divideScalar(scale);this.localMinY=(box.min.y-a.animalGroup.position.y)/scale;
  }
  layoutAnimal(){
    const a=this.animal;if(!this.active||!a?.camera||!this.localSize)return;
    const {width:w,height:h}=getViewport();const vh=2*Math.tan(THREE.MathUtils.degToRad(a.camera.fov/2))*Math.abs(a.camera.position.z);
    const scale=Math.min(h*.29/this.localSize.y,w*.21/this.localSize.x)*vh/h;
    a.currentX=0;a.friendFloor=(.5-.95)*vh;a.currentY=a.friendFloor-this.localMinY*scale;
    a.animalGroup.position.set(0,a.currentY,.06);a.animalGroup.scale.setScalar(scale);
  }
  setStage(stage){
    this.ticket++;this.stage=stage;this.elapsed=0;this.guard=.4;
    this.inside=new Map();this.draw();this.seedHands();
  }
  say(id,done){
    const ticket=++this.ticket,line=dialogueLine(id);this.spoken=id;this.voice?.cancel();this.voice?.resume();
    this.animal?.setSpeaking?.(true);
    Promise.resolve(this.voice?.playPhrase({...line,en:line.word,audio:line.audioEn})).then(()=>{
      if(!this.active||this.paused||ticket!==this.ticket)return;
      this.animal?.setSpeaking?.(false);done?.();
    },()=>{if(this.active&&!this.paused&&ticket===this.ticket){this.animal?.setSpeaking?.(false);done?.();}});
  }
  choose(id){
    if(!this.active||this.paused||this.stage!=='choosing'||this.guard>0)return false;
    const option=this.topic.options.find(o=>o.id===id);if(!option)return false;
    if(!this.topic.free&&id!==this.correct&&++this.attempts<2){this.setStage('hint');return true;}
    this.selected=this.topic.free?id:this.correct;
    this.setStage('answering');
    // Sadness is accepted; keep the friend's quiet attention rather than a victory bounce.
    if(this.selected!=='sad')this.animal?.friendReact?.(1);
    const answer=this.topic.options.find(o=>o.id===this.selected);
    this.say(answer.line,()=>this.setStage('holding'));
    return true;
  }
  replay(){
    if(!this.active||this.paused||this.guard>0||!['choosing','holding'].includes(this.stage))return;
    const answering=this.stage==='holding';this.setStage(answering?'answering':'asking');
    this.say(answering?this.topic.options.find(o=>o.id===this.selected).line:this.topic.question,()=>this.setStage(answering?'holding':'choosing'));
  }
  update(dt){
    if(!this.active||this.paused)return;
    this.elapsed+=dt;this.guard=Math.max(0,this.guard-dt);
    if(this.stage==='asking'&&this.elapsed>=8){this.voice?.cancel();this.animal?.setSpeaking?.(false);this.setStage('choosing');}
    else if(this.stage==='answering'&&this.elapsed>=8){this.voice?.cancel();this.animal?.setSpeaking?.(false);this.setStage('holding');}
    else if(this.stage==='hint'&&this.elapsed>=1.6)this.setStage('choosing');
    else if((this.stage==='choosing'&&this.elapsed>=12)||(this.stage==='holding'&&this.elapsed>=3.5))this.finish();
  }
  setPaused(paused){
    if(!this.active)return;
    this.paused=paused;this.ticket++;this.voice?.cancel();this.animal?.setSpeaking?.(false);
    if(paused){if(this.root)this.root.hidden=true;return;}
    // Preserve the answer and progress, never replay after a background interruption.
    if(this.stage==='asking')this.setStage('choosing');
    else if(this.stage==='answering')this.setStage('holding');
    else{this.draw();this.guard=.4;this.seedHands();}
  }
  targets(){return [...(this.root?.querySelectorAll('[data-dialogue-target]')||[])].filter(e=>!e.disabled);}
  hits(hand){return this.targets().filter(e=>{const r=e.getBoundingClientRect(),v=getViewport();const x=v.left+hand.x*v.width,y=v.top+hand.y*v.height;const rx=r.width/2,ry=r.height/2;return ((x-r.left-rx)/rx)**2+((y-r.top-ry)/ry)**2<=1;}).map(e=>e.dataset.dialogueTarget);}
  seedHands(){for(const h of this.hands)this.inside.set(h.key,new Set(this.hits(h)));}
  feed(players){
    if(!this.active||this.paused)return;
    this.hands=(players||[]).flatMap(p=>(p.hands||[]).filter(h=>h.isIndexTip!==false&&h.observed!==false&&Number.isFinite(h.x)&&Number.isFinite(h.y)).map((h,i)=>({...h,key:`${p.id}_${h.side||i}`})));
    this.drawHands();
    const present=new Set(this.hands.map(h=>h.key));for(const key of this.inside.keys())if(!present.has(key))this.inside.delete(key);
    for(const h of this.hands){
      const hits=new Set(this.hits(h)),previous=this.inside.get(h.key);this.inside.set(h.key,hits);
      // First observation only arms a hand outside the targets; an arriving hand inside must leave.
      if(!previous||this.guard>0)continue;
      const entered=[...hits].find(id=>!previous.has(id));if(!entered)continue;
      if(entered==='replay')this.replay();else this.choose(entered);
      break; // A frame / sweep may select only one target.
    }
  }
  drawHands(){
    const layer=this.root?.querySelector('.dialogue-hands');if(!layer)return;layer.replaceChildren();
    for(const h of this.hands){const dot=document.createElement('i');dot.style.left=`${h.x*100}%`;dot.style.top=`${h.y*100}%`;layer.append(dot);}
  }
  draw(){
    if(typeof document==='undefined')return;
    this.root?.remove();const root=document.createElement('section');this.root=root;root.className='dialogue-practice';root.setAttribute('aria-label','和朋友聊一句');root.hidden=!!this.paused;
    const question=dialogueLine(this.topic.question),answer=this.selected&&this.topic.options.find(o=>o.id===this.selected);
    const img=id=>`<img src="${assetUrl(`/images/dialogue/${id}.svg`)}" alt="" draggable="false">`;
    root.innerHTML=`<div class="dialogue-question"><span>${this.topic.free?'说说你的心情':'看看这里的天气'}</span><strong>${answer?dialogueLine(answer.line).word:question.word}</strong><small>${this.stage==='hint'?'看看上面的天气，再试一次':answer?(this.selected==='sad'?'我陪着你，难过也没关系':'可以跟着说一句'):'听朋友问，再碰一个泡泡'}</small></div>${this.correct?`<div class="dialogue-scene ${this.stage==='hint'?'dialogue-hint':''}" aria-label="游戏里的天气：${this.correct==='sunny'?'晴天':'下雨'}">${img(this.correct)}<span>游戏里的天气</span></div>`:''}<div class="dialogue-answers" ${this.stage==='asking'?'hidden':''}>${this.topic.options.map(o=>`<button type="button" class="dialogue-bubble ${answer?.id===o.id?'selected':''}" data-dialogue-target="${o.id}" aria-label="${o.label}，${dialogueLine(o.line).word}" ${this.stage!=='choosing'?'disabled':''} ${answer&&answer.id!==o.id?'style="visibility:hidden"':''}>${img(o.id)}<span>${o.label}</span></button>`).join('')}</div>${['choosing','holding'].includes(this.stage)?'<button type="button" class="dialogue-replay" data-dialogue-target="replay" aria-label="再听一次">↻<span>再听</span></button>':''}<div class="dialogue-hands" aria-hidden="true"></div>`;
    root.addEventListener('pointerdown',e=>{const target=e.target.closest('[data-dialogue-target]');if(!target||target.disabled)return;e.preventDefault();if(target.dataset.dialogueTarget==='replay')this.replay();else this.choose(target.dataset.dialogueTarget);});
    document.body.append(root);this.drawHands();
  }
  finish(){if(!this.active)return;this.clear();this.onDone?.();}
  clear(){this.ticket++;if(this.active)this.voice?.cancel();this.active=false;this.paused=false;this.animal?.setSpeaking?.(false);this.root?.remove();this.root=null;this.hands=[];this.inside=new Map();}
  toJSON(){return {active:this.active,paused:!!this.paused,topic:this.topic?.id,stage:this.stage,selected:this.selected,correct:this.correct,attempts:this.attempts,elapsed:this.elapsed,targets:this.targets().map(e=>{const r=e.getBoundingClientRect(),v=getViewport();return {id:e.dataset.dialogueTarget,x:(r.left+r.width/2-v.left)/v.width,y:(r.top+r.height/2-v.top)/v.height};})};}
}
