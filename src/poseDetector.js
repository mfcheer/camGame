import {getViewport} from './viewport.js';
import {assetUrl} from './assetUrl.js';
import { FilesetResolver, PoseLandmarker, HandLandmarker } from '@mediapipe/tasks-vision';
import { GAME_CONFIG } from './config.js';
import { HandAssociator, mapVideoPoint } from './handTracking.js';

/**
 * Local body ownership + dedicated 21-point hand tracking.
 * Browser runtime uses Hand Landmarker #8; Pose #19/#20 remain only as legacy
 * direct-input compatibility before an engine is initialized, never as the
 * precise runtime fallback. Pixel-space One Euro filtering balances jitter and
 * motion lag; image inference runs in a one-frame-at-a-time worker when supported.
 */

/**
 * One-Euro 动态自适应滤波器 (1D)
 * 静止微动时 cutoff 降低至 ~1.0Hz 滤除抖动；快速移动时动态提升跟踪频率，降低快速移动时的滤波延迟
 */
export class OneEuroFilter1D {
  constructor(minCutoff = 1.0, beta = 0.007, dCutoff = 1.0, jumpThreshold = 0.35) {
    this.jumpThreshold = jumpThreshold;
    this.rawPrev = null;
    this.minCutoff = minCutoff;
    this.beta = beta;
    this.dCutoff = dCutoff;
    this.xPrev = null;
    this.dxPrev = 0;
    this.tPrev = null;
  }

  alpha(cutoff, dt) {
    const tau = 1.0 / (2 * Math.PI * cutoff);
    return 1.0 / (1.0 + tau / dt);
  }

  filter(x, t) {
    if (this.xPrev === null || this.tPrev === null) {
      this.xPrev = x;
      this.rawPrev = x;
      this.tPrev = t;
      this.dxPrev = 0;
      return x;
    }

    const dt = Math.max(1e-4, (t - this.tPrev) / 1000);
    this.tPrev = t;

    // 目标丢失超过 250ms 或单帧位移过大 (>35% 屏宽) 时立即重置，在新位置重新捕获，避免跨屏瞬移拉丝
    if (dt > 0.25 || Math.abs(x - this.xPrev) > this.jumpThreshold) {
      this.xPrev = x;
      this.rawPrev = x;
      this.dxPrev = 0;
      return x;
    }

    const dx = (x - this.rawPrev) / dt;
    this.rawPrev = x;
    const aD = this.alpha(this.dCutoff, dt);
    const edx = aD * dx + (1 - aD) * this.dxPrev;
    this.dxPrev = edx;

    const cutoff = this.minCutoff + this.beta * Math.abs(edx);
    const a = this.alpha(cutoff, dt);
    const xFiltered = a * x + (1 - a) * this.xPrev;
    this.xPrev = xFiltered;
    return xFiltered;
  }

  reset() {
    this.xPrev = null;
    this.tPrev = null;
    this.dxPrev = 0;
  }
}

export class HandPositionFilter {
  constructor(minCutoff = 1.2, beta = 0.015, dCutoff = 1.0, jumpThreshold = 0.35) {
    this.filterX = new OneEuroFilter1D(minCutoff, beta, dCutoff, jumpThreshold);
    this.filterY = new OneEuroFilter1D(minCutoff, beta, dCutoff, jumpThreshold);
  }

  filter(x, y, timestamp) {
    const t = typeof timestamp === "number" ? timestamp : (typeof performance !== "undefined" ? performance.now() : Date.now());
    return {
      x: this.filterX.filter(x, t),
      y: this.filterY.filter(y, t)
    };
  }

  reset() {
    this.filterX.reset();
    this.filterY.reset();
  }
}

export class PoseDetector {
  constructor(videoElement, options = {}) {
    this.video = videoElement;
    this.options = { ...GAME_CONFIG.vision, ...options };
    this.poseLandmarker = null;
    this.stream = null;
    this.isRunning = false;
    this.lastVideoTime = -1;
    this.isDemoMode = false; // 鼠标/触摸模拟模式（明确标注，与真实识别隔离）

    this.onResultsCallback = null;
    this.onErrorCallback = null;
    this.onStatusChangeCallback = null;

    this.status = 'uninitialized'; // 'loading' | 'ready' | 'running' | 'paused' | 'error' | 'stopped'
    this.playerMode = 'single'; // 'single' | 'coop'
    this.trackedPlayers = [];
    this.lockedPlayers = null; // 本轮锁定的玩家信息
    this.cameraRequestId = 0; // 异步摄像头请求轮次 ID，用于作废晚到的 getUserMedia 结果
    this.handAssociator = new HandAssociator();
    this.useDedicatedHands = false;
    this.handLandmarker = null;
    this.worker = null; this.workerBusy = false; this.trackingSession = 0;
    this.lastInferenceAt = -Infinity; this.lastBodyAt = -Infinity;
    this.metrics = { backend:'uninitialized', inferenceMs:0, resultAgeMs:0, frames:0 };
    this.handFilters = new Map(); // 手部 One-Euro 平滑滤波实例表
  }

  setStatus(newStatus, detail = null) {
    this.status = newStatus;
    if (this.onStatusChangeCallback) {
      this.onStatusChangeCallback(newStatus, detail);
    }
  }

  setPlayerMode(mode) {
    this.playerMode = mode;
    this.handLandmarker?.setOptions({numHands:mode==='coop'?4:2});
  }

  // 锁定本轮参与玩家与已校准的舒适范围
  lockPlayers(players, mode = 'single') {
    if (!players || players.length === 0) return;
    this.playerMode = mode;
    this.lockedPlayers = players.map((p, idx) => ({
      id: p.id || (idx + 1),
      centerX: p.centerX,
      comfortZone: p.comfortZone ? { ...p.comfortZone } : {
        minX: Math.max(0.08, p.centerX - 0.28),
        maxX: Math.min(0.92, p.centerX + 0.28),
        minY: 0.2,
        maxY: 0.75
      }
    }));
  }

  // 解除玩家锁定（重新校准或退出时）
  unlockPlayers() {
    this.lockedPlayers = null;
    if (this.handFilters) this.handFilters.clear();
  }

  // 校验当前画面中的玩家就绪状态及有效手部可见度
  getCalibrationStatus(mode) {
    const required = mode === 'coop' ? 2 : 1;
    const currentCount = this.trackedPlayers ? this.trackedPlayers.length : 0;

    if (currentCount < required) {
      return {
        ready: false,
        playerCount: currentCount,
        requiredCount: required,
        message: mode === 'coop'
          ? `亲子双人需要两位玩家同框哦 (当前 ${currentCount}/2)`
          : '请站在摄像头前让画面看到身体和小手哦',
        players: []
      };
    }

    // 严谨校验：所有玩家必须至少检测到有效可见的小手/食指尖，低可见度/无手姿态不可就绪
    const playersWithHands = this.trackedPlayers.filter(p => p.hands && p.hands.length > 0);
    if (playersWithHands.length < required) {
      return {
        ready: false,
        playerCount: playersWithHands.length,
        requiredCount: required,
        message: '请伸出小手让画面看到身体与小手哦',
        players: []
      };
    }

    // 检查伸手姿态：在单人/双人校准时，手与身体中心重叠（未伸出小手）不可就绪
    const playersWithReach = this.trackedPlayers.filter(p => p.hasReached !== false);
    if (playersWithReach.length < required) {
      return {
        ready: false,
        playerCount: playersWithReach.length,
        requiredCount: required,
        message: '请将小手向外伸展，采集伸手范围哦',
        players: []
      };
    }

    // 双人模式下检查两名玩家的横向间距，避免同一个人被识别为两个重影
    if (mode === 'coop' && this.trackedPlayers.length >= 2) {
      const p1 = this.trackedPlayers[0];
      const p2 = this.trackedPlayers[1];
      const distance = Math.abs(p1.centerX - p2.centerX);
      if (distance < 0.16) {
        return {
          ready: false,
          playerCount: 1,
          requiredCount: 2,
          message: '两位玩家请稍微分开一点点站立哦',
          players: []
        };
      }
    }

    return {
      ready: true,
      playerCount: currentCount,
      requiredCount: required,
      message: '准备好啦，出发！✨',
      players: this.trackedPlayers
    };
  }

  // 获取当前追踪人数
  getTrackedPlayersCount() {
    return this.trackedPlayers ? this.trackedPlayers.length : 0;
  }

  // 初始化 MediaPipe PoseLandmarker (支持多级回退，失败后重新 init 可重入)
  async init() {
    if (this.workerInitialization) {
      try { await this.workerInitialization; this.useDedicatedHands=true;this.setStatus('ready');return true; } catch {}
    }
    if ((this.worker && this.metrics.backend.startsWith('worker-')) || (this.poseLandmarker && this.handLandmarker)) { this.setStatus('ready'); return true; }
    this.setStatus('loading', '正在加载姿态识别引擎...');
    try {
      if (typeof Worker !== 'undefined' && typeof createImageBitmap === 'function') {
        try {
          this.workerInitialization=this.initWorker();
          await this.workerInitialization;
          this.workerInitialization=null;
          this.useDedicatedHands = true;
          this.setStatus('ready','指尖识别准备就绪');
          return true;
        } catch(error) { this.workerInitialization=null; console.warn('Tracking worker unavailable; using local main-thread fallback.',error.message); }
      }
      // 优先从本地 /wasm 与模型加载，保障离线与隐私
      const vision = await FilesetResolver.forVisionTasks(this.options.wasmLoaderPath);

      this.poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: this.options.modelAssetPath,
          delegate: 'GPU' // MediaPipe WebGL delegate
        },
        runningMode: 'VIDEO',
        numPoses: this.options.maxNumPoses,
        minPoseDetectionConfidence: this.options.minPoseDetectionConfidence,
        minPosePresenceConfidence: this.options.minPosePresenceConfidence,
        minTrackingConfidence: this.options.minTrackingConfidence
      });

      await this.initHands(vision,'GPU');
      this.metrics.backend='main-GPU';
      this.setStatus('ready', '指尖识别准备就绪');
      return true;
    } catch (err) {
      this.poseLandmarker?.close();this.poseLandmarker=null;this.handLandmarker?.close();this.handLandmarker=null;
      console.warn('GPU 模式加载失败，尝试 CPU 模式回退...', err);
      try {
        const vision = await FilesetResolver.forVisionTasks(this.options.wasmLoaderPath);
        this.poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: this.options.modelAssetPath,
            delegate: 'CPU'
          },
          runningMode: 'VIDEO',
          numPoses: this.options.maxNumPoses,
          minPoseDetectionConfidence: this.options.minPoseDetectionConfidence,
          minPosePresenceConfidence: this.options.minPosePresenceConfidence,
          minTrackingConfidence: this.options.minTrackingConfidence
        });
        await this.initHands(vision,'CPU');
        this.metrics.backend='main-CPU';
        this.setStatus('ready', '指尖识别准备就绪 (CPU)');
        return true;
      } catch (fallbackErr) {
        this.poseLandmarker?.close();this.poseLandmarker=null;this.handLandmarker?.close();this.handLandmarker=null;
        console.error('姿态识别模型加载失败:', fallbackErr);
        this.setStatus('error', {
          type: 'model_load_failed',
          message: '姿态模型加载失败，请检查网络或本地模型文件'
        });
        if (this.onErrorCallback) this.onErrorCallback(fallbackErr);
        return false;
      }
    }
  }

  async initHands(vision, delegate) {
    this.handLandmarker = await HandLandmarker.createFromOptions(vision, {
      baseOptions:{modelAssetPath:assetUrl('models/hand_landmarker.task'),delegate},runningMode:'VIDEO',
      numHands:this.playerMode==='coop'?4:2,minHandDetectionConfidence:.5,minHandPresenceConfidence:.5,minTrackingConfidence:.5
    });
    this.useDedicatedHands = true;
  }

  initWorker() {
    return new Promise((resolve,reject)=>{
      const worker=new Worker(assetUrl('tracking-worker.js'));this.worker=worker;
      let initialized=false,frameErrors=0;
      const timeout=setTimeout(()=>fail(new Error('Tracking engine timed out')),20000);
      const fail=error=>{
        clearTimeout(timeout);worker.terminate();if(this.worker===worker)this.worker=null;this.workerBusy=false;
        if(initialized){this.stop();this.metrics.backend='error';this.setStatus('error',{type:'tracking_failed',message:'指尖识别暂时中断，请重新连接摄像头'});this.onErrorCallback?.(new Error('指尖识别暂时中断，请重新连接摄像头'));}
        else reject(error);
      };
      worker.onerror=event=>fail(new Error(event.message||'Worker error'));
      worker.onmessage=({data})=>{
        if(data.type==='ready'){initialized=true;clearTimeout(timeout);this.metrics.backend=`worker-${data.delegate}`;resolve();}
        else if(data.type==='error')fail(new Error(data.message));
        else if(data.type==='result') {
          this.workerBusy=false;
          if(data.session!==this.trackingSession||!this.isRunning||this.isDemoMode)return;
          frameErrors=0;this.lastWorkerPose=data.pose;
          this.metrics.inferenceMs=data.inferenceMs;this.metrics.resultAgeMs=performance.now()-data.timestamp;
          this.metrics.frames++;
          // A late inference may fade the old marker, but cannot hit a new bubble.
          if(this.metrics.resultAgeMs>180)this.processLandmarks(data.pose,{landmarks:[]},data.timestamp);
          else this.processLandmarks(data.pose,data.hands,data.timestamp);
        }else if(data.type==='frame-error'){
          this.workerBusy=false;
          if(data.session!==this.trackingSession||!this.isRunning)return;
          this.processLandmarks(this.lastWorkerPose||{landmarks:[]},{landmarks:[]},performance.now());
          if(++frameErrors>=3)fail(new Error(data.message));
        }
      };
      worker.postMessage({type:'init'});
    });
  }

  // 启动真实摄像头（带有 request 取消令牌保护，退出后晚到的请求不可绑定并立即停止）
  async startCamera(constraints = { video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } } }) {
    const reqId = ++this.cameraRequestId;

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      const err = new Error('当前浏览器不支持访问摄像头，请在安全上下文 (HTTPS 或 localhost) 下打开');
      this.setStatus('error', { type: 'unsupported', message: err.message });
      if (this.onErrorCallback) this.onErrorCallback(err);
      return false;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia(constraints);

      // 若在异步等待期间调用了 stop() 或发起了新请求，立即销毁晚到的 stream，不可绑定
      if (this.cameraRequestId !== reqId) {
        if (stream && stream.getTracks) {
          stream.getTracks().forEach((track) => {
            try { track.stop(); } catch (e) {}
          });
        }
        return false;
      }

      this.stream = stream;
      if (this.video) {
        try {
          this.video.setAttribute("playsinline", "");
          this.video.setAttribute("webkit-playsinline", "");
          this.video.setAttribute("x5-playsinline", "");
          this.video.playsInline = true;
          this.video.muted = true;
          this.video.defaultMuted = true;
        } catch (_) {}
        this.video.srcObject = this.stream;
      }

      await new Promise((resolve) => {
        if (this.cameraRequestId !== reqId) {
          resolve();
          return;
        }
        if (!this.video) {
          resolve();
          return;
        }
        let resolved = false;
        const tryPlayAndResolve = () => {
          if (resolved) return;
          resolved = true;
          if (this.cameraRequestId === reqId && this.video) {
            try {
              const p = this.video.play();
              if (p && typeof p.catch === "function") p.catch(() => {});
            } catch (_) {}
          }
          resolve();
        };

        this.video.onloadedmetadata = () => {
          tryPlayAndResolve();
        };

        if (this.video.readyState >= 1) {
          tryPlayAndResolve();
        }
      });

      if (this.cameraRequestId !== reqId) {
        if (stream && stream.getTracks) {
          stream.getTracks().forEach((track) => {
            try { track.stop(); } catch (e) {}
          });
        }
        if (this.stream === stream) {
          this.stream = null;
        }
        if (this.video && this.video.srcObject === stream) {
          this.video.srcObject = null;
        }
        return false;
      }

      this.isDemoMode = false;
      this.isRunning = true;
      this.setStatus('running', '摄像头已开启');
      this.detectLoop();
      return true;
    } catch (err) {
      if (this.cameraRequestId !== reqId) return false;

      console.error('摄像头开启失败:', err);
      let errorType = 'camera_denied';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        errorType = 'permission_denied';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        errorType = 'no_camera';
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        errorType = 'camera_in_use';
      }

      this.setStatus('error', {
        type: errorType,
        message: err.message || '无法访问摄像头，请检查权限设置'
      });
      if (this.onErrorCallback) this.onErrorCallback(err);
      return false;
    }
  }

  // One frame in flight: no inference queue, no backlog of stale hand points.
  detectLoop() {
    if(!this.isRunning||this.isDemoMode)return;
    const now=performance.now();
    const interval=this.metrics.inferenceMs>45?50:33;
    if(this.video?.readyState>=2 && this.video.currentTime!==this.lastVideoTime && now-this.lastInferenceAt>=interval) {
      if(this.worker&&!this.workerBusy) {
        this.workerBusy=true;this.lastVideoTime=this.video.currentTime;this.lastInferenceAt=now;
        const session=this.trackingSession;
        const scale=Math.min(1,960/(this.video.videoWidth||1280));
        createImageBitmap(this.video,{resizeWidth:Math.round((this.video.videoWidth||1280)*scale),resizeHeight:Math.round((this.video.videoHeight||720)*scale)}).then(bitmap=>{
          if(!this.isRunning||session!==this.trackingSession){bitmap.close();this.workerBusy=false;return;}
          this.worker.postMessage({type:'frame',bitmap,timestamp:now,session,mode:this.playerMode},[bitmap]);
        }).catch(()=>{this.workerBusy=false;});
      }else if(!this.worker&&this.poseLandmarker) {
        this.lastVideoTime=this.video.currentTime;this.lastInferenceAt=now;
        try {
          const hands=this.handLandmarker?.detectForVideo(this.video,now);
          if(now-this.lastBodyAt>=120||!this.cachedPose){this.cachedPose=this.poseLandmarker.detectForVideo(this.video,now);this.lastBodyAt=now;}
          this.metrics.inferenceMs=performance.now()-now;this.metrics.frames++;
          this.processLandmarks(this.cachedPose,hands,now);
        }catch(error){console.warn('Tracking frame failed:',error.message);}
      }
    }
    this.detectionFrame=requestAnimationFrame(()=>this.detectLoop());
  }

  // 处理提取玩家的手部坐标（转换为镜像并在 cover 裁剪下与视口准确对齐）
  processLandmarks(results, handResults, timestamp) {
    if (!results || !results.landmarks || results.landmarks.length === 0) {
      this.trackedPlayers = [];
      if (this.onResultsCallback) {
        this.onResultsCallback({ players: [], raw: results });
      }
      return;
    }

    const videoW = this.video?.videoWidth || 0;
    const videoH = this.video?.videoHeight || 0;
    const winW = (typeof window !== 'undefined' ? getViewport().width : 1280) || 1280;
    const winH = (typeof window !== 'undefined' ? getViewport().height : 720) || 720;

    const viewportKey=`${winW}x${winH}`;
    if(this.filterViewport!==viewportKey){this.handFilters.clear();this.handAssociator.reset();this.filterViewport=viewportKey;}

    // 严密适配 object-fit: cover 的坐标映射函数
    const mapToCoverScreen = (mirroredX, rawY) => {
      if (!videoW || !videoH) {
        return { x: mirroredX, y: rawY };
      }
      const scale = Math.max(winW / videoW, winH / videoH);
      const scaledW = videoW * scale;
      const scaledH = videoH * scale;

      const pxX = mirroredX * scaledW - (scaledW - winW) / 2;
      const pxY = rawY * scaledH - (scaledH - winH) / 2;

      return {
        x: pxX / winW,
        y: pxY / winH
      };
    };

    // 提取所有检测到的候选人姿态
    const candidates = results.landmarks.map((landmarks, index) => {
      const lw = landmarks[15]; // 左手腕
      const rw = landmarks[16]; // 右手腕
      const li = landmarks[19]; // 左食指
      const ri = landmarks[20]; // 右食指
      const ls = landmarks[11]; // 左肩
      const rs = landmarks[12]; // 右肩

      // 玩家身体中心 x 坐标与肩膀 y
      let centerX = 0.5;
      let shoulderY = 0.4;
      let reachSpan = 0.25;

      if (ls && rs) {
        const mirroredCenter = 1.0 - (ls.x + rs.x) / 2;
        const mappedCenter = mapToCoverScreen(mirroredCenter, (ls.y + rs.y) / 2);
        centerX = mappedCenter.x;
        shoulderY = mappedCenter.y;
        reachSpan = Math.max(0.18, Math.abs(ls.x - rs.x) * 1.6);
      }

      // 计算该玩家的舒适伸手矩形（归一化屏幕空间 0~1）
      const comfortZone = {
        minX: Math.max(0.06, centerX - reachSpan),
        maxX: Math.min(0.94, centerX + reachSpan),
        minY: Math.max(0.12, shoulderY - reachSpan * 0.9),
        maxY: Math.min(0.85, shoulderY + reachSpan * 0.6)
      };

      const hands = [];
      const wrists = [];
      let face=null;
      const e1=landmarks[2],e2=landmarks[5],nose=landmarks[0];
      if(e1&&e2&&nose&&(nose.visibility??1)>.45&&(e1.visibility??1)>.4&&(e2.visibility??1)>.4) {
        const eyes=[mapToCoverScreen(1-e1.x,e1.y),mapToCoverScreen(1-e2.x,e2.y)].sort((a,b)=>a.x-b.x);
        const ears=[landmarks[7],landmarks[8]];
        const eyeWidth=Math.abs(eyes[1].x-eyes[0].x);
        const earWidth=ears.every(e=>e&&(e.visibility??1)>.4)?Math.abs(ears[0].x-ears[1].x)*(videoW?Math.max(winW/videoW,winH/videoH)*videoW/winW:1):0;
        const width=Math.max(.055,Math.min(.32,Math.max(earWidth,eyeWidth*2.5)));
        const cx=(eyes[0].x+eyes[1].x)/2,cy=(eyes[0].y+eyes[1].y)/2;
        if(eyeWidth>.008&&cx>0&&cx<1&&cy>0&&cy<1)face={x:cx,y:cy-width*winW/winH*.60,width,eyeY:cy,roll:Math.max(-.5,Math.min(.5,Math.atan2((eyes[1].y-eyes[0].y)*winH,(eyes[1].x-eyes[0].x)*winW)))};
      }

      // 记录手腕在场信息（用于判断身体是否在场）
      if (lw && (lw.visibility === undefined || lw.visibility > 0.35)) {
        const mirroredW = 1.0 - lw.x;
        const mappedW = mapToCoverScreen(mirroredW, lw.y);
        wrists.push({ side: 'left', x: mappedW.x, y: mappedW.y });
      }
      if (rw && (rw.visibility === undefined || rw.visibility > 0.35)) {
        const mirroredW = 1.0 - rw.x;
        const mappedW = mapToCoverScreen(mirroredW, rw.y);
        wrists.push({ side: 'right', x: mappedW.x, y: mappedW.y });
      }

      // Legacy direct Pose input only. Browser init enables useDedicatedHands,
      // replacing these coarse index proxies with Hand Landmarker #8 below.
      // Wrists are for ownership/presence and never become collision anchors.
      const leftIndexValid = Boolean(li && (li.visibility === undefined || li.visibility > 0.35));
      if (leftIndexValid) {
        const mirroredX = 1.0 - li.x;
        const mapped = mapToCoverScreen(mirroredX, li.y);
        hands.push({
          side: 'left',
          x: mapped.x,
          y: mapped.y,
          z: li.z || 0,
          rawVisibility: li.visibility,
          isIndexTip: true
        });
      }

      const rightIndexValid = Boolean(ri && (ri.visibility === undefined || ri.visibility > 0.35));
      if (rightIndexValid) {
        const mirroredX = 1.0 - ri.x;
        const mapped = mapToCoverScreen(mirroredX, ri.y);
        hands.push({
          side: 'right',
          x: mapped.x,
          y: mapped.y,
          z: ri.z || 0,
          rawVisibility: ri.visibility,
          isIndexTip: true
        });
      }

      // 检查是否伸展出手臂 (肩部有清晰宽度但手位于身体中心视为未伸手)
      let hasReached = true;
      if (ls && rs && Math.abs(ls.x - rs.x) > 0.03) {
        hasReached = hands.some(h => Math.hypot(h.x - centerX, h.y - shoulderY) > 0.05);
      }

      const hasBodyPresence = Boolean((ls && rs) || wrists.length > 0 || hands.length > 0);

      return {
        rawIndex: index,face,
        centerX,
        shoulderY,
        comfortZone,
        hands,
        wrists,
        hasReached,
        hasBodyPresence
      };
    });

    // 玩家匹配与防旁观者容差管理
    if (this.lockedPlayers && this.lockedPlayers.length > 0) {
      const isCoop = this.playerMode === 'coop' || this.lockedPlayers.length === 2;

      if (!isCoop) {
        // === 单人模式：支持无缝平滑换人 + 自动过滤周围旁观者 ===
        // 1. 如果画面中只有 1 个候选人，无论是原玩家还是新走上来的玩家，直接平滑接替追踪
        // 2. 如果画面中有多个人（如旁观者在侧边、或者有人从旁边路过），按权重筛选核心主玩家：
        //    优先选择有小手姿态、最靠近屏幕中央（或离原玩家近）的核心玩家，边缘旁观者自动忽略
        if (candidates.length === 0) {
          this.trackedPlayers = [];
        } else if (candidates.length === 1) {
          const cand = candidates[0];
          const locked = this.lockedPlayers[0];
          locked.centerX = locked.centerX * 0.75 + cand.centerX * 0.25;
          this.trackedPlayers = [{
            id: locked.id || 1,
            centerX: cand.centerX,
            comfortZone: cand.comfortZone || locked.comfortZone,
            hands: cand.hands,
            wrists: cand.wrists,face:cand.face,
            hasReached: cand.hasReached,
            hasBodyPresence: cand.hasBodyPresence
          }];
        } else {
          // 多人同框：评分筛选核心玩家
          const prevX = this.lockedPlayers[0].centerX;
          const scored = candidates.map((cand, idx) => {
            let score = 0;
            // 有伸出的有效小手，权重极高
            score += (cand.hands && cand.hands.length > 0 ? 10 : 0);
            // 越靠近屏幕中央 (0.5)，权重越高
            score += Math.max(0, 5 - Math.abs(cand.centerX - 0.5) * 8);
            // 越靠近前一帧玩家站位，权重加成
            score += Math.max(0, 3 - Math.abs(cand.centerX - prevX) * 4);
            return { cand, score, idx };
          });
          scored.sort((a, b) => b.score - a.score);
          const best = scored[0].cand;
          const locked = this.lockedPlayers[0];
          locked.centerX = locked.centerX * 0.75 + best.centerX * 0.25;
          this.trackedPlayers = [{
            id: locked.id || 1,
            centerX: best.centerX,
            comfortZone: best.comfortZone || locked.comfortZone,
            hands: best.hands,
            wrists: best.wrists,face:best.face,
            hasReached: best.hasReached,
            hasBodyPresence: best.hasBodyPresence
          }];
        }
      } else {
        // === 双人模式：匹配左右两位核心玩家，忽略第3位及以外的边缘旁观者 ===
        const assignedCandidates = new Set();
        const matchedPlayers = [];

        // 按从左到右对已锁定玩家排序
        const sortedLocked = [...this.lockedPlayers].sort((a, b) => a.centerX - b.centerX);

        for (const locked of sortedLocked) {
          let bestCandidate = null;
          let bestDist = 0.35; // 扩大容差至 0.35，允许玩家在左右半场自由伸展移步，不因微移丢目标
          let bestIdx = -1;

          candidates.forEach((cand, idx) => {
            if (assignedCandidates.has(idx)) return;
            const dist = Math.abs(cand.centerX - locked.centerX);
            if (dist < bestDist) {
              bestDist = dist;
              bestCandidate = cand;
              bestIdx = idx;
            }
          });

          if (bestCandidate) {
            assignedCandidates.add(bestIdx);
            locked.centerX = locked.centerX * 0.75 + bestCandidate.centerX * 0.25;
            matchedPlayers.push({
              id: locked.id,
              centerX: bestCandidate.centerX,
              comfortZone: locked.comfortZone,
              hands: bestCandidate.hands,
              wrists: bestCandidate.wrists,face:bestCandidate.face,
              hasReached: bestCandidate.hasReached,
              hasBodyPresence: bestCandidate.hasBodyPresence
            });
          }
        }

        // 按 ID 排序保证稳定
        matchedPlayers.sort((a, b) => a.id - b.id);
        this.trackedPlayers = matchedPlayers;
      }
    } else {
      // 未锁定阶段（取景校准中）：按从左到右排序（左1右2）
      candidates.sort((a, b) => a.centerX - b.centerX);
      this.trackedPlayers = candidates.slice(0, 2).map((cand, idx) => ({
        id: idx + 1,
        centerX: cand.centerX,
        comfortZone: cand.comfortZone,
        hands: cand.hands,
            wrists: cand.wrists,face:cand.face,
        hasReached: cand.hasReached,
        hasBodyPresence: cand.hasBodyPresence
      }));
    }

    if (this.useDedicatedHands) {
      this.handAssociator.assign(this.trackedPlayers,handResults,
        point=>mapVideoPoint(point,videoW,videoH,winW,winH),timestamp??performance.now());
      for(const p of this.trackedPlayers)p.hasReached=p.hands.some(h=>Math.hypot(h.x-p.centerX,h.y-(p.shoulderY??.4))>.05);
    }

    // 对最终确认追踪的玩家手部关键点进行 One-Euro 自适应平滑滤波（静止消除高频抖动打颤，快移保持低延迟跟手）
    const nowTime = timestamp ?? (typeof performance !== "undefined" ? performance.now() : Date.now());
    const currentHandKeys = new Set();
    for (const player of this.trackedPlayers) {
      if (!player.hands) continue;
      for (const hand of player.hands) {
        if (hand.isIndexTip === false) continue;
        const filterKey = "p_" + player.id + "_" + hand.side;
        currentHandKeys.add(filterKey);
        let filter = this.handFilters.get(filterKey);
        if (!filter) {
          filter = new HandPositionFilter(1.6, 0.018, 1.0, Math.max(winW,winH)*.35);
          this.handFilters.set(filterKey, filter);
        }
        if(filter.missing && Math.hypot(hand.x*winW-(filter.lastInputX??0),hand.y*winH-(filter.lastInputY??0))>Math.max(winW,winH)*.06)filter.reset();
        filter.missing=false;
        const filtered = filter.filter(hand.x*winW, hand.y*winH, nowTime);
        filter.lastSeen=nowTime;filter.lastInputX=hand.x*winW;filter.lastInputY=hand.y*winH;
        hand.rawX = hand.x;
        hand.rawY = hand.y;
        hand.x = filtered.x/winW;
        hand.y = filtered.y/winH;
      }
    }
    // 未出现的食指尖重置并清理滤波器，确保重新捕获时在新指尖位置淡入，滤波器重置，不从旧点横穿屏幕
    for (const [key, filter] of this.handFilters.entries()) {
      if (!currentHandKeys.has(key)) {
        filter.missing=true;
        if(nowTime-(filter.lastSeen??0)>90){filter.reset();this.handFilters.delete(key);}
      }
    }

    if (this.onResultsCallback) {
      this.onResultsCallback({
        players: this.trackedPlayers,
        raw: results
      });
    }
  }

  // 启用模拟模式（鼠标/触控），明确标识为 demo 模式
  enableDemoMode() {
    this.isDemoMode = true;
    this.isRunning = true;
    this.setStatus('running', '当前为鼠标/触控模拟模式（非摄像头）');
  }

  // 注入模拟手部位置 (供演示或无摄像头环境交互使用)
  injectDemoHand(normalizedX, normalizedY) {
    if (!this.isDemoMode) return;
    this.trackedPlayers = [
      {
        id: this.playerMode === 'coop' && normalizedX >= .5 ? 2 : 1,
        centerX: normalizedX,
        comfortZone: {
          minX: Math.max(0.1, normalizedX - 0.25),
          maxX: Math.min(0.9, normalizedX + 0.25),
          minY: 0.2,
          maxY: 0.8
        },
        hands: [
          {
            side: 'demo_pointer',
            source: 'demo',
            x: normalizedX,
            y: normalizedY,
            z: 0,
            rawVisibility: 1.0,
            isIndexTip: true
          }
        ]
      }
    ];

    if (this.onResultsCallback) {
      this.onResultsCallback({
        players: this.trackedPlayers,
        isDemo: true
      });
    }
  }

  // 暂停检测
  pause() {
    this.isRunning = false;
    if (this.handFilters) this.handFilters.clear();
    this.trackingSession++;
    if(typeof cancelAnimationFrame==='function')cancelAnimationFrame(this.detectionFrame);
    this.setStatus('paused', '检测已暂停');
  }

  // 恢复检测
  resume() {
    if (!this.isRunning) {
      this.isRunning = true;
      this.setStatus('running', '检测已恢复');
      if (!this.isDemoMode) {
        if (this.video && this.video.paused && this.video.srcObject) {
          try {
            const p = this.video.play();
            if (p && typeof p.catch === "function") p.catch(() => {});
          } catch (_) {}
        }
        this.detectLoop();
      }
    }
  }

  // 完全停止并释放摄像头设备（立即作废所有正在进行的异步 startCamera 请求）
  stop() {
    this.trackingSession++;
    if(typeof cancelAnimationFrame==='function')cancelAnimationFrame(this.detectionFrame);
    this.handAssociator.reset();
    this.cameraRequestId++; // 作废任何在途的 startCamera / getUserMedia
    this.isRunning = false;
    if (this.stream) {
      this.stream.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch (e) {
          console.warn('Track stop error', e);
        }
      });
      this.stream = null;
    }
    if (this.video) {
      this.video.srcObject = null;
    }
    this.trackedPlayers = [];
    this.unlockPlayers();
    this.setStatus('stopped', '摄像头已关闭，资源已释放');
  }
}
