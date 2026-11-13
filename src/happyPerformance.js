import * as THREE from 'three';
import {getViewport,getSafeInsets,getHudBottom} from './viewport.js';

const clamp=THREE.MathUtils.clamp;
const ease=t=>t*t*(3-2*t);
const REST=.3;

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
  {id:'tailChase',dur:1.6,animals:['dog'],fn:(a,t,m)=>{
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
];
const SIGNATURE={bunny:'earWiggle',cat:'earWiggle',dog:'tailChase',frog:'croak',dragon:'barrelRoll',goldenDragon:'swimS'};

// 结算后的"开心小演出"：动物自己走到台前随机表演，孩子和家长可以休息。
// 无输入、无计分、无引导；每个动作开始播一声该动物的 happy 音效。
export class HappyPerformance {
  constructor(scene,camera,animal,audio,onDone=()=>{}) {
    Object.assign(this,{scene,camera,animal,audio,onDone,active:false,paused:false});
    this.group=new THREE.Group();this.group.name='Happy_Performance';this.group.visible=false;scene.add(this.group);
    this.platform=new THREE.Mesh(new THREE.CylinderGeometry(1,1.05,.08,40),new THREE.MeshStandardMaterial({color:0xeadbb6,roughness:1}));
    this.group.add(this.platform);
    this.plan=null;this.actionIdx=-1;
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
    // 4-5 个动作：必含一个该动物的招牌动作，其余从通用动作里不重复随机抽取，顺序随机。
    const id=this.animal.animalId;
    const sig=ACTIONS.find(x=>x.id===SIGNATURE[id])||ACTIONS[0];
    const generics=ACTIONS.filter(x=>!x.animals&&!Object.is(x,sig));
    for(let i=generics.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[generics[i],generics[j]]=[generics[j],generics[i]];}
    const total=4+(Math.random()<.4?1:0);
    const plan=generics.slice(0,total-1);
    plan.splice(Math.floor(Math.random()*(plan.length+1)),0,sig);
    return plan;
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
    this.actionIdx=i;this.actionElapsed=0;this.resting=false;
    const act=this.plan[i];
    const m=this.animal.reducedMotion?.25:1;
    this.animal.actionPoseFn=t=>act.fn(this.animal,t,m);
    this.animal.actionPoseT=0;
    this.audio?.playAnimalSound?.(this.animal.animalId,'happy');
    this.animal.friendReact(i+1);
  }
  update(dt) {
    if(!this.active||this.paused)return;
    this.elapsed+=dt;
    const entrance=clamp(this.elapsed/.8,0,1);
    this.placeAnimal(entrance);
    if(entrance<1)return;
    if(this.actionIdx<0){this.beginAction(0);return;}
    if(this.resting){
      this.animal.actionPoseFn=null;
      this.restElapsed-=dt;
      if(this.restElapsed<=0)this.beginAction(this.actionIdx+1);
      return;
    }
    const act=this.plan[this.actionIdx];
    this.actionElapsed+=dt;
    const t=this.actionElapsed/act.dur;
    if(t>=1){
      act.reset?.(this.animal);
      this.animal.actionPoseFn=null;
      this.resting=true;this.restElapsed=REST;this.actionElapsed=0;
    }else this.animal.actionPoseT=t;
  }
  setPaused(paused){this.paused=paused;this.group.visible=this.active&&!paused;}
  currentAction(){return this.plan&&this.actionIdx>=0&&this.actionIdx<this.plan.length?this.plan[this.actionIdx].id:null;}
  toJSON(){return this.active?{actions:this.plan?this.plan.map(p=>p.id):[],current:this.currentAction(),elapsed:Math.round(this.elapsed*10)/10}:null;}
  finish(){if(!this.active)return;this.clear();this.onDone();}
  clear() {
    const act=this.plan&&this.actionIdx>=0&&this.actionIdx<this.plan.length?this.plan[this.actionIdx]:null;
    act?.reset?.(this.animal);
    this.animal.actionPoseFn=null;this.animal.actionPoseT=0;
    this.active=false;this.paused=false;this.group.visible=false;this.plan=null;this.actionIdx=-1;
  }
}
