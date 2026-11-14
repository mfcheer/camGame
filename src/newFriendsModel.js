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

// A blue-uniform rescue pup and a red-and-white airplane friend.
export function createChaseModel(){
 const root=createDogModel();root.name='Chase_Rescue_Pup';
 const brown=mat(0xa96332,.95),tan=mat(0xe9b77d,.95),navy=mat(0x224c98,.78),blue=mat(0x347ed0,.72),gold=mat(0xf3cd52,.55),ink=mat(0x263447,.6);
 for(const name of ['Puppy_Plump_Body','Puppy_Head','Foreleg','Hind_Paw','Wagging_Tail'])root.traverse(o=>{if(o.name===name&&o.isMesh)o.material=brown;});
 for(const name of ['Cream_Chest','Cream_Muzzle','Cream_Forepaw','Cream_Hind_Toes','Cream_Tail_Tip'])root.traverse(o=>{if(o.name===name&&o.isMesh)o.material=tan;});
 for(const side of ['L','R']){const ear=root.getObjectByName('Ear_'+side);ear.clear();const s=side==='L'?-1:1;const outer=ellipsoid(ear,'Chase_Pointy_Ear',brown,[s*.015,.10,0],[.10,.18,.07]);outer.rotation.z=-s*.16;const inner=ellipsoid(ear,'Chase_Inner_Ear',tan,[s*.015,.10,.065],[.055,.11,.012]);inner.rotation.z=-s*.16;}
 const body=root.getObjectByName('Torso');ellipsoid(body,'Blue_Rescue_Vest',navy,[0,.05,.13],[.29,.29,.17]);ellipsoid(body,'Vest_Front',blue,[0,.045,.265],[.16,.20,.025]);
 const pack=mesh(new RoundedBoxGeometry(.42,.34,.18,4,.06),navy,body,'Rescue_Backpack',[0,.12,-.23]);
 ellipsoid(body,'Backpack_Top',blue,[0,.29,-.23],[.15,.04,.11]);
 for(const s of [-1,1]){ellipsoid(body,'Vest_Shoulder',navy,[s*.19,.20,.14],[.10,.08,.11]);ellipsoid(body,'Uniform_Button',gold,[s*.10,.02,.285],[.014,.014,.008]);}
 const head=root.getObjectByName('Head');const hat=pivot(head,'Police_Cap',[0,.25,-.005]);ellipsoid(hat,'Cap_Crown',navy,[0,.02,0],[.27,.105,.22]);ellipsoid(hat,'Cap_Band',blue,[0,-.035,.015],[.27,.038,.225]);ellipsoid(hat,'Cap_Brim',navy,[0,-.05,.17],[.245,.025,.12]);
 ellipsoid(hat,'Cap_Badge',gold,[0,.03,.213],[.055,.06,.014]);ellipsoid(hat,'Badge_Center',ink,[0,.03,.227],[.022,.028,.008]);
 for(const [x,y] of [[0,.035],[-.016,.055],[0,.061],[.016,.055]])ellipsoid(hat,'Cap_Paw',gold,[x,y,.238],[.006,.007,.004]);
 const bow=root.getObjectByName('Bow');bow.clear();ellipsoid(bow,'Collar_Badge',gold,[0,0,.035],[.055,.066,.02]);ellipsoid(bow,'Badge_Inset',blue,[0,0,.054],[.03,.04,.008]);
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
 ellipsoid(head,'Friendly_Face',white,[0,-.04,.21],[.26,.19,.08]);
 ellipsoid(head,'Helmet_Center',white,[0,.24,.06],[.07,.038,.18]);
 const topFinShape=new THREE.Shape();topFinShape.moveTo(-.02,0);topFinShape.lineTo(0,.13);topFinShape.lineTo(.04,0);topFinShape.closePath();
 const topFin=mesh(new THREE.ExtrudeGeometry(topFinShape,{depth:.018,bevelEnabled:true,bevelSize:.006,bevelThickness:.005}),red,head,'Head_Top_Fin',[0,.24,.02]);
 topFin.rotation.y=Math.PI/2;
 ellipsoid(head,'Head_Beacon',yellow,[0,.23,.18],[.025,.02,.025]);
 ellipsoid(head,'Helmet_Brow',red,[0,.115,.22],[.26,.05,.08]);
 const eyes=pivot(head,'Eyes',[0,0,0]);
 for(const s of [-1,1]){
  const eye=pivot(eyes,s<0?'Eye_L':'Eye_R',[s*.115,.01,.265]);
  ellipsoid(eye,'Eye_White',white,[0,0,0],[.055,.072,.025]);
  ellipsoid(eye,'Iris',blue,[0,-.006,.016],[.042,.055,.014]);
  ellipsoid(eye,'Eye',dark,[0,-.008,.024],[.024,.035,.01]);
  ellipsoid(eye,'Catchlight',white,[-.014,.018,.032],[.012,.014,.005]);
  ellipsoid(eye,'Catchlight_Small',white,[.012,-.015,.031],[.006,.007,.004]);
  curve(head,s<0?'Brow_L':'Brow_R',[[s*.06,.10,.265],[s*.115,.12,.26],[s*.165,.095,.245]],.006,dark);
  ellipsoid(head,s<0?'Blush_L':'Blush_R',pink,[s*.19,-.07,.23],[.042,.028,.012]);
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
  const shape=new THREE.Shape();shape.moveTo(0,.09);shape.lineTo(s*.46,-.06);shape.lineTo(s*.40,-.20);shape.lineTo(0,-.12);shape.closePath();
  mesh(new THREE.ExtrudeGeometry(shape,{depth:.032,bevelEnabled:true,bevelSize:.012,bevelThickness:.008,bevelSegments:2}),red,wing,'Airplane_Wing');
  ellipsoid(wing,'Wing_Tip',white,[s*.36,-.125,.025],[.075,.05,.032]);
  const stripe=ellipsoid(wing,'Wing_Stripe',white,[s*.22,-.07,.038],[.12,.015,.01]);stripe.rotation.z=-s*.25;
  const pod=mesh(new THREE.CylinderGeometry(.046,.046,.24,20),yellow,wing,'Jet_Engine',[s*.18,-.09,-.04]);pod.rotation.x=Math.PI/2;
  ellipsoid(wing,'Engine_Intake',dark,[s*.18,-.09,.08],[.042,.042,.015]);
  ellipsoid(wing,'Engine_Nozzle',silver,[s*.18,-.09,-.16],[.04,.04,.02]);
 }
 curve(head,'Smile',[[-.09,-.135,.265],[0,-.175,.275],[.09,-.135,.265]],.007,dark);
 const happy=ellipsoid(head,'Happy_Mouth',dark,[0,-.14,.275],[.075,.045,.015]);happy.visible=false;
 const tongue=ellipsoid(head,'Happy_Tongue',pink,[0,-.155,.288],[.035,.016,.006]);tongue.visible=false;
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
 const pink=mat(0xf2a6b7,.92),light=mat(0xffc0ca,.9),red=mat(0xd74b4c,.9),dark=mat(0x4a3038,.5),cheek=mat(0xe77992,.9),white=mat(0xfffcf6,.7);
 const body=pivot(root,'Torso',[0,.45,0]);
 sculpt([[0,-.025,0,.26,.27,.19],[0,.15,0,.15,.18,.15]],.065,red,body,'Red_Dress');
 const head=pivot(root,'Head',[0,1.00,.005]);
 // A gently asymmetric pig face with a projecting snout, still easy to read from the front.
 sculpt([[.04,0,0,.29,.26,.21],[-.18,.005,.055,.23,.17,.19]],.075,pink,head,'Pink_Pig_Head');
 ellipsoid(head,'Pig_Snout',light,[-.25,-.015,.22],[.16,.115,.07]);
 for(const s of [-1,1])ellipsoid(head,'Nostril',cheek,[-.25+s*.045,-.012,.285],[.018,.025,.008]);
 ellipsoid(head,'Rosy_Cheek',cheek,[.20,-.055,.19],[.052,.043,.01]);
 const ears=[[-.05,.235],[.15,.22]];for(let i=0;i<2;i++){const ear=pivot(head,i===0?'Ear_L':'Ear_R',[ears[i][0],ears[i][1],-.005]);const e=ellipsoid(ear,'Pig_Ear',pink,[0,.055,0],[.052,.10,.04]);e.rotation.z=i===0?.16:-.16;ellipsoid(ear,'Inner_Ear',light,[0,.06,.036],[.027,.06,.007]);}
 const eyes=pivot(head,'Eyes',[0,0,0]);for(const [side,x] of [['L',-.105],['R',.08]]){const eye=pivot(eyes,'Eye_'+side,[x,.105,.195]);ellipsoid(eye,'Eye_White',white,[0,0,0],[.050,.055,.024]);ellipsoid(eye,'Pupil',dark,[0,0,.023],[.022,.027,.009]);ellipsoid(eye,'Catchlight',white,[-.005,.009,.032],[.006,.007,.003]);}
 curve(head,'Pig_Smile',[[-.09,-.15,.22],[.02,-.19,.225],[.14,-.145,.205]],.006,dark);
 const happy=ellipsoid(head,'Happy_Mouth',dark,[.03,-.17,.23],[.065,.037,.01]);happy.visible=false;const tongue=ellipsoid(head,'Happy_Tongue',light,[.03,-.183,.242],[.03,.012,.004]);tongue.visible=false;
 for(const s of [-1,1]){const arm=pivot(root,s<0?'Arm_L':'Arm_R',[s*.20,.57,.01]);const upper=ellipsoid(arm,'Pig_Arm',pink,[s*.075,-.04,0],[.13,.035,.034]);upper.rotation.z=-s*.25;ellipsoid(arm,'Pig_Hand',light,[s*.17,-.07,.01],[.043,.035,.03]);const leg=pivot(root,s<0?'Leg_L':'Leg_R',[s*.12,.18,0]);ellipsoid(leg,'Pig_Leg',pink,[0,-.06,0],[.034,.10,.034]);ellipsoid(leg,'Black_Shoe',dark,[0,-.15,.055],[.075,.045,.11]);}
 const tail=pivot(root,'Tail',[0,.40,-.17]);curve(tail,'Curly_Pig_Tail',[[0,0,0],[.08,.03,-.04],[.12,.08,-.04],[.08,.12,-.04],[.04,.08,-.04]],.012,pink);
 const bow=pivot(root,'Bow',[0,.62,.18]);return root;
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
