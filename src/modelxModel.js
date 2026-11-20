import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {mat,mesh,pivot,ellipsoid,curve} from './rabbitModel.js';
export function createModelXModel(){
 const root=new THREE.Group();root.name='ModelX_Rig';
 const white=mat(0xf2f4f4,.3),glass=mat(0x233e52,.24),ink=mat(0x223144,.7),silver=mat(0xaec4d2,.38),rubber=mat(0x26303a,.9),lamp=mat(0xc3edff,.3);
 const body=pivot(root,'Torso',[0,.38,0]);
 mesh(new RoundedBoxGeometry(.84,.40,1.46,4,.14),white,body,'SUV_Body');
 mesh(new RoundedBoxGeometry(.68,.34,.94,4,.13),glass,body,'Panoramic_Roof',[0,.25,-.12]);
 ellipsoid(body,'White_Roof_Rail',white,[0,.385,-.20],[.35,.045,.34]);
 const head=pivot(root,'Head',[0,0,0]);
 ellipsoid(head,'Windshield',glass,[0,.66,.30],[.34,.17,.16]);
 const eyes=pivot(head,'Eyes',[0,.675,.441]);
 for(const s of [-1,1]){
  const eye=pivot(eyes,s<0?'Eye_L':'Eye_R',[s*.135,0,0]);
  ellipsoid(eye,'Eye_White',white,[0,0,0],[.086,.060,.022]);
  ellipsoid(eye,'Pupil',ink,[0,0,.020],[.035,.042,.012]);
  ellipsoid(eye,'Catchlight',white,[-.01,.016,.031],[.010,.011,.004]);
  const brow=ellipsoid(head,s<0?'Brow_L':'Brow_R',silver,[s*.135,.762,.432],[.086,.012,.012]);brow.rotation.z=s*.07;
  pivot(head,s<0?'Ear_L':'Ear_R',[s*.42,.56,.30]);
  ellipsoid(body,'Mirror',white,[s*.43,.18,.29],[.09,.04,.08]);
  const light=ellipsoid(body,'Narrow_Headlight',lamp,[s*.285,.035,.697],[.115,.025,.032]);light.rotation.z=-s*.1;
  ellipsoid(body,'Rear_Light',mat(0xe85a61,.4),[s*.30,.045,-.704],[.10,.023,.027]);
  // Roof hinge: lower door swings out and up, like the Model X falcon wing.
  const door=pivot(root,s<0?'Falcon_L':'Falcon_R',[s*.27,.73,-.23]);
  mesh(new RoundedBoxGeometry(.075,.40,.51,3,.045),white,door,'Falcon_White_Panel',[s*.12,-.25,0]);
  mesh(new RoundedBoxGeometry(.06,.17,.47,3,.025),glass,door,'Falcon_Glass',[s*.065,-.075,0]);
  ellipsoid(door,'Flush_Handle',silver,[s*.177,-.23,.12],[.008,.014,.055]);
  for(const [name,z] of [[s<0?'Arm_L':'Arm_R',.45],[s<0?'Leg_L':'Leg_R',-.47]]){
   const w=pivot(root,name,[s*.39,.16,z]);
   const tire=mesh(new THREE.CylinderGeometry(.158,.158,.105,24),rubber,w,'Tire');tire.rotation.z=Math.PI/2;
   const hub=mesh(new THREE.CylinderGeometry(.105,.105,.11,20),silver,w,'Alloy');hub.rotation.z=Math.PI/2;
   for(let i=0;i<5;i++){const spoke=mesh(new THREE.BoxGeometry(.012,.14,.025),ink,w,'Spoke',[s*.058,0,0]);spoke.rotation.x=i*Math.PI/5;}
  }
 }
 const tail=pivot(root,'Tail',[0,.62,-.67]);ellipsoid(tail,'Rear_Spoiler',white,[0,0,0],[.34,.025,.08]);
 const badge=pivot(root,'Bow',[0,.46,.74]);
 curve(badge,'Tesla_Badge',[[-.035,.018,0],[0,.025,.005],[.035,.018,0]],.006,silver);
 curve(badge,'Badge_Stem',[[0,.02,0],[0,-.02,.008]],.006,silver);
 curve(head,'Smile',[[-.14,.315,.751],[0,.282,.787],[.14,.315,.751]],.009,ink);
 const happy=pivot(head,'Happy_Mouth',[0,0,0]);curve(happy,'Happy_Curve',[[-.15,.325,.753],[0,.275,.794],[.15,.325,.753]],.012,ink);happy.visible=false;
 return root;
}
