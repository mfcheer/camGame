import * as THREE from 'three';
import {DIALOGUES,dialogueLine} from './dialogueContent.js';
import {assetUrl} from './assetUrl.js';
import {getSafeInsets,getViewport} from './viewport.js';
import {selectDialogue} from './dialogueSelection.js';

// One active-time state machine. Async voice completion never advances an old screen.
export class DialoguePractice {
  constructor(voice,animal,onDone){this.voice=voice;this.animal=animal;this.onDone=onDone;this.ticket=0;this.active=false;this.lastTopic=null;this.sceneIndices={};this.hands=[];}
  start(poppedIds=[]){
    this.clear();this.active=true;this.paused=false;this.attempts=0;this.selected=null;
    const previous=DIALOGUES.findIndex(t=>t.id===this.lastTopic);
    const selection=selectDialogue(poppedIds,{lastTopic:this.lastTopic,counts:this.topicCounts||{},fallbackIndex:this.fallbackIndex??(previous+1)%DIALOGUES.length});
    this.topic=selection.topic;this.lastTopic=this.topic.id;this.selection=selection;
    this.fallbackIndex=selection.fallbackIndex;
    this.topicCounts??={};this.topicCounts[this.topic.id]=(this.topicCounts[this.topic.id]||0)+1;
    const index=this.sceneIndices[this.topic.id]||0;
    this.correct=this.topic.free?null:selection.correct||this.topic.options[index%this.topic.options.length].id;
    if(!this.topic.free)this.sceneIndices[this.topic.id]=index+1;
    this.animal?.startFriendPlay?.();this.setStage('asking');this.layoutAnimal();
    this.say(this.topic.question,()=>this.setStage('choosing'));
  }
  measureAnimal(){
    const a=this.animal;
    a.updateFriendPose?.(0);
    const origin=a.animalGroup.getWorldPosition(new THREE.Vector3());
    const box=new THREE.Box3().setFromObject(a.model);
    const scale=a.animalGroup.scale.y||1;
    box.min.sub(origin).divideScalar(scale);
    box.max.sub(origin).divideScalar(scale);
    this.measuredModel=a.model;
    this.modelBounds=box;
  }
  layoutAnimal(){
    const a=this.animal;
    if(!this.active||!a?.camera||!a.model)return;
    if(this.measuredModel!==a.model||!this.modelBounds)this.measureAnimal();
    const {width:w,height:h,top}=getViewport();
    const safeBottom=getSafeInsets().bottom;
    const distance=Math.abs(a.camera.position.z);
    const vh=2*Math.tan(THREE.MathUtils.degToRad(a.camera.fov/2))*distance;
    const previous=this.placement;
    if(previous?.root!==this.root||previous?.w!==w||previous?.h!==h||
       previous?.top!==top||previous?.safeBottom!==safeBottom||previous?.groundY!==a.groundY||previous?.bounds!==this.modelBounds){
      const {min,max}=this.modelBounds;
      const modelWidth=2*Math.max(Math.abs(min.x),Math.abs(max.x));
      const fit=(width,height)=>Math.max(0,Math.min(width/modelWidth,height/(max.y-min.y)))*vh/h*.91;
      // Clear the raised tiles and keep the nearest edge of long models in view.
      const nearestDepth=.06+Math.max(0,max.z)*fit(w*.30,h*.29);
      const safeFloor=(.5-(h-safeBottom-16)/h)*vh*(1-nearestDepth/distance);
      const floor=Math.max(a.groundY+.055,safeFloor);
      const floorPx=(.5-floor/vh)*h;
      const question=this.root?.querySelector('.dialogue-question')?.getBoundingClientRect();
      const scene=this.root?.querySelector('.dialogue-scene')?.getBoundingClientRect();
      const headerBottom=Math.max(question?.bottom||top,scene?.bottom||top)-top;
      const maxHeight=Math.min(h*.29,floorPx-headerBottom-12);
      const [left,right]=this.root?.querySelectorAll('.dialogue-bubble')||[];
      let scale=fit(w*.23,maxHeight);
      if(left&&right){
        const leftRect=left.getBoundingClientRect(),rightRect=right.getBoundingClientRect();
        // Use the unscaled boxes so the selected bubble's pulse does not resize the friend.
        const gap=(rightRect.left+rightRect.right-leftRect.left-leftRect.right-right.offsetWidth-left.offsetWidth)/2;
        const answersBottom=Math.max((leftRect.top+leftRect.bottom+left.offsetHeight)/2,(rightRect.top+rightRect.bottom+right.offsetHeight)/2)-top;
        scale=Math.max(fit(gap-18,maxHeight),fit(w*.30,Math.min(maxHeight,floorPx-answersBottom-16)));
      }
      this.placement={root:this.root,w,h,top,safeBottom,groundY:a.groundY,bounds:this.modelBounds,floor,scale};
    }
    const {floor,scale}=this.placement;
    a.currentX=0;a.friendFloor=floor;a.currentY=floor-this.modelBounds.min.y*scale;
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
    const correctOption=this.topic.options.find(o=>o.id===this.correct);
    const img=id=>`<img src="${assetUrl(`/images/dialogue/${id}.svg`)}" alt="" draggable="false">`;
    root.innerHTML=`<div class="dialogue-question"><span>${this.topic.prompt}</span><strong>${answer?dialogueLine(answer.line).word:question.word}</strong><small>${this.stage==='hint'?this.topic.hint:answer?(this.selected==='sad'?'我陪着你，难过也没关系':'可以跟着说一句'):'听朋友问，再碰一个泡泡'}</small></div>${this.correct?`<div class="dialogue-scene ${this.stage==='hint'?'dialogue-hint':''}" aria-label="${this.topic.sceneLabel}：${correctOption.label}">${img(correctOption.scene||this.correct)}<span>${this.topic.sceneLabel}</span></div>`:''}<div class="dialogue-answers" ${this.stage==='asking'?'aria-hidden="true"':''}>${this.topic.options.map(o=>`<button type="button" class="dialogue-bubble ${answer?.id===o.id?'selected':''}" data-dialogue-target="${o.id}" aria-label="${o.label}，${dialogueLine(o.line).word}" ${this.stage!=='choosing'?'disabled':''} ${answer&&answer.id!==o.id?'style="visibility:hidden"':''}>${img(o.id)}<span>${o.label}</span></button>`).join('')}</div>${['choosing','holding'].includes(this.stage)?'<button type="button" class="dialogue-replay" data-dialogue-target="replay" aria-label="再听一次">↻<span>再听</span></button>':''}<div class="dialogue-hands" aria-hidden="true"></div>`;
    root.addEventListener('pointerdown',e=>{const target=e.target.closest('[data-dialogue-target]');if(!target||target.disabled)return;e.preventDefault();if(target.dataset.dialogueTarget==='replay')this.replay();else this.choose(target.dataset.dialogueTarget);});
    document.body.append(root);this.drawHands();
  }
  finish(){if(!this.active)return;this.clear();this.onDone?.();}
  clear(){this.ticket++;if(this.active)this.voice?.cancel();this.active=false;this.paused=false;this.animal?.setSpeaking?.(false);this.root?.remove();this.root=null;this.measuredModel=null;this.placement=null;this.hands=[];this.inside=new Map();}
  toJSON(){return {active:this.active,paused:!!this.paused,topic:this.topic?.id,linked:!!this.selection?.linked,contentId:this.selection?.contentId||null,stage:this.stage,selected:this.selected,correct:this.correct,attempts:this.attempts,elapsed:this.elapsed,targets:this.targets().map(e=>{const r=e.getBoundingClientRect(),v=getViewport();return {id:e.dataset.dialogueTarget,x:(r.left+r.width/2-v.left)/v.width,y:(r.top+r.height/2-v.top)/v.height};})};}
}
