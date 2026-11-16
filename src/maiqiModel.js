import * as THREE from 'three';
import { mat, mesh, pivot, ellipsoid, curve } from './rabbitModel.js';

// 《萌鸡小队》（Mom Katuri / 엄마 까투리）麦奇（Chip / 꽁지）原生 3D 模型 1:1 动画回归重构：
// 1. 还原纯真萌态：圆滚滚毛茸小球身躯，告别杂乱装饰，回归幼儿动画的极简软萌；
// 2. 还原干净脸庞：彻底移除额头上多余生硬的条纹，整张小脸蛋与小脑门纯净温润、通透阳光明黄；
// 3. 还原标志性呆毛：头顶正上方一撮深栗色灵动小羽冠（Brown_V_Crown 3根小呆毛微翘后仰），彻底告别假绿叶；
// 4. 纯净大黑眼：圆溜溜大眼眶、水灵黑眼仁、双重清透水珠高光与温柔八字幼眉；
// 5. 纯正正红小领巾（Red_Check_Scarf）：告别野餐布白色网格线，还原动画标志性纯正鲜红三角领巾与萌软前胸结；
// 6. 软糯肉翅与圆润金橙小短喙：纯净暖黄小翅膀（Wing_Feathers），圆润短小雏鸡喙与橙色小脚丫（Three_Toe_Foot）。
export function createMaiqiModel() {
  const root = new THREE.Group();
  root.name = 'Mengji_Maiqi_Rig';

  // 专属原画调色盘：高饱和阳光暖黄、香草奶白软肚、深栗小呆毛、正红领巾与水蜜桃粉颊
  const furYellow = mat(0xffcf33, .86);    // 温暖鲜亮阳光雏鸡黄
  const furBelly = mat(0xfffae6, .92);     // 软糯香草奶白肚皮
  const crestBrown = mat(0x5c2b14, .95);   // 头顶小呆毛羽冠深栗色
  const orangeBeak = mat(0xf97316, .76);   // 鲜亮暖橙雏鸡圆短喙
  const beakLower = mat(0xfbbf24, .75);    // 嫩黄下喙
  const redScarf = mat(0xee2c2c, .85);     // 标志性纯正鲜红三角巾
  const redKnot = mat(0xc81e1e, .88);      // 领巾圆结
  const legOrange = mat(0xf97316, .82);    // 亮橙色小短腿
  const white = mat(0xffffff, .35);        // 纯白眼白与高光
  const eyeBlack = mat(0x111317, .12);     // 水灵乌黑大瞳孔
  const irisBrown = mat(0x3e2316, .28);    // 瞳孔外圈温润栗圈
  const blush = mat(0xff8da1, .45, { transparent: true, opacity: .75 }); // 苹果粉软萌腮红
  const mouthDark = mat(0x431b1b, .95);    // 微笑嘴角暗线
  const tonguePink = mat(0xf472b6, .85);   // 开心草莓小舌头

  // ==========================================
  // 一、 躯干（圆滚滚软萌小毛球）
  // ==========================================
  const body = pivot(root, 'Torso', [0, .44, 0]);
  // 身体主体：饱满微扁圆球，显出可爱的幼崽胖乎乎体态
  ellipsoid(body, 'Maichi_Yellow_Body', furYellow, [0, 0, 0], [.335, .335, .305]);
  // 腹部香草奶白大斑块：平滑温润，告别胸前杂乱毛刺
  ellipsoid(body, 'Cream_Belly', furBelly, [0, -.045, .205], [.245, .235, .095]);

  // ==========================================
  // 二、 头部（大而圆润的幼崽大头）
  // ==========================================
  // 略微压扁的萌系大头形，双颊微鼓呈纯净包子脸，小脸蛋干净通透
  const head = pivot(body, 'Head', [0, .47, .02]);
  ellipsoid(head, 'Round_Yellow_Head', furYellow, [0, 0, 0], [.420, .390, .365]);

  // ------------------------------------------
  // 2.1 头顶标志性小羽冠（3根深栗色呆毛，Brown_V_Crown 保持测试兼容）
  // 位于头顶正上方稍偏后，灵动后仰，告别额头斑纹与假绿叶
  // ------------------------------------------
  const crownGroup = pivot(head, 'Brown_V_Crown', [0, .385, -.02]);
  // 正中主羽：稍长，轻微后仰
  const plumeC = ellipsoid(crownGroup, 'Plume_Center', crestBrown, [0, .075, -.030], [.032, .090, .024]);
  plumeC.rotation.x = -.32;
  // 左右副羽：稍微向外微展
  for (const s of [-1, 1]) {
    const plumeS = ellipsoid(crownGroup, s < 0 ? 'Plume_L' : 'Plume_R', crestBrown, [s * .040, .055, -.020], [.024, .070, .020]);
    plumeS.rotation.x = -.26;
    plumeS.rotation.z = -s * .30;
  }

  // ------------------------------------------
  // 2.2 脸颊两侧翘起的蓬松毛簇
  // ------------------------------------------
  for (const s of [-1, 1]) {
    const ear = pivot(head, s < 0 ? 'Ear_L' : 'Ear_R', [s * .34, -.06, .08]);
    const tuft = ellipsoid(ear, 'Cheek_Feather', furYellow, [s * .01, -.05, .04], [.050, .068, .036]);
    tuft.rotation.z = -s * .35;
  }

  // ==========================================
  // 三、 面部五官（纯真大黑眼 + 双重水珠高光 + 蜜桃粉腮红）
  // ==========================================
  const eyes = pivot(head, 'Eyes', [0, 0, 0]);
  for (const s of [-1, 1]) {
    const eye = pivot(eyes, s < 0 ? 'Eye_L' : 'Eye_R', [s * .162, .025, .315]);
    eye.rotation.y = s * .08; // 眼睛微朝外，更具幼鸟灵动感

    // 纯白大眼底
    ellipsoid(eye, 'Large_Eye_White', white, [0, 0, 0], [.105, .118, .038]);

    // 温暖深栗外虹膜晕圈与深邃大黑瞳
    ellipsoid(eye, 'Warm_Brown_Iris', irisBrown, [s * .002, -.006, .028], [.088, .102, .024]);
    ellipsoid(eye, 'Pupil', eyeBlack, [s * .002, -.006, .048], [.078, .090, .018]);

    // 双重清澈水灵高光（外上大主光 + 内下小萌点）
    ellipsoid(eye, 'Catchlight', white, [s * -.025, .035, .060], [.030, .036, .010]);
    ellipsoid(eye, 'Catchlight_Small', white, [s * .024, -.032, .060], [.014, .016, .008]);

    // 细巧柔和的八字微扬幼鸟小眉毛（外低内微高，充满对世界的好奇与探求神态）
    const brow = ellipsoid(head, s < 0 ? 'Brow_L' : 'Brow_R', crestBrown, [s * .158, .170, .275], [.052, .014, .016]);
    brow.rotation.z = s * .18;
    brow.rotation.x = -.10;

    // 大面积水蜜桃粉嫩圆腮红（幼崽软萌可爱灵魂所在）
    ellipsoid(head, s < 0 ? 'Blush_L' : 'Blush_R', blush, [s * .265, -.110, .255], [.078, .052, .020]);
  }

  // ==========================================
  // 四、 1:1 官方小巧圆润雏鸡短喙与卡通甜笑（告别厚唇与人类肉感舌头）
  // ==========================================
  // 纯真紧凑的明橙色雏鸡小短喙（鸟类一体圆钝小喙，绝无人类上下肉唇感）
  const upperBeak = ellipsoid(head, 'Orange_Beak', orangeBeak, [0, -.124, .375], [.066, .040, .054]);
  upperBeak.rotation.x = .14;
  // 雏鸡日常微翘软萌嘴角笑线
  curve(head, 'Smile', [[-.055, -.142, .346], [0, -.150, .356], [.055, -.142, .346]], .0042, mouthDark);
  // 欢庆时开朗雏鸡小啾鸣卡通笑口（小巧内敛月牙形，无肉唇厚舌）
  const happy = ellipsoid(head, 'Happy_Mouth', mouthDark, [0, -.148, .352], [.048, .024, .010]);
  happy.visible = false;

  // ==========================================
  // 五、 麦奇招牌：纯正鲜红三角领巾（Red_Check_Scarf 保持测试兼容）
  // ==========================================
  const scarf = pivot(body, 'Bow', [0, .24, .27]);
  // 领口圆环滚边
  const collar = mesh(new THREE.TorusGeometry(.245, .034, 12, 36), redScarf, scarf, 'Red_Scarf_Collar', [0, .002, -.055]);
  collar.rotation.x = Math.PI / 2;

  // 三角形领巾布面（纯正明艳鲜红，告别野餐布格子白线，1:1 还原动画原画）
  const clothShape = new THREE.Shape();
  clothShape.moveTo(-.135, .025);
  clothShape.quadraticCurveTo(0, -.005, .135, .025);
  clothShape.quadraticCurveTo(.075, -.095, .015, -.190);
  clothShape.quadraticCurveTo(-.015, -.190, -.075, -.095);
  clothShape.closePath();
  mesh(new THREE.ShapeGeometry(clothShape, 16), redScarf, scarf, 'Red_Check_Scarf', [0, 0, .024]);

  // 领巾系结小红球，带微微立体织物感
  ellipsoid(scarf, 'Scarf_Knot', redKnot, [0, .024, .044], [.066, .048, .032]);

  // ==========================================
  // 六、 嫩黄毛茸小肉翅（纯净暖黄，告别多层碎裂杂色）
  // ==========================================
  for (const s of [-1, 1]) {
    const wing = pivot(body, s < 0 ? 'Arm_L' : 'Arm_R', [s * .27, .095, .015]);
    // 翅膀主体（圆润嫩黄雏鸟翅）
    const mainWing = ellipsoid(wing, 'Golden_Wing', furYellow, [s * .095, -.060, .015], [.155, .145, .088]);
    mainWing.rotation.z = s * .38;
    // 翅尖圆润柔羽（保留 Wing_Feathers 满足测试）
    const feather = ellipsoid(wing, 'Wing_Feathers', furYellow, [s * .160, -.105, .035], [.095, .085, .060]);
    feather.rotation.z = -s * .25;
  }

  // ==========================================
  // 七、 上翘毛茸小尾羽（小雏鸡短尾巴）
  // ==========================================
  const tail = pivot(body, 'Tail', [0, -.095, -.25]);
  for (const s of [-1, 0, 1]) {
    const feather = ellipsoid(tail, 'Tail_Feather', furYellow, [s * .070, .040, -.065], [.065, .145, .065]);
    feather.rotation.z = -s * .30;
    feather.rotation.x = .28;
  }

  // ==========================================
  // 八、 亮橙色圆润三趾小鸡爪
  // ==========================================
  for (const s of [-1, 1]) {
    const leg = pivot(root, s < 0 ? 'Leg_L' : 'Leg_R', [s * .14, .195, .02]);
    ellipsoid(leg, 'Orange_Shank', legOrange, [0, -.045, .005], [.030, .085, .036]);
    ellipsoid(leg, 'Foot_Palm', legOrange, [0, -.110, .060], [.062, .036, .075]);
    for (const toe of [-1, 0, 1]) {
      const digit = ellipsoid(leg, 'Three_Toe_Foot', orangeBeak, [toe * .045, -.120, .120], [.022, .020, .062]);
      digit.rotation.y = toe * .20;
    }
  }

  return root;
}
