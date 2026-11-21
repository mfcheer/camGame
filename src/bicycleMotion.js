export const BICYCLE_BASE_ROT_Y = 1.25; // 3/4 isometric profile (~71.6 deg, un-overlapped double wheels, frame silhouette and smiling face)

export function setBicycleFork(a, angle) {
  const fork = a.model.getObjectByName('Front_Fork');
  if (fork) fork.rotation.y = angle;
}

export function setBicycleBell(a, angle) {
  const bell = a.model.getObjectByName('Bell');
  if (bell) bell.rotation.z = angle;
}

export function rollBicycleWheels(a, dist) {
  for (const w of [a.leftArm, a.rightArm, a.leftLeg, a.rightLeg]) {
    w.rotation.x = dist;
  }
}

export function resetBicycle(a) {
  for (const p of [a.headGroup, a.bodyMesh, a.leftArm, a.rightArm, a.leftLeg, a.rightLeg, a.leftEarGroup, a.rightEarGroup, a.tailGroup]) {
    p.rotation.set(0, 0, 0);
  }
  setBicycleFork(a, 0);
  setBicycleBell(a, 0);
  a.model.rotation.set(0, BICYCLE_BASE_ROT_Y, 0);
  a.headGroup.rotation.y = -0.65;
  a.model.position.y = 0;
}

export function bicycleCircle(a, t, m) {
  // 招牌庆祝一「双轮画圈」：原地缓慢滚动一小段弧线，前轮先转、后轮跟上，车把带动篮筐回望玩家。画面能看到两只轮子一起工作。
  const s = Math.sin(t * Math.PI) * m;
  rollBicycleWheels(a, -t * Math.PI * 4 * m);
  setBicycleFork(a, Math.sin(t * Math.PI * 2) * 0.16 * m);
  setBicycleBell(a, Math.sin(t * Math.PI * 4) * 0.12 * m);
  a.headGroup.rotation.y = -0.65 - s * 0.12;
  a.model.rotation.z = Math.sin(t * Math.PI * 2) * 0.035 * m;
  a.model.rotation.y = BICYCLE_BASE_ROT_Y + Math.sin(t * Math.PI) * 0.12 * m;
}

export function bicycleDance(a, t, m) {
  // 招牌庆祝二「铃声小舞步」：前轮左右转向两拍，车架有节奏地微倾，金铃轻摆；车轮保持接地，不转整车圈。
  const s = Math.sin(t * Math.PI) * m;
  setBicycleFork(a, Math.sin(t * Math.PI * 4) * 0.16 * m);
  setBicycleBell(a, Math.sin(t * Math.PI * 8) * 0.20 * m);
  a.model.rotation.z = Math.sin(t * Math.PI * 4) * 0.045 * m;
  a.headGroup.rotation.z = -Math.sin(t * Math.PI * 4) * 0.03 * m;
  a.headGroup.rotation.y = -0.65 + Math.sin(t * Math.PI * 2) * 0.08 * m;
  a.model.rotation.y = BICYCLE_BASE_ROT_Y + Math.sin(t * Math.PI * 2) * 0.08 * m;
}

export function bicycleDeparture(a, t, m) {
  // 专属收尾「勇敢出发」：两轮同时加速，车身微微前探，铃铛向上轻点，眉眼舒展后回到中立位。
  const s = Math.sin(t * Math.PI) * m;
  rollBicycleWheels(a, -t * Math.PI * 8 * m);
  a.model.rotation.x = -s * 0.045;
  const bell = a.model.getObjectByName('Bell');
  if (bell) bell.rotation.x = -s * 0.18;
  setBicycleFork(a, 0);
  a.headGroup.rotation.y = -0.65;
  a.model.rotation.y = BICYCLE_BASE_ROT_Y;
}
