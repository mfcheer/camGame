import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {mat,mesh,pivot,ellipsoid,curve} from './rabbitModel.js';

// Original, toy-like construction friend. Every moving part is a named pivot shared
// by the native fallback and exported GLB so the bucket can act in game and camp.
export function createExcavatorModel(){
  const root=new THREE.Group();root.name='Sunny_Excavator_Rig';
  const yellow=mat(0xf5ba27,.48,{metalness:.08}),gold=mat(0xe59b17,.57),light=mat(0xffdf65,.46);
  const cream=mat(0xfff3cf,.72),white=mat(0xffffff,.3),ink=mat(0x26394b,.38),glass=mat(0x83c9dd,.22,{metalness:.12});
  const tracks=mat(0x405767,.83),trackFace=mat(0x637987,.76),steel=mat(0xa2b8b8,.48,{metalness:.28}),pink=mat(0xf1998f,.8);
  const box=(p,n,m,pos,size,r=.07)=>mesh(new RoundedBoxGeometry(...size,3,r),m,p,n,pos);
  const rod=(p,n,m,a,b,r=.045)=>{const A=new THREE.Vector3(...a),B=new THREE.Vector3(...b),d=B.clone().sub(A);const o=mesh(new THREE.CylinderGeometry(r,r,d.length(),12),m,p,n,A.clone().add(B).multiplyScalar(.5).toArray());o.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),d.normalize());return o;};
  // Chunky twin rubber tracks and painted rollers read at small thumbnail sizes.
  for(const s of [-1,1]){
    const track=pivot(root,s<0?'Leg_L':'Leg_R',[s*.29,.19,.02]);
    box(track,'Rubber_Track',tracks,[0,0,0],[.79,.25,.31],.12);
    box(track,'Track_Inset',trackFace,[0,.013,.165],[.64,.16,.026],.07);
    for(const x of [-.23,0,.23]){
      const roller=mesh(new THREE.CylinderGeometry(.067,.067,.038,18),steel,track,'Track_Roller',[x,.013,.185]);roller.rotation.x=Math.PI/2;
      ellipsoid(track,'Roller_Hub',cream,[x,.013,.210],[.022,.022,.006]);
    }
    for(let x=-.31;x<=.33;x+=.11)box(track,'Track_Tread',ink,[x,-.113,.064],[.054,.023,.305],.01);
  }
  const under=pivot(root,'Tail',[0,.32,-.04]);box(under,'Undercarriage',steel,[0,0,0],[.70,.20,.39],.07);
  const body=pivot(root,'Torso',[0,.59,0]);
  box(body,'Yellow_Body',yellow,[0,0,0],[.87,.42,.62],.15);
  box(body,'Rear_Counterweight',gold,[-.38,.055,-.02],[.18,.37,.60],.07);
  for(const x of [-.25,-.13,-.01])box(body,'Vent',ink,[x,.065,-.315],[.035,.15,.012],.009);
  // Big, friendly cab with a cream windshield frame and two expressive eyes.
  const head=pivot(root,'Head',[-.14,.83,.07]);
  box(head,'Cab_Roof',yellow,[-.045,.30,-.055],[.61,.14,.58],.065);
  box(head,'Cab_Shell',cream,[-.045,.075,-.055],[.60,.47,.57],.12);
  box(head,'Windshield',glass,[-.045,.115,.244],[.48,.33,.028],.073);
  box(head,'Windshield_Shine',white,[-.19,.19,.264],[.035,.12,.008],.012);
  box(head,'Side_Window',glass,[-.351,.10,-.055],[.018,.24,.37],.008);
  const eyes=pivot(head,'Eyes',[0,0,0]);
  for(const s of [-1,1]){
    const eye=pivot(eyes,s<0?'Eye_L':'Eye_R',[s*.135-.045,.115,.274]);
    ellipsoid(eye,'Eye_White',white,[0,0,0],[.074,.091,.026]);
    ellipsoid(eye,'Pupil',ink,[s*.012,-.006,.025],[.038,.055,.015]);
    ellipsoid(eye,'Catchlight',white,[s*.002-.012,.020,.037],[.013,.017,.007]);
    const ear=pivot(head,s<0?'Ear_L':'Ear_R',[s*.23-.045,.31,.02]);
    ellipsoid(ear,'Roof_Light',s<0?light:pink,[0,.025,0],[.05,.05,.05]);
  }
  curve(head,'Smile',[[-.15,.005,.29],[-.07,-.032,.302],[.01,-.032,.302],[.08,.008,.29]],.009,ink);
  // 欢庆开怀大笑（工程车开朗笑弧，告别突兀的人类肉感舌头）
  const happy=pivot(head,'Happy_Mouth',[-.04,-.018,.295]);happy.visible=false;
  curve(happy,'Excavator_Happy_Arc',[[-.13,.015,0],[0,-.032,.008],[.13,.015,0]],.0095,ink);
  curve(happy,'Excavator_Happy_L',[[-.13,.015,0],[-.14,.028,-.002]],.007,ink);
  curve(happy,'Excavator_Happy_R',[[.13,.015,0],[.14,.028,-.002]],.007,ink);
  ellipsoid(head,'Cheek_L',pink,[-.248,-.005,.28],[.052,.023,.009]);
  ellipsoid(head,'Cheek_R',pink,[.165,-.005,.28],[.052,.023,.009]);
  const badge=pivot(root,'Bow',[-.29,.57,.325]);
  ellipsoid(badge,'Star_Badge',cream,[0,0,0],[.07,.07,.02]);
  ellipsoid(badge,'Badge_Centre',gold,[0,0,.018],[.029,.029,.01]);
  // Three hinged sections: shoulder, forearm and scoop. The hinge pins and
  // hydraulic rods are modeled, rather than a single flat silhouette.
  const boom=pivot(root,'Boom_Base',[.32,.80,-.12]);
  const base=box(boom,'Main_Boom',yellow,[.23,.28,0],[.71,.17,.24],.065);base.rotation.z=.88;
  ellipsoid(boom,'Shoulder_Pin',steel,[0,0,.125],[.09,.09,.026]);
  rod(boom,'Main_Hydraulic',steel,[.04,-.09,.13],[.34,.38,.13],.035);
  const elbow=pivot(boom,'Boom_Elbow',[.46,.55,0]);
  ellipsoid(elbow,'Elbow_Pin',steel,[0,0,.125],[.075,.075,.025]);
  const fore=box(elbow,'Forearm',gold,[.18,-.23,0],[.17,.57,.205],.057);fore.rotation.z=.73;
  rod(elbow,'Bucket_Hydraulic',steel,[.08,-.035,.125],[.30,-.39,.125],.028);
  const bucket=pivot(elbow,'Bucket',[.34,-.48,.015]);
  box(bucket,'Scoop_Back',yellow,[.055,-.035,0],[.27,.20,.34],.035);
  box(bucket,'Scoop_Lip',gold,[.16,-.14,.005],[.075,.075,.36],.015);
  box(bucket,'Scoop_Cavity',ink,[.12,-.04,.179],[.18,.11,.012],.02);
  for(const z of [-.11,0,.11]){
    const tooth=mesh(new THREE.ConeGeometry(.025,.10,10),gold,bucket,'Bucket_Tooth',[.20,-.20,z]);tooth.rotation.z=Math.PI;
  }
  // Drive pivots exist to keep the common rig contract; tracks animate only
  // their local tread rollers, while the excavator waves with its bucket.
  const l=pivot(root,'Arm_L',[-.29,.19,.22]);
  const r=pivot(root,'Arm_R',[.29,.19,.22]);
  for(const p of [l,r])ellipsoid(p,'Drive_Sprocket',steel,[0,0,0],[.042,.042,.017]);
  return root;
}
