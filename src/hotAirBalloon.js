import * as THREE from 'three';

/**
 * 3D 热气球与吊篮中的小动物（小熊 嘟嘟）
 * 1. 纯 Three.js 程序化高辨识度童趣小熊（独立控制头部旋转、眨眼、视线高光追踪、两只前爪与丰富表情）
 * 2. 5 档彩虹充能发光环，按 1~5 逐分响应动作（点头、抬爪、拍爪、期待抬头、大笑欢庆）
 * 3. 屏幕投影自适应外接矩形定位（横屏 0.74H、竖屏 0.81H），留白避让，草地不压吊篮
 * 4. 严格按照 DESIGN_SPEC_V0.3.md 第 5 分时序（400ms 期待停顿沉浮后平稳起飞升空，绝对不穿过顶部 HUD）
 */
export class HotAirBalloon {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    this.balloonMesh = null;
    this.basketMesh = null;
    this.balloonGroup = null;
    this.bearGroup = null;
    this.headGroup = null;
    this.bearArms = [];
    this.energyBands = [];
    this.ropes = [];

    this.modelScale = 0.42; // 默认缩放，根据视口动态自适应
    this.initialY = -2.2;
    this.maxClimbHeight = 2.2; // 起飞最大高度（根据 HUD 底边安全线动态计算）
    this.isTakingOff = false;
    this.takeoffElapsed = 0;
    this.energyLevel = 0;
    this.pendingEnergyLevel = 0;
    this.pendingEnergyTimer = 0;
    this.energyTimer = null;

    // 动作与视线追踪状态
    this.bubbleTargetPos = null;
    this.currentGazeYaw = 0;
    this.currentGazePitch = 0;
    this.targetGazeYaw = 0;
    this.targetGazePitch = 0;

    this.scoreActionTimer = 0;
    this.currentScoreAction = 0;
    this.blinkTimer = 0;
    this.isBlinking = false;

    this.createModel();
    this.scene.add(this.group);
    this.group.scale.set(this.modelScale, this.modelScale, this.modelScale);
    this.group.position.set(0, this.initialY, 0);
  }

  createModel() {
    // 1. 吊篮 (温暖的编织藤篮风格)
    const basketGeo = new THREE.CylinderGeometry(0.7, 0.55, 0.7, 16);
    const basketMat = new THREE.MeshStandardMaterial({
      color: 0xd38e47,
      roughness: 0.8,
      metalness: 0.1
    });
    this.basketMesh = new THREE.Mesh(basketGeo, basketMat);
    this.basketMesh.position.y = 0;
    this.basketMesh.castShadow = true;
    this.group.add(this.basketMesh);

    // 吊篮边缘白布/彩旗条饰
    const rimGeo = new THREE.TorusGeometry(0.72, 0.05, 8, 24);
    const rimMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
    const rim = new THREE.Mesh(rimGeo, rimMat);
    rim.rotation.x = Math.PI / 2;
    rim.position.y = 0.35;
    this.group.add(rim);

    // 2. 吊篮里的小动物（小熊 嘟嘟）
    this.bearGroup = new THREE.Group();
    this.bearGroup.position.set(0, 0.35, 0);

    // 独立可旋转头部组 (支持追随泡泡视线与点头/抬头动作)
    this.headGroup = new THREE.Group();
    this.headGroup.position.set(0, 0, 0);
    this.bearGroup.add(this.headGroup);

    // 熊头主体
    const headGeo = new THREE.SphereGeometry(0.48, 24, 24);
    const bearMat = new THREE.MeshStandardMaterial({
      color: 0x8d5524,
      roughness: 0.6
    });
    const head = new THREE.Mesh(headGeo, bearMat);
    this.headGroup.add(head);

    // 熊耳朵 (两只圆圆的小耳朵)
    const earGeo = new THREE.SphereGeometry(0.18, 16, 16);
    const earInnerMat = new THREE.MeshStandardMaterial({ color: 0xffb8b8 });
    const earInnerGeo = new THREE.SphereGeometry(0.11, 16, 16);

    const leftEar = new THREE.Mesh(earGeo, bearMat);
    leftEar.position.set(-0.38, 0.36, 0);
    const leftEarInner = new THREE.Mesh(earInnerGeo, earInnerMat);
    leftEarInner.position.set(-0.38, 0.36, 0.08);

    const rightEar = new THREE.Mesh(earGeo, bearMat);
    rightEar.position.set(0.38, 0.36, 0);
    const rightEarInner = new THREE.Mesh(earInnerGeo, earInnerMat);
    rightEarInner.position.set(0.38, 0.36, 0.08);

    this.headGroup.add(leftEar, leftEarInner, rightEar, rightEarInner);

    // 嘴鼻鼓包 (白色圆嘟嘟吻部)
    const snoutGeo = new THREE.SphereGeometry(0.22, 16, 16);
    const snoutMat = new THREE.MeshStandardMaterial({ color: 0xffeedb });
    this.bearSnout = new THREE.Mesh(snoutGeo, snoutMat);
    this.bearSnout.scale.set(1.1, 0.8, 1.0);
    this.bearSnout.position.set(0, -0.06, 0.35);
    this.headGroup.add(this.bearSnout);

    // 黑色小鼻子
    const noseGeo = new THREE.SphereGeometry(0.08, 12, 12);
    const noseMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.3 });
    const nose = new THREE.Mesh(noseGeo, noseMat);
    nose.position.set(0, -0.02, 0.54);
    this.headGroup.add(nose);

    // 嘴形 (可爱弧线/嘴角微笑)
    const mouthGeo = new THREE.TorusGeometry(0.06, 0.015, 8, 16, Math.PI);
    const mouthMat = new THREE.MeshBasicMaterial({ color: 0x3d1e08 });
    this.bearMouth = new THREE.Mesh(mouthGeo, mouthMat);
    this.bearMouth.position.set(0, -0.14, 0.52);
    this.bearMouth.rotation.z = Math.PI; // 弯曲向上的微笑弧线
    this.headGroup.add(this.bearMouth);

    // 闪亮眼睛 (黑色瞳孔 + 独立白色高光球，支持随视线偏移)
    const eyeGeo = new THREE.SphereGeometry(0.07, 12, 12);
    const eyeMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.1 });
    this.leftEye = new THREE.Mesh(eyeGeo, eyeMat);
    this.leftEye.position.set(-0.16, 0.08, 0.44);

    this.rightEye = new THREE.Mesh(eyeGeo, eyeMat);
    this.rightEye.position.set(0.16, 0.08, 0.44);

    const highlightGeo = new THREE.SphereGeometry(0.026, 8, 8);
    const highlightMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    this.leftHighlight = new THREE.Mesh(highlightGeo, highlightMat);
    this.leftHighlight.position.set(-0.14, 0.11, 0.50);
    this.baseLeftHL = this.leftHighlight.position.clone();

    this.rightHighlight = new THREE.Mesh(highlightGeo, highlightMat);
    this.rightHighlight.position.set(0.18, 0.11, 0.50);
    this.baseRightHL = this.rightHighlight.position.clone();

    this.headGroup.add(this.leftEye, this.rightEye, this.leftHighlight, this.rightHighlight);

    // 腮红 (萌萌粉嫩腮红)
    const blushGeo = new THREE.CircleGeometry(0.09, 16);
    const blushMat = new THREE.MeshBasicMaterial({ color: 0xff7675, transparent: true, opacity: 0.55 });
    const leftBlush = new THREE.Mesh(blushGeo, blushMat);
    leftBlush.position.set(-0.28, -0.08, 0.42);
    leftBlush.rotation.y = -0.3;
    const rightBlush = new THREE.Mesh(blushGeo, blushMat);
    rightBlush.position.set(0.28, -0.08, 0.42);
    rightBlush.rotation.y = 0.3;
    this.headGroup.add(leftBlush, rightBlush);

    // 熊爪子 (搭在吊篮前缘，支持抬起与轻拍)
    const pawGeo = new THREE.SphereGeometry(0.13, 12, 12);
    this.leftPaw = new THREE.Mesh(pawGeo, bearMat);
    this.leftPaw.position.set(-0.35, -0.15, 0.46);
    this.rightPaw = new THREE.Mesh(pawGeo, bearMat);
    this.rightPaw.position.set(0.35, -0.15, 0.46);

    this.baseLeftPawPos = this.leftPaw.position.clone();
    this.baseRightPawPos = this.rightPaw.position.clone();

    this.bearGroup.add(this.leftPaw, this.rightPaw);
    this.bearArms = [this.leftPaw, this.rightPaw];

    this.group.add(this.bearGroup);

    // 3. 连接绳索 (4 根缆绳)
    const ropeMat = new THREE.MeshBasicMaterial({ color: 0x8c7b64 });
    const ropeCoords = [
      [-0.45, 0.35, 0.45, -0.7, 1.8, 0.7],
      [0.45, 0.35, 0.45, 0.7, 1.8, 0.7],
      [-0.45, 0.35, -0.45, -0.7, 1.8, -0.7],
      [0.45, 0.35, -0.45, 0.7, 1.8, -0.7]
    ];
    ropeCoords.forEach(([x1, y1, z1, x2, y2, z2]) => {
      const curve = new THREE.LineCurve3(
        new THREE.Vector3(x1, y1, z1),
        new THREE.Vector3(x2, y2, z2)
      );
      const ropeGeo = new THREE.TubeGeometry(curve, 8, 0.02, 6, false);
      const rope = new THREE.Mesh(ropeGeo, ropeMat);
      this.group.add(rope);
      this.ropes.push(rope);
    });

    // 4. 热气球球体主体
    const balloonGroup = new THREE.Group();
    balloonGroup.position.set(0, 3.4, 0);

    // 主球体 (圆润上大下微收)
    const balloonGeo = new THREE.SphereGeometry(1.6, 32, 24);
    balloonGeo.scale(1.0, 1.25, 1.0);
    const baseBalloonMat = new THREE.MeshStandardMaterial({
      color: 0xfaf4e6,
      roughness: 0.4,
      metalness: 0.05
    });
    this.balloonMesh = new THREE.Mesh(balloonGeo, baseBalloonMat);
    balloonGroup.add(this.balloonMesh);

    // 5 段彩虹充能发光环 (垂直分段层)
    const rainbowColors = [0xff6b81, 0xffa502, 0x2ed573, 0x1e90ff, 0x9b59b6];
    const bandHeights = [-0.9, -0.45, 0.0, 0.45, 0.9];
    const bandRadii = [1.32, 1.55, 1.62, 1.55, 1.32];

    for (let i = 0; i < 5; i++) {
      const bandGeo = new THREE.TorusGeometry(bandRadii[i] + 0.02, 0.08, 12, 32);
      const bandMat = new THREE.MeshStandardMaterial({
        color: rainbowColors[i],
        emissive: rainbowColors[i],
        emissiveIntensity: 0.08, // 未充能时微弱，充能后大亮
        roughness: 0.3
      });
      const band = new THREE.Mesh(bandGeo, bandMat);
      band.rotation.x = Math.PI / 2;
      band.position.y = bandHeights[i];
      balloonGroup.add(band);
      this.energyBands.push({
        mesh: band,
        color: rainbowColors[i],
        lit: false
      });
    }

    this.group.add(balloonGroup);
    this.balloonGroup = balloonGroup;
  }

  // 针对视口自适应调整尺寸与中心锚点 (横屏 0.74H、竖屏 0.81H)
  updateLayout(winW, winH, camera) {
    if (!camera || !winW || !winH) return;

    const vFOV = THREE.MathUtils.degToRad(camera.fov || 48);
    const camZ = Math.abs(camera.position.z || 7.5);
    const visibleHeight = 2 * Math.tan(vFOV / 2) * camZ;
    const aspect = winW / winH;
    const isNarrow = aspect < 0.8;

    // 目标外接宽度 (CSS px 转换至 3D 世界坐标)
    const pxToWorld = visibleHeight / winH;
    const targetPxW = isNarrow ? Math.min(0.34 * winW, 150) : Math.min(0.27 * winW, 250);
    const targetWorldW = targetPxW * pxToWorld;

    // 模型未缩放宽度约为 3.2
    let scale = targetWorldW / 3.2;
    scale = THREE.MathUtils.clamp(scale, 0.28, 0.44);
    this.modelScale = scale;
    this.group.scale.set(scale, scale, scale);

    // 计算中心锚点: 横屏 0.74H, 竖屏 0.81H (屏幕从上到下)
    const anchorRatio = isNarrow ? 0.81 : 0.74;
    const targetNdcY = 1.0 - 2.0 * anchorRatio;
    const worldCenterY = targetNdcY * (visibleHeight / 2);

    // 模型中心相对 group 原点约为 local Y = 2.45
    this.initialY = worldCenterY - 2.45 * scale;

    // 底部留空至少 20px
    const basketBottomWorld = this.initialY - 0.35 * scale;
    const bottomLimitWorld = -visibleHeight / 2 + 20 * pxToWorld;
    if (basketBottomWorld < bottomLimitWorld) {
      this.initialY += (bottomLimitWorld - basketBottomWorld);
    }

    // 严密计算起飞最高允许高度，确保模型任何顶点距离屏幕顶部安全线 (>= 84px HUD) 留足余量
    const hudSafePx = 84 + 16; // 顶部 HUD 底界 (84px) + 16px 留白
    const hudSafeWorldY = (1.0 - 2.0 * (hudSafePx / winH)) * (visibleHeight / 2);
    // 气球模型在 group 坐标系下最高 local Y 为 3.4 (balloonGroup) + 2.0 (球囊顶) = 5.4
    const modelMaxLocalY = 5.4 * scale;
    // 起飞允许到达的最大 group.position.y:
    const maxGroupY = hudSafeWorldY - modelMaxLocalY;
    this.maxClimbHeight = Math.max(0.4, maxGroupY - this.initialY);

    if (!this.isTakingOff) {
      this.group.position.set(0, this.initialY, 0);
    }
  }

  // 设置追随的泡泡世界坐标 (无泡泡时传 null)
  setBubbleTarget(worldPos) {
    this.bubbleTargetPos = worldPos ? worldPos.clone() : null;
  }

  // 设置充能进度 (0 ~ 5) 与阶梯动作触发（由 update 帧更新驱动，暂停冻结避免抢跑）
  setEnergy(count, immediate = false) {
    const targetLevel = Math.max(0, Math.min(5, count));

    if (count === 0 || immediate) {
      this.pendingEnergyTimer = 0;
      this.pendingEnergyLevel = 0;
      this.energyLevel = 0;
      for (let i = 0; i < 5; i++) {
        this.energyBands[i].lit = false;
        this.energyBands[i].mesh.material.emissiveIntensity = 0.08;
      }
      this.currentScoreAction = 0;
      this.scoreActionTimer = 0;
      return;
    }

    // 能量未飞入前充能段保持暗亮，等待 480ms 能量飞入后再点亮
    const newBandIdx = targetLevel - 1;
    for (let i = 0; i < 5; i++) {
      if (i < targetLevel - 1) {
        this.energyBands[i].lit = true;
        this.energyBands[i].mesh.material.emissiveIntensity = 0.95;
      } else {
        this.energyBands[i].lit = false;
        this.energyBands[i].mesh.material.emissiveIntensity = 0.08;
      }
    }

    this.pendingEnergyLevel = targetLevel;
    this.pendingEnergyTimer = 0.48; // 由 update(dt) 倒计时，暂停时时间冻结
  }

  // 触发起飞动画
  startTakeoff() {
    this.isTakingOff = true;
    this.takeoffElapsed = 0;
  }

  // 重置回地面初始状态
  reset() {
    this.isTakingOff = false;
    this.takeoffElapsed = 0;
    this.group.position.set(0, this.initialY, 0);
    this.group.rotation.set(0, 0, 0);
    this.setEnergy(0, true);
    this.bubbleTargetPos = null;
    this.currentGazeYaw = 0;
    this.currentGazePitch = 0;
    this.targetGazeYaw = 0;
    this.targetGazePitch = 0;
    if (this.headGroup) this.headGroup.rotation.set(0, 0, 0);
    if (this.leftPaw) this.leftPaw.position.copy(this.baseLeftPawPos);
    if (this.rightPaw) this.rightPaw.position.copy(this.baseRightPawPos);
    if (this.balloonGroup) this.balloonGroup.scale.set(1, 1, 1);
  }

  // 帧更新 (视线追踪 / 表情与爪子 / 起飞时序)
  update(deltaSeconds, timeSeconds) {
    const dt = Math.min(deltaSeconds, 0.06);

    // 能量飞入充能点亮（帧计时器，暂停时不执行因此不会抢跑点亮）
    if (this.pendingEnergyTimer > 0) {
      this.pendingEnergyTimer -= dt;
      if (this.pendingEnergyTimer <= 0) {
        this.pendingEnergyTimer = 0;
        const newBandIdx = this.pendingEnergyLevel - 1;
        this.energyLevel = this.pendingEnergyLevel;
        if (this.energyBands[newBandIdx]) {
          this.energyBands[newBandIdx].lit = true;
          this.energyBands[newBandIdx].mesh.material.emissiveIntensity = 0.95;
        }
        this.currentScoreAction = this.pendingEnergyLevel;
        this.scoreActionTimer = 0;
      }
    }

    // 1. 泡泡视线追踪 (头部水平 <= 12°、垂直 <= 8°，高光微移 <= 3px，无泡泡 250ms 回正)
    if (this.bubbleTargetPos && !this.isTakingOff) {
      const headWorldPos = new THREE.Vector3();
      this.headGroup.getWorldPosition(headWorldPos);
      const dx = this.bubbleTargetPos.x - headWorldPos.x;
      const dy = this.bubbleTargetPos.y - headWorldPos.y;

      // 视线偏转目标角 (限制在 12° 与 8° 内)
      const maxYaw = THREE.MathUtils.degToRad(12);
      const maxPitch = THREE.MathUtils.degToRad(8);

      this.targetGazeYaw = THREE.MathUtils.clamp(dx * 0.15, -maxYaw, maxYaw);
      this.targetGazePitch = THREE.MathUtils.clamp(-dy * 0.12, -maxPitch, maxPitch);
    } else if (this.isTakingOff) {
      // 起飞时向上期待看天
      this.targetGazeYaw = 0;
      this.targetGazePitch = THREE.MathUtils.degToRad(-10);
    } else {
      this.targetGazeYaw = 0;
      this.targetGazePitch = 0;
    }

    // 250ms 平滑缓动
    const gazeLerp = Math.min(1.0, dt * 5.0);
    this.currentGazeYaw = THREE.MathUtils.lerp(this.currentGazeYaw, this.targetGazeYaw, gazeLerp);
    this.currentGazePitch = THREE.MathUtils.lerp(this.currentGazePitch, this.targetGazePitch, gazeLerp);

    if (this.headGroup) {
      this.headGroup.rotation.y = this.currentGazeYaw;
      this.headGroup.rotation.x = this.currentGazePitch;
    }

    // 眼睛高光微小位移 (跟随视线方向微移)
    if (this.leftHighlight && this.rightHighlight) {
      const hlOffsetX = (this.currentGazeYaw / THREE.MathUtils.degToRad(12)) * 0.015;
      const hlOffsetY = (-this.currentGazePitch / THREE.MathUtils.degToRad(8)) * 0.012;
      this.leftHighlight.position.set(
        this.baseLeftHL.x + hlOffsetX,
        this.baseLeftHL.y + hlOffsetY,
        this.baseLeftHL.z
      );
      this.rightHighlight.position.set(
        this.baseRightHL.x + hlOffsetX,
        this.baseRightHL.y + hlOffsetY,
        this.baseRightHL.z
      );
    }

    // 2. 眨眼系统 (每 3~5 秒眨一次，眨眼耗时 120ms)
    this.blinkTimer += dt;
    if (this.blinkTimer > 3.6) {
      this.isBlinking = true;
      if (this.leftEye && this.rightEye) {
        this.leftEye.scale.y = 0.15;
        this.rightEye.scale.y = 0.15;
      }
      if (this.blinkTimer > 3.75) {
        this.isBlinking = false;
        this.blinkTimer = 0;
        if (this.leftEye && this.rightEye) {
          this.leftEye.scale.y = 1.0;
          this.rightEye.scale.y = 1.0;
        }
      }
    }

    // 3. 1~5 阶动作响应
    this.scoreActionTimer += dt;
    if (this.currentScoreAction > 0 && this.scoreActionTimer < 1.2) {
      const actionT = this.scoreActionTimer;
      switch (this.currentScoreAction) {
        case 1:
          // 点头一次 (俯仰 8°，嘴角上扬)
          if (this.headGroup) {
            this.headGroup.rotation.x += Math.sin(actionT * Math.PI * 3) * THREE.MathUtils.degToRad(8) * Math.max(0, 1 - actionT);
          }
          if (this.balloonGroup) {
            this.balloonGroup.scale.setScalar(1.0 + Math.sin(actionT * Math.PI) * 0.02);
          }
          break;
        case 2:
          // 左右小爪各抬一次 (幅度 12°)
          if (this.leftPaw && this.rightPaw) {
            this.leftPaw.position.y = this.baseLeftPawPos.y + Math.max(0, Math.sin(actionT * 8)) * 0.08;
            this.rightPaw.position.y = this.baseRightPawPos.y + Math.max(0, Math.sin(actionT * 8 + Math.PI)) * 0.08;
          }
          this.group.rotation.z = Math.sin(actionT * 6) * THREE.MathUtils.degToRad(2) * Math.max(0, 1 - actionT);
          break;
        case 3:
          // 张口笑、双爪轻拍一次
          if (this.leftPaw && this.rightPaw) {
            const clap = Math.sin(actionT * 12) * 0.06;
            this.leftPaw.position.x = this.baseLeftPawPos.x + clap;
            this.rightPaw.position.x = this.baseRightPawPos.x - clap;
          }
          if (this.balloonGroup) {
            this.balloonGroup.scale.setScalar(1.0 + Math.sin(actionT * Math.PI) * 0.04);
          }
          break;
        case 4:
          // 期待抬头，双爪抬起，吊篮微晃
          if (this.headGroup) {
            this.headGroup.rotation.x = THREE.MathUtils.degToRad(-12) * Math.max(0, 1 - actionT);
          }
          if (this.leftPaw && this.rightPaw) {
            this.leftPaw.position.y = this.baseLeftPawPos.y + 0.10 * Math.max(0, 1 - actionT);
            this.rightPaw.position.y = this.baseRightPawPos.y + 0.10 * Math.max(0, 1 - actionT);
          }
          if (this.balloonGroup) {
            this.balloonGroup.scale.setScalar(1.0 + Math.sin(actionT * Math.PI) * 0.06);
          }
          this.group.rotation.z = Math.sin(actionT * 5) * THREE.MathUtils.degToRad(3) * Math.max(0, 1 - actionT);
          break;
      }
    }

    // 4. 起飞状态 Timeline (v0.3 时序规格)
    if (this.isTakingOff) {
      this.takeoffElapsed += dt;
      const tMs = this.takeoffElapsed * 1000;

      // 双手欢快持续挥动
      if (this.bearArms[0] && this.bearArms[1]) {
        this.bearArms[0].position.y = this.baseLeftPawPos.y + Math.sin(timeSeconds * 12) * 0.18;
        this.bearArms[1].position.y = this.baseRightPawPos.y + Math.cos(timeSeconds * 12) * 0.18;
      }

      if (tMs < 850) {
        // 0~850ms: 小熊抬头并挥爪，气球在地面准备
        this.group.position.y = this.initialY;
      } else if (tMs < 1250) {
        // 850~1250ms (停顿 400ms): 气球轻微鼓起并短促下沉 <= 6px (~0.04 units)
        const pauseT = (tMs - 850) / 400;
        const dip = Math.sin(pauseT * Math.PI) * 0.04;
        this.group.position.y = this.initialY - dip;
        if (this.balloonGroup) {
          this.balloonGroup.scale.setScalar(1.0 + Math.sin(pauseT * Math.PI) * 0.03);
        }
      } else if (tMs < 4200) {
        // 1250~4200ms: 升空 (前 600ms 缓入，气球始终不穿过顶部 HUD)
        const climbT = Math.min(1.0, (tMs - 1250) / 2950);
        // 缓入缓出平滑曲线
        const smoothClimb = climbT * climbT * (3 - 2 * climbT);
        const maxClimb = (typeof this.maxClimbHeight === 'number') ? this.maxClimbHeight : 2.2;
        this.group.position.y = this.initialY + smoothClimb * maxClimb;
        this.group.rotation.z = Math.sin(timeSeconds * 4) * 0.03;
      } else {
        // 4200~5000ms: 保持在空中平稳浮动庆祝 (顶点严格限制在 HUD 安全线下方)
        const maxClimb = (typeof this.maxClimbHeight === 'number') ? this.maxClimbHeight : 2.2;
        this.group.position.y = this.initialY + maxClimb + Math.sin(timeSeconds * 2) * 0.02;
        this.group.rotation.z = Math.sin(timeSeconds * 3) * 0.02;
      }
    } else {
      // 地面待机状态：柔和自然的呼吸沉浮与充能微膨
      const hover = Math.sin(timeSeconds * 1.8) * 0.06;
      this.group.position.y = this.initialY + hover;
      this.group.rotation.z = Math.sin(timeSeconds * 1.1) * 0.015;

      // 充能呼吸轻颤
      if (this.balloonMesh && this.balloonGroup) {
        const pulse = 1.0 + Math.sin(timeSeconds * 2.5) * 0.015 * (this.energyLevel + 1);
        this.balloonGroup.scale.set(pulse, pulse, pulse);
      }
    }
  }
}
