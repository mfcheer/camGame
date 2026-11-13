import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {RescueAnimal} from '../src/rescueAnimal.js';
import {RescueFriendPlay} from '../src/rescueFriendPlay.js';
import {BubbleManager} from '../src/bubbleManager.js';
import {Game} from '../src/main.js';
const camera=(w=390,h=844)=>{const c=new T.PerspectiveCamera(48,w/h,.1,100);c.position.z=7.5;c.updateMatrixWorld();return c;};
function fixture(id='cat'){
 const scene=new T.Scene(),c=camera(),a=new RescueAnimal(scene,c,id);let done=0,sounds=0;
 a.setEnergy(a.targetEnergy);
 const f=new RescueFriendPlay(scene,c,a,{playAnimalSound(){sounds++;}},()=>{done++;});f.start();
 return {a,f,c,scene,get done(){return done;},get sounds(){return sounds;}};
}
function step(x,seconds,tips=[]){for(let t=0;t<seconds-1e-6;t+=.02){x.a.update(.02,t);x.f.update(.02,tips);}}
function tip(x,dx=0){const t=x.f.targetScreen;return {key:'1_left',playerId:1,x:(t.x+dx)/x.f.width,y:t.y/x.f.height,px:t.x+dx,py:t.y};}

test('all friends are free, visible and rope-free without losing their rescued energy',()=>{
 for(const id of ['bunny','cat','dog','frog','dragon','goldenDragon']){const x=fixture(id);step(x,1);
  assert.equal(x.a.state,'FRIEND');assert.equal(x.a.energyLevel,x.a.targetEnergy);assert.equal(x.a.postGroup.visible,false);assert.equal(x.a.ropesGroup.visible,false);assert.equal(x.a.animalGroup.visible,true);assert.ok(x.f.marker.visible);
 }
});

test('petting and high fives react, holding still does not repeat, withdrawing enables another turn',()=>{
 for(const id of ['cat','dog','bunny']){const x=fixture(id);step(x,1);step(x,.1,[tip(x)]);assert.equal(x.f.hits,1,id);assert.ok(x.a.friendResponse>0);const same=tip(x);step(x,.9,[same]);assert.equal(x.f.hits,1,id);
  step(x,.2,[]);step(x,.1,[tip(x)]);assert.equal(x.f.hits,2,id);assert.equal(x.sounds,2);assert.equal(x.a.energyLevel,x.a.targetEnergy);
 }
});

test('cat accepts a small stroke without requiring a full withdrawal',()=>{const x=fixture('cat');step(x,1);const h=tip(x);step(x,.1,[h]);step(x,.85,[h]);step(x,.1,[{...h,px:h.px+23,x:h.x+23/x.f.width}]);assert.equal(x.f.hits,2);});

test('frog jumps to the touched leaf and offers a different next leaf',()=>{const x=fixture('frog');step(x,1);const before=x.a.currentX,target=x.f.nextPad;step(x,.1,[tip(x)]);assert.notEqual(x.f.hopProgress,null);step(x,.8);assert.equal(x.f.padIndex,target);assert.notEqual(x.a.currentX,before);assert.notEqual(x.f.nextPad,target);assert.equal(x.f.hits,1);});

test('both dragons follow movement; a stationary finger does not keep retriggering sounds',()=>{
 for(const id of ['dragon','goldenDragon']){const x=fixture(id);step(x,1);const left={x:.3,y:.6,px:x.f.width*.3,py:x.f.height*.6};step(x,1,[left]);const first=x.a.currentX,hits=x.f.hits;step(x,1,[left]);assert.equal(x.f.hits,hits);
  step(x,1,[{...left,x:.7,px:x.f.width*.7}]);assert.ok(x.a.currentX>first);assert.ok(x.f.hits>hits);assert.equal(x.a.energyLevel,x.a.targetEnergy);
 }
});

test('the existing tip validator rejects stale/predicted/non-index points for friend play',()=>{const x=fixture();step(x,1);const b=new BubbleManager(x.scene,x.c,{},null,x.a),h=tip(x);
 for(const hand of [{...h,source:'hand-21'},{...h,observed:false},{...h,isIndexTip:false}]){
  b.handsAgeSeconds=.3;const tips=b.getInteractionTips([{id:1,hands:[hand]}],x.f.width,x.f.height);assert.equal(tips.length,0);step(x,.1,tips);
 }
 assert.equal(x.f.hits,0);b.clear();
});

test('pause freezes interaction time, response pose and automatic finish',()=>{const x=fixture('dog');step(x,1);step(x,.1,[tip(x)]);const time=x.f.elapsed,p=x.a.rightArm.rotation.z;
 x.a.setPaused(true);x.f.setPaused(true);step(x,10);assert.equal(x.f.elapsed,time);assert.equal(x.a.rightArm.rotation.z,p);assert.equal(x.done,0);assert.equal(x.f.group.visible,false);
 x.a.setPaused(false);x.f.setPaused(false);step(x,.1);assert.ok(x.f.elapsed>time);
});

test('idle finishes naturally; repeated skip finishes only once; farewell still reaches its exit',()=>{const x=fixture('cat');step(x,12.1);assert.equal(x.done,1);x.f.finish();assert.equal(x.done,1);
 x.a.startEscape();x.a.update(4.2,4.2);assert.equal(x.a.state,'ESCAPED');x.a.reset();assert.equal(x.a.state,'TRAPPED');assert.equal(x.a.postGroup.visible,true);assert.equal(x.a.model.position.y,0);
});

test('active play is bounded to twenty seconds and clearing never invokes farewell',()=>{const x=fixture('dragon');for(let i=0;i<1050;i++){x.a.update(.02,i*.02);x.f.update(.02,[{x:i%2?.3:.7,y:.6,px:i%2?100:280,py:400}]);}assert.equal(x.done,1);const y=fixture();y.f.clear();step(y,30);assert.equal(y.done,0);assert.equal(y.f.active,false);});

test('rotating keeps responses and leaf progression, and repositions the marker safely',()=>{
 const original=globalThis.window;
 try{const x=fixture('frog');step(x,1);step(x,.1,[tip(x)]);step(x,.8);const hits=x.f.hits,pad=x.f.padIndex,time=x.f.elapsed;
  for(const [w,h]of [[844,390],[320,568],[568,260]]){globalThis.window={innerWidth:w,innerHeight:h};x.c.aspect=w/h;x.c.updateProjectionMatrix();x.a.updateLayout(w,h,x.c);x.f.updateLayout();step(x,.4);assert.equal(x.f.hits,hits);assert.equal(x.f.padIndex,pad);assert.ok(x.f.elapsed>=time);const t=x.f.targetScreen;assert.ok(t.x>=0&&t.x<=w&&t.y>=0&&t.y<=h);}
 }finally{if(original===undefined)delete globalThis.window;else globalThis.window=original;}
});

test('friend phase blocks the result card until farewell and resume does not start a result timer',()=>{
 let shown=0;
 const g=Object.assign(Object.create(Game.prototype),{state:'CELEBRATING',friendInteraction:{active:true,setPaused(){},profile:{}},uiManager:{showVictory(){shown++;},showFriendPlay(){}},celebrationRemainingMs:0});
 g.showVictoryWhenReady();assert.equal(shown,0);assert.equal(g.waitingForEscape,undefined);
 g.prePauseState='CELEBRATING';g.state='PAUSED';g.handleResume();assert.equal(g.state,'CELEBRATING');assert.equal(g.celebrationTimer,undefined);assert.equal(shown,0);
});


test('interaction targets use the detected comfortable vertical reach',()=>{
 const original=globalThis.window;
 try{globalThis.window={innerWidth:390,innerHeight:844};
  for(const id of ['cat','dog','bunny','frog']){
   const x=fixture(id);x.f.start([{id:1,comfortZone:{minX:.25,maxX:.75,minY:.3,maxY:.6}}]);step(x,1);
   const y=x.f.targetScreen.y/844;assert.ok(y>=.3&&y<=.61,`${id} target ${y} outside comfortable reach`);
  }
 }finally{if(original===undefined)delete globalThis.window;else globalThis.window=original;}
});

test('friend models and touch guides fit small portrait and short landscape screens',()=>{
 const original=globalThis.window;
 try{for(const [w,h]of [[320,568],[390,844],[844,390],[568,260]]){
  globalThis.window={innerWidth:w,innerHeight:h};
  for(const id of ['cat','dog','bunny','frog','dragon','goldenDragon']){
   const scene=new T.Scene(),c=camera(w,h),a=new RescueAnimal(scene,c,id),f=new RescueFriendPlay(scene,c,a,{});f.start();
   for(let i=0;i<55;i++){a.update(.02,i*.02);f.update(.02,[]);}
   a.group.updateWorldMatrix(true,true);
   a.model.traverseVisible(o=>{if(!o.isMesh)return;const attr=o.geometry.attributes.position;
    for(let j=0;j<attr.count;j+=16){const p=new T.Vector3().fromBufferAttribute(attr,j).applyMatrix4(o.matrixWorld).project(c);assert.ok(Math.abs(p.x)<=1.001&&Math.abs(p.y)<=1.001,`${id} model clipped ${w}x${h}`);}
   });
   const t=f.targetScreen;assert.ok(t.x>=t.radius*.6&&t.x<=w-t.radius*.6&&t.y>=t.radius*.6&&t.y<=h-t.radius*.6,`${id} guide clipped ${w}x${h}`);
  }
 }}finally{if(original===undefined)delete globalThis.window;else globalThis.window=original;}
});
