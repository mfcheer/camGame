import {setFalcon} from './modelxMotion.js';
import {setBicycleFork, setBicycleBell} from './bicycleMotion.js';
// Each row is an action card: three readable replies using the character's own shape.
export const ENERGY_REACTIONS = {
 bicycle:['前轮轻转','车身轻摆','铃铛轻颤'],
 modelx:['鹰翼舒展','车身轻摆','车头轻抬'],
 airplane:['机头轻抬','左右压翼','尾舵致意'],
 bunny:['竖耳小跳','侧耳倾听','双耳点头'], cat:['歪头摆尾','双爪轻拍','低头蹭爪'],
 frog:['鼓腮弹跳','张腿蹲伏','抬臂鼓劲'], dog:['歪头摇尾','抬爪致谢','俯身邀玩'],
 dragon:['展翼','侧身扇翼','低头翘尾'], goldenDragon:['昂首','左右游摆','低头摆须'],
 wolf:['竖耳','歪头摆尾','抬爪得意'], teddy:['张臂','抱抱','歪头招手'],
 chase:['抬爪敬礼','歪头摇尾','双爪踏步'], jett:['展翼','机翼侧倾','机头点头'],
 peppa:['开心小跳','张臂摇摆','抬手点头'], mcqueen:['车身倾侧','引擎振奋','车头点头'],
 thomas:['车身轻摇','汽笛抬头','车头点头'], excavator:['举臂','铲斗点头','挖掘收臂'],
 tayo:['车身左右摆','车头昂起','车头点头'], triceratops:['颈盾点头','左右甩尾','前足踏步'],
 krashy:['双耳弹跳','侧耳摇摆','双爪鼓劲'], maiqi:['双翼扑动','低头啄啄','单翼致意'],
};

// Applied after base poses/expressions so special-part idle motion cannot hide the reply.
export function applyEnergyReaction(a) {
 if(a.state!=='TRAPPED')return;
 const p=1-(a.hopTimer||0)/.7;
 const s=Math.sin(Math.PI*Math.min(1,Math.max(0,p)))*(a.reducedMotion?.25:1);
 const v=a.reactionVariant||0;
 a.energyReaction=(a.hopTimer||0)>0?(ENERGY_REACTIONS[a.animalId]?.[v]||''):'';
 if(!s)return;
 const tilt=x=>{a.model.rotation.z=x*s;};
 const nod=x=>{a.headGroup.rotation.x=x*s;};
 const arms=(l,r)=>{a.leftArm.rotation.x=l*s;a.rightArm.rotation.x=r*s;};
 const ears=(l,r)=>{a.leftEarGroup.rotation.z=l*s;a.rightEarGroup.rotation.z=r*s;};
 switch(a.animalId){
 case 'bicycle':
  if(v===0){a.leftArm.rotation.x=-p*Math.PI*s;a.headGroup.rotation.x=-.06*s;setBicycleBell(a,.15*s);}
  else if(v===1)tilt(.055);
  else{setBicycleBell(a,Math.sin(p*Math.PI*4)*.22*s);setBicycleFork(a,.14*s);}break;
 case 'modelx':
  if(v===0)setFalcon(a,.7*s);else if(v===1)tilt(.055);else a.model.rotation.x=-.06*s;break;
 case 'airplane':
  a.animalGroup.position.y=a.groundY;
  if(v===0){a.model.rotation.x=-.14*s;a.tailGroup.rotation.y=.12*s;}
  else if(v===1){tilt(.18);a.tailGroup.rotation.y=-.16*s;}
  else{a.tailGroup.rotation.y=Math.sin(p*Math.PI*4)*s*.38;a.model.rotation.x=.08*s;}break;
 case 'bunny':case 'krashy':
  if(v===0){ears(.05,-.05);a.model.position.y=.08*s;}
  else if(v===1){ears(.65,.18);tilt(.12);}
  else{ears(-.35,.35);nod(.23);arms(-.55,-.55);}break;
 case 'cat':case 'dog':case 'chase':case 'wolf':
  if(v===0){arms(0,0);tilt(.10);a.headGroup.rotation.z=.28*s;a.tailGroup.rotation.y=.6*s;}
  else if(v===1){arms(a.animalId==='cat'?-.65:0,-1.15);a.headGroup.rotation.z=-.15*s;}
  else{nod(.28);arms(-.45,-.45);a.tailGroup.rotation.y=-.6*s;}break;
 case 'frog':
  if(v===0)a.model.position.y=.10*s;
  else if(v===1){a.model.scale.y=1-.18*s;a.leftLeg.rotation.x=.35*s;a.rightLeg.rotation.x=.35*s;}
  else{arms(-.8,-.8);nod(-.18);}break;
 case 'dragon':case 'jett':case 'maiqi':
  if(v===0){arms(-.45,-.45);a.model.position.y=.06*s;}
  else if(v===1){arms(-.85,.45);tilt(.14);}
  else{nod(-.12);arms(-.35,-.35);}
  break;
 case 'goldenDragon':
  if(v===0){nod(-.18);a.tailGroup.rotation.y=.42*s;}
  else if(v===1){tilt(.12);a.headGroup.rotation.z=-.18*s;}
  else{nod(.20);a.tailGroup.rotation.y=-.42*s;}break;
 case 'teddy':case 'peppa':
  if(v===0){arms(-.6,-.6);a.model.position.y=.06*s;}
  else if(v===1){arms(-.95,.3);tilt(.10);}
  else{nod(.22);arms(-.4,-.4);}break;
 case 'mcqueen':case 'tayo':
  if(v===0)tilt(.07);
  else if(v===1){a.model.position.y=.035*s;tilt(-.06);}
  else nod(-.08);break;
 case 'thomas':
  if(v===0)tilt(.06);
  else if(v===1){nod(-.10);a.model.position.y=.025*s;}
  else nod(.12);break;
 case 'excavator':
  if(v===0){const b=a.model.getObjectByName('Boom_Base');if(b)b.rotation.z=.25*s;}
  else if(v===1){const b=a.model.getObjectByName('Bucket');if(b)b.rotation.z=.3*s;}
  else{const e=a.model.getObjectByName('Boom_Elbow');if(e)e.rotation.z=-.22*s;}break;
 case 'triceratops':
  if(v===0)nod(-.16);
  else if(v===1){a.tailGroup.rotation.y=.35*s;tilt(.08);}
  else{a.leftLeg.rotation.x=.3*s;a.rightLeg.rotation.x=-.3*s;}break;
 }
}
