import * as THREE from 'three';
import { mat, mesh, pivot, ellipsoid, curve } from './rabbitModel.js';

// 《萌鸡小队》（Mom Katuri / 엄마 까투리）老幺主角——麦奇（Chip / 꽁지）原生 3D 模型深度重构：
// 1. 经典二头身极萌幼态：圆滚滚毛茸小球身躯，头身比饱满可爱（1.5岁幼崽稚气）；
// 2. 雉鸡雏鸟标志性额头三叉纹（Trident Brow Stripes）：
//    真实还原动画中从额前延伸至头顶的正中水滴主纹与左右对称花瓣纹，告别生硬贴片与空旷纯黄；
// 3. 灵动羽冠与森林小嫩叶：头顶深栗色三叉呆毛，微翘后仰，并点缀一片晶莹的探险小树叶；
// 4. 水汪汪纯真大黑眼：大眼眶嵌乌黑大瞳仁、深栗虹膜晕圈、双重清亮水珠高光与温柔探险八字幼眉；
// 5. 标志性红白格小三角领巾（Red Gingham Neckerchief）：
//    鲜亮正红三角巾交织纯白经纬织纹（Red & White Check），系有圆润领巾结；
// 6. 软萌肉翅与圆润金橙小喙：圆润短小雏鸡喙带微甜嘴角，嫩黄小肉翅带金栗羽梢，亮橙三趾小鸡爪。
export function createMaiqiModel() {
  const root = new THREE.Group();
  root.name = 'Mengji_Maiqi_Rig';

  // 专属原画调色盘：高饱和阳光暖黄、香草奶白软肚、深栗雉羽纹路、正红领巾与水蜜桃粉颊
  const furYellow = mat(0xfecb2e, .86);    // 温暖鲜亮阳光雏鸡黄
  const furBelly = mat(0xfff8de, .92);     // 软糯香草奶白肚皮
  const stripeBrown = mat(0x6e3920, .96);  // 额头与头顶标志性深栗纹（꺼병이 雉鸡幼鸟三叉纹）
  const crestBrown = mat(0x5a2d18, .96);   // 头顶小呆毛羽冠深栗色
  const leafGreen = mat(0x4ade80, .82);    // 探险遮阳小绿叶
  const leafStem = mat(0x22c55e, .85);     // 叶茎
  const wingGold = mat(0xc97832, .92);     // 翅梢柔和金栗羽尖
  const orangeBeak = mat(0xf97316, .78);   // 鲜亮暖橙雏鸡圆短喙
  const beakLower = mat(0xfbbf24, .75);    // 嫩黄下喙
  const redScarf = mat(0xee2c2c, .85);     // 标志性鲜红三角巾
  const checkWhite = mat(0xffffff, .80);   // 格子纯白细线
  const redKnot = mat(0xb91c1c, .88);      // 领巾圆结
  const legOrange = mat(0xf97316, .82);    // 亮橙色小短腿
  const white = mat(0xffffff, .35);        // 纯白眼白与高光
  const eyeBlack = mat(0x141417, .12);     // 水灵乌黑大瞳孔
  const irisBrown = mat(0x3e2316, .28);    // 瞳孔外圈温润栗圈
  const eyeRim = mat(0x4a2618, .85);       // 上眼线微晕
  const blush = mat(0xff7e96, .45, { transparent: true, opacity: .78 }); // 苹果粉软萌腮红
  const mouthDark = mat(0x431b1b, .95);    // 微笑嘴角暗线
  const tonguePink = mat(0xf472b6, .85);   // 开心草莓小舌头

  // ==========================================
  // 一、 躯干（圆滚滚软萌小毛球）
  // ==========================================
  const body = pivot(root, 'Torso', [0, .44, 0]);
  // 身体主体：饱满微扁圆球，显出可爱的幼崽胖乎乎体态
  ellipsoid(body, 'Maichi_Yellow_Body', furYellow, [0, 0, 0], [.335, .335, .305]);
  // 腹部香草奶白大斑块
  ellipsoid(body, 'Cream_Belly', furBelly, [0, -.045, .205], [.245, .235, .098]);
  // 胸口下沿三簇微翘软绒毛尖（增加毛茸羽毛质感）
  for (const s of [-1, 0, 1]) {
    const tip = ellipsoid(body, 'Chest_Feather', furBelly, [s * .095, -.24, .195], [.058, .095, .045]);
    tip.rotation.z = s * .25;
  }

  // ==========================================
  // 二、 头部（大而圆润的幼崽大头）
  // ==========================================
  // 略微压扁的萌系大头形，双颊微鼓呈包子脸
  const head = pivot(body, 'Head', [0, .47, .02]);
  ellipsoid(head, 'Round_Yellow_Head', furYellow, [0, 0, 0], [.420, .390, .365]);

  // ------------------------------------------
  // 2.1 雉鸡雏鸟标志性三道额头斑纹（Brown_V_Crown / Trident Stripes）
  // 紧贴头部曲面雕塑出柔顺的水滴花瓣纵向条纹，自然贴合额头弧度
  // ------------------------------------------
  const crownGroup = pivot(head, 'Brown_V_Crown', [0, .18, .26]);
  // 正中主条纹：由两眉之间水滴状起步，圆润向上延展至头顶
  const centerStripe = ellipsoid(crownGroup, 'Center_Stripe', stripeBrown, [0, .075, .075], [.048, .125, .036]);
  centerStripe.rotation.x = -.52;
  // 额头正中微弧延展
  const centerUpper = ellipsoid(crownGroup, 'Center_Upper', stripeBrown, [0, .175, .005], [.040, .095, .032]);
  centerUpper.rotation.x = -.85;

  // 左右两侧对称条纹：弧度环绕眼角斜向上方延伸
  for (const s of [-1, 1]) {
    const sideStripe = ellipsoid(crownGroup, s < 0 ? 'Side_Stripe_L' : 'Side_Stripe_R', stripeBrown, [s * .115, .095, .055], [.036, .110, .030]);
    sideStripe.rotation.x = -.54;
    sideStripe.rotation.z = s * .35;
    sideStripe.rotation.y = s * -.12;

    const sideUpper = ellipsoid(crownGroup, s < 0 ? 'Side_Upper_L' : 'Side_Upper_R', stripeBrown, [s * .120, .170, -.010], [.028, .075, .025]);
    sideUpper.rotation.x = -.82;
    sideUpper.rotation.z = s * .28;
  }

  // ------------------------------------------
  // 2.2 头顶标志性小羽冠（3根深栗色呆毛）+ 探险小绿叶
  // ------------------------------------------
  const crestPivot = pivot(head, 'Crown_Plumes', [0, .385, -.02]);
  // 正中主羽：稍长，轻微后仰
  const plumeC = ellipsoid(crestPivot, 'Plume_Center', crestBrown, [0, .075, -.030], [.035, .095, .026]);
  plumeC.rotation.x = -.32;
  // 左右副羽：稍微向外微展
  for (const s of [-1, 1]) {
    const plumeS = ellipsoid(crestPivot, s < 0 ? 'Plume_L' : 'Plume_R', crestBrown, [s * .042, .055, -.022], [.026, .075, .022]);
    plumeS.rotation.x = -.26;
    plumeS.rotation.z = -s * .30;
  }
  // 麦奇招牌探险小绿叶（头顶顶着一片清新的森林小树叶）
  const leafPivot = pivot(crestPivot, 'Forest_Leaf', [.055, .065, .015]);
  leafPivot.rotation.set(.15, .25, -.35);
  ellipsoid(leafPivot, 'Leaf_Blade', leafGreen, [0, .050, 0], [.045, .072, .014]);
  ellipsoid(leafPivot, 'Leaf_Stem', leafStem, [0, -.015, -.002], [.008, .025, .008]);

  // ------------------------------------------
  // 2.3 脸颊两侧翘起的蓬松毛簇
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
    ellipsoid(eye, 'Large_Eye_White', white, [0, 0, 0], [.108, .122, .042]);
    // 上眼睑温柔深栗色细边
    const lid = ellipsoid(eye, 'Eye_Lid_Rim', eyeRim, [0, .095, .024], [.095, .028, .018]);
    lid.rotation.z = s * .08;

    // 温暖深栗外虹膜晕圈与深邃大黑瞳
    ellipsoid(eye, 'Warm_Brown_Iris', irisBrown, [s * .002, -.006, .028], [.088, .102, .024]);
    ellipsoid(eye, 'Pupil', eyeBlack, [s * .002, -.006, .048], [.078, .090, .018]);

    // 双重清澈水灵高光（外上大主光 + 内下小萌点）
    ellipsoid(eye, 'Catchlight', white, [s * -.025, .035, .060], [.032, .038, .010]);
    ellipsoid(eye, 'Catchlight_Small', white, [s * .024, -.032, .060], [.016, .018, .008]);

    // 细巧柔和的八字微扬幼鸟小眉毛（外低内微高，充满对世界的好奇与探求神态）
    const brow = ellipsoid(head, s < 0 ? 'Brow_L' : 'Brow_R', stripeBrown, [s * .158, .170, .275], [.055, .014, .016]);
    brow.rotation.z = s * .18; // 八字好奇小幼眉
    brow.rotation.x = -.10;

    // 大面积水蜜桃粉嫩圆腮红（幼崽软萌可爱灵魂所在）
    ellipsoid(head, s < 0 ? 'Blush_L' : 'Blush_R', blush, [s * .265, -.110, .255], [.088, .058, .024]);
  }

  // ==========================================
  // 四、 小巧圆润的雏鸡短喙与甜笑
  // ==========================================
  // 微翘微笑嘴角底线
  ellipsoid(head, 'Smile', mouthDark, [0, -.146, .350], [.080, .025, .018]);
  // 圆润饱满的橘黄色雏鸡上喙（短、圆、钝化，绝对不是尖锐硬喙）
  const upperBeak = ellipsoid(head, 'Orange_Beak', orangeBeak, [0, -.112, .382], [.084, .038, .058]);
  upperBeak.rotation.x = .12;
  // 奶油金橙下喙
  ellipsoid(head, 'Lower_Beak', beakLower, [0, -.152, .372], [.064, .022, .044]);
  // 欢庆张嘴与草莓小舌（庆祝演出时展开）
  const happy = ellipsoid(head, 'Happy_Mouth', mouthDark, [0, -.150, .355], [.086, .045, .018]);
  happy.visible = false;
  const tongue = ellipsoid(head, 'Happy_Tongue', tonguePink, [0, -.172, .372], [.046, .018, .010]);
  tongue.visible = false;

  // ==========================================
  // 五、 麦奇招牌：红白格小三角领巾（Red Check Gingham Bandana）
  // ==========================================
  const scarf = pivot(body, 'Bow', [0, .24, .27]);
  // 领口圆环滚边
  const collar = mesh(new THREE.TorusGeometry(.245, .034, 12, 36), redScarf, scarf, 'Red_Scarf_Collar', [0, .002, -.055]);
  collar.rotation.x = Math.PI / 2;

  // 三角形领巾布面（自然下垂在胸口，遮在奶白肚皮上方）
  const clothShape = new THREE.Shape();
  clothShape.moveTo(-.135, .025);
  clothShape.quadraticCurveTo(0, -.005, .135, .025);
  clothShape.quadraticCurveTo(.075, -.095, .015, -.190);
  clothShape.quadraticCurveTo(-.015, -.190, -.075, -.095);
  clothShape.closePath();
  mesh(new THREE.ShapeGeometry(clothShape, 16), redScarf, scarf, 'Red_Check_Scarf', [0, 0, .024]);

  // 经典纯白交织格子经纬织纹（Red & White Gingham Check），忠实还原《萌鸡小队》原剧经典造型
  const checkLines = [
    // 纵向白线条纹
    [[-.065, .020, .028], [-.035, -.100, .028]],
    [[.000, .015, .028], [.000, -.175, .028]],
    [[.065, .020, .028], [.035, -.100, .028]],
    // 横向白线条纹
    [[-.110, -.030, .028], [.110, -.030, .028]],
    [[-.075, -.085, .028], [.075, -.085, .028]],
    [[-.045, -.140, .028], [.045, -.140, .028]]
  ];
  for (let i = 0; i < checkLines.length; i++) {
    curve(scarf, `Scarf_Check_${i}`, checkLines[i], .0048, checkWhite);
  }

  // 领巾系结小红球，带微微立体织物感
  ellipsoid(scarf, 'Scarf_Knot', redKnot, [0, .024, .044], [.066, .048, .032]);

  // ==========================================
  // 六、 嫩黄毛茸小肉翅（两翼金黄，翅尖金栗层次）
  // ==========================================
  for (const s of [-1, 1]) {
    const wing = pivot(body, s < 0 ? 'Arm_L' : 'Arm_R', [s * .27, .095, .015]);
    // 翅膀主体（圆润嫩黄雏鸟翅）
    const mainWing = ellipsoid(wing, 'Golden_Wing', furYellow, [s * .095, -.060, .015], [.155, .145, .088]);
    mainWing.rotation.z = s * .38;
    // 翅尖 3 片金栗色雉羽层次
    for (let i = 0; i < 3; i++) {
      const feather = ellipsoid(wing, 'Wing_Feathers', i === 0 ? furYellow : wingGold, [s * (.170 + i * .010), -.115 + i * .038, .045], [.082, .048, .042]);
      feather.rotation.z = -s * (.22 + i * .15);
    }
  }

  // ==========================================
  // 七、 上翘毛茸小尾羽（小雏鸡短尾巴）
  // ==========================================
  const tail = pivot(body, 'Tail', [0, -.095, -.25]);
  for (const s of [-1, 0, 1]) {
    const feather = ellipsoid(tail, 'Tail_Feather', s === 0 ? crestBrown : furYellow, [s * .075, .040, -.065], [.065, .145, .065]);
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
