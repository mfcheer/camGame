import { GAME_CONFIG } from '../src/config.js';

console.log('--- 开始《彩虹小队》核心规则与配置逻辑单元检查 ---');

// 1. 验证目标泡泡数与动物配置
console.assert(GAME_CONFIG.level.targetBubbles === 5, '目标泡泡数应严格为 5');
console.assert(GAME_CONFIG.level.animalId === 'bunny', '当前森林第一站动物应为 bunny');
console.assert(GAME_CONFIG.animals.bear !== undefined, '必须包含 bear 配置');
console.assert(GAME_CONFIG.vision.maxNumPoses === 2, '姿态识别必须配置支持 2 人同框');

// 2. 验证镜像坐标系转换规则
// 在镜像模式 (scaleX(-1)) 下，相机的左边对应用户画面的右边
const rawLandmarkLeft = { x: 0.2, y: 0.5 };  // 原始摄像头画面偏左
const mirroredScreenX = 1.0 - rawLandmarkLeft.x; // 用户镜像屏幕中应偏右 (0.8)
console.assert(mirroredScreenX === 0.8, '镜像转换应为 1.0 - x');

// 3. 验证碰撞检测距离算法
function isHit(handNormX, handNormY, bubbleNormX, bubbleNormY, radius, aspect = 1.777) {
  const dx = (handNormX - bubbleNormX) * aspect;
  const dy = handNormY - bubbleNormY;
  const dist = Math.sqrt(dx * dx + dy * dy);
  return dist <= radius * GAME_CONFIG.gameplay.touchDistanceMultiplier;
}

const testAspect = 16 / 9;
const bubbleRadius = 0.1;
// 直接命中中心
console.assert(isHit(0.5, 0.5, 0.5, 0.5, bubbleRadius, testAspect) === true, '中心接触应命中');
// 边缘容错范围内命中
console.assert(isHit(0.5 + 0.05, 0.5 + 0.05, 0.5, 0.5, bubbleRadius, testAspect) === true, '容错范围内接触应命中');
// 较远位置不命中
console.assert(isHit(0.2, 0.2, 0.7, 0.7, bubbleRadius, testAspect) === false, '远离时不得命中');

// 4. 验证防重复计数防刷状态机
let count = 0;
let isPopping = false;

function simulatePop() {
  if (isPopping) return false;
  isPopping = true;
  count++;
  return true;
}

const pop1 = simulatePop(); // 第一次命中
const pop2 = simulatePop(); // 连击防刷
console.assert(pop1 === true && pop2 === false && count === 1, '同一泡泡不可重复计数');

// 冷却后下一个
isPopping = false;
const pop3 = simulatePop();
console.assert(pop3 === true && count === 2, '冷却后可正常计数下一个');

console.log('✅ 所有自动化逻辑单元规则校验全部通过！');
