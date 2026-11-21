import * as THREE from 'three';

const mat = (color, roughness = 0.6, extra = {}) =>
  new THREE.MeshStandardMaterial({ color, roughness, ...extra });

function mesh(geo, material, parent, name, position = [0, 0, 0], scale = [1, 1, 1]) {
  const m = new THREE.Mesh(geo, material);
  m.name = name;
  m.position.set(...position);
  m.scale.set(...scale);
  m.castShadow = true;
  m.receiveShadow = true;
  parent.add(m);
  return m;
}

function pivot(parent, name, position = [0, 0, 0]) {
  const g = new THREE.Group();
  g.name = name;
  g.position.set(...position);
  parent.add(g);
  return g;
}

function ellipsoid(parent, name, material, position, scale) {
  return mesh(new THREE.SphereGeometry(1, 32, 24), material, parent, name, position, scale);
}

function curve(parent, name, points, radius, material) {
  return mesh(
    new THREE.TubeGeometry(
      new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(...p))),
      24,
      radius,
      8,
      false
    ),
    material,
    parent,
    name
  );
}

/**
 * 蜜雪冰城雪王 (Snow King) 原生 3D 模型
 *
 * 核心识别特征：
 * - 纯净饱满双圆球雪人身躯 (Torso & Head)
 * - 金色三峰皇冠 (嵌三颗珍珠与红宝石)
 * - 鲜艳大红披风与金色胸针系带
 * - 右手外展手持冰淇淋华夫甜筒火炬权杖 (水平安全间距 > 0.45，面部 100% 防遮挡)
 * - 黑色灵动大圆眼、萌弯眉、蜜桃腮红与微笑小嘴 / 获救大笑嘴 (Happy_Mouth)
 */
export function createSnowKingModel() {
  const root = new THREE.Group();
  root.name = 'SnowKing_Rig';

  // 材质调色板
  const snowWhite = mat(0xffffff, 0.52);
  const snowShade = mat(0xebf2f8, 0.60);
  const capeRed = mat(0xff2535, 0.45);
  const capeDark = mat(0xc91221, 0.55);
  const gold = mat(0xffc72c, 0.32, { metalness: 0.45 });
  const goldLight = mat(0xffdf6d, 0.28, { metalness: 0.5 });
  const jewelRed = mat(0xff1832, 0.15, { metalness: 0.25, roughness: 0.15 });
  const pearl = mat(0xffffff, 0.2, { roughness: 0.15 });
  const waffle = mat(0xd6994c, 0.72);
  const waffleRim = mat(0xb07630, 0.75);
  const iceCream = mat(0xffffff, 0.42);
  const eyeInk = mat(0x1a212d, 0.35);
  const browMat = mat(0x2d3440, 0.65);
  const blushMat = mat(0xff8c96, 0.75);

  // 1. 躯干圆雪球 (Torso)
  const torso = pivot(root, 'Torso', [0, 0.28, 0]);
  ellipsoid(torso, 'Body_Snowball', snowWhite, [0, 0, 0], [0.30, 0.28, 0.30]);
  // 底部阴影过渡微雪座
  ellipsoid(torso, 'Body_Base_Shade', snowShade, [0, -0.16, 0], [0.24, 0.10, 0.24]);

  // 雪人可爱小圆脚垫 (Leg_L, Leg_R) - 稳当立在地面，兼顾骨架兼容
  for (const s of [-1, 1]) {
    const leg = pivot(root, s < 0 ? 'Leg_L' : 'Leg_R', [s * 0.12, 0.06, 0.04]);
    ellipsoid(leg, s < 0 ? 'Foot_L' : 'Foot_R', snowWhite, [0, 0, 0], [0.075, 0.055, 0.095]);
  }

  // 背后雪人小毛球 (Tail) - 骨架兼容与萌趣
  const tail = pivot(torso, 'Tail', [0, -0.06, -0.28]);
  ellipsoid(tail, 'Snow_Tail_Pom', snowWhite, [0, 0, 0], [0.055, 0.055, 0.055]);

  // 2. 左短手 (Arm_L) - 雪白小圆水滴手，自然下垂微外展
  const armL = pivot(root, 'Arm_L', [-0.28, 0.32, 0.03]);
  armL.rotation.z = 0.22;
  armL.rotation.x = 0.05;
  ellipsoid(armL, 'Arm_L_Upper', snowWhite, [-0.03, -0.05, 0.01], [0.065, 0.085, 0.065]);
  ellipsoid(armL, 'Hand_L', snowWhite, [-0.05, -0.12, 0.02], [0.058, 0.058, 0.058]);

  // 3. 右手臂与甜筒火炬权杖 (Arm_R & Scepter)
  // 右手臂显著外展约 35°，x偏置 0.30~0.38，确保权杖在任何视角绝不遮挡面部五官！
  const armR = pivot(root, 'Arm_R', [0.28, 0.32, 0.04]);
  armR.rotation.z = -0.38; // 向外侧展出
  armR.rotation.x = -0.15; // 略向前微扬
  armR.rotation.y = -0.10;
  ellipsoid(armR, 'Arm_R_Upper', snowWhite, [0.03, -0.05, 0.01], [0.065, 0.085, 0.065]);
  ellipsoid(armR, 'Hand_R', snowWhite, [0.06, -0.12, 0.02], [0.058, 0.058, 0.058]);

  // 甜筒火炬权杖 (Scepter) - 握在右手手心，斜立向上
  const scepter = pivot(armR, 'Scepter', [0.08, -0.08, 0.04]);
  scepter.rotation.z = 0.32; // 向上立起
  scepter.rotation.x = 0.12;

  // 华夫脆筒 (Cone_Mesh)
  const coneMesh = mesh(
    new THREE.ConeGeometry(0.075, 0.24, 20),
    waffle,
    scepter,
    'Cone_Mesh',
    [0, 0, 0]
  );
  coneMesh.rotation.x = Math.PI; // 尖端朝下，开口朝上
  mesh(new THREE.TorusGeometry(0.076, 0.012, 10, 24), waffleRim, scepter, 'Cone_Rim', [0, 0.12, 0]).rotation.x = Math.PI / 2;
  // 华夫螺旋网格纹
  curve(scepter, 'Waffle_Rib_1', [[-0.05, 0.06, 0.04], [0, 0.02, 0.055], [0.05, -0.02, 0.035]], 0.005, waffleRim);
  curve(scepter, 'Waffle_Rib_2', [[0.05, 0.07, 0.035], [0, 0.03, 0.055], [-0.04, -0.01, 0.04]], 0.005, waffleRim);

  // 旋转奶油火炬 (IceCream_Mesh) - 纯白旋转甜筒雪顶
  const iceCreamGroup = pivot(scepter, 'IceCream_Mesh', [0, 0.13, 0]);
  ellipsoid(iceCreamGroup, 'Cream_Tier_1', iceCream, [0, 0.025, 0], [0.082, 0.045, 0.082]);
  ellipsoid(iceCreamGroup, 'Cream_Tier_2', iceCream, [0, 0.065, 0], [0.066, 0.040, 0.066]);
  ellipsoid(iceCreamGroup, 'Cream_Tier_3', iceCream, [0, 0.100, 0], [0.046, 0.032, 0.046]);
  // 奶油尖端优雅旋钮微卷
  curve(
    iceCreamGroup,
    'Cream_Swirl_Tip',
    [[0, 0.11, 0], [0.012, 0.135, 0.008], [0.022, 0.155, -0.005], [0.015, 0.168, -0.012]],
    0.012,
    iceCream
  );

  // 4. 颈部节点 (Neck)、红色大斗篷 (Cape) 与金胸针 (Brooch/Bow)
  const neck = pivot(root, 'Neck', [0, 0.48, 0]);

  // 红色系带斗篷 (Cape) - 紧扣颈部后方，自然向后舒展，胸前绝不包覆
  const cape = pivot(neck, 'Cape', [0, 0.02, -0.06]);
  cape.rotation.x = 0.18; // 向后微扬
  // 斗篷主片（后片）
  const capeGeo = new THREE.CylinderGeometry(0.18, 0.36, 0.44, 20, 1, true, -Math.PI * 0.45, Math.PI * 0.90);
  const capeMesh = mesh(capeGeo, capeRed, cape, 'Cape_Body', [0, -0.20, -0.10]);
  capeMesh.rotation.y = Math.PI;
  // 斗篷边缘滚边与里衬深红
  mesh(new THREE.TorusGeometry(0.18, 0.014, 10, 24, Math.PI * 0.90), gold, cape, 'Cape_Collar', [0, 0.01, -0.05]).rotation.x = Math.PI / 2;

  // 金色领结胸针 (Brooch / Bow) - 挂在颈部正面，兼容骨骼
  const bow = pivot(neck, 'Bow', [0, -0.02, 0.20]);
  mesh(new THREE.CylinderGeometry(0.032, 0.032, 0.014, 16), gold, bow, 'Brooch').rotation.x = Math.PI / 2;
  mesh(new THREE.SphereGeometry(0.018, 12, 10), goldLight, bow, 'Brooch_Center', [0, 0, 0.01]);
  // 领结左右两翼
  ellipsoid(bow, 'Bow_Wing_L', gold, [-0.038, 0, 0], [0.028, 0.018, 0.012]);
  ellipsoid(bow, 'Bow_Wing_R', gold, [0.038, 0, 0], [0.028, 0.018, 0.012]);

  // 5. 头部圆雪球 (Head)
  const head = pivot(root, 'Head', [0, 0.70, 0.02]);
  ellipsoid(head, 'Head_Snowball', snowWhite, [0, 0, 0], [0.24, 0.22, 0.24]);

  // 耳朵兼容锚点 (Ear_L, Ear_R) - 维持骨骼兼容
  pivot(head, 'Ear_L', [-0.15, 0.18, 0]);
  pivot(head, 'Ear_R', [0.15, 0.18, 0]);

  // 6. 金色三峰王冠 (Crown)
  const crown = pivot(head, 'Crown', [0, 0.21, -0.01]);
  crown.rotation.x = -0.05; // 迎向观众视角微仰
  // 王冠圆环底座
  mesh(new THREE.CylinderGeometry(0.125, 0.135, 0.032, 28, 1, true), gold, crown, 'Crown_Base', [0, 0.016, 0]);
  mesh(new THREE.TorusGeometry(0.134, 0.009, 10, 28), goldLight, crown, 'Crown_Rim_Lower', [0, 0, 0]).rotation.x = Math.PI / 2;
  mesh(new THREE.TorusGeometry(0.124, 0.009, 10, 28), goldLight, crown, 'Crown_Rim_Upper', [0, 0.032, 0]).rotation.x = Math.PI / 2;

  // 三峰：中间主峰 + 左右侧峰
  const peakMid = mesh(new THREE.ConeGeometry(0.038, 0.095, 12), gold, crown, 'Peak_Mid', [0, 0.075, 0.118]);
  peakMid.rotation.x = 0.12;
  const peakL = mesh(new THREE.ConeGeometry(0.032, 0.075, 12), gold, crown, 'Peak_L', [-0.095, 0.065, 0.075]);
  peakL.rotation.z = 0.25; peakL.rotation.x = 0.08;
  const peakR = mesh(new THREE.ConeGeometry(0.032, 0.075, 12), gold, crown, 'Peak_R', [0.095, 0.065, 0.075]);
  peakR.rotation.z = -0.25; peakR.rotation.x = 0.08;

  // 宝石与珍珠 (Crown_Jewels)
  const jewels = pivot(crown, 'Crown_Jewels', [0, 0, 0]);
  // 三颗纯白珍珠分别置于三峰顶端
  ellipsoid(jewels, 'Pearl_Mid', pearl, [0, 0.125, 0.125], [0.018, 0.018, 0.018]);
  ellipsoid(jewels, 'Pearl_L', pearl, [-0.110, 0.105, 0.082], [0.014, 0.014, 0.014]);
  ellipsoid(jewels, 'Pearl_R', pearl, [0.110, 0.105, 0.082], [0.014, 0.014, 0.014]);
  // 王冠正中央主宝石（璀璨红宝石）
  ellipsoid(jewels, 'Ruby_Mid', jewelRed, [0, 0.042, 0.134], [0.018, 0.022, 0.012]);

  // 7. 五官与表情 (Eyes, Brows, Cheeks, Mouth, Happy_Mouth)
  // 纯真黑色大圆眼 (Eyes -> Eye_L, Eye_R) 带清澈双高光点
  const eyes = pivot(head, 'Eyes', [0, 0.02, 0.222]);
  for (const s of [-1, 1]) {
    const eye = pivot(eyes, s < 0 ? 'Eye_L' : 'Eye_R', [s * 0.082, 0, 0]);
    eye.rotation.y = s * 0.12;
    ellipsoid(eye, 'Eye_Ball', eyeInk, [0, 0, 0], [0.038, 0.044, 0.018]);
    // 清澈大高光水滴
    ellipsoid(eye, 'Catchlight_Big', pearl, [-0.010, 0.012, 0.014], [0.012, 0.014, 0.006]);
    // 侧下微光
    ellipsoid(eye, 'Catchlight_Small', pearl, [0.012, -0.010, 0.012], [0.006, 0.007, 0.004]);
  }

  // 萌趣短黑弯眉 (Brows -> Brow_L, Brow_R)
  const brows = pivot(head, 'Brows', [0, 0.082, 0.218]);
  for (const s of [-1, 1]) {
    const brow = ellipsoid(brows, s < 0 ? 'Brow_L' : 'Brow_R', browMat, [s * 0.080, 0, 0], [0.038, 0.009, 0.008]);
    brow.rotation.z = s * 0.12; // 微微扬起的元气眉
  }

  // 通透蜜桃粉腮红 (Cheeks -> Cheek_L, Cheek_R)
  const cheeks = pivot(head, 'Cheeks', [0, -0.045, 0.212]);
  for (const s of [-1, 1]) {
    ellipsoid(cheeks, s < 0 ? 'Cheek_L' : 'Cheek_R', blushMat, [s * 0.145, 0, 0], [0.042, 0.024, 0.010]);
  }

  // 微笑小嘴 (Mouth)
  const mouth = pivot(head, 'Mouth', [0, -0.065, 0.228]);
  curve(
    mouth,
    'Smile_Arc',
    [[-0.036, 0.008, 0], [-0.018, -0.008, 0.004], [0, -0.012, 0.006], [0.018, -0.008, 0.004], [0.036, 0.008, 0]],
    0.0045,
    eyeInk
  );

  // 获救开心大笑嘴 (Happy_Mouth) - 演出与收尾加冕时绽放
  const happy = pivot(head, 'Happy_Mouth', [0, -0.065, 0.228]);
  happy.visible = false;
  curve(
    happy,
    'Happy_Smile_Arc',
    [[-0.052, 0.015, 0], [-0.026, -0.016, 0.005], [0, -0.024, 0.007], [0.026, -0.016, 0.005], [0.052, 0.015, 0]],
    0.0065,
    eyeInk
  );

  return root;
}
