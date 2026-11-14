import * as THREE from 'three';
import {mat,mesh,pivot,ellipsoid} from './rabbitModel.js';

// 麦奇的可动画原生 3D 模型。《萌鸡小队》（Mom Katuri / 꽁지）老么主角：
// 1. 极致 Q 萌二头身：大而圆润的纯净嫩黄头盘，身体圆滚滚像毛茸茸小球；
// 2. 额头光洁纯真：彻底移除突兀的额面大色斑，展现纯正可爱的幼鸟面孔；
// 3. 头顶标志性深棕小呆毛（Crown Feather Crest）：头顶正上方耸立向后微翘的三根灵动小翎毛；
// 4. 水汪汪萌动大黑眼：深邃黑瞳孔搭配双层晶莹清澈高光，伴随水蜜桃粉嫩圆腮红；
// 5. 标志性纯红三角小领巾：鲜亮正红色纯色三角巾，系着可爱小结，告别杂乱格子布；
// 6. 软萌小肉翅与小金喙：嫩黄色软羽翅膀带精细层次，圆润小巧的嫩橙色雏鸡短喙。
export function createMaiqiModel(){
  const root=new THREE.Group();root.name='Mengji_Maiqi_Rig';

  // 专属调色盘：鲜亮阳光嫩黄、软糯奶白肚皮、标志性深栗呆毛、正红领巾与蜜桃腮红
  const yellow=mat(0xfec832,.88);       // 嫩黄色毛茸雏鸡主羽
  const belly=mat(0xfff3a8,.94);        // 蛋奶色软萌肚皮
  const crownBrown=mat(0x6d3c22,.96);   // 头顶标志性深栗棕呆毛
  const wingAccent=mat(0xc27a36,.92);   // 翅尖柔和金棕羽尖
  const orangeBeak=mat(0xf59e0b,.78);   // 温润金橙色小短喙
  const beakLight=mat(0xfbbf24,.75);    // 嫩黄下喙
  const redScarf=mat(0xee2c2c,.85);     // 标志性纯正亮红小领巾
  const redKnot=mat(0xc41e1e,.85);      // 领巾小结
  const legOrange=mat(0xf97316,.82);    // 亮橙色小脚爪
  const white=mat(0xffffff,.35);        // 纯白眼白与高光
  const eyeBlack=mat(0x18181b,.15);     // 乌黑水汪汪大瞳孔
  const irisRim=mat(0x3a2216,.3);       // 瞳孔外圈微晕栗圈
  const blush=mat(0xff8da1,.45,{transparent:true,opacity:.75}); // 水蜜桃粉嫩圆腮红
  const mouthDark=mat(0x451a1a,.95);    // 微笑嘴角线条
  const tongueMat=mat(0xf472b6,.85);    // 开心草莓小舌头

  // --- 躯干（圆滚滚软萌小身体） ---
  const body=pivot(root,'Torso',[0,.44,0]);
  ellipsoid(body,'Maichi_Yellow_Body',yellow,[0,0,0],[.33,.33,.30]);
  ellipsoid(body,'Cream_Belly',belly,[0,-.045,.20],[.24,.23,.095]);
  // 胸前三簇软萌绒毛小尖
  for(const s of [-1,0,1]){
    const tip=ellipsoid(body,'Chest_Feather',belly,[s*.095,-.24,.19],[.058,.095,.045]);
    tip.rotation.z=s*.25;
  }

  // --- 头部（大而圆润、软糯可爱的纯净小黄头） ---
  const head=pivot(body,'Head',[0,.47,.02]);
  ellipsoid(head,'Round_Yellow_Head',yellow,[0,0,0],[.415,.385,.36]);

  // 头顶正上方标志性深棕小呆毛（Brown_V_Crown / Crown Feather Crest）
  // 耸立在头顶最高处正上方微向后翘起，形成经典的《萌鸡小队》老么呆毛三叉戟
  const crestGroup=pivot(head,'Brown_V_Crown',[0,.375,-.025]);
  const centerPlume=ellipsoid(crestGroup,'Center_Plume',crownBrown,[0,.075,-.035],[.036,.095,.028]);
  centerPlume.rotation.x=-.28;
  const leftPlume=ellipsoid(crestGroup,'Side_Plume_L',crownBrown,[-.045,.055,-.025],[.026,.072,.022]);
  leftPlume.rotation.x=-.22;leftPlume.rotation.z=.28;
  const rightPlume=ellipsoid(crestGroup,'Side_Plume_R',crownBrown,[.045,.055,-.025],[.026,.072,.022]);
  rightPlume.rotation.x=-.22;rightPlume.rotation.z=-.28;

  // 脸颊两侧微翘的小绒毛羽簇
  for(const s of [-1,1]){
    const ear=pivot(head,s<0?'Ear_L':'Ear_R',[s*.34,-.06,.08]);
    const tuft=ellipsoid(ear,'Cheek_Feather',yellow,[s*.01,-.05,.04],[.048,.065,.035]);
    tuft.rotation.z=-s*.35;
  }

  // --- 面部五官（水汪汪圆亮大眼 + 双层晶莹高光 + 蜜桃圆腮红） ---
  const eyes=pivot(head,'Eyes',[0,0,0]);
  for(const s of [-1,1]){
    const eye=pivot(eyes,s<0?'Eye_L':'Eye_R',[s*.16,.025,.31]);
    ellipsoid(eye,'Large_Eye_White',white,[0,0,0],[.105,.118,.040]);
    // 柔和深栗虹膜圈与硕大纯黑大眼珠（极其水灵单纯的神采）
    ellipsoid(eye,'Warm_Brown_Iris',irisRim,[s*.002,-.006,.026],[.085,.098,.022]);
    ellipsoid(eye,'Pupil',eyeBlack,[s*.002,-.006,.045],[.076,.088,.018]);
    // 双重清亮高光（外上大水珠 + 内下小光点）
    ellipsoid(eye,'Catchlight',white,[s*-.024,.032,.058],[.030,.035,.010]);
    ellipsoid(eye,'Catchlight_Small',white,[s*.022,-.030,.058],[.015,.017,.008]);

    // 细致温柔的小幼鸟弯弯细眉
    const brow=ellipsoid(head,'Soft_Brow',crownBrown,[s*.155,.165,.27],[.052,.012,.015]);
    brow.rotation.z=-s*.15;

    // 水蜜桃粉嫩圆腮红（大幅提升幼崽软萌可爱感）
    ellipsoid(head,'Warm_Cheek',blush,[s*.255,-.115,.25],[.085,.055,.022]);
  }

  // --- 小巧圆润的金橙色雏鸡小喙与甜美笑容 ---
  ellipsoid(head,'Smile',mouthDark,[0,-.148,.345],[.078,.025,.018]);
  ellipsoid(head,'Orange_Beak',orangeBeak,[0,-.115,.378],[.082,.036,.056]);
  ellipsoid(head,'Lower_Beak',beakLight,[0,-.155,.368],[.062,.022,.042]);
  const happy=ellipsoid(head,'Happy_Mouth',mouthDark,[0,-.150,.350],[.084,.042,.018]);happy.visible=false;
  const tongue=ellipsoid(head,'Happy_Tongue',tongueMat,[0,-.170,.368],[.044,.016,.010]);tongue.visible=false;

  // --- 麦奇标志性纯正亮红小三角领巾（Red Triangle Neckerchief） ---
  const scarf=pivot(body,'Bow',[0,.24,.27]);
  const collar=mesh(new THREE.TorusGeometry(.245,.034,12,36),redScarf,scarf,'Red_Scarf_Collar',[0,.002,-.055]);
  collar.rotation.x=Math.PI/2;
  // 纯红立体三角形围巾布面，自然下垂于胸口
  const clothShape=new THREE.Shape();
  clothShape.moveTo(-.13,.02);
  clothShape.quadraticCurveTo(0,-.01,.13,.02);
  clothShape.quadraticCurveTo(.07,-.10,.015,-.185);
  clothShape.quadraticCurveTo(-.015,-.185,-.07,-.10);
  clothShape.closePath();
  mesh(new THREE.ShapeGeometry(clothShape,16),redScarf,scarf,'Red_Check_Scarf',[0,0,.024]);
  // 领结小红球，带自然织物感
  ellipsoid(scarf,'Scarf_Knot',redKnot,[0,.024,.042],[.064,.046,.030]);

  // --- 毛茸茸嫩黄小肉翅（两翼主要为嫩黄，翅尖带金棕微层次） ---
  for(const s of [-1,1]){
    const wing=pivot(body,s<0?'Arm_L':'Arm_R',[s*.27,.095,.015]);
    // 小翅膀主体：饱满明朗的嫩黄色，彻底告别原先黑乎乎的整片深棕色
    const mainWing=ellipsoid(wing,'Golden_Wing',yellow,[s*.095,-.060,.015],[.155,.145,.088]);
    mainWing.rotation.z=s*.38;
    // 翅尖 3 片精致的小羽尖层次
    for(let i=0;i<3;i++){
      const feather=ellipsoid(wing,'Wing_Feathers',i===0?yellow:wingAccent,[s*(.170+i*.010),-.115+i*.038,.045],[.082,.048,.042]);
      feather.rotation.z=-s*(.22+i*.15);
    }
  }

  // --- 可爱上翘小尾羽（小雏鸡短尾巴） ---
  const tail=pivot(body,'Tail',[0,-.095,-.25]);
  for(const s of [-1,0,1]){
    const feather=ellipsoid(tail,'Tail_Feather',s===0?crownBrown:yellow,[s*.075,.040,-.065],[.065,.145,.065]);
    feather.rotation.z=-s*.30;
    feather.rotation.x=.28;
  }

  // --- 亮橙色圆润三趾小鸡爪 ---
  for(const s of [-1,1]){
    const leg=pivot(root,s<0?'Leg_L':'Leg_R',[s*.14,.195,.02]);
    ellipsoid(leg,'Orange_Shank',legOrange,[0,-.045,.005],[.030,.085,.036]);
    ellipsoid(leg,'Foot_Palm',legOrange,[0,-.110,.060],[.062,.036,.075]);
    for(const toe of [-1,0,1]){
      const digit=ellipsoid(leg,'Three_Toe_Foot',orangeBeak,[toe*.045,-.120,.120],[.022,.020,.062]);
      digit.rotation.y=toe*.20;
    }
  }

  return root;
}
