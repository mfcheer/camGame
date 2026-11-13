import {InteractionDemo} from './interactionDemo.js';
import * as THREE from 'three';
import {getViewport, getSafeInsets, getHudBottom} from './viewport.js';

export const FRIEND_PLAY = {
  cat:{reply:'橘子舒服地眯起眼啦',kind:'pet',title:'橘子想让你摸摸头',hint:'轻轻碰头上的光圈',colour:0xffc465},
  dog:{reply:'击掌成功！旺旺摇起尾巴',kind:'highfive',title:'旺旺想和你击掌',hint:'用食指碰一下小爪子',colour:0xffcf72},
  bunny:{reply:'击掌成功！萌萌开心地蹦一下',kind:'highfive',title:'萌萌举起了小爪子',hint:'碰一下，和萌萌击个掌',colour:0xffa6ba},
  frog:{reply:'呱呱跳过来啦，再碰一片荷叶',kind:'lilypad',title:'呱呱想跳到荷叶上',hint:'碰发光的荷叶，呱呱就会跳过去',colour:0x7bcf9a},
  dragon:{reply:'翼翼跟上你啦，继续带它飞',kind:'follow',title:'翼翼想跟着你飞',hint:'慢慢移动食指，带它飞一小段',colour:0x9ddfdd},
  goldenDragon:{reply:'小金跟上你啦，继续带它游',kind:'follow',title:'小金想跟着你游',hint:'慢慢移动食指，带它游一小段',colour:0xffd46e}
};
const clamp = THREE.MathUtils.clamp;
const ease = t => t*t*(3-2*t);

// A short, optional success interaction. It never changes score or rescue count.
export class RescueFriendPlay {
  constructor(scene, camera, animal, audio, onDone = () => {}) {
    Object.assign(this,{scene,camera,animal,audio,onDone,active:false});
    this.group=new THREE.Group();this.group.name='Rescue_Friend_Play';this.group.visible=false;scene.add(this.group);
    this.visualDemo=new InteractionDemo(this.group);
    this.helpedAnimals=new Set();
    this.marker=new THREE.Group();this.group.add(this.marker);
    this.ring=new THREE.Mesh(new THREE.RingGeometry(.78,1,48),new THREE.MeshBasicMaterial({color:0xffd46e,transparent:true,opacity:.85,depthWrite:false,side:THREE.DoubleSide}));
    const border=new THREE.Mesh(new THREE.RingGeometry(1,1.08,48),new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.95,depthWrite:false,side:THREE.DoubleSide}));
    const edge=new THREE.Mesh(new THREE.RingGeometry(1.08,1.14,48),new THREE.MeshBasicMaterial({color:0x395141,transparent:true,opacity:.55,depthWrite:false,side:THREE.DoubleSide}));
    this.marker.add(this.ring,border,edge);
    this.platform=new THREE.Mesh(new THREE.CylinderGeometry(1,1.05,.08,40),new THREE.MeshStandardMaterial({color:0xeadbb6,roughness:1}));
    this.group.add(this.platform);
    const leaf=new THREE.Shape();leaf.moveTo(0,0);leaf.lineTo(.55,.13);
    for(let i=1;i<=36;i++){const a=.25+i/36*(Math.PI*2-.5);leaf.lineTo(Math.cos(a)*.55,Math.sin(a)*.18);}leaf.lineTo(0,0);
    this.pads=[];
    for(let i=0;i<3;i++){
      const pad=new THREE.Mesh(new THREE.ShapeGeometry(leaf),new THREE.MeshStandardMaterial({color:i===1?0x79b36b:0x8bc080,roughness:1,side:THREE.DoubleSide}));
      this.group.add(pad);this.pads.push(pad);
    }
  }
  start(zones=[]) {
    this.clear();
    this.profile=FRIEND_PLAY[this.animal.animalId] || FRIEND_PLAY.bunny;
    this.firstVisit=!this.helpedAnimals.has(this.animal.animalId);
    Object.assign(this,{active:true,elapsed:0,lastAction:0,hits:0,cooldown:0,touchHeld:false,releaseSeconds:0,padIndex:1,nextPad:0,hopProgress:null,rotationGrace:.65,followTip:null,followAnchor:null,paused:false});
    this.zones=zones;
    this.animal.startFriendPlay();
    this.animal.updateFriendPose(0);
    this.animal.group.updateWorldMatrix(true,true);
    const box=new THREE.Box3().setFromObject(this.animal.model),scale=this.animal.animalGroup.scale.y || 1;
    this.localSize=box.getSize(new THREE.Vector3()).divideScalar(scale);
    // The model's y=0 is near its feet; retain the exact foot offset.
    this.localMinY=(box.min.y-this.animal.animalGroup.position.y)/scale;
    this.localTargetHeight=this.profile.kind==='lilypad'?0:(this.targetWorld().y-box.min.y)/scale;
    this.entryPosition=this.animal.animalGroup.position.clone();this.entryScale=scale;
    this.ring.material.color.setHex(this.profile.colour);
    this.group.visible=true;this.marker.visible=false;
    this.updateLayout(false);
    return this.profile;
  }
  updateLayout(instant=true) {
    if(!this.active)return;
    const {width:w,height:h}=getViewport(),safe=getSafeInsets();
    const vh=2*Math.tan(THREE.MathUtils.degToRad(this.camera.fov/2))*Math.abs(this.camera.position.z),vw=vh*this.camera.aspect;
    this.unit=vh/h;this.width=w;this.height=h;
    let floor;
    const top=Math.max(getHudBottom()+(h<300?46:78),safe.top+(h<300?80:110));
    floor=h-Math.max(safe.bottom+(h<300?30:62),h*.16);
    const available=Math.max(50,floor-top);
    const height=Math.min(240,h*.36,available*.88);
    const width=w*(this.profile.kind==='lilypad'?.42:.56);
    this.targetScale=Math.min(height/this.localSize.y,width/this.localSize.x)*this.unit;
    if(this.profile.kind!=='follow'){
      const zones=this.zones.filter(p=>p.comfortZone);
      const targetY=zones.length?zones.reduce((n,p)=>n+(p.comfortZone.minY+p.comfortZone.maxY)/2,0)/zones.length:(this.profile.kind==='lilypad'?.68:.6);
      const preferredFloor=targetY*h+this.localTargetHeight*this.targetScale/this.unit;
      floor=Math.min(floor,Math.max(top+height+12,preferredFloor));
    }
    this.floorY=(.5-floor/h)*vh;
    this.rootY=this.floorY-this.localMinY*this.targetScale;
    const center=this.zones.length?this.zones.reduce((v,p)=>v+((p.comfortZone?.minX??.25)+(p.comfortZone?.maxX??.75))/2,0)/this.zones.length:.5;
    this.centerX=(clamp(center,.4,.6)-.5)*vw;
    this.padSpan=vw*(h<300?.16:.19);
    this.followLimit=Math.max(0,vw*.46-this.localSize.x*this.targetScale*.5);
    this.followUp=Math.max(0,Math.min(h*.09,(available-height)*.6))*this.unit;
    this.followDown=Math.min(h*.035,18)*this.unit;
    const platformWidth=Math.max(.32,this.localSize.x*this.targetScale*.62);
    this.platform.scale.set(platformWidth,1,.38);
    this.platform.position.set(this.centerX,this.floorY-.045,0);
    this.platform.visible=this.profile.kind!=='lilypad';
    this.pads.forEach((pad,i)=>{pad.visible=this.profile.kind==='lilypad';pad.position.set(this.centerX+(i-1)*this.padSpan,this.floorY,.22);pad.scale.setScalar(Math.min(this.padSpan*1.25,110*this.unit));});
    this.rotationGrace=instant?.35:this.rotationGrace;
    if(instant){this.entryPosition.set(this.centerX,this.rootY,.06);this.entryScale=this.targetScale;this.placeAnimal(1,0);this.refreshMarker();}
  }
  padPosition(index){return new THREE.Vector3(this.centerX+(index-1)*this.padSpan,this.rootY,.06);}
  placeAnimal(entrance,dt) {
    const a=this.animal;
    const desired=new THREE.Vector3(this.centerX,this.rootY,.06);
    if(this.profile.kind==='lilypad'){
      desired.copy(this.padPosition(this.padIndex));
      if(this.hopProgress!==null){
        this.hopProgress=Math.min(1,this.hopProgress+dt/.7);
        desired.lerp(this.padPosition(this.nextPad),ease(this.hopProgress));
        desired.y+=Math.sin(this.hopProgress*Math.PI)*(a.reducedMotion?.035:.24);
        if(this.hopProgress>=1){this.padIndex=this.nextPad;this.nextPad=(this.padIndex+2)%3;this.hopProgress=null;this.touchHeld=false;}
      }
    }else if(this.profile.kind==='follow'&&(this.followTip||this.demoFollow)){
      const {x,y}=this.followTip||this.demoFollow;
      const vh=this.unit*this.height,vw=vh*this.camera.aspect;
      desired.x=clamp((x-.5)*vw,-this.followLimit,this.followLimit);
      desired.y=this.rootY+clamp((.62-y)*vh,-this.followDown,this.followUp);
    }
    const start=this.entryPosition.clone().lerp(desired,ease(entrance));
    if(this.profile.kind==='follow'&&entrance>=1&&dt>0)a.animalGroup.position.lerp(start,1-Math.exp(-dt*5));
    else a.animalGroup.position.copy(start);
    a.animalGroup.scale.setScalar(THREE.MathUtils.lerp(this.entryScale,this.targetScale,ease(entrance)));
    a.currentX=a.animalGroup.position.x;a.currentY=a.animalGroup.position.y;
    a.friendFloor=this.floorY;
  }
  targetWorld() {
    const a=this.animal;
    a.group.updateWorldMatrix(true,true);
    if(this.profile.kind==='lilypad')return this.pads[this.nextPad].getWorldPosition(new THREE.Vector3()).add(new THREE.Vector3(0,.045,.08));
    if(this.profile.kind==='highfive'){
      const name=a.animalId==='dog'?'Cream_Forepaw':'Forepaw';
      let paw; a.rightArm.traverse(node=>{if(node.isMesh&&node.name.startsWith(name))paw=node;});
      return (paw || a.rightArm).getWorldPosition(new THREE.Vector3()).add(new THREE.Vector3(0,0,.10));
    }
    return a.headGroup.localToWorld(new THREE.Vector3(0,.23,.26));
  }
  refreshMarker() {
    if(!this.active)return;
    this.target=this.targetWorld();this.marker.position.copy(this.target);this.marker.lookAt(this.camera.position);
    const radiusPx=clamp(Math.min(this.width,this.height)*.065,24,34);
    const radius=radiusPx*this.unit;
    this.marker.scale.setScalar(radius*(1+Math.sin(this.elapsed*3)*.06));
    this.marker.visible=this.elapsed>.55&&this.hopProgress===null;
    const p=this.target.clone().project(this.camera);
    this.targetScreen={x:(p.x+1)*.5*this.width,y:(1-p.y)*.5*this.height,radius:Math.max(38,radiusPx*1.4)};
    this.pads.forEach((p,i)=>p.material.color.setHex(i===this.nextPad?0xa9d989:0x78b77a));
  }
  respond(tip) {
    this.hits++;this.lastAction=this.elapsed;this.cooldown=.8;
    this.helpedAnimals.add(this.animal.animalId);
    this.visualDemo.hide();this.demoFollow=null;
    this.animal.friendReact(this.hits);
    this.audio?.playAnimalSound?.(this.animal.animalId,'energy');
    this.onAction?.(this.profile);
    if(this.profile.kind==='lilypad')this.hopProgress=0;
    if(this.profile.kind==='follow')this.followAnchor={x:tip.px,y:tip.py};
  }
  update(dt,tips=[]) {
    if(!this.active||this.paused)return;
    this.elapsed+=dt;this.rotationGrace=Math.max(0,this.rotationGrace-dt);this.cooldown=Math.max(0,this.cooldown-dt);
    const entrance=clamp(this.elapsed/.8,0,1);
    const wanted=this.hits===0||this.elapsed-this.lastAction>3.5;
    this.demoFollow=this.profile.kind==='follow' && wanted && !tips.length
      ? {x:.5+Math.sin(this.elapsed/2.8*Math.PI*2)*.13,y:.62-Math.sin(this.elapsed/2.8*Math.PI)*.015}
      : null;
    this.placeAnimal(entrance,dt);
    this.refreshMarker();
    if(entrance>=1&&this.rotationGrace<=0){
      const valid=tips.filter(t=>Number.isFinite(t.px)&&Number.isFinite(t.py));
      if(this.profile.kind==='follow'){
        const tip=valid[0];
        if(tip){
          this.followTip={x:tip.x,y:tip.y};
          this.animal.playerFocus={x:tip.x,y:tip.y};
          if(this.cooldown<=0&&(!this.followAnchor||Math.hypot(tip.px-this.followAnchor.x,tip.py-this.followAnchor.y)>40))this.respond(tip);
        }else this.followTip=null;
      }else{
        const t=this.targetScreen;
        const tip=valid.find(p=>Math.hypot(p.px-t.x,p.py-t.y)<=t.radius);
        const outside=!valid.some(p=>Math.hypot(p.px-t.x,p.py-t.y)<=t.radius*1.2);
        this.releaseSeconds=outside?this.releaseSeconds+dt:0;
        if(this.releaseSeconds>=.14)this.touchHeld=false;
        const stroke=this.profile.kind==='pet'&&tip&&this.strokeAnchor&&Math.hypot(tip.px-this.strokeAnchor.x,tip.py-this.strokeAnchor.y)>18;
        if(tip&&this.hopProgress===null&&this.cooldown<=0&&(!this.touchHeld||stroke)){
          this.respond(tip);this.touchHeld=true;this.strokeAnchor={x:tip.px,y:tip.py};
        }
      }
    }
    const near=tips.some(t=>Math.hypot(t.px-this.targetScreen.x,t.py-this.targetScreen.y)<this.targetScreen.radius*1.3);
    if(wanted && entrance>=1 && !near && !(this.profile.kind==='follow'&&tips.length)){
      const target=this.target.clone();
      if(this.profile.kind==='follow'){
        target.x=this.centerX;
        if(this.height>=400)target.y+=78*this.unit;
        else target.x+=this.width*.23*this.unit;
      }
      this.visualDemo.update({elapsed:this.elapsed,kind:this.profile.kind,target,unit:this.unit,width:this.width,height:this.height,reducedMotion:this.animal.reducedMotion});
    }else this.visualDemo.hide();
    // Give a new friend two clear demonstrations before an idle farewell.
    const idleEnd=this.firstVisit && this.hits===0?12:8;
    if(this.elapsed>=20||(this.elapsed>=idleEnd&&this.elapsed-this.lastAction>=4.5))this.finish();
  }
  setPaused(paused){this.paused=paused;this.group.visible=this.active&&!paused;}
  finish(){if(!this.active)return;this.clear();this.onDone();}
  clear(){this.visualDemo?.hide();this.demoFollow=null;this.active=false;this.group.visible=false;this.followTip=null;this.touchHeld=false;this.strokeAnchor=null;this.targetScreen=null;}
  toJSON(){return this.active?{kind:this.profile.kind,hits:this.hits,target:this.targetScreen,demo:!!this.visualDemo.group.visible,elapsed:Math.round(this.elapsed*10)/10}:null;}
}
