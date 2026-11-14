/**
 * 森林营地图鉴管理器 (CampManager)
 * 1. 纯本地 LocalStorage 存储 6 位动物朋友的解救记录
 * 2. 统计已解救种类数量与各动物累计解救次数
 * 3. 驱动营地图鉴界面状态点亮与专属小萌音播放
 */

export const CAMP_ANIMALS = [
  { id: 'bunny', name: '小兔 萌萌', preview: 'models/bunny-preview.png', title: '森林伙伴', badge: '🐰', target: 5 },
  { id: 'cat', name: '橘猫 橘子', preview: 'models/cat-preview.png', title: '阳光橘猫', badge: '🐱', target: 8 },
  { id: 'frog', name: '青蛙 呱呱', preview: 'models/frog-preview.png', title: '池塘跳将', badge: '🐸', target: 6 },
  { id: 'dog', name: '小狗 旺旺', preview: 'models/dog-preview.png', title: '活力小狗', badge: '🐶', target: 10 },
  { id: 'dragon', name: '飞龙 翼翼', preview: 'models/dragon-preview.png', title: '云谷飞龙', badge: '🐲', target: 12 },
  { id: 'goldenDragon', name: '金龙 小金', preview: 'models/goldenDragon-preview.png', title: '祥云金龙', badge: '🐉', target: 9 },
  { id:'mcqueen',name:'闪电麦昆',preview:'models/mcqueen-preview.png',title:'闪电赛车',badge:'🏎️',target:10 },
  { id:'wolf',name:'灰太狼大王',preview:'models/wolf-preview.png',title:'青青草原之王',badge:'🐺',target:12 },
  { id:'teddy',name:'泰迪熊 抱抱',preview:'models/teddy-preview.png',title:'温暖抱抱',badge:'🧸',target:8 },
  { id:'chase',name:'汪汪队 阿奇',preview:'models/chase-preview.png?v=20261114',title:'勇敢巡逻',badge:'🐶',target:10 },
  { id:'jett',name:'超级飞侠 乐迪',preview:'models/jett-preview.png?v=20261114',title:'天空飞行',badge:'✈️',target:12 },
  { id:'peppa',name:'小猪佩奇',preview:'models/peppa-preview.png?v=20261114',title:'快乐跳跳',badge:'🐷',target:8 },
  { id:'thomas',name:'托马斯火车',preview:'models/thomas-preview.png',title:'快乐列车',badge:'🚂',target:10 }
];

export const CAMP_STORAGE_KEY = 'camgame_forest_camp_v1';

export class CampManager {
  constructor(storage = null) {
    if (storage) {
      this.storage = storage;
    } else if (typeof window !== 'undefined' && window.localStorage) {
      this.storage = window.localStorage;
    } else {
      // 内存回退（Node.js / 单元测试环境）
      this._memoryStore = {};
      this.storage = {
        getItem: (k) => this._memoryStore[k] || null,
        setItem: (k, v) => { this._memoryStore[k] = String(v); },
        removeItem: (k) => { delete this._memoryStore[k]; }
      };
    }
  }

  getRescues() {
    try {
      const raw = this.storage.getItem(CAMP_STORAGE_KEY);
      if (!raw) return {};
      const parsed = JSON.parse(raw);
      return typeof parsed === 'object' && parsed !== null ? parsed : {};
    } catch (e) {
      return {};
    }
  }

  recordRescue(animalId) {
    if (!animalId) return 0;
    const rescues = this.getRescues();
    const cur = rescues[animalId] || 0;
    const next = cur + 1;
    rescues[animalId] = next;
    try {
      this.storage.setItem(CAMP_STORAGE_KEY, JSON.stringify(rescues));
    } catch (e) {}
    return next;
  }

  getAnimalRescueCount(animalId) {
    const rescues = this.getRescues();
    return rescues[animalId] || 0;
  }

  isUnlocked(animalId) {
    return this.getAnimalRescueCount(animalId) > 0;
  }

  getTotalRescues() {
    const rescues = this.getRescues();
    return Object.values(rescues).reduce((sum, n) => sum + (typeof n === 'number' ? n : 0), 0);
  }

  getUnlockedCount() {
    const rescues = this.getRescues();
    return CAMP_ANIMALS.filter(a => (rescues[a.id] || 0) > 0).length;
  }

  clearCampData() {
    try {
      this.storage.removeItem(CAMP_STORAGE_KEY);
    } catch (e) {}
  }
}
