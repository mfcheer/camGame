import {InteractionDemo} from './interactionDemo.js';
import {getViewport,getSafeInsets,getHudBottom} from './viewport.js';
import * as THREE from 'three';
import { GAME_CONFIG } from './config.js';
import {getAnimalPlayStyle, animalTargetOffset} from './animalPlayStyles.js';
import {PointerContrastSampler,pointerPalette} from './pointerContrast.js';
import { WORDS_LIST, WORDS_MAP, getWordById } from './wordsConfig.js';

/**
 * 泡泡生命周期与交互管理 (v0.5.1 食指指尖交互与小动物解救)
 * 1. 每次仅存在一个大泡泡，位置严格在舒适区内，避让手部、气球与顶部 HUD
 * 2. 2.5~3px 实线彩色轮廓与外柔光圈，5 色渐进 (#FF6B81 #FFA502 #2ED573 #1E90FF #9B59B6)
 * 3. 0~320ms 弹性出场 (0.65→1.08→1.00)，400ms 出场保护期与防秒爆机制
 * 4. 接近吸附加亮 (1.6x 半径内描边加亮 25%、泡泡微向手偏移至多 8px)
 * 5. 命中破裂闪圈、12~18 个星点水滴粒子爆发、能量流星弧线飞向左侧小动物领结
 * 6. 食指指尖单一交互锚点：
 *    - 玩家 1 暖金 (#FFE394)，玩家 2 浅蓝 (#8DDAFF)
 *    - 光核 10~14px、外晕 28~36px，透明度约 0.75
 *    - 指尖丢失平滑淡出，重获新位置淡入，不跨屏瞬移
 * 7. 严密边界校验 (390x844、1280x720、320x932 最大放大边缘绝不出屏)
 */
export class BubbleManager {
  constructor(scene, camera, audioManager, balloon, rescueAnimal = null) {
    this.rescueAnimal = rescueAnimal;
    this.scene = scene;
    this.camera = camera;
    this.audio = audioManager;
    this.balloon = balloon;

    this.activeBubble = null;
    this.isSpawning = false;
    this.spawnTimer = null;
    this.idleTimer = 0;
    this.isEnlargedForHelp = false;

    this.playerMode = 'single'; // 'single' | 'coop'
    this.lastPopPlayerSide = 'left'; // 初始为 left，则首次 coop 生成将选 +1 (右侧/2号玩家)
    this.roundEase = 0;
    this.comfortableHits = 0;
    this.completedBubbleCount = 0;
    this.layoutGraceSeconds = 0;
    this.interactionClock = 0;
    this.bubbleIndex = 0; // 当前第几个泡泡 (0~4)
    this.playerComfortZones = []; // 校准的玩家舒适伸手区域
    this.latestTrackedPlayers = [];
    this.lastPopPosition = null;

    // 粒子系统与飞行动画
    this.particles = [];
    this.energyProjectiles = [];
    this.popRings = [];
    this.handLossSeconds = 0;
    this.handsAgeSeconds = Infinity;

    // 手部彩色光晕系统 (玩家 1 暖金 #FFE394，玩家 2 浅蓝 #8DDAFF)
    this.handIndicators = [];
    this.handFlashTimer = 0; // 命中时手晕闪圈计时
    this.isNearHand = false;
    this.proximityOffset = new THREE.Vector3();

    this.createHandIndicators();
    this.contrastSampler=new PointerContrastSampler(null);

    // 连击只计算泡泡可戳时的有效操作时间，冷却和保护期不扣时。
    this.comboCount = 0;
    this.lastPopTime = 0;
    this.comboTimeoutMs = 1500;
    this.comboRemainingMs = 0;
    this.onComboChange = null;
    this.lastPoppedEnergy = 1;
    this.onSpecialPop = null;
    this.lastWordId = null;
    this.wordMode = true;
    this.roundSeenWords = new Set();
    this.hasLearnedTouch = false;
    this.visualDemo = new InteractionDemo(scene);
    this.wordPool = [];
    this.wordQueue = [];
    this.wordTextureCache = new Map();
    this.onWordPop = null;
    if (typeof document !== 'undefined') {
      this.preloadWordTextures();
    }
  }


  // 单词纹理缓存管理与卡片 Mesh 构建
  getWordTexture(wordId) {
    if (typeof document === 'undefined') return null;
    if (!this.wordTextureCache.has(wordId)) {
      try {
        const loader = new THREE.TextureLoader();
        const word = WORDS_MAP.get(wordId);
        const base = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.BASE_URL) || '/';
        const cleanBase = base.endsWith('/') ? base : base + '/';
        const rawUrl = word?.bubbleImage || word?.image || `images/words/${wordId}.png`;
        const cleanRaw = rawUrl.startsWith('/') ? rawUrl.slice(1) : rawUrl;
        const url = rawUrl.startsWith('http') || rawUrl.startsWith('data:') ? rawUrl : cleanBase + cleanRaw;
        const tex = loader.load(url);
        if (THREE.SRGBColorSpace) tex.colorSpace = THREE.SRGBColorSpace;
        this.wordTextureCache.set(wordId, tex);
      } catch (e) {
        return null;
      }
    }
    return this.wordTextureCache.get(wordId);
  }

  preloadWordTextures() {
    if (typeof document === 'undefined') return;
    for (const w of WORDS_LIST) {
      this.getWordTexture(w.id);
    }
  }

  createWordCardMesh(word, radius) {
    const group = new THREE.Group();
    if (!word) {
      group.add(new THREE.Mesh(new THREE.OctahedronGeometry(radius * .32, 0),new THREE.MeshBasicMaterial({color:0xffd46e})));
      return group;
    }
    const cardSize = radius * 1.35;
    const texture = this.getWordTexture(word.id);
    const cardGeo = new THREE.PlaneGeometry(cardSize, cardSize);
    const cardMat = new THREE.MeshBasicMaterial({
      map: texture || null,
      color: 0xffffff,
      transparent: true,
      opacity: 0.96,
      side: THREE.DoubleSide,
      depthWrite: false
    });
    const cardMesh = new THREE.Mesh(cardGeo, cardMat);
    cardMesh.name = `word_card_${word.id}`;
    group.add(cardMesh);
    group.userData = { word, cardMesh };
    return group;
  }

  // 创建手部彩色光晕 (暖金 #FFE394、浅蓝 #8DDAFF，光核 10~14px，外晕 28~36px，透明度约 0.75)
  createHandIndicators() {
    const colors = [0xffe394, 0xffe394, 0x8ddaff, 0x8ddaff]; // 玩家 1 暖金，玩家 2 浅蓝

    for (let i = 0; i < 4; i++) {
      const color = colors[i];
      const group = new THREE.Group();

      // 1. 实心柔和暖光核 (直径 ~12px，世界半径 ~0.038)
      const coreGeo = new THREE.CircleGeometry(0.038, 24);
      const coreMat = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.90,
        depthWrite: false
      });
      const coreMesh = new THREE.Mesh(coreGeo, coreMat);
      group.add(coreMesh);

      // 2. 柔和半透明主光晕 (直径 ~30px，世界半径 ~0.095)
      const haloGeo = new THREE.RingGeometry(0.032, 0.095, 32);
      const haloMat = new THREE.MeshBasicMaterial({
        color: color,
        transparent: true,
        opacity: 0.70,
        side: THREE.DoubleSide,
        depthWrite: false
      });
      const haloMesh = new THREE.Mesh(haloGeo, haloMat);
      group.add(haloMesh);

      // 3. 柔光外晕渐层 (直径 ~36px，世界半径 ~0.115)
      const rimGeo = new THREE.RingGeometry(0.090, 0.115, 32);
      const rimMat = new THREE.MeshBasicMaterial({
        color: color,
        transparent: true,
        opacity: 0.35,
        side: THREE.DoubleSide,
        depthWrite: false
      });
      const rimMesh = new THREE.Mesh(rimGeo, rimMat);
      group.add(rimMesh);

      // 4. 命中碰破时才旋转展现的 3 颗小星芒 (平时隐藏保持清爽)
      const stars = [];
      for (let s = 0; s < 3; s++) {
        const starGeo = new THREE.CircleGeometry(0.018, 6);
        const starMat = new THREE.MeshBasicMaterial({
          color: 0xffffff,
          transparent: true,
          opacity: 0.0,
          depthWrite: false
        });
        const starMesh = new THREE.Mesh(starGeo, starMat);
        group.add(starMesh);
        stars.push({ mesh: starMesh, baseAngle: (s * Math.PI * 2) / 3 });
      }

      const darkEdge=new THREE.Mesh(new THREE.RingGeometry(.108,.127,32),new THREE.MeshBasicMaterial({color:0x19213b,transparent:true,opacity:.9,depthWrite:false}));
      const whiteEdge=new THREE.Mesh(new THREE.RingGeometry(.127,.142,32),new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.95,depthWrite:false}));
      group.add(darkEdge,whiteEdge);
      group.visible = false;
      this.scene.add(group);
      this.handIndicators.push({
        group,
        coreMesh,
        haloMesh,
        rimMesh,
        stars,
        darkEdge,whiteEdge,contrastMode:'light',
        color,
        active: false,
        playerId: i < 2 ? 1 : 2,
        currentOpacity: 0,
        fadeTimer: 0,
        targetPosition: new THREE.Vector3()
      });
    }
  }

  setPlayerMode(mode) {
    this.playerMode = mode;
  }

  // 设置已锁定的玩家舒适伸手区
  setPlayerComfortZones(lockedPlayers) {
    if (!lockedPlayers || lockedPlayers.length === 0) {
      this.playerComfortZones = [];
      return;
    }
    this.playerComfortZones = lockedPlayers.map((p, idx) => ({
      id: p.id || (idx + 1),
      centerX: p.centerX,
      comfortZone: p.comfortZone ? { ...p.comfortZone } : {
        minX: Math.max(0.1, p.centerX - 0.25),
        maxX: Math.min(0.9, p.centerX + 0.25),
        minY: 0.25,
        maxY: 0.75
      }
    }));
  }

  disposeBubble(group) {
    this.scene.remove(group);
    group.traverse(obj => { if (obj.isMesh) { obj.geometry.dispose(); obj.material.dispose(); } });
  }

  // Rebuild only the active target after a viewport change. This recalculates
  // pixel radius and HUD/corner clearance without resetting score or coop turn.
  updateLayout() {
    if (!this.activeBubble) return;
    const old = this.activeBubble;
    const side = this.lastPopPlayerSide;
    const saved = {};
    for (const key of ['hitsReceived', 'leftTouched', 'rightTouched', 'leftTouchTime', 'rightTouchTime', 'merging', 'mergeProgress', 'motionElapsed', 'playableElapsed', 'motionGain', 'nearSeconds']) saved[key] = old[key];
    if (this.playerMode === 'coop') this.lastPopPlayerSide = side === 'left' ? 'right' : 'left';
    this.disposeBubble(old.group);
    this.activeBubble = null;
    this.createBubble(this.bubbleIndex, old.type, old.word);
    for (const [key, value] of Object.entries(saved)) if (value !== undefined) this.activeBubble[key] = value;
    this.lastPopPlayerSide = side;
    // Old camera-space tips must never hit the newly projected target.
    this.layoutGraceSeconds = .35;
    this.isNearHand = false;
    this.proximityOffset.set(0, 0, 0);
    this.hideHandIndicators();
  }

  // 生成下一个泡泡
  spawnNext(bubbleNumber, immediate = false, forceType = null, afterWord = false) {
    if (this.activeBubble || this.isSpawning) return;

    this.bubbleIndex = bubbleNumber;
    const delay = immediate ? 50 : afterWord ? Math.min(450,this.getPlayStyle().cooldownMs) : this.getPlayStyle().cooldownMs;
    this.isSpawning = true;

    if (this.spawnTimer) clearTimeout(this.spawnTimer);
    this.spawnTimer = setTimeout(() => {
      this.createBubble(this.bubbleIndex, forceType);
      this.isSpawning = false;
    }, delay);
  }

  // 计算泡泡的舒适区域坐标 (严格在舒适区内，避让手部、刚爆破位置、气球与顶部 HUD，防出屏)
  calculateSpawnPosition() {
    const vFOV = THREE.MathUtils.degToRad(this.camera.fov || 48);
    const camZ = Math.abs(this.camera.position.z || 7.5);
    const visibleHeight = 2 * Math.tan(vFOV / 2) * camZ;
    const aspect = this.camera.aspect || (((typeof window !== 'undefined' && getViewport().width) || 1280) / ((typeof window !== 'undefined' && getViewport().height) || 720));
    const visibleWidth = visibleHeight * aspect;

    const winW = (typeof window !== 'undefined' ? getViewport().width : 1280) || 1280;
    const winH = (typeof window !== 'undefined' ? getViewport().height : 720) || 720;
    const pxToWorld = visibleHeight / winH;
    const isNarrow = (winW / winH) < 0.8;
    const baseTargetDiameterPx = winH<420&&winW>winH ? Math.max(winH<300?64:80,Math.min(112,winH*.27)) : isNarrow
      ? Math.min(120, Math.max(100, 0.20 * Math.min(winW, winH)))
      : Math.min(156, Math.max(104, 0.20 * Math.min(winW, winH)));
    const targetDiameterPx = baseTargetDiameterPx * this.getPlayStyle().size;

    // 核心安全半径：基础 0.95 * 助力 1.25 + 待机浮动 0.12 (保障各向同性 NDC 全边界 <= 1.0)
    const maxBubbleRadius = 0.95 * 1.25 + 0.12;

    const safeMaxX = Math.min((visibleWidth / 2) - maxBubbleRadius-Math.max(getSafeInsets().left,getSafeInsets().right)*pxToWorld, visibleWidth * .32);
    const safeMinX = -safeMaxX;

    const maximumVisualRadiusPx = targetDiameterPx * .5 * 1.25 * 1.13 + 14;
    const hudSafeY = visibleHeight / 2 - (Math.max(84,getHudBottom()+44) + maximumVisualRadiusPx) * pxToWorld;
    const topSafeY = Math.min((visibleHeight / 2) - maxBubbleRadius, hudSafeY);
    const bottomSafeY = Math.max(-visibleHeight / 2 + maxBubbleRadius, -visibleHeight * .22);
    const safeMinY = Math.min(bottomSafeY, topSafeY);
    const safeMaxY = Math.max(bottomSafeY, topSafeY);

    const bubbleWorldRadius = (targetDiameterPx * pxToWorld * 0.5) * 1.10;
    // 手部安全避让距离：手光晕半径 + 泡泡半径 + 28px 留白
    const minSafeHandDist = bubbleWorldRadius + (48 * pxToWorld) + (28 * pxToWorld);
    // 上次碰破位置避让距离
    const minSafeLastPopDist = bubbleWorldRadius * 1.4;

    const checkSafety = (x, y) => {
      let minDistToHand = Infinity;
      if (this.latestTrackedPlayers && this.latestTrackedPlayers.length > 0) {
        for (const player of this.latestTrackedPlayers) {
          if (!player.hands) continue;
          for (const hand of player.hands) {
            if (hand.isIndexTip === false || hand.observed === false) continue;
            const hx = (hand.x - 0.5) * visibleWidth;
            const hy = (0.5 - hand.y) * visibleHeight;
            const d = Math.hypot(x - hx, y - hy);
            if (d < minDistToHand) minDistToHand = d;
          }
        }
      }

      let safeFromLastPop = true;
      if (this.lastPopPosition) {
        const dPop = Math.hypot(x - this.lastPopPosition.x, y - this.lastPopPosition.y);
        if (dPop < minSafeLastPopDist) safeFromLastPop = false;
      }

      const safeFromHands = (minDistToHand >= minSafeHandDist);
      return { safe: safeFromHands && safeFromLastPop, minDistToHand };
    };

    let bestCandidate = null;
    let maxHandDist = -1;

    const turnIndex = this.lastPopPlayerSide === 'left' ? 1 : 0;
    if (this.playerMode === 'coop') this.lastPopPlayerSide = turnIndex === 1 ? 'right' : 'left';
    for (let attempt = 0; attempt < 16; attempt++) {
      let targetX = 0;
      let targetY = safeMinY + Math.random() * (safeMaxY - safeMinY);

      if (this.playerMode === 'coop') {
        if (this.playerComfortZones && this.playerComfortZones.length >= 2) {
          const player = this.playerComfortZones[turnIndex];
          const cz = player.comfortZone;
          const normX = cz.minX + Math.random() * (cz.maxX - cz.minX);
          const normY = cz.minY + Math.random() * (cz.maxY - cz.minY);

          targetX = (normX - 0.5) * visibleWidth;
          targetY = (0.5 - normY) * visibleHeight;
        } else {
          const side = turnIndex === 1 ? 1 : -1;
          const minSafeHalfWidth = Math.max(0, safeMaxX * 0.25);
          const maxSafeHalfWidth = Math.max(minSafeHalfWidth, safeMaxX * 0.85);
          const magnitude = minSafeHalfWidth + Math.random() * Math.max(0, maxSafeHalfWidth - minSafeHalfWidth);
          targetX = side * magnitude;
        }
      } else {
        if (this.playerComfortZones && this.playerComfortZones.length > 0) {
          const player = this.playerComfortZones[0];
          const cz = player.comfortZone;
          const normX = cz.minX + Math.random() * (cz.maxX - cz.minX);
          const normY = cz.minY + Math.random() * (cz.maxY - cz.minY);

          targetX = (normX - 0.5) * visibleWidth;
          targetY = (0.5 - normY) * visibleHeight;
        } else {
          const side = Math.random() > 0.5 ? 1 : -1;
          const minSafeHalfWidth = Math.max(0, safeMaxX * 0.15);
          const maxSafeHalfWidth = Math.max(minSafeHalfWidth, safeMaxX * 0.75);
          targetX = side * (minSafeHalfWidth + Math.random() * Math.max(0, maxSafeHalfWidth - minSafeHalfWidth));
        }
      }

      if (safeMaxX >= 0) {
        targetX = Math.max(safeMinX, Math.min(safeMaxX, targetX));
      } else {
        const rightLimit = (visibleWidth / 2) - (0.95 * 1.25);
        targetX = Math.min(targetX, rightLimit);
      }

      targetY = Math.max(safeMinY, Math.min(safeMaxY, targetY));
      if (this.rescueAnimal && Math.abs(targetX) > visibleWidth * 0.28) {
        const cornerTop = -visibleHeight/2 + 2.1;
        targetY = Math.min(safeMaxY, Math.max(targetY, cornerTop + bubbleWorldRadius));
      }

      // 避让热气球避让区 (当且仅当存在真实热气球模型时，强制保持 >= 24px 间距)
      if (this.balloon && this.balloon.group && this.balloon.group.visible) {
        const scale = this.balloon.modelScale || 0.42;
        const initialY = typeof this.balloon.initialY === 'number' ? this.balloon.initialY : -2.2;
        const balloonCenterY = initialY + 2.45 * scale;
        const balloonAvoidRadiusY = 1.6 * scale + 0.35;
        const balloonAvoidRadiusX = 1.0 * scale + 0.35;

        if (Math.abs(targetX) < balloonAvoidRadiusX && Math.abs(targetY - balloonCenterY) < balloonAvoidRadiusY) {
          const balloonTopWorldY = initialY + 5.4 * scale;
          const bubbleOuterRadiusWorld = (targetDiameterPx * pxToWorld * 0.5) * 1.10;
          const newY = balloonTopWorldY + bubbleOuterRadiusWorld + (30 * pxToWorld);
          if (newY <= safeMaxY) {
            targetY = newY;
          } else if (safeMaxX >= balloonAvoidRadiusX + 0.2) {
            targetX = targetX >= 0 ? balloonAvoidRadiusX + 0.2 : -(balloonAvoidRadiusX + 0.2);
          } else {
            targetY = Math.min(safeMaxY, balloonCenterY + balloonAvoidRadiusY + 0.3);
          }
        }
      }

      const { safe, minDistToHand } = checkSafety(targetX, targetY);
      if (safe) {
        return new THREE.Vector3(targetX, targetY, 0);
      }

      if (minDistToHand > maxHandDist) {
        maxHandDist = minDistToHand;
        bestCandidate = new THREE.Vector3(targetX, targetY, 0);
      }
    }

    return bestCandidate || new THREE.Vector3(0, 0, 0);
  }

  // 构建可爱的彩虹大泡泡 (带有清晰的 2.5~3px 实线彩色轮廓与外柔光晕)
  determineBubbleType(index, forceType = null) {
    if (forceType) return forceType;
    const targetEnergy = this.rescueAnimal?.targetEnergy || 5;
    const style = this.getPlayStyle();
    if (this.playerMode === 'coop' && targetEnergy >= 6 && index === 3) return 'coop_heart';
    // Signature targets take priority over combo rewards, so the animal's play
    // pattern remains discoverable even when an experienced player hits quickly.
    if (style.jellyAt.includes(index)) return 'jelly';
    if (style.rainbowAt.includes(index) || this.comboCount >= 2) return 'rainbow';
    return 'normal';
  }

  getPlayStyle() { return getAnimalPlayStyle(this.rescueAnimal?.animalId); }

  initializePlayTarget() {
    const b = this.activeBubble;
    const style = this.getPlayStyle();
    this.comboTimeoutMs = style.comboMs;
    b.playStyle = style.name;
    b.motionElapsed = 0;
    b.playableElapsed = 0;
    b.motionGain = 1 - this.roundEase * .5;
    if (b.type !== 'coop_heart') {
      b.playBounds = this.getPlayBounds(b);
      const bounds = b.playBounds;
      const marginX = Math.min(style.amplitudeX * bounds.unit, (bounds.maxX - bounds.minX) / 3);
      const marginY = Math.min(style.amplitudeY * bounds.unit, (bounds.maxY - bounds.minY) / 3);
      this.constrainPlayPosition(b.basePos, {minX:bounds.minX + marginX, maxX:bounds.maxX - marginX,
        minY:bounds.minY + marginY, maxY:bounds.maxY - marginY});
      b.group.position.copy(b.basePos);
    }
  }

  getPlayBounds(b) {
    const {width:w, height:h} = getViewport();
    const vh = 2 * Math.tan(THREE.MathUtils.degToRad(this.camera.fov / 2)) * Math.abs(this.camera.position.z);
    const unit = vh / h, vw = vh * this.camera.aspect, safe = getSafeInsets();
    // Include the maximum help scale, rainbow halo and jelly rebound, not just
    // the collision sphere. Cache until a viewport rebuild to avoid frame reflow.
    const extent = b.baseRadius * (b.type === 'jelly' ? 1.85 : 1.65) / unit + 8;
    let left = safe.left + extent, right = w - safe.right - extent;
    let top = Math.max(getHudBottom() + 50, safe.top + 84) + extent;
    let bottom = h - Math.max(safe.bottom + 12, h * .16) - extent;
    if (top > bottom) { top = getHudBottom() + 8 + extent; bottom = h - safe.bottom - 8 - extent; }
    if (top > bottom) top = bottom = (getHudBottom() + h - safe.bottom) / 2;
    if (left > right) left = right = w / 2;
    const owner = b.ownerId || 1;
    if (this.playerMode === 'coop') {
      if (owner === 1) right = Math.min(right, w / 2 - 4);
      else left = Math.max(left, w / 2 + 4);
    }
    const zone = this.playerComfortZones.find(p => p.id === owner)?.comfortZone;
    if (zone) {
      const zl = Math.max(left, zone.minX * w), zr = Math.min(right, zone.maxX * w);
      const zt = Math.max(top, zone.minY * h), zb = Math.min(bottom, zone.maxY * h);
      if (zl <= zr) { left = zl; right = zr; }
      if (zt <= zb) { top = zt; bottom = zb; }
    }
    if (this.playerMode === 'single' && this.getPlayStyle().motion === 'still' && !this.balloon?.group?.visible) {
      const center = zone ? (zone.minX + zone.maxX) / 2 * w : w / 2;
      left = Math.max(left, center - w * .14); right = Math.min(right, center + w * .14);
      if (left > right) left = right = Math.max(extent, Math.min(w - extent, center));
    }
    // Off-centre spheres project outward at their front surface. Reserve both
    // depth extremes, rather than treating a 3D jelly as a flat screen disc.
    const depth = b.baseRadius * (b.type === 'jelly' ? 1.75 : 1.5) / Math.abs(this.camera.position.z);
    const lower = value => Math.max(value * (1 - depth), value * (1 + depth));
    const upper = value => Math.min(value * (1 - depth), value * (1 + depth));
    const bounds = {minX:lower((left / w - .5) * vw), maxX:upper((right / w - .5) * vw),
      minY:lower((.5 - bottom / h) * vh), maxY:upper((.5 - top / h) * vh), unit};
    if (bounds.minX > bounds.maxX) bounds.minX = bounds.maxX = (bounds.minX + bounds.maxX) / 2;
    if (bounds.minY > bounds.maxY) bounds.minY = bounds.maxY = (bounds.minY + bounds.maxY) / 2;
    return bounds;
  }

  constrainPlayPosition(position, bounds) {
    position.x = THREE.MathUtils.clamp(position.x, bounds.minX, bounds.maxX);
    position.y = THREE.MathUtils.clamp(position.y, bounds.minY, bounds.maxY);
  }

  updatePlayMotion(b, dt) {
    b.playableElapsed = (b.playableElapsed || 0) + (b.spawnElapsed >= .4 ? dt : 0);
    const struggle = Math.max(0, (b.playableElapsed - 5) / 8, ((b.nearSeconds || 0) - 1.5) / 5);
    this.roundEase = Math.min(1, Math.max(this.roundEase, struggle));
    b.motionGain += ((1 - this.roundEase * .5) - b.motionGain) * (1 - Math.exp(-dt * 2));
    // Stop at the current position on approach; do not pull the target away by
    // returning it to its anchor. Jelly stays still after its first layer.
    const held = this.isNearHand || (b.type === 'jelly' && b.hitsReceived > 0);
    if (held) { this.constrainPlayPosition(b.group.position, b.playBounds); return; }
    b.motionElapsed += dt * (1 - this.roundEase * .65);
    const style = this.getPlayStyle();
    const offset = animalTargetOffset(style, b.motionElapsed, this.bubbleIndex);
    b.group.position.x = b.basePos.x + offset.x * b.playBounds.unit * b.motionGain;
    b.group.position.y = b.basePos.y - offset.y * b.playBounds.unit * b.motionGain;
    // Near-target suction is already expressed by contact feedback; motion and
    // collision share this final, bounded target position.
    this.constrainPlayPosition(b.group.position, b.playBounds);
  }

  chooseRoundWord() {
    const shuffle = items => {
      for (let i=items.length-1;i>0;i--) {
        const j=Math.floor(Math.random()*(i+1));
        [items[i],items[j]]=[items[j],items[i]];
      }
      return items;
    };
    // A small, coherent theme per rescue, with all four words seen before repeats.
    if (!this.wordPool.length) {
      const categories=[...new Set(WORDS_LIST.map(word=>word.category))];
      const category=categories[Math.floor(Math.random()*categories.length)];
      const concepts=new Set();
      this.wordPool=shuffle(WORDS_LIST.filter(word=>word.category===category)).filter(word=>{
        const concept=word.conceptId||word.id;
        if(concepts.has(concept))return false;
        concepts.add(concept);return true;
      }).slice(0,4);
    }
    if (!this.wordQueue?.length) {
      this.wordQueue=shuffle([...this.wordPool]);
      if(this.wordQueue.length>1 && this.wordQueue[0].id===this.lastWordId) {
        [this.wordQueue[0],this.wordQueue[1]]=[this.wordQueue[1],this.wordQueue[0]];
      }
    }
    return this.wordQueue.shift();
  }

  createBubble(index, forceType = null, forceWord = null) {
    this.bubbleIndex = index;
    const bubbleType = this.determineBubbleType(index, forceType);
    this.bubbleType = bubbleType;
    const rainbowColors = [0xff6b81, 0xffa502, 0x2ed573, 0x1e90ff, 0x9b59b6];
    const colorHex = rainbowColors[index % rainbowColors.length];

    const word = forceWord
      ? (typeof forceWord === 'string' ? getWordById(forceWord) || { id: forceWord, word: forceWord } : forceWord)
      : this.wordMode ? this.chooseRoundWord() : null;
    if (word?.id) this.lastWordId = word.id;

    const group = new THREE.Group();
    const isJelly = (bubbleType === 'jelly');
    const spawnPos = this.calculateSpawnPosition();
    if (bubbleType === "coop_heart") {
      spawnPos.x = 0;
    }
    group.position.copy(spawnPos);

    const winW = (typeof window !== 'undefined' ? getViewport().width : 1280) || 1280;
    const winH = (typeof window !== 'undefined' ? getViewport().height : 720) || 720;
    const vFOV = THREE.MathUtils.degToRad(this.camera.fov || 48);
    const camZ = Math.abs(this.camera.position.z || 7.5);
    const visibleHeight = 2 * Math.tan(vFOV / 2) * camZ;
    const pxToWorld = visibleHeight / winH;
    const aspect = this.camera.aspect || (winW / winH);
    const visibleWidth = visibleHeight * aspect;

    const isNarrow = (winW / winH) < 0.8;
    const baseTargetDiameterPx = winH<420&&winW>winH ? Math.max(winH<300?64:80,Math.min(112,winH*.27)) : isNarrow
      ? Math.min(120, Math.max(100, 0.20 * Math.min(winW, winH)))
      : Math.min(156, Math.max(104, 0.20 * Math.min(winW, winH)));
    const targetDiameterPx = baseTargetDiameterPx * this.getPlayStyle().size;
    const radius = (targetDiameterPx * pxToWorld) / (2 * 1.10);

    // --- 特殊机制泡泡分流构建 ---
    if (bubbleType === 'jelly') {
      const jellyRadius = radius * 1.15;
      const jellyGeo = new THREE.SphereGeometry(jellyRadius, 32, 32);
      const jellyMat = new THREE.MeshPhysicalMaterial({
        color: 0xffffff,
        transmission: 0,
        opacity: 0.32,
        transparent: true,
        roughness: 0.04,
        ior: 1.25,
        reflectivity: 0.95,
        clearcoat: 1.0,
        clearcoatRoughness: 0.08,
        emissive: 0xff4757,
        emissiveIntensity: 0.35,
        depthWrite: false
      });
      const mesh = new THREE.Mesh(jellyGeo, jellyMat);
      group.add(mesh);

      const outlineGeo = new THREE.RingGeometry(jellyRadius * 0.94, jellyRadius * 1.025, 64);
      const outlineMat = new THREE.MeshBasicMaterial({
        color: new THREE.Color(0xff4757).multiplyScalar(0.7),
        transparent: true,
        opacity: 0.95,
        side: THREE.DoubleSide,
        depthWrite: false
      });
      const outlineMesh = new THREE.Mesh(outlineGeo, outlineMat);
      group.add(outlineMesh);

      const cardGroup = this.createWordCardMesh(word, jellyRadius * 0.85);
      group.add(cardGroup);

      const highlightGeo = new THREE.SphereGeometry(jellyRadius * 0.22, 12, 12);
      const highlightMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.75, depthWrite: false });
      const highlightMesh = new THREE.Mesh(highlightGeo, highlightMat);
      highlightMesh.position.set(-jellyRadius * 0.45, jellyRadius * 0.45, jellyRadius * 0.65);
      highlightMesh.scale.set(1.4, 0.7, 0.5);
      group.add(highlightMesh);

      group.scale.set(0.65, 0.65, 0.65);
      this.scene.add(group);

      this.activeBubble = {
        group,
        type: 'jelly',
        ownerId: this.playerMode === 'coop' ? (this.lastPopPlayerSide === 'left' ? 1 : 2) : 1,
        mesh,
        outlineMesh,
        glowMesh: null,
        core: cardGroup,
        cardGroup,
        word,
        radius: jellyRadius,
        baseRadius: jellyRadius,
        basePos: spawnPos.clone(),
        colorHex: 0xff4757,
        scale: 0.65,
        spawnElapsed: 0,
        relocateAfterMs: 8000 + Math.random() * 4000,
        relocationElapsed: 0,
        updateCount: 0,
        suppressedHands: new Set(),
        word,
        isPopping: false,
        hitsNeeded: 2,
        hitsReceived: 0,
        squashTimer: 0,
        energyValue: 2
      };
      this.initializePlayTarget();
      this.idleTimer = 0;
      this.isEnlargedForHelp = false;
      if (this.balloon?.setBubbleTarget) this.balloon.setBubbleTarget(this.activeBubble.basePos);
      return;
    }

    if (bubbleType === 'rainbow') {
      const bubbleGeo = new THREE.SphereGeometry(radius, 32, 32);
      const bubbleMat = new THREE.MeshPhysicalMaterial({
        color: 0xffffff,
        transmission: 0,
        opacity: 0.25,
        transparent: true,
        roughness: 0.05,
        ior: 1.18,
        reflectivity: 0.95,
        clearcoat: 1.0,
        emissive: 0xfffa65,
        emissiveIntensity: 0.40,
        depthWrite: false
      });
      const mesh = new THREE.Mesh(bubbleGeo, bubbleMat);
      group.add(mesh);

      const outlineGeo = new THREE.RingGeometry(radius * 0.95, radius * 1.03, 64);
      const outlineMat = new THREE.MeshBasicMaterial({
        color: 0xffd32a,
        transparent: true,
        opacity: 0.96,
        side: THREE.DoubleSide,
        depthWrite: false
      });
      const outlineMesh = new THREE.Mesh(outlineGeo, outlineMat);
      group.add(outlineMesh);

      const rainbowRingGeo = new THREE.RingGeometry(radius * 1.05, radius * 1.18, 48);
      const rainbowRingMat = new THREE.MeshBasicMaterial({
        color: 0x2ed573,
        transparent: true,
        opacity: 0.55,
        side: THREE.DoubleSide,
        depthWrite: false
      });
      const rainbowRingMesh = new THREE.Mesh(rainbowRingGeo, rainbowRingMat);
      group.add(rainbowRingMesh);

      const cardGroup = this.createWordCardMesh(word, radius);
      group.add(cardGroup);

      group.scale.set(0.65, 0.65, 0.65);
      this.scene.add(group);

      this.activeBubble = {
        group,
        type: 'rainbow',
        ownerId: this.playerMode === 'coop' ? (this.lastPopPlayerSide === 'left' ? 1 : 2) : 1,
        mesh,
        outlineMesh,
        glowMesh: rainbowRingMesh,
        rainbowRing: rainbowRingMesh,
        core: cardGroup,
        cardGroup,
        word,
        radius,
        baseRadius: radius,
        basePos: spawnPos.clone(),
        colorHex: 0xffd32a,
        scale: 0.65,
        spawnElapsed: 0,
        relocateAfterMs: 8000 + Math.random() * 4000,
        relocationElapsed: 0,
        updateCount: 0,
        suppressedHands: new Set(),
        isPopping: false,
        hitsNeeded: 1,
        hitsReceived: 0,
        energyValue: 1
      };
      this.initializePlayTarget();
      this.idleTimer = 0;
      this.isEnlargedForHelp = false;
      if (this.balloon?.setBubbleTarget) this.balloon.setBubbleTarget(this.activeBubble.basePos);
      return;
    }

    if (bubbleType === 'coop_heart') {
      const heartRadius = radius * 0.95;
      const leftGroup = new THREE.Group();
      const rightGroup = new THREE.Group();

      const leftShape = new THREE.Shape();
      leftShape.moveTo(0, heartRadius * 0.4);
      leftShape.bezierCurveTo(0, heartRadius * 0.7, -heartRadius * 0.6, heartRadius * 0.7, -heartRadius * 0.6, heartRadius * 0.3);
      leftShape.bezierCurveTo(-heartRadius * 0.6, -heartRadius * 0.1, -heartRadius * 0.2, -heartRadius * 0.45, 0, -heartRadius * 0.65);
      leftShape.lineTo(0, heartRadius * 0.4);

      const leftGeo = new THREE.ShapeGeometry(leftShape);
      const leftMat = new THREE.MeshBasicMaterial({
        color: 0xff6b81,
        transparent: true,
        opacity: 0.88,
        side: THREE.DoubleSide,
        depthWrite: false
      });
      const leftMesh = new THREE.Mesh(leftGeo, leftMat);
      leftGroup.add(leftMesh);

      const leftGlow = new THREE.Mesh(new THREE.RingGeometry(heartRadius * 0.5, heartRadius * 0.75, 32), new THREE.MeshBasicMaterial({ color: 0xff6b81, transparent: true, opacity: 0.4, side: THREE.DoubleSide, depthWrite: false }));
      leftGroup.add(leftGlow);

      const rightShape = new THREE.Shape();
      rightShape.moveTo(0, heartRadius * 0.4);
      rightShape.bezierCurveTo(0, heartRadius * 0.7, heartRadius * 0.6, heartRadius * 0.7, heartRadius * 0.6, heartRadius * 0.3);
      rightShape.bezierCurveTo(heartRadius * 0.6, -heartRadius * 0.1, heartRadius * 0.2, -heartRadius * 0.45, 0, -heartRadius * 0.65);
      rightShape.lineTo(0, heartRadius * 0.4);

      const rightGeo = new THREE.ShapeGeometry(rightShape);
      const rightMat = new THREE.MeshBasicMaterial({
        color: 0x1e90ff,
        transparent: true,
        opacity: 0.88,
        side: THREE.DoubleSide,
        depthWrite: false
      });
      const rightMesh = new THREE.Mesh(rightGeo, rightMat);
      rightGroup.add(rightMesh);

      const rightGlow = new THREE.Mesh(new THREE.RingGeometry(heartRadius * 0.5, heartRadius * 0.75, 32), new THREE.MeshBasicMaterial({ color: 0x1e90ff, transparent: true, opacity: 0.4, side: THREE.DoubleSide, depthWrite: false }));
      rightGroup.add(rightGlow);

      const maxSpan = Math.max(visibleWidth * 0.08, Math.min(visibleWidth * 0.16, ((visibleWidth * 0.46) / 1.40) - (heartRadius * 0.85)));
      const spanX = Math.max(0.08, maxSpan);
      leftGroup.position.set(-spanX, 0, 0);
      rightGroup.position.set(spanX, 0, 0);

      group.add(leftGroup);
      group.add(rightGroup);

      group.scale.set(0.65, 0.65, 0.65);
      this.scene.add(group);

      this.activeBubble = {
        group,
        type: 'coop_heart',
        leftHeartGroup: leftGroup,
        rightHeartGroup: rightGroup,
        leftMesh,
        rightMesh,
        leftGlow,
        rightGlow,
        spanX,
        leftTouched: false,
        rightTouched: false,
        leftTouchTime: 0,
        rightTouchTime: 0,
        merging: false,
        mergeProgress: 0,
        mesh: leftMesh,
        outlineMesh: leftGlow,
        glowMesh: rightGlow,
        core: rightMesh,
        radius: heartRadius,
        baseRadius: heartRadius,
        basePos: spawnPos.clone(),
        colorHex: 0xff6b81,
        scale: 0.65,
        spawnElapsed: 0,
        relocateAfterMs: 12000,
        relocationElapsed: 0,
        updateCount: 0,
        suppressedHands: new Set(),
        isPopping: false,
        hitsNeeded: 2,
        hitsReceived: 0,
        energyValue: 2
      };
      this.initializePlayTarget();
      this.idleTimer = 0;
      this.isEnlargedForHelp = false;
      if (this.balloon?.setBubbleTarget) this.balloon.setBubbleTarget(this.activeBubble.basePos);
      return;
    }

    // 1. 主泡泡球体 (七彩透明肥皂泡材质，内部透明度约 0.70)
    const bubbleGeo = new THREE.SphereGeometry(radius, 32, 32);
    const bubbleMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      transmission: 0,
      opacity: 0.18,
      transparent: true,
      roughness: 0.08,
      ior: 1.15,
      reflectivity: 0.9,
      clearcoat: 1.0,
      clearcoatRoughness: 0.1,
      emissive: colorHex,
      emissiveIntensity: 0.25,
      depthWrite: false
    });
    const mesh = new THREE.Mesh(bubbleGeo, bubbleMat);
    group.add(mesh);

    // 2. 2.5~3px 彩色实线高辨识度外轮廓环 (朝向相机，浅色衣服与实景客厅一眼辨识)
    const outlineGeo = new THREE.RingGeometry(radius * 0.95, radius * 1.025, 64);
    const outlineMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(colorHex).multiplyScalar(.58),
      transparent: true,
      opacity: 0.96,
      side: THREE.DoubleSide,
      depthWrite: false
    });
    const outlineMesh = new THREE.Mesh(outlineGeo, outlineMat);
    group.add(outlineMesh);
    const whiteContour=new THREE.Mesh(new THREE.RingGeometry(radius*1.028,radius*1.06,64),new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.85,depthWrite:false}));
    group.add(whiteContour);

    // 3. 外部柔光光晕 (6~10px 柔光扩散)
    const glowGeo = new THREE.RingGeometry(radius * 1.02, radius * 1.10, 48);
    const glowMat = new THREE.MeshBasicMaterial({
      color: colorHex,
      transparent: true,
      opacity: 0.32,
      side: THREE.DoubleSide,
      depthWrite: false
    });
    const glowMesh = new THREE.Mesh(glowGeo, glowMat);
    group.add(glowMesh);

    // 4. 泡泡内展示 21 个英语启蒙单词卡通卡片
    const cardGroup = this.createWordCardMesh(word, radius);
    group.add(cardGroup);

    // 5. 表面可爱高光弧
    const highlightGeo = new THREE.SphereGeometry(radius * 0.22, 12, 12);
    const highlightMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.65,
      depthWrite: false
    });
    const highlightMesh = new THREE.Mesh(highlightGeo, highlightMat);
    highlightMesh.position.set(-radius * 0.45, radius * 0.45, radius * 0.65);
    highlightMesh.scale.set(1.4, 0.7, 0.5);
    group.add(highlightMesh);

    // 初始缩放设为出场起步 0.65 (0~320ms 弹性弹入 0.65→1.08→1.00，禁止从0闪现)
    group.scale.set(0.65, 0.65, 0.65);
    this.scene.add(group);

    this.activeBubble = {
      group,
      ownerId:this.playerMode==='coop'?(this.lastPopPlayerSide==='left'?1:2):1,
      mesh,
      outlineMesh,
      glowMesh,
      core: cardGroup,
      cardGroup,
      word,
      radius,
      baseRadius: radius,
      basePos: spawnPos.clone(),
      colorHex,
      scale: 0.65,
      spawnElapsed: 0,
      relocateAfterMs:8000+Math.random()*4000,
      relocationElapsed:0,
      updateCount: 0,
      suppressedHands: new Set(),
      isPopping: false,
      type: 'normal',
      hitsNeeded: 1,
      hitsReceived: 0,
      energyValue: 1
    };

    this.initializePlayTarget();
    this.idleTimer = 0;
    this.isEnlargedForHelp = false;

    // 更新小熊目光追踪目标
    if (this.balloon && this.balloon.setBubbleTarget) {
      this.balloon.setBubbleTarget(this.activeBubble.basePos);
    }
  }

  getInteractionTips(players, w, h) {
    const tips = [];
    for (const player of players || []) {
      const used = new Set();
      for (const [i, hand] of (player.hands || []).entries()) {
        if (hand.isIndexTip === false || hand.observed === false) continue;
        if (hand.source === 'hand-21' && this.handsAgeSeconds >= .18) continue;
        const base = player.id === 2 ? 2 : 0;
        const slot = hand.side === 'right' ? base + 1 : hand.side === 'left' ? base : !used.has(base) ? base : base + 1;
        used.add(slot);
        const marker = this.handIndicators[slot];
        const displayed = marker?.active && this.handsAgeSeconds < .18 ? marker.group.position.clone().project(this.camera) : null;
        const x = displayed ? (displayed.x + 1) * .5 : hand.x;
        const y = displayed ? (1 - displayed.y) * .5 : hand.y;
        if (!Number.isFinite(x) || !Number.isFinite(y)) continue;
        tips.push({ playerId: player.id, source: hand.source, key: player.id + '_' + (hand.side || i), x, y, px: x * w, py: y * h });
      }
    }
    return tips;
  }

  getInteractionHint() {
    const b = this.activeBubble;
    if (!b) return '';
    if (b.type === 'coop_heart') return b.merging ? '两颗爱心合在一起啦' : b.leftTouched ? '左边准备好啦，等右边的朋友' : b.rightTouched ? '右边准备好啦，等左边的朋友' : '左边金色、右边蓝色，一起碰碰爱心';
    const owner = this.playerMode === 'coop' ? (b.ownerId === 2 ? '右边蓝色朋友：' : '左边金色朋友：') : '';
    if (b.type === 'jelly') return owner + (b.hitsReceived ? '还差一下：收回食指，再戳一次' : '果冻有两层，戳一下，再戳一下');
    return owner + (this.roundEase > .4 ? '泡泡放慢啦，慢慢碰就好' : this.bubbleIndex === 0 ? '先碰一颗，熟悉指尖小光点' : this.getPlayStyle().hint);
  }

  showContact(x, y, b) {
    const p = new THREE.Vector3(x * 2 - 1, 1 - y * 2, 0).unproject(this.camera);
    const direction = p.clone().sub(this.camera.position);
    p.copy(this.camera.position).addScaledVector(direction, (b.group.position.z - this.camera.position.z) / direction.z);
    this.spawnPopRing(p, 0xffffff, b.baseRadius * .22);
    this.handFlashTimer = .16;
  }

  // 碰撞检测与接近吸附加亮检测（以食指尖为单一交互锚点，含 400ms 出场保护期与防秒爆）
  checkHandCollisions(trackedPlayers) {
    if (!this.activeBubble || this.activeBubble.isPopping || !trackedPlayers || trackedPlayers.length === 0) {
      this.isNearHand = false;
      return false;
    }

    const b = this.activeBubble;
    const w = (typeof window !== 'undefined' && getViewport().width) ? getViewport().width : 1280;
    const h = (typeof window !== 'undefined' && getViewport().height) ? getViewport().height : 720;

    if (this.layoutGraceSeconds > 0 || b.relocating) return false;
    const tips = this.getInteractionTips(trackedPlayers, w, h);
    const isProtected = b.updateCount > 0 && b.spawnElapsed < .400;
    b.suppressedHands ||= new Set();
    // Both halves obey the same freshness, displayed-tip and spawn guards.
    if (b.type === 'coop_heart' && b.leftHeartGroup && b.rightHeartGroup) {
      if (b.merging) return false;
      const now = this.interactionClock * 1000;
      for (const side of ['left', 'right']) {
        if (b[side + 'Touched'] && now - b[side + 'TouchTime'] > 2000) b[side + 'Touched'] = false;
      }
      b.group.updateWorldMatrix(true, true);
      const threshold = b.radius * h / (2 * Math.tan(THREE.MathUtils.degToRad(this.camera.fov / 2)) * Math.abs(this.camera.position.z)) * 1.15;
      this.isNearHand = false;
      for (const tip of tips) {
        const side = tip.playerId === 1 ? 'left' : tip.playerId === 2 ? 'right' : null;
        if (!side) continue;
        const p = b[side + 'HeartGroup'].getWorldPosition(new THREE.Vector3()).project(this.camera);
        const dist = Math.hypot(tip.px - (p.x + 1) * .5 * w, tip.py - (1 - p.y) * .5 * h);
        const key = tip.key + '_' + side;
        if (dist < threshold * 1.65) this.isNearHand = true;
        if (dist > threshold * 1.12) b.suppressedHands.delete(key);
        if (isProtected) { if (dist <= threshold) b.suppressedHands.add(key); continue; }
        if (dist <= threshold && !b.suppressedHands.has(key) && !b[side + 'Touched']) {
          b[side + 'Touched'] = true;
          b.suppressedHands.add(key);
          b[side + 'TouchTime'] = now;
          this.showContact(tip.x, tip.y, b);
          this.audio?.playCountdown?.(tip.playerId);
        }
      }
      if (b.leftTouched && b.rightTouched) b.merging = true;
      return false;
    }

    // 将泡泡 3D 世界坐标投影至 2D 归一化屏幕空间
    const bubbleWorldPos = b.group.position.clone();
    const screenCoord = bubbleWorldPos.clone().project(this.camera);

    const bubbleScreenX = (screenCoord.x + 1) / 2;
    const bubbleScreenY = (1 - screenCoord.y) / 2;

    // 获取泡泡可视横向边缘点的投影
    const edgeWorldPos = bubbleWorldPos.clone().add(new THREE.Vector3(b.radius, 0, 0));
    const edgeScreenCoord = edgeWorldPos.project(this.camera);

    // 统一转换为屏幕物理像素空间进行欧氏距离对比

    const bubblePxX = bubbleScreenX * w;
    const bubblePxY = bubbleScreenY * h;
    const edgePxX = ((edgeScreenCoord.x + 1) / 2) * w;
    const radiusPx = Math.abs(edgePxX - bubblePxX) * GAME_CONFIG.gameplay.touchDistanceMultiplier;

    // 出场 400ms 保护期检测（仅在游戏运行帧更新状态下生效；单元测试单帧模式下不阻塞）


    let hit = false;
    let hitHandX = bubbleScreenX;
    let hitHandY = bubbleScreenY;
    let closestDist = Infinity;
    let closestHand = null;

    if (!b.suppressedHands) {
      b.suppressedHands = new Set();
    }

    for (const tip of tips) {
      const dist = Math.hypot(tip.px - bubblePxX, tip.py - bubblePxY);
      if (this.playerMode === 'coop' && b.ownerId && tip.playerId !== b.ownerId) {
        // The demo has one physical pointer that changes player at the midline.
        // Moving it outside a jelly must release that pointer's previous role.
        if (tip.source === 'demo' && dist > radiusPx * 1.12) b.suppressedHands.delete(b.ownerId + '_demo_pointer');
        continue;
      }
      if (dist < closestDist) { closestDist = dist; closestHand = tip; }
      const inside = dist <= radiusPx;
      if (isProtected) { if (inside) b.suppressedHands.add(tip.key); continue; }
      if (dist > radiusPx * 1.12) b.suppressedHands.delete(tip.key);
      if (inside && !b.suppressedHands.has(tip.key)) {
        hit = true; hitHandX = tip.x; hitHandY = tip.y;
        b.suppressedHands.add(tip.key);
        break;
      }
    }

    if (isProtected) {
      return false;
    }

    // 接近状态检测 (1.6x 半径内吸附增亮)
    if (closestDist < radiusPx * 1.6 && closestHand) {
      this.isNearHand = true;
      // 计算至多 8px 的平滑视觉吸附位移
      const pxToWorld = (2 * Math.tan(THREE.MathUtils.degToRad((this.camera.fov || 48) / 2)) * Math.abs(this.camera.position.z || 7.5)) / h;
      const maxOffsetWorld = 8 * pxToWorld;
      const angle = Math.atan2((closestHand.y * h) - bubblePxY, (closestHand.x * w) - bubblePxX);
      this.proximityOffset.set(
        Math.cos(angle) * maxOffsetWorld * 0.7,
        -Math.sin(angle) * maxOffsetWorld * 0.7,
        0
      );
    } else {
      this.isNearHand = false;
      this.proximityOffset.set(0, 0, 0);
    }

    if (hit) {
      this.showContact(hitHandX, hitHandY, b);
      if (b.type === 'jelly' && b.hitsReceived < (b.hitsNeeded - 1)) {
        b.hitsReceived++;
        b.squashTimer = 0.32;
        this.handFlashTimer = 0.160;
        if (this.audio?.playJellyBoing) {
          this.audio.playJellyBoing();
        }
        this.spawnBurstParticles(b.group.position, b.colorHex, 6);
        for (const tip of tips) if (Math.hypot(tip.px - bubblePxX, tip.py - bubblePxY) <= radiusPx) b.suppressedHands.add(tip.key);
        return false;
      }

      this.popBubble(hitHandX, hitHandY);
      return true;
    }
    return false;
  }

  // 碰破泡泡逻辑
  popBubble(hitX, hitY) {
    if (!this.activeBubble || this.activeBubble.isPopping) return;
    this.activeBubble.isPopping = true;
    this.hasLearnedTouch = true;

    const burstWorldPos = this.activeBubble.group.position.clone();
    const burstColor = this.activeBubble.colorHex;
    this.lastPopPosition = burstWorldPos.clone();

    const now = typeof performance !== "undefined" ? performance.now() : Date.now();
    if (this.comboCount > 0 && this.comboRemainingMs > 0) {
      this.comboCount = Math.min(8, this.comboCount + 1);
    } else {
      this.comboCount = 1;
    }
    this.lastPopTime = now;
    this.comboRemainingMs = this.comboTimeoutMs;
    if (typeof this.onComboChange === "function") {
      this.onComboChange(this.comboCount);
    }

    const energyVal = this.activeBubble.energyValue || 1;
    this.lastPoppedEnergy = energyVal;
    const elapsed = this.activeBubble.playableElapsed || 0;
    this.comfortableHits = elapsed > 0 && elapsed < 3.5 ? this.comfortableHits + 1 : 0;
    if (this.comfortableHits >= 3) this.roundEase = Math.max(0, this.roundEase - .08);
    this.completedBubbleCount++;
    this.rescueAnimal?.followEnergy?.(this.activeBubble.group.position);

    // 1. 播放破裂音效与英语单词发音 (按泡泡类型触发专属音效)
    if (this.activeBubble.word) {
      const word = this.activeBubble.word;
      const review = this.roundSeenWords.has(word.id);
      this.roundSeenWords.add(word.id);
      const audioDone = this.audio?.playWord?.(word.id || word.word, {review});
      if (typeof this.onWordPop === 'function') {
        this.onWordPop(word, hitX, hitY, audioDone, {review});
      }
    }
    if (this.activeBubble.type === 'rainbow') {
      if (this.audio && typeof this.audio.playRainbowGlide === 'function') {
        this.audio.playRainbowGlide();
      } else if (this.audio && typeof this.audio.playPop === 'function') {
        this.audio.playPop(this.comboCount);
      }
    } else if (this.activeBubble.type === 'coop_heart') {
      if (this.audio && typeof this.audio.playHeartMerge === 'function') {
        this.audio.playHeartMerge();
      } else if (this.audio && typeof this.audio.playPop === 'function') {
        this.audio.playPop(this.comboCount);
      }
    } else {
      if (this.audio && typeof this.audio.playPop === 'function') {
        this.audio.playPop(this.comboCount);
      }
    }

    // 2. 触发手晕 160ms 命中闪圈至 ~82px
    this.handFlashTimer = 0.160;

    this.spawnPopRing(burstWorldPos,burstColor,this.activeBubble.baseRadius);
    // 3. 移除主球体
    this.disposeBubble(this.activeBubble.group);

    // 4. 产生 12~18 个彩色小星星与肥皂水滴爆发粒子
    const pCount = this.activeBubble.type === "rainbow" ? 24 : (this.activeBubble.type === "jelly" ? 20 : 16);
    this.spawnBurstParticles(burstWorldPos, burstColor, pCount);

    // 5. 产生能量光团，沿弧线飞向小动物领结
    this.spawnEnergyProjectile(burstWorldPos, burstColor, energyVal);

    this.activeBubble = null;
    this.isNearHand = false;

    // 小熊视线回正
    if (this.balloon && this.balloon.setBubbleTarget) {
      this.balloon.setBubbleTarget(null);
    }
  }

  spawnPopRing(position,color,radius) {
    const mesh=new THREE.Mesh(new THREE.RingGeometry(radius*.94,radius*1.025,64),new THREE.MeshBasicMaterial({color,transparent:true,opacity:.9,depthWrite:false,side:THREE.DoubleSide}));
    mesh.position.copy(position);mesh.position.z+=.035;this.scene.add(mesh);this.popRings.push({mesh,elapsed:0});
  }

  // 生成爆破粒子 (12~18 个彩色闪烁星点与柔和水滴)
  spawnBurstParticles(pos, color, customCount = 16) {
    const count = customCount;
    for (let i = 0; i < count; i++) {
      const isStar = i % 2 === 0;
      const geo = isStar
        ? new THREE.PlaneGeometry(.045,.10)
        : new THREE.SphereGeometry(0.025 + Math.random() * 0.025, 8, 8);

      const mat = new THREE.MeshBasicMaterial({
        color: Math.random() > 0.35 ? color : 0xffffff,
        transparent: true,
        opacity: 0.95
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.rotation.z=Math.random()*Math.PI;
      mesh.position.copy(pos);

      const angle = Math.random() * Math.PI * 2;
      const speed = 0.025 + Math.random() * 0.035;
      const velocity = new THREE.Vector3(
        Math.cos(angle) * speed,
        Math.sin(angle) * speed + 0.02,
        (Math.random() - 0.5) * speed * 0.6
      );

      this.particles.push({
        mesh,
        velocity,
        life: 1.0,
        decay: 0.028 + Math.random() * 0.025
      });
      this.scene.add(mesh);
    }
  }

  setRescueAnimal(rescueAnimal) {
    this.rescueAnimal = rescueAnimal;
  }

  // 生成飞向解救小动物领结的能量球 (平滑贝塞尔拱形弧线)
  spawnEnergyProjectile(startPos, color, energyCount = 1) {
    const geo = new THREE.SphereGeometry(energyCount > 1 ? 0.088 : 0.065, 16, 16);
    const mat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.95
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(startPos);

    // 外层柔光环
    const glowGeo = new THREE.SphereGeometry(energyCount > 1 ? 0.17 : 0.13, 12, 12);
    const glowMat = new THREE.MeshBasicMaterial({
      color: color,
      transparent: true,
      opacity: 0.50
    });
    const glowMesh = new THREE.Mesh(glowGeo, glowMat);
    mesh.add(glowMesh);

    // 目标位置：若存在解救小动物模块，精确飞向左侧小动物领结；否则飞向热气球
    let targetPos;
    if (this.rescueAnimal && this.rescueAnimal.getTargetPosition) {
      targetPos = this.rescueAnimal.getTargetPosition();
    } else {
      const balloonScale = (this.balloon && this.balloon.modelScale) ? this.balloon.modelScale : 0.42;
      const balloonInitialY = (this.balloon && typeof this.balloon.initialY === 'number') ? this.balloon.initialY : -2.2;
      targetPos = new THREE.Vector3(0, balloonInitialY + 3.4 * balloonScale, 0);
    }

    this.energyProjectiles.push({
      mesh,
      start: startPos.clone(),
      target: targetPos,
      progress: 0,
      color,
      energyCount
    });
    this.scene.add(mesh);
  }

  // 更新手部光芒环 (暖金 #FFE394 / 浅蓝 #8DDAFF，食指指尖定位，支持丢失平滑淡出与重现淡入)
  updateHandIndicators(trackedPlayers) {
    this.latestTrackedPlayers = trackedPlayers || [];
    this.pointerSimulation=this.latestTrackedPlayers.some(p=>p.hands?.some(h=>h.source==='demo'||h.side==='demo_pointer'));
    this.handsAgeSeconds = 0;
    const activeSlots = new Set();
    const isNodeTest = typeof document === 'undefined';

    for (const player of trackedPlayers) {
      if (!player.hands) continue;
      const baseIndex = (player.id === 2) ? 2 : 0;
      const isPlayer2 = player.id === 2;

      for (const hand of player.hands) {
        // 食指指尖丢失时不显示手光芒
        if (hand.isIndexTip === false || hand.observed === false) continue;

        let slot = baseIndex;
        if (hand.side === 'right') {
          slot = baseIndex + 1;
        } else if (hand.side === 'left') {
          slot = baseIndex;
        } else {
          slot = !activeSlots.has(baseIndex) ? baseIndex : baseIndex + 1;
        }
        if (slot >= this.handIndicators.length) continue;

        activeSlots.add(slot);
        const ind = this.handIndicators[slot];
        const targetColor = isPlayer2 ? 0x8ddaff : 0xffe394;
        if (ind.color !== targetColor) {
          ind.color = targetColor;
          ind.haloMesh.material.color.setHex(targetColor);
          ind.rimMesh.material.color.setHex(targetColor);
        }

        // 将屏幕归一化坐标反投影到 3D 摄像机平面前方
        const ndcX = hand.x * 2 - 1;
        const ndcY = -(hand.y * 2 - 1);
        const handPos = new THREE.Vector3(ndcX, ndcY, 0.5).unproject(this.camera);

        const dir = handPos.sub(this.camera.position).normalize();
        const dist = 7.0; // 放置在摄像机前合适深度
        const targetWorld = this.camera.position.clone().add(dir.multiplyScalar(dist));

        // 重新捕获时在新位置淡入，避免跨屏瞬移
        if (!ind.active) {
          ind.group.position.copy(targetWorld);
          ind.fadeTimer = 0.18;
          ind.currentOpacity = 0.25;
        }
        // Render interpolation is advanced at display frame rate below.
        if(!ind.targetPosition)ind.targetPosition=new THREE.Vector3();
        ind.targetPosition.copy(targetWorld);

        ind.group.lookAt(this.camera.position);
        ind.group.visible = true;
        ind.active = true;
        ind.fadeTimer = 0.18;

        // 接近增亮与命中闪圈控制
        let targetScale = 1.0;
        let baseOpacity = 0.75;

        if (this.handFlashTimer > 0) {
          // 命中 160ms 内闪圈至 82px (~1.7x)
          targetScale = 1.7;
          baseOpacity = 0.98;
        } else if (this.isNearHand) {
          // 靠近泡泡加亮 (直径扩大 ~1.15x，不透明度 0.90)
          targetScale = 1.15;
          baseOpacity = 0.90;
        }

        ind.group.scale.set(targetScale, targetScale, targetScale);
        const curAlpha = ind.currentOpacity !== undefined ? ind.currentOpacity : 1.0;
        ind.coreMesh.material.opacity = baseOpacity * curAlpha;
        ind.haloMesh.material.opacity = baseOpacity * 0.70 * curAlpha;
        ind.rimMesh.material.opacity = baseOpacity * 0.35 * curAlpha;
      }
    }

    // 隐藏或淡出未激活手晕
    for (let i = 0; i < this.handIndicators.length; i++) {
      if (!activeSlots.has(i)) {
        const ind = this.handIndicators[i];
        ind.active = false;
        if (isNodeTest) {
          ind.group.visible = false;
          ind.fadeTimer = 0;
        }
      }
    }
  }

  // 隐藏所有手部光芒环 (暂停或结算时调用)
  hideHandIndicators() {
    this.visualDemo.hide();
    this.pointerSimulation=false;
    this.handsAgeSeconds=Infinity;
    this.latestTrackedPlayers=[];
    for (const ind of this.handIndicators) {
      ind.group.visible = false;
      ind.active = false;
      ind.fadeTimer = 0;
      ind.currentOpacity = 0;
    }
  }

  // 仅清理当前泡泡球体，保留粒子与飞行动画 (用于第5分起飞时序完整过渡)
  clearActiveBubble() {
    this.visualDemo.hide();
    if (this.activeBubble) {
      this.disposeBubble(this.activeBubble.group);
      this.activeBubble = null;
    }
    if (this.spawnTimer) {
      clearTimeout(this.spawnTimer);
      this.spawnTimer = null;
    }
    this.isSpawning = false;
    this.idleTimer = 0;
    this.isEnlargedForHelp = false;
    this.isNearHand = false;
    this.proximityOffset.set(0, 0, 0);
    if (this.balloon && this.balloon.setBubbleTarget) {
      this.balloon.setBubbleTarget(null);
    }
  }

  // 帧更新 (出场弹性、待机呼吸、粒子与飞行动画)
  update(deltaSeconds, timeSeconds) {
    const dt = Math.min(deltaSeconds, 0.06);

    this.interactionClock += dt;
    this.layoutGraceSeconds = Math.max(0, this.layoutGraceSeconds - dt);
    this.contrastSampler?.update(dt);
    this.handsAgeSeconds=this.pointerSimulation?0:this.handsAgeSeconds+dt;
    for(let i=this.popRings.length-1;i>=0;i--){const ring=this.popRings[i];ring.elapsed+=dt;const t=Math.min(1,ring.elapsed/.34);ring.mesh.scale.setScalar(1+t*.55);ring.mesh.material.opacity=(1-t)*.85;if(t>=1){this.scene.remove(ring.mesh);ring.mesh.geometry.dispose();ring.mesh.material.dispose();this.popRings.splice(i,1);}}
    const players=this.latestTrackedPlayers || [];
    const currentBubble=this.activeBubble;
    const relevantPlayers=currentBubble?.ownerId ? players.filter(p=>p.id===currentBubble.ownerId) : players;
    const hasObservedTip=this.handsAgeSeconds<.18 && relevantPlayers.some(p=>p.hands?.some(h=>h.isIndexTip!==false && h.observed!==false));
    this.handLossSeconds=hasObservedTip?0:this.handLossSeconds+dt;
    if(currentBubble && players.length && this.handLossSeconds>.65 && this.idleTimer>1000) {
      const vh=2*Math.tan(THREE.MathUtils.degToRad(this.camera.fov/2))*Math.abs(this.camera.position.z);
      const vw=vh*this.camera.aspect;
      if(!currentBubble.assistTarget && Math.abs(currentBubble.basePos.x)>vw*.23) {
        const owner=this.playerMode==='coop'?(this.lastPopPlayerSide==='left'?1:2):1;
        const zone=this.playerComfortZones.find(p=>p.id===owner)?.comfortZone;
        const normX=zone?(zone.minX+zone.maxX)/2:(currentBubble.basePos.x<0?.34:.66);
        currentBubble.assistTarget=currentBubble.basePos.clone();
        currentBubble.assistTarget.x=(THREE.MathUtils.clamp(normX,.28,.72)-.5)*vw;
        currentBubble.assisted=true;
      }
    }
    if(currentBubble?.assistTarget)currentBubble.basePos.lerp(currentBubble.assistTarget,1-Math.exp(-dt*3));

    // 更新手晕闪圈计时
    if (this.handFlashTimer > 0) {
      this.handFlashTimer = Math.max(0, this.handFlashTimer - dt);
    }

    // 更新手晕淡入/淡出与闪圈星点旋转
    for (const ind of this.handIndicators) {
      if(ind.active && this.handsAgeSeconds>=.18){ind.active=false;ind.fadeTimer=.18;}
      if (ind.active) {
        if(ind.targetPosition)ind.group.position.lerp(ind.targetPosition,1-Math.exp(-dt/.022));
        const screen=ind.group.position.clone().project(this.camera);
        const w=typeof window!=='undefined'?getViewport().width:1280,h=typeof window!=='undefined'?getViewport().height:720;
        const luminance=this.contrastSampler?.sample((screen.x+1)/2,(1-screen.y)/2,w,h)??.76;
        ind.backgroundLuminance=ind.backgroundLuminance===undefined?luminance:ind.backgroundLuminance+(luminance-ind.backgroundLuminance)*Math.min(1,dt*8);
        const palette=pointerPalette(ind.backgroundLuminance,ind.contrastMode,ind.playerId);ind.contrastMode=palette.mode;
        const adaptive=new THREE.Color(palette.color);
        ind.coreMesh.material.color.lerp(adaptive,Math.min(1,dt*12));
        ind.haloMesh.material.color.setHex(ind.playerId===2?0x65d8ff:0xffce55);
        ind.rimMesh.material.color.copy(ind.haloMesh.material.color);
        const ringScale=this.handFlashTimer>0?1.65:this.isNearHand?1.2:1;
        ind.group.scale.lerp(new THREE.Vector3(ringScale,ringScale,ringScale),1-Math.exp(-dt*18));
        if(ind.darkEdge)ind.darkEdge.material.opacity=ind.whiteEdge.material.opacity=ind.currentOpacity;
        // 重新捕获时平滑淡入至 1.0 (~100ms)
        ind.currentOpacity = Math.min(1.0, (ind.currentOpacity || 0) + dt / 0.10);
        let baseOpacity = 0.75;
        if (this.handFlashTimer > 0) {
          baseOpacity = 0.98;
        } else if (this.isNearHand) {
          baseOpacity = 0.90;
        }
        ind.coreMesh.material.opacity = baseOpacity * ind.currentOpacity;
        ind.haloMesh.material.opacity = baseOpacity * 0.70 * ind.currentOpacity;
        ind.rimMesh.material.opacity = baseOpacity * 0.35 * ind.currentOpacity;
      } else if (ind.fadeTimer > 0) {
        ind.fadeTimer -= dt;
        const alpha = Math.max(0, ind.fadeTimer / 0.18);
        ind.currentOpacity = alpha;
        if(ind.darkEdge)ind.darkEdge.material.opacity=ind.whiteEdge.material.opacity=alpha;
        ind.coreMesh.material.opacity = 0.75 * alpha;
        ind.haloMesh.material.opacity = 0.55 * alpha;
        ind.rimMesh.material.opacity = 0.28 * alpha;
        if (ind.fadeTimer <= 0) {
          ind.group.visible = false;
        }
      }
      if (ind.stars) {
        const starOpacity = this.handFlashTimer > 0 ? (this.handFlashTimer / 0.16) * 0.95 : 0.0;
        for (const star of ind.stars) {
          star.mesh.material.opacity = starOpacity;
          if (starOpacity > 0) {
            const ang = star.baseAngle + timeSeconds * 3.5;
            star.mesh.position.set(Math.cos(ang) * 0.18, Math.sin(ang) * 0.18, 0.01);
          }
        }
      }
    }

    if (currentBubble && currentBubble.type !== 'coop_heart') {
      currentBubble.nearSeconds = this.isNearHand ? (currentBubble.nearSeconds || 0) + dt : Math.max(0, (currentBubble.nearSeconds || 0) - dt * .25);
      if (currentBubble.nearSeconds > 2.5 && !currentBubble.assistTarget) {
        const tip = this.getInteractionTips(players, 1, 1).find(t => this.playerMode !== 'coop' || t.playerId === currentBubble.ownerId);
        if (tip) {
          const vh = 2 * Math.tan(THREE.MathUtils.degToRad(this.camera.fov / 2)) * Math.abs(this.camera.position.z);
          currentBubble.assistTarget = currentBubble.basePos.clone();
          currentBubble.assistTarget.x += THREE.MathUtils.clamp((tip.x - .5) * vh * this.camera.aspect - currentBubble.basePos.x, -.18, .18);
          currentBubble.assisted = true;
        }
      }
    }
    const first=this.activeBubble;
    if(first && this.completedBubbleCount===0 && first.spawnElapsed>.4 && !this.isNearHand && (!this.hasLearnedTouch || this.idleTimer>4500)){
      const v=getViewport();
      const unit=2*Math.tan(THREE.MathUtils.degToRad(this.camera.fov/2))*Math.abs(this.camera.position.z)/v.height;
      this.visualDemo.update({elapsed:first.spawnElapsed,kind:'tap',target:first.group.position,unit,width:v.width,height:v.height,reducedMotion:this.rescueAnimal?.reducedMotion});
    }else this.visualDemo.hide();
    // A quiet target may move; never make it flee a hand that is approaching.
    const quiet=this.activeBubble;
    if(quiet) {
      if(this.idleTimer>quiet.relocateAfterMs&&!this.isNearHand&&!quiet.leftTouched&&!quiet.rightTouched&&!quiet.merging)quiet.relocating=true;
      if(quiet.relocating){quiet.relocationElapsed+=dt;if(this.isNearHand){quiet.relocating=false;quiet.relocationElapsed=0;quiet.relocateAfterMs=this.idleTimer+2000;}else if(quiet.relocationElapsed>=.18){const previous=this.lastPopPosition;this.lastPopPosition=quiet.basePos.clone();this.updateLayout();this.lastPopPosition=previous;}}
    }
    // 1. 泡泡待机动效
    if (this.activeBubble && !this.activeBubble.isPopping) {
      const b = this.activeBubble;
      b.updateCount = (b.updateCount || 0) + 1;
      b.spawnElapsed += dt;
      if(this.comboCount>0&&!b.relocating){
        const playableDt=Math.max(0,b.spawnElapsed-.4)-Math.max(0,b.spawnElapsed-dt-.4);
        this.comboRemainingMs=Math.max(0,this.comboRemainingMs-playableDt*1000);
        if(this.comboRemainingMs<=.001)this.resetCombo();
      }

      // 0~320ms 果冻缩放淡入 (0.65→1.08→1.00)
      let spawnScale = 1.0;
      let spawnAlpha = 1.0;
      if (b.spawnElapsed < 0.320) {
        const t = b.spawnElapsed / 0.320;
        spawnAlpha = Math.min(1.0, b.spawnElapsed / 0.24);
        if (t < 0.6875) {
          const p = t / 0.6875;
          spawnScale = 0.65 + 0.43 * Math.sin(p * Math.PI * 0.5);
        } else {
          const p = (t - 0.6875) / 0.3125;
          spawnScale = 1.08 - 0.08 * Math.sin(p * Math.PI * 0.5);
        }
      }

      // 果冻缩放淡入透明度联动
      if (b.mesh && b.mesh.material) {
        b.mesh.material.opacity = 0.18 * spawnAlpha;
      }
      if (b.outlineMesh && b.outlineMesh.material) {
        b.outlineMesh.material.opacity = (this.isNearHand ? 1.0 : 0.96) * spawnAlpha;
      }
      if (b.glowMesh && b.glowMesh.material) {
        b.glowMesh.material.opacity = (this.isNearHand ? 0.45 : 0.32) * spawnAlpha;
      }

      // 未触碰检测计时
      this.idleTimer += dt * 1000;
      if (this.idleTimer > GAME_CONFIG.gameplay.idleHelpDelayMs && !this.isEnlargedForHelp) {
        this.isEnlargedForHelp = true;
      }

      const helpScale = Math.max(1 + this.roundEase * .18, this.isEnlargedForHelp ? 1.25 : 1);

      // 呼吸缩放 (周期 2.2s，幅度 1.00 <-> 1.04)
      const breath = 1.0 + Math.sin(timeSeconds * (Math.PI * 2 / 2.2)) * 0.02;
      const totalScale = spawnScale * helpScale * breath;
      let scaleX = totalScale;
      let scaleY = totalScale;
      let scaleZ = totalScale;

      if (b.type === 'jelly' && b.squashTimer > 0) {
        b.squashTimer = Math.max(0, b.squashTimer - dt);
        const st = b.squashTimer / 0.32;
        const squish = Math.sin(st * Math.PI * 4) * st * 0.38;
        scaleX *= (1 + squish);
        scaleZ *= (1 + squish);
        scaleY *= (1 - squish * 0.85);
      }

      if (b.type === 'rainbow' && b.rainbowRing) {
        b.rainbowRing.rotation.z += dt * 3.5;
        const hue = (timeSeconds * 0.5) % 1.0;
        b.rainbowRing.material.color.setHSL(hue, 0.9, 0.6);
      }

      if (b.type === 'jelly') {
        if (!b.layerBeads) {
          b.layerBeads = [-1, 1].map(sign => {
            const bead = new THREE.Mesh(new THREE.SphereGeometry(b.baseRadius * .09, 10, 8), new THREE.MeshBasicMaterial({color: 0xffd166, transparent: true, opacity: 1}));
            bead.position.set(sign * b.baseRadius * .17, b.baseRadius * .55, b.baseRadius * .85);
            b.group.add(bead); return bead;
          });
        }
        b.layerBeads.forEach((bead, i) => { bead.visible = i >= b.hitsReceived; });
        b.core.scale.setScalar(b.hitsReceived ? .72 : 1);
      }
      if (b.type === 'coop_heart' && !b.merging) {
        for (const side of ['left', 'right']) {
          const ready = b[side + 'Touched'];
          b[side + 'HeartGroup'].scale.setScalar(ready ? 1.12 + Math.sin(timeSeconds * 4) * .035 : 1);
          b[side + 'Mesh'].material.opacity = ready ? 1 : .7;
          b[side + 'Glow'].material.opacity = ready ? .8 : .3;
        }
      }
      if (this.isNearHand && b.type !== 'coop_heart' && !b.squashTimer) {
        scaleX *= 1.025; scaleY *= .975;
      }

      if (b.type === 'coop_heart' && b.merging) {
        b.mergeProgress += dt * 3.0;
        const mp = Math.min(1.0, b.mergeProgress);
        b.leftHeartGroup.position.x = -b.spanX * (1 - mp);
        b.rightHeartGroup.position.x = b.spanX * (1 - mp);
        const spin = mp * Math.PI * 0.5;
        b.leftHeartGroup.rotation.z = spin;
        b.rightHeartGroup.rotation.z = -spin;

        if (mp >= 1.0 && !b.isPopping) {
          this.popBubble(0.5, 0.5);
          if (typeof this.onSpecialPop === 'function') {
            this.onSpecialPop('coop_heart');
          }
        }
      }

      b.group.scale.set(scaleX, scaleY, scaleZ);
      b.radius = b.baseRadius * helpScale;

      if (b.type === 'coop_heart') {
        b.group.position.copy(b.basePos);
      } else this.updatePlayMotion(b, dt);

      // 接近加亮 (描边增加约 25% 亮度)
      if (b.type !== 'coop_heart' && b.outlineMesh && b.glowMesh) {
        b.outlineMesh.material.opacity = this.isNearHand ? 1.0 : 0.96;
        b.glowMesh.material.opacity = this.isNearHand ? 0.45 : 0.32;
      }

      // 内部单词卡片与图案微幅摇摆漂浮
      if (b.cardGroup) {
        b.cardGroup.rotation.z = Math.sin(timeSeconds * 2.2) * 0.08;
        b.cardGroup.position.y = Math.sin(timeSeconds * 3.0) * (b.radius * 0.04);
      } else if (b.type !== 'coop_heart' && b.core) {
        b.core.rotation.x += dt * 1.2;
        b.core.rotation.y += dt * 1.8;
      }
      if(b.relocating){const fade=Math.max(0,1-b.relocationElapsed/.18);b.group.scale.multiplyScalar(.75+.25*fade);b.group.traverse(o=>{if(o.isMesh&&o.material.transparent)o.material.opacity*=fade;});}
    }

    // 2. 更新爆破粒子
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.mesh.rotation.z+=dt*5;
      p.mesh.position.addScaledVector(p.velocity, dt * 60);
      p.velocity.y -= 0.002 * dt * 60; // Same burst duration at different frame rates.
      p.life -= p.decay * dt * 60;
      p.mesh.material.opacity = Math.max(0, p.life);

      if (p.life <= 0) {
        this.scene.remove(p.mesh);
        p.mesh.geometry.dispose(); p.mesh.material.dispose();
        this.particles.splice(i, 1);
      }
    }

    // 3. 更新能量飞行光团 (沿贝塞尔平滑拱形弧线飞入小动物领结)
    for (let i = this.energyProjectiles.length - 1; i >= 0; i--) {
      const ep = this.energyProjectiles[i];
      ep.progress += dt * 2.5; // 约 400ms 飞入

      const p = Math.min(1.0, ep.progress);
      const current = new THREE.Vector3().lerpVectors(ep.start, ep.target, p);
      // 优雅拱形向上弧线
      current.y += Math.sin(p * Math.PI) * 0.6;
      ep.mesh.position.copy(current);

      if (ep.progress >= 1.0) {
        this.scene.remove(ep.mesh);
        this.energyProjectiles.splice(i, 1);
        ep.mesh.traverse(obj => { if (obj.isMesh) { obj.geometry.dispose(); obj.material.dispose(); } });
        ep.onArrive?.(ep.energyCount || 1);
      }
    }
  }

  // 重置与清理所有泡泡及粒子
  clear() {
    this.visualDemo.hide();
    this.roundSeenWords.clear();
    this.wordPool = [];
    this.wordQueue = [];
    this.lastWordId = null;
    this.roundEase = 0;
    this.comfortableHits = 0;
    this.completedBubbleCount = 0;
    this.layoutGraceSeconds = 0;
    this.resetCombo();
    this.pointerSimulation=false;
    for(const ring of this.popRings){this.scene.remove(ring.mesh);ring.mesh.geometry.dispose();ring.mesh.material.dispose();}this.popRings=[];
    this.handsAgeSeconds=Infinity;
    if (this.activeBubble) {
      this.disposeBubble(this.activeBubble.group);
      this.activeBubble = null;
    }
    if (this.spawnTimer) {
      clearTimeout(this.spawnTimer);
      this.spawnTimer = null;
    }
    this.isSpawning = false;
    this.idleTimer = 0;
    this.isEnlargedForHelp = false;
    this.isNearHand = false;
    this.proximityOffset.set(0, 0, 0);

    for (const p of this.particles) {
      this.scene.remove(p.mesh);
      p.mesh.geometry.dispose(); p.mesh.material.dispose();
    }
    this.particles = [];

    for (const ep of this.energyProjectiles) {
      this.scene.remove(ep.mesh);
      ep.mesh.traverse(obj => { if (obj.isMesh) { obj.geometry.dispose(); obj.material.dispose(); } });
    }
    this.energyProjectiles = [];

    for (const ind of this.handIndicators) {
      ind.group.visible = false;
      ind.active = false;
    }

    if (this.balloon && this.balloon.setBubbleTarget) {
      this.balloon.setBubbleTarget(null);
    }
  }

  resetCombo() {
    this.comboCount = 0;
    this.comboRemainingMs = 0;
    this.lastPopTime = 0;
    if (typeof this.onComboChange === "function") {
      this.onComboChange(0);
    }
  }

  getComboCount() {
    return this.comboCount;
  }
}
