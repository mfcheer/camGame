import * as THREE from 'three';
import {mat,mesh,pivot,ellipsoid,curve} from './rabbitModel.js';

function tapered(parent,name,points,radius,endRadius,material) {
 const path=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)));
 const g=new THREE.TubeGeometry(path,48,1,12,false),positions=g.attributes.position;
 for(let i=0;i<=48;i++){
  const t=i/48,center=path.getPointAt(t),r=THREE.MathUtils.lerp(radius,endRadius,t);
  for(let j=0;j<=12;j++){const k=i*13+j;positions.setXYZ(k,center.x+(positions.getX(k)-center.x)*r,center.y+(positions.getY(k)-center.y)*r,center.z+(positions.getZ(k)-center.z)*r);}
 }
 g.computeVertexNormals();return mesh(g,material,parent,name);
}

export function createGoldenDragonModel() {
 const root=new THREE.Group();root.name='Golden_Long_Dragon_Rig';
 const gold=mat(0xeab63e,.84),sun=mat(0xf8d36c,.82),amber=mat(0xc88130,.86),ivory=mat(0xffedbf,.86),ink=mat(0x493a28,.25),pink=mat(0xdc9d7e,.87);
 const body=pivot(root,'Torso',[0,.54,0]);
 tapered(body,'Slender_Serpentine_Body',[[0,-.42,0],[-.10,-.26,-.01],[-.08,-.04,-.04],[.065,.19,-.015],[.035,.43,.02]],.14,.105,gold);
 tapered(body,'Cream_Belly_Ribbon',[[.005,-.39,.105],[-.09,-.23,.107],[-.07,-.04,.087],[.055,.17,.094],[.035,.37,.105]],.070,.052,ivory);
 for(let i=0;i<7;i++){
  const y=-.32+i*.105,x=y<-.02?-.075:.045;
  curve(body,'Belly_Ridge',[[x-.052,y,.15],[x,y-.012,.174],[x+.052,y,.15]],.0035,amber);
  const fin=ellipsoid(body,'Golden_Back_Crest',sun,[x,y,-.13],[.037,.074,.037]);fin.rotation.x=-.30;
 }
 const head=pivot(root,'Head',[.035,1.10,.045]);
 ellipsoid(head,'Long_Dragon_Head',gold,[0,.005,0],[.225,.205,.205]);
 ellipsoid(head,'Long_Snout',sun,[0,-.07,.205],[.175,.09,.19]);
 ellipsoid(head,'Soft_Chin',ivory,[0,-.122,.19],[.14,.035,.14]);
 const eyes=pivot(head,'Eyes',[0,0,0]);
 for(const s of [-1,1]){
  const ear=pivot(head,s<0?'Ear_L':'Ear_R',[s*.20,.075,-.04]);
  const fin=ellipsoid(ear,'Leaf_Ear',gold,[s*.045,.025,-.015],[.085,.045,.025]);fin.rotation.z=s*.35;
  curve(head,'Antler_Main',[[s*.13,.16,-.04],[s*.18,.28,-.08],[s*.15,.38,-.06],[s*.19,.44,-.03]],.026,amber);
  curve(head,'Antler_Branch',[[s*.18,.27,-.08],[s*.25,.33,-.09],[s*.27,.37,-.07]],.019,amber);
  ellipsoid(head,'Nostril',amber,[s*.072,-.035,.378],[.015,.009,.007]);
  ellipsoid(head,'Blush',pink,[s*.185,-.06,.14],[.035,.020,.012]);
  const whisker=pivot(head,s<0?'Whisker_L':'Whisker_R',[s*.12,-.075,.33]);
  tapered(whisker,'Long_Flowing_Whisker',[[0,0,0],[s*.13,.035,.015],[s*.27,.015,0],[s*.34,.09,-.025],[s*.32,.14,-.03]],.010,.002,ivory);
  const eye=pivot(eyes,s<0?'Eye_L':'Eye_R',[s*.12,.042,.174]);eye.rotation.y=s*.18;
  ellipsoid(eye,'Eye_White',ivory,[0,0,0],[.059,.065,.03]);ellipsoid(eye,'Amber_Iris',amber,[0,0,.026],[.038,.049,.013]);ellipsoid(eye,'Pupil',ink,[0,0,.036],[.023,.038,.010]);ellipsoid(eye,'Catchlight',mat(0xffffff,.1),[-.009,.018,.045],[.011,.013,.004]);
  curve(head,'Expressive_Brow',[[s*.074,.115,.16],[s*.13,.13,.16],[s*.18,.10,.14]],.009,amber);
  const arm=pivot(root,s<0?'Arm_L':'Arm_R',[s*.12,.66,.035]);
  curve(arm,'Slender_Foreleg',[[0,0,0],[s*.065,-.09,.035],[s*.06,-.18,.07]],.030,gold);
  ellipsoid(arm,'Little_Paw',gold,[s*.06,-.18,.075],[.049,.032,.058]);
  const leg=pivot(root,s<0?'Leg_L':'Leg_R',[s*.105,.17,-.01]);
  curve(leg,'Slender_Hindleg',[[0,0,0],[s*.065,-.06,.035],[s*.05,-.10,.10]],.041,gold);ellipsoid(leg,'Hind_Paw',sun,[s*.05,-.105,.13],[.065,.035,.09]);
  for(let i=0;i<3;i++)ellipsoid(leg,'Small_Claw',ivory,[s*.05+(i-1)*.03,-.102,.208],[.010,.013,.024]);
 }
 curve(head,'Smile',[[-.10,-.095,.337],[0,-.12,.38],[.10,-.095,.337]],.004,amber);
 const happy=ellipsoid(head,'Happy_Mouth',ink,[0,-.112,.379],[.053,.030,.010]);happy.visible=false;
 const tongue=ellipsoid(head,'Happy_Tongue',pink,[0,-.123,.389],[.029,.009,.004]);tongue.visible=false;
 const beard=pivot(head,'Chin_Beard',[0,-.14,.21]);
 for(const s of [-1,0,1])tapered(beard,'Silken_Beard',[[s*.025,0,0],[s*.035,-.09,.015],[s*.018,-.16,0]],.012,.001,ivory);
 const tail=pivot(root,'Tail',[0,.16,-.075]);
 tapered(tail,'Long_Tapered_Tail',[[0,0,0],[.18,-.055,-.18],[.40,-.015,-.27],[.62,.08,-.25],[.73,.21,-.20],[.70,.32,-.14]],.10,.012,gold);
 for(let i=0;i<6;i++)ellipsoid(tail,'Tail_Crest',sun,[.12+i*.10,.015+i*.027,-.12-i*.017],[.045,.052,.025]);
 for(let i=0;i<5;i++)tapered(tail,'Tail_Tassel',[[.70,.28,-.15],[.73+(i-2)*.019,.38,-.16],[.68+(i-2)*.035,.47,-.13]],.016,.001,amber);
 const bow=pivot(root,'Bow',[.035,.84,.13]);
 ellipsoid(bow,'Jade_Pendant',mat(0x699d87,.5),[0,0,.015],[.044,.057,.021]);
 curve(bow,'Gold_Cord',[[-.07,.07,0],[0,.012,.015],[.07,.07,0]],.007,amber);
 return root;
}
