import * as THREE from 'three';
import {mat,mesh,pivot,ellipsoid,sculpt,curve} from './rabbitModel.js';
function earGeometry(inner=false){
 const s=new THREE.Shape();s.moveTo(-.12,0);s.quadraticCurveTo(-.115,.12,-.075,.265);s.quadraticCurveTo(-.065,.287,-.045,.264);s.quadraticCurveTo(.065,.15,.12,0);s.quadraticCurveTo(0,-.025,-.12,0);
 const g=new THREE.ExtrudeGeometry(s,{depth:inner?.009:.045,bevelEnabled:true,bevelSize:inner?.006:.015,bevelThickness:.010,bevelSegments:3,steps:1,curveSegments:14});if(inner)g.scale(.65,.70,1);return g;
}
function almond(){
 const s=new THREE.Shape();s.moveTo(-.081,0);s.quadraticCurveTo(-.025,.084,.080,.018);s.quadraticCurveTo(.028,-.059,-.081,0);
 return new THREE.ExtrudeGeometry(s,{depth:.016,bevelEnabled:true,bevelSize:.006,bevelThickness:.006,bevelSegments:3,curveSegments:16});
}
export function createCatModel(){
 const root=new THREE.Group();root.name='Marmalade_Rig';root.userData.designVersion=3;
 const orange=mat(0xe4a05b,.94),cream=mat(0xffedcd,.95),stripe=mat(0xb77743,.96),pink=mat(0xd69a91,.89),ink=mat(0x493b32,.24),green=mat(0x91b697,.30);
 const body=pivot(root,'Torso',[0,.42,0]);
 sculpt([[0,-.015,0,.265,.32,.25],[0,.20,.005,.205,.20,.19],[-.20,-.15,-.015,.14,.16,.17],[.20,-.15,-.015,.14,.16,.17]],.075,orange,body,'Cat_Seated_Body');
 ellipsoid(body,'Cream_Bib',cream,[0,.04,.218],[.137,.20,.038]);
 const head=pivot(root,'Head',[0,.91,.045]);
 sculpt([[0,.015,0,.325,.268,.225],[-.185,-.085,.015,.125,.125,.17],[.185,-.085,.015,.125,.125,.17],[0,-.12,.06,.22,.10,.15]],.055,orange,head,'Feline_Head');
 for(const side of [-1,1]){
  const ear=pivot(head,side<0?'Ear_L':'Ear_R',[side*.215,.19,-.075]);ear.rotation.z=-side*.12;
  mesh(earGeometry(),orange,ear,'Pointed_Ear');mesh(earGeometry(true),pink,ear,'Inner_Ear',[0,.026,.066]);
  // A short twin muzzle, with no projecting rodent-like snout.
  ellipsoid(head,'Whisker_Pad',cream,[side*.060,-.103,.224],[.079,.052,.035]);
  ellipsoid(head,'Chin',cream,[0,-.16,.20],[.076,.027,.028]);
  for(let i=0;i<3;i++)curve(head,'Fine_Whisker',[[side*.115,-.105+i*.017,.262],[side*.24,-.10+i*.025,.266],[side*.335,-.105+i*.038,.242]],.0025,mat(0x998571,1));
  for(let i=0;i<2;i++)curve(head,'Cheek_Tab',[[side*.283,-.005-i*.053,.12],[side*.265,-.020-i*.053,.155],[side*.24,-.032-i*.053,.176]],.010,stripe);
  const arm=pivot(root,side<0?'Arm_L':'Arm_R',[side*.14,.52,.13]);
  ellipsoid(arm,'Slim_Foreleg',orange,[0,-.21,.05],[.061,.22,.067]);ellipsoid(arm,'Grounded_Forepaw',cream,[0,-.414,.095],[.078,.052,.105]);
  for(let i=0;i<2;i++)curve(arm,'Toe_Seam',[[((i-.5)*.035),-.398,.19],[((i-.5)*.035),-.424,.194]],.0025,stripe);
  const leg=pivot(root,side<0?'Leg_L':'Leg_R',[side*.245,.15,-.02]);
  ellipsoid(leg,'Haunch',orange,[side*.01,.02,-.01],[.12,.16,.155]);ellipsoid(leg,'Cream_Hind_Toes',cream,[0,-.067,.13],[.10,.061,.15]);
  curve(arm,'Leg_Tab',[[side*.045,-.14,.095],[0,-.15,.118],[-side*.045,-.14,.097]],.009,stripe);
 }
 const eyes=pivot(head,'Eyes',[0,0,0]);
 for(const side of [-1,1]){
  const eye=pivot(eyes,side<0?'Eye_L':'Eye_R',[side*.13,.031,.217]);eye.rotation.y=side*.18;
  const rim=mesh(almond(),mat(0xa87645,.9),eye,'Almond_Eyelid');rim.scale.set(1.09,1.12,1);rim.position.z=-.004;
  mesh(almond(),green,eye,'Almond_Iris');
  ellipsoid(eye,'Pupil',ink,[0,.003,.026],[.013,.042,.012]);
  ellipsoid(eye,'Catchlight',mat(0xffffff,.1),[-.018,.022,.034],[.012,.013,.004]);
  ellipsoid(eye,'Catchlight_Small',cream,[.013,-.015,.035],[.005,.006,.003]);
 }
 // Flat tabby marks hug the forehead; the previous raised zig-zag looked like eyebrows.
 for(const [x,y,z]of [[0,.205,.143],[-.082,.19,.155],[.082,.19,.155]])curve(head,'Forehead_Tab',[[x*.85,y+.025,z-.025],[x,y,z],[x*.82,y-.065,z+.039]],.010,stripe);
 const nose=new THREE.Shape();nose.moveTo(-.023,.009);nose.quadraticCurveTo(0,.017,.023,.009);nose.quadraticCurveTo(.017,-.006,0,-.020);nose.quadraticCurveTo(-.017,-.006,-.023,.009);
 mesh(new THREE.ExtrudeGeometry(nose,{depth:.009,bevelEnabled:true,bevelSize:.004,bevelThickness:.004,bevelSegments:2}),pink,head,'Cat_Heart_Nose',[0,-.074,.264]);
 curve(head,'Mouth_Stem',[[0,-.09,.274],[0,-.123,.269]],.0035,ink);
 curve(head,'Smile_L',[[0,-.123,.269],[-.026,-.141,.26],[-.045,-.126,.249]],.0035,ink);
 curve(head,'Smile_R',[[0,-.123,.269],[.026,-.141,.26],[.045,-.126,.249]],.0035,ink);
 const happy=ellipsoid(head,'Happy_Mouth',mat(0x82534a,.95),[0,-.137,.268],[.036,.027,.010]);happy.visible=false;
 const tongue=ellipsoid(head,'Happy_Tongue',pink,[0,-.147,.278],[.021,.009,.004]);tongue.visible=false;
 const tail=pivot(root,'Tail',[.25,.23,-.15]);
 curve(tail,'Upright_Cat_Tail',[[0,0,0],[.17,.02,-.09],[.29,.16,-.1],[.30,.36,-.1],[.22,.46,-.07]],.049,orange);
 ellipsoid(tail,'Tail_Tip',cream,[.22,.46,-.07],[.049,.056,.048]);
 for(let i=0;i<3;i++){const ring=mesh(new THREE.TorusGeometry(.049,.011,6,18),stripe,tail,'Tabby_Tail_Ring',[.30-i*.007,.17+i*.08,-.1]);ring.rotation.x=Math.PI/2;}
 const bow=pivot(root,'Bow',[0,.69,.23]),teal=mat(0x699e95,.88);
 for(const side of [-1,1]){const wing=ellipsoid(bow,'Scarf_Wing',teal,[side*.055,0,0],[.06,.034,.022]);wing.rotation.z=side*.3;}
 ellipsoid(bow,'Bell',mat(0xe5bc68,.32,{metalness:.3}),[0,-.033,.03],[.028,.033,.025]);
 return root;
}
