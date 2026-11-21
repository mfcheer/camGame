import * as THREE from 'three';

export const SNOWKING_BASE_ROT_Y = 0.52; // 3/4 等轴透视角度 (约 30°~35°)

/**
 * 复位雪王各骨架节点姿态，清除动画残留
 */
export function resetSnowKing(a) {
  if (!a || !a.model) return;
  a.model.position.set(0, 0, 0);
  a.model.rotation.set(0, SNOWKING_BASE_ROT_Y, 0);
  a.model.scale.set(1, 1, 1);

  if (a.headGroup) a.headGroup.rotation.set(0, 0, 0);
  if (a.bodyMesh) a.bodyMesh.rotation.set(0, 0, 0);

  // 基础肢体复位
  if (a.leftArm) a.leftArm.rotation.set(0.05, 0, 0.22);
  if (a.rightArm) a.rightArm.rotation.set(0, -0.10, -0.38);
  if (a.leftLeg) a.leftLeg.rotation.set(0, 0, 0);
  if (a.rightLeg) a.rightLeg.rotation.set(0, 0, 0);

  // 特殊部件复位
  const cape = a.model.getObjectByName('Cape');
  if (cape) cape.rotation.set(0.18, 0, 0);

  const crown = a.model.getObjectByName('Crown');
  if (crown) crown.rotation.set(-0.05, 0, 0);

  const scepter = a.model.getObjectByName('Scepter');
  if (scepter) scepter.rotation.set(0.12, 0, 0.32);

  const happyMouth = a.model.getObjectByName('Happy_Mouth');
  const normalMouth = a.model.getObjectByName('Mouth');
  if (happyMouth) happyMouth.visible = false;
  if (normalMouth) normalMouth.visible = true;
}

/**
 * 招牌动作一：甜蜜摇摆舞 (snowkingWaltz)
 * 获救进入舞台中央，雪人踩着三拍子节拍左右摇摆，右手持甜筒权杖随节拍优雅画出弧线，红披风波浪飘扬。
 */
export function snowkingWaltz(a, t, m = 1) {
  const waltz = Math.sin(t * Math.PI * 6) * m;
  const bounce = Math.abs(Math.sin(t * Math.PI * 6)) * 0.05 * m;

  // 身躯与头部优雅三拍子微倾
  a.model.rotation.z = waltz * 0.12;
  a.animalGroup.position.y += bounce;
  a.headGroup.rotation.z = -waltz * 0.08;

  // 右臂与甜筒权杖指挥家般优雅划弧（安全外展，绝不遮脸）
  a.rightArm.rotation.z = -0.38 - waltz * 0.22;
  a.rightArm.rotation.x = -0.15 + Math.cos(t * Math.PI * 6) * 0.18 * m;

  // 左手小幅迎合摇摆
  a.leftArm.rotation.z = 0.22 - waltz * 0.18;

  // 红色披风随动舒展
  const cape = a.model.getObjectByName('Cape');
  if (cape) {
    cape.rotation.x = 0.18 + Math.sin(t * Math.PI * 6) * 0.12 * m;
    cape.rotation.z = -waltz * 0.15;
  }
}

/**
 * 招牌动作二：冰爽火炬 (snowkingTorch)
 * 双手向玩家高高举起甜筒权杖，皇冠顶部闪耀微颤，圆滚雪人在原地欢快连弹两下。
 */
export function snowkingTorch(a, t, m = 1) {
  const raise = Math.sin(t * Math.PI) * m;
  const hop = Math.abs(Math.sin(t * Math.PI * 4)) * raise * 0.14;

  // 原地欢快连跳
  a.animalGroup.position.y += hop;

  // 右手高高举起甜筒火炬权杖
  a.rightArm.rotation.z = -0.38 - raise * 0.55;
  a.rightArm.rotation.x = -0.15 - raise * 0.65;

  // 左手同步欢庆高举欢呼
  a.leftArm.rotation.z = 0.22 + raise * 0.65;
  a.leftArm.rotation.x = -raise * 0.45;

  // 皇冠轻颤闪烁
  const crown = a.model.getObjectByName('Crown');
  if (crown) {
    crown.rotation.z = Math.sin(t * Math.PI * 8) * raise * 0.10;
  }

  // 披风后扬
  const cape = a.model.getObjectByName('Cape');
  if (cape) {
    cape.rotation.x = 0.18 + raise * 0.25;
  }
}

/**
 * 专属收尾：雪王加冕 (snowkingCoronation)
 * 站稳舞台中央，右手执甜筒权杖向前平稳行致敬礼轻点，挺胸昂首，金冠闪烁，红色斗篷随风舒展，绽放大笑嘴。
 */
export function snowkingCoronation(a, t, m = 1) {
  const salute = Math.sin(t * Math.PI) * m;

  // 挺胸昂首姿态
  a.headGroup.rotation.x = -salute * 0.12;
  a.model.position.y = salute * 0.04;

  // 右手平稳行点杖致敬礼（向前轻点，安全保持在脸侧前方）
  a.rightArm.rotation.x = -0.15 - salute * 0.40;
  a.rightArm.rotation.z = -0.38 - salute * 0.10;

  // 左手微抬致意
  a.leftArm.rotation.z = 0.22 + salute * 0.28;

  // 斗篷披风随风飘拂舒展
  const cape = a.model.getObjectByName('Cape');
  if (cape) {
    cape.rotation.x = 0.18 + salute * 0.28;
  }

  // 金冠尊贵微闪
  const crown = a.model.getObjectByName('Crown');
  if (crown) {
    crown.rotation.y = Math.sin(t * Math.PI * 4) * salute * 0.08;
  }

  // 绽放大笑嘴
  const happyMouth = a.model.getObjectByName('Happy_Mouth');
  const normalMouth = a.model.getObjectByName('Mouth');
  if (happyMouth && normalMouth) {
    const showHappy = salute > 0.15;
    happyMouth.visible = showHappy;
    normalMouth.visible = !showHappy;
  }
}
