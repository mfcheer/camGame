import * as THREE from 'three';
import {mat,mesh,pivot,ellipsoid,sculpt,curve} from './rabbitModel.js';
export function createFrogModel() {
  const root=new THREE.Group();root.name='Pond_Frog_Rig';
  const skin=mat(0x7eaf63,.83),shade=mat(0x648e53,.90),belly=mat(0xe6e3a4,.94),cream=mat(0xfff3cb,.75),dark=mat(0x293e2c,.24),pink=mat(0xe6a096,.85);
  const body=pivot(root,'Torso',[0,.30,0]);
  sculpt([[0,0,0,.29,.27,.24],[-.23,-.11,-.055,.17,.18,.21],[.23,-.11,-.055,.17,.18,.21]],.085,skin,body,'Frog_Round_Body');
  ellipsoid(body,'Cream_Belly',belly,[0,-.005,.21],[.215,.22,.060]);
  const head=pivot(root,'Head',[0,.68,.045]);
  sculpt([[0,0,0,.39,.21,.25],[-.245,-.025,.025,.17,.14,.21],[.245,-.025,.025,.17,.14,.21]],.07,skin,head,'Frog_Wide_Head');
  for(const s of [-1,1]) {
    ellipsoid(head,'Eye_Mound',skin,[s*.235,.15,.02],[.147,.16,.15]);
    ellipsoid(head,'Cheek',mat(0xb1c17c,.93),[s*.305,-.055,.19],[.055,.035,.020]);
    ellipsoid(head,'Nostril',shade,[s*.060,.018,.247],[.012,.008,.006]);
    // Rig-compatible empty pivots: frogs have no ears or tail.
    pivot(head,s<0?'Ear_L':'Ear_R',[s*.23,.15,0]);
    const arm=pivot(root,s<0?'Arm_L':'Arm_R',[s*.23,.34,.13]);
    curve(arm,'Foreleg',[[0,0,0],[s*.05,-.11,.035],[s*.02,-.24,.09]],.037,skin);
    ellipsoid(arm,'Palm',skin,[s*.02,-.245,.09],[.07,.035,.07]);
    for(let i=0;i<3;i++){const x=s*.02+(i-1)*.044;curve(arm,'Finger',[[s*.02,-.25,.10],[x,-.265,.14],[x*1.1,-.26,.18]],.012,skin);ellipsoid(arm,'Finger_Pad',belly,[x*1.1,-.26,.18],[.022,.012,.025]);}
    const leg=pivot(root,s<0?'Leg_L':'Leg_R',[s*.28,.14,-.015]);
    ellipsoid(leg,'Folded_Haunch',skin,[s*.035,.02,-.045],[.13,.15,.16]);
    ellipsoid(leg,'Webbed_Hind_Foot',skin,[s*.04,-.085,.11],[.16,.035,.19]);
    for(let i=0;i<3;i++)ellipsoid(leg,'Toe_Pad',belly,[s*.04+(i-1)*.08,-.077,.245-Math.abs(i-1)*.025],[.035,.016,.042]);
  }
  const eyes=pivot(head,'Eyes',[0,0,0]);
  for(const s of [-1,1]) {
    const eye=pivot(eyes,s<0?'Eye_L':'Eye_R',[s*.235,.17,.14]);
    ellipsoid(eye,'Golden_Iris',cream,[0,0,0],[.105,.11,.07]);
    ellipsoid(eye,'Pupil',dark,[0,.004,.061],[.047,.069,.023]);
    ellipsoid(eye,'Catchlight',mat(0xffffff,.1),[-.014,.030,.082],[.017,.020,.006]);
  }
  curve(head,'Smile',[[-.23,-.035,.217],[-.13,-.095,.26],[0,-.117,.272],[.13,-.095,.26],[.23,-.035,.217]],.007,shade);
  const happy=ellipsoid(head,'Happy_Mouth',dark,[0,-.096,.275],[.105,.061,.014]);happy.visible=false;
  const tongue=ellipsoid(head,'Happy_Tongue',pink,[0,-.127,.289],[.06,.021,.006]);tongue.visible=false;
  for(const [x,y,z,r]of[[-.17,.10,-.19,.030],[.11,.18,-.17,.025],[.26,.05,-.15,.025],[-.29,-.03,-.08,.021]])ellipsoid(body,'Skin_Spot',shade,[x,y,z],[r,r*.7,.012]);
  const bow=pivot(root,'Bow',[0,.435,.24]);
  for(let i=0;i<5;i++){const a=i*Math.PI*2/5;ellipsoid(bow,'Marigold_Petal',mat(0xf5cb71,.9),[Math.cos(a)*.038,Math.sin(a)*.038,0],[.027,.026,.012]);}
  ellipsoid(bow,'Flower_Center',mat(0xc8874d,.85),[0,0,.015],[.022,.022,.012]);
  pivot(root,'Tail',[0,.2,-.2]);
  return root;
}
