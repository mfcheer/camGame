import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {ANIMAL_PLAY_STYLES, animalTargetOffset} from '../src/animalPlayStyles.js';
import {BubbleManager} from '../src/bubbleManager.js';
import {Game} from '../src/main.js';
import {GAME_CONFIG, PLAYABLE_ANIMALS} from '../src/config.js';
const camera=(w=1280,h=720)=>{const c=new T.PerspectiveCamera(48,w/h,.1,100);c.position.z=7.5;c.updateMatrixWorld();return c;};
function manager(id='cat',index=1,type='normal') {
  const b=new BubbleManager(new T.Scene(),camera(),{},null,{animalId:id,targetEnergy:GAME_CONFIG.animals[id].targetBubbles});
  b.createBubble(index,type);return b;
}
function step(b,seconds) {for(let t=0;t<seconds-1e-6;t+=.02)b.update(.02,t);}

test('six distinct motion signatures and an accessible stationary first target',()=>{
  const signatures=PLAYABLE_ANIMALS.map(id=>{
    const style=ANIMAL_PLAY_STYLES[id];
    for(let t=0;t<8;t+=.25)assert.deepEqual(animalTargetOffset(style,t,0),{x:0,y:0});
    return JSON.stringify([1,2.5,3.2,4.8].map(t=>animalTargetOffset(style,t,1)));
  });
  assert.equal(new Set(signatures).size,6);
});

test('frog movement includes a long planted pause followed by a small hop',()=>{
  const s=ANIMAL_PLAY_STYLES.frog;
  assert.deepEqual(animalTargetOffset(s,1,1),{x:0,y:0});
  assert.deepEqual(animalTargetOffset(s,2.4,1),{x:0,y:0});
  assert.ok(animalTargetOffset(s,3.2,1).y < -15);
});

test('signature special bubbles remain reachable even with an active combo',()=>{
  for(const id of PLAYABLE_ANIMALS){const b=manager(id),s=ANIMAL_PLAY_STYLES[id];b.comboCount=4;
    for(const i of s.jellyAt)assert.equal(b.determineBubbleType(i),'jelly',id);
    for(const i of s.rainbowAt)assert.equal(b.determineBubbleType(i),'rainbow',id);
    b.setPlayerMode('coop');if(GAME_CONFIG.animals[id].targetBubbles>=6)assert.equal(b.determineBubbleType(3),'coop_heart',id);
    b.clear();
  }
});

test('every signature target occurs before rescue through normal energy progression',()=>{
  for(const id of PLAYABLE_ANIMALS){const b=manager(id);b.clear();const seen=[];let energy=0;
    while(energy<GAME_CONFIG.animals[id].targetBubbles){b.comboCount=0;b.createBubble(b.completedBubbleCount);seen.push(b.activeBubble.type);energy+=b.activeBubble.energyValue;b.popBubble(.5,.5);}
    const style=ANIMAL_PLAY_STYLES[id];if(style.jellyAt.length)assert.ok(seen.includes('jelly'),id);
    if(style.rainbowAt.length)assert.ok(seen.includes('rainbow'),id);
    b.clear();
  }
});

test('bunny targets are larger and concentrated; puppy has a more forgiving rhythm',()=>{
  const rabbit=manager('bunny'),cat=manager('cat'),dog=manager('dog');
  assert.ok(rabbit.activeBubble.baseRadius>cat.activeBubble.baseRadius);
  const bounds=rabbit.activeBubble.playBounds;
  const visibleWidth=2*Math.tan(T.MathUtils.degToRad(rabbit.camera.fov/2))*7.5*rabbit.camera.aspect;
  assert.ok(bounds.maxX-bounds.minX<visibleWidth*.3);
  assert.ok(dog.comboTimeoutMs>cat.comboTimeoutMs);
  assert.ok(dog.getPlayStyle().cooldownMs<cat.getPlayStyle().cooldownMs);
  rabbit.clear();cat.clear();dog.clear();
});

test('approach holds each moving target at its current location',()=>{
  for(const id of PLAYABLE_ANIMALS){const b=manager(id);step(b,2.5);b.isNearHand=true;
    const before=b.activeBubble.group.position.clone(),clock=b.activeBubble.motionElapsed;
    step(b,1);assert.ok(before.distanceTo(b.activeBubble.group.position)<1e-9,id);
    assert.equal(b.activeBubble.motionElapsed,clock,id);b.clear();
  }
});

test('first jelly hit stops its motion while a player withdraws and returns',()=>{
  const b=manager('cat',3,'jelly');step(b,1.5);b.activeBubble.hitsReceived=1;
  const p=b.activeBubble.group.position.clone();step(b,1);assert.ok(p.distanceTo(b.activeBubble.group.position)<1e-9);b.clear();
});

test('difficulty eases gradually on a stalled target, then clears on restart',()=>{
  const b=manager('dragon');step(b,4);assert.equal(b.roundEase,0);step(b,3);
  assert.ok(b.roundEase>0&&b.roundEase<.5);const before=b.roundEase;
  b.activeBubble.playableElapsed=1;b.popBubble(.5,.5);assert.equal(b.roundEase,before);
  b.clear();assert.equal(b.roundEase,0);assert.equal(b.comfortableHits,0);
});

test('rotation preserves motion and effort clocks and the applied assistance',()=>{
  const b=manager('goldenDragon');step(b,6.5);const old=b.activeBubble,elapsed=old.motionElapsed,ease=b.roundEase,effort=old.playableElapsed;
  b.updateLayout();assert.equal(b.activeBubble.motionElapsed,elapsed);assert.equal(b.activeBubble.playableElapsed,effort);assert.equal(b.roundEase,ease);b.clear();
});

test('moving targets, help scale and jelly rebound remain visible in five viewports',()=>{
  const original=globalThis.window;
  try {for(const [w,h]of [[320,568],[390,844],[844,390],[568,260],[1280,720]]){
    globalThis.window={innerWidth:w,innerHeight:h};
    for(const id of PLAYABLE_ANIMALS)for(const type of ['normal','jelly','rainbow']){
      const b=new BubbleManager(new T.Scene(),camera(w,h),{},null,{animalId:id,targetEnergy:12});b.createBubble(2,type);
      // Exaggerate anchor locations, checking the complete rendered geometry.
      b.activeBubble.basePos.x=100;b.activeBubble.basePos.y=-100;
      for(let i=0;i<115;i++){
        if(type==='jelly'&&i===108)b.activeBubble.squashTimer=.32;
        b.update(.06,i*.06);
        if(i%9!==0&&i<108)continue;
        b.activeBubble.group.updateWorldMatrix(true,true);
        b.activeBubble.group.traverse(o=>{if(!o.isMesh||!o.visible)return;const a=o.geometry.attributes.position;
          for(let j=0;j<a.count;j+=8){const p=new T.Vector3().fromBufferAttribute(a,j).applyMatrix4(o.matrixWorld).project(b.camera);
            assert.ok(Math.abs(p.x)<=1.001&&Math.abs(p.y)<=1.001,`${id} ${type} ${w}x${h}: ${p.x},${p.y}`);
          }
        });
      }
      b.clear();
    }
  }}finally{if(original===undefined)delete globalThis.window;else globalThis.window=original;}
});


test('a narrow detected comfort zone never creates inverted movement bounds',()=>{
  const original=globalThis.window;
  try{
    globalThis.window={innerWidth:390,innerHeight:844};
    const b=new BubbleManager(new T.Scene(),camera(390,844),{},null,{animalId:'cat',targetEnergy:8});
    b.setPlayerComfortZones([{id:1,comfortZone:{minX:.25,maxX:.26,minY:.3,maxY:.7}}]);
    b.createBubble(1);const bounds=b.activeBubble.playBounds;
    assert.ok(bounds.minX<=bounds.maxX&&bounds.minY<=bounds.maxY);
    step(b,3);assert.ok(Number.isFinite(b.activeBubble.group.position.x));b.clear();
  }finally{if(original===undefined)delete globalThis.window;else globalThis.window=original;}
});

test('manual pause freezes the moving target and its difficulty clock',()=>{
  const b=manager('cat');const g=Object.assign(Object.create(Game.prototype),{state:'PLAYING',bubbleManager:b});
  g.updateFrame(.06);const elapsed=b.activeBubble.motionElapsed,effort=b.activeBubble.playableElapsed,p=b.activeBubble.group.position.clone();
  g.state='PAUSED';g.updateFrame(4);assert.equal(b.activeBubble.motionElapsed,elapsed);assert.equal(b.activeBubble.playableElapsed,effort);assert.ok(p.equals(b.activeBubble.group.position));
  g.state='PLAYING';g.updateFrame(.06);assert.ok(b.activeBubble.motionElapsed>elapsed);b.clear();
});


test('coop demo cursor can withdraw across the midline and hit its jelly again',()=>{
  const b=manager('frog',2,'jelly');b.setPlayerMode('coop');b.activeBubble.ownerId=2;
  const p=b.activeBubble.group.position.clone().project(b.camera);
  const h={x:(p.x+1)/2,y:(1-p.y)/2,source:'demo',side:'demo_pointer',isIndexTip:true};
  assert.equal(b.checkHandCollisions([{id:2,hands:[h]}]),false);assert.equal(b.activeBubble.hitsReceived,1);
  b.checkHandCollisions([{id:1,hands:[{...h,x:0,y:0,source:'hand-21'}]}]);
  assert.equal(b.checkHandCollisions([{id:2,hands:[h]}]),false,'another real player cannot release the owner’s held finger');
  b.checkHandCollisions([{id:1,hands:[{...h,x:0,y:0}]}]);
  assert.equal(b.checkHandCollisions([{id:2,hands:[h]}]),true);b.clear();
});
