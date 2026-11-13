import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {BubbleManager} from '../src/bubbleManager.js';
import {RescueAnimal} from '../src/rescueAnimal.js';
import {Game} from '../src/main.js';
import {photoComposition} from '../src/polaroidManager.js';
const camera=()=>{const c=new T.PerspectiveCamera(48,1280/720,.1,100);c.position.z=7.5;c.updateMatrixWorld();return c;};
function manager(type='normal') {const bm=new BubbleManager(new T.Scene(),camera(),{},null,{animalId:'frog',targetEnergy:8});bm.setPlayerMode('coop');bm.createBubble(3,type);bm.activeBubble.spawnElapsed=.5;bm.activeBubble.updateCount=1;bm.activeBubble.group.scale.setScalar(1);bm.activeBubble.group.updateWorldMatrix(true,true);return bm;}
function tip(bm,side){const b=bm.activeBubble,p=(side?b[side+'HeartGroup'].getWorldPosition(new T.Vector3()):b.group.position.clone()).project(bm.camera);return{x:(p.x+1)/2,y:(1-p.y)/2,side:'left',isIndexTip:true,observed:true};}
test('one player can pop either decorative heart with one touch',()=>{for(const id of [1,2])for(const side of ['left','right']){const bm=manager('coop_heart');assert.equal(bm.checkHandCollisions([{id,hands:[tip(bm,side)]}]),true);assert.equal(bm.activeBubble,null);}});
test('decorative hearts reject stale, predicted and protected contacts',()=>{for(const mode of ['stale','predicted','protected']){const bm=manager('coop_heart');const h=tip(bm,'left');if(mode==='stale'){h.source='hand-21';bm.handsAgeSeconds=.2;}if(mode==='predicted')h.observed=false;if(mode==='protected')bm.activeBubble.spawnElapsed=.1;assert.equal(bm.checkHandCollisions([{id:1,hands:[h]}]),false);assert.ok(bm.activeBubble,mode);}});
test('the picture between the two hearts also pops with one touch',()=>{const bm=manager('coop_heart');assert.equal(bm.checkHandCollisions([{id:1,hands:[tip(bm)]}]),true);assert.equal(bm.activeBubble,null);});
test('two simultaneous heart contacts cannot score twice',()=>{const bm=manager('coop_heart');const players=[{id:1,hands:[tip(bm,'left')]},{id:2,hands:[tip(bm,'right')]}];assert.equal(bm.checkHandCollisions(players),true);assert.equal(bm.checkHandCollisions(players),false);assert.equal(bm.completedBubbleCount,1);});
test('ordinary cooperative target rejects another player',()=>{const bm=manager();const id=bm.activeBubble.ownerId;assert.equal(bm.checkHandCollisions([{id:id===1?2:1,hands:[tip(bm)]}]),false);assert.ok(bm.activeBubble);});
test('energy progression and target order remain independent',()=>{const bm=manager();bm.clear();let energy=0;const seen=[];for(let n=0;n<4;n++){bm.comboCount=0;bm.createBubble(bm.completedBubbleCount);seen.push(bm.activeBubble.type);energy+=bm.activeBubble.energyValue;bm.popBubble(.5,.5);}assert.deepEqual(seen,['normal','normal','jelly','coop_heart']);assert.equal(energy,6);assert.equal(bm.completedBubbleCount,4);bm.clear();assert.equal(bm.completedBubbleCount,0);});
test('resize keeps one-touch jelly and rejects old pointer contact',()=>{const bm=manager('jelly');bm.updateLayout();assert.equal(bm.activeBubble.hitsNeeded,1);assert.equal(bm.activeBubble.type,'jelly');assert.equal(bm.checkHandCollisions([{id:bm.activeBubble.ownerId,hands:[tip(bm)]}]),false);});
test('resize preserves cooperative readiness and merge progress',()=>{const bm=manager('coop_heart');Object.assign(bm.activeBubble,{leftTouched:true,leftTouchTime:150,merging:true,mergeProgress:.42});bm.updateLayout();assert.equal(bm.activeBubble.leftTouched,true);assert.equal(bm.activeBubble.leftTouchTime,150);assert.equal(bm.activeBubble.merging,true);assert.equal(bm.activeBubble.mergeProgress,.42);});
test('camera pixels and AR points share one photo transform in portrait and landscape',()=>{for(const [w,h]of [[390,844],[844,390],[568,260],[1280,720]]){const r=photoComposition(1920,1080,w,h);for(const x of [.4,.5,.6]){const mirroredViewportX=w-(x*1920-r.sx)/r.sw*w;const cameraX=r.dx+(1-(x*1920-r.sx)/r.sw)*r.dw;const arX=r.dx+mirroredViewportX/w*r.dw;assert.ok(Math.abs(cameraX-arX)<1e-9);}assert.ok(r.dx>=0&&r.dy>=0&&r.dw<=568.0001&&r.dh<=520.0001);}});
test('six animals follow energy, then return attention to player, reset cleanly',()=>{for(const id of ['bunny','cat','dog','frog','dragon','goldenDragon']){const a=new RescueAnimal(new T.Scene(),camera(),id);a.setPlayerFocus([{face:{x:.75,y:.3}}]);a.setAttentionTarget(new T.Vector3(-1,1,0),new T.Vector3(1,1,0));a.update(.016,0);assert.equal(a.attentionPhase,'energy');a.setEnergy(1);a.setAttentionTarget(null,null);a.update(.016,.016);assert.equal(a.attentionPhase,'thanks');for(let n=0;n<180;n++)a.update(.016,n*.016);assert.equal(a.attentionPhase,'player');assert.ok(Math.abs(a.headGroup.rotation.x)<.4);a.reset();assert.equal(a.attentionFocus,null);}});
test('photo countdown freezes on pause and captures immediately after render',()=>{const calls=[];const g=Object.assign(Object.create(Game.prototype),{state:'CELEBRATING',hasLiveCamera:()=>true,lastPlayers:[{id:1}],lastPlayersReceivedAt:performance.now(),photoRemaining:.1,sceneManager:{update(){},render(){calls.push('render');}},captureVictoryPhoto(){calls.push('capture');this.photoCapturePending=false;this.photoRemaining=null;}});g.updateFrame(.05);assert.deepEqual(calls,['render']);g.state='PAUSED';g.updateFrame(1);assert.equal(g.photoRemaining,.05);g.state='CELEBRATING';g.updateFrame(.1);assert.deepEqual(calls.slice(-2),['render','capture']);});
test('absence cancels auto continuation rather than starting an empty round',()=>{const g=Object.assign(Object.create(Game.prototype),{state:'CELEBRATING',resultVisible:true,autoNextDeadline:performance.now()+12000,lastPlayers:[],photoRemaining:null,uiManager:{setAutoNextCountdown(){}},sceneManager:{update(){},render(){}}});g.updateFrame(1.1);assert.equal(g.autoNextDeadline,0);});

test('holding a protected heart needs a fresh approach after the spawn grace',()=>{const bm=manager('coop_heart');const h=tip(bm,'left');bm.activeBubble.spawnElapsed=.1;assert.equal(bm.checkHandCollisions([{id:1,hands:[h]}]),false);bm.activeBubble.spawnElapsed=.6;assert.equal(bm.checkHandCollisions([{id:1,hands:[h]}]),false);bm.checkHandCollisions([{id:1,hands:[{...h,x:0,y:0}]}]);assert.equal(bm.checkHandCollisions([{id:1,hands:[h]}]),true);});
test('jelly pops once immediately; a held pointer cannot score again',()=>{const bm=manager('jelly'),id=bm.activeBubble.ownerId,h=tip(bm);assert.equal(bm.checkHandCollisions([{id,hands:[h]}]),true);for(let n=0;n<10;n++)assert.equal(bm.checkHandCollisions([{id,hands:[h]}]),false);assert.equal(bm.completedBubbleCount,1);});

test('no camera or demo mode cannot enter the photo countdown', () => {
  for (const isDemoMode of [false, true]) {
    const calls = [];
    const g = Object.assign(Object.create(Game.prototype), {
      state: 'CELEBRATING', isDemoMode, photoRemaining: null,
      rescueAnimal: {state: 'ESCAPED'}, currentPolaroidDataUrl: 'old-photo',
      uiManager: {setPhotoCountdown(v) { calls.push(['countdown', v]); }, setPolaroidImage(v) { calls.push(['image', v]); }, showVictory(v) { calls.push(['result', v]); }},
      celebrationAccessories: {clear() { calls.push(['clear']); }}
    });
    g.showVictoryWhenReady();
    assert.equal(g.resultVisible, true);
    assert.equal(g.photoRemaining, null);
    assert.equal(g.currentPolaroidDataUrl, null);
    assert.ok(calls.some(c => c[0] === 'result' && c[1].hasPhoto === false));
    assert.ok(!calls.some(c => c[0] === 'countdown' && typeof c[1] === 'number'));
  }
});

test('photo eligibility requires a playing frame and an enabled live video track', () => {
  const track = {readyState: 'live', enabled: true};
  const video = {readyState: 2, videoWidth: 1280, paused: false, srcObject: {getVideoTracks: () => [track]}};
  const g = Object.assign(Object.create(Game.prototype), {videoElement: video, isDemoMode: false});
  assert.equal(g.hasLiveCamera(), true);
  track.readyState = 'ended'; assert.equal(g.hasLiveCamera(), false);
  track.readyState = 'live'; track.enabled = false; assert.equal(g.hasLiveCamera(), false);
  track.enabled = true; video.paused = true; assert.equal(g.hasLiveCamera(), false);
  video.paused = false; g.isDemoMode = true; assert.equal(g.hasLiveCamera(), false);
});

test('camera stopping during photo preparation returns to a clean rescue result', () => {
  const g = Object.assign(Object.create(Game.prototype), {
    state: 'CELEBRATING', photoRemaining: 1, photoCapturePending: true,
    currentPolaroidDataUrl: 'old-photo', uiManager: {setPhotoCountdown() {}, setPolaroidImage() {}, showVictory({hasPhoto}) {assert.equal(hasPhoto, false);}}
  });
  g.updateFrame(.1);
  assert.equal(g.photoRemaining, null);
  assert.equal(g.photoCapturePending, false);
  assert.equal(g.currentPolaroidDataUrl, null);
  assert.equal(g.resultVisible, true);
});
