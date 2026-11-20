import * as THREE from 'three';
import {mat,mesh,pivot,ellipsoid,curve} from './rabbitModel.js';

// Original, non-transforming passenger plane. Arms are fixed wings, legs are gear.
export function createAirplaneModel(){
 const root=new THREE.Group();root.name='Cloud_Airplane_Rig';
 const blue=mat(0x50a8dc,.48),white=mat(0xfff7e6,.62),glass=mat(0x326889,.34),ink=mat(0x20384e,.65),gold=mat(0xffce68,.52),rubber=mat(0x344251,.9);
 const body=pivot(root,'Torso',[0,.43,0]);
 ellipsoid(body,'Blue_Fuselage',blue,[0,0,-.08],[.265,.245,.65]);
 ellipsoid(body,'Cream_Belly',white,[0,-.10,.02],[.25,.14,.53]);
 const head=pivot(root,'Head',[0,.46,.37]);
 ellipsoid(head,'Round_Nose',white,[0,-.035,.14],[.255,.205,.32]);
 ellipsoid(head,'Cockpit',glass,[0,.11,.11],[.235,.14,.25]);
 const eyes=pivot(head,'Eyes',[0,0,0]);
 for(const s of [-1,1]){
  const eye=pivot(eyes,s<0?'Eye_L':'Eye_R',[s*.103,.12,.32]);
  ellipsoid(eye,'Eye_White',white,[0,0,0],[.077,.070,.027]);
  ellipsoid(eye,'Pupil',ink,[0,0,.025],[.033,.044,.014]);
  ellipsoid(eye,'Catchlight',white,[-.010,.017,.038],[.010,.012,.005]);
  const brow=ellipsoid(head,s<0?'Brow_L':'Brow_R',blue,[s*.105,.214,.30],[.079,.015,.014]);brow.rotation.z=s*.08;
  pivot(head,s<0?'Ear_L':'Ear_R',[s*.25,.07,.02]);
  const wing=pivot(root,s<0?'Arm_L':'Arm_R',[s*.20,.39,-.05]);
  const plan=new THREE.Shape();plan.moveTo(0,.14);plan.lineTo(s*.72,-.06);plan.quadraticCurveTo(s*.83,-.12,s*.73,-.22);plan.lineTo(0,-.23);plan.closePath();
  const geo=new THREE.ExtrudeGeometry(plan,{depth:.045,bevelEnabled:true,bevelSize:.025,bevelThickness:.018,bevelSegments:2,steps:1});geo.rotateX(Math.PI/2);
  mesh(geo,blue,wing,s<0?'Wing_L':'Wing_R');
  ellipsoid(wing,'Wingtip_Gold',gold,[s*.69,.005,.16],[.065,.035,.12]);
  ellipsoid(wing,'Engine_Pod',white,[s*.29,-.085,.09],[.105,.10,.24]);
  ellipsoid(wing,'Engine_Intake',glass,[s*.29,-.085,.305],[.072,.070,.018]);
  ellipsoid(wing,'Engine_Center',gold,[s*.29,-.085,.325],[.025,.025,.012]);
  const gear=pivot(root,s<0?'Leg_L':'Leg_R',[s*.19,.10,-.20]);
  mesh(new THREE.CylinderGeometry(.015,.015,.15,10),ink,gear,'Gear_Strut',[0,.08,0]);
  const wheel=mesh(new THREE.CylinderGeometry(.075,.075,.055,20),rubber,gear,'Landing_Wheel');wheel.rotation.z=Math.PI/2;
  const hub=mesh(new THREE.CylinderGeometry(.03,.03,.06,16),gold,gear,'Wheel_Hub');hub.rotation.z=Math.PI/2;
  for(let i=0;i<3;i++)ellipsoid(body,'Passenger_Window',glass,[s*.25,.06,-.12-i*.13],[.016,.036,.038]);
 }
 const front=pivot(root,'Nose_Gear',[0,.075,.46]);
 mesh(new THREE.CylinderGeometry(.014,.014,.15,10),ink,front,'Front_Strut',[0,.075,0]);
 const wheel=mesh(new THREE.CylinderGeometry(.065,.065,.05,20),rubber,front,'Front_Wheel');wheel.rotation.z=Math.PI/2;
 const tail=pivot(root,'Tail',[0,.46,-.57]);
 ellipsoid(tail,'Tail_Fin',blue,[0,.18,-.015],[.038,.25,.16]);
 ellipsoid(tail,'Fin_Gold_Tip',gold,[0,.36,-.02],[.040,.045,.09]);
 ellipsoid(tail,'Tailplane',white,[0,.035,-.04],[.38,.035,.16]);
 curve(head,'Smile',[[-.115,-.055,.405],[0,-.091,.447],[.115,-.055,.405]],.009,ink);
 const happy=ellipsoid(head,'Happy_Mouth',ink,[0,-.073,.443],[.09,.038,.012]);happy.visible=false;
 const bow=pivot(root,'Bow',[0,.36,.68]);ellipsoid(bow,'Wing_Badge',gold,[0,0,0],[.065,.025,.012]);
 return root;
}
