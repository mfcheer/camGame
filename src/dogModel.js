import * as THREE from 'three';
import {mat,mesh,pivot,ellipsoid,sculpt,curve} from './rabbitModel.js';
function floppyEar() {
 const g=new THREE.SphereGeometry(1,24,28),p=g.attributes.position;
 for(let i=0;i<p.count;i++){const t=(1-p.getY(i))/2;p.setXYZ(i,p.getX(i)*(.085+.045*t),-.34*t,p.getZ(i)*.055+.045*Math.sin(t*Math.PI));}g.computeVertexNormals();return g;
}
export function createDogModel() {
 const root=new THREE.Group();root.name='Sunny_Puppy_Rig';
 const fur=mat(0xeacb97,.94),cream=mat(0xffefd1,.96),caramel=mat(0xb98250,.94),dark=mat(0x3f3028,.25),pink=mat(0xe3a398,.87);
 const body=pivot(root,'Torso',[0,.42,0]);
 sculpt([[0,0,0,.29,.35,.26],[0,.22,.02,.22,.22,.20],[-.21,-.14,-.04,.15,.18,.19],[.21,-.14,-.04,.15,.18,.19]],.085,fur,body,'Puppy_Plump_Body');
 ellipsoid(body,'Cream_Chest',cream,[0,.035,.23],[.17,.24,.055]);
 const head=pivot(root,'Head',[0,.88,.045]);
 sculpt([[0,.02,0,.305,.285,.25],[-.17,-.08,.06,.16,.155,.20],[.17,-.08,.06,.16,.155,.20],[0,-.11,.20,.19,.13,.14]],.075,fur,head,'Puppy_Head');
 ellipsoid(head,'Cream_Muzzle',cream,[0,-.105,.245],[.19,.115,.10]);
 ellipsoid(head,'Honey_Eye_Patch',caramel,[-.13,.048,.219],[.105,.13,.022]);
 ellipsoid(head,'Velvet_Nose',dark,[0,-.065,.353],[.063,.042,.035]);
 ellipsoid(head,'Nose_Glint',mat(0x987961,.5),[-.016,-.048,.382],[.018,.007,.004]);
 curve(head,'Mouth',[[0,-.093,.359],[0,-.144,.345],[-.06,-.17,.325],[-.11,-.144,.31]],.005,dark);
 curve(head,'Smile',[[0,-.144,.345],[.06,-.17,.325],[.11,-.144,.31]],.005,dark);
 for(const s of [-1,1]) {
  const ear=pivot(head,s<0?'Ear_L':'Ear_R',[s*.265,.20,-.055]);ear.rotation.z=s*.15;
  mesh(floppyEar(),caramel,ear,'Floppy_Ear');
  const arm=pivot(root,s<0?'Arm_L':'Arm_R',[s*.18,.43,.14]);
  ellipsoid(arm,'Foreleg',fur,[0,-.14,.015],[.075,.18,.08]);ellipsoid(arm,'Cream_Forepaw',cream,[0,-.32,.06],[.095,.075,.13]);
  const leg=pivot(root,s<0?'Leg_L':'Leg_R',[s*.225,.14,-.02]);
  ellipsoid(leg,'Hind_Paw',fur,[0,-.06,.08],[.115,.075,.18]);ellipsoid(leg,'Cream_Hind_Toes',cream,[0,-.055,.22],[.09,.058,.055]);
  for(let j=0;j<2;j++)curve(arm,'Toe_Seam',[[(j-.5)*.055,-.285,.17],[(j-.5)*.055,-.315,.183]],.003,caramel);
 }
 const eyes=pivot(head,'Eyes',[0,0,0]);
 for(const s of [-1,1]) {
  const eye=pivot(eyes,s<0?'Eye_L':'Eye_R',[s*.128,.055,.244]);eye.rotation.y=s*.15;
  ellipsoid(eye,'Warm_Brown_Eye',dark,[0,0,0],[.048,.058,.027]);
  ellipsoid(eye,'Catchlight',mat(0xffffff,.1),[-.013,.021,.024],[.014,.016,.005]);
  ellipsoid(head,'Brow',cream,[s*.135,.145,.20],[.061,.024,.018]);
 }
 const happy=ellipsoid(head,'Happy_Mouth',dark,[0,-.153,.342],[.072,.062,.016]);happy.visible=false;
 const tongue=ellipsoid(head,'Happy_Tongue',pink,[.018,-.19,.36],[.035,.048,.010]);tongue.visible=false;
 const tail=pivot(root,'Tail',[.22,.27,-.2]);
 curve(tail,'Wagging_Tail',[[0,0,0],[.13,.07,-.08],[.16,.22,-.12],[.12,.31,-.11]],.061,fur);
 ellipsoid(tail,'Cream_Tail_Tip',cream,[.12,.31,-.11],[.062,.065,.06]);
 const bow=pivot(root,'Bow',[0,.65,.245]);const red=mat(0xc97660,.9);
 const scarf=new THREE.Shape();scarf.moveTo(-.145,.045);scarf.lineTo(.145,.045);scarf.quadraticCurveTo(.08,-.065,0,-.13);scarf.quadraticCurveTo(-.08,-.065,-.145,.045);
 mesh(new THREE.ExtrudeGeometry(scarf,{depth:.025,bevelEnabled:true,bevelSize:.008,bevelThickness:.006,bevelSegments:2}),red,bow,'Terracotta_Bandana');
 ellipsoid(bow,'Medal',mat(0xe4bb68,.42,{metalness:.25}),[0,-.04,.038],[.037,.040,.014]);
 return root;
}
