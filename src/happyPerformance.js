import * as THREE from 'three';
import {getViewport,getSafeInsets,getHudBottom} from './viewport.js';

const clamp=THREE.MathUtils.clamp;
const ease=t=>t*t*(3-2*t);
const REST=.25;
const SPEED=.8; // 整体播放速度：动作时长按此缩放，单局演出总时长控制在约 5-8 秒。

// 开心小演出动作库：fn(a,t,m) 每帧在 FRIEND 基础姿态之上覆写关节；t 为 0..1 进度，m 为减动幅缩放。
// fn 内所有曲线在 t=1 时归零，rest 阶段无需残留清理（reset 兜底旋转类覆写）。
const ACTIONS=[
  {id:'hop3',dur:1.8,fn:(a,t,m)=>{
    const hop=Math.abs(Math.sin(t*Math.PI*3));
    a.animalGroup.position.y+=hop*.15*m;
    a.leftLeg.rotation.x=a.rightLeg.rotation.x=Math.sin(t*Math.PI*6)*.5*m;
    a.leftEarGroup.rotation.x=a.rightEarGroup.rotation.x=-Math.sin(t*Math.PI*6)*.3*m;
    a.leftArm.rotation.z=-Math.sin(t*Math.PI*6)*.4*m;a.rightArm.rotation.z=Math.sin(t*Math.PI*6)*.4*m;
  }},
  {id:'spin',dur:1.6,reset:a=>{a.animalGroup.rotation.y=0;a.animalGroup.rotation.z=0;},fn:(a,t,m)=>{
    a.animalGroup.rotation.y=t*Math.PI*2;
    a.animalGroup.rotation.z=Math.sin(t*Math.PI*4)*.035*m;
    a.tailGroup.rotation.z=Math.sin(t*Math.PI*6)*.28*m;
    a.headGroup.rotation.z=Math.sin(t*Math.PI*4)*.08*m;
  }},
  {id:'bow',dur:1.5,fn:(a,t,m)=>{
    const bow=Math.sin(t*Math.PI);
    a.bodyMesh.rotation.x=.42*bow*m;
    a.headGroup.rotation.x=.30*bow*m;
    a.leftArm.rotation.z=-.30*bow*m;a.rightArm.rotation.z=.30*bow*m;
  }},
  {id:'sway',dur:2.0,reset:a=>{a.animalGroup.rotation.z=0;},fn:(a,t,m)=>{
    const s=Math.sin(t*Math.PI*4);
    a.animalGroup.rotation.z=s*.085*m;
    a.leftArm.rotation.z=-.55-s*.30*m;a.rightArm.rotation.z=.55+s*.30*m;
    a.headGroup.rotation.z=-s*.08*m;
    a.animalGroup.position.y+=Math.abs(Math.sin(t*Math.PI*4))*.02*m;
  }},
  {id:'laugh',dur:1.6,reset:a=>{a.animalGroup.rotation.z=0;},fn:(a,t,m)=>{
    a.model.rotation.x=-.10*Math.sin(t*Math.PI)*m;
    a.model.position.y=Math.abs(Math.sin(t*Math.PI*5))*.02*m;
    a.animalGroup.rotation.z=Math.sin(t*Math.PI*6)*.03*m;
  }},
  {id:'earWiggle',dur:1.4,animals:['bunny','cat'],fn:(a,t,m)=>{
    const w=Math.sin(t*Math.PI*7);
    a.leftEarGroup.rotation.z=.13+w*.26*m;
    a.rightEarGroup.rotation.z=-.13-w*.26*m;
    a.headGroup.rotation.z=w*.06*m;
  }},
  {id:'tailChase',dur:1.6,animals:['dog','wolf'],fn:(a,t,m)=>{
    a.tailGroup.rotation.y=Math.sin(t*Math.PI*10)*.8*m;
    a.animalGroup.position.y+=Math.abs(Math.sin(t*Math.PI*4))*.05*m;
    a.headGroup.rotation.z=Math.sin(t*Math.PI*5)*.10*m;
    a.bodyMesh.rotation.x=.06*m;
  }},
  {id:'croak',dur:1.7,animals:['frog'],reset:a=>{a.bodyMesh.scale.set(1,1,1);},fn:(a,t,m)=>{
    const crouch=Math.max(0,Math.sin(t*Math.PI*2));
    a.bodyMesh.scale.set(1+crouch*.08*m,1-crouch*.12*m,1+crouch*.08*m);
    a.leftLeg.rotation.x=a.rightLeg.rotation.x=-crouch*.5*m;
    a.animalGroup.position.y+=Math.abs(Math.sin(t*Math.PI*2))*.06*m;
  }},
  {id:'barrelRoll',dur:1.8,animals:['dragon'],reset:a=>{a.model.rotation.z=0;},fn:(a,t,m)=>{
    a.animalGroup.position.y+=Math.sin(t*Math.PI)*.22*m;
    a.model.rotation.z=t*Math.PI*2;
    a.tailGroup.rotation.y=Math.sin(t*Math.PI*8)*.3*m;
  }},
  {id:'swimS',dur:1.8,animals:['goldenDragon'],reset:a=>{a.bodyMesh.rotation.z=0;},fn:(a,t,m)=>{
    a.bodyMesh.rotation.z=Math.sin(t*Math.PI*3)*.07*m;
    a.tailGroup.rotation.y=Math.sin(t*Math.PI*3-.8)*.35*m;
    a.animalGroup.position.y+=Math.sin(t*Math.PI*3)*.045*m;
    for(const [name,sign] of [['Whisker_L',-1],['Whisker_R',1]]){const w=a.model.getObjectByName(name);if(w)w.rotation.y=sign*Math.sin(t*Math.PI*3)*.10*m;}
  }},
  {id:'wave',dur:1.6,fn:(a,t,m)=>{
    const raise=Math.sin(t*Math.PI);
    a.leftArm.rotation.set(-raise*.4,0,-1.55*raise*m+Math.sin(t*Math.PI*5)*.22*raise*m);
    a.headGroup.rotation.z=Math.sin(t*Math.PI*2)*.08*raise*m;
  }},
  {id:'jellyWobble',dur:1.5,reset:a=>{a.bodyMesh.scale.set(1,1,1);},fn:(a,t,m)=>{
    const w=Math.sin(t*Math.PI*6)*Math.sin(t*Math.PI)*m;
    a.bodyMesh.scale.set(1+w*.07,1-w*.09,1+w*.07);
    a.animalGroup.position.y+=Math.abs(Math.sin(t*Math.PI*6))*.015*m;
  }},
  {id:'starJump',dur:1.8,fn:(a,t,m)=>{
    const k=Math.abs(Math.sin(t*Math.PI*2))*m;
    a.leftArm.rotation.z=-.9*k;a.rightArm.rotation.z=.9*k;
    a.leftLeg.rotation.x=a.rightLeg.rotation.x=-.4*k;
    a.leftEarGroup.rotation.x=a.rightEarGroup.rotation.x=-.3*k;
    a.animalGroup.position.y+=k*.10;
  }},
  {id:'nodDance',dur:1.6,fn:(a,t,m)=>{
    const env=Math.sin(t*Math.PI),n=Math.sin(t*Math.PI*6)*m;
    a.headGroup.rotation.x=.22*n*env;
    a.animalGroup.position.y+=Math.abs(n)*.025;
    a.leftArm.rotation.z=-n*.18*env;a.rightArm.rotation.z=n*.18*env;
  }},
  {id:'skyHop',dur:1.5,animals:['bunny'],fn:(a,t,m)=>{
    const j=Math.sin(t*Math.PI)*m;
    a.animalGroup.position.y+=j*.30;
    a.leftEarGroup.rotation.z=.1+j*.45;a.rightEarGroup.rotation.z=-.1-j*.45;
    a.leftEarGroup.rotation.x=a.rightEarGroup.rotation.x=-j*.2;
    a.leftLeg.rotation.x=a.rightLeg.rotation.x=Math.sin(t*Math.PI*2)*.6*m;
    a.leftArm.rotation.z=-j*.5;a.rightArm.rotation.z=j*.5;
  }},
  {id:'tailSway',dur:1.6,animals:['cat'],fn:(a,t,m)=>{
    a.tailGroup.rotation.z=Math.sin(t*Math.PI*4)*.35*m;
    a.tailGroup.rotation.y=Math.sin(t*Math.PI*4+1.2)*.18*m;
    a.headGroup.rotation.z=Math.sin(t*Math.PI*2)*.16*m;
    a.bodyMesh.rotation.y=Math.sin(t*Math.PI*2)*.04*m;
  }},
  {id:'headTilt',dur:1.4,animals:['dog','wolf'],fn:(a,t,m)=>{
    const tilt=Math.sin(t*Math.PI*2)*m;
    a.headGroup.rotation.z=tilt*.28;
    a.leftEarGroup.rotation.z=.12+tilt*.22;a.rightEarGroup.rotation.z=-.12-tilt*.22;
    a.tailGroup.rotation.y=Math.sin(t*Math.PI*8)*.5*m;
    a.animalGroup.position.y+=Math.abs(Math.sin(t*Math.PI*4))*.02*m;
  }},
  {id:'leapFrog',dur:1.7,animals:['frog'],reset:a=>{a.bodyMesh.scale.set(1,1,1);},fn:(a,t,m)=>{
    const crouch=t<.3?Math.sin(t/.3*Math.PI)*m:0;
    const jump=t>=.3?Math.sin((t-.3)/.7*Math.PI)*.28*m:0;
    a.bodyMesh.scale.set(1+crouch*.15,1-crouch*.2,1+crouch*.15);
    a.leftLeg.rotation.x=a.rightLeg.rotation.x=-crouch*.9;
    a.animalGroup.position.y+=jump;
    a.leftArm.rotation.z=-jump*1.2;a.rightArm.rotation.z=jump*1.2;
    a.headGroup.rotation.x=-jump*.5;
  }},
  {id:'wingFlutter',dur:1.5,animals:['dragon'],fn:(a,t,m)=>{
    const env=Math.sin(t*Math.PI)*m;
    for(const [name,sign] of [['Wing_L',-1],['Wing_R',1]]){const wing=a.model.getObjectByName(name);if(wing)wing.rotation.y=sign*(.3+Math.sin(t*Math.PI*9)*.35*env);}
    a.animalGroup.position.y+=env*.16;
    a.tailGroup.rotation.y=Math.sin(t*Math.PI*6)*.25*m;
  }},
  {id:'cloudHover',dur:1.8,animals:['goldenDragon'],fn:(a,t,m)=>{
    const rise=Math.sin(t*Math.PI)*m;
    a.animalGroup.position.y+=rise*.18;
    a.bodyMesh.rotation.z=Math.sin(t*Math.PI*4)*.05*m;
    a.tailGroup.rotation.y=Math.sin(t*Math.PI*4-.8)*.3*m;
    for(const [name,sign] of [['Whisker_L',-1],['Whisker_R',1]]){const w=a.model.getObjectByName(name);if(w)w.rotation.y=sign*Math.sin(t*Math.PI*4)*.14*m;}
    a.headGroup.rotation.z=Math.sin(t*Math.PI*2)*.06*m;
  }},
  {id:'finaleBow',dur:1.8,fn:(a,t,m)=>{
    const bow=Math.sin(t*Math.PI)*m;
    a.bodyMesh.rotation.x=.5*bow;
    a.headGroup.rotation.x=.38*bow;
    a.leftArm.rotation.z=-.45*bow;a.rightArm.rotation.z=.45*bow;
    a.animalGroup.position.y+=Math.abs(Math.sin(t*Math.PI*3))*.02*m;
  }},
  {id:'raceRev',dur:1.5,animals:['mcqueen'],fn:(a,t,m)=>{const s=Math.sin(t*Math.PI*6)*m;a.bodyMesh.rotation.z=s*.04;a.headGroup.rotation.z=-s*.035;for(const p of [a.leftArm,a.rightArm,a.leftLeg,a.rightLeg])p.rotation.x=t*Math.PI*4;}},
  {id:'raceSway',dur:1.5,animals:['mcqueen'],fn:(a,t,m)=>{const s=Math.sin(t*Math.PI*4)*m;a.model.rotation.z=s*.08;a.headGroup.rotation.z=-s*.05;}},
  {id:'bearHug',dur:1.5,animals:['teddy'],fn:(a,t,m)=>{const s=Math.sin(t*Math.PI)*m;a.leftArm.rotation.z=-s*.9;a.rightArm.rotation.z=s*.9;a.headGroup.rotation.z=s*.12;}},
  {id:'bearSway',dur:1.6,animals:['teddy'],fn:(a,t,m)=>{const s=Math.sin(t*Math.PI*4)*m;a.bodyMesh.rotation.z=s*.12;a.headGroup.rotation.z=-s*.1;}},
];
const SIGNATURES={bunny:['earWiggle','skyHop'],cat:['earWiggle','tailSway'],dog:['tailChase','headTilt'],frog:['croak','leapFrog'],dragon:['barrelRoll','wingFlutter'],goldenDragon:['swimS','cloudHover'],mcqueen:['raceRev','raceSway'],wolf:['tailChase','headTilt'],teddy:['bearHug','bearSway']};
const FINALE=ACTIONS.find(x=>x.id==='finaleBow');

// 结算后的"开心小演出"：动物自己走到台前随机表演，孩子和家长可以休息。
// 无输入、无计分、无引导；每个动作开始播一声该动物的 happy 音效。
export class HappyPerformance {
  constructor(scene,camera,animal,audio,onDone=()=>{}) {
    Object.assign(this,{scene,camera,animal,audio,onDone,active:false,paused:false});
    this.group=new THREE.Group();this.group.name='Happy_Performance';this.group.visible=false;scene.add(this.group);
    this.platform=new THREE.Mesh(new THREE.CylinderGeometry(1,1.05,.08,40),new THREE.MeshStandardMaterial({color:0xeadbb6,roughness:1}));
    this.group.add(this.platform);
    // Stage spotlight: barely lit during the show, blooms at the finale bow.
    this.spot=new THREE.SpotLight(0xfff1cf,0,12,.6,.7,1.1);this.spot.castShadow=false;
    this.spot.position.set(0,2.4,1.5);this.group.add(this.spot,this.spot.target);this.spot.target.position.set(0,0,0);
    this.plan=null;this.actionIdx=-1;this.confetti=[];
  }
  start() {
    this.clear();
    this.active=true;this.elapsed=0;this.paused=false;this.actionIdx=-1;this.actionElapsed=0;this.resting=false;this.restElapsed=0;
    const a=this.animal;
    a.startFriendPlay();
    a.updateFriendPose(0);
    a.group.updateWorldMatrix(true,true);
    const box=new THREE.Box3().setFromObject(a.model),scale=a.animalGroup.scale.y||1;
    this.localSize=box.getSize(new THREE.Vector3()).divideScalar(scale);
    this.localMinY=(box.min.y-a.animalGroup.position.y)/scale;
    this.entryPosition=a.animalGroup.position.clone();this.entryScale=scale;
    this.group.visible=true;
    this.updateLayout(false);
    this.plan=this.buildPlan();
    return this.plan.map(p=>p.id);
  }
  buildPlan() {
    // 2-3 个动作（×0.8 播放速度，单局约 5-8 秒）：从该动物的两个招牌动作里随机选一个出场，
    // 其余从通用动作池不重复随机抽取，顺序随机；结尾固定接谢幕彩蛋。与上一局的节目单保证开场动作不同、整单不完全相同。
    const id=this.animal.animalId;
    const pool=ACTIONS.filter(x=>x.animals?.includes(id)||( !x.animals&&x.id!=='finaleBow'));
    const sigs=pool.filter(x=>x.animals);
    const sig=sigs[Math.floor(Math.random()*sigs.length)];
    const others=pool.filter(x=>!Object.is(x,sig));
    for(let i=others.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[others[i],others[j]]=[others[j],others[i]];}
    const total=2+(Math.random()<.3?1:0);
    const plan=others.slice(0,total-1);
    plan.splice(Math.floor(Math.random()*(plan.length+1)),0,sig);
    if(this.lastPlan){
      if(plan[0].id===this.lastPlan[0]){const j=1+Math.floor(Math.random()*(plan.length-1));[plan[0],plan[j]]=[plan[j],plan[0]];}
      if(plan.map(p=>p.id).join()===this.lastPlan.join()){[plan[plan.length-1],plan[0]]=[plan[0],plan[plan.length-1]];}
    }
    this.lastPlan=plan.map(p=>p.id);
    return plan.concat([FINALE]);
  }
  updateLayout(instant=true) {
    if(!this.active)return;
    const {width:w,height:h}=getViewport(),safe=getSafeInsets();
    const vh=2*Math.tan(THREE.MathUtils.degToRad(this.camera.fov/2))*Math.abs(this.camera.position.z),vw=vh*this.camera.aspect;
    this.unit=vh/h;this.width=w;this.height=h;
    const top=Math.max(getHudBottom()+(h<300?46:78),safe.top+(h<300?80:110));
    const floor=h-Math.max(safe.bottom+(h<300?30:62),h*.16);
    const available=Math.max(50,floor-top);
    const height=Math.min(240,h*.36,available*.88);
    const width=w*.5;
    this.targetScale=Math.min(height/this.localSize.y,width/this.localSize.x)*this.unit;
    this.floorY=(.5-floor/h)*vh;
    this.rootY=this.floorY-this.localMinY*this.targetScale;
    this.centerX=0;
    const platformWidth=Math.max(.32,this.localSize.x*this.targetScale*.62);
    this.platform.scale.set(platformWidth,1,.38);
    this.platform.position.set(this.centerX,this.floorY-.045,0);
    this.spot.position.set(this.centerX,this.floorY+2.4,1.5);
    this.spot.target.position.set(this.centerX,this.floorY,0);
    if(instant){this.entryPosition.set(this.centerX,this.rootY,.06);this.entryScale=this.targetScale;this.placeAnimal(1);}
  }
  placeAnimal(entrance) {
    const a=this.animal;
    const desired=new THREE.Vector3(this.centerX,this.rootY,.06);
    const start=this.entryPosition.clone().lerp(desired,ease(entrance));
    a.animalGroup.position.copy(start);
    a.animalGroup.scale.setScalar(THREE.MathUtils.lerp(this.entryScale,this.targetScale,ease(entrance)));
    a.currentX=start.x;a.currentY=start.y;
    a.friendFloor=this.floorY;
  }
  beginAction(i) {
    if(i>=this.plan.length){this.finish();return;}
    this.actionIdx=i;this.actionElapsed=0;this.resting=false;this.sparkled=false;
    const act=this.plan[i];
    const m=this.animal.reducedMotion?.25:1;
    this.animal.actionPoseFn=t=>act.fn(this.animal,t,m);
    this.animal.actionPoseT=0;
    this.animal.performanceGlow=act.id==='finaleBow'?'finale':'star';
    this.audio?.playAnimalSound?.(this.animal.animalId,'happy');
    if(act.id==='finaleBow')this.spawnConfetti();
    this.animal.friendReact(act.id==='finaleBow'?3:i+1);
  }
  spawnConfetti() {
    if(this.animal.reducedMotion)return;
    const colors=[0xe8735c,0xf2b64b,0x7bb37a,0x6ea8d8,0xd77fa9];
    const spread=Math.max(.55,this.localSize.x*this.targetScale*.85);
    if(!this.confettiGeo)this.confettiGeo=new THREE.PlaneGeometry(.05,.034);
    for(let i=0;i<28;i++){
      const material=new THREE.MeshBasicMaterial({color:colors[i%5],side:THREE.DoubleSide,transparent:true,opacity:.95,depthWrite:false});
      const mesh=new THREE.Mesh(this.confettiGeo,material);
      mesh.position.set(this.centerX+(Math.random()-.5)*spread,this.floorY+1.05+Math.random()*.55,(Math.random()-.5)*.35);
      mesh.rotation.set(Math.random()*Math.PI*2,Math.random()*Math.PI*2,Math.random()*Math.PI*2);
      this.group.add(mesh);
      this.confetti.push({mesh,vy:.5+Math.random()*.35,sw:Math.random()*Math.PI*2,sway:.8+Math.random()*.8,spin:(Math.random()-.5)*7,age:0});
    }
  }
  updateConfetti(dt) {
    for(let i=this.confetti.length-1;i>=0;i--){
      const c=this.confetti[i];c.age+=dt;c.sw+=dt*c.sway;
      c.mesh.position.y-=c.vy*dt;
      c.mesh.position.x+=Math.sin(c.sw)*.28*dt;
      c.mesh.rotation.x+=c.spin*dt;c.mesh.rotation.z+=c.spin*.6*dt;
      c.mesh.material.opacity=Math.max(0,.95-c.age*.45);
      if(c.age>2.2||c.mesh.position.y<this.floorY-.02){this.group.remove(c.mesh);c.mesh.material.dispose();this.confetti.splice(i,1);}
    }
  }
  update(dt) {
    if(!this.active||this.paused)return;
    this.elapsed+=dt;
    this.updateConfetti(dt);
    const entrance=clamp(this.elapsed/.8,0,1);
    this.placeAnimal(entrance);
    if(entrance<1)return;
    if(this.actionIdx<0){this.beginAction(0);return;}
    if(this.resting){
      this.animal.actionPoseFn=null;
      this.restElapsed-=dt;
      if(this.restElapsed<=0)this.beginAction(this.actionIdx+1);
      if(this.active)this.rampSpotlight(dt,false);
      return;
    }
    const act=this.plan[this.actionIdx];
    this.actionElapsed+=dt;
    const t=this.actionElapsed/(act.dur*SPEED);
    const finale=act.id==='finaleBow';
    if(finale&&!this.sparkled&&t>.45){
      this.sparkled=true;
      if(!this.animal.reducedMotion)for(let k=0;k<6;k++)this.animal.spawnParticle(this.animal.getTargetPosition());
    }
    this.rampSpotlight(dt,finale);
    if(t>=1){
      act.reset?.(this.animal);
      this.animal.actionPoseFn=null;
      this.resting=true;this.restElapsed=REST;this.actionElapsed=0;
    }else this.animal.actionPoseT=t;
  }
  rampSpotlight(dt,finale) {
    const target=finale?1.25:(this.animal.reducedMotion?.35:.5);
    this.spot.intensity+=(target-this.spot.intensity)*(1-Math.exp(-dt*4));
  }
  setPaused(paused){this.paused=paused;this.group.visible=this.active&&!paused;}
  currentAction(){return this.plan&&this.actionIdx>=0&&this.actionIdx<this.plan.length?this.plan[this.actionIdx].id:null;}
  toJSON(){return this.active?{actions:this.plan?this.plan.map(p=>p.id):[],current:this.currentAction(),elapsed:Math.round(this.elapsed*10)/10}:null;}
  finish(){if(!this.active)return;this.clear();this.onDone();}
  clear() {
    const act=this.plan&&this.actionIdx>=0&&this.actionIdx<this.plan.length?this.plan[this.actionIdx]:null;
    act?.reset?.(this.animal);
    this.animal.actionPoseFn=null;this.animal.actionPoseT=0;this.animal.performanceGlow=null;
    for(const c of this.confetti){this.group.remove(c.mesh);c.mesh.material.dispose();}
    this.confetti=[];this.spot.intensity=0;
    this.active=false;this.paused=false;this.group.visible=false;this.plan=null;this.actionIdx=-1;
  }
}
