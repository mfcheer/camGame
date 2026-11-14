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
 const root=new THREE.Group();root.name='Friendly_Wolf_Rig';
 const fur=mat(0x82939b,.94),light=mat(0xd4d8d2,.95),shadow=mat(0x596b76,.94),pink=mat(0xdca6a3,.9),ink=mat(0x35434a,.42),amber=mat(0xb5813f,.5),white=mat(0xfff9ec,.5);
 const body=pivot(root,'Torso',[0,.40,0]);ellipsoid(body,'Wolf_Chest',fur,[0,.025,0],[.27,.34,.23]);ellipsoid(body,'Silver_Bib',light,[0,.04,.215],[.17,.23,.04]);
 for(const s of [-1,1]){
  const arm=pivot(root,s<0?'Arm_L':'Arm_R',[s*.22,.48,.08]);ellipsoid(arm,'Wolf_Arm',fur,[s*.025,-.13,.02],[.085,.18,.08]);ellipsoid(arm,'Silver_Forepaw',light,[s*.025,-.27,.07],[.09,.07,.10]);
  const leg=pivot(root,s<0?'Leg_L':'Leg_R',[s*.19,.15,-.02]);ellipsoid(leg,'Wolf_Hind_Paw',fur,[0,-.06,.07],[.11,.08,.16]);ellipsoid(leg,'Silver_Toes',light,[0,-.06,.20],[.085,.055,.06]);
 }
 const head=pivot(root,'Head',[0,.91,.025]);ellipsoid(head,'Wolf_Head',fur,[0,0,0],[.30,.27,.23]);
 for(const s of [-1,1]){
  const ear=pivot(head,s<0?'Ear_L':'Ear_R',[s*.23,.20,-.015]);ear.rotation.z=-s*.13;
  const outer=mesh(new THREE.ConeGeometry(.10,.26,24),shadow,ear,'Tall_Wolf_Ear',[0,.09,0],[1,1,.65]);outer.rotation.z=-s*.16;
  const inner=mesh(new THREE.ConeGeometry(.055,.16,20),pink,ear,'Ear_Inner',[0,.09,.055],[1,1,.25]);inner.rotation.z=-s*.16;
  const cheek=ellipsoid(head,'Wolf_Cheek_Ruff',light,[s*.205,-.10,.10],[.13,.09,.12]);cheek.rotation.z=-s*.4;
  const tuft=mesh(new THREE.ConeGeometry(.065,.17,20),fur,head,'Wolf_Cheek_Tuft',[s*.31,-.07,.02]);tuft.rotation.z=-s*1.25;
  const brow=ellipsoid(head,'Wolf_Brow',shadow,[s*.13,.155,.192],[.07,.018,.015]);brow.rotation.z=-s*.18;
 }
 ellipsoid(head,'Wolf_Long_Muzzle',light,[0,-.105,.25],[.145,.10,.19]);ellipsoid(head,'Wolf_Nose',ink,[0,-.06,.414],[.06,.04,.035]);ellipsoid(head,'Nose_Glint',white,[-.018,-.045,.444],[.014,.008,.004]);
 curve(head,'Wolf_Mouth',[[0,-.10,.427],[0,-.15,.40],[-.07,-.165,.36]],.005,ink);curve(head,'Wolf_Smile',[[0,-.15,.40],[.07,-.165,.36]],.005,ink);
 const eyes=pivot(head,'Eyes',[0,0,0]);for(const s of [-1,1]){const eye=pivot(eyes,s<0?'Eye_L':'Eye_R',[s*.13,.06,.215]);eye.rotation.z=-s*.1;ellipsoid(eye,'Wolf_Eye',amber,[0,0,0],[.047,.057,.025]);ellipsoid(eye,'Pupil',ink,[0,0,.023],[.024,.038,.01]);ellipsoid(eye,'Catchlight',white,[-.012,.017,.032],[.011,.013,.005]);}
 const happy=ellipsoid(head,'Happy_Mouth',ink,[0,-.17,.36],[.06,.04,.015]);happy.visible=false;const tongue=ellipsoid(head,'Happy_Tongue',pink,[0,-.185,.38],[.03,.016,.006]);tongue.visible=false;
 const tail=pivot(root,'Tail',[.20,.30,-.17]);const brush=ellipsoid(tail,'Bushy_Wolf_Tail',fur,[.18,.14,-.12],[.12,.23,.11]);brush.rotation.z=-.65;const tip=ellipsoid(tail,'Tail_White_Tip',light,[.28,.29,-.15],[.09,.10,.08]);tip.rotation.z=-.65;
 const bow=pivot(root,'Bow',[0,.65,.22]);return root;
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
 const pink=mat(0xf6aebb,.92),light=mat(0xffc3ce,.9),red=mat(0xd64550,.9),dark=mat(0x4a3038,.5),cheek=mat(0xef8ba3,.9),white=mat(0xfffdf8,.7),shoe=mat(0x352c31,.8);
 // 红色 A 字连衣裙：下摆外扩、肩部收窄，剪出裙装轮廓
 const body=pivot(root,'Torso',[0,.45,0]);
 sculpt([[0,-.10,0,.30,.26,.21],[0,.02,0,.235,.225,.175],[0,.15,0,.175,.175,.15]],.06,red,body,'Red_Dress');
 // 金黄滚边：下摆金环 + 领口金线 + 波浪纹，参考图的中式红裙
 const trim=mat(0xf5c542,.85);
 const hem=mesh(new THREE.TorusGeometry(.27,.016,10,48),trim,body,'Dress_Hem_Band',[0,-.055,0]);hem.rotation.x=Math.PI/2;
 curve(body,'Dress_Collar_Trim',[[-.155,.145,.155],[0,.19,.175],[.155,.145,.155]],.012,trim);
 curve(body,'Dress_Wave_Trim',[[-.19,.02,.205],[-.095,.07,.215],[0,.02,.225],[.095,.07,.215],[.19,.02,.205]],.009,trim);
 for(const x of [-.09,0,.09])ellipsoid(body,'Dress_Flower_Dot',trim,[x,.115,.16],[.02,.02,.008]);
 // 圆头：左右完全对称，不再歪向一侧
 const head=pivot(root,'Head',[0,.995,0]);
 ellipsoid(head,'Pink_Pig_Head',pink,[0,0,0],[.27,.245,.235]);
 // 猪鼻：居中前突，双鼻孔朝前对称分布
 ellipsoid(head,'Pig_Snout',light,[0,-.02,.20],[.15,.115,.105]);
 for(const s of [-1,1])ellipsoid(head,'Nostril',cheek,[s*.05,-.012,.297],[.02,.028,.012]);
 for(const s of [-1,1])ellipsoid(head,'Rosy_Cheek',cheek,[s*.19,-.075,.175],[.052,.042,.012]);
 // 小圆耳朵：贴头顶微微外倾，告别兔耳感
 for(const s of [-1,1]){const ear=pivot(head,s<0?'Ear_L':'Ear_R',[s*.115,.205,-.01]);ear.rotation.z=-s*.26;ellipsoid(ear,'Pig_Ear',pink,[0,.036,0],[.05,.075,.032]);ellipsoid(ear,'Inner_Ear',light,[0,.04,.024],[.026,.048,.008]);}
 // 眼睛：鼻梁上方左右对称
 const eyes=pivot(head,'Eyes',[0,0,0]);for(const s of [-1,1]){const eye=pivot(eyes,s<0?'Eye_L':'Eye_R',[s*.095,.085,.185]);ellipsoid(eye,'Eye_White',white,[0,0,0],[.052,.06,.026]);ellipsoid(eye,'Pupil',dark,[0,0,.024],[.024,.03,.01]);ellipsoid(eye,'Catchlight',white,[-.006,.011,.034],[.007,.008,.003]);}
 // 嘴巴：鼻下居中微笑
 curve(head,'Pig_Smile',[[-.075,-.14,.225],[0,-.175,.235],[.075,-.14,.225]],.006,dark);
 const happy=ellipsoid(head,'Happy_Mouth',dark,[0,-.16,.235],[.065,.038,.012]);happy.visible=false;
 const tongue=ellipsoid(head,'Happy_Tongue',cheek,[0,-.172,.248],[.03,.013,.005]);tongue.visible=false;
 for(const s of [-1,1]){
  const arm=pivot(root,s<0?'Arm_L':'Arm_R',[s*.23,.60,.02]);
  const upper=ellipsoid(arm,'Pig_Arm',pink,[s*.06,-.075,0],[.05,.105,.05]);upper.rotation.z=-s*.55;
  ellipsoid(arm,'Pig_Hand',light,[s*.115,-.135,.02],[.052,.048,.05]);
  const leg=pivot(root,s<0?'Leg_L':'Leg_R',[s*.115,.19,0]);
  ellipsoid(leg,'Pig_Leg',pink,[0,-.055,0],[.043,.09,.043]);
  ellipsoid(leg,'Black_Shoe',shoe,[0,-.135,.048],[.085,.05,.115]);
 }
 // 卷卷尾巴：绕一圈的小螺旋
 const tail=pivot(root,'Tail',[0,.42,-.18]);
 curve(tail,'Curly_Pig_Tail',[[0,0,0],[.05,.03,-.015],[.085,.075,-.02],[.07,.115,-.02],[.03,.115,-.02],[.02,.08,-.02],[.045,.055,-.02]],.013,pink);
 // 头侧小红花（参考图造型）：五瓣红花金黄花蕊
 const bow=pivot(root,'Bow',[.225,1.06,.10]);
 for(let i=0;i<5;i++){const a=i/5*Math.PI*2;const petal=ellipsoid(bow,'Flower_Petal',red,[Math.cos(a)*.048,Math.sin(a)*.048,.02],[.034,.034,.013]);petal.rotation.z=a;}
 ellipsoid(bow,'Flower_Center',trim,[0,0,.03],[.02,.02,.008]);
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
 mesh(new THREE.TorusGeometry(.272,.022,12,44),black,body,'Smokebox_Ring',[0,.17,.47]).rotation.y=Math.PI/2;
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
 const head=pivot(root,'Head',[0,.46,.50]);
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
 // Happy mouth (open smile for excitement)
 const happy=ellipsoid(head,'Happy_Mouth',dark,[0,-.125,.17],[.075,.045,.012]);happy.visible=false;
 const tongue=ellipsoid(head,'Happy_Tongue',red,[0,-.15,.182],[.035,.015,.006]);tongue.visible=false;
 // Cheeks (subtle rosy cheeks)
 const cheekMat=mat(0xf0a090,.5);
 for(const s of [-1,1])ellipsoid(head,s<0?'Cheek_L':'Cheek_R',cheekMat,[s*.16,-.06,.155],[.035,.022,.008]);
 // Bow (top decoration — placed on boiler, doubles as focus target)
 const bow=pivot(root,'Bow',[0,.72,.16]);
 // Tail (rear bunker)
 const tail=pivot(root,'Tail',[0,.40,-.58]);
 return root;
}
