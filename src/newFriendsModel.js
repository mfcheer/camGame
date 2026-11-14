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
 const fur=mat(0x566068,.90), // 灰太狼经典深灰毛皮
       darkFur=mat(0x3e454b,.92),
       bellyFur=mat(0x66727a,.90), // 浅灰肚皮
       hatOrange=mat(0xc05a2b,.86), // 打补丁帽子：红褐/暖橙色
       hatPatch=mat(0xdfb768,.85),  // 补丁：米黄/浅土黄色
       scarfYellow=mat(0xf3c439,.82), // 破黄色围巾
       white=mat(0xffffff,.4),      // 牙齿、大眼珠、高光
       ink=mat(0x191c20,.45),       // 黑鼻头、粗黑一字眉、瞳孔、胡茬、缝合线
       pink=mat(0xd58782,.88),      // 耳内粉肉色
       scarLine=mat(0x24282c,.55),  // 脸颊刀疤主线
       tailTip=mat(0xc6cdd3,.92);   // 尾尖浅灰色

 const body=pivot(root,"Torso",[0,.38,0]);
 ellipsoid(body,"Wolf_Chest",fur,[0,.025,0],[.27,.33,.22]);
 ellipsoid(body,"Wolf_Tummy",bellyFur,[0,.01,.06],[.23,.28,.17]);
 ellipsoid(body,"Silver_Bib",bellyFur,[0,.03,.19],[.16,.21,.04]); // 保持兼容

 // 标志性“×”字小肚脐眼与肚脐凹
 const belly=pivot(body,"Belly_Cross",[0,-.09,.225]);
 curve(belly,"Cross_1",[[-.026,.026,.005],[.026,-.026,.005]],.0045,ink);
 curve(belly,"Cross_2",[[-.026,-.026,.005],[.026,.026,.005]],.0045,ink);
 ellipsoid(belly,"Navel_Ring",mat(0x3e464c,.95),[0,0,0],[.032,.032,.006]);

 // 破旧黄色围巾（系于脖颈处，下缀褶皱三角小巾）
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
   ellipsoid(arm,s<0?`Paw_Digit_L_${f}`:`Paw_Digit_R_${f}`,ink,[s*.025+f*.028,-.29,.12],[.018,.022,.025]);
  }
  const leg=pivot(root,s<0?"Leg_L":"Leg_R",[s*.18,.15,-.02]);
  ellipsoid(leg,"Wolf_Hind_Paw",fur,[0,-.06,.07],[.11,.08,.16]);
  ellipsoid(leg,"Silver_Toes",darkFur,[0,-.06,.20],[.085,.055,.06]);
 }

 const head=pivot(root,"Head",[0,.91,.025]);
 ellipsoid(head,"Wolf_Head",fur,[0,0,0],[.31,.27,.24]);

 // 灰太狼经典大腮帮子毛簇（左右各有上下两撮外翘尖狼毛）
 for(const s of [-1,1]){
  const cheek=ellipsoid(head,"Wolf_Cheek_Ruff",fur,[s*.205,-.10,.10],[.13,.09,.12]);
  cheek.rotation.z=-s*.4;
  const tuftTop=mesh(new THREE.ConeGeometry(.075,.22,16),fur,head,s<0?"Cheek_Tuft_Top_L":"Cheek_Tuft_Top_R",[s*.32,.01,.02]);
  tuftTop.rotation.z=-s*1.32;
  const tuftBot=mesh(new THREE.ConeGeometry(.065,.19,16),fur,head,s<0?"Cheek_Tuft_Bot_L":"Cheek_Tuft_Bot_R",[s*.30,-.09,.05]);
  tuftBot.rotation.z=-s*1.45;
  const tuftOld=mesh(new THREE.ConeGeometry(.05,.12,14),fur,head,"Wolf_Cheek_Tuft",[s*.31,-.07,.02]);
  tuftOld.visible=false;
 }

 // 耳朵：左耳挺立，右耳带标志性“V”型缺角咬痕
 for(const s of [-1,1]){
  const ear=pivot(head,s<0?"Ear_L":"Ear_R",[s*.23,.20,-.015]);
  ear.rotation.z=-s*.13;
  const outer=mesh(new THREE.ConeGeometry(.10,.26,24),darkFur,ear,"Tall_Wolf_Ear",[0,.09,0],[1,1,.65]);
  outer.rotation.z=-s*.16;
  const inner=mesh(new THREE.ConeGeometry(.055,.16,20),pink,ear,"Ear_Inner",[0,.09,.055],[1,1,.25]);
  inner.rotation.z=-s*.16;
  if(s>0){
   const notch=pivot(ear,"Right_Ear_Notch",[.078,.14,.01]);
   mesh(new RoundedBoxGeometry(.042,.052,.08,2,.01),mat(0x262a2e,.95),notch,"Notch_Cut");
  }
 }

 // 灰太狼标志性打补丁破软帽 (Patched_Hat)
 const hat=pivot(head,"Patched_Hat",[.03,.27,.01]);
 hat.rotation.set(-.16,.05,-.26); // 歪扣在头顶
 ellipsoid(hat,"Hat_Crown",hatOrange,[0,.035,0],[.24,.085,.27]);
 ellipsoid(hat,"Hat_Brim",hatOrange,[0,-.008,.02],[.25,.036,.28]);
 // 标志性米黄大补丁 (Hat_Patch)
 const patch=ellipsoid(hat,"Hat_Patch",hatPatch,[.04,.095,-.01],[.12,.024,.13]);
 patch.rotation.y=.25;
 for(let i=0;i<7;i++){
  const ang=(i/7)*Math.PI*1.5-.4;
  const rx=.04+Math.cos(ang)*.105, rz=-.01+Math.sin(ang)*.11;
  curve(hat,`Patch_Stitch_${i}`,[
   [rx-Math.sin(ang)*.016,.10,rz+Math.cos(ang)*.016],
   [rx+Math.sin(ang)*.016,.10,rz-Math.cos(ang)*.016]
  ],.0035,ink);
 }

 // 粗黑一字平眉 (眉峰微挑，尽显小聪明)
 for(const s of [-1,1]){
  const brow=mesh(new RoundedBoxGeometry(.135,.034,.025,2,.008),ink,head,s<0?"Brow_L":"Brow_R",[s*.135,.158,.215]);
  brow.rotation.z=-s*.05;
  ellipsoid(head,"Wolf_Brow",ink,[s*.135,.158,.215],[.06,.015,.015]).visible=false;
 }

 // 灰太狼经典半眯狡黠大眼 (Eye_L, Eye_R)
 const eyes=pivot(head,"Eyes",[0,0,0]);
 for(const s of [-1,1]){
  const eye=pivot(eyes,s<0?"Eye_L":"Eye_R",[s*.13,.06,.215]);
  eye.rotation.z=-s*.08;
  ellipsoid(eye,"Wolf_Eye",white,[0,0,0],[.052,.062,.026]);
  const eyelid=ellipsoid(eye,"Upper_Eyelid",fur,[0,.028,.015],[.058,.036,.022]);
  eyelid.rotation.z=s*.08;
  ellipsoid(eye,"Pupil",ink,[0,-.006,.023],[.026,.034,.011]);
  ellipsoid(eye,"Catchlight",white,[-.012,.010,.032],[.010,.012,.005]);
 }

 // 吻部与大黑鼻头
 ellipsoid(head,"Wolf_Long_Muzzle",fur,[0,-.105,.24],[.16,.11,.19]);
 ellipsoid(head,"Wolf_Nose",ink,[0,-.05,.39],[.068,.046,.036]);
 ellipsoid(head,"Nose_Glint",white,[-.018,-.036,.42],[.015,.009,.005]);

 // 右脸斜向缝合刀疤 (Face_Stitch)
 const scarGroup=pivot(head,"Face_Stitch",[.195,-.02,.215]);
 curve(scarGroup,"Scar_Spine",[[-.035,.10,.01],[0,0,.02],[.045,-.10,.01]],.0045,scarLine);
 for(let i=0;i<5;i++){
  const y=.08-i*.042, x=-.03+i*.018;
  curve(scarGroup,`Stitch_Cross_${i}`,[[x-.022,y+.008,.022],[x+.022,y-.008,.022]],.0035,ink);
 }

 // 招牌大嘴裂笑与两颗洁白小狼牙
 const mouthGroup=pivot(head,"Wolf_Grin",[0,-.13,.26]);
 mesh(new RoundedBoxGeometry(.30,.062,.035,2,.014),white,mouthGroup,"Wolf_Grin_Teeth",[0,0,.01]);
 curve(mouthGroup,"Wolf_Mouth",[[-.17,.022,.02],[0,.012,.038],[.17,.022,.02]],.005,ink);
 curve(mouthGroup,"Wolf_Smile",[[-.17,.022,.02],[0,-.032,.034],[.17,.022,.02]],.005,ink);
 for(const s of [-1,1]){
  const fang=mesh(new THREE.ConeGeometry(.016,.042,12),white,mouthGroup,s<0?"Fang_L":"Fang_R",[s*.118,-.012,.034]);
  fang.rotation.x=Math.PI; // 尖牙向下
 }

 // 下巴稀疏小胡茬 (Wolf_Stubble)
 for(const [x1,y1,z1,x2,y2,z2] of [
  [-.09,-.18,.24, -.15,-.21,.23],
  [-.12,-.22,.22, -.18,-.26,.20],
  [-.06,-.24,.21, -.11,-.29,.18],
  [.09,-.18,.24, .15,-.21,.23],
  [.12,-.22,.22, .18,-.26,.20],
  [.06,-.24,.21, .11,-.29,.18]
 ]){
  curve(head,"Wolf_Stubble",[[x1,y1,z1],[x2,y2,z2]],.0028,ink);
 }

 const happy=ellipsoid(head,"Happy_Mouth",ink,[0,-.165,.36],[.065,.045,.015]);happy.visible=false;
 const tongue=ellipsoid(head,"Happy_Tongue",pink,[0,-.18,.38],[.032,.018,.006]);tongue.visible=false;

 // 蓬松灰白狼尾
 const tail=pivot(root,"Tail",[.20,.30,-.17]);
 const brush=ellipsoid(tail,"Bushy_Wolf_Tail",fur,[.18,.14,-.12],[.12,.24,.11]);
 brush.rotation.z=-.65;
 const tip=ellipsoid(tail,"Tail_White_Tip",tailTip,[.28,.29,-.15],[.09,.10,.08]);
 tip.rotation.z=-.65;

 const bow=pivot(root,"Bow",[0,.65,.22]);
 return root;
}
// Child-friendly red racing car, using the same named animation pivots as other friends.
export function createMcqueenModel(){
 const root=new THREE.Group();root.name='Mcqueen_Rig';
 const red=mat(0xd5202b,.34,{metalness:.12}),bright=mat(0xf02d2d,.38),yellow=mat(0xffd43c,.5),dark=mat(0x262d36,.8),rubber=mat(0x292a30,.96),silver=mat(0xcad7da,.5,{metalness:.4}),glass=mat(0xf4fbf5,.3),iris=mat(0x4283bb,.3);
 const box=(parent,name,material,pos,size,r=.08)=>mesh(new RoundedBoxGeometry(...size,4,r),material,parent,name,pos);
 const body=pivot(root,'Torso',[0,.31,0]);
 box(body,'Red_Racing_Body',red,[0,0,0],[.84,.34,1.30],.14);
 box(body,'Front_Hood',bright,[0,.16,.38],[.76,.10,.51],.06);
 box(body,'Front_Bumper',red,[0,-.05,.68],[.78,.12,.12],.04);
 box(body,'Rear_Spoiler',red,[0,.30,-.57],[.86,.07,.20],.035);
 for(const side of [-1,1]){
  const arm=pivot(root,side<0?'Arm_L':'Arm_R',[side*.34,.25,.38]);const leg=pivot(root,side<0?'Leg_L':'Leg_R',[side*.34,.25,-.38]);
  for(const [p,name] of [[arm,'Front_Wheel'],[leg,'Rear_Wheel']]){
   const wheel=mesh(new THREE.CylinderGeometry(.17,.17,.14,28),rubber,p,name,[side*.045,0,0]);wheel.rotation.z=Math.PI/2;
   const hub=mesh(new THREE.CylinderGeometry(.084,.084,.148,24),silver,p,'Wheel_Hub',[side*.045,0,0]);hub.rotation.z=Math.PI/2;
   const cap=mesh(new THREE.CylinderGeometry(.033,.033,.155,20),red,p,'Wheel_Cap',[side*.045,0,0]);cap.rotation.z=Math.PI/2;
  }
  ellipsoid(body,'Headlight',yellow,[side*.28,.10,.655],[.09,.026,.012]);
 }
 const head=pivot(root,'Head',[0,.54,-.13]);
 box(head,'Cabin',red,[0,.02,0],[.64,.37,.62],.12);
 box(head,'Windshield',glass,[0,.035,.295],[.56,.25,.035],.04);
 const eyes=pivot(head,'Eyes',[0,0,0]);
 for(const side of [-1,1]){
  const eye=pivot(eyes,side<0?'Eye_L':'Eye_R',[side*.13,.04,.32]);
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
 for(const side of [-1,1]){const stripe=mesh(new THREE.ShapeGeometry(bolt),yellow,body,'Side_Lightning',[side*.427,.04,.04]);stripe.rotation.y=side*Math.PI/2;stripe.rotation.z=-Math.PI/2;stripe.scale.setScalar(1.5);}
 const bow=pivot(root,'Bow',[0,.50,.52]);
 pivot(root,'Tail',[0,.4,-.65]);return root;
}

// A blue-uniform rescue pup: floppy dark ears, proper police cap and a fitted jacket.
function chaseFloppyEar(){
 const g=new THREE.SphereGeometry(1,24,28),p=g.attributes.position;
 for(let i=0;i<p.count;i++){const t=(1-p.getY(i))/2;
  p.setXYZ(i,p.getX(i)*(.105+.055*t),-.36*t,p.getZ(i)*.062+.05*Math.sin(t*Math.PI));}
 g.computeVertexNormals();return g;
}
export function createChaseModel(){
 const root=createDogModel();root.name='Chase_Rescue_Pup';
 const brown=mat(0xa9723e,.95),tan=mat(0xe9b77d,.95),earBrown=mat(0x7c5231,.95),
  navy=mat(0x2453a0,.8),deep=mat(0x1a3c78,.85),sky=mat(0x3f7fd6,.72),
  gold=mat(0xf3cd52,.55),ink=mat(0x263447,.6),white=mat(0xf5f8ff,.5);
 // 毛色：金棕身体 + 浅棕口鼻/胸口/爪尖/尾尖
 for(const name of ['Puppy_Plump_Body','Puppy_Head','Foreleg','Hind_Paw','Wagging_Tail'])root.traverse(o=>{if(o.name===name&&o.isMesh)o.material=brown;});
 for(const name of ['Cream_Chest','Cream_Muzzle','Cream_Forepaw','Cream_Hind_Toes','Cream_Tail_Tip'])root.traverse(o=>{if(o.name===name&&o.isMesh)o.material=tan;});
 const patch=root.getObjectByName('Honey_Eye_Patch');if(patch)patch.visible=false;
 const chest=root.getObjectByName('Cream_Chest');if(chest)chest.visible=false;
 // 标志性大垂耳：深棕色，从头两侧自然垂到脸颊
 for(const side of ['L','R']){
  const earPivot=root.getObjectByName('Ear_'+side);earPivot.clear();earPivot.rotation.set(0,0,0);
  const s=side==='L'?-1:1;earPivot.rotation.z=s*.16;
  mesh(chaseFloppyEar(),earBrown,earPivot,'Chase_Floppy_Ear');
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
 // 胸前警徽（挂在 Bow 节点，动画兼容）
 const bow=root.getObjectByName('Bow');bow.clear();
 ellipsoid(bow,'Collar_Badge',gold,[0,0,.035],[.06,.068,.02]);
 ellipsoid(bow,'Badge_Inset',sky,[0,0,.054],[.032,.042,.008]);
 ellipsoid(bow,'Badge_Star',white,[0,0,.062],[.012,.012,.005]);
 return root;
}
export function createJettModel(){
 const root=new THREE.Group();root.name='Jett_Airplane_Rig';
 const red=mat(0xeb2629,.35,{metalness:.12}),white=mat(0xfcfbf7,.42),yellow=mat(0xffcc00,.42),blue=mat(0x2296ee,.32),dark=mat(0x252a32,.65),gold=mat(0xf5b820,.35,{metalness:.25}),pink=mat(0xf8928c,.85),silver=mat(0xc5d2dc,.4,{metalness:.35});
 const body=pivot(root,'Torso',[0,.42,0]);
 ellipsoid(body,'Red_Fuselage',red,[0,.03,0],[.29,.35,.24]);
 ellipsoid(body,'White_Front',white,[0,.035,.205],[.18,.22,.045]);
 for(const s of [-1,1]){
  mesh(new THREE.CylinderGeometry(.052,.062,.12,16),dark,body,'Jet_Exhaust',[s*.13,-.15,-.18]);
  ellipsoid(body,'Exhaust_Flame_Glow',yellow,[s*.13,-.21,-.18],[.035,.02,.035]);
 }
 const head=pivot(root,'Head',[0,.93,.02]);
 ellipsoid(head,'Red_Airplane_Head',red,[0,0,0],[.33,.29,.27]);
 // 大白脸：占头部下半大部分，乐迪的招牌圆润笑脸
 ellipsoid(head,'Friendly_Face',white,[0,-.045,.215],[.285,.215,.085]);
 // 额头蓝色风挡色带
 ellipsoid(head,'Helmet_Center',mat(0x7cc4ee,.4),[0,.20,.165],[.205,.058,.105]);
 ellipsoid(head,'Windshield_Glint',white,[0,.215,.24],[.10,.018,.02]);
 const topFinShape=new THREE.Shape();topFinShape.moveTo(-.02,0);topFinShape.lineTo(0,.13);topFinShape.lineTo(.04,0);topFinShape.closePath();
 const topFin=mesh(new THREE.ExtrudeGeometry(topFinShape,{depth:.018,bevelEnabled:true,bevelSize:.006,bevelThickness:.005}),red,head,'Head_Top_Fin',[0,.24,.02]);
 topFin.rotation.y=Math.PI/2;
 ellipsoid(head,'Head_Beacon',yellow,[0,.23,.18],[.025,.02,.025]);
 ellipsoid(head,'Helmet_Brow',red,[0,.115,.22],[.26,.05,.08]);
 const eyes=pivot(head,'Eyes',[0,0,0]);
 for(const s of [-1,1]){
  const eye=pivot(eyes,s<0?'Eye_L':'Eye_R',[s*.12,.005,.265]);
  ellipsoid(eye,'Eye_White',white,[0,0,0],[.064,.084,.027]);
  ellipsoid(eye,'Iris',blue,[0,-.006,.017],[.05,.064,.015]);
  ellipsoid(eye,'Eye',dark,[0,-.008,.026],[.028,.04,.011]);
  ellipsoid(eye,'Catchlight',white,[-.016,.022,.036],[.013,.016,.006]);
  ellipsoid(eye,'Catchlight_Small',white,[.014,-.018,.034],[.006,.007,.004]);
  curve(head,s<0?'Brow_L':'Brow_R',[[s*.065,.115,.265],[s*.12,.135,.26],[s*.17,.105,.245]],.006,dark);
  ellipsoid(head,s<0?'Blush_L':'Blush_R',pink,[s*.20,-.08,.23],[.046,.03,.012]);
  const ear=pivot(head,s<0?'Ear_L':'Ear_R',[s*.32,.03,0]);
  const earCup=mesh(new THREE.CylinderGeometry(.088,.088,.075,24),yellow,ear,'Headset_Pod',[s*.02,0,0]);earCup.rotation.z=Math.PI/2;
  const earRing=mesh(new THREE.CylinderGeometry(.092,.092,.02,24),white,ear,'Headset_Ring',[s*.055,0,0]);earRing.rotation.z=Math.PI/2;
  ellipsoid(ear,'Headset_Speaker',dark,[s*.066,0,0],[.008,.045,.045]);
  ellipsoid(ear,'Jet_Side_Piece',red,[s*.02,0,0],[.06,.07,.08]);
  ellipsoid(ear,'Headset_Antenna',red,[s*.02,.09,0],[.018,.032,.018]);
  const arm=pivot(root,s<0?'Arm_L':'Arm_R',[s*.28,.55,.02]);
  ellipsoid(arm,'Red_Shoulder',red,[0,0,0],[.07,.07,.07]);
  ellipsoid(arm,'White_Arm',white,[s*.03,-.11,0],[.065,.13,.065]);
  ellipsoid(arm,'Red_Wrist_Cuff',red,[s*.035,-.19,.01],[.07,.035,.07]);
  ellipsoid(arm,'Red_Hand',red,[s*.035,-.24,.025],[.08,.065,.08]);
  ellipsoid(arm,'White_Hand',white,[s*.04,-.25,.02],[.07,.06,.06]);
  ellipsoid(arm,'Hand_Thumb',white,[s*.07,-.23,.045],[.025,.035,.025]);
  const leg=pivot(root,s<0?'Leg_L':'Leg_R',[s*.15,.20,0]);
  ellipsoid(leg,'White_Leg',white,[0,-.05,.01],[.08,.11,.08]);
  ellipsoid(leg,'Red_Boot',red,[0,-.14,.06],[.10,.075,.14]);
  ellipsoid(leg,'Boot_Sole',white,[0,-.20,.07],[.095,.022,.135]);
  const hub=mesh(new THREE.CylinderGeometry(.042,.042,.022,16),yellow,leg,'Boot_Wheel_Hub',[s*.095,-.15,.03]);hub.rotation.z=Math.PI/2;
  const tire=mesh(new THREE.CylinderGeometry(.046,.046,.016,16),dark,leg,'Boot_Wheel_Tire',[s*.098,-.15,.03]);tire.rotation.z=Math.PI/2;
  ellipsoid(leg,'Boot_Thruster',yellow,[0,-.14,-.07],[.035,.035,.02]);
  const wing=pivot(body,s<0?'Wing_L':'Wing_R',[s*.24,.08,-.06]);
  const shape=new THREE.Shape();shape.moveTo(0,.10);shape.lineTo(s*.56,-.05);shape.lineTo(s*.50,-.24);shape.lineTo(0,-.13);shape.closePath();
  mesh(new THREE.ExtrudeGeometry(shape,{depth:.032,bevelEnabled:true,bevelSize:.012,bevelThickness:.008,bevelSegments:2}),red,wing,'Airplane_Wing');
  ellipsoid(wing,'Wing_Tip',white,[s*.44,-.15,.028],[.085,.055,.034]);
  const stripe=ellipsoid(wing,'Wing_Stripe',white,[s*.26,-.095,.038],[.14,.016,.01]);stripe.rotation.z=-s*.22;
  const pod=mesh(new THREE.CylinderGeometry(.046,.046,.27,20),yellow,wing,'Jet_Engine',[s*.21,-.11,-.04]);pod.rotation.x=Math.PI/2;
  ellipsoid(wing,'Engine_Intake',dark,[s*.21,-.11,.095],[.042,.042,.015]);
  ellipsoid(wing,'Engine_Nozzle',silver,[s*.21,-.11,-.175],[.04,.04,.02]);
 }
 // 乐迪的招牌大笑嘴：更宽更开朗
 curve(head,'Smile',[[-.125,-.125,.255],[0,-.185,.272],[.125,-.125,.255]],.008,dark);
 const happy=ellipsoid(head,'Happy_Mouth',dark,[0,-.145,.272],[.105,.052,.015]);happy.visible=false;
 const tongue=ellipsoid(head,'Happy_Tongue',pink,[0,-.163,.286],[.045,.017,.006]);tongue.visible=false;
 const tail=pivot(root,'Tail',[0,.54,-.22]);
 const finShape=new THREE.Shape();finShape.moveTo(-.04,0);finShape.lineTo(-.01,.34);finShape.lineTo(.06,.34);finShape.lineTo(.08,0);finShape.closePath();
 mesh(new THREE.ExtrudeGeometry(finShape,{depth:.025,bevelEnabled:true,bevelSize:.01,bevelThickness:.006,bevelSegments:2}),red,tail,'Tail_Fin');
 ellipsoid(tail,'Tail_Fin_Tip',white,[.02,.34,.012],[.045,.022,.015]);
 for(const s of [-1,1]){
  const hWing=ellipsoid(tail,s<0?'Tail_Wing_L':'Tail_Wing_R',red,[s*.15,.08,.02],[.12,.018,.07]);hWing.rotation.z=s*.08;
  ellipsoid(tail,s<0?'Tail_Wing_Tip_L':'Tail_Wing_Tip_R',white,[s*.24,.09,.02],[.035,.014,.03]);
 }
 const bow=pivot(root,'Bow',[0,.60,.24]);
 ellipsoid(bow,'Chest_Star',gold,[0,0,0],[.065,.05,.016]);
 ellipsoid(bow,'Badge_Wing_L',gold,[-.075,.01,-.004],[.05,.025,.01]);
 ellipsoid(bow,'Badge_Wing_R',gold,[.075,.01,-.004],[.05,.025,.01]);
 ellipsoid(bow,'Badge_Center',blue,[0,0,.012],[.032,.032,.008]);
 ellipsoid(bow,'Badge_Star',gold,[0,0,.018],[.014,.014,.005]);
 return root;
}

export function createPeppaModel(){
 const root=new THREE.Group();root.name='Peppa_Pig_Rig';
 // 按官方卡通形象从零设计：纸片人比例——大圆头直接坐在裙子上（无脖子）、
 // 扁宽梯形红裙、细枝手臂水平外伸、细腿配黑扁鞋；眼高聚拢、猪鼻上移前突。
 const pink=mat(0xf6aebb,.92),light=mat(0xffc9d4,.9),red=mat(0xd64550,.9),dark=mat(0x4a3038,.5),cheek=mat(0xef8ba3,.9),white=mat(0xfffdf8,.7),shoe=mat(0x352c31,.8),trim=mat(0xf5c542,.85);
 // 扁宽梯形红裙：纸片人式的扁平正面，下摆外扩
 const body=pivot(root,'Torso',[0,.38,0]);
 sculpt([[0,-.12,0,.27,.22,.15],[0,.03,0,.20,.19,.13],[0,.15,0,.14,.15,.12]],.05,red,body,'Red_Dress');
 // 金黄滚边（参考图的中式红裙）：下摆金环 + 领口金线 + 波浪纹 + 花点
 const hem=mesh(new THREE.TorusGeometry(.245,.015,10,48),trim,body,'Dress_Hem_Band',[0,-.05,0]);hem.rotation.x=Math.PI/2;
 curve(body,'Dress_Collar_Trim',[[-.125,.13,.125],[0,.175,.145],[.125,.13,.125]],.011,trim);
 curve(body,'Dress_Wave_Trim',[[-.155,.02,.16],[-.078,.065,.17],[0,.02,.178],[.078,.065,.17],[.155,.02,.16]],.008,trim);
 for(const x of [-.075,0,.075])ellipsoid(body,'Dress_Flower_Dot',trim,[x,.105,.125],[.018,.018,.008]);
 // 大圆头：比裙子还宽，佩奇的标志性大头比例
 const head=pivot(root,'Head',[0,.90,.01]);
 ellipsoid(head,'Pink_Pig_Head',pink,[0,0,0],[.31,.27,.26]);
 // 猪鼻：上移到脸中上部水平前突（加大突出感），双竖椭圆鼻孔在鼻头前端
 ellipsoid(head,'Pig_Snout',light,[0,.055,.26],[.165,.12,.14]);
 for(const s of [-1,1])ellipsoid(head,'Nostril',cheek,[s*.058,.058,.385],[.024,.038,.014]);
 for(const s of [-1,1])ellipsoid(head,'Rosy_Cheek',cheek,[s*.21,-.03,.185],[.05,.04,.012]);
 // 眼睛：小巧圆润、高高聚在头顶下方（官方形象的眼睛位置）
 const eyes=pivot(head,'Eyes',[0,0,0]);
 for(const s of [-1,1]){
  const eye=pivot(eyes,s<0?'Eye_L':'Eye_R',[s*.082,.165,.21]);
  ellipsoid(eye,'Eye_White',white,[0,0,0],[.053,.062,.023]);
  ellipsoid(eye,'Pupil',dark,[0,.004,.021],[.022,.029,.009]);
  ellipsoid(eye,'Catchlight',white,[-.005,.013,.031],[.007,.008,.003]);
 }
 // 小圆耳朵：立起贴头顶，间距收窄
 for(const s of [-1,1]){
  const ear=pivot(head,s<0?'Ear_L':'Ear_R',[s*.10,.25,-.01]);ear.rotation.z=-s*.08;
  ellipsoid(ear,'Pig_Ear',pink,[0,.04,0],[.046,.075,.028]);
  ellipsoid(ear,'Inner_Ear',light,[0,.043,.022],[.024,.05,.008]);
 }
 // 嘴巴：猪鼻正下方的小微笑
 curve(head,'Pig_Smile',[[-.055,-.02,.29],[0,-.055,.30],[.055,-.02,.29]],.006,dark);
 const happy=ellipsoid(head,'Happy_Mouth',dark,[0,-.03,.30],[.06,.035,.012]);happy.visible=false;
 const tongue=ellipsoid(head,'Happy_Tongue',cheek,[0,-.042,.31],[.026,.011,.005]);tongue.visible=false;
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
 // 头侧小红花（参考图造型）：五瓣红花金黄花蕊
 const bow=pivot(root,'Bow',[.155,1.12,.06]);
 for(let i=0;i<5;i++){const a=i/5*Math.PI*2;const petal=ellipsoid(bow,'Flower_Petal',red,[Math.cos(a)*.044,Math.sin(a)*.044,.02],[.032,.032,.012]);petal.rotation.z=a;}
 ellipsoid(bow,'Flower_Center',trim,[0,0,.029],[.019,.019,.008]);
 return root;
}
export function createThomasModel(){
 const root=new THREE.Group();root.name='Thomas_Train_Rig';
 const blue=mat(0x2879c8,.55,{metalness:.08}),lightBlue=mat(0x4aa1de,.55),black=mat(0x31363d,.78),red=mat(0xcd4040,.7),gray=mat(0xe0e4dc,.75),dark=mat(0x414950,.6),white=mat(0xffffff,.5),gold=mat(0xf1cb49,.6);
 const box=(parent,name,material,pos,size,r=.04)=>mesh(new RoundedBoxGeometry(...size,4,r),material,parent,name,pos);
 const body=pivot(root,'Torso',[0,.32,0]);box(body,'Blue_Train_Chassis',blue,[0,-.02,0],[.70,.27,1.15],.07);box(body,'Red_Buffer_Beam',red,[0,-.09,.59],[.8,.11,.11],.03);
 const boiler=mesh(new THREE.CylinderGeometry(.27,.27,.85,32),blue,body,'Blue_Boiler',[0,.14,.03]);boiler.rotation.x=Math.PI/2;
 box(body,'Blue_Cab',blue,[0,.30,-.41],[.64,.47,.40],.06);box(body,'Cab_Roof',black,[0,.55,-.41],[.68,.07,.42],.025);
 box(body,'Cab_Window',dark,[0,.32,-.203],[.40,.22,.015],.025);
 const funnel=mesh(new THREE.CylinderGeometry(.09,.08,.24,24),black,body,'Train_Funnel',[0,.48,.23]);mesh(new THREE.CylinderGeometry(.103,.103,.035,24),black,body,'Funnel_Rim',[0,.61,.23]);ellipsoid(body,'Steam_Dome',gold,[0,.43,-.12],[.09,.065,.09]);
 for(const s of [-1,1]){
  const arm=pivot(root,s<0?'Arm_L':'Arm_R',[s*.31,.2,.33]);const leg=pivot(root,s<0?'Leg_L':'Leg_R',[s*.31,.2,-.34]);
  for(const p of [arm,leg]){const w=mesh(new THREE.CylinderGeometry(.14,.14,.11,24),blue,p,'Train_Wheel',[s*.04,0,0]);w.rotation.z=Math.PI/2;const hub=mesh(new THREE.CylinderGeometry(.055,.055,.12,20),lightBlue,p,'Wheel_Hub',[s*.04,0,0]);hub.rotation.z=Math.PI/2;}
  box(body,'Engine_Number_One',gold,[s*.356,.025,-.16],[.012,.20,.045],.005);
  curve(body,'Running_Board',[[s*.365,-.01,-.47],[s*.365,-.01,.43]],.014,black);
  ellipsoid(body,'Round_Buffer',black,[s*.28,-.095,.657],[.065,.065,.038]);
 }
 const head=pivot(root,'Head',[0,.46,.48]);mesh(new THREE.TorusGeometry(.252,.018,10,40),black,head,'Smokebox_Rim',[0,0,.067]);ellipsoid(head,'Round_Train_Face',gray,[0,0,.09],[.25,.25,.07]);
 const eyes=pivot(head,'Eyes',[0,0,0]);for(const s of [-1,1]){const eye=pivot(eyes,s<0?'Eye_L':'Eye_R',[s*.09,.06,.15]);ellipsoid(eye,'Eye_White',white,[0,0,0],[.052,.058,.018]);ellipsoid(eye,'Pupil',dark,[0,0,.018],[.021,.027,.01]);pivot(head,s<0?'Ear_L':'Ear_R',[s*.22,.1,0]);}
 for(const s of [-1,1]){const brow=ellipsoid(head,'Train_Brow',dark,[s*.095,.135,.139],[.055,.012,.008]);brow.rotation.z=-s*.12;}
 ellipsoid(head,'Nose',gray,[0,-.025,.17],[.04,.05,.03]);curve(head,'Train_Smile',[[-.12,-.11,.155],[0,-.16,.17],[.12,-.11,.155]],.007,dark);
 const happy=ellipsoid(head,'Happy_Mouth',dark,[0,-.13,.17],[.07,.04,.01]);happy.visible=false;const tongue=ellipsoid(head,'Happy_Tongue',red,[0,-.15,.18],[.03,.012,.005]);tongue.visible=false;
 const bow=pivot(root,'Bow',[0,.68,.20]);const tail=pivot(root,'Tail',[0,.4,-.56]);return root;
}
