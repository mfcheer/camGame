import * as THREE from 'three';
const FACE={
 bunny:{width:.043,depth:.028,top:1.90,colour:0xe69891},
 cat:{width:.067,depth:.036,top:1.44,colour:0xe9b575},
 frog:{width:.075,depth:.087,top:1.10,colour:0xa4c88a},
 dog:{width:.044,depth:.032,top:1.30,colour:0xe3ac7d},
 dragon:{width:.052,depth:.044,top:1.50,colour:0x97cbbb},
 goldenDragon:{width:.048,depth:.046,top:1.63,colour:0xeac166},
 teddy:{width:.043,depth:.028,top:1.34,colour:0xe69891},wolf:{width:.044,depth:.032,top:1.30,colour:0xe3ac7d},mcqueen:{width:.05,depth:.028,top:1.10,colour:0xffca48},chase:{width:.044,depth:.032,top:1.4,colour:0xffd075},jett:{width:.044,depth:.028,top:1.35,colour:0x97c8eb}
};
function stroke(parent,points,r,material){const path=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)));const m=new THREE.Mesh(new THREE.TubeGeometry(path,18,r,6,false),material);parent.add(m);return m;}
function heart(){const s=new THREE.Shape();s.moveTo(0,-.035);s.bezierCurveTo(-.11,.03,-.055,.10,0,.055);s.bezierCurveTo(.055,.10,.11,.03,0,-.035);return new THREE.ShapeGeometry(s,16);}
function star(){const s=new THREE.Shape();for(let i=0;i<10;i++){const a=i*Math.PI/5+Math.PI/2,r=i%2?.025:.055;i?s.lineTo(Math.cos(a)*r,Math.sin(a)*r):s.moveTo(Math.cos(a)*r,Math.sin(a)*r);}s.closePath();return new THREE.ShapeGeometry(s);}

// Install once for each newly loaded GLB. Nodes are local, so reset/pause use the animal clock.
export function createExpressionRig(model,id){
 const profile=FACE[id]||FACE.bunny,head=model.getObjectByName('Head');
 const root=new THREE.Group();root.name='Expression_Rig';head.add(root);
 const eyelid=new THREE.MeshStandardMaterial({color:0x4a3c32,roughness:.9});
 const smileEyes=[];const pupils=[];
 for(const side of ['L','R']){
  const eye=model.getObjectByName('Eye_'+side),smile=new THREE.Group();smile.name='Smile_Eye_'+side;smile.position.copy(eye.position);smile.rotation.copy(eye.rotation);root.add(smile);smile.visible=false;
  const w=profile.width,z=profile.depth;
  stroke(smile,[[-w,-.004,z],[-w*.5,.017,z+.002],[0,.024,z+.003],[w*.5,.017,z+.002],[w,-.004,z]],.0045,eyelid);
  smileEyes.push({eye,smile});
  eye.traverse(o=>{if(o.name==='Pupil'){pupils.push({node:o,base:o.position.clone()});}});
 }
 const effects=new THREE.Group();effects.name='Reaction_Glyphs';effects.position.set(0,profile.top,.10);model.add(effects);effects.visible=false;
 const glyphs=[];
 for(let i=0;i<3;i++){
  const material=new THREE.MeshBasicMaterial({color:i===1?0xe8bf6d:profile.colour,side:THREE.DoubleSide,transparent:true,opacity:0,depthWrite:false});
  const m=new THREE.Mesh(i===1?star():heart(),material);effects.add(m);glyphs.push(m);
 }
 // Performance excitement: star pupils replace the eyes; a bunny also blushes through its cheeks.
 const starMat=new THREE.MeshBasicMaterial({color:0xffd778,side:THREE.DoubleSide,transparent:true,opacity:0,depthWrite:false});
 const starEyes=[];
 for(const side of ['L','R']){
  const eye=model.getObjectByName('Eye_'+side);
  const s=new THREE.Mesh(star(),starMat);s.name='Star_Eye_'+side;
  s.position.copy(eye.position);s.position.z+=profile.depth+.006;s.rotation.copy(eye.rotation);
  s.scale.setScalar(1.25);s.visible=false;root.add(s);starEyes.push(s);
 }
 let blush=null;
 if(id==='bunny'){
  const blushMat=new THREE.MeshBasicMaterial({color:0xf29b8e,transparent:true,opacity:0,depthWrite:false});
  blush=[];
  for(const side of ['L','R']){
   const cheek=model.getObjectByName('Cheek_'+side);
   const b=new THREE.Mesh(new THREE.CircleGeometry(.032,14),blushMat);
   b.position.copy(cheek.position);b.position.z+=.008;b.rotation.y=side==='L'?-.3:.3;
   b.visible=false;root.add(b);blush.push(b);
  }
 }
 // A frog's vocal sac is a separate, subtle expression rather than a generic mammal tongue.
 let sac=null;
 if(id==='frog'){
  sac=new THREE.Mesh(new THREE.SphereGeometry(1,20,14),new THREE.MeshStandardMaterial({color:0xd4d99a,roughness:.9}));sac.name='Vocal_Sac';sac.position.set(0,-.19,.16);head.add(sac);sac.scale.set(.09,.025,.045);
 }
 return {profile,root,smileEyes,pupils,effects,glyphs,sac,starMat,starEyes,blush};
}

export function resetExpressionRig(rig){
 if(!rig)return;for(const {eye,smile}of rig.smileEyes){eye.visible=true;eye.scale.set(1,1,1);smile.visible=false;}
 for(const {node,base}of rig.pupils)node.position.copy(base);
 rig.effects.visible=false;for(const m of rig.glyphs)m.material.opacity=0;
 if(rig.sac)rig.sac.scale.set(.09,.025,.045);
 if(rig.starMat)rig.starMat.opacity=0;
 for(const s of rig.starEyes||[])s.visible=false;
 for(const b of rig.blush||[]){b.visible=false;b.material.opacity=0;}
}

export function updateExpressionRig(animal,dt){
 const rig=animal.expressionRig;if(!rig)return;
 const t=animal.idleTime,reaction=animal.reactionTimer||0,variant=animal.reactionVariant||0;
 const glow=animal.performanceGlow||null;
 const greeting=animal.state==='WAVING'||animal.state==='CHEERING';
 const happy=glow||!!animal.speaking||!!animal.speechListening||reaction>.10||greeting,curious=!happy&&animal.anticipating;
 animal.emotion=glow==='finale'?'grateful':glow?'delighted':greeting?'grateful':happy?(variant===1?'delighted':'happy'):curious?'curious':'content';
 // Slow blink for cats; puppy wink; other friends use upturned smiling eyelids.
 const smileWindow=greeting||(reaction<1.02&&reaction>.42);
 const closeBoth=happy&&(animal.animalId!=='cat'||reaction<1.05)&&!(animal.animalId==='dog'&&variant===1);
 for(let i=0;i<rig.smileEyes.length;i++){
  const {eye,smile}=rig.smileEyes[i];
  if(glow==='star'){eye.visible=false;smile.visible=false;eye.scale.y=1;}
  else if(glow==='finale'){eye.visible=false;smile.visible=true;eye.scale.y=1;}
  else{
   const close=happy&&smileWindow&&(closeBoth||(animal.animalId==='dog'&&variant===1&&i===1));
   eye.visible=!close;smile.visible=close;eye.scale.y=curious?1.12:happy&&!close?.90:1;
  }
 }
 // Star pupils glow with a soft pulse while performing; blush fades in only for the bunny.
 if(rig.starMat){
  const target=glow==='star'?.85+Math.sin(t*6)*.15:0;
  rig.starMat.opacity+=(target-rig.starMat.opacity)*(1-Math.exp(-dt*10));
  for(const s of rig.starEyes||[])s.visible=glow==='star'||rig.starMat.opacity>.05;
 }
 if(rig.blush){
  const target=glow?.5:0;
  for(const b of rig.blush){b.material.opacity+=(target-b.material.opacity)*(1-Math.exp(-dt*6));b.visible=b.material.opacity>.01;}
 }
 if(animal.happyTongue&&animal.animalId==='dog'){animal.happyTongue.rotation.z=happy?Math.sin(t*5)*.10:0;animal.happyTongue.scale.y=.048*(happy?1+Math.sin(t*7)*.08:1);}
 const focus=animal.attentionFocus||animal.playerFocus||{x:.5,y:.32};
 const lookX=THREE.MathUtils.clamp((focus.x-.5)*.022,-.012,.012),lookY=THREE.MathUtils.clamp((.4-focus.y)*.025,-.01,.01);
 for(const {node,base}of rig.pupils){node.position.x=THREE.MathUtils.lerp(node.position.x,base.x+lookX,1-Math.exp(-dt*12));node.position.y=THREE.MathUtils.lerp(node.position.y,base.y+lookY,1-Math.exp(-dt*12));}
 const glyphLife=animal.glyphTimer||0;animal.glyphTimer=Math.max(0,glyphLife-dt);rig.effects.visible=glyphLife>0&&!animal.reducedMotion;
 if(rig.effects.visible){const p=1-glyphLife/.95;for(let i=0;i<rig.glyphs.length;i++){const m=rig.glyphs[i];m.position.set((i-1)*.14,.05+p*.18+Math.sin(i*2)*.025,0);m.rotation.z=Math.sin(t*3+i)*.12;m.scale.setScalar(.65+Math.sin(Math.min(1,p*4)*Math.PI/2)*.35);m.material.opacity=Math.min(1,p*7)*(1-p)*.85;}}
 if(rig.sac){const inflate=happy?Math.sin(Math.min(1,(1.15-reaction)/.7)*Math.PI)*.5+.5:0;rig.sac.scale.set(.09+inflate*.045,.025+inflate*.055,.045+inflate*.03);}
 if(animal.state!=='TRAPPED')return;
 const amount=happy?Math.sin(Math.max(0,1.15-reaction)*Math.PI):0;
 const motion=animal.reducedMotion?.25:1;
 // Small anticipations precede the larger, species-specific thanks.
 animal.model.rotation.x=curious&&!animal.reducedMotion?-.025:0;
 if(curious){
  animal.headGroup.rotation.z+=Math.sin(t*2)*.025*motion;
  switch(animal.animalId){
   case 'cat':
    animal.leftEarGroup.rotation.z=.06;animal.rightEarGroup.rotation.z=-.06;
    animal.rightArm.rotation.x=-.18-Math.sin(t*2)*.055*motion;
    animal.tailGroup.rotation.z=Math.sin(t*2.2)*.07*motion;break;
   case 'bunny':animal.leftEarGroup.rotation.z=.23;animal.rightEarGroup.rotation.z=-.08;animal.headGroup.rotation.z+=.055*motion;break;
   case 'dog':animal.headGroup.rotation.z+=.10*motion;animal.tailGroup.rotation.y=Math.sin(t*8)*.48*motion;break;
   case 'frog':animal.leftLeg.rotation.x=animal.rightLeg.rotation.x=.10;break;
   case 'dragon':
    for(const [name,sign] of [['Wing_L',-1],['Wing_R',1]]){const wing=animal.model.getObjectByName(name);if(wing)wing.rotation.y=sign*.27;}
    break;
   case 'goldenDragon':animal.tailGroup.rotation.y+=Math.sin(t*2.5-.8)*.035*motion;break;
  }
 }
 // Cat slow blinks remain readable while looking back at the player.
 if(animal.animalId==='cat'&&!happy&&!curious){
  const phase=t%5.2;
  const blink=phase>3.8&&phase<4.5?Math.sin((phase-3.8)/.7*Math.PI):0;
  for(const {eye} of rig.smileEyes)eye.scale.y=1-blink*.93;
 }
 if(animal.animalId==='cat'&&!happy)animal.tailGroup.rotation.y=Math.sin(t*1.4)*.065*motion;
 if(happy){
  switch(animal.animalId){
   case 'cat':
    animal.leftEarGroup.rotation.z=.12-amount*.10;animal.rightEarGroup.rotation.z=-.12+amount*.07;
    animal.tailGroup.rotation.y=Math.sin(t*3.5)*.20*motion;
    if(variant===1){animal.leftArm.rotation.x=-amount*.30;animal.rightArm.rotation.x=-amount*.30;animal.headGroup.rotation.z-=amount*.08;}break;
   case 'bunny':animal.leftEarGroup.rotation.z=.13+amount*.16*motion;animal.rightEarGroup.rotation.z=-.13-amount*.08*motion;animal.headGroup.rotation.z+=amount*(variant===1?-.13:.08)*motion;break;
   case 'dog':animal.headGroup.rotation.z+=amount*(variant===1?-.19:.14)*motion;animal.leftEarGroup.rotation.x+=amount*.10*motion;animal.rightEarGroup.rotation.x-=amount*.14*motion;break;
   case 'frog':animal.leftArm.rotation.z-=amount*.12*motion;animal.rightArm.rotation.z+=amount*.12*motion;break;
   case 'dragon':animal.headGroup.rotation.z+=amount*.10*motion;animal.tailGroup.rotation.z+=amount*.12*motion;break;
   case 'goldenDragon':animal.headGroup.rotation.x-=amount*.08*motion;break;
  }
 }
}
