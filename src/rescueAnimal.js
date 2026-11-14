import {getViewport,getSafeInsets} from './viewport.js';
import * as THREE from 'three';
import {assetUrl} from './assetUrl.js';
import {createExpressionRig,resetExpressionRig,updateExpressionRig} from './animalExpressions.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { createRabbitModel, getRabbitRig } from './rabbitModel.js';
import { createCatModel } from './catModel.js';
import { createFrogModel } from './frogModel.js';
import { createGoldenDragonModel } from './goldenDragonModel.js';
import { createDragonModel } from './dragonModel.js';
import { createDogModel } from './dogModel.js';
import { createTeddyModel,createWolfModel,createMcqueenModel,createChaseModel,createJettModel,createPeppaModel,createThomasModel } from './newFriendsModel.js';
import { GAME_CONFIG } from './config.js';

export const ANIMAL_MODELS={bunny:createRabbitModel,cat:createCatModel,frog:createFrogModel,dog:createDogModel,dragon:createDragonModel,goldenDragon:createGoldenDragonModel,mcqueen:createMcqueenModel,wolf:createWolfModel,teddy:createTeddyModel,chase:createChaseModel,jett:createJettModel,peppa:createPeppaModel,thomas:createThomasModel};
const smooth = t => t*t*(3-2*t);
const clamp = THREE.MathUtils.clamp;

/** Named-pivot character rig, local GLB asset and grounded, staged rabbit hops. */
export class RescueAnimal {
  constructor(scene,camera,animalId='bunny') {
    this.scene=scene;this.camera=camera;this.group=new THREE.Group();
    this.postGroup=new THREE.Group();this.animalGroup=new THREE.Group();this.ropesGroup=new THREE.Group();
    this.group.add(this.postGroup,this.animalGroup);scene.add(this.group);
    this.ropeCoils=[];this.particles=[];
    this.state='TRAPPED';this.energyLevel=0;this.idleTime=0;this.escapeElapsed=0;this.escapeDuration=4.1;
    this.hopTimer=0;this.blinkTimer=0;this.isPaused=false;this.dustClock=0;
    this.receiveTimer=0;this.receivePower=1;this.comboMoveTimer=0;this.recoilTimer=0;
    this.moodWorried=0;this.moodExcited=0;this.onRopeSnap=null;
    this.reducedMotion=typeof window!=='undefined'&&window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    this.createPostAndRopes();
    this.setAnimal(animalId,false);
    this.createContactShadow();
    const w=typeof window!=='undefined'?getViewport().width:1280,h=typeof window!=='undefined'?getViewport().height:720;
    this.updateLayout(w,h,camera);
  }
  setAnimal(id,reset=true) {
    this.animalId=ANIMAL_MODELS[id]?id:'bunny';this.profile=GAME_CONFIG.animals[this.animalId];
    this.targetEnergy=this.profile.targetBubbles;
    const request=this.assetRequest=(this.assetRequest||0)+1;
    this.installModel(ANIMAL_MODELS[this.animalId]());this.assetStatus='native';
    this.createSpringFollowers();
    if(reset){this.reset();if(typeof window!=='undefined')this.updateLayout(getViewport().width,getViewport().height,this.camera);}
    if(typeof window!=='undefined'&&typeof window.fetch==='function') {
      this.assetStatus='loading';
      new GLTFLoader().load(assetUrl(`models/${this.profile.asset}.glb`),gltf=>{
        if(request!==this.assetRequest){gltf.scene.traverse(o=>{if(o.isMesh){o.geometry.dispose();for(const m of Array.isArray(o.material)?o.material:[o.material])m.dispose();}});return;}
        this.installModel(gltf.scene);this.assetStatus='glb';
      },undefined,error=>{if(request===this.assetRequest){this.assetStatus='fallback';console.warn('Animal GLB unavailable; using native rig.',error.message);}});
    }
  }
  installModel(model) {
    if(this.model) {
      this.animalGroup.remove(this.model);
      const geometries=new Set(),materials=new Set();
      this.model.traverse(o=>{if(o.isMesh){geometries.add(o.geometry);for(const m of Array.isArray(o.material)?o.material:[o.material])materials.add(m);}});
      geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());
    }
    this.model=model;model.rotation.y=-.16;this.animalGroup.add(model);
    Object.assign(this,getRabbitRig(model));
    this.expressionRig=createExpressionRig(model,this.animalId);this.emotion='content';
    this.furMaterials=new Set();model.traverse(o=>{
      if(o.isMesh){o.castShadow=true;o.receiveShadow=true;for(const m of Array.isArray(o.material)?o.material:[o.material])this.furMaterials.add(m);}
    });
    this.eyeBases=[this.leftEye.position.clone(),this.rightEye.position.clone()];
    this.happyMouth=model.getObjectByName('Happy_Mouth');this.happyTongue=model.getObjectByName('Happy_Tongue');
    if(this.happyMouth)this.happyMouth.visible=false;if(this.happyTongue)this.happyTongue.visible=false;
    this.bowMaterials=[];this.bowtieGroup.traverse(o=>{if(o.isMesh)this.bowMaterials.push(o.material);});
  }
  createSpringFollowers() {
    // Floppy parts chase their pose target with a slightly underdamped spring: head turns,
    // ears/tails arrive a beat later with a little overshoot. Reduced motion goes direct.
    const parts={bunny:[['leftEarGroup','z'],['rightEarGroup','z'],['leftEarGroup','x'],['rightEarGroup','x']],
      cat:[['leftEarGroup','z'],['rightEarGroup','z'],['tailGroup','z'],['tailGroup','y']],
      dog:[['leftEarGroup','x'],['rightEarGroup','x'],['tailGroup','y'],['tailGroup','z']],
      wolf:[['leftEarGroup','z'],['rightEarGroup','z'],['tailGroup','y']],chase:[['leftEarGroup','z'],['rightEarGroup','z'],['tailGroup','y']],teddy:[['leftEarGroup','z'],['rightEarGroup','z']],mcqueen:[]};
    this.springs=(parts[this.animalId]||[]).map(([name,axis])=>({
      get:()=>this[name].rotation[axis],apply:v=>this[name].rotation[axis]=v,pos:0,vel:0}));
    for(const s of this.springs)s.pos=s.get();
  }
  updateSprings(dt) {
    if(this.reducedMotion||!this.springs)return;
    const h=Math.min(dt,.033);
    for(const s of this.springs){
      // Semi-implicit Euler toward the pose value set this frame; underdamped on purpose.
      s.vel+=(s.get()-s.pos)*140*h-s.vel*14*h;
      s.pos+=s.vel*h;
      s.apply(s.pos);
    }
  }
  createContactShadow() {
    const size=32,data=new Uint8Array(size*size*4);
    for(let y=0;y<size;y++)for(let x=0;x<size;x++) {
      const d=Math.hypot((x-size/2)/(size/2),(y-size/2)/(size/2));const i=(x+y*size)*4;
      data[i]=67;data[i+1]=60;data[i+2]=43;data[i+3]=Math.round(Math.pow(Math.max(0,1-d),1.8)*125);
    }
    const tex=new THREE.DataTexture(data,size,size);tex.needsUpdate=true;
    this.contactShadow=new THREE.Mesh(new THREE.PlaneGeometry(.95,.65),new THREE.MeshBasicMaterial({map:tex,transparent:true,depthWrite:false}));
    this.contactShadow.rotation.x=-Math.PI/2;this.group.add(this.contactShadow);
  }
  createPostAndRopes() {
    const wood=new THREE.MeshStandardMaterial({color:0x96724f,roughness:.96});
    this.postMesh=new THREE.Mesh(new THREE.CylinderGeometry(.105,.15,.85,14),wood);
    this.postMesh.position.set(-.23,.425,-.22);this.postMesh.rotation.z=.08;this.postMesh.castShadow=true;this.postGroup.add(this.postMesh);
    const cap=new THREE.Mesh(new THREE.CylinderGeometry(.108,.108,.012,16),new THREE.MeshStandardMaterial({color:0xc6a77b,roughness:1}));
    cap.position.set(-.26,.851,-.22);cap.rotation.z=.08;this.postGroup.add(cap);
    for(let i=0;i<3;i++) {
      const ring=new THREE.Mesh(new THREE.TorusGeometry(.025+i*.025,.002,4,24),new THREE.MeshStandardMaterial({color:0x9b7d56}));
      ring.rotation.x=-Math.PI/2;ring.position.set(-.26,.859,-.22);this.postGroup.add(ring);
    }
    for(let i=0;i<4;i++) {
      const g=new THREE.Group(),pts=[];const baseY=.30+i*.078;
      for(let j=0;j<40;j++) {
        const a=j/40*Math.PI*2;pts.push(new THREE.Vector3(Math.cos(a)*.35,baseY+Math.sin(a)*.018,Math.sin(a)*.40-.025));
      }
      const ropeMat=new THREE.MeshStandardMaterial({color:0xc3a77d,roughness:1,transparent:true,opacity:1});
      const mesh=new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts,true),48,.016,6,true),ropeMat);
      mesh.castShadow=true;g.add(mesh);
      const knot=new THREE.Mesh(new THREE.TorusGeometry(.028,.011,6,12),ropeMat);knot.position.set(.26,baseY,.17);g.add(knot);
      this.ropesGroup.add(g);this.ropeCoils.push({group:g,mesh,knot,baseY,loosened:false,falling:false,fallTimer:0});
    }
    this.postGroup.add(this.ropesGroup);
  }
  updateLayout(w,h,camera) {
    if(!camera)return;
    const vh=2*Math.tan(THREE.MathUtils.degToRad(camera.fov/2))*Math.abs(camera.position.z);
    const vw=vh*w/h;
    const oldStart=this.startX,oldEnd=this.endX;
    const progress=oldEnd>oldStart?clamp((this.currentX-oldStart)/(oldEnd-oldStart),0,1):0;
    this.modelScale=({bunny:.88,cat:1.02,frog:1.23,dog:1.02,dragon:.94,goldenDragon:.94,mcqueen:1.10,chase:1.02,jett:1.02,peppa:1.02,thomas:1.05,wolf:1.02,teddy:1.02})[this.animalId];
    this.groundY=-vh/2+.45+getSafeInsets().bottom*vh/h;
    this.startX=-vw/2+Math.min(1.5,vw*.24)+getSafeInsets().left*vh/h;
    this.endX=vw/2-1.0-getSafeInsets().right*vh/h;
    this.currentX=this.state==='TRAPPED'?this.startX:THREE.MathUtils.lerp(this.startX,this.endX,progress);
    this.currentY=this.groundY;
    this.postGroup.position.set(this.startX,this.groundY,.03);this.postGroup.scale.setScalar(this.modelScale);
    this.animalGroup.position.set(this.currentX,this.currentY,.06);this.animalGroup.scale.setScalar(this.modelScale);
    this.contactShadow?.position.set(this.currentX,this.groundY+.012,.09);
  }
  getTargetPosition() {
    this.group.updateMatrixWorld(true);
    return this.bowtieGroup.getWorldPosition(new THREE.Vector3());
  }
  setEnergy(score) {
    this.energyLevel=score;
    // 里程碑绳圈先进"松弛下垂"段，短暂预告后才崩断坠落。
    for(let i=0;i<this.ropeCoils.length;i++)if(score>=Math.ceil((i+1)*this.targetEnergy/5)&&!this.ropeCoils[i].loosened){
      const c=this.ropeCoils[i];
      Object.assign(c,{loosened:true,stage:'slack',slackTimer:0,falling:false,fallTimer:0,taut:false});
      c.group.position.x=0;c.group.scale.set(1,1,1);
    }
    this.hopTimer=.70;this.reactionTimer=1.15;this.reactionVariant=(score-1)%3;
    // Quiet ordinary thanks, more visible milestones and a full finale.
    this.glyphTimer=score % 3 === 0 || score >= this.targetEnergy ? .95 : 0;
    this.energyAttentionRemaining=0;
    this.onEnergyReceived?.(score);
  }
  startEscape() {
    if(!['TRAPPED','FRIEND'].includes(this.state))return;
    this.friendFarewell=this.state==='FRIEND';
    if(this.friendFarewell){this.escapeOriginX=this.currentX;this.escapeOriginY=this.currentY;this.escapeOriginScale=this.animalGroup.scale.y;}
    this.model.position.y=0;
    this.state='CHEERING';this.escapeElapsed=0;this.ropesGroup.visible=false;this.hopTimer=0;
    this.comboMoveTimer=0;this.receiveTimer=0;this.moodWorried=0;this.moodExcited=0;
    this.spawnRopeBreakParticles();
  }
  startFriendPlay() {
    this.state='FRIEND';this.friendResponse=0;this.friendHits=0;this.anticipating=false;
    this.reactionTimer=0;this.glyphTimer=0;this.hopTimer=0;this.energyAttentionRemaining=0;
    this.actionPoseFn=null;this.actionPoseT=0;this.performanceGlow=null;
    this.ropesGroup.visible=false;this.postGroup.visible=false;this.animalGroup.visible=true;this.setOpacity(1);
    this.model.scale.set(1,1,1);this.model.position.y=0;this.model.rotation.set(0,-.12,0);
    this.animalGroup.rotation.set(0,0,0);this.setQuadrupedPosture(0);
    for(const g of [this.headGroup,this.leftArm,this.rightArm,this.leftLeg,this.rightLeg,this.tailGroup])g.rotation.set(0,0,0);
  }
  friendReact(count=1) {
    if(this.state!=='FRIEND')return;
    this.friendHits=count;this.friendResponse=1.1;this.reactionTimer=1.15;this.glyphTimer=.95;this.reactionVariant=count%3;
  }
  updateFriendPose(dt) {
    const t=this.idleTime,r=this.friendResponse||0;
    this.friendResponse=Math.max(0,r-dt);
    const pulse=r>0?Math.sin(Math.min(1,(1.1-r)/1.1)*Math.PI):0,motion=this.reducedMotion?.2:1;
    this.model.scale.set(1,1+Math.sin(t*2)*.008,1);this.model.rotation.x=0;this.model.position.y=0;
    this.headGroup.rotation.x=0;this.headGroup.rotation.z=Math.sin(t)*.025;
    this.leftArm.rotation.set(-.1,0,.1);this.rightArm.rotation.set(-.1,0,-.1);
    this.leftLeg.rotation.x=this.rightLeg.rotation.x=0;
    this.leftEarGroup.rotation.set(0,0,.1);this.rightEarGroup.rotation.set(0,0,-.1);
    this.tailGroup.rotation.set(0,0,0);
    if(this.animalId==='cat'){
      this.headGroup.rotation.z-=pulse*.18*motion;this.headGroup.rotation.x=-pulse*.08;
      this.leftEarGroup.rotation.z=.08-pulse*.10;this.rightEarGroup.rotation.z=-.08+pulse*.10;
      this.tailGroup.rotation.z=Math.sin(t*(r>0?4:1.5))*(r>0?.25:.08)*motion;
    }else if(['dog','bunny','wolf','chase'].includes(this.animalId)){
      this.rightArm.rotation.set(-.2,0,2.25-pulse*.35*motion);
      if(['dog','wolf','chase'].includes(this.animalId)){
        this.tailGroup.rotation.y=Math.sin(t*(r>0?11:5))*(r>0?.65:.3)*motion;
        this.headGroup.rotation.z-=pulse*.12*motion;
      }else{
        this.leftEarGroup.rotation.z=.1+pulse*.16*motion;this.rightEarGroup.rotation.z=-.1-pulse*.11*motion;
        this.model.position.y=pulse*.055*motion;
      }
    }else if(this.animalId==='teddy'){
      this.leftArm.rotation.z=-pulse*.5*motion;this.rightArm.rotation.z=pulse*.5*motion;this.headGroup.rotation.z+=pulse*.12*motion;
    }else if(this.animalId==='mcqueen'){
      this.bodyMesh.rotation.z=pulse*.08*motion;this.headGroup.rotation.z+=pulse*.08*motion;
    }else if(this.animalId==='thomas'){
      // Train idle: gentle body sway + periodic steam puffs from the funnel.
      this.bodyMesh.rotation.z=Math.sin(t*2)*.03*motion+pulse*.06*motion;
      this.headGroup.rotation.z+=Math.sin(t*2.4)*.02*motion+pulse*.07*motion;
      this.steamClock=(this.steamClock||0)+dt;
      if(!this.reducedMotion&&this.steamClock>.55&&this.state==='FRIEND'){
        this.steamClock=0;
        this.group.updateMatrixWorld(true);
        const funnel=this.model.getObjectByName('Train_Funnel');
        if(funnel){
          const pos=funnel.getWorldPosition(new THREE.Vector3());
          pos.y+=.18;
          const puff=new THREE.Mesh(new THREE.SphereGeometry(.05+Math.random()*.03,8,6),new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.55,depthWrite:false}));
          puff.position.copy(pos);this.scene.add(puff);
          this.particles.push({mesh:puff,velocity:new THREE.Vector3((Math.random()-.5)*.08,.35+Math.random()*.15,(Math.random()-.5)*.08),life:1.1,maxLife:1.1,dust:true});
        }
      }
    }else if(this.animalId==='frog'){
      this.leftArm.rotation.z=-pulse*.3;this.rightArm.rotation.z=pulse*.3;
      this.leftLeg.rotation.x=this.rightLeg.rotation.x=pulse*.12;
    }else if(this.animalId==='dragon'){
      for(const [name,sign]of [['Wing_L',-1],['Wing_R',1]]){const wing=this.model.getObjectByName(name);if(wing)wing.rotation.y=sign*(.3+Math.sin(t*5)*.12*motion);}
      this.tailGroup.rotation.y=Math.sin(t*2.5)*.2*motion;
    }else if(this.animalId==='goldenDragon'){
      this.bodyMesh.rotation.z=Math.sin(t*3)*.035*motion;this.tailGroup.rotation.y=Math.sin(t*3-.8)*.18*motion;
      for(const [name,sign]of [['Whisker_L',-1],['Whisker_R',1]]){const w=this.model.getObjectByName(name);if(w)w.rotation.y=sign*Math.sin(t*2.5)*.05*motion;}
    }
    this.updateAttention(dt);this.updateExpression(dt);updateExpressionRig(this,dt);
    // HappyPerformance 动作覆写层：在 FRIEND 基础姿态之后应用，动画帧内拥有最终决定权。
    if(this.actionPoseFn)this.actionPoseFn(this.actionPoseT||0);
    if(this.contactShadow){this.contactShadow.visible=true;this.contactShadow.position.set(this.currentX,(this.friendFloor??this.currentY)+.01,.1);this.contactShadow.scale.setScalar(this.animalGroup.scale.y);}
    this.updateSprings(dt);
  }
  spawnParticle(pos,dust=false,color) {
    if(this.particles.length>=16)return;
    const geo=dust?new THREE.SphereGeometry(.045,8,6):new THREE.OctahedronGeometry(.035,0);
    const mesh=new THREE.Mesh(geo,new THREE.MeshBasicMaterial({color:color||(dust?0xf2e2bd:0xffd778),transparent:true,opacity:.8,depthWrite:false}));
    mesh.position.copy(pos);this.scene.add(mesh);
    this.particles.push({mesh,velocity:new THREE.Vector3((Math.random()-.5)*(dust?.28:1.1),dust?.18:.55+Math.random()*.4,(Math.random()-.5)*.3),life:dust?.45:.7,maxLife:dust?.45:.7,dust});
  }
  spawnRopeBreakParticles(){if(!this.reducedMotion)for(let i=0;i<12;i++)this.spawnParticle(this.getTargetPosition());}
  spawnRopeFibers(coil){
    if(this.reducedMotion)return;
    this.group.updateMatrixWorld(true);
    const p=coil.group.getWorldPosition(new THREE.Vector3());
    for(let i=0;i<6;i++)this.spawnParticle(p,false,0xb59063);
  }
  spawnRunDust(pos){if(!this.reducedMotion)this.spawnParticle(pos,true);}
  setPaused(paused){this.isPaused=paused;}
  setAnticipation(active){this.anticipating=!!active;}
  setSpeechListening(listening){this.speechListening=listening;}
  setSpeaking(speaking){this.speaking=speaking;this.speakingTime=0;}
  reactToCombo(count){if(count<2||this.state!=='TRAPPED')return;this.reactionTimer=1.15;this.reactionVariant=1;this.glyphTimer=count>=3?1.05:.95;if(count>=3)this.comboMoveTimer=.85;}
  setOpacity(alpha) {
    for(const mat of this.furMaterials){mat.transparent=alpha<1;mat.opacity=alpha;mat.depthWrite=alpha>.5;}
  }
  reset() {
    this.speechListening=false;this.speaking=false;this.speakingTime=0;this.friendFarewell=false;this.escapeOriginX=null;this.friendResponse=0;this.model.position.y=0;
    this.state='TRAPPED';this.energyLevel=0;this.idleTime=0;this.escapeElapsed=0;this.hopTimer=0;this.blinkTimer=0;this.isPaused=false;this.dustClock=0;this.reactionTimer=0;
    this.anticipating=false;this.reactionVariant=0;this.glyphTimer=0;this.emotion='content';this.attentionPhase='player';this.attentionFocus=null;this.targetFocus=null;this.energyFocus=null;this.energyAttentionRemaining=0;resetExpressionRig(this.expressionRig);
    this.receiveTimer=0;this.receivePower=1;this.comboMoveTimer=0;this.recoilTimer=0;this.moodWorried=0;this.moodExcited=0;
    this.actionPoseFn=null;this.actionPoseT=0;this.performanceGlow=null;
    if(this.happyMouth)this.happyMouth.visible=false;if(this.happyTongue){this.happyTongue.visible=false;this.happyTongue.rotation.z=0;if(this.animalId==='dog')this.happyTongue.scale.y=.048;}
    for(const name of ['Mouth','Smile','Mouth_Stem','Smile_L','Smile_R']){const m=this.model.getObjectByName(name);if(m)m.visible=true;}
    this.currentX=this.startX;this.currentY=this.groundY;
    this.group.visible=true;this.animalGroup.visible=true;this.postGroup.visible=true;this.ropesGroup.visible=true;this.setOpacity(1);
    this.animalGroup.position.set(this.startX,this.groundY,.06);this.animalGroup.rotation.set(0,0,0);this.animalGroup.scale.setScalar(this.modelScale);
    for(const g of [this.headGroup,this.leftArm,this.rightArm,this.leftLeg,this.rightLeg,this.tailGroup])g.rotation.set(0,0,0);
    this.leftEarGroup.rotation.set(0,0,.13);this.rightEarGroup.rotation.set(0,0,-.13);this.eyesGroup.scale.set(1,1,1);
    this.bodyMesh.rotation.set(0,0,0);
    for(const name of ['Whisker_L','Whisker_R'])this.model.getObjectByName(name)?.rotation.set(0,0,0);
    for(const s of this.springs||[]){s.pos=s.get();s.vel=0;}
    this.model.scale.set(1,1,1);this.model.rotation.set(0,-.16,0);this.setQuadrupedPosture(0);
    for(const [name,sign]of [['Wing_L',-1],['Wing_R',1]]){const wing=this.model.getObjectByName(name);if(wing)wing.rotation.y=sign*.18;}
    for(const c of this.ropeCoils){Object.assign(c,{loosened:false,falling:false,fallTimer:0,stage:null,slackTimer:0,taut:false});c.group.visible=true;c.group.position.set(0,0,0);c.group.rotation.z=0;c.group.scale.set(1,1,1);c.mesh.material.opacity=1;}
    for(const p of this.particles){this.scene.remove(p.mesh);p.mesh.geometry.dispose();p.mesh.material.dispose();}this.particles=[];
    if(this.contactShadow){this.contactShadow.visible=true;this.contactShadow.material.opacity=1;}
    for(const m of this.bowMaterials)m.emissiveIntensity=0;
  }
  setPlayerFocus(players=[]) {
    const faces=players.map(p=>p.face).filter(Boolean);
    this.playerFocus=faces.length?{x:faces.reduce((n,f)=>n+f.x,0)/faces.length,y:faces.reduce((n,f)=>n+(f.eyeY??f.y),0)/faces.length}:null;
  }
  followEnergy(position) {
    this.energyFocus=position?.clone();
    this.energyAttentionRemaining=.6;
  }
  // 能量光团飞抵领结瞬间：张臂+深吸气式squash+蝴蝶结强闪。
  receiveEnergyImpact(count=1) {
    if(this.state!=='TRAPPED')return;
    this.receiveTimer=.5;this.receivePower=count>1?1.25:1;
  }
  setAttentionTarget(target, energy) {
    this.targetFocus=target?.clone() || null;
    if(energy){this.energyFocus=energy.clone();this.energyAttentionRemaining=.25;}
  }
  updateAttention(dt) {
    this.energyAttentionRemaining=Math.max(0,(this.energyAttentionRemaining||0)-dt);
    const energy=this.energyAttentionRemaining>0 && this.energyFocus;
    const target=energy || (this.anticipating && !this.reactionTimer ? this.targetFocus : null);
    this.attentionPhase=energy?'energy':target?'bubble':this.reactionTimer>0?'thanks':'player';
    let focus=this.playerFocus||{x:.5,y:.35};
    if(target&&this.camera){const p=target.clone().project(this.camera);focus={x:(p.x+1)/2,y:(1-p.y)/2};}
    this.attentionFocus ||= {...focus};
    const blend=1-Math.exp(-dt*7);
    this.attentionFocus.x+=(focus.x-this.attentionFocus.x)*blend;
    this.attentionFocus.y+=(focus.y-this.attentionFocus.y)*blend;
  }
  updateExpression(dt) {
    const reaction=this.reactionTimer||0;this.reactionTimer=Math.max(0,reaction-dt);
    if(this.state==='TRAPPED'||this.state==='FRIEND') {
      const eyeContact=this.speaking||this.speechListening||this.attentionPhase==='thanks';
      const focus=this.attentionFocus||this.playerFocus||{x:.5,y:.32};
      const yaw=eyeContact?0:THREE.MathUtils.clamp((focus.x-.5)*.7,-.28,.28);
      this.headGroup.rotation.y=THREE.MathUtils.lerp(this.headGroup.rotation.y,yaw,1-Math.exp(-dt*8));
      this.headGroup.rotation.x+=eyeContact?-.035:THREE.MathUtils.clamp((focus.y-.55)*.35,-.18,.10);
      if(eyeContact)this.headGroup.rotation.z+=Math.sin((1.15-reaction)*5)*.055;
    }
    if(!['TRAPPED','FRIEND'].includes(this.state))this.headGroup.rotation.y=THREE.MathUtils.lerp(this.headGroup.rotation.y,0,Math.min(1,dt*8));
    if(this.speaking){this.speakingTime+=dt;this.headGroup.rotation.x+=Math.sin(this.speakingTime*5)*.035;}
    const happy=this.speaking||this.speechListening||this.performanceGlow||reaction>.1||this.state==='WAVING'||this.state==='CHEERING'
      ||(this.state==='TRAPPED'&&this.moodExcited>.5);
    if(this.happyMouth)this.happyMouth.visible=happy;
    if(this.happyTongue)this.happyTongue.visible=happy;
    if(this.happyMouth)for(const name of ['Mouth','Smile','Mouth_Stem','Smile_L','Smile_R']){const m=this.model.getObjectByName(name);if(m)m.visible=!happy;}
    if(!this.isBlinking && this.blinkTimer<3.1)this.eyesGroup.scale.y=happy?.75:(this.state==='TRAPPED'?1+.06*this.moodWorried:1);
    if(this.eyeBases)for(const [i,eye] of [this.leftEye,this.rightEye].entries()) {
      const shift=this.state==='TRAPPED'&&!happy?.004+.009*this.moodWorried:0;
      eye.position.x=this.eyeBases[i].x+shift;eye.position.y=this.eyeBases[i].y+(happy?.003:.005);
    }
  }
  setQuadrupedPosture(blend) {
    if(!['cat','dog','chase'].includes(this.animalId))return;
    if(this.animalId==='dog') {
      this.bodyMesh.rotation.x=1.23*blend;this.bodyMesh.position.set(0,.42-.025*blend,.07*blend);
      this.headGroup.position.set(0,.88-.25*blend,.045+.37*blend);
      for(const arm of [this.leftArm,this.rightArm]){arm.position.y=.43;arm.position.z=.14+.24*blend;}
      this.leftLeg.position.z=this.rightLeg.position.z=-.02-.23*blend;
      this.tailGroup.position.set(.22,.27+.11*blend,-.2-.13*blend);return;
    }
    // Blend a seated silhouette into a four-footed trot without reskinning the rabbit hop.
    this.bodyMesh.rotation.x=1.2*blend;this.bodyMesh.position.set(0,.42-.03*blend,.08*blend);
    this.headGroup.position.set(0,.91-.30*blend,.045+.38*blend);
    for(const arm of [this.leftArm,this.rightArm]){arm.position.y=.52-.04*blend;arm.position.z=.13+.23*blend;}
    this.leftLeg.position.z=this.rightLeg.position.z=-.02-.23*blend;
    this.tailGroup.position.set(.25,.23+.12*blend,-.15-.18*blend);
  }

  animateHop(phase,height) {
    // Contact -> compression -> push -> flight -> landing. The ears lag behind.
    let y=0,squash=0;
    if(phase<.18)squash=Math.sin(phase/.18*Math.PI)*.10;
    else if(phase<.82)y=Math.sin((phase-.18)/.64*Math.PI)*height;
    else squash=Math.sin((phase-.82)/.18*Math.PI)*.08;
    this.currentY=this.groundY+y;
    this.animalGroup.position.y=this.currentY;
    this.model.scale.set(1+squash*.65,1-squash,1+squash*.4);
    this.headGroup.rotation.x=-Math.sin(phase*Math.PI*2)*.08;
    this.leftEarGroup.rotation.x=this.rightEarGroup.rotation.x=-Math.sin((phase-.12)*Math.PI*2)*.19;
    this.leftLeg.rotation.x=this.rightLeg.rotation.x=Math.sin(phase*Math.PI*2)*.62;
    this.leftArm.rotation.x=this.rightArm.rotation.x=-Math.sin((phase+.12)*Math.PI*2)*.44;
    return y;
  }
  update(dt,timeSeconds) {
    if(this.isPaused)return;
    this.idleTime+=dt;this.blinkTimer+=dt;
    this.receiveTimer=Math.max(0,(this.receiveTimer||0)-dt);
    this.isBlinking=this.blinkTimer>3.1&&this.blinkTimer<3.24;
    this.eyesGroup.scale.y=this.isBlinking?.08:1;
    if(this.blinkTimer>3.6)this.blinkTimer=0;
    for(let i=this.particles.length-1;i>=0;i--) {
      const p=this.particles[i];p.mesh.position.addScaledVector(p.velocity,dt);p.velocity.y-=dt*.95;p.life-=dt;
      p.mesh.material.opacity=Math.max(0,p.life/p.maxLife)*.8;if(p.dust)p.mesh.scale.setScalar(1+(1-p.life/p.maxLife)*1.2);
      if(p.life<=0){this.scene.remove(p.mesh);p.mesh.geometry.dispose();p.mesh.material.dispose();this.particles.splice(i,1);}
    }
    for(const c of this.ropeCoils)if(c.stage==='slack') {
      // 松弛下垂：绳子先塌下来晃两下，给孩子一个"快断了"的预告
      c.slackTimer+=dt;const t=clamp(c.slackTimer/.45,0,1);
      c.group.position.y=-t*.08;c.group.rotation.z=Math.sin(c.slackTimer*26)*.018*(1-t*.5);
      if(t>=1){c.stage=null;c.falling=true;c.fallTimer=0;this.recoilTimer=.42;this.onRopeSnap?.();this.spawnRopeFibers(c);}
    }else if(c.falling) {
      c.fallTimer+=dt;const t=clamp(c.fallTimer/.32,0,1);c.group.scale.set(1+t*.22,1,1+t*.22);c.group.position.y=-t*.2;c.mesh.material.opacity=1-t;
      if(t>=1){c.falling=false;c.group.visible=false;}
    }else if(c.taut&&!c.loosened) {
      // 绷紧预告：下一根要崩的绳圈高频微颤
      c.group.position.x=Math.sin(this.idleTime*40)*.0045;c.group.scale.setScalar(1+Math.sin(this.idleTime*34)*.012);
    }
    if(this.state==='FRIEND'){this.updateFriendPose(dt);return;}
    let jump=0;
    // Every pose starts from a fresh pitch; additive reactions must not accumulate over frames.
    this.headGroup.rotation.x=0;
    if(this.state==='TRAPPED') {
      // 被困情绪曲线：随解救进度从担心 → 期待 → 兴奋（不占用 emotion 字段，独立缓动权重）
      const progress=clamp(this.energyLevel/this.targetEnergy,0,1);
      const mwTarget=progress<.4?1-progress*2.5:0,meTarget=progress>=.6?1:0,easeK=Math.min(1,dt*5);
      this.moodWorried+=(mwTarget-this.moodWorried)*easeK;this.moodExcited+=(meTarget-this.moodExcited)*easeK;
      this.model.position.y=0;
      const nextIdx=this.ropeCoils.findIndex(c=>!c.loosened);
      for(let i=0;i<this.ropeCoils.length;i++)this.ropeCoils[i].taut=i===nextIdx&&(Math.ceil((i+1)*this.targetEnergy/5)-this.energyLevel)<=1;
      this.animalGroup.rotation.y=.15+Math.sin(this.idleTime*.85)*.07;
      this.animalGroup.rotation.z=this.reducedMotion?0:Math.sin(this.idleTime*1.7)*.013;
      this.model.scale.set(1,1+Math.sin(this.idleTime*2)*.012,1);
      this.headGroup.rotation.z=Math.sin(this.idleTime*.8)*.045;
      this.leftEarGroup.rotation.z=.13+Math.sin(this.idleTime*1.9)*.045-this.moodWorried*.22;
      this.rightEarGroup.rotation.z=-.13+Math.sin(this.idleTime*1.7+1)*.045+this.moodWorried*.22;
      if(this.comboMoveTimer>0) {
        // combo≥3 专属大反应：整圈旋转的大型庆祝，结束时由闲置分支复位
        this.comboMoveTimer=Math.max(0,this.comboMoveTimer-dt);this.hopTimer=Math.max(0,this.hopTimer-dt);
        const t=1-this.comboMoveTimer/.85,m=this.reducedMotion?.25:1,spin=smooth(t)*Math.PI*2*m;
        if(this.animalId==='goldenDragon'){
          jump=this.reducedMotion?0:Math.sin(t*Math.PI)*.07*m;this.animalGroup.position.y=this.groundY+jump;
          this.bodyMesh.rotation.z=Math.sin(t*Math.PI*3)*.11*m;this.tailGroup.rotation.y=Math.sin(t*Math.PI*3-.8)*.4*m;
          this.headGroup.rotation.z=Math.sin(t*Math.PI*2)*.12*m;
        }else if(this.animalId==='dragon'){
          if(this.comboMoveTimer===0)this.model.rotation.z=0;else this.model.rotation.z=spin;
          this.animalGroup.rotation.y=.15+spin;
          for(const [name,sign]of [['Wing_L',-1],['Wing_R',1]]){const wing=this.model.getObjectByName(name);if(wing)wing.rotation.y=sign*(.18+Math.sin(t*Math.PI)*.5*m);}
          this.tailGroup.rotation.y=Math.sin(t*Math.PI*2)*.3*m;
        }else{
          this.animalGroup.rotation.y=.15+spin;
          const hop=Math.sin(Math.min(1,t*2)*Math.PI)*.15*m+Math.sin(clamp(t*2-1,0,1)*Math.PI)*.2*m;
          this.currentY=this.groundY+hop;this.animalGroup.position.y=this.currentY;
          this.leftArm.rotation.z=-Math.sin(t*Math.PI)*.7*m-.2;this.rightArm.rotation.z=Math.sin(t*Math.PI)*.7*m+.2;
          this.tailGroup.rotation.z=Math.sin(t*Math.PI*4)*.35*m;
        }
        for(const mt of this.bowMaterials){mt.emissive=new THREE.Color(0xe6a94e);mt.emissiveIntensity=Math.sin(t*Math.PI)*.9;}
      }else if(this.hopTimer>0) {
        this.hopTimer=Math.max(0,this.hopTimer-dt);const p=1-this.hopTimer/.7;const boost=this.reducedMotion?1:1+.5*progress;
        if(this.animalId==='goldenDragon'){
          jump=this.reducedMotion?0:Math.sin(p*Math.PI)*.045*boost;this.animalGroup.position.y=this.groundY+jump;
          this.headGroup.rotation.x=-Math.sin(p*Math.PI)*.10;this.rightArm.rotation.x=-Math.sin(p*Math.PI)*.45;
        }else if(['cat','dog','chase'].includes(this.animalId)) {
          this.currentY=this.groundY;this.animalGroup.position.y=this.groundY;
          this.headGroup.rotation.z=Math.sin(p*Math.PI)*.12;
          this.rightArm.rotation.x=-Math.sin(p*Math.PI)*(this.animalId==='dog'?1.05:.8);
          if(this.animalId==='dog'){this.leftEarGroup.rotation.x=this.rightEarGroup.rotation.x=Math.sin(p*Math.PI*2)*.12;this.model.scale.y=1+Math.sin(p*Math.PI)*.025;}
          this.tailGroup.rotation.z=Math.sin(p*Math.PI*2)*.22;
        }else jump=this.animateHop(p,this.reducedMotion?.025:(this.animalId==='frog'?.22:.14)*boost);
        this.leftArm.rotation.z=-Math.sin(p*Math.PI)*.45;this.rightArm.rotation.z=Math.sin(p*Math.PI)*.45;
        for(const m of this.bowMaterials){m.emissive=new THREE.Color(0xe6a94e);m.emissiveIntensity=Math.sin(p*Math.PI)*.6;}
      }else {
        this.currentY=this.groundY;this.animalGroup.position.y=this.groundY;this.headGroup.rotation.x=0;
        if(this.moodExcited>0&&!this.reducedMotion)this.model.position.y=Math.abs(Math.sin(this.idleTime*5))*.015*this.moodExcited;
        this.leftArm.rotation.set(-.12,0,.17);this.rightArm.rotation.set(-.12,0,-.17);
        this.leftLeg.rotation.x=this.rightLeg.rotation.x=0;
        this.leftEarGroup.rotation.x=this.rightEarGroup.rotation.x=0;
        this.tailGroup.rotation.z=['cat','dog','chase'].includes(this.animalId)?Math.sin(this.idleTime*(this.animalId==='dog'?5:1.9))*(this.animalId==='dog'?.25:.12):0;
      }
    }else if(this.state!=='ESCAPED') {
      this.escapeElapsed+=dt;const t=this.escapeElapsed;
      if(t<.65) {
        this.state='CHEERING';
        if(this.animalId==='goldenDragon'){
          jump=this.reducedMotion?0:Math.sin(t/.65*Math.PI)*.10;this.animalGroup.position.y=this.groundY+jump;
          this.model.scale.set(1,1,1);
        }else if(['cat','dog','chase'].includes(this.animalId)) {
          this.setQuadrupedPosture(smooth(t/.65));
          const stretch=Math.sin(t/.65*Math.PI);this.model.scale.set(1+.10*stretch,1-.06*stretch,1);
          this.leftArm.rotation.x=this.rightArm.rotation.x=-stretch*.6;this.tailGroup.rotation.z=-stretch*.3;
        }else jump=this.animateHop(t/.65,this.reducedMotion?.05:(this.animalId==='frog'?.43:.34));
        this.animalGroup.rotation.y=THREE.MathUtils.lerp(.15,Math.PI/2,smooth(t/.65));
        this.leftArm.rotation.z=-.45;this.rightArm.rotation.z=.45;
      }else if(t<3.15) {
        this.state='ESCAPING';const p=(t-.65)/2.5;const count=this.animalId==='frog'?4:5;
        const hopPos=p*count;const phase=hopPos%1;
        // Advance mainly in the airborne interval, so planted feet do not slide.
        const step=['cat','dog','dragon','goldenDragon','mcqueen','chase','jett','thomas'].includes(this.animalId)?smooth(p):(Math.floor(hopPos)+smooth(clamp((phase-.18)/.64,0,1)))/count;
        this.currentX=THREE.MathUtils.lerp(this.escapeOriginX??this.startX,this.endX,step);
        this.animalGroup.position.x=this.currentX;this.animalGroup.rotation.y=Math.PI/2;this.animalGroup.rotation.z=-.035;
        if(['mcqueen','thomas'].includes(this.animalId)){
          this.currentY=this.groundY;this.animalGroup.position.y=this.groundY;
          for(const wheel of [this.leftArm,this.rightArm,this.leftLeg,this.rightLeg])wheel.rotation.x=-p*Math.PI*14;
          this.model.rotation.z=this.reducedMotion?0:Math.sin(p*25)*.018;
          if(this.animalId==='thomas'&&!this.reducedMotion){
            this.steamClock=(this.steamClock||0)+dt;
            if(this.steamClock>.18){this.steamClock=0;
              this.group.updateMatrixWorld(true);
              const funnel=this.model.getObjectByName('Train_Funnel');
              if(funnel){const pos=funnel.getWorldPosition(new THREE.Vector3());pos.y+=.18;
                const puff=new THREE.Mesh(new THREE.SphereGeometry(.045+Math.random()*.025,8,6),new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.5,depthWrite:false}));
                puff.position.copy(pos);this.scene.add(puff);
                this.particles.push({mesh:puff,velocity:new THREE.Vector3((Math.random()-.5)*.1,.3+Math.random()*.12,(Math.random()-.5)*.08),life:.8,maxLife:.8,dust:true});
              }
            }
          }
        }else if(['cat','dog','chase'].includes(this.animalId)) {
          this.setQuadrupedPosture(1);
          const stride=Math.sin(p*Math.PI*(this.animalId==='dog'?24:20));
          this.model.scale.set(1,1,1);jump=this.reducedMotion?0:Math.abs(stride)*(this.animalId==='dog'?.055:.025);
          this.currentY=this.groundY+jump;this.animalGroup.position.y=this.currentY;
          this.leftArm.rotation.x=stride*.42;this.rightArm.rotation.x=-stride*.42;
          this.leftLeg.rotation.x=-stride*.38;this.rightLeg.rotation.x=stride*.38;
          this.tailGroup.rotation.z=.3+Math.sin(p*(this.animalId==='dog'?32:20))*(this.animalId==='dog'?.30:.1);this.headGroup.rotation.x=-.04;
        }else if(['dragon','goldenDragon','jett'].includes(this.animalId)){
          this.model.scale.set(1,1,1);jump=this.reducedMotion?.05:.18+Math.sin(p*Math.PI)*.10+Math.sin(p*24)*.025;
          this.animalGroup.position.y=this.groundY+jump;this.leftLeg.rotation.x=this.rightLeg.rotation.x=.35;
          this.leftArm.rotation.x=this.rightArm.rotation.x=-.3;
        }else jump=this.animateHop(phase,this.reducedMotion?.025:(this.animalId==='frog'?.35:.22));
        this.dustClock+=dt;
        if(phase>.82&&this.dustClock>.25){this.dustClock=0;this.spawnRunDust(new THREE.Vector3(this.currentX-.12,this.groundY+.03,.16));}
      }else if(t<3.8) {
        if(this.state!=='WAVING')this.onReachedExit?.();
        this.state='WAVING';this.currentX=this.endX;this.currentY=this.groundY;
        this.animalGroup.position.set(this.endX,this.groundY,.06);this.animalGroup.rotation.x=0;this.model.scale.set(1,1,1);
        this.animalGroup.rotation.y=THREE.MathUtils.lerp(Math.PI/2,0,smooth(clamp((t-3.15)/.22,0,1)));
        this.setQuadrupedPosture(1-smooth(clamp((t-3.15)/.22,0,1)));
        this.headGroup.rotation.z=-.1;
        if(['cat','dog','chase'].includes(this.animalId))this.tailGroup.rotation.z=Math.sin((t-3.15)*12)*.3;
        this.leftArm.rotation.set(0,0,-1.7+Math.sin((t-3.15)*20)*.22);this.rightArm.rotation.set(0,0,-.1);
        this.leftLeg.rotation.x=this.rightLeg.rotation.x=0;
        this.leftEarGroup.rotation.x=this.rightEarGroup.rotation.x=0;
      }else {
        const alpha=1-clamp((t-3.8)/.3,0,1);this.setOpacity(alpha);this.contactShadow.material.opacity=alpha;
        if(alpha===0){this.state='ESCAPED';this.animalGroup.visible=false;this.contactShadow.visible=false;}
      }
    }
    if(this.animalId==='dog')this.tailGroup.rotation.y=Math.sin(this.idleTime*(this.moodExcited>.5?9.5:7))*(this.state==='TRAPPED'?.4:.55);
    if(this.animalId==='dragon'){
      const flying=this.state==='ESCAPING', excited=this.reactionTimer>0||this.state==='CHEERING';
      const flap=this.reducedMotion?0:Math.sin(this.idleTime*(flying?12:excited?10:2))*(flying?.6:excited?.4:.06);
      for(const [name,sign]of [['Wing_L',-1],['Wing_R',1]]){const wing=this.model.getObjectByName(name);if(wing)wing.rotation.y=sign*(.18+flap);}
      this.tailGroup.rotation.y=Math.sin(this.idleTime*2.5)*.18;
    }
    if(this.animalId==='goldenDragon'){
      const swimming=this.state==='ESCAPING',amplitude=this.reducedMotion?0:(swimming?.075:.025);
      this.bodyMesh.rotation.z=Math.sin(this.idleTime*3.5)*amplitude;
      this.tailGroup.rotation.y=Math.sin(this.idleTime*3.5-1)*amplitude*3;
      this.tailGroup.rotation.z=Math.sin(this.idleTime*3.5-.6)*amplitude;
      if(swimming){this.animalGroup.rotation.x=Math.sin(this.idleTime*3.5)*.035;this.headGroup.rotation.z=Math.sin(this.idleTime*3.5+.7)*.05;}
      for(const [name,sign]of [['Whisker_L',-1],['Whisker_R',1]]){const whisker=this.model.getObjectByName(name);if(whisker)whisker.rotation.y=sign*Math.sin(this.idleTime*2.7)*amplitude*2;}
    }
    if(this.friendFarewell&&this.escapeElapsed<.65){
      const blend=smooth(clamp(this.escapeElapsed/.65,0,1));
      this.animalGroup.position.y+=(this.escapeOriginY-this.groundY)*(1-blend);
      this.animalGroup.scale.setScalar(THREE.MathUtils.lerp(this.escapeOriginScale,this.modelScale,blend));
    }
    // 能量光团飞抵：张臂+吸气式squash+蝴蝶结强闪（叠加在基础/庆祝姿态之上）
    if(this.state==='TRAPPED'&&this.receiveTimer>0){
      const t=1-this.receiveTimer/.5,open=Math.sin(Math.min(1,t*2)*Math.PI),sq=Math.sin(t*Math.PI)*(this.receivePower||1),mo=this.reducedMotion?.25:1;
      this.leftArm.rotation.z+=-open*.36*mo;this.rightArm.rotation.z+=open*.36*mo;
      this.model.scale.y*=1-sq*.05*mo;this.model.scale.x*=1+sq*.028*mo;this.model.scale.z*=1+sq*.028*mo;
      const glow=Math.sin(t*Math.PI)*1.1*(this.receivePower||1);
      for(const m of this.bowMaterials){m.emissive=new THREE.Color(0xe6a94e);m.emissiveIntensity=Math.max(m.emissiveIntensity,glow);}
    }
    // 绳圈崩开的反冲：被"弹"一下的小后仰
    if(this.recoilTimer>0){
      this.recoilTimer=Math.max(0,this.recoilTimer-dt);const rt=1-this.recoilTimer/.42;
      this.animalGroup.rotation.z+=(this.reducedMotion?.012:.045)*Math.sin(rt*Math.PI*2)*(1-rt);
    }
    this.updateAttention(dt);
    this.updateExpression(dt);updateExpressionRig(this,dt);
    this.currentY=this.animalGroup.position.y;
    if(this.contactShadow){this.contactShadow.position.set(this.currentX,this.groundY+.014,.09);this.contactShadow.scale.setScalar(this.modelScale*(1+jump*.5));if(this.state!=='ESCAPED')this.contactShadow.visible=true;}
    this.updateSprings(dt);
  }
}
