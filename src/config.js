import {assetUrl} from './assetUrl.js';

/**
 * 游戏核心配置
 * 预留多关卡、多动物及不同泡泡目标数量配置入口
 */
export const GAME_CONFIG = {
  // 当前版本启用的关卡配置
  level: {
    id: 1,
    name: '森林第一站',
    animalId: 'bunny', // 森林第一站：小兔萌萌
    targetBubbles: 6, // 偶数目标：每轮锁定一个单词，成对中英文发音（6 起步逐个 +2）
    bubbleColors: [
      0xff6b81, // 樱花粉
      0xffa502, // 暖阳橙
      0x2ed573, // 清新绿
      0x1e90ff, // 天空蓝
      0x9b59b6  // 梦幻紫
    ]
  },

  // 动物库配置模板（预留未来根据动物体型调整泡泡目标与气球参数）
  animals: {
    bear: {
      name: '小棕熊 嘟嘟',
      weightCategory: 'light',
      balloonScale: 1.0,
      description: '活泼可爱的小熊，需要 6 个彩虹泡泡即可起飞。'
    },
    bunny: {
      name: '小白兔 萌萌',
      weightCategory: 'feather',
      balloonScale: 0.9,
      targetBubbles: 6, asset: 'forest-bunny', escapeStyle: 'hop',
      description: '安稳入门 · 大泡泡停在身前，慢慢碰也能成功。'
    },
    cat: {
      name: '橘猫 橘子', targetBubbles: 10, asset: 'marmalade-cat', escapeStyle: 'trot',
      description: '慢漂追踪 · 跟着缓慢漂移的泡泡，靠近就会停住。'
    },
    frog: {
      name: '小青蛙 呱呱', targetBubbles: 8, asset: 'pond-frog', escapeStyle: 'leap',
      description: '荷叶弹跳 · 等泡泡跳起落稳，再伸手碰一碰。',
      victoryText: '呱呱蹬开后腿，跳过荷叶回到池塘啦。'
    },
    dog: {
      name: '小狗 旺旺', targetBubbles: 14, asset: 'sunny-puppy', escapeStyle: 'bound',
      description: '轻快连击 · 更短出场间隔，更宽松的彩虹连击节奏。',
      victoryText: '旺旺摇着尾巴跑回花园，开心地向你伸出小爪。'
    },
    dragon: {
      name: '飞龙 翼翼', targetBubbles: 16, asset: 'jade-dragon', escapeStyle: 'glide',
      description: '云间弧线 · 沿弧线追踪，交替体验果冻与彩虹泡泡。',
      victoryText: '翼翼张开翅膀飞过云谷，回头向你挥了挥小爪。'
    },
    goldenDragon: {
      name: '金龙 小金', targetBubbles: 12, asset: 'golden-dragon', escapeStyle: 'serpentine',
      description: '祥云游动 · 跟随舒缓曲线，收集彩虹与双层能量。',
      victoryText: '小金舒展长尾，游过祥云，轻轻点头向你道谢。'
    },
    panda: {
      name: '大熊猫 圆圆',
      weightCategory: 'medium',
      balloonScale: 1.2,
      description: '圆滚滚的熊猫，需要更多彩虹能量。'
    }
  },

  // 视觉与碰撞体验参数（专门针对 3 岁半幼儿优化）
  gameplay: {
    bubbleRadiusScreenFraction: 0.10, // 泡泡基准大小（占屏幕宽高的较小边的比例，大而易触碰）
    touchDistanceMultiplier: 1.35,     // 容错判定范围，只要手靠近泡泡边缘即算成功
    spawnCooldownMs: 900,              // 泡泡破裂后下一个泡泡生成的延迟，避免原地狂刷
    idleHelpDelayMs: 6500,             // 幼儿停留 6.5 秒未碰到时触发提示（变大、靠近、虚线手势引导）
    celebrationDurationMs: 5000,       // 起飞庆祝与动画时长（4~6秒之间）
    sparkleCountOnPop: 24              // 破裂爆开的七彩小星星数量
  },

  // 人体姿态识别配置
  vision: {
    modelAssetPath: assetUrl('models/pose_landmarker_lite.task'),
    wasmLoaderPath: assetUrl('wasm'),
    minPoseDetectionConfidence: 0.5,
    minPosePresenceConfidence: 0.5,
    minTrackingConfidence: 0.5,
    maxNumPoses: 2 // 支持亲子双人同框
  }
};

export const PLAYABLE_ANIMALS = ['bunny', 'cat', 'frog', 'dog', 'dragon', 'goldenDragon'];
export function resolveAnimal(selection, random = Math.random) {
  return selection === 'random' ? PLAYABLE_ANIMALS[Math.min(PLAYABLE_ANIMALS.length-1, Math.floor(random()*PLAYABLE_ANIMALS.length))] : (PLAYABLE_ANIMALS.includes(selection) ? selection : 'bunny');
}
