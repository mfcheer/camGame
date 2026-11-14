import * as THREE from 'three';
import {mat,mesh,pivot,ellipsoid,curve} from './rabbitModel.js';

// 麦奇的可动画原生模型。外形参照奥飞官方《萌鸡小队》角色图，
// 由项目内几何体独立制作；没有把动画剧照或原声作为游戏素材。
// https://www.gdalpha.com/star/star_details/id/10.html
export function createMaiqiModel(){
  const root=new THREE.Group();root.name='Mengji_Maiqi_Rig';
  const yellow=mat(0xf8d53d,.94),golden=mat(0xeab936,.96),belly=mat(0xffe897,.98);
  const crown=mat(0x86502f,.98),brown=mat(0x976038,.97),brownLight=mat(0xba804a,.96);
  const orange=mat(0xf3a344,.75),orangeLight=mat(0xffc36a,.7),mouth=mat(0x4b2b2a,.95),tongueMat=mat(0xe67e83,.9);
  const white=mat(0xfffcf0,.45),iris=mat(0x6a3d29,.5),pupil=mat(0x1c1a1b,.22),red=mat(0xc94336,.88),redDark=mat(0xa8332d,.88);
  const body=pivot(root,'Torso',[0,.49,0]);
  ellipsoid(body,'Maichi_Yellow_Body',yellow,[0,0,0],[.33,.36,.285]);
  ellipsoid(body,'Cream_Belly',belly,[0,-.055,.215],[.235,.235,.080]);
  // Three small downy chest tips give a feathered edge without flattening the body.
  for(const s of [-1,0,1]){
    const tip=ellipsoid(body,'Chest_Feather',belly,[s*.105,-.27,.20],[.065,.115,.055]);
    tip.rotation.z=s*.27;
  }
  const head=pivot(body,'Head',[0,.52,.035]);
  ellipsoid(head,'Round_Yellow_Head',yellow,[0,0,0],[.405,.39,.345]);
  // Brown centre V and swept side streaks are 麦奇's strongest small-screen markers.
  ellipsoid(head,'Brown_Crown',crown,[0,.316,-.055],[.205,.080,.215]);
  const mark=new THREE.Shape();
  mark.moveTo(-.165,.32);mark.lineTo(-.075,.295);mark.lineTo(-.010,.155);
  mark.lineTo(.045,.280);mark.lineTo(.155,.326);mark.lineTo(.07,.350);mark.lineTo(-.085,.345);mark.closePath();
  const v=mesh(new THREE.ShapeGeometry(mark,12),mat(0x82482b,.98,{side:THREE.DoubleSide}),head,'Brown_V_Crown',[0,0,.325]);
  v.rotation.x=-.06;
  for(const s of [-1,1]){
    const streak=ellipsoid(head,'Side_Crown_Streak',brown,[s*.266,.241,.215],[.029,.062,.018]);
    streak.rotation.z=s*.36;
  }
  for(const s of [-1,1]){
    const ear=pivot(head,s<0?'Ear_L':'Ear_R',[s*.33,.07,.025]);
    const tuft=ellipsoid(ear,'Cheek_Feather',yellow,[s*.010,-.115,.105],[.055,.075,.040]);
    tuft.rotation.z=-s*.35;
  }
  const eyes=pivot(head,'Eyes',[0,0,0]);
  for(const s of [-1,1]){
    const eye=pivot(eyes,s<0?'Eye_L':'Eye_R',[s*.15,.035,.29]);
    ellipsoid(eye,'Large_Eye_White',white,[0,0,0],[.098,.113,.042]);
    ellipsoid(eye,'Warm_Brown_Iris',iris,[s*.006,-.009,.040],[.069,.083,.025]);
    ellipsoid(eye,'Pupil',pupil,[s*.005,-.011,.063],[.049,.063,.016]);
    ellipsoid(eye,'Catchlight',white,[-.017,.025,.079],[.019,.024,.008]);
    const brow=ellipsoid(head,'Soft_Brow',brown,[s*.157,.177,.255],[.068,.014,.016]);
    brow.rotation.z=-s*.18;
    ellipsoid(head,'Warm_Cheek',orangeLight,[s*.238,-.125,.257],[.07,.035,.018]);
  }
  // Keep the smiling beak small and gently upturned, as in the animation.
  ellipsoid(head,'Smile',mouth,[0,-.150,.335],[.078,.027,.018]);
  ellipsoid(head,'Orange_Beak',orange,[0,-.120,.370],[.094,.035,.051]);
  ellipsoid(head,'Lower_Beak',orangeLight,[0,-.165,.365],[.071,.019,.037]);
  const happy=ellipsoid(head,'Happy_Mouth',mouth,[0,-.152,.343],[.084,.044,.018]);happy.visible=false;
  const tongue=ellipsoid(head,'Happy_Tongue',tongueMat,[0,-.177,.362],[.044,.015,.009]);tongue.visible=false;
  // Red-and-white checked neckerchief, rather than a generic bow tie.
  const scarf=pivot(body,'Bow',[0,.247,.280]);
  const collar=mesh(new THREE.TorusGeometry(.245,.032,10,32),red,scarf,'Red_Scarf_Collar',[0,.002,-.060]);
  collar.rotation.x=Math.PI/2;
  const clothShape=new THREE.Shape();clothShape.moveTo(-.12,.022);clothShape.lineTo(.12,.022);clothShape.lineTo(.065,-.16);clothShape.lineTo(-.065,-.16);clothShape.closePath();
  mesh(new THREE.ShapeGeometry(clothShape,8),red,scarf,'Red_Check_Scarf',[0,0,.020]);
  for(const dx of [-.047,.026])curve(scarf,'Scarf_White_Check',[[dx-.055,.021,.029],[dx+.018,-.075,.029],[dx+.067,-.155,.029]],.006,white);
  for(const dx of [-.052,.035])curve(scarf,'Scarf_White_Check',[[dx+.052,.021,.030],[dx,-.071,.030],[dx-.048,-.156,.030]],.006,white);
  ellipsoid(scarf,'Scarf_Knot',redDark,[0,.025,.040],[.065,.044,.028]);
  // Short brown-tipped wings; each feather is an actual 3D volume.
  for(const s of [-1,1]){
    const wing=pivot(body,s<0?'Arm_L':'Arm_R',[s*.275,.105,.015]);
    const shoulder=ellipsoid(wing,'Golden_Wing',brownLight,[s*.105,-.064,.015],[.165,.155,.092]);shoulder.rotation.z=s*.42;
    for(let i=0;i<3;i++){
      const feather=ellipsoid(wing,'Wing_Feathers',i===0?brownLight:brown,[s*(.190+i*.012),-.126+i*.043,.050],[.092,.055,.050]);
      feather.rotation.z=-s*(.25+i*.17);
    }
  }
  const tail=pivot(body,'Tail',[0,-.105,-.26]);
  for(const s of [-1,0,1]){
    const feather=ellipsoid(tail,'Tail_Feather',s===0?crown:brown,[s*.083,.035,-.075],[.07,.16,.075]);
    feather.rotation.z=-s*.35;
  }
  // Two visible orange three-toed feet, with separate named animation pivots.
  for(const s of [-1,1]){
    const leg=pivot(root,s<0?'Leg_L':'Leg_R',[s*.145,.205,.02]);
    ellipsoid(leg,'Orange_Shank',orange,[0,-.047,.005],[.032,.09,.039]);
    ellipsoid(leg,'Foot_Palm',orange,[0,-.115,.065],[.068,.039,.080]);
    for(const toe of [-1,0,1]){
      const digit=ellipsoid(leg,'Three_Toe_Foot',orangeLight,[toe*.048,-.125,.128],[.024,.022,.068]);
      digit.rotation.y=toe*.22;
    }
  }
  return root;
}
