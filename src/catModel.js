import * as THREE from 'three';
import {mat,mesh,pivot,ellipsoid,sculpt,curve} from './rabbitModel.js';
function earGeometry(inner=false) {
  const shape=new THREE.Shape();shape.moveTo(-.13,0);shape.quadraticCurveTo(-.145,.07,-.09,.27);shape.quadraticCurveTo(-.08,.31,-.045,.28);shape.quadraticCurveTo(.07,.20,.13,0);shape.quadraticCurveTo(0,-.04,-.13,0);
  const geo=new THREE.ExtrudeGeometry(shape,{depth:inner?.01:.065,bevelEnabled:true,bevelSize:inner?.006:.023,bevelThickness:.018,bevelSegments:3,steps:1,curveSegments:12});
  if(inner)geo.scale(.65,.65,1);return geo;
}
export function createCatModel() {
  const root=new THREE.Group();root.name='Marmalade_Rig';
  const orange=mat(0xe6a153,.94),cream=mat(0xffefd3,.97),stripe=mat(0xac6738,.96),pink=mat(0xd99b8d,.88),dark=mat(0x3f342a,.24);
  const body=pivot(root,'Torso',[0,.42,0]);
  sculpt([[0,0,0,.33,.36,.27],[0,.24,.01,.235,.22,.21],[-.24,-.13,0,.16,.18,.20],[.24,-.13,0,.16,.18,.20]],.10,orange,body,'Cat_Sculpted_Body');
  ellipsoid(body,'Cream_Chest',cream,[0,.025,.235],[.20,.27,.07]);
  const head=pivot(root,'Head',[0,.91,.045]);
  sculpt([[0,.01,0,.375,.275,.25],[-.23,-.09,.025,.17,.15,.21],[.23,-.09,.025,.17,.15,.21]],.08,orange,head,'Cat_Sculpted_Head');
  for(const side of [-1,1]) {
    const ear=pivot(head,side<0?'Ear_L':'Ear_R',[side*.245,.20,-.07]);ear.rotation.z=-side*.10;ear.scale.set(.95,.78,1);
    mesh(earGeometry(),orange,ear,'Cat_Ear');mesh(earGeometry(true),pink,ear,'Inner_Ear',[0,.035,.086]);
    ellipsoid(head,'Muzzle',cream,[side*.065,-.108,.245],[.092,.057,.038]);
    for(let i=0;i<3;i++)curve(head,'Whisker',[[side*.12,-.125+i*.018,.30],[side*.28,-.12+i*.035,.30],[side*.35,-.13+i*.050,.27]],.0038,mat(0x8e7358,1));
    for(let i=0;i<2;i++)curve(head,'Cheek_Stripe',[[side*.31,-.005-i*.065,.185],[side*.29,-.032-i*.065,.221],[side*.255,-.04-i*.065,.244]],.014,stripe);
    const arm=pivot(root,side<0?'Arm_L':'Arm_R',[side*.185,.52,.13]);
    ellipsoid(arm,'Front_Leg',orange,[0,-.16,.04],[.085,.23,.09]);ellipsoid(arm,'Cream_Toes',cream,[0,-.30,.08],[.098,.07,.11]);
    const leg=pivot(root,side<0?'Leg_L':'Leg_R',[side*.285,.15,-.02]);
    ellipsoid(leg,'Hind_Paw',orange,[0,-.055,.08],[.12,.09,.18]);ellipsoid(leg,'Cream_Hind_Toes',cream,[0,-.048,.20],[.10,.066,.066]);
    curve(arm,'Leg_Stripe',[[side*.06,-.12,.11],[0,-.13,.13],[-side*.05,-.12,.10]],.012,stripe);
  }
  const eyes=pivot(head,'Eyes',[0,0,0]);
  for(const side of [-1,1]) {
    const eye=pivot(eyes,side<0?'Eye_L':'Eye_R',[side*.15,.025,.25]);eye.rotation.y=side*.22;
    ellipsoid(eye,'Iris',mat(0xa4b57a,.3),[0,0,0],[.075,.051,.026]);
    ellipsoid(eye,'Pupil',dark,[0,0,.026],[.014,.042,.012]);
    ellipsoid(eye,'Catchlight',mat(0xffffff,.1),[-.014,.019,.034],[.013,.014,.005]);
  }
  for(const side of [-1,1])curve(head,'Forehead_M',[[side*.19,.19,.18],[side*.13,.15,.235],[side*.09,.205,.215],[side*.035,.155,.25]],.014,stripe);
  const noseShape=new THREE.Shape();noseShape.moveTo(-.027,.012);noseShape.lineTo(.027,.012);noseShape.quadraticCurveTo(.018,-.012,0,-.022);noseShape.quadraticCurveTo(-.018,-.012,-.027,.012);
  mesh(new THREE.ExtrudeGeometry(noseShape,{depth:.012,bevelEnabled:true,bevelSize:.005,bevelThickness:.005,bevelSegments:2}),pink,head,'Cat_Nose',[0,-.075,.285]);
  curve(head,'Mouth',[[0,-.10,.295],[0,-.14,.294],[-.03,-.155,.290]],.004,dark);
  curve(head,'Smile',[[0,-.14,.294],[.03,-.155,.290],[.05,-.14,.285]],.004,dark);
  const happy=ellipsoid(head,'Happy_Mouth',mat(0x7b4c40,1),[0,-.15,.296],[.042,.030,.013]);happy.visible=false;
  const tongue=ellipsoid(head,'Happy_Tongue',pink,[0,-.165,.307],[.024,.010,.005]);tongue.visible=false;
  const tail=pivot(root,'Tail',[.25,.23,-.15]);
  const tailPoints=[[0,0,0],[.19,.01,-.1],[.36,.08,-.08],[.41,.27,-.06],[.36,.43,-.03]];
  curve(tail,'Curled_Tail',tailPoints,.065,orange);
  ellipsoid(tail,'Tail_Tip',cream,[.36,.43,-.03],[.064,.07,.063]);
  for(let i=0;i<3;i++)curve(tail,'Tail_Ring',[[.33+i*.025,.12+i*.09,-.11],[.40+i*.005,.13+i*.09,-.04],[.40-i*.01,.13+i*.09,0]],.014,stripe);
  const bow=pivot(root,'Bow',[0,.69,.25]);
  const teal=mat(0x639c94,.85);
  for(const side of [-1,1]){const wing=ellipsoid(bow,'Scarf_Wing',teal,[side*.07,0,0],[.075,.045,.027]);wing.rotation.z=side*.3;}
  ellipsoid(bow,'Bell',mat(0xe5bc68,.32,{metalness:.3}),[0,-.04,.035],[.039,.045,.035]);
  return root;
}
