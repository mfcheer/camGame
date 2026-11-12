import * as THREE from 'three';
import {mat,mesh,pivot,ellipsoid,sculpt,curve} from './rabbitModel.js';

// A friendly hatchling, with a full silhouette rather than a recoloured mammal.
export function createDragonModel() {
 const root=new THREE.Group();root.name='Jade_Dragon_Rig';
 const jade=mat(0x65ac9e,.82),deep=mat(0x408c80,.9),cream=mat(0xf2dfa9,.9),horn=mat(0xe8b56d,.65),ink=mat(0x243b3a,.25),rose=mat(0xe2a5a2,.9),membrane=mat(0xb7a2cc,.9,{side:THREE.DoubleSide});
 const body=pivot(root,'Torso',[0,.40,0]);
 sculpt([[0,0,0,.27,.33,.24],[0,.20,.01,.21,.22,.19]],.08,jade,body,'Dragon_Plump_Body');
 ellipsoid(body,'Golden_Belly',cream,[0,-.015,.205],[.19,.26,.055]);
 for(let i=0;i<4;i++)curve(body,'Belly_Plate',[[ -.13+i*.008,.13-i*.09,.245],[0,.11-i*.09,.268],[.13-i*.008,.13-i*.09,.245]],.004,horn);
 const head=pivot(root,'Head',[0,.88,.025]);
 sculpt([[0,.015,0,.28,.27,.235],[0,-.11,.19,.22,.13,.19]],.07,jade,head,'Dragon_Head_And_Snout');
 ellipsoid(head,'Soft_Muzzle',mat(0x91c3a9,.88),[0,-.09,.29],[.19,.09,.105]);
 for(const s of [-1,1]){
  ellipsoid(head,'Nostril',deep,[s*.082,-.04,.382],[.017,.011,.008]);
  ellipsoid(head,'Rosy_Cheek',rose,[s*.22,-.074,.179],[.040,.025,.014]);
  const ear=pivot(head,s<0?'Ear_L':'Ear_R',[s*.235,.10,-.035]);
  ellipsoid(ear,'Side_Fin',jade,[s*.062,.055,-.015],[.10,.065,.028]);ear.rotation.z=-s*.38;
  curve(head,'Curved_Horn',[[s*.18,.19,-.05],[s*.22,.29,-.07],[s*.19,.39,-.07],[s*.16,.43,-.04]],.038,horn);
  const arm=pivot(root,s<0?'Arm_L':'Arm_R',[s*.235,.47,.10]);
  ellipsoid(arm,'Short_Arm',jade,[s*.025,-.10,.035],[.065,.13,.07]);ellipsoid(arm,'Little_Hand',jade,[s*.03,-.215,.06],[.077,.06,.08]);
  const leg=pivot(root,s<0?'Leg_L':'Leg_R',[s*.21,.135,-.015]);
  ellipsoid(leg,'Haunch',jade,[s*.015,.015,0],[.12,.145,.14]);ellipsoid(leg,'Foot',jade,[s*.015,-.065,.085],[.12,.07,.18]);
  for(let i=0;i<3;i++)ellipsoid(leg,'Tiny_Claw',cream,[s*.015+(i-1)*.055,-.065,.239],[.017,.020,.035]);
  const wing=pivot(body,s<0?'Wing_L':'Wing_R',[s*.15,.13,-.16]);
  const shape=new THREE.Shape();shape.moveTo(0,0);shape.quadraticCurveTo(s*.15,.39,s*.40,.44);shape.quadraticCurveTo(s*.52,.34,s*.57,.08);shape.quadraticCurveTo(s*.43,.15,s*.38,-.06);shape.quadraticCurveTo(s*.26,.055,s*.20,-.14);shape.quadraticCurveTo(s*.08,-.04,0,0);
  mesh(new THREE.ShapeGeometry(shape,20),membrane,wing,'Scalloped_Wing_Membrane');
  for(const end of [[s*.40,.44,0],[s*.57,.08,0],[s*.38,-.06,0],[s*.20,-.14,0]])curve(wing,'Wing_Finger',[[0,0,.005],[end[0]*.5,end[1]*.6,.01],end],.012,deep);
  curve(wing,'Wing_Leading_Edge',[[0,0,0],[s*.15,.33,0],[s*.40,.44,0],[s*.51,.32,0],[s*.57,.08,0]],.018,jade);
 }
 const eyes=pivot(head,'Eyes',[0,0,0]);
 for(const s of [-1,1]){
  const eye=pivot(eyes,s<0?'Eye_L':'Eye_R',[s*.135,.06,.218]);eye.rotation.y=s*.18;
  ellipsoid(eye,'Golden_Eye',cream,[0,0,0],[.062,.079,.032]);ellipsoid(eye,'Pupil',ink,[0,0,.027],[.031,.051,.015]);ellipsoid(eye,'Catchlight',mat(0xffffff,.1),[-.01,.022,.041],[.012,.015,.004]);
 }
 curve(head,'Smile',[[-.13,-.12,.34],[-.07,-.153,.376],[0,-.161,.386],[.07,-.153,.376],[.13,-.12,.34]],.005,deep);
 const happy=ellipsoid(head,'Happy_Mouth',ink,[0,-.151,.379],[.073,.045,.014]);happy.visible=false;
 const tongue=ellipsoid(head,'Happy_Tongue',rose,[0,-.17,.393],[.039,.015,.005]);tongue.visible=false;
 const tail=pivot(root,'Tail',[0,.24,-.19]);
 curve(tail,'Curled_Tail',[[0,0,0],[.23,-.06,-.18],[.40,-.05,-.27],[.48,.07,-.29],[.43,.19,-.26]],.065,jade);
 for(let i=0;i<4;i++){const spike=mesh(new THREE.ConeGeometry(.039,.095,5),horn,tail,'Tail_Spine');spike.position.set(.13+i*.085,.025+i*.012,-.1-i*.045);spike.rotation.z=-.25;}
 const tip=mesh(new THREE.ConeGeometry(.08,.17,4),horn,tail,'Tail_Diamond');tip.position.set(.43,.20,-.26);tip.rotation.z=.3;
 for(let i=0;i<3;i++){const spike=mesh(new THREE.ConeGeometry(.045,.10,5),horn,head,'Crest_Spine');spike.position.set(0,.20-i*.035,-.13-i*.045);spike.rotation.x=-.55;}
 const bow=pivot(root,'Bow',[0,.64,.23]);
 ellipsoid(bow,'Amber_Amulet',horn,[0,0,0],[.060,.069,.025]);ellipsoid(bow,'Amulet_Gem',mat(0x8a76ab,.35),[0,0,.025],[.035,.044,.012]);
 return root;
}
