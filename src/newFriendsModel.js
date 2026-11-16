import * as THREE from 'three';
import {mat,mesh,pivot,ellipsoid,sculpt,curve} from './rabbitModel.js';
import {createDogModel} from './dogModel.js';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';

// The names below are the shared pivots consumed by RescueAnimal and its expressions.
export function createTeddyModel(){
 const root=new THREE.Group();root.name='Teddy_Rig';
 const fur=mat(0xb67b50,.96),cream=mat(0xf1d6ab,.96),dark=mat(0x493027,.4),pink=mat(0xe2a39a,.9);
 const body=pivot(root,'Torso',[0,.42,0]);ellipsoid(body,'Plush_Body',fur,[0,0,0],[.32,.37,.25]);ellipsoid(body,'Tummy',cream,[0,-.035,.23],[.21,.23,.04]);
 const head=pivot(root,'Head',[0,.94,.02]);ellipsoid(head,'Plush_Head',fur,[0,0,0],[.32,.29,.25]);
 ellipsoid(head,'Muzzle',cream,[0,-.10,.23],[.18,.13,.10]);ellipsoid(head,'Nose',dark,[0,-.07,.326],[.063,.041,.027]);
 curve(head,'Mouth',[[0,-.11,.33],[0,-.15,.32],[-.06,-.165,.30]],.005,dark);curve(head,'Smile',[[0,-.15,.32],[.06,-.165,.30]],.005,dark);
 const eyes=pivot(head,'Eyes',[0,0,0]);
 for(const s of [-1,1]){
  const ear=pivot(head,s<0?'Ear_L':'Ear_R',[s*.25,.21,-.015]);ellipsoid(ear,'Round_Ear',fur,[0,0,0],[.12,.13,.07]);ellipsoid(ear,'Ear_Inner',cream,[0,0,.06],[.07,.08,.015]);
  const eye=pivot(eyes,s<0?'Eye_L':'Eye_R',[s*.12,.06,.225]);ellipsoid(eye,'Eye',dark,[0,0,0],[.043,.052,.025]);ellipsoid(eye,'Catchlight',cream,[-.012,.015,.022],[.012,.012,.006]);
  const arm=pivot(root,s<0?'Arm_L':'Arm_R',[s*.26,.56,.01]);ellipsoid(arm,'Arm',fur,[s*.035,-.13,.02],[.11,.19,.10]);ellipsoid(arm,'Paw',cream,[s*.04,-.24,.09],[.08,.07,.04]);
  const leg=pivot(root,s<0?'Leg_L':'Leg_R',[s*.17,.18,0]);ellipsoid(leg,'Foot',fur,[0,-.10,.07],[.13,.10,.17]);ellipsoid(leg,'Foot_Pad',cream,[0,-.10,.215],[.08,.055,.015]);
 }
 const happy=ellipsoid(head,'Happy_Mouth',dark,[0,-.165,.29],[.07,.045,.02]);happy.visible=false;
 const tongue=ellipsoid(head,'Happy_Tongue',pink,[0,-.18,.31],[.03,.018,.01]);tongue.visible=false;
 const tail=pivot(root,'Tail',[0,.32,-.24]);ellipsoid(tail,'Tail_Puff',fur,[0,0,0],[.08,.08,.07]);
 const bow=pivot(root,'Bow',[0,.65,.235]);const ribbon=mat(0xd17466,.8);ellipsoid(bow,'Bow_Left',ribbon,[-.07,0,0],[.075,.045,.024]);ellipsoid(bow,'Bow_Right',ribbon,[.07,0,0],[.075,.045,.024]);ellipsoid(bow,'Bow_Knot',cream,[0,0,.02],[.028,.028,.02]);
 return root;
}
export function createWolfModel(){
 const root=new THREE.Group();root.name="Friendly_Wolf_Rig";
 const fur=mat(0x525c65,.88),
       darkFur=mat(0x3a4248,.92),
       bellyFur=mat(0x76828c,.88),
       stubbleFur=mat(0x434c54,.90),
       hatOrange=mat(0xc45c2c,.85),
       hatPatch=mat(0xdfba68,.85),
       scarfYellow=mat(0xf3c439,.82),
       white=mat(0xffffff,.4),
       ink=mat(0x191c20,.45),
       pink=mat(0xd58782,.88),
       scarLine=mat(0x9ca5ac,.82),
       tailTip=mat(0xcad1d8,.92);

 const body=pivot(root,"Torso",[0,.38,0]);
 ellipsoid(body,"Wolf_Chest",fur,[0,.025,0],[.27,.33,.22]);
 ellipsoid(body,"Wolf_Tummy",bellyFur,[0,.01,.06],[.23,.28,.17]);
 ellipsoid(body,"Silver_Bib",bellyFur,[0,.03,.19],[.16,.21,.04]);

 const belly=pivot(body,"Belly_Cross",[0,-.09,.225]);
 curve(belly,"Cross_1",[[-.026,.026,.005],[.026,-.026,.005]],.0045,ink);
 curve(belly,"Cross_2",[[-.026,-.026,.005],[.026,.026,.005]],.0045,ink);
 ellipsoid(belly,"Navel_Ring",mat(0x3e464c,.95),[0,0,0],[.032,.032,.006]);

 const scarf=pivot(root,"Yellow_Scarf",[0,.64,.04]);
 mesh(new THREE.TorusGeometry(.20,.042,12,28),scarfYellow,scarf,"Scarf_Collar",[0,0,0]);
 const bib=ellipsoid(scarf,"Scarf_Bib",scarfYellow,[0,-.07,.185],[.10,.13,.038]);
 bib.rotation.x=.32;
 curve(scarf,"Scarf_Fold",[[-.06,-.03,.20],[0,-.14,.21],[.06,-.03,.20]],.006,mat(0xd6a629,.85));

 for(const s of [-1,1]){
  const arm=pivot(root,s<0?"Arm_L":"Arm_R",[s*.23,.48,.06]);
  ellipsoid(arm,"Wolf_Arm",fur,[s*.025,-.13,.02],[.085,.18,.08]);
  ellipsoid(arm,"Silver_Forepaw",darkFur,[s*.025,-.27,.07],[.09,.07,.10]);
  for(let f=-1;f<=1;f++){
   ellipsoid(arm,s<0?("Paw_Digit_L_"+f):("Paw_Digit_R_"+f),ink,[s*.025+f*.028,-.29,.12],[.018,.022,.025]);
  }
  const leg=pivot(root,s<0?"Leg_L":"Leg_R",[s*.18,.15,-.02]);
  ellipsoid(leg,"Wolf_Hind_Paw",fur,[0,-.06,.07],[.11,.08,.16]);
  ellipsoid(leg,"Silver_Toes",darkFur,[0,-.06,.20],[.085,.055,.06]);
 }

 const head=pivot(root,"Head",[0,.91,.025]);
 ellipsoid(head,"Wolf_Head",fur,[0,0,0],[.30,.27,.25]);

 for(const s of [-1,1]){
  const cheek=ellipsoid(head,"Wolf_Cheek_Ruff",fur,[s*.21,-.08,.08],[.12,.10,.12]);
  cheek.rotation.z=-s*.35;
  const tuftTop=mesh(new THREE.ConeGeometry(.068,.20,16),fur,head,s<0?"Cheek_Tuft_Top_L":"Cheek_Tuft_Top_R",[s*.29,.01,.03]);
  tuftTop.rotation.z=-s*1.22;tuftTop.rotation.y=s*.12;
  const tuftBot=mesh(new THREE.ConeGeometry(.060,.17,16),fur,head,s<0?"Cheek_Tuft_Bot_L":"Cheek_Tuft_Bot_R",[s*.28,-.08,.05]);
  tuftBot.rotation.z=-s*1.38;tuftBot.rotation.y=s*.08;
  const tuftOld=mesh(new THREE.ConeGeometry(.04,.10,12),fur,head,"Wolf_Cheek_Tuft",[s*.28,-.07,.02]);
  tuftOld.visible=false;
 }

 for(const s of [-1,1]){
  const ear=pivot(head,s<0?"Ear_L":"Ear_R",[s*.22,.21,-.015]);
  ear.rotation.z=-s*.13;ear.rotation.x=-.08;
  const outer=mesh(new THREE.ConeGeometry(.10,.26,24),darkFur,ear,"Tall_Wolf_Ear",[0,.09,0],[1,1,.65]);
  outer.rotation.z=-s*.16;
  const inner=mesh(new THREE.ConeGeometry(.055,.16,20),pink,ear,"Ear_Inner",[0,.09,.055],[1,1,.25]);
  inner.rotation.z=-s*.16;
  if(s>0){
   const notch=pivot(ear,"Right_Ear_Notch",[.075,.13,.01]);
   mesh(new RoundedBoxGeometry(.038,.048,.07,2,.01),mat(0x24282c,.95),notch,"Notch_Cut");
  }
 }

 const hat=pivot(head,"Patched_Hat",[-.02,.27,.01]);
 hat.rotation.set(-.14,.06,-.22);
 ellipsoid(hat,"Hat_Crown",hatOrange,[0,.035,0],[.25,.09,.26]);
 ellipsoid(hat,"Hat_Brim",hatOrange,[0,-.01,.02],[.26,.038,.27]);
 ellipsoid(hat,"Hat_Front_Patch",hatPatch,[.14,.046,.18],[.07,.026,.06]);
 const patch=ellipsoid(hat,"Hat_Patch",hatPatch,[.04,.095,-.01],[.12,.024,.13]);
 patch.rotation.y=.25;
 for(let i=0;i<7;i++){
  const ang=(i/7)*Math.PI*1.5-.4;
  const rx=.04+Math.cos(ang)*.105, rz=-.01+Math.sin(ang)*.11;
  curve(hat,"Patch_Stitch_"+i,[
   [rx-Math.sin(ang)*.016,.10,rz+Math.cos(ang)*.016],
   [rx+Math.sin(ang)*.016,.10,rz-Math.cos(ang)*.016]
  ],.0035,ink);
 }

 for(const s of [-1,1]){
  const brow=mesh(new RoundedBoxGeometry(.135,.034,.025,2,.008),ink,head,s<0?"Brow_L":"Brow_R",[s*.132,.155,.22]);
  brow.rotation.z=-s*.06;
  ellipsoid(head,"Wolf_Brow",ink,[s*.132,.155,.22],[.06,.015,.015]).visible=false;
 }

 const eyes=pivot(head,"Eyes",[0,0,0]);
 for(const s of [-1,1]){
  const eye=pivot(eyes,s<0?"Eye_L":"Eye_R",[s*.125,.06,.22]);
  eye.rotation.z=-s*.08;
  ellipsoid(eye,"Wolf_Eye",white,[0,0,0],[.058,.068,.026]);
  const eyelid=ellipsoid(eye,"Upper_Eyelid",fur,[0,.028,.015],[.058,.036,.022]);
  eyelid.rotation.z=s*.08;eyelid.visible=false;
  ellipsoid(eye,"Pupil",ink,[0,-.006,.023],[.029,.037,.011]);
  ellipsoid(eye,"Catchlight",white,[-.012,.010,.032],[.010,.012,.005]);
 }

 ellipsoid(head,"Wolf_Long_Muzzle",fur,[0,-.065,.23],[.165,.095,.18]);
 ellipsoid(head,"Wolf_Nose",ink,[0,-.03,.39],[.068,.046,.036]);
 ellipsoid(head,"Nose_Glint",white,[-.018,-.018,.42],[.015,.009,.005]);

 ellipsoid(head,"Wolf_Jaw",fur,[0,-.15,.20],[.15,.085,.16]);
 ellipsoid(head,"Wolf_Chin_Stubble",stubbleFur,[0,-.165,.21],[.145,.065,.145]);

 const scarGroup=pivot(head,"Face_Stitch",[.18,-.03,.235]);
 scarGroup.rotation.y=.35;
 curve(scarGroup,"Scar_Spine",[[-.03,.08,.005],[0,0,.01],[.035,-.08,.005]],.0032,scarLine);
 for(let i=0;i<4;i++){
  const y=.06-i*.04, x=-.02+i*.015;
  curve(scarGroup,"Stitch_Cross_"+i,[[x-.018,y+.006,.015],[x+.018,y-.006,.015]],.003,scarLine);
 }

 const mouthGroup=pivot(head,"Wolf_Grin",[0,-.118,.345]);
 mesh(new RoundedBoxGeometry(.20,.030,.024,2,.010),white,mouthGroup,"Wolf_Grin_Teeth",[0,-.003,.005]);
 curve(mouthGroup,"Wolf_Mouth",[[-.13,.008,.01],[0,.005,.025],[.13,.008,.01]],.004,ink);
 curve(mouthGroup,"Wolf_Smile",[[-.13,.008,.01],[0,-.022,.022],[.13,.008,.01]],.004,ink);
 curve(mouthGroup,"Smile",[[-.13,.008,.01],[0,-.022,.022],[.13,.008,.01]],.004,ink);
 for(const s of [-1,1]){
  const fang=mesh(new THREE.ConeGeometry(.015,.038,12),white,mouthGroup,s<0?"Fang_L":"Fang_R",[s*.105,-.010,.022]);
  fang.rotation.x=Math.PI;
 }

 for(const [x1,y1,z1,x2,y2,z2] of [
  [-.08,-.17,.28, -.13,-.20,.26],
  [-.10,-.20,.25, -.15,-.23,.23],
  [.08,-.17,.28, .13,-.20,.26],
  [.10,-.20,.25, .15,-.23,.23]
 ]){
  curve(head,"Wolf_Stubble",[[x1,y1,z1],[x2,y2,z2]],.0028,ink);
 }

 const happy=pivot(head,"Happy_Mouth",[0,-.125,.348]);happy.visible=false;
 mesh(new RoundedBoxGeometry(.22,.038,.024,2,.010),white,happy,"Happy_Wolf_Teeth",[0,-.003,.005]);
 curve(happy,"Happy_Wolf_Arc",[[-.14,.010,.01],[0,-.026,.024],[.14,.010,.01]],.0045,ink);
 for(const s of [-1,1]){
  const fang=mesh(new THREE.ConeGeometry(.018,.042,12),white,happy,s<0?"Happy_Fang_L":"Happy_Fang_R",[s*.112,-.014,.022]);
  fang.rotation.x=Math.PI;
 }

 const tail=pivot(root,"Tail",[0,.26,-.18]);
 ellipsoid(tail,"Tail_Base",fur,[0,.04,-.06],[.10,.12,.10]);
 const brush=ellipsoid(tail,"Bushy_Wolf_Tail",fur,[0,.16,-.14],[.14,.20,.14]);
 brush.rotation.x=-.32;
 const tip=ellipsoid(tail,"Tail_White_Tip",tailTip,[0,.29,-.17],[.10,.12,.10]);
 tip.rotation.x=-.32;

 const bow=pivot(root,"Bow",[0,.65,.22]);
 return root;
}
export function createMcqueenModel(){
 const root=new THREE.Group();root.name='Mcqueen_Rig';
 const red=mat(0xd5202b,.34,{metalness:.12}),bright=mat(0xf02d2d,.38),yellow=mat(0xffd43c,.5),dark=mat(0x262d36,.8),rubber=mat(0x292a30,.96),silver=mat(0xcad7da,.5,{metalness:.4}),glass=mat(0xf4fbf5,.3),iris=mat(0x4283bb,.3);
 const box=(parent,name,material,pos,size,r=.08)=>mesh(new RoundedBoxGeometry(...size,4,r),material,parent,name,pos);
 const body=pivot(root,'Torso',[0,.31,0]);
 sculpt([[0,0,0,.40,.19,.64],[0,.07,.36,.38,.16,.37],[0,.09,-.40,.37,.16,.30]],.08,red,body,'Red_Racing_Body');
 const hood=ellipsoid(body,'Front_Hood',bright,[0,.17,.38],[.36,.075,.38]);hood.rotation.x=-.07;
 box(body,'Front_Bumper',red,[0,-.06,.66],[.76,.13,.13],.06);
 box(body,'Rear_Spoiler',red,[0,.29,-.57],[.82,.055,.18],.025);
 for(const s of [-1,1]){ellipsoid(body,'Wheel_Fender',red,[s*.32,.02,.35],[.14,.17,.25]);ellipsoid(body,'Rear_Fender',red,[s*.32,.025,-.38],[.14,.16,.25]);}
 for(const side of [-1,1]){
  const arm=pivot(root,side<0?'Arm_L':'Arm_R',[side*.34,.25,.38]);const leg=pivot(root,side<0?'Leg_L':'Leg_R',[side*.34,.25,-.38]);
  for(const [p,name] of [[arm,'Front_Wheel'],[leg,'Rear_Wheel']]){
   const wheel=mesh(new THREE.CylinderGeometry(.17,.17,.14,28),rubber,p,name,[side*.045,0,0]);wheel.rotation.z=Math.PI/2;
   const hub=mesh(new THREE.CylinderGeometry(.084,.084,.148,24),red,p,'Wheel_Hub',[side*.045,0,0]);hub.rotation.z=Math.PI/2;
   const cap=mesh(new THREE.CylinderGeometry(.033,.033,.155,20),silver,p,'Wheel_Cap',[side*.045,0,0]);cap.rotation.z=Math.PI/2;
  }
  ellipsoid(body,'Headlight',yellow,[side*.28,.10,.655],[.09,.026,.012]);
 }
 const head=pivot(root,'Head',[0,.64,-.13]);
 box(head,'Cabin',red,[0,.02,-.035],[.64,.32,.58],.13);
 const windGeo=new THREE.BufferGeometry();windGeo.setAttribute('position',new THREE.Float32BufferAttribute([-.29,.14,.24,.29,.14,.24,-.28,-.12,.43,.29,.14,.24,.28,-.12,.43,-.28,-.12,.43],3));windGeo.computeVertexNormals();
 const windMat=mat(0xc7e9f2,.35);windMat.side=THREE.DoubleSide;
 mesh(windGeo,windMat,head,'Windshield');
 box(head,'Windshield_Lower_Trim',red,[0,-.13,.39],[.61,.025,.04],.01);
 const eyes=pivot(head,'Eyes',[0,0,0]);
 for(const side of [-1,1]){
  const eye=pivot(eyes,side<0?'Eye_L':'Eye_R',[side*.13,.035,.405]);
  ellipsoid(eye,'Iris',iris,[0,0,0],[.063,.09,.018]);ellipsoid(eye,'Pupil',dark,[0,0,.016],[.034,.06,.012]);ellipsoid(eye,'Catchlight',glass,[-.012,.025,.027],[.014,.018,.006]);
  pivot(head,side<0?'Ear_L':'Ear_R',[side*.3,.15,0]);
 }
 const mouth=pivot(head,'Car_Mouth',[0,-.235,.91]);curve(mouth,'Smile',[[-.19,0,0],[-.10,-.035,.005],[0,-.045,.008],[.10,-.035,.005],[.19,0,0]],.012,dark);
 const happy=ellipsoid(mouth,'Happy_Mouth',dark,[0,-.028,.01],[.17,.052,.01]);happy.visible=false;
 const tongue=ellipsoid(mouth,'Happy_Tongue',mat(0xf09a86,.7),[0,-.052,.022],[.07,.016,.006]);tongue.visible=false;
 const bolt=new THREE.Shape();bolt.moveTo(-.09,.06);bolt.lineTo(.01,.06);bolt.lineTo(-.025,-.015);bolt.lineTo(.10,-.015);bolt.lineTo(-.065,-.14);bolt.lineTo(-.03,-.05);bolt.lineTo(-.11,-.05);bolt.closePath();
 const mark=mesh(new THREE.ShapeGeometry(bolt),yellow,body,'Lightning_Bolt',[0,.221,.39]);mark.rotation.x=-Math.PI/2;
 const white=mat(0xfff3ca,.6);
 curve(body,'Race_Number_9',[[-.18,.224,.45],[-.18,.224,.38],[-.12,.224,.38],[-.12,.224,.45],[-.18,.224,.45],[-.12,.224,.45],[-.12,.224,.53]],.008,white);
 curve(body,'Race_Number_5',[[.16,.224,.38],[.10,.224,.38],[.10,.224,.45],[.16,.224,.45],[.16,.224,.53],[.10,.224,.53]],.008,white);
 // Bold side lightning makes the racer recognisable from the side as it drives away.
 for(const side of [-1,1]){
  const stripe=mesh(new THREE.ShapeGeometry(bolt),yellow,body,'Side_Lightning',[side*.427,.04,.04]);stripe.rotation.y=side*Math.PI/2;stripe.rotation.z=-Math.PI/2;stripe.scale.setScalar(1.5);
  const x=side*.445;
  curve(body,'Side_Number_9',[[x,.14,-.28],[x,.14,-.20],[x,.09,-.20],[x,.09,-.28],[x,.14,-.28],[x,.09,-.20],[x,.02,-.20],[x,.02,-.28]],.007,white);
  curve(body,'Side_Number_5',[[x,.14,-.08],[x,.14,.01],[x,.09,.01],[x,.09,-.08],[x,.02,-.08],[x,.02,.01]],.007,white);
 }
 const bow=pivot(root,'Bow',[0,.50,.52]);
 pivot(root,'Tail',[0,.4,-.65]);return root;
}

// Upright shepherd ears and the police uniform distinguish Chase from the house puppy.
export function createChaseModel(){
 const root=createDogModel();root.name='Chase_Rescue_Pup';
 const brown=mat(0xa9723e,.95),tan=mat(0xe9b77d,.95),earBrown=mat(0x7c5231,.95),
  navy=mat(0x2453a0,.8),deep=mat(0x1a3c78,.85),sky=mat(0x3f7fd6,.72),
  gold=mat(0xf3cd52,.55),ink=mat(0x263447,.6),white=mat(0xf5f8ff,.5),
  mouthDark=mat(0x381520,.95),tonguePink=mat(0xf36e84,.88),teethWhite=mat(0xfbfbf8,.8),whiskerBrown=mat(0x56341d,.85);
 // 毛色：金棕身体 + 浅棕口鼻/胸口/爪尖/尾尖
 for(const name of ['Puppy_Plump_Body','Puppy_Head','Foreleg','Hind_Paw','Wagging_Tail'])root.traverse(o=>{if(o.name===name&&o.isMesh)o.material=brown;});
 for(const name of ['Cream_Chest','Cream_Muzzle','Cream_Forepaw','Cream_Hind_Toes','Cream_Tail_Tip'])root.traverse(o=>{if(o.name===name&&o.isMesh)o.material=tan;});
 const patch=root.getObjectByName('Honey_Eye_Patch');if(patch)patch.visible=false;
 const chest=root.getObjectByName('Cream_Chest');if(chest)chest.visible=false;
 // 竖立牧羊犬耳朵，从帽檐两侧形成清楚的剪影。
 for(const side of ['L','R']){
  const earPivot=root.getObjectByName('Ear_'+side);earPivot.clear();earPivot.rotation.set(0,0,0);
  const s=side==='L'?-1:1;earPivot.rotation.z=-s*.12;
  const outer=mesh(new THREE.ConeGeometry(.105,.30,24),earBrown,earPivot,'Shepherd_Point_Ear',[0,.11,-.015],[1,1,.60]);outer.rotation.z=-s*.08;
  const inner=mesh(new THREE.ConeGeometry(.064,.205,24),tan,earPivot,'Shepherd_Inner_Ear',[0,.115,.052],[1,1,.22]);inner.rotation.z=-s*.08;
 }
 // 合身蓝色警服：外壳式夹克包住背部和两侧，浅蓝胸襟 + 纽扣 + 肩章
 const body=root.getObjectByName('Torso');
 ellipsoid(body,'Blue_Rescue_Vest',navy,[0,.01,-.02],[.365,.405,.30]);
 ellipsoid(body,'Vest_Front',sky,[0,.05,.262],[.12,.14,.032]);
 curve(body,'Vest_Zipper',[[0,-.07,.288],[0,.15,.288]],.007,deep);
 for(const s of [-1,1]){
  ellipsoid(body,'Vest_Shoulder',navy,[s*.195,.19,.10],[.105,.075,.115]);
  ellipsoid(body,'Shoulder_Patch',sky,[s*.21,.20,.10],[.05,.035,.075]);
 }
 for(const y of [.09,-.02])ellipsoid(body,'Uniform_Button',gold,[0,y,.292],[.017,.017,.009]);
 // 背部警用背包 + 顶部警灯
 mesh(new RoundedBoxGeometry(.40,.32,.16,4,.06),deep,body,'Rescue_Backpack',[0,.10,-.30]);
 ellipsoid(body,'Backpack_Top',navy,[0,.27,-.28],[.14,.045,.10]);
 ellipsoid(body,'Backpack_Light',gold,[0,.29,-.20],[.032,.032,.016]);
 // 立体警帽：圆顶 + 帽墙 + 帽檐 + 金色爪印警徽
 const head=root.getObjectByName('Head');const hatNode=pivot(head,'Police_Cap',[0,.24,-.005]);
 ellipsoid(hatNode,'Cap_Crown',navy,[0,.035,0],[.265,.115,.23]);
 ellipsoid(hatNode,'Cap_Band',deep,[0,-.05,.005],[.272,.042,.238]);
 ellipsoid(hatNode,'Cap_Brim',deep,[0,-.062,.17],[.25,.026,.125]);
 ellipsoid(hatNode,'Cap_Visor_Glint',sky,[0,-.058,.20],[.16,.012,.06]);
 ellipsoid(hatNode,'Cap_Badge',gold,[0,.03,.222],[.058,.062,.015]);
 ellipsoid(hatNode,'Badge_Center',deep,[0,.03,.236],[.024,.03,.008]);
 for(const [x,y,r] of [[0,.042,.007],[-.014,.056,.006],[.014,.056,.006],[-.011,.036,.006],[.011,.036,.006]])
  ellipsoid(hatNode,'Cap_Paw',gold,[x,y,.242],[r,r*1.1,.004]);
 for(const s of [-1,1]){
  const brow=ellipsoid(head,s<0?'Shepherd_Brow_L':'Shepherd_Brow_R',earBrown,[s*.13,.105,.226],[.10,.043,.021]);brow.rotation.z=s*.16;
  ellipsoid(head,'Shepherd_Cheek',tan,[s*.17,-.105,.20],[.105,.09,.045]);
 }
 // 深度优化阿奇的面部神态与嘴部结构：重构下颌、口鼻雀斑、犬齿与精致小舌，彻底摆脱吊死肉片感
 const oldHappy=head.getObjectByName('Happy_Mouth');if(oldHappy)head.remove(oldHappy);
 const oldTongue=head.getObjectByName('Happy_Tongue');if(oldTongue)head.remove(oldTongue);
 // 德牧立体下颌（自然平滑收敛，彻底移除突兀的人类下唇线）
 ellipsoid(head,'Chase_Lower_Jaw',tan,[0,-.178,.272],[.094,.038,.075]);
 // 经典口鼻雀斑胡须点（PAW Patrol 标志性特征，左右各 3 点）
 for(const s of [-1,1]){
  for(const [x,y] of [[.052,-.095],[.082,-.108],[.058,-.122]])
   ellipsoid(head,'Chase_Whisker_Dot',whiskerBrown,[s*x,y,.330],[.0045,.0045,.0025]);
 }
 // 帅气元气大笑嘴：深李色立体口腔 + 两颗洁白可爱的小上犬牙
 const happyMouth=pivot(head,'Happy_Mouth',[0,-.146,.334]);happyMouth.visible=false;
 ellipsoid(happyMouth,'Happy_Mouth_Cavity',mouthDark,[0,0,0],[.065,.046,.016]);
 for(const s of [-1,1]){
  const canine=ellipsoid(happyMouth,s<0?'Chase_Canine_L':'Chase_Canine_R',teethWhite,[s*.036,.016,.007],[.006,.011,.006]);
  canine.rotation.z=s*.15;
 }
 // 精致健康萌萌小舌头：严格居中、自然受纳于下唇、舌尖微翘，不再突兀下垂
 const happyTongue=ellipsoid(head,'Happy_Tongue',tonguePink,[0,-.158,.342],[.034,.022,.012]);
 happyTongue.rotation.x=-.22;
 happyTongue.visible=false;
 // 胸前警徽（挂在 Bow 节点，动画兼容）
 const bow=root.getObjectByName('Bow');bow.clear();
 ellipsoid(bow,'Collar_Badge',gold,[0,0,.035],[.06,.068,.02]);
 ellipsoid(bow,'Badge_Inset',sky,[0,0,.054],[.032,.042,.008]);
 ellipsoid(bow,'Badge_Star',white,[0,0,.062],[.012,.012,.005]);
 return root;
}
// 《超级飞侠》（Super Wings）主角——乐迪（Jett）：
// 官方 3D 原画与变形机甲深度重构：
// 1. 彻底移除人形白肉脸、人形腮红与大头娃娃结构，回归纯正的红色喷气式飞机机器人！
// 2. 挡风玻璃驾驶舱即眼睛视窗（Cockpit Windshield）：天蓝色流线弧形玻璃罩直接嵌双眼；
// 3. 宝石蓝大眼睛、流线型红色机鼻、机腹下颚与亲切自信的飞行微笑嘴；
// 4. 标志性黄色喷气进气口耳麦（带白色外环与红色小翼）、机顶红色背鳍与黄色警示灯；
// 5. 鲜红机身配白色机腹、胸前金色超级飞侠飞翼徽章、后置双联装喷气尾喷口；
// 6. 红色后掠主翼配白色翼梢、挂载亮黄色喷气涡轮引擎（黑涡轮前罩与银色喷管）；
// 7. 白色机械手臂带红腕带、红色起落架滑行靴（靴侧嵌黄色机轮与黑色橡胶胎）。
export function createJettModel(){
 const root=new THREE.Group();root.name='Jett_Airplane_Rig';
 const red=mat(0xeb2629,.30,{metalness:.15,roughness:.25}),
       white=mat(0xf8fafc,.35,{metalness:.08,roughness:.30}),
       yellow=mat(0xfacc15,.30,{metalness:.12,roughness:.32}),
       windshieldBlue=mat(0x38bdf8,.28,{metalness:.10,roughness:.15}),
       eyeWhite=mat(0xffffff,.25),
       eyeBlue=mat(0x1d4ed8,.30),
       dark=mat(0x0f172a,.75),
       gold=mat(0xf59e0b,.30,{metalness:.45,roughness:.25}),
       pink=mat(0xf43f5e,.85),
       silver=mat(0xd1d5db,.35,{metalness:.50,roughness:.25}),
       rubber=mat(0x1e293b,.95);

 // --- 一、 躯干（流线型红色喷气机身） ---
 const body=pivot(root,'Torso',[0,.40,0]);
 ellipsoid(body,'Red_Fuselage',red,[0,.02,0],[.29,.34,.25]);
 ellipsoid(body,'White_Front',white,[0,.025,.195],[.19,.22,.055]);

 // 机尾后置双联装喷气推进器
 for(const s of [-1,1]){
  mesh(new THREE.CylinderGeometry(.052,.062,.13,16),dark,body,'Jet_Exhaust',[s*.13,-.14,-.18]);
  ellipsoid(body,'Exhaust_Flame_Glow',yellow,[s*.13,-.21,-.18],[.035,.022,.035]);
 }

 // --- 二、 头部（流线型喷气机头 + 驾驶舱风挡双眼） ---
 // 头部即机头前半部，与机身一体流线衔接
 const head=pivot(root,'Head',[0,.82,.04]);
 ellipsoid(head,'Red_Airplane_Head',red,[0,0,0],[.33,.31,.30]);

 // 2.1 标志性天蓝色弧形大风挡驾驶舱（Cockpit Windshield Canopy）
 // 飞机的驾驶舱玻璃直接充当眼睛所在视窗，彻底告别人形大白脸！
 const windshield=ellipsoid(head,'Cockpit_Windshield',windshieldBlue,[0,.055,.195],[.27,.175,.145]);
 windshield.rotation.x=-.22;
 // 风挡流线高光弧带
 const glint=ellipsoid(head,'Windshield_Glint',white,[0,.145,.255],[.18,.018,.04]);
 glint.rotation.x=-.25;
 // 驾驶舱顶流线型机头眉檐（Helmet_Brow - 测试必检节点）
 const browRim=ellipsoid(head,'Helmet_Brow',red,[0,.155,.215],[.275,.042,.115]);
 browRim.rotation.x=-.30;

 // 2.2 嵌入天蓝风挡玻璃的大眼睛（卡通机器大眼）
 const eyes=pivot(head,'Eyes',[0,0,0]);
 for(const s of [-1,1]){
  const eye=pivot(eyes,s<0?'Eye_L':'Eye_R',[s*.115,.050,.265]);
  eye.rotation.y=s*.08;
  // 洁白透亮的大眼白
  ellipsoid(eye,'Eye_White',eyeWhite,[0,0,0],[.066,.095,.026]);
  // 乐迪标志性宝石蓝大虹膜
  ellipsoid(eye,'Iris',eyeBlue,[0,-.005,.018],[.052,.074,.014]);
  // 深邃纯黑大瞳孔
  ellipsoid(eye,'Eye',dark,[0,-.008,.026],[.030,.045,.010]);
  // 双层清澈水珠高光
  ellipsoid(eye,'Catchlight',white,[s*-.018,.028,.034],[.016,.020,.006]);
  ellipsoid(eye,'Catchlight_Small',white,[s*.016,-.022,.032],[.008,.010,.004]);
  // 机体红色飞行动感眉线
  curve(head,s<0?'Brow_L':'Brow_R',[[s*.055,.145,.260],[s*.115,.165,.255],[s*.175,.135,.240]],.0065,red);
 }

 // 2.3 风挡下方的红色流线前机鼻（Jet Nose Cone）
 const noseCone=ellipsoid(head,'Jet_Nose_Cone',red,[0,-.065,.265],[.085,.060,.075]);
 noseCone.rotation.x=.15;

 // 2.4 机头下半部白色机腹下颚与微笑嘴（White Lower Fuselage Chin & Smile）
 const lowerChin=ellipsoid(head,'Lower_Fuselage_Chin',white,[0,-.135,.185],[.24,.125,.135]);
 lowerChin.rotation.x=.25;
 // 亲切开朗的飞机微笑嘴
 curve(head,'Smile',[[-.115,-.145,.275],[0,-.185,.285],[.115,-.145,.275]],.0075,dark);
 // 欢庆胜利开怀大笑（超大开朗机身笑弧，彻底告别人类黑洞与粉红肉舌）
 const happy=pivot(head,'Happy_Mouth',[0,-.155,.280]);happy.visible=false;
 curve(happy,'Happy_Smile_Arc',[[-.135,-.005,0],[-.06,-.040,.012],[0,-.046,.015],[.06,-.040,.012],[.135,-.005,0]],.009,dark);
 curve(happy,'Happy_Corner_L',[[-.135,-.005,0],[-.142,.015,-.002]],.0075,dark);
 curve(happy,'Happy_Corner_R',[[.135,-.005,0],[.142,.015,-.002]],.0075,dark);

 // 2.5 两侧标志性黄色喷气式进气口耳麦（Headset_Pod - 带白圈与红天线）
 for(const s of [-1,1]){
  const ear=pivot(head,s<0?'Ear_L':'Ear_R',[s*.31,.04,.01]);
  const earCup=mesh(new THREE.CylinderGeometry(.085,.085,.072,24),yellow,ear,'Headset_Pod',[s*.02,0,0]);
  earCup.rotation.z=Math.PI/2;
  const earRing=mesh(new THREE.CylinderGeometry(.090,.090,.022,24),white,ear,'Headset_Ring',[s*.055,0,0]);
  earRing.rotation.z=Math.PI/2;
  ellipsoid(ear,'Headset_Speaker',dark,[s*.066,0,0],[.008,.045,.045]);
  ellipsoid(ear,'Jet_Side_Piece',red,[s*.015,0,0],[.055,.07,.08]);
  // 红色小翼天线，后掠倾角
  const antenna=ellipsoid(ear,'Headset_Antenna',red,[s*.02,.085,-.025],[.016,.040,.022]);
  antenna.rotation.x=-.45;
 }

 // 2.6 机顶背脊导流鳍与黄色警示灯
 const topFinShape=new THREE.Shape();
 topFinShape.moveTo(-.025,0);topFinShape.lineTo(0,.135);topFinShape.lineTo(.045,0);topFinShape.closePath();
 const topFin=mesh(new THREE.ExtrudeGeometry(topFinShape,{depth:.018,bevelEnabled:true,bevelSize:.006,bevelThickness:.005}),red,head,'Head_Top_Fin',[0,.235,.01]);
 topFin.rotation.y=Math.PI/2;
 ellipsoid(head,'Head_Beacon',yellow,[0,.230,.175],[.025,.020,.025]);

 // --- 三、 机翼与黄色喷气引擎（Airplane Wings & Jet Turbines） ---
 for(const s of [-1,1]){
  const wing=pivot(body,s<0?'Wing_L':'Wing_R',[s*.24,.08,-.06]);
  const shape=new THREE.Shape();
  shape.moveTo(0,.10);shape.lineTo(s*.56,-.05);shape.lineTo(s*.50,-.24);shape.lineTo(0,-.13);shape.closePath();
  mesh(new THREE.ExtrudeGeometry(shape,{depth:.032,bevelEnabled:true,bevelSize:.012,bevelThickness:.008,bevelSegments:2}),red,wing,'Airplane_Wing');
  ellipsoid(wing,'Wing_Tip',white,[s*.44,-.15,.028],[.085,.055,.034]);
  const stripe=ellipsoid(wing,'Wing_Stripe',white,[s*.26,-.095,.038],[.14,.016,.01]);stripe.rotation.z=-s*.22;
  // 标志性亮黄色圆柱喷气式涡轮引擎（Jet_Engine）
  const pod=mesh(new THREE.CylinderGeometry(.046,.046,.27,20),yellow,wing,'Jet_Engine',[s*.21,-.11,-.04]);pod.rotation.x=Math.PI/2;
  ellipsoid(wing,'Engine_Intake',dark,[s*.21,-.11,.095],[.042,.042,.015]);
  ellipsoid(wing,'Engine_Nozzle',silver,[s*.21,-.11,-.175],[.04,.04,.02]);
 }

 // --- 四、 机械手臂（白色机械臂带红腕套） ---
 for(const s of [-1,1]){
  const arm=pivot(root,s<0?'Arm_L':'Arm_R',[s*.28,.53,.02]);
  ellipsoid(arm,'Red_Shoulder',red,[0,0,0],[.07,.07,.07]);
  ellipsoid(arm,'White_Arm',white,[s*.03,-.11,0],[.065,.13,.065]);
  ellipsoid(arm,'Red_Wrist_Cuff',red,[s*.035,-.19,.01],[.07,.035,.07]);
  ellipsoid(arm,'Red_Hand',red,[s*.035,-.24,.025],[.08,.065,.08]);
  ellipsoid(arm,'White_Hand',white,[s*.04,-.25,.02],[.07,.06,.06]);
  ellipsoid(arm,'Hand_Thumb',white,[s*.07,-.23,.045],[.025,.035,.025]);
 }

 // --- 五、 飞行滑跑起落架腿（红色滑行靴嵌黄色机轮） ---
 for(const s of [-1,1]){
  const leg=pivot(root,s<0?'Leg_L':'Leg_R',[s*.15,.20,0]);
  ellipsoid(leg,'White_Leg',white,[0,-.05,.01],[.08,.11,.08]);
  ellipsoid(leg,'Red_Boot',red,[0,-.14,.06],[.10,.075,.14]);
  ellipsoid(leg,'Boot_Sole',white,[0,-.20,.07],[.095,.022,.135]);
  const hub=mesh(new THREE.CylinderGeometry(.042,.042,.022,16),yellow,leg,'Boot_Wheel_Hub',[s*.095,-.15,.03]);hub.rotation.z=Math.PI/2;
  const tire=mesh(new THREE.CylinderGeometry(.046,.046,.016,16),rubber,leg,'Boot_Wheel_Tire',[s*.098,-.15,.03]);tire.rotation.z=Math.PI/2;
  ellipsoid(leg,'Boot_Thruster',yellow,[0,-.14,-.07],[.035,.035,.02]);
 }

 // --- 六、 垂直尾翼与水平尾翼（Tail Fin） ---
 const tail=pivot(root,'Tail',[0,.54,-.22]);
 const finShape=new THREE.Shape();
 finShape.moveTo(-.04,0);finShape.lineTo(-.01,.34);finShape.lineTo(.06,.34);finShape.lineTo(.08,0);finShape.closePath();
 mesh(new THREE.ExtrudeGeometry(finShape,{depth:.025,bevelEnabled:true,bevelSize:.01,bevelThickness:.006,bevelSegments:2}),red,tail,'Tail_Fin');
 ellipsoid(tail,'Tail_Fin_Tip',white,[.02,.34,.012],[.045,.022,.015]);
 for(const s of [-1,1]){
  const hWing=ellipsoid(tail,s<0?'Tail_Wing_L':'Tail_Wing_R',red,[s*.15,.08,.02],[.12,.018,.07]);hWing.rotation.z=s*.08;
  ellipsoid(tail,s<0?'Tail_Wing_Tip_L':'Tail_Wing_Tip_R',white,[s*.24,.09,.02],[.035,.014,.03]);
 }

 // --- 七、 胸前超级飞侠金色飞翼徽章（Super Wings Chest Crest） ---
 const bow=pivot(root,'Bow',[0,.58,.24]);
 ellipsoid(bow,'Chest_Star',gold,[0,0,0],[.065,.05,.016]);
 ellipsoid(bow,'Badge_Wing_L',gold,[-.075,.01,-.004],[.05,.025,.01]);
 ellipsoid(bow,'Badge_Wing_R',gold,[.075,.01,-.004],[.05,.025,.01]);
 ellipsoid(bow,'Badge_Center',windshieldBlue,[0,0,.012],[.032,.032,.008]);
 ellipsoid(bow,'Badge_Star',gold,[0,0,.018],[.014,.014,.005]);

 return root;
}

export function createPeppaModel(){
 const root=new THREE.Group();root.name='Peppa_Pig_Rig';
 // 按官方卡通形象深度设计：经典吹风机头型、大圆头直接坐在红裙上（无脖子）、
 // 扁宽梯形红裙、细枝手臂水平外伸、细腿配黑扁鞋；双眼高聚拢、猪鼻上移前突。
 const pink=mat(0xf6aebb,.92),light=mat(0xffc9d4,.9),red=mat(0xd93442,.9),dark=mat(0x4a3038,.5),cheek=mat(0xef8ba3,.9),white=mat(0xfffdf8,.7),shoe=mat(0x352c31,.8);
 // 官方经典深洋红线条色与红润口腔色彩
 const smileMat=mat(0xba1d50,.85),mouthInnerMat=mat(0x8a1038,.9),tongueMat=mat(0xf58aa4,.9);

 // 扁宽梯形红裙：纸片人式的扁平正面，下摆外扩
 const body=pivot(root,'Torso',[0,.38,0]);
 sculpt([[0,-.13,0,.28,.22,.15],[0,.02,0,.20,.20,.13],[0,.16,0,.13,.11,.11]],.035,red,body,'Red_Dress');
 // 大圆头：比裙子还宽，佩奇的标志性大头比例
 const head=pivot(root,'Head',[0,.90,.01]);
 sculpt([[.035,0,0,.285,.265,.24],[-.15,.035,.11,.17,.14,.19],[-.24,.045,.24,.105,.105,.12]],.045,pink,head,'Pink_Pig_Head');
 // 猪鼻：上移到脸中上部水平前突（加大突出感），双竖椭圆鼻孔在鼻头前端
 const snout=ellipsoid(head,'Pig_Snout',light,[-.265,.035,.335],[.102,.095,.055]);snout.rotation.y=-.18;
 for(const x of [-.305,-.237])ellipsoid(head,'Nostril',cheek,[x,.042,.386],[.016,.028,.009]);
 ellipsoid(head,'Rosy_Cheek',cheek,[.16,-.075,.205],[.064,.053,.013]);
 // 眼睛：小巧圆润、高高聚在头顶下方（官方形象的眼睛位置）
 const eyes=pivot(head,'Eyes',[0,0,0]);
 for(const [side,x] of [['L',-.055],['R',.105]]){
  const eye=pivot(eyes,'Eye_'+side,[x,.165,.215]);
  ellipsoid(eye,'Eye_White',white,[0,0,0],[.053,.062,.023]);
  ellipsoid(eye,'Pupil',dark,[-.008,.004,.021],[.022,.029,.009]);
  ellipsoid(eye,'Catchlight',white,[-.005,.013,.031],[.007,.008,.003]);
 }
 // 小圆耳朵：立起贴头顶，间距收窄
 for(const s of [-1,1]){
  const ear=pivot(head,s<0?'Ear_L':'Ear_R',[s*.10,.25,-.01]);ear.rotation.z=-s*.08;
  ellipsoid(ear,'Pig_Ear',pink,[0,.04,0],[.046,.075,.028]);
  ellipsoid(ear,'Inner_Ear',light,[0,.043,.022],[.024,.05,.008]);
 }

 // 官方动画原汁原味大微笑：深洋红大圆弯弧，两头带标志性微翘笑窝
 const smileGroup=pivot(head,'Pig_Smile',[-.025,-.10,.222]);
 smileGroup.rotation.set(-.12,.15,-.06);
 const smileCurve=new THREE.CubicBezierCurve3(
  new THREE.Vector3(-.09,.015,.002),
  new THREE.Vector3(-.05,-.050,.002),
  new THREE.Vector3(.03,-.045,.002),
  new THREE.Vector3(.065,.018,.002)
 );
 mesh(new THREE.TubeGeometry(smileCurve,32,.0055,10,false),smileMat,smileGroup,'Smile_Arc');
 const leftCorner=new THREE.QuadraticBezierCurve3(
  new THREE.Vector3(-.09,.015,.002),
  new THREE.Vector3(-.098,.026,.002),
  new THREE.Vector3(-.088,.036,.002)
 );
 mesh(new THREE.TubeGeometry(leftCorner,12,.005,8,false),smileMat,smileGroup,'Smile_Corner_L');
 const rightCorner=new THREE.QuadraticBezierCurve3(
  new THREE.Vector3(.065,.018,.002),
  new THREE.Vector3(.075,.028,.002),
  new THREE.Vector3(.068,.036,.002)
 );
 mesh(new THREE.TubeGeometry(rightCorner,12,.005,8,false),smileMat,smileGroup,'Smile_Corner_R');
 const stdSmile=pivot(head,'Smile',[-.025,-.10,.222]); // 兼容通用Smile节点

 // 官方原画线条表情系统：取消诡异的3D挖洞张嘴，纯靠嘴角上扬与下撇表达情感
 // ① 生气/被困/委屈（嘴角向下撇嘴倒弧 + 向下撇嘴窝）
 const frownGroup=pivot(head,'Pig_Frown',[-.025,-.10,.222]);
 frownGroup.rotation.set(-.12,.15,-.06);
 frownGroup.visible=false;
 const frownCurve=new THREE.CubicBezierCurve3(
  new THREE.Vector3(-.085,-.022,.002),
  new THREE.Vector3(-.045,.015,.002),
  new THREE.Vector3(.035,.012,.002),
  new THREE.Vector3(.060,-.020,.002)
 );
 mesh(new THREE.TubeGeometry(frownCurve,32,.0055,10,false),smileMat,frownGroup,'Frown_Arc');
 const leftFrownCorner=new THREE.QuadraticBezierCurve3(
  new THREE.Vector3(-.085,-.022,.002),
  new THREE.Vector3(-.092,-.032,.002),
  new THREE.Vector3(-.084,-.040,.002)
 );
 mesh(new THREE.TubeGeometry(leftFrownCorner,12,.005,8,false),smileMat,frownGroup,'Frown_Corner_L');
 const rightFrownCorner=new THREE.QuadraticBezierCurve3(
  new THREE.Vector3(.060,-.020,.002),
  new THREE.Vector3(.068,-.030,.002),
  new THREE.Vector3(.062,-.038,.002)
 );
 mesh(new THREE.TubeGeometry(rightFrownCorner,12,.005,8,false),smileMat,frownGroup,'Frown_Corner_R');

 // ② 开心大笑/通关欢呼/说话（嘴角大幅高高扬起的招牌超大开朗笑弧）
 const happyGroup=pivot(head,'Happy_Mouth',[-.025,-.10,.222]);
 happyGroup.rotation.set(-.12,.15,-.06);
 happyGroup.visible=false;
 const happySmileCurve=new THREE.CubicBezierCurve3(
  new THREE.Vector3(-.098,.025,.002),
  new THREE.Vector3(-.055,-.062,.002),
  new THREE.Vector3(.035,-.056,.002),
  new THREE.Vector3(.075,.028,.002)
 );
 mesh(new THREE.TubeGeometry(happySmileCurve,32,.006,10,false),smileMat,happyGroup,'Happy_Smile_Arc');
 const leftHappyCorner=new THREE.QuadraticBezierCurve3(
  new THREE.Vector3(-.098,.025,.002),
  new THREE.Vector3(-.108,.038,.002),
  new THREE.Vector3(-.095,.050,.002)
 );
 mesh(new THREE.TubeGeometry(leftHappyCorner,12,.0055,8,false),smileMat,happyGroup,'Happy_Corner_L');
 const rightHappyCorner=new THREE.QuadraticBezierCurve3(
  new THREE.Vector3(.075,.028,.002),
  new THREE.Vector3(.088,.040,.002),
  new THREE.Vector3(.078,.052,.002)
 );
 mesh(new THREE.TubeGeometry(rightHappyCorner,12,.0055,8,false),smileMat,happyGroup,'Happy_Corner_R');
 const dummyTongue=pivot(happyGroup,'Happy_Tongue',[0,0,0]);dummyTongue.visible=false;

 // 细枝手臂：从裙肩水平外伸（参考图的张开手臂），末端圆手
 for(const s of [-1,1]){
  const arm=pivot(root,s<0?'Arm_L':'Arm_R',[s*.175,.50,.01]);
  ellipsoid(arm,'Pig_Arm',pink,[s*.085,-.01,0],[.115,.038,.038]);
  ellipsoid(arm,'Pig_Hand',light,[s*.165,-.012,.005],[.05,.048,.048]);
 }
 // 细腿 + 黑扁鞋
 for(const s of [-1,1]){
  const leg=pivot(root,s<0?'Leg_L':'Leg_R',[s*.09,.16,0]);
  ellipsoid(leg,'Pig_Leg',pink,[0,-.045,0],[.036,.08,.036]);
  ellipsoid(leg,'Black_Shoe',shoe,[0,-.115,.04],[.075,.045,.105]);
 }
 // 卷卷尾巴：绕一圈的小螺旋
 const tail=pivot(root,'Tail',[0,.36,-.15]);
 curve(tail,'Curly_Pig_Tail',[[0,0,0],[.045,.028,-.014],[.078,.068,-.018],[.062,.105,-.018],[.026,.105,-.018],[.018,.072,-.018],[.038,.048,-.018]],.012,pink);
 pivot(root,'Bow',[.155,1.12,.06]);
 return root;
}
export function createThomasModel(){
 const root=new THREE.Group();root.name='Thomas_Train_Rig';
 const blue=mat(0x1f7ac4,.5,{metalness:.1}),blueDark=mat(0x1967a8,.55,{metalness:.1}),
  black=mat(0x2b2f36,.82),red=mat(0xd23b3b,.7),redDark=mat(0xb02c2c,.75),
  gray=mat(0xdfe4e0,.78),grayDark=mat(0xbac0bb,.8),
  dark=mat(0x3a4148,.6),white=mat(0xffffff,.55),
  gold=mat(0xf0c432,.6,{metalness:.25}),brass=mat(0xd4a84a,.5,{metalness:.35});
 const box=(parent,name,material,pos,size,r=.04)=>mesh(new RoundedBoxGeometry(...size,4,r),material,parent,name,pos);
 const body=pivot(root,'Torso',[0,.32,0]);
 // Boiler (main cylindrical blue body)
 const boiler=mesh(new THREE.CylinderGeometry(.285,.285,.88,36),blue,body,'Blue_Boiler',[0,.17,.02]);boiler.rotation.x=Math.PI/2;
 // Red boiler stripes (two thin red bands)
 for(const z of [-.12,.22]){
  const stripe=mesh(new THREE.CylinderGeometry(.289,.289,.018,36),red,body,'Boiler_Stripe',[0,.17,z]);stripe.rotation.x=Math.PI/2;
 }
 // Chassis / running board base
 box(body,'Chassis_Base',blueDark,[0,-.06,0],[.62,.16,1.18],.05);
 // Side tanks (blue boxes on both sides with number 1)
 for(const s of [-1,1]){
  box(body,'Side_Tank',blue,[s*.305,.05,-.04],[.075,.24,.60],.03);
  // Yellow number 1 outlined in red on side tank
  box(body,'Number_Backplate',red,[s*.348,.05,-.04],[.01,.16,.10],.01);
  const oneShape=new THREE.Shape();oneShape.moveTo(-.018,.055);oneShape.lineTo(.018,.055);oneShape.lineTo(.018,-.06);oneShape.lineTo(-.018,-.06);oneShape.lineTo(-.018,-.05);oneShape.lineTo(.008,-.05);oneShape.lineTo(.008,.045);oneShape.lineTo(-.018,.045);oneShape.closePath();
  const numMesh=mesh(new THREE.ExtrudeGeometry(oneShape,{depth:.012,bevelEnabled:false}),gold,body,'Number_One',[s*.35,.05,-.04]);numMesh.rotation.y=s*Math.PI/2;
 }
 // Running board (black platform along bottom sides)
 for(const s of [-1,1]){
  box(body,'Running_Board',black,[s*.325,-.025,-.02],[.035,.025,.90],.01);
 }
 // Red buffer beam at front
 box(body,'Red_Buffer_Beam',red,[0,-.06,.58],[.76,.14,.12],.035);
 // Smokebox front ring
 mesh(new THREE.TorusGeometry(.272,.022,12,44),black,body,'Smokebox_Ring',[0,.17,.47]);
 // Cab (rear cabin)
 box(body,'Blue_Cab',blue,[0,.34,-.40],[.66,.50,.44],.07);
 box(body,'Cab_Roof',black,[0,.60,-.40],[.72,.08,.48],.03);
 // Cab windows (front and sides)
 box(body,'Cab_Front_Window',dark,[0,.36,-.185],[.42,.24,.018],.03);
 for(const s of [-1,1]){
  box(body,'Cab_Side_Window',dark,[s*.336,.36,-.38],[.018,.22,.22],.02);
 }
 // Funnel (tall black chimney with rim cap)
 const funnel=mesh(new THREE.CylinderGeometry(.085,.072,.30,28),black,body,'Train_Funnel',[0,.52,.24]);
 mesh(new THREE.CylinderGeometry(.098,.098,.04,28),black,body,'Funnel_Cap',[0,.68,.24]);
 // Whistle (small brass whistle on boiler)
 mesh(new THREE.CylinderGeometry(.022,.022,.05,16),brass,body,'Train_Whistle_Base',[.18,.50,.06]);
 mesh(new THREE.SphereGeometry(.026,16,12),brass,body,'Train_Whistle_Ball',[.18,.54,.06]);
 // Steam dome (brass dome on boiler)
 ellipsoid(body,'Steam_Dome',brass,[0,.47,-.08],[.10,.072,.10]);
 mesh(new THREE.CylinderGeometry(.102,.102,.025,24),brass,body,'Dome_Base_Ring',[0,.44,-.08]);
 // Coupling hook at rear
 ellipsoid(body,'Rear_Coupling',black,[0,-.04,-.62],[.05,.05,.035]);
 // Wheels (black with red hubs) — front wheels = Arm, rear wheels = Leg
 for(const s of [-1,1]){
  const arm=pivot(root,s<0?'Arm_L':'Arm_R',[s*.31,.14,.30]);
  const leg=pivot(root,s<0?'Leg_L':'Leg_R',[s*.31,.14,-.30]);
  for(const [p,isFront] of [[arm,true],[leg,false]]){
   const wheel=mesh(new THREE.CylinderGeometry(.155,.155,.115,32),black,p,'Train_Wheel',[s*.055,0,0]);wheel.rotation.z=Math.PI/2;
   // Red hub
   const hub=mesh(new THREE.CylinderGeometry(.062,.062,.125,24),red,p,'Wheel_Hub',[s*.055,0,0]);hub.rotation.z=Math.PI/2;
   // Red spokes
   for(let i=0;i<4;i++){const a=i*Math.PI/4;const spoke=mesh(new THREE.BoxGeometry(.018,.135,.125),red,p,'Wheel_Spoke',[s*.055,0,0]);spoke.rotation.z=Math.PI/2;spoke.rotation.y=a;}
   // Center pin
   mesh(new THREE.CylinderGeometry(.018,.018,.135,12),black,p,'Wheel_Pin',[s*.055,0,0]).rotation.z=Math.PI/2;
  }
  // Buffers on front beam
  ellipsoid(body,'Round_Buffer',black,[s*.26,-.06,.655],[.06,.06,.05]);
  ellipsoid(body,'Buffer_Pad',redDark,[s*.26,-.06,.682],[.045,.045,.015]);
 }
 // Smokebox door / face (Head group)
 const head=pivot(body,'Head',[0,.14,.50]);
 ellipsoid(head,'Round_Train_Face',gray,[0,0,.09],[.255,.255,.07]);
 // Smokebox door hinge/details
 ellipsoid(head,'Smokebox_Hinge',grayDark,[-.18,.0,.145],[.018,.08,.018]);
 ellipsoid(head,'Smokebox_Door_Knob',gold,[.16,.0,.155],[.025,.025,.012]);
 // Eyes
 const eyes=pivot(head,'Eyes',[0,0,0]);
 for(const s of [-1,1]){
  const eye=pivot(eyes,s<0?'Eye_L':'Eye_R',[s*.095,.055,.15]);
  ellipsoid(eye,'Eye_White',white,[0,0,0],[.056,.062,.02]);
  ellipsoid(eye,'Pupil',dark,[0,0,.02],[.022,.028,.012]);
  ellipsoid(eye,'Catchlight',white,[-.01,.015,.03],[.008,.01,.005]);
  pivot(head,s<0?'Ear_L':'Ear_R',[s*.23,.12,0]);
 }
 // Eyebrows (Thomas's signature friendly raised eyebrows) — animated
 for(const s of [-1,1]){
  const browPivot=pivot(head,s<0?'Brow_L':'Brow_R',[s*.10,.135,.142]);
  const brow=ellipsoid(browPivot,'Train_Brow',dark,[0,0,0],[.058,.014,.008]);
  brow.rotation.z=-s*.10;
 }
 // Nose
 ellipsoid(head,'Nose',gray,[0,-.03,.17],[.042,.052,.032]);
 // Smile
 curve(head,'Train_Smile',[[-.125,-.10,.16],[0,-.155,.178],[.125,-.10,.16]],.008,dark);
 // Happy mouth（亲切阳光的机车开怀大笑纹，告别吐红舌头）
 const happy=pivot(head,'Happy_Mouth',[0,-.125,.175]);happy.visible=false;
 curve(happy,'Happy_Train_Arc',[[-.14,.015,0],[0,-.045,.012],[.14,.015,0]],.009,dark);
 curve(happy,'Happy_Train_Cheek_L',[[-.14,.015,0],[-.15,.030,-.002]],.007,dark);
 curve(happy,'Happy_Train_Cheek_R',[[.14,.015,0],[.15,.030,-.002]],.007,dark);
 // Cheeks (subtle rosy cheeks)
 const cheekMat=mat(0xf0a090,.5);
 for(const s of [-1,1])ellipsoid(head,s<0?'Cheek_L':'Cheek_R',cheekMat,[s*.16,-.06,.155],[.035,.022,.008]);
 // Bow (top decoration — placed on boiler, doubles as focus target)
 const bow=pivot(root,'Bow',[0,.72,.16]);
 // Tail (rear bunker)
 const tail=pivot(root,'Tail',[0,.40,-.58]);
 return root;
}

// 韩国人气动画《小公交车太友》（Tayo the Little Bus）
// 标志性蓝色 120 号小巴士，白车顶、大挡风玻璃灵动大眼、黄色 120 路线徽章、亲切笑嘴与四轮大巴士轮毂
export function createTayoModel(){
 const root=new THREE.Group();root.name='Tayo_Bus_Rig';
 const box=(parent,name,material,pos,size,r=.04)=>mesh(new RoundedBoxGeometry(...size,4,r),material,parent,name,pos);
 const blue=mat(0x1a73e8,.45,{metalness:.12}),
       navy=mat(0x1358b8,.5,{metalness:.12}),
       roof=mat(0xf8fafc,.4),
       dark=mat(0x212529,.85),
       glass=mat(0xd0ebff,.35),
       windowTint=mat(0x263238,.85),
       yellow=mat(0xffd600,.55),
       red=mat(0xe53935,.6),
       rubber=mat(0x212121,.95),
       silver=mat(0xe0e0e0,.45,{metalness:.4}),
       pupilDark=mat(0x1a237e,.9),
       mouthDark=mat(0x381520,.95),
       tonguePink=mat(0xf36e84,.88),
       white=mat(0xffffff,.7);
 // 底盘与车身 (Torso)
 const body=pivot(root,'Torso',[0,.34,0]);
 box(body,'Blue_Bus_Body',blue,[0,.06,0],[.68,.44,1.06],.07);
 box(body,'White_Bus_Roof',roof,[0,.30,.01],[.67,.08,1.04],.04);
 box(body,'Bus_AC_Unit',roof,[0,.36,-.08],[.38,.05,.32],.02);
 box(body,'Lower_Bumper_Skirt',navy,[0,-.17,0],[.685,.08,1.065],.03);
 box(body,'Front_Bumper',navy,[0,-.13,.54],[.70,.12,.08],.035);
 box(body,'Rear_Bumper',navy,[0,-.13,-.54],[.70,.12,.08],.035);
 // 前脸与车头驾驶舱 (Head)
 const head=pivot(root,'Head',[0,.52,.40]);
 box(head,'Bus_Windshield',glass,[0,-.02,.135],[.58,.24,.02],.025);
 // 招牌黄色路线牌 120 (Route_Display_Box & Route_Badge_120)
 box(head,'Route_Display_Box',dark,[0,.125,.135],[.42,.065,.015],.015);
 const routeBadge=pivot(head,'Route_Badge_120',[0,.125,.145]);
 curve(routeBadge,'Route_Num_1',[[-.07,-.02,0],[-.07,.02,0]],.005,yellow);
 curve(routeBadge,'Route_Num_2',[[-.02,.02,0],[.015,.02,0],[.015,0,0],[-.02,-.02,0],[.02,-.02,0]],.0045,yellow);
 curve(routeBadge,'Route_Num_0',[[.055,-.02,0],[.055,.02,0],[.095,.02,0],[.095,-.02,0],[.055,-.02,0]],.0045,yellow);
 // 挡风玻璃上的大眼睛 (Eyes)
 const eyes=pivot(head,'Eyes',[0,0,0]);
 for(const s of [-1,1]){
  const eye=pivot(eyes,s<0?'Eye_L':'Eye_R',[s*.14,-.015,.150]);
  ellipsoid(eye,'Eye_White',white,[0,0,0],[.072,.090,.012]);
  ellipsoid(eye,'Iris',mat(0x1976d2,.45),[s*.005,-.008,.009],[.056,.068,.010]);
  ellipsoid(eye,'Pupil',pupilDark,[s*.005,-.010,.016],[.036,.046,.008]);
  ellipsoid(eye,'Catchlight',white,[-.016,.024,.023],[.015,.018,.005]);
  ellipsoid(eye,'Catchlight_Small',white,[.016,-.020,.021],[.007,.008,.003]);
  curve(head,s<0?'Brow_L':'Brow_R',[[s*.065,.10,.148],[s*.14,.12,.148],[s*.20,.095,.144]],.006,navy);
 }
 // 太友可爱的耳朵形后视镜 (Ear_L / Ear_R)
 for(const s of [-1,1]){
  const ear=pivot(head,s<0?'Ear_L':'Ear_R',[s*.33,.02,.08]);
  mesh(new THREE.CylinderGeometry(.008,.008,.06,12),dark,ear,'Mirror_Stalk',[s*.03,0,0]);
  box(ear,s<0?'Mirror_L':'Mirror_R',blue,[s*.07,0,0],[.038,.09,.06],.015);
  box(ear,'Mirror_Glass',silver,[s*.07,0,-.018],[.030,.078,.005],.008);
 }
 // 亲切笑容嘴部 (Bus_Mouth, Smile, Happy_Mouth)
 const mouth=pivot(head,'Bus_Mouth',[0,-.21,.148]);
 curve(mouth,'Smile',[[-.15,.005,0],[-.08,-.03,.004],[0,-.04,.006],[.08,-.03,.004],[.15,.005,0]],.008,dark);
 const happy=pivot(mouth,'Happy_Mouth',[0,-.025,.005]);happy.visible=false;
 ellipsoid(happy,'Happy_Mouth_Cavity',mouthDark,[0,0,0],[.115,.042,.012]);
 const happyTongue=ellipsoid(happy,'Happy_Tongue',tonguePink,[0,-.018,.008],[.050,.016,.008]);
 happyTongue.rotation.x=-.2;
 for(const s of [-1,1]){
  ellipsoid(happy,s<0?'Tooth_L':'Tooth_R',white,[s*.035,.016,.006],[.008,.010,.006]);
 }
 // 前大灯与转向灯 (Headlights & Turn Signals)
 for(const s of [-1,1]){
  ellipsoid(body,s<0?'Headlight_L':'Headlight_R',yellow,[s*.26,-.07,.535],[.052,.052,.014]);
  ellipsoid(body,s<0?'Turn_Signal_L':'Turn_Signal_R',mat(0xff922b,.6),[s*.31,-.07,.525],[.016,.034,.010]);
 }
 // 侧面大车窗与乘客门
 for(let i=0;i<3;i++){
  const z=.24-i*.24;
  box(body,'Side_Window_L_'+i,windowTint,[-.342,.10,z],[.015,.18,.20],.02);
 }
 box(body,'Bus_Door',windowTint,[.342,-.01,.22],[.015,.34,.22],.015);
 curve(body,'Bus_Door_Seam',[[.351,-.17,.22],[.351,.15,.22]],.004,dark);
 for(let i=0;i<2;i++){
  const z=-.04-i*.24;
  box(body,'Side_Window_R_'+i,windowTint,[.342,.10,z],[.015,.18,.20],.02);
 }
 // 两侧白色 120 路线徽章
 for(const s of [-1,1]){
  const badge=pivot(body,s<0?'Side_Badge_L':'Side_Badge_R',[s*.343,-.08,0]);
  ellipsoid(badge,'Badge_Plate',white,[0,0,0],[.01,.07,.10]);
  curve(badge,'Side_Num_1',[[s*.008,0,-.04],[s*.008,.03,-.04]],.004,blue);
  curve(badge,'Side_Num_2',[[s*.008,.03,-.015],[s*.008,.03,.01],[s*.008,.01,.01],[s*.008,-.01,-.015],[s*.008,-.01,.01]],.004,blue);
  curve(badge,'Side_Num_0',[[s*.008,-.01,.035],[s*.008,.03,.035],[s*.008,.03,.065],[s*.008,-.01,.065],[s*.008,-.01,.035]],.004,blue);
 }
 // 车轮 (4个公交车轮：前轮=Arm_L/R，后轮=Leg_L/R)
 for(const s of [-1,1]){
  const arm=pivot(root,s<0?'Arm_L':'Arm_R',[s*.34,.16,.30]);
  const leg=pivot(root,s<0?'Leg_L':'Leg_R',[s*.34,.16,-.30]);
  for(const [p,name] of [[arm,'Front_Wheel'],[leg,'Rear_Wheel']]){
   const wheel=mesh(new THREE.CylinderGeometry(.16,.16,.11,28),rubber,p,name,[s*.04,0,0]);
   wheel.rotation.z=Math.PI/2;
   const hub=mesh(new THREE.CylinderGeometry(.082,.082,.118,24),blue,p,'Wheel_Hub',[s*.04,0,0]);
   hub.rotation.z=Math.PI/2;
   const rim=mesh(new THREE.TorusGeometry(.080,.012,12,24),silver,p,'Wheel_Rim',[s*.04,0,0]);
   rim.rotation.y=Math.PI/2;
  }
 }
 // 车尾与尾气管 (Tail)
 const tail=pivot(root,'Tail',[0,.20,-.53]);
 box(tail,'Rear_Window',windowTint,[0,.14,-.01],[.56,.18,.015],.02);
 for(const s of [-1,1]){
  box(tail,s<0?'Tail_Light_L':'Tail_Light_R',red,[s*.27,-.02,-.01],[.05,.09,.015],.015);
 }
 const exhaust=mesh(new THREE.CylinderGeometry(.018,.018,.08,16),silver,tail,'Exhaust_Pipe',[.20,-.08,-.02]);
 exhaust.rotation.x=Math.PI/2;
 // 车头车牌号 / 领结节点 (Bow)
 const bow=pivot(root,'Bow',[0,.21,.54]);
 box(bow,'Front_License_Plate',white,[0,0,0],[.16,.06,.015],.01);
 curve(bow,'Plate_Text_120',[[-.05,0,.008],[.05,0,.008]],.005,blue);
 return root;
}

export function createTriceratopsModel() {
 const root=new THREE.Group();root.name="Triceratops_Dino_Rig";
 const dinoOrange=mat(0xf59e0b,.88),   // 暖阳金橙色主色
       bellyCream=mat(0xfffae0,.95),   // 柔软温和的香草奶黄腹部
       frillOrange=mat(0xf97316,.88),  // 活力落日橙大颈盾
       frillGold=mat(0xfde047,.90),    // 颈盾边缘亮金黄圆珠花边
       spotYellow=mat(0xfef08a,.85),   // 颈盾与身上的明亮暖黄斑纹
       spotCaramel=mat(0xd97706,.88),  // 焦糖暖褐背部斑点与甲片
       hornIvory=mat(0xfffae8,.82,{roughness:.25}), // 温润光滑的象牙白犄角
       beakGold=mat(0xfcd34d,.88),     // 角质小嘴
       clawIvory=mat(0xfffde8,.85),    // 爪子
       dark=mat(0x2d2420,.45),
       eyeDark=mat(0x212121,.9),
       eyeIris=mat(0x1e3a8a,.8),       // 澄澈温和的深蓝眼珠
       mouthDark=mat(0x381520,.95),
       tonguePink=mat(0xf36e84,.88),
       blush=mat(0xff8a80,.55),
       white=mat(0xffffff,.7);

 // 躯干与饱满恐龙肚皮 (Torso)
 const body=pivot(root,"Torso",[0,.42,0]);
 ellipsoid(body,"Dino_Plump_Body",dinoOrange,[0,0,0],[.32,.26,.38]);
 ellipsoid(body,"Cream_Belly",bellyCream,[0,-.10,.04],[.24,.18,.30]);
 // 背部圆润小骨板 / 刺甲
 for(let i=0;i<4;i++){
  const z=.16-i*.12;
  ellipsoid(body,"Spine_Plate_"+i,spotCaramel,[0,.24,z],[.035,.065,.05]);
 }
 // 臀部可爱小斑点
 for(const s of [-1,1]){
  ellipsoid(body,s<0?"Hip_Spot_L":"Hip_Spot_R",spotYellow,[s*.22,.08,-.10],[.05,.05,.015]);
  ellipsoid(body,s<0?"Back_Spot_L":"Back_Spot_R",spotCaramel,[s*.15,.16,.02],[.038,.038,.012]);
 }

 // 头部与大颈盾 (Head)
 const head=pivot(root,"Head",[0,.72,.18]);
 ellipsoid(head,"Dino_Head",dinoOrange,[0,0,0],[.25,.22,.24]);
 ellipsoid(head,"Dino_Snout",dinoOrange,[0,-.07,.16],[.17,.13,.16]);
 ellipsoid(head,"Cream_Cheeks",bellyCream,[0,-.10,.14],[.18,.10,.14]);
 // 可爱鹦鹉形角质小喙 (Dino_Beak)
 ellipsoid(head,"Dino_Beak",beakGold,[0,-.13,.30],[.085,.070,.065]);

 // 标志性大颈盾 (Neck_Frill)
 const frill=pivot(head,"Neck_Frill",[0,.14,-.06]);
 frill.rotation.x=-.32;
 ellipsoid(frill,"Frill_Shield_Base",frillOrange,[0,.14,0],[.42,.32,.038]);
 // 颈盾波浪花边装饰珠 (Frill_Rim_Scallops)
 for(let i=0;i<9;i++){
  const angle=Math.PI*(.1+.8*(i/8));
  const rx=Math.cos(angle)*.40,ry=.14+Math.sin(angle)*.30;
  ellipsoid(frill,"Frill_Bead_"+i,frillGold,[rx,ry,.005],[.042,.042,.028]);
 }
 // 颈盾太阳斑纹
 for(const s of [-1,1]){
  ellipsoid(frill,s<0?"Frill_Spot_L1":"Frill_Spot_R1",spotYellow,[s*.18,.22,.022],[.075,.095,.012]);
  ellipsoid(frill,s<0?"Frill_Spot_L2":"Frill_Spot_R2",spotYellow,[s*.28,.12,.022],[.055,.070,.012]);
 }

 // 标志性三只圆钝犄角 (Horn_Brow_L / Horn_Brow_R / Horn_Nose)
 const hornL=pivot(head,"Horn_Brow_L",[-.13,.16,.14]);
 hornL.rotation.set(.42,-.10,-.12);
 mesh(new THREE.ConeGeometry(.045,.24,16),hornIvory,hornL,"Horn_Cone_L",[0,.12,0]);
 ellipsoid(hornL,"Horn_Tip_L",hornIvory,[0,.23,0],[.020,.024,.020]);

 const hornR=pivot(head,"Horn_Brow_R",[.13,.16,.14]);
 hornR.rotation.set(.42,.10,.12);
 mesh(new THREE.ConeGeometry(.045,.24,16),hornIvory,hornR,"Horn_Cone_R",[0,.12,0]);
 ellipsoid(hornR,"Horn_Tip_R",hornIvory,[0,.23,0],[.020,.024,.020]);

 const hornNose=pivot(head,"Horn_Nose",[0,-.02,.30]);
 hornNose.rotation.x=.25;
 mesh(new THREE.ConeGeometry(.040,.16,16),hornIvory,hornNose,"Horn_Nose_Cone",[0,.08,0]);
 ellipsoid(hornNose,"Horn_Nose_Tip",hornIvory,[0,.15,0],[.018,.022,.018]);

 // 灵动大眼睛 (Eyes)
 const eyes=pivot(head,"Eyes",[0,0,0]);
 for(const s of [-1,1]){
  const eye=pivot(eyes,s<0?"Eye_L":"Eye_R",[s*.16,.02,.18]);
  eye.rotation.y=s*.28;
  ellipsoid(eye,"Eye_White",white,[0,0,0],[.052,.062,.024]);
  ellipsoid(eye,"Iris",eyeIris,[s*.004,-.006,.008],[.042,.050,.018]);
  ellipsoid(eye,"Pupil",eyeDark,[s*.004,-.008,.014],[.028,.036,.012]);
  ellipsoid(eye,"Catchlight",white,[-.012,.016,.020],[.012,.014,.006]);
  ellipsoid(eye,"Catchlight_Small",white,[.012,-.014,.018],[.006,.007,.004]);
  // 眉骨与腮红
  ellipsoid(head,s<0?"Brow_L":"Brow_R",dinoOrange,[s*.16,.10,.16],[.065,.024,.035]);
  ellipsoid(head,s<0?"Blush_L":"Blush_R",blush,[s*.18,-.08,.20],[.045,.030,.012]);
  // 耳侧枢轴（供耳部灵动微摇）
  const ear=pivot(head,s<0?"Ear_L":"Ear_R",[s*.28,.04,-.04]);
  ellipsoid(ear,"Frill_Ear_Flank",frillOrange,[0,0,0],[.045,.065,.025]);
 }

 // 微笑嘴巴与下颌 (Mouth / Smile / Happy_Mouth)
 const mouth=pivot(head,"Dino_Mouth",[0,-.17,.24]);
 curve(mouth,"Smile",[[-.09,.015,.02],[-.04,-.012,.035],[0,-.018,.04],[.04,-.012,.035],[.09,.015,.02]],.006,dark);
 curve(mouth,"Mouth",[[0,-.018,.04],[0,-.035,.04]],.005,dark);
 // 自然下颌（与金橙色皮肤浑然一体，消除厚重的人类浅色下唇突兀感）
 ellipsoid(head,"Dino_Lower_Jaw",dinoOrange,[0,-.192,.205],[.088,.036,.068]);
 const happy=pivot(mouth,"Happy_Mouth",[0,-.012,.03]);happy.visible=false;
 ellipsoid(happy,"Happy_Cavity",mouthDark,[0,0,0],[.068,.030,.012]);

 // 四肢粗壮稳健小恐龙腿 (Arm_L/R 前腿, Leg_L/R 后腿)
 for(const s of [-1,1]){
  const arm=pivot(root,s<0?"Arm_L":"Arm_R",[s*.22,.36,.16]);
  mesh(new THREE.CylinderGeometry(.095,.115,.28,16),dinoOrange,arm,"Foreleg",[0,-.12,0]);
  ellipsoid(arm,"Forefoot",dinoOrange,[0,-.26,.04],[.11,.065,.12]);
  for(let j=0;j<3;j++){
   const angle=(j-1)*.35;
   ellipsoid(arm,"Toenail_F_"+j,clawIvory,[Math.sin(angle)*.08,-.28,.04+Math.cos(angle)*.09],[.022,.022,.035]);
  }
  const leg=pivot(root,s<0?"Leg_L":"Leg_R",[s*.24,.36,-.16]);
  mesh(new THREE.CylinderGeometry(.105,.125,.28,16),dinoOrange,leg,"Hindleg",[0,-.12,0]);
  ellipsoid(leg,"Hindfoot",dinoOrange,[0,-.26,.04],[.12,.070,.13]);
  for(let j=0;j<3;j++){
   const angle=(j-1)*.35;
   ellipsoid(leg,"Toenail_H_"+j,clawIvory,[Math.sin(angle)*.09,-.28,.04+Math.cos(angle)*.10],[.024,.024,.038]);
  }
 }

 // 圆润粗壮恐龙小尾巴 (Tail)
 const tail=pivot(root,"Tail",[0,.36,-.28]);
 ellipsoid(tail,"Dino_Tail",dinoOrange,[0,-.06,-.18],[.11,.11,.24]);
 ellipsoid(tail,"Tail_Tip",dinoOrange,[0,-.12,-.36],[.065,.065,.14]);
 for(let i=0;i<3;i++)ellipsoid(tail,"Tail_Spine_"+i,spotCaramel,[0,.03,-.10-i*.10],[.025,.045,.035]);

 // 装饰领花 (Bow)
 const bow=pivot(root,"Bow",[0,.54,.30]);
 const flowerMat=mat(0xfde047,.90);
 ellipsoid(bow,"Bow_Center",spotCaramel,[0,0,.01],[.035,.035,.02]);
 for(let i=0;i<5;i++){
  const a=i*Math.PI*2/5;
  ellipsoid(bow,"Flower_Petal_"+i,flowerMat,[Math.cos(a)*.05,Math.sin(a)*.05,0],[.028,.028,.015]);
 }

 return root;
}

export function createKrashyModel() {
  const root = new THREE.Group(); root.name = "BabyRiki_Krashy_Rig";
  const skyBlue = mat(0x40baf7, .88),
        innerBlue = mat(0xa5e4fc, .92),
        creamWhite = mat(0xffffff, .95),
        darkPupil = mat(0x182438, .45),
        nosePink = mat(0xf8719d, .85),
        blush = mat(0xfb7185, .75),
        mouthDark = mat(0x7c1d3c, .6),
        tonguePink = mat(0xf43f5e, .85);

  // 1. 经典圆滚滚气球身体 (纯正《瑞奇宝宝》极简圆球幼态身躯)
  const body = pivot(root, "Torso", [0, .44, 0]);
  ellipsoid(body, "Krashy_Ball_Body", skyBlue, [0, 0, 0], [.35, .35, .33]);
  // 保持 Krashy_Belly_Spot 节点满足回归测试与动画结构，颜色融入纯正天蓝，告别突兀大白肚皮
  ellipsoid(body, "Krashy_Belly_Spot", skyBlue, [0, -.06, .22], [.20, .19, .05]);

  // 2. 头部与面部特征 (Head pivot)
  const head = pivot(root, "Head", [0, .50, .04]);
  for (const s of [-1, 1]) {
    ellipsoid(head, s < 0 ? "Krashy_Cheek_L" : "Krashy_Cheek_R", blush, [s * .18, -.03, .27], [.046, .032, .012]);
  }

  // 标志性长而圆润的纯净长兔耳 (Ear_L, Ear_R) - 极简流线，告别分节碎裂
  for (const s of [-1, 1]) {
    const ear = pivot(head, s < 0 ? "Ear_L" : "Ear_R", [s * .115, .27, -.01]);
    ear.rotation.z = s * -.10;
    ear.rotation.x = -.03;
    ellipsoid(ear, "Ear_Outer", skyBlue, [0, .20, 0], [.058, .21, .042]);
    ellipsoid(ear, "Ear_Inner", innerBlue, [0, .18, .018], [.036, .16, .015]);
  }

  // 纯真大黑眼睛 (Eyes) - 纯真圆润，无多余眼睫毛杂线，带双圆清澈水珠高光
  const eyes = pivot(head, "Eyes", [0, 0, 0]);
  for (const s of [-1, 1]) {
    const eye = pivot(eyes, s < 0 ? "Eye_L" : "Eye_R", [s * .11, .07, .27]);
    eye.rotation.y = s * .12;
    ellipsoid(eye, "Eye_White", creamWhite, [0, 0, 0], [.052, .064, .022]);
    ellipsoid(eye, "Pupil", darkPupil, [s * .004, -.004, .012], [.036, .045, .012]);
    ellipsoid(eye, "Catchlight_Big", creamWhite, [-.012, .016, .020], [.013, .015, .006]);
    ellipsoid(eye, "Catchlight_Small", creamWhite, [.012, -.012, .018], [.006, .007, .004]);
  }

  // 软萌小圆粉鼻 (Krashy_Nose)
  ellipsoid(head, "Krashy_Nose", nosePink, [0, .012, .322], [.024, .018, .018]);

  // 纯真微笑小嘴与标志性小兔牙 (Smile / Mouth / Krashy_Teeth)
  const mouth = pivot(head, "Krashy_Mouth", [0, -.065, .292]);
  curve(mouth, "Smile", [[-.060, .012, .02], [-.03, -.008, .028], [0, -.012, .030], [.03, -.008, .028], [.060, .012, .02]], .005, darkPupil);
  curve(mouth, "Mouth", [[0, .01, .028], [0, -.012, .030]], .004, darkPupil);

  // 跳跳最标志性的两颗软萌小白兔门牙！
  const teeth = pivot(mouth, "Krashy_Teeth", [0, -.012, .032]);
  for (const s of [-1, 1]) {
    ellipsoid(teeth, s < 0 ? "Tooth_L" : "Tooth_R", creamWhite, [s * .013, -.008, 0], [.011, .014, .006]);
  }

  // 欢庆张开大嘴 (Happy_Mouth) - 1:1 还原《瑞奇宝宝》纯粹可爱的卡通月牙笑口，告别深邃喉咙与厚舌头
  const happy = pivot(mouth, "Happy_Mouth", [0, -.015, .022]);
  happy.visible = false;
  ellipsoid(happy, "Happy_Cavity", mouthDark, [0, 0, 0], [.054, .028, .010]);

  // 3. 极简软萌幼儿小手 (Arm_L, Arm_R) - 纯净天蓝小手滴，告别多余白手心垫
  for (const s of [-1, 1]) {
    const arm = pivot(root, s < 0 ? "Arm_L" : "Arm_R", [s * .27, .44, .04]);
    arm.rotation.z = s * -.25;
    ellipsoid(arm, "Krashy_Arm_Upper", skyBlue, [s * .03, -.07, .02], [.070, .11, .070]);
    ellipsoid(arm, "Krashy_Paw", skyBlue, [s * .05, -.16, .05], [.062, .062, .062]);
  }

  // 4. 极简圆润幼儿小短脚 (Leg_L, Leg_R) - 纯净天蓝小肉脚，告别多余白脚垫
  for (const s of [-1, 1]) {
    const leg = pivot(root, s < 0 ? "Leg_L" : "Leg_R", [s * .15, .18, .02]);
    ellipsoid(leg, "Krashy_Foot", skyBlue, [0, -.10, .05], [.090, .060, .13]);
  }

  // 5. 背后雪白毛球小尾巴 (Tail / Krashy_Tail_Pom)
  const tail = pivot(root, "Tail", [0, .38, -.27]);
  ellipsoid(tail, "Krashy_Tail_Pom", creamWhite, [0, 0, -.05], [.085, .085, .085]);

  // 6. 保留 Bow pivot 维持骨骼挂载兼容，移除胸前多余假勋章与假领结，回归动画极简纯净球形
  pivot(root, "Bow", [0, .48, .31]);

  return root;
}
