import {modelxWings,modelxDance,modelxDeparture,resetModelX} from './modelxMotion.js';
import * as THREE from 'three';
import {airplaneTaxi,airplaneBank,airplaneTakeoff,resetAirplaneMotion} from './airplaneMotion.js';
import {getViewport,getSafeInsets,getHudBottom} from './viewport.js';

const clamp=THREE.MathUtils.clamp;
const ease=t=>t*t*(3-2*t);
const REST=.25;
const SPEED=.8; // 整体播放速度：动作时长按此缩放，单局演出总时长控制在约 5-8 秒。

// Each action follows one character's own body language; t is 0..1, m reduces motion.
// fn 内所有曲线在 t=1 时归零，rest 阶段无需残留清理（reset 兜底旋转类覆写）。
const ACTIONS=[
  {id:'earWiggle',dur:1.4,animals:['bunny','cat'],fn:(a,t,m)=>{
    const w=Math.sin(t*Math.PI*7);
    a.leftEarGroup.rotation.z=.13+w*.26*m;
    a.rightEarGroup.rotation.z=-.13-w*.26*m;
    a.headGroup.rotation.z=w*.06*m;
  }},
  {id:'tailChase',dur:1.6,animals:['dog','wolf','chase'],fn:(a,t,m)=>{
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
  {id:'catPounce',dur:1.6,animals:['cat'],reset:a=>{a.bodyMesh.scale.set(1,1,1);},fn:(a,t,m)=>{
    const crouch=Math.sin(t*Math.PI),spring=Math.sin(t*Math.PI*2)*crouch;
    a.bodyMesh.scale.set(1+crouch*.07*m,1-crouch*.12*m,1);
    a.leftArm.rotation.x=a.rightArm.rotation.x=-crouch*.60*m;
    a.animalGroup.position.y+=Math.max(0,spring)*.11*m;
    a.tailGroup.rotation.z=crouch*.45*m;
  }},
  {id:'dogPawTap',dur:1.5,animals:['dog'],fn:(a,t,m)=>{
    const paw=Math.abs(Math.sin(t*Math.PI*3))*Math.sin(t*Math.PI)*m;
    a.rightArm.rotation.x=-paw*.85;
    a.headGroup.rotation.z=-paw*.11;
    a.tailGroup.rotation.y=Math.sin(t*Math.PI*9)*.48*m;
  }},
  {id:'headTilt',dur:1.4,animals:['dog','wolf','chase'],fn:(a,t,m)=>{
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
  {id:'raceRev',dur:1.5,animals:['mcqueen'],fn:(a,t,m)=>{const s=Math.sin(t*Math.PI*6)*m;a.bodyMesh.rotation.z=s*.04;a.headGroup.rotation.z=-s*.035;for(const p of [a.leftArm,a.rightArm,a.leftLeg,a.rightLeg])p.rotation.x=t*Math.PI*4;}},
  {id:'raceSway',dur:1.5,animals:['mcqueen'],fn:(a,t,m)=>{const s=Math.sin(t*Math.PI*4)*m;a.model.rotation.z=s*.08;a.headGroup.rotation.z=-s*.05;}},
  {id:'bearHug',dur:1.5,animals:['teddy'],fn:(a,t,m)=>{const s=Math.sin(t*Math.PI)*m;a.leftArm.rotation.z=-s*.9;a.rightArm.rotation.z=s*.9;a.headGroup.rotation.z=s*.12;}},
  {id:'bearSway',dur:1.6,animals:['teddy'],fn:(a,t,m)=>{const s=Math.sin(t*Math.PI*4)*m;a.bodyMesh.rotation.z=s*.12;a.headGroup.rotation.z=-s*.1;}},
  {id:'jettFly',dur:1.7,animals:['jett'],fn:(a,t,m)=>{const s=Math.sin(t*Math.PI)*m;a.animalGroup.position.y+=s*.16;a.model.rotation.z=Math.sin(t*Math.PI*2)*.12*m;for(const [n,d] of [['Wing_L',-1],['Wing_R',1]]){const w=a.model.getObjectByName(n);if(w)w.rotation.z=d*Math.sin(t*Math.PI*4)*.14*m;}}},
  {id:'jettWave',dur:1.5,animals:['jett'],fn:(a,t,m)=>{const s=Math.sin(t*Math.PI*4)*m;a.rightArm.rotation.z=1.0+s*.3;a.headGroup.rotation.z=s*.06;}},
  {id:'pigJump',dur:1.5,animals:['peppa'],fn:(a,t,m)=>{const s=Math.abs(Math.sin(t*Math.PI*3))*m;a.animalGroup.position.y+=s*.14;a.leftArm.rotation.z=-s*.45;a.rightArm.rotation.z=s*.45;}},
  {id:'pigWave',dur:1.5,animals:['peppa'],fn:(a,t,m)=>{const s=Math.sin(t*Math.PI*4)*m;a.rightArm.rotation.z=1+s*.3;a.headGroup.rotation.z=s*.08;}},
  // 三个新朋友的性格专属演出：阿奇敬礼/警犬旋风、乐迪空中翻滚、佩奇咯咯笑
  {id:'policeSalute',dur:1.6,animals:['chase'],fn:(a,t,m)=>{
    const s=Math.min(1,t*4);
    a.rightArm.rotation.z=(2.15+Math.sin(t*Math.PI*3)*.06)*s*m;
    a.headGroup.rotation.z=-s*.10*m;
    a.tailGroup.rotation.y=Math.sin(t*Math.PI*6)*.35*m;
  }},
  {id:'pupSpin',dur:1.7,reset:a=>{a.model.rotation.y=0;},animals:['chase'],fn:(a,t,m)=>{
    a.model.rotation.y=t*Math.PI*2*m;
    const flap=Math.sin(t*Math.PI*4)*.18*m;
    a.leftEarGroup.rotation.z=.15+flap;a.rightEarGroup.rotation.z=-.15-flap;
    a.tailGroup.rotation.y=Math.sin(t*Math.PI*8)*.5*m;
  }},
  {id:'jettLoop',dur:1.8,reset:a=>{a.model.rotation.x=0;a.model.position.y=0;},animals:['jett'],fn:(a,t,m)=>{
    a.model.rotation.x=-t*Math.PI*2*m;
    a.model.position.y=Math.sin(t*Math.PI)*.10*m;
    for(const [n,d] of [['Wing_L',-1],['Wing_R',1]]){const w=a.model.getObjectByName(n);if(w)w.rotation.y=d*Math.sin(t*Math.PI)*.5*m;}
  }},
  {id:'pigGiggle',dur:1.5,animals:['peppa'],fn:(a,t,m)=>{
    const s=Math.sin(t*Math.PI*6);
    a.bodyMesh.rotation.z=s*.10*m;
    a.headGroup.rotation.z=-s*.13*m;
    a.leftArm.rotation.z=-.5-s*.2*m;a.rightArm.rotation.z=.5+s*.2*m;
    a.animalGroup.position.y+=Math.abs(Math.sin(t*Math.PI*3))*.045*m;
  }},
  // 灰太狼招牌动作：一手托腮思考坏点子、单手叉腰、狡黠摇晃脑袋、脚尖踩拍
  {id:'wolfChinScheming',dur:1.6,animals:['wolf'],fn:(a,t,m)=>{
    const s=Math.sin(t*Math.PI*4);
    a.rightArm.rotation.z=(1.40+s*.08)*m;
    a.rightArm.rotation.x=(-0.40+s*.05)*m;
    a.leftArm.rotation.z=(-0.75-s*.06)*m;
    a.headGroup.rotation.z=(-0.15+Math.sin(t*Math.PI*2)*.10)*m;
    a.headGroup.rotation.y=(0.12+s*.06)*m;
    a.tailGroup.rotation.y=Math.sin(t*Math.PI*6)*.36*m;
    a.animalGroup.position.y+=Math.abs(Math.sin(t*Math.PI*4))*.022*m;
  }},
  // 灰太狼仰天大笑：双手叉腰、挺起大肚腩得意洋洋
  {id:'wolfCackle',dur:1.6,animals:['wolf'],fn:(a,t,m)=>{
    const s=Math.sin(t*Math.PI*6);
    a.leftArm.rotation.z=(-0.70-s*.08)*m;
    a.rightArm.rotation.z=(0.70+s*.08)*m;
    a.headGroup.rotation.x=(-0.24+s*.05)*m;
    a.bodyMesh.rotation.x=(-0.10+s*.03)*m;
    a.animalGroup.position.y+=Math.abs(Math.sin(t*Math.PI*3))*.035*m;
    a.tailGroup.rotation.y=Math.sin(t*Math.PI*8)*.35*m;
  }},
  // 托马斯专属演出：鸣笛、喷气、车轮加速、列车摇摆
  {id:'trainWhistle',dur:1.6,animals:['thomas'],reset:a=>{a.headGroup.position.copy(a.headRestPosition);},fn:(a,t,m)=>{
    const p=Math.sin(t*Math.PI);
    a.headGroup.rotation.x=-.06*p*m;a.headGroup.position.y=a.headRestPosition.y+p*.02*m;
    a.bodyMesh.rotation.z=Math.sin(t*Math.PI*2)*.02*m;
    // Whistle blow: a little body lean + eyebrow lift baked into the face rig.
    // One whistle is scheduled by beginAction, not on every animation frame.
  }},
  {id:'steamBurst',dur:1.5,animals:['thomas'],fn:(a,t,m)=>{
    const puff=Math.abs(Math.sin(t*Math.PI*3))*m;
    a.bodyMesh.rotation.z=Math.sin(t*Math.PI*3)*.03*m;
    a.animalGroup.position.y+=puff*.05;
    // Wheels spin fast during the burst.
    for(const p of [a.leftArm,a.rightArm,a.leftLeg,a.rightLeg])p.rotation.x=t*Math.PI*10;
  }},
  {id:'wheelRev',dur:1.5,animals:['thomas'],fn:(a,t,m)=>{
    const s=Math.sin(t*Math.PI*6)*m;
    a.bodyMesh.rotation.z=s*.035;a.headGroup.rotation.z=-s*.03;
    for(const p of [a.leftArm,a.rightArm,a.leftLeg,a.rightLeg])p.rotation.x=t*Math.PI*6;
  }},
  {id:'trainSway',dur:1.6,animals:['thomas'],fn:(a,t,m)=>{
    const s=Math.sin(t*Math.PI*3)*m;
    a.model.rotation.z=s*.07;a.headGroup.rotation.z=-s*.045;
    a.animalGroup.position.y+=Math.abs(s)*.02;
    // Gentle wheel turn while swaying.
    for(const p of [a.leftArm,a.rightArm,a.leftLeg,a.rightLeg])p.rotation.x=t*Math.PI*2;
  }},
  {id:'bucketWave',dur:1.55,animals:['excavator'],fn:(a,t,m)=>{
    const lift=Math.sin(t*Math.PI),wave=Math.sin(t*Math.PI*6)*lift;
    a.model.getObjectByName('Boom_Base').rotation.z=.28*lift*m+.08*wave*m;
    a.model.getObjectByName('Boom_Elbow').rotation.z=-.16*lift*m;
    a.model.getObjectByName('Bucket').rotation.z=.35*wave*m;
    a.headGroup.rotation.z=-.06*wave*m;
  }},
  {id:'dinoStomp',dur:1.6,animals:['triceratops'],fn:(a,t,m)=>{
    const s=Math.sin(t*Math.PI*4)*m;
    a.leftArm.rotation.x=s*.4;a.rightArm.rotation.x=-s*.4;
    a.leftLeg.rotation.x=-s*.3;a.rightLeg.rotation.x=s*.3;
    a.headGroup.rotation.x=Math.sin(t*Math.PI*2)*.12*m;
  }},
  {id:'frillShake',dur:1.5,animals:['triceratops'],fn:(a,t,m)=>{
    const s=Math.sin(t*Math.PI*3)*m;
    a.headGroup.rotation.z=s*.18;
    a.headGroup.rotation.y=s*.12;
    a.tailGroup.rotation.y=-s*.25;
  }},
  {id:'hornNod',dur:1.4,animals:['triceratops'],fn:(a,t,m)=>{
    const s=Math.sin(t*Math.PI*2)*m;
    a.headGroup.rotation.x=s*.18;
    a.model.position.y=Math.abs(s)*.04;
  }},
  {id:'busHonk',dur:1.6,animals:['tayo'],fn:(a,t,m)=>{
    const s=Math.sin(t*Math.PI*6)*m;
    a.bodyMesh.rotation.z=s*.035;
    a.headGroup.rotation.z=-s*.03;
    const honk=Math.abs(Math.sin(t*Math.PI*4))*m;
    a.animalGroup.position.y+=honk*.06;
    for(const p of [a.leftEarGroup,a.rightEarGroup])if(p)p.rotation.z=s*.15;
  }},
  {id:'busHop',dur:1.6,animals:['tayo'],fn:(a,t,m)=>{
    const s=Math.sin(t*Math.PI*4)*m;
    a.model.rotation.x=s*.08;
    for(const p of [a.leftArm,a.rightArm,a.leftLeg,a.rightLeg])p.rotation.x=t*Math.PI*3;
  }},
  {id:'busWiggle',dur:1.5,animals:['tayo'],fn:(a,t,m)=>{
    const s=Math.sin(t*Math.PI*3)*m;
    a.model.rotation.y=s*.12;
    a.model.rotation.z=s*.05;
  }},
  {id:'krashyHop',dur:1.5,animals:['krashy'],fn:(a,t,m)=>{
    const s=Math.sin(t*Math.PI*4)*m;
    a.animalGroup.position.y+=Math.abs(s)*.12;
    a.leftArm.rotation.z=-s*.5-.2;a.rightArm.rotation.z=s*.5+.2;
    if(a.leftEarGroup)a.leftEarGroup.rotation.z=s*.25;
    if(a.rightEarGroup)a.rightEarGroup.rotation.z=-s*.25;
  }},
  {id:'krashyWiggle',dur:1.5,animals:['krashy'],fn:(a,t,m)=>{
    const s=Math.sin(t*Math.PI*3)*m;
    a.headGroup.rotation.z=s*.15;
    a.tailGroup.rotation.y=-s*.35;
    a.leftArm.rotation.x=s*.3;a.rightArm.rotation.x=-s*.3;
  }},
  {id:'krashyCheer',dur:1.6,animals:['krashy'],fn:(a,t,m)=>{
    const s=Math.sin(t*Math.PI*2)*m;
    a.leftArm.rotation.z=-.7;a.rightArm.rotation.z=.7;
    a.headGroup.rotation.x=-s*.12;
    a.animalGroup.position.y+=Math.abs(Math.sin(t*Math.PI*4))*0.08*m;
  }},
  {id:'chickWingFlap',dur:1.55,animals:['maiqi'],fn:(a,t,m)=>{
    const lift=Math.sin(t*Math.PI),flutter=Math.sin(t*Math.PI*8)*lift*m;
    a.leftArm.rotation.z=-.35-.58*lift*m-.18*flutter;
    a.rightArm.rotation.z=.35+.58*lift*m+.18*flutter;
    a.animalGroup.position.y+=Math.abs(Math.sin(t*Math.PI*3))*.065*m;
    a.headGroup.rotation.z=-flutter*.07;
  }},
  {id:'chickPeck',dur:1.45,animals:['maiqi'],fn:(a,t,m)=>{
    const dip=Math.sin(t*Math.PI*2)*Math.sin(t*Math.PI)*m;
    a.headGroup.rotation.x=.25*dip;
    a.bodyMesh.rotation.x=.08*dip;
    a.leftArm.rotation.z=-.18-.12*Math.abs(dip);
    a.rightArm.rotation.z=.18+.12*Math.abs(dip);
  }},
  {id:'scoopDig',dur:1.7,animals:['excavator'],fn:(a,t,m)=>{
    const dip=Math.sin(t*Math.PI),curl=Math.sin(t*Math.PI*2);
    a.model.getObjectByName('Boom_Base').rotation.z=-.20*dip*m;
    a.model.getObjectByName('Boom_Elbow').rotation.z=.25*dip*m;
    a.model.getObjectByName('Bucket').rotation.z=-.45*dip*m+.12*curl*m;
    a.bodyMesh.rotation.z=.025*curl*m;
  }},
];
ACTIONS.push({id:'airplaneTaxi',dur:1.6,animals:['airplane'],fn:airplaneTaxi,reset:resetAirplaneMotion},{id:'airplaneBank',dur:1.8,animals:['airplane'],fn:airplaneBank,reset:resetAirplaneMotion});
ACTIONS.push({id:'modelxWings',dur:1.9,animals:['modelx'],fn:modelxWings,reset:resetModelX},{id:'modelxDance',dur:2,animals:['modelx'],fn:modelxDance,reset:resetModelX});
const SIGNATURES={modelx:['modelxWings','modelxDance'],airplane:['airplaneTaxi','airplaneBank'],bunny:['earWiggle','skyHop'],cat:['catPounce','tailSway'],dog:['dogPawTap','tailChase'],frog:['croak','leapFrog'],dragon:['barrelRoll','wingFlutter'],goldenDragon:['swimS','cloudHover'],mcqueen:['raceRev','raceSway'],wolf:['wolfChinScheming','wolfCackle','headTilt'],teddy:['bearHug','bearSway'],chase:['policeSalute','pupSpin','tailChase'],jett:['jettFly','jettLoop','jettWave'],peppa:['pigJump','pigGiggle','pigWave'],thomas:['trainWhistle','steamBurst','wheelRev','trainSway'],excavator:['bucketWave','scoopDig'],tayo:['busHonk','busHop','busWiggle'],triceratops:['dinoStomp','frillShake','hornNod'],krashy:['krashyHop','krashyWiggle','krashyCheer'],maiqi:['chickWingFlap','chickPeck']};
const FINALES={
 modelx:{id:'modelxDeparture',fn:modelxDeparture,reset:resetModelX},
 airplane:{id:'airplaneTakeoff',fn:airplaneTakeoff,reset:resetAirplaneMotion},
  bunny:{id:'bunnyEarLeap',fn:(a,t,m)=>{const j=Math.sin(t*Math.PI)*m;a.animalGroup.position.y+=j*.33;a.leftEarGroup.rotation.z=.13+j*.48;a.rightEarGroup.rotation.z=-.13-j*.48;a.leftArm.rotation.z=-j*.65;a.rightArm.rotation.z=j*.65;}},
  cat:{id:'catCurlPurr',fn:(a,t,m)=>{const s=Math.sin(t*Math.PI)*m;a.headGroup.rotation.z=-s*.22;a.tailGroup.rotation.z=s*(.48+Math.sin(t*Math.PI*4)*.14);a.leftArm.rotation.x=-s*.36;a.rightArm.rotation.x=-s*.36;a.bodyMesh.rotation.y=s*.08;}},
  frog:{id:'frogBigCroak',reset:a=>{a.bodyMesh.scale.set(1,1,1);},fn:(a,t,m)=>{const s=Math.sin(t*Math.PI)*m;a.bodyMesh.scale.set(1+s*.13,1-s*.17,1+s*.13);a.animalGroup.position.y+=Math.max(0,Math.sin((t-.38)/.62*Math.PI))*.23*m;a.leftLeg.rotation.x=a.rightLeg.rotation.x=-s*.55;a.leftArm.rotation.z=-s*.45;a.rightArm.rotation.z=s*.45;}},
  dog:{id:'dogPlayBow',fn:(a,t,m)=>{const s=Math.sin(t*Math.PI)*m;a.bodyMesh.rotation.x=s*.25;a.headGroup.rotation.x=s*.22;a.rightArm.rotation.x=-s*.65;a.tailGroup.rotation.y=Math.sin(t*Math.PI*10)*s*.72;}},
  dragon:{id:'dragonWingRise',fn:(a,t,m)=>{const s=Math.sin(t*Math.PI)*m;a.animalGroup.position.y+=s*.23;for(const [n,d]of [['Wing_L',-1],['Wing_R',1]]){const w=a.model.getObjectByName(n);if(w)w.rotation.y=d*(.18+s*.78);}a.headGroup.rotation.x=-s*.15;a.tailGroup.rotation.y=Math.sin(t*Math.PI*4)*s*.30;}},
  goldenDragon:{id:'goldenDragonCoil',fn:(a,t,m)=>{const s=Math.sin(t*Math.PI)*m;a.animalGroup.position.y+=s*.17;a.bodyMesh.rotation.z=Math.sin(t*Math.PI*3)*s*.12;a.tailGroup.rotation.y=Math.sin(t*Math.PI*3-.8)*s*.48;for(const [n,d]of [['Whisker_L',-1],['Whisker_R',1]]){const w=a.model.getObjectByName(n);if(w)w.rotation.y=d*s*.19;}}},
  mcqueen:{id:'mcqueenVictoryLap',fn:(a,t,m)=>{const s=Math.sin(t*Math.PI)*m;a.model.rotation.z=Math.sin(t*Math.PI*3)*s*.08;a.bodyMesh.rotation.z=-Math.sin(t*Math.PI*3)*s*.06;a.headGroup.rotation.z=s*.05;for(const w of [a.leftArm,a.rightArm,a.leftLeg,a.rightLeg])w.rotation.x=t*Math.PI*8;}},
  wolf:{id:'wolfProudPose',fn:(a,t,m)=>{const s=Math.sin(t*Math.PI)*m;a.headGroup.rotation.x=-s*.15;a.leftEarGroup.rotation.z=.12+s*.27;a.rightEarGroup.rotation.z=-.12-s*.27;a.leftArm.rotation.z=-s*.55;a.rightArm.rotation.z=s*.55;a.tailGroup.rotation.y=Math.sin(t*Math.PI*5)*s*.32;}},
  teddy:{id:'teddyBigHug',fn:(a,t,m)=>{const s=Math.sin(t*Math.PI)*m;a.leftArm.rotation.z=-s*1.15;a.rightArm.rotation.z=s*1.15;a.headGroup.rotation.z=s*.13;a.model.scale.x=1+s*.09;a.model.scale.y=1-s*.06;}},
  chase:{id:'chaseHeroSalute',fn:(a,t,m)=>{const s=Math.sin(t*Math.PI)*m;a.rightArm.rotation.z=s*2.12;a.headGroup.rotation.z=-s*.12;a.leftEarGroup.rotation.z=.11+s*.14;a.tailGroup.rotation.y=Math.sin(t*Math.PI*8)*s*.43;}},
  jett:{id:'jettSkyBank',reset:a=>{a.model.rotation.z=0;},fn:(a,t,m)=>{const s=Math.sin(t*Math.PI)*m;a.animalGroup.position.y+=s*.20;a.model.rotation.z=Math.sin(t*Math.PI*2)*s*.19;for(const [n,d]of [['Wing_L',-1],['Wing_R',1]]){const w=a.model.getObjectByName(n);if(w)w.rotation.y=d*(.08+s*.52);}a.leftArm.rotation.z=-s*.52;a.rightArm.rotation.z=s*.52;}},
  peppa:{id:'peppaHappyBounce',fn:(a,t,m)=>{const s=Math.sin(t*Math.PI)*m;a.animalGroup.position.y+=Math.abs(Math.sin(t*Math.PI*3))*s*.13;a.headGroup.rotation.z=Math.sin(t*Math.PI*4)*s*.12;a.leftArm.rotation.z=-s*.48;a.rightArm.rotation.z=s*.48;}},
  thomas:{id:'thomasWhistleFinale',reset:a=>{a.headGroup.position.copy(a.headRestPosition);},fn:(a,t,m)=>{const s=Math.sin(t*Math.PI)*m;a.headGroup.position.y=a.headRestPosition.y+s*.018;a.headGroup.rotation.x=-s*.09;a.bodyMesh.rotation.z=Math.sin(t*Math.PI*4)*s*.035;for(const w of [a.leftArm,a.rightArm,a.leftLeg,a.rightLeg])w.rotation.x=t*Math.PI*4;}},
  excavator:{id:'excavatorScoopSalute',fn:(a,t,m)=>{const s=Math.sin(t*Math.PI)*m;const boom=a.model.getObjectByName('Boom_Base'),elbow=a.model.getObjectByName('Boom_Elbow'),bucket=a.model.getObjectByName('Bucket');if(boom)boom.rotation.z=s*.36;if(elbow)elbow.rotation.z=-s*.25;if(bucket)bucket.rotation.z=s*.38;a.headGroup.rotation.z=-s*.06;}},
  tayo:{id:'tayoHappyHonk',fn:(a,t,m)=>{const s=Math.sin(t*Math.PI)*m;a.model.rotation.z=Math.sin(t*Math.PI*4)*s*.07;a.bodyMesh.rotation.z=-Math.sin(t*Math.PI*4)*s*.045;a.headGroup.rotation.x=-s*.08;for(const w of [a.leftArm,a.rightArm,a.leftLeg,a.rightLeg])w.rotation.x=t*Math.PI*3;}},
  triceratops:{id:'triceratopsStrongStomp',fn:(a,t,m)=>{const s=Math.sin(t*Math.PI)*m;a.headGroup.rotation.x=-s*.18;a.leftLeg.rotation.x=-s*.48;a.rightLeg.rotation.x=s*.23;a.animalGroup.position.y+=Math.abs(Math.sin(t*Math.PI*2))*s*.045;a.tailGroup.rotation.y=Math.sin(t*Math.PI*5)*s*.34;}},
  krashy:{id:'krashyDoubleSpring',fn:(a,t,m)=>{const s=Math.sin(t*Math.PI)*m;a.animalGroup.position.y+=Math.abs(Math.sin(t*Math.PI*3))*s*.18;a.leftEarGroup.rotation.z=Math.sin(t*Math.PI*5)*s*.30;a.rightEarGroup.rotation.z=-Math.sin(t*Math.PI*5)*s*.30;a.leftArm.rotation.z=-s*.58;a.rightArm.rotation.z=s*.58;}},
  maiqi:{id:'maiqiWingFlutter',fn:(a,t,m)=>{const s=Math.sin(t*Math.PI)*m;a.animalGroup.position.y+=s*.12;const flap=Math.sin(t*Math.PI*8)*s*.23;a.leftArm.rotation.z=-.22-s*.70-flap;a.rightArm.rotation.z=.22+s*.70+flap;a.headGroup.rotation.z=Math.sin(t*Math.PI*3)*s*.08;}}
};
for(const finale of Object.values(FINALES)){finale.dur=1.8;finale.isFinale=true;}
const CELEBRATION_COLORS={modelx:[0xf2f4f4,0xa8d5ec,0xaec4d2],airplane:[0x50a8dc,0xfff7e6,0xffce68],bunny:[0xf5ad9a,0xffdf81,0xffffff],cat:[0xf7aa52,0xffd585,0x8ac7ad],frog:[0x8bce75,0xffdf75,0x78c6dc],dog:[0xc78e62,0xffda83,0x8dc5df],dragon:[0x72c9b6,0xffd977,0x9bd1f0],goldenDragon:[0xf4c351,0xf5e58b,0xe88d64],mcqueen:[0xf15d56,0xffd253,0xffffff],wolf:[0x879db9,0xffd06a,0xf0b775],teddy:[0xc99a73,0xf6d5af,0xefb0a7],chase:[0x65a3e0,0xf5d476,0xffffff],jett:[0xf06d64,0xa8d7f3,0xffffff],peppa:[0xf4a4b7,0xf5d470,0xf38277],thomas:[0x6aa9d9,0xe0e5e7,0xe95d55],excavator:[0xf4c554,0x7baac7,0xffffff],tayo:[0x75b8ee,0xf6d174,0xffffff],triceratops:[0xefaa6d,0x93c49d,0xffdf85],krashy:[0x83cbec,0xf5c780,0xffffff],maiqi:[0xf7d35e,0xf1a475,0xffffff]};

// 结算后的"开心小演出"：动物自己走到台前随机表演，孩子和家长可以休息。
// 无输入、无计分、无引导；每个动作开始播一声该动物的 happy 音效。
export class HappyPerformance {
  constructor(scene,camera,animal,audio,onDone=()=>{}) {
    Object.assign(this,{scene,camera,animal,audio,onDone,active:false,paused:false});
    this.group=new THREE.Group();this.group.name='Happy_Performance';this.group.visible=false;scene.add(this.group);
    this.platform=new THREE.Mesh(new THREE.CylinderGeometry(1,1.05,.08,40),new THREE.MeshStandardMaterial({color:0xeadbb6,roughness:1}));
    this.group.add(this.platform);
    // Stage spotlight follows the character palette and brightens for its finale.
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
    this.spot.color.setHex((CELEBRATION_COLORS[a.animalId]||CELEBRATION_COLORS.bunny)[1]);
    return this.plan.map(p=>p.id);
  }
  buildPlan() {
    // Each friend performs two of its own gestures, then its own closing pose.
    const id=this.animal.animalId;
    const sigs=(SIGNATURES[id]||[]).map(name=>ACTIONS.find(x=>x.id===name)).filter(Boolean);
    for(let i=sigs.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[sigs[i],sigs[j]]=[sigs[j],sigs[i]];}
    const plan=sigs.slice(0,2);
    if(this.lastPlan){
      if(plan[0].id===this.lastPlan[0])[plan[0],plan[1]]=[plan[1],plan[0]];
    }
    this.lastPlan=plan.map(p=>p.id);
    return plan.concat([FINALES[id]||FINALES.bunny]);
  }
  updateLayout(instant=true) {
    if(!this.active)return;
    const {width:w,height:h}=getViewport(),safe=getSafeInsets();
    const vh=2*Math.tan(THREE.MathUtils.degToRad(this.camera.fov/2))*Math.abs(this.camera.position.z),vw=vh*this.camera.aspect;
    this.unit=vh/h;this.width=w;this.height=h;
    const top=Math.max(getHudBottom()+(h<300?46:78),safe.top+(h<300?80:110));
    const floor=h-Math.max(safe.bottom+(h<300?30:62),h*.16);
    const available=Math.max(50,floor-top);
    const height=Math.min(280,h*.40,available*.88);
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
    this.animal.performanceGlow=act.isFinale?'finale':'perform';
    this.audio?.playAnimalSound?.(this.animal.animalId,'happy');
    if(act.isFinale)this.spawnConfetti();
    this.animal.friendReact(act.isFinale?3:i+1);
    this.animal.glyphTimer=0; // The character's own face and pose carry the stage reaction.
  }
  spawnConfetti() {
    if(this.animal.reducedMotion)return;
    const colors=CELEBRATION_COLORS[this.animal.animalId]||CELEBRATION_COLORS.bunny;
    const spread=Math.max(.55,this.localSize.x*this.targetScale*.85);
    if(!this.confettiGeo)this.confettiGeo=new THREE.PlaneGeometry(.05,.034);
    for(let i=0;i<28;i++){
      const material=new THREE.MeshBasicMaterial({color:colors[i%colors.length],side:THREE.DoubleSide,transparent:true,opacity:.95,depthWrite:false});
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
    const finale=!!act.isFinale;
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
