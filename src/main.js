import {VoiceQueue} from './voiceQueue.js';
import {SpeechPolicy} from './speechPolicy.js';
import {WordFocus} from './wordFocus.js';
import {installNavigationGuard} from './navigationGuard.js';
import {WordLibrary} from './wordLibrary.js';
import {AnimalSpeech} from './animalSpeech.js';
import {getViewport} from './viewport.js';
import { SceneManager } from './sceneManager.js';
import { HotAirBalloon } from './hotAirBalloon.js';
import { RescueAnimal } from './rescueAnimal.js';
import {RescueFriendPlay} from './rescueFriendPlay.js';
import { BubbleManager } from './bubbleManager.js';
import { AudioManager } from './audioManager.js';
import { PoseDetector } from './poseDetector.js';
import { UIManager } from './uiManager.js';
import { GAME_CONFIG, resolveAnimal, PLAYABLE_ANIMALS } from './config.js';
import {CelebrationAccessories} from './celebrationAccessories.js';
import { CampManager } from './campManager.js';
import { PolaroidManager } from './polaroidManager.js';

/**
 * 游戏主控制器《彩虹小队 · 森林大解救》 (v0.5.1 食指指尖追踪、柔性等待与小动物打磨)
 * 1. 免手触自动就位 3-2-1 倒计时开局 (Auto-Start on Presence)
 * 2. 移除屏幕中央大模型：彻底移走正中央热气球，释放中央视野留给人脸与双手
 * 3. 底部跑道 + 左侧被困小动物：每次戳破泡泡充能解救，集满5分绳索崩解，小动物从左侧一路横向飞奔穿屏逃生
 * 4. 食指指尖（Landmark 19/20）交互点：光点、碰撞与避手严格以食指尖为锚点
 * 5. 防旁观者容差改造与平滑换人：
 *    - 单人模式：动态跟踪最靠中央的核心玩家，中途换人平滑移交控制权，多人员入框自动过滤边缘旁观者
 *    - 双人模式：稳定匹配左右两位玩家，边缘第三人被忽略，短暂一人遮挡给予宽限期
 * 6. 姿态丢失改为“柔性等待”：玩家偶尔走开时不弹阻断遮罩，浮动轻量提示，站回即刻无缝继续
 * 7. 0 -> 5 碰破泡泡闭环与逃生欢庆
 * 8. 摄像头生命周期、轮次取消与资源彻底清理
 * 9. 按可见视口自适应横竖屏，旋转不打断游戏或改变手动暂停状态
 */
export class Game {
  constructor() {
    this.state = 'START'; // 'START' | 'CALIBRATING' | 'PLAYING' | 'PAUSED' | 'CELEBRATING' | 'ERROR'
    this.prePauseState = 'PLAYING';
    this.collectedCount = 0;
    this.campManager = new CampManager();
    this.currentPolaroidDataUrl = null;
    this.currentAnimalName = "小兔 萌萌";
    this.animalSelection = 'bunny';
    this.activeAnimalId = 'bunny';
    this.targetCount = GAME_CONFIG.animals.bunny.targetBubbles;
    this.playerMode = 'single';
    this.isDemoMode = false;
    this.isOrientationPaused = false;
    this.isSoftWaiting = false; // 柔性等待标记（玩家离场时非阻断暂停）
    this.coopLostDuration = 0;

    // 姿态丢失计时
    this.noPoseDetectedTime = 0;

    // 自动开局 3-2-1 倒计时控制
    this.autoCountdownSessionId = 0;
    this.isAutoCountingDown = false;
    this.countdownTimers = [];
    this.countdownReadyDuration = 0; // 稳定就绪持续时间（用于触发防抖）
    this.countdownLostDuration = 0;  // 倒计时中姿态丢失持续时间（用于宽限缓冲）
    this.isCountdownGracePeriod = false; // 是否处于姿态丢失宽限期

    // 异步生命周期与庆祝定时器会话控制
    this.lifecycleSessionId = 0;
    this.celebrationSessionId = 0;
    this.celebrationRemainingMs = 0;
    this.celebrationStartTime = null;
    this.celebrationTimer = null;
    this.isCalibrationReady = false;

    // 初始化核心模块
    this.videoElement = typeof document !== 'undefined' ? document.getElementById('webcam-video') : null;
    this.canvasContainer = typeof document !== 'undefined' ? document.getElementById('canvas-container') : null;

    if (this.canvasContainer) {
      this.sceneManager = new SceneManager(this.canvasContainer);
    }
    this.audioManager = new AudioManager();
    this.speechPolicy = new SpeechPolicy();
    this.voiceQueue = new VoiceQueue(this.audioManager, this.speechPolicy);
    if (this.sceneManager) {
      this.balloon = new HotAirBalloon(this.sceneManager.scene);
      // 核心优化：彻底移走正中央大模型，释放视野正中心留给人脸与双手
      this.balloon.group.visible = false;
      this.sceneManager.setBalloon(this.balloon);

      this.rescueAnimal = new RescueAnimal(this.sceneManager.scene, this.sceneManager.camera);
      this.sceneManager.setRescueAnimal(this.rescueAnimal);
      this.friendInteraction=new RescueFriendPlay(this.sceneManager.scene,this.sceneManager.camera,this.rescueAnimal,this.audioManager,()=>this.finishFriendPlay());
      this.friendInteraction.onAction=profile=>this.uiManager?.showFriendPlay?.(profile,true);
      this.celebrationAccessories=new CelebrationAccessories(this.sceneManager.scene,this.sceneManager.camera);
      this.rescueAnimal.onEnergyReceived = () => this.sceneManager.triggerLeftFlowerBounce();
      this.rescueAnimal.onReachedExit = () => this.sceneManager.triggerRightArchGlow();

      this.bubbleManager = new BubbleManager(
        this.sceneManager.scene,
        this.sceneManager.camera,
        this.audioManager,
        this.balloon,
        this.rescueAnimal
      );
    }

    this.comboCount = 0;
    if (this.bubbleManager) {
      this.bubbleManager.onComboChange = (combo) => this.handleComboChange(combo);
      this.bubbleManager.onSpecialPop = () => this.onBubblePopped();
      this.bubbleManager.wordAudioHandler=word=>this.presentPlayWord(word);
    }

    this.bubbleManager?.contrastSampler && (this.bubbleManager.contrastSampler.video=this.videoElement);
    this.poseDetector = new PoseDetector(this.videoElement, {
      maxNumPoses: 2
    });

    if (typeof document !== 'undefined' && document.getElementById('start-screen')) {
      this.uiManager = new UIManager({
        onStart: (mode) => this.handleStart(mode),
        onReady: () => this.handleReadyToPlay(),
        onSelectMode: (mode) => this.handleSelectMode(mode),
        onSelectAnimal: selection => this.handleSelectAnimal(selection),
        onStopAutoNext: (reason) => this.cancelAutoNext(true, reason),
        onTogglePause: (isPaused) => {
          this.isSoftWaiting = false;
          this.handleTogglePause(isPaused);
        },
        onResume: () => this.handleResume(),
        onRestart: () => this.handleRestart(),
        onExit: () => this.handleExit(),
        onToggleAudio: () => { const muted=this.audioManager.toggleMute(); if(muted&&this.currentWord)this.wordAudioDone=true; return muted; },
        onEnableDemo: (mode) => this.handleEnableDemo(mode),
        onRetryCamera: () => this.handleRetryCamera(),
        onOpenCamp: () => this.uiManager.showCamp(this.campManager, this.audioManager),
        onFriendDone: () => this.friendInteraction?.finish(),
        onRetakePhoto: () => this.beginPhoto(true),
        onTakePhoto: () => this.beginPhoto(false),
        onCancelPhoto: () => this.cancelPhoto(),
        onReplayWord: () => this.replayWord(),
        onRecoverAudio: () => this.recoverAudio(),
        onReplaySpeech: () => this.animalSpeech?.replay(),
        onHearAnimal: () => this.hearAnimal(),
        onOpenWord: word => this.openWordDetail(word),
        onOpenVocabulary: () => {if(this.state==='START')this.wordLibrary?.open();},
        onNextFriend: () => this.startNextFriend(),
        onSavePolaroid: () => PolaroidManager.downloadImage(this.currentPolaroidDataUrl, this.currentAnimalName)
      });
      this.uiManager?.updateCampBadge?.(this.campManager);
      const wordMode=document.getElementById('word-mode');
      if(wordMode){
        wordMode.checked=this.speechPolicy.automaticEnabled;
        wordMode.addEventListener('change',()=>this.setAutomaticEnglish(wordMode.checked));
      }
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('gameviewportchange', () => {this.bubbleManager?.updateLayout();if(this.friendInteraction?.active){this.friendInteraction.updateLayout();this.bubbleManager?.hideHandIndicators();}this.uiManager?.updateLayout?.();this.sceneManager?.render();});
    }

    const manualVoice={playWord:(id,options)=>this.voiceQueue.playManualWord(id,options),stopWord:()=>this.voiceQueue.cancel()};
    this.wordLibrary=new WordLibrary(this.audioManager,()=>{if(this.uiManager?.dom?.btnSound)this.uiManager.dom.btnSound.textContent=this.audioManager.isMuted?'🔇':'🔊';},manualVoice);
    this.wordFocus=new WordFocus(this.audioManager,()=>this.handleResume(),()=>{if(this.uiManager?.dom?.btnSound)this.uiManager.dom.btnSound.textContent=this.audioManager.isMuted?'🔇':'🔊';},manualVoice);
    this.animalSpeech=new AnimalSpeech(this.voiceQueue,this.uiManager,this.rescueAnimal);this.animalSpeech.nonBlocking=true;
    if(this.uiManager)this.uiManager.flowLearning=true;
    if(this.bubbleManager)this.bubbleManager.getLearningObstacles=()=>this.uiManager?.getLearningObstacles?.()||[];
    this.audioManager.onRecoveryNeeded=needed=>{
      this.wordLibrary?.updateSound();this.wordFocus?.updateControls();
      this.uiManager?.showSoundRecovery?.(needed&&!this.wordLibrary?.overlay&&['PLAYING','CELEBRATING'].includes(this.state));
    };

    this.setupPoseCallbacks();
    this.setupBackgroundListener();
    this.setupDemoMouseTouchInput();
    this.setupOrientationHandler();

    // 启动主渲染循环 (仅在真实浏览器环境)
    if (typeof window !== 'undefined' && this.sceneManager) {
      this.lastFrameTime = performance.now();
      this.renderLoop();
    }
  }

  handleComboChange(combo) {
    this.comboCount = combo;
    this.rescueAnimal?.reactToCombo?.(combo);
    this.uiManager?.updateCombo?.(combo);
  }

  setupPoseCallbacks() {
    this.poseDetector.onResultsCallback = ({ players, isDemo }) => {
      if(this.pageInBackground)return;
      const receivedAt = performance.now();
      const inputDt = Math.min(.1, Math.max(.016, (receivedAt - (this.lastPlayersReceivedAt || receivedAt - 33)) / 1000));
      this.lastPlayers=players;this.lastPlayersReceivedAt=receivedAt;
      this.celebrationAccessories?.setPlayers(players);
      this.rescueAnimal?.setPlayerFocus?.(players);
      // 1. 取景校准阶段：动态校验人数与舒适伸手范围，更新界面就绪门禁并支持免手触自动 3-2-1 倒计时开局
      if (this.state === 'CALIBRATING') {
        const calib = this.poseDetector.getCalibrationStatus(this.playerMode);
        this.isCalibrationReady = calib.ready;

        if (calib.ready) {
          // 姿态良好在场：重置丢失计时与宽限期标记
          this.countdownLostDuration = 0;
          this.isCountdownGracePeriod = false;

          if (!this.isAutoCountingDown) {
            // 就绪稳定触发防抖：需持续就位约 400ms (demo模式或持续就位达成)
            this.countdownReadyDuration = (this.countdownReadyDuration || 0) + (isDemo ? 0.5 : 0.033);
            if (this.countdownReadyDuration >= 0.4) {
              this.startAutoCountdown();
            }
          } else {
            // 倒计时已在进行中且姿态良好，恢复引导提示
            if (this.uiManager && this.uiManager.updateCountdownTip) {
              this.uiManager.updateCountdownTip('🎯 人脸和小手已就位，准备出发！');
            }
          }

          if (this.uiManager && this.uiManager.setCalibrationReady) {
            const btnText = this.isAutoCountingDown ? '已就绪，正在倒数中...✨' : (this.countdownReadyDuration > 0 ? '正在检测就位...✨' : '已就位，准备倒数...✨');
            this.uiManager.setCalibrationReady(true, btnText);
          }
        } else {
          // 姿态丢失 / 尚未就绪
          this.countdownReadyDuration = 0;

          if (this.isAutoCountingDown) {
            // 核心体验优化：倒计时进行中短时间丢帧/丢手，进入 1.0s 容差宽限期，绝不闪现隐藏蒙层或打断闪烁
            this.countdownLostDuration = (this.countdownLostDuration || 0) + 0.033;
            this.isCountdownGracePeriod = true;

            // 宽限期内保持倒计时界面完全稳定不晃眼，仅温和更新提示文案
            if (this.uiManager && this.uiManager.updateCountdownTip) {
              this.uiManager.updateCountdownTip('保持站好，小手不要收回去哦~ ✨');
            }

            // 只有当持续离开镜头超过 1.0 秒时，才柔和取消倒计时
            if (this.countdownLostDuration > 1.0) {
              this.cancelAutoCountdown('哎呀，小手离开太久了~ 请重新站回镜头前哦');
              this.countdownLostDuration = 0;
              this.isCountdownGracePeriod = false;
            }
          } else {
            if (this.uiManager && this.uiManager.setCalibrationReady) {
              this.uiManager.setCalibrationReady(false, calib.message);
            }
          }
        }
        return;
      }

      // 如果当前处于柔性等待 (isSoftWaiting)，只要检测到玩家回来，瞬间无缝自动恢复！
      if (this.state === 'PAUSED' && this.isSoftWaiting) {
        const hasEnoughPlayers = (this.playerMode === 'coop') ? (players.length >= 2) : (players.length >= 1);
        if (hasEnoughPlayers) {
          this.isSoftWaiting = false;
          if (this.uiManager && this.uiManager.setPoseLostAlert) {
            this.uiManager.setPoseLostAlert(false);
          }
          this.handleResume();
          return;
        }
      }

      if(this.state==='CELEBRATING'&&this.friendInteraction?.active){this.bubbleManager?.updateHandIndicators(players);return;}

      if (this.state !== 'PLAYING') return;

      // A short occlusion is tolerated; a missing partner pauses without a blocking menu.
      if (this.playerMode === 'coop' && players.length < 2 && !isDemo) {
        this.coopLostDuration = (this.coopLostDuration || 0) + inputDt;
        if (this.coopLostDuration > 1) {
          this.isSoftWaiting = true;
          this.handleTogglePause(true);
          this.uiManager?.setPoseLostAlert?.(true, '等另一位朋友回来，爱心和能量都为你们留着');
          return;
        }
      } else this.coopLostDuration = 0;

      // 更新手部星芒与彩色光晕视觉反馈 (玩家1暖金，玩家2浅蓝)
      if (this.bubbleManager && this.bubbleManager.updateHandIndicators) {
        this.bubbleManager.updateHandIndicators(players);
      }

      // 3. 姿态丢失处理 (单人模式柔性等待)
      if (players.length === 0 && !isDemo) {
        this.noPoseDetectedTime += inputDt;
        // 连续丢失姿态超过 1.0 秒时自动进入柔性等待保留进度
        if (this.noPoseDetectedTime > 1.0) {
          this.isSoftWaiting = true;
          this.handleTogglePause(true);
          if (this.uiManager && this.uiManager.setPoseLostAlert) {
            this.uiManager.setPoseLostAlert(true, '等你回来哦~✨');
          }
          return;
        }
      } else {
        this.noPoseDetectedTime = 0;
        if (!this.isSoftWaiting && this.uiManager && this.uiManager.setPoseLostAlert) {
          this.uiManager.setPoseLostAlert(false);
        }
      }

      // 4. 碰撞与接近检测
      if (players.length && this.bubbleManager.handLossSeconds > .6 && !this.isDemoMode) {
        this.uiManager?.setPoseLostAlert?.(true, '把食指移回画面里，泡泡会靠近你哦');
      }
      const hit = this.bubbleManager.checkHandCollisions(players);
      if (hit) {
        this.onBubblePopped();
      }
    };

    this.poseDetector.onErrorCallback = (err) => {
      // 若当前已退出到 START 状态，不被旧请求错误覆写为 ERROR
      if (this.state === 'START') return;
      this.animalSpeech?.cancel();
      this.cancelWordPresentation();
      this.photoRequested=false;this.photoRemaining=null;this.photoCapturePending=false;this.retakePhoto=false;
      this.uiManager?.setPhotoCountdown?.(null);
      this.cancelAutoCountdown();
      this.cancelAutoNext();this.friendInteraction?.clear();this.uiManager?.hideFriendPlay?.();this.celebrationAccessories?.clear();
      this.state = 'ERROR';
      if (this.uiManager && this.uiManager.showError) {
        this.uiManager.showError(err.message || '摄像头启动失败，请检查浏览器权限');
      }
    };
  }

  // 免手触自动 3-2-1 倒计时开局
  startAutoCountdown() {
    if (this.isAutoCountingDown || this.state !== 'CALIBRATING') return;
    this.isAutoCountingDown = true;
    this.countdownLostDuration = 0;
    this.isCountdownGracePeriod = false;
    this.autoCountdownSessionId = (this.autoCountdownSessionId || 0) + 1;
    const session = this.autoCountdownSessionId;

    this.clearCountdownTimers();

    if (this.uiManager && this.uiManager.showCountdownOverlay) {
      this.uiManager.showCountdownOverlay('3', '🎯 人脸和小手已就位，准备出发！');
    }
    if (this.audioManager && this.audioManager.playCountdown) {
      this.audioManager.playCountdown(3);
    }

    const t1 = setTimeout(() => {
      if (this.autoCountdownSessionId !== session || this.state !== 'CALIBRATING') return;
      if (this.uiManager && this.uiManager.showCountdownOverlay) {
        this.uiManager.showCountdownOverlay('2', '🎯 保持站好，倒数开始！');
      }
      if (this.audioManager && this.audioManager.playCountdown) {
        this.audioManager.playCountdown(2);
      }
    }, 750);
    this.countdownTimers.push(t1);

    const t2 = setTimeout(() => {
      if (this.autoCountdownSessionId !== session || this.state !== 'CALIBRATING') return;
      if (this.uiManager && this.uiManager.showCountdownOverlay) {
        this.uiManager.showCountdownOverlay('1', '🎯 1... 准备碰泡泡！');
      }
      if (this.audioManager && this.audioManager.playCountdown) {
        this.audioManager.playCountdown(1);
      }
    }, 1500);
    this.countdownTimers.push(t2);

    const t3 = setTimeout(() => {
      if (this.autoCountdownSessionId !== session || this.state !== 'CALIBRATING') return;
      if (this.uiManager && this.uiManager.showCountdownOverlay) {
        this.uiManager.showCountdownOverlay('GO! 🚀', '✨ 出发！伸手碰泡泡解救小动物！');
      }
      if (this.audioManager && this.audioManager.playCountdownGo) {
        this.audioManager.playCountdownGo();
      }
    }, 2250);
    this.countdownTimers.push(t3);

    const t4 = setTimeout(() => {
      if (this.autoCountdownSessionId !== session || this.state !== 'CALIBRATING') return;
      this.isAutoCountingDown = false;
      this.countdownReadyDuration = 0;
      this.countdownLostDuration = 0;
      this.isCountdownGracePeriod = false;
      const success = this.handleReadyToPlay();
      if (!success) {
        this.cancelAutoCountdown('哎呀，没有看到小手呢~ 请重新站回镜头前哦');
      }
    }, 2700);
    this.countdownTimers.push(t4);
  }

  cancelAutoCountdown(reason) {
    this.isAutoCountingDown = false;
    this.countdownReadyDuration = 0;
    this.countdownLostDuration = 0;
    this.isCountdownGracePeriod = false;
    this.clearCountdownTimers();
    if (this.uiManager && this.uiManager.hideCountdownOverlay) {
      this.uiManager.hideCountdownOverlay();
    }
    if (this.uiManager && this.uiManager.setCalibrationReady && reason) {
      this.uiManager.setCalibrationReady(false, reason);
    }
  }

  clearCountdownTimers() {
    if (this.countdownTimers && this.countdownTimers.length > 0) {
      this.countdownTimers.forEach(t => clearTimeout(t));
      this.countdownTimers = [];
    }
  }

  // 开始流程：点击开始 -> 开启摄像头与模型 -> 进入校准
  async handleStart(mode) {
    this.prepareAnimal();
    this.lifecycleSessionId = (this.lifecycleSessionId || 0) + 1;
    const session = this.lifecycleSessionId;
    this.playerMode = mode;
    this.isSoftWaiting = false;
    this.coopLostDuration = 0;
    this.bubbleManager.setPlayerMode(mode);
    this.poseDetector.setPlayerMode(mode);
    this.audioManager.init();
    this.isCalibrationReady = false;
    this.isDemoMode = false;
    this.poseDetector.isDemoMode = false;
    this.poseDetector.unlockPlayers();
    this.cancelAutoCountdown();

    if (this.uiManager) {
      if (this.uiManager.hideStartScreen) this.uiManager.hideStartScreen();
      if (this.uiManager.showCalibration) this.uiManager.showCalibration();
      if (this.uiManager.setCalibrationReady) this.uiManager.setCalibrationReady(false, '正在准备摄像头与姿态模型...');
    }
    this.state = 'CALIBRATING';

    // 初始化本地姿态模型
    const modelReady = await this.poseDetector.init();
    if (this.lifecycleSessionId !== session || this.state !== 'CALIBRATING') {
      return;
    }
    if (!modelReady) {
      if (this.uiManager && this.uiManager.setCalibrationReady) {
        this.uiManager.setCalibrationReady(false, '模型加载失败，请检查网络或重试');
      }
      return;
    }

    // 启动摄像头
    const cameraReady = await this.poseDetector.startCamera();
    if (this.lifecycleSessionId !== session || this.state !== 'CALIBRATING') {
      return;
    }
    if (!cameraReady) return;

    // 初始核对校准门禁状态
    const calib = this.poseDetector.getCalibrationStatus(this.playerMode);
    this.isCalibrationReady = calib.ready;
    if (this.uiManager && this.uiManager.setCalibrationReady) {
      this.uiManager.setCalibrationReady(calib.ready, calib.message);
    }
  }

  // 校准完成，正式开始游戏 (严格校验引擎与摄像头流运行、双手可见与就绪门禁)
  handleReadyToPlay() {
    if (this.state !== 'CALIBRATING' && !this.isDemoMode) {
      return false;
    }

    if (!this.isDemoMode) {
      // 必须确认底层姿态引擎和摄像头流处于 running 活跃状态
      if (this.poseDetector.status !== 'running' || !this.poseDetector.stream || !this.poseDetector.isRunning) {
        return false;
      }

      const calib = this.poseDetector.getCalibrationStatus(this.playerMode);
      const required = this.playerMode === 'coop' ? 2 : 1;
      if (!calib.ready || calib.players.length < required) {
        if (this.uiManager && this.uiManager.setCalibrationReady) {
          this.uiManager.setCalibrationReady(false, calib.message || `需要 ${required} 位玩家就位哦`);
        }
        return false;
      }

      // 锁定本轮参与玩家与舒适伸手范围，防止旁观者替入
      this.poseDetector.lockPlayers(calib.players, this.playerMode);
      this.bubbleManager.setPlayerComfortZones(this.poseDetector.lockedPlayers);
    }

    this.cancelAutoCountdown();
    this.state = 'PLAYING';
    this.prePauseState = 'PLAYING';
    this.collectedCount = 0;
    this.noPoseDetectedTime = 0;
    this.isSoftWaiting = false;
    this.coopLostDuration = 0;
    if (this.uiManager) {
      if (this.uiManager.hideCountdownOverlay) this.uiManager.hideCountdownOverlay();
      if (this.uiManager.hideCalibration) this.uiManager.hideCalibration();
      if (this.uiManager.resetProgress) this.uiManager.resetProgress();
      if (this.uiManager.showHUD) this.uiManager.showHUD();
    }
    if (this.balloon) this.balloon.reset();
    if (this.rescueAnimal) this.rescueAnimal.reset();
    this.bubbleManager.clear();

    this.comboCount = 0;
    this.uiManager?.hideCombo?.();
    this.sceneManager?.randomizeStage?.();
    this.audioManager?.setBGMStage?.(this.sceneManager?.stageId);
    this.audioManager?.startBGM?.(this.sceneManager?.stageId || "forest");
    // 生成第 1 个泡泡
    this.beginRoundGreeting();


    return true;
  }

  beginRoundGreeting() {
    this.animalSpeech?.cancel();this.voiceQueue?.cancel();this.voiceQueue?.resume();this.speechPolicy?.beginRound();this.lastPlayWord=null;this.clearPlayWordCue();this.uiManager?.hidePlayWords?.();
    if(this.bubbleManager?.wordMode!==false&&this.bubbleManager?.chooseRoundWord&&!this.bubbleManager.wordPool?.length){const first=this.bubbleManager.chooseRoundWord();if(first)this.bubbleManager.wordQueue.unshift(first);}
    if(this.speechPolicy?.automaticEnabled)this.audioManager?.preloadWordAudios?.(this.bubbleManager.wordPool?.map(w=>w.id)||[],{review:true});
    if(this.state==='PLAYING')this.bubbleManager.spawnNext(this.collectedCount,true);
  }

  presentPlayWord(word) {
    this.lastPlayWord=word;this.uiManager?.setLastWordAvailable?.(true);
    // The last hit transitions to pet play immediately, so it has no speech opportunity.
    if(this.state!=='PLAYING'||this.collectedCount+(this.bubbleManager?.lastPoppedEnergy||1)>=this.targetCount)return Promise.resolve();
    let token;
    return this.voiceQueue.playAutomaticWord(word.id,()=>{
      if(this.state!=='PLAYING')return;
      token=this.playWordCueToken=(this.playWordCueToken||0)+1;
      this.cueWord=word;this.wordCueRemaining=Infinity;this.uiManager?.showWordCue?.(word);
    }).finally(()=>{
      if(token!==undefined&&token===this.playWordCueToken&&this.state==='PLAYING'&&this.cueWord===word)this.wordCueRemaining=.65;
    });
  }

  clearPlayWordCue() {
    this.playWordCueToken=(this.playWordCueToken||0)+1;this.wordCueRemaining=0;this.cueWord=null;this.uiManager?.clearWordCue?.();
  }

  setAutomaticEnglish(enabled) {
    this.speechPolicy.setAutomatic(enabled);
    if(!enabled){if(this.voiceQueue?.current?.automatic)this.voiceQueue.cancel();this.clearPlayWordCue();}
  }

  hearAnimal() {
    if(!['PLAYING','CELEBRATING'].includes(this.state)||this.resultVisible||this.wordFocus?.overlay)return;
    if(this.audioManager?.isMuted){this.audioManager.toggleMute();if(this.uiManager?.dom?.btnSound)this.uiManager.dom.btnSound.textContent='🔊';}
    this.audioManager?.recoverFromGesture?.();
    this.clearPlayWordCue();this.voiceQueue?.cancel();
    this.animalSpeech?.start(this.state==='PLAYING'?'start':'end',this.activeAnimalId,()=>{});
  }

  openWordDetail(word=this.lastPlayWord) {
    if(this.state!=='PLAYING'||!word)return;
    this.handleTogglePause(true);if(this.voiceQueue)this.voiceQueue.resumeWord=null;
    this.animalSpeech?.cancel();this.clearPlayWordCue();this.wordFocus?.open(word);
  }

  // 碰破泡泡的核心计分与结算
  onBubblePopped(energyGained = (this.bubbleManager?.lastPoppedEnergy || 1)) {
    if (this.state !== 'PLAYING') return;

    this.collectedCount = Math.min(this.targetCount, this.collectedCount + energyGained);
    const current = this.collectedCount;
    const afterWord = !!this.currentWord;
    if (this.bubbleManager) this.bubbleManager.lastPoppedEnergy = 1;

    // 首次碰触立即在 200ms 内淡出首个泡泡示范引导手势，后续不再显示
    if (this.uiManager) {
      if (this.uiManager.dismissHandGuidePermanently) {
        this.uiManager.dismissHandGuidePermanently();
      } else if (this.uiManager.showHandGuide) {
        this.uiManager.showHandGuide(false);
      }
    }

    // Normal play gives feedback and schedules the next target independently of speech.
    if(this.voiceQueue&&!this.currentWord){
      this.uiManager?.updateProgress?.(current);this.balloon?.setEnergy(current);this.rescueAnimal?.setEnergy(current);
      this.audioManager.playEnergyCharge(current);
      if(!this.voiceQueue.current)this.audioManager.playAnimalSound?.(this.activeAnimalId,'energy');
      if(current>=this.targetCount)this.handleVictory();
      else this.bubbleManager.spawnNext(this.bubbleManager.completedBubbleCount??current,false,null,true);
      return;
    }

    // Count the hit immediately, but deliver its visible effect only when the
    // energy actually reaches the bow. The final rescue follows that same event.
    const session = this.lifecycleSessionId;
    const deliver = () => {
      if (session !== this.lifecycleSessionId || this.state !== 'PLAYING') return;
      if ((this.wordPresentationRemaining || 0) > 0) { this.pendingWordDelivery = deliver; return; }
      this.pendingWordDelivery = null;
      this.uiManager?.updateProgress?.(current);
      this.balloon?.setEnergy(current);
      this.rescueAnimal?.setEnergy(current);
      this.audioManager.playEnergyCharge(current);
      this.audioManager.playAnimalSound?.(this.activeAnimalId || this.rescueAnimal?.animalId || "bunny", "energy");
      if (current >= this.targetCount) this.handleVictory();
      else this.bubbleManager.spawnNext(this.bubbleManager.completedBubbleCount ?? current,false,null,afterWord);
    };
    const projectile = this.bubbleManager.energyProjectiles?.at(-1);
    if (projectile && !projectile.onArrive) projectile.onArrive = deliver;
    else deliver();

  }

  // 达成 5 个泡泡，解救成功，逃生大欢庆！
  handleVictory() {
    this.voiceQueue?.cancel();this.animalSpeech?.cancel();this.clearPlayWordCue();this.uiManager?.hidePlayWords?.();
    this.state = 'CELEBRATING';
    this.prePauseState = 'CELEBRATING';
    this.isSoftWaiting = false;
    this.waitingForEscape = false;this.resultVisible=false;
    this.cancelAutoNext();
    this.celebrationAccessories?.clear();
    if (this.bubbleManager.clearActiveBubble) {
      this.bubbleManager.clearActiveBubble();
    } else {
      this.bubbleManager.clear();
    }
    if (this.uiManager && this.uiManager.setPoseLostAlert) {
      this.uiManager.setPoseLostAlert(false);
    }

    this.bubbleManager?.resetCombo?.();
    this.comboCount = 0;
    this.uiManager?.hideCombo?.();

    const animalId = this.activeAnimalId || this.rescueAnimal?.animalId || 'bunny';
    this.campManager?.recordRescue(animalId);
    this.uiManager?.updateCampBadge?.(this.campManager);

    // 播放欢庆音效与小动物大逃亡飞奔动画
    this.audioManager.playCelebration();
    this.audioManager.playAnimalSound?.(animalId, "escape");

    this.photoRemaining = null;
    this.photoCapturePending = false;
    this.uiManager?.setPhotoCountdown?.(null);
    if (this.balloon) this.balloon.startTakeoff();

    // 取消旧庆祝计时器，支持分段与暂停打断恢复
    if (this.celebrationTimer) {
      clearTimeout(this.celebrationTimer);
      this.celebrationTimer = null;
    }
    this.celebrationSessionId = (this.celebrationSessionId || 0) + 1;
    if(this.friendInteraction){
      this.celebrationRemainingMs=0;
      const profile=this.friendInteraction.start(this.bubbleManager.playerComfortZones || []);
      this.bubbleManager.hideHandIndicators();
      this.uiManager?.showFriendPlay?.(profile);
      return;
    }
    this.startFarewell();
  }

  finishFriendPlay() {
    if(this.state!=='CELEBRATING')return;
    this.friendInteraction?.clear();
    this.uiManager?.hideFriendPlay?.();
    this.bubbleManager?.hideHandIndicators?.();
    this.startFarewell();
  }

  startFarewell() {
    this.voiceQueue?.cancel();this.animalSpeech?.cancel();this.clearPlayWordCue();
    this.beginFarewell();
  }

  beginFarewell() {
    if (this.hasLiveCamera()) this.celebrationAccessories?.start(this.lastPlayers || [], false);
    this.rescueAnimal?.startEscape?.();
    const currentSession=this.celebrationSessionId;
    this.celebrationRemainingMs=GAME_CONFIG.gameplay.celebrationDurationMs;
    this.celebrationStartTime=performance.now();
    this.celebrationTimer=setTimeout(()=>{
      if(this.celebrationSessionId===currentSession&&this.state==='CELEBRATING'){
        this.celebrationRemainingMs=0;
        this.showVictoryWhenReady();
        this.celebrationTimer=null;
      }
    },this.celebrationRemainingMs);
  }

  showVictoryWhenReady() {
    if (this.state !== 'CELEBRATING' || this.friendInteraction?.active || (this.animalSpeech?.active&&!this.animalSpeech.nonBlocking)) return;
    // A slow renderer must not let a wall-clock timer cover the goodbye pose.
    if (this.rescueAnimal?.state && this.rescueAnimal.state !== 'ESCAPED') {
      this.waitingForEscape = true;
      return;
    }
    this.waitingForEscape = false;
    if(this.resultVisible)return;
    if (this.photoRemaining !== null && this.photoRemaining !== undefined) return;
    this.showVictoryResult(false);
  }

  hasLiveCamera() {
    const video = this.videoElement;
    if (this.isDemoMode || !video || video.readyState < 2 || !video.videoWidth || video.paused) return false;
    return !!video.srcObject?.getVideoTracks?.().some(track => track.readyState === 'live' && track.enabled !== false);
  }

  showVictoryResult(hasPhoto = false) {
    this.voiceQueue?.cancel();this.animalSpeech?.cancel();this.clearPlayWordCue();this.uiManager?.hidePlayWords?.();
    this.photoRemaining = null;
    this.photoCapturePending = false;
    this.photoRequested = false;
    this.uiManager?.setPhotoCountdown?.(null);
    if (!hasPhoto) {
      this.currentPolaroidDataUrl = null;
      this.uiManager?.setPolaroidImage?.(null);
      if(!this.hasLiveCamera())this.celebrationAccessories?.clear();
    }
    this.resultVisible = true;
    this.uiManager?.showVictory?.({hasPhoto,canTakePhoto:this.hasLiveCamera()});
    if (this.retakePhoto) this.cancelAutoNext(true, hasPhoto ? 'keep_photo' : 'keep_result');
    else if (this.sceneManager && this.uiManager?.setAutoNextCountdown) this.startAutoNext();
    this.retakePhoto = false;
  }

  beginPhoto(retake = false) {
    if (this.state !== 'CELEBRATING' || !this.resultVisible || this.friendInteraction?.active) return;
    if (!this.hasLiveCamera()) { this.showVictoryResult(false); return; }
    this.cancelAutoNext(false);
    // Every photo is an explicit opt-in; preserve it instead of auto-advancing.
    this.retakePhoto = true;
    this.photoRequested = true;
    if(!this.celebrationAccessories?.slots?.some(slot=>slot.prop.visible)){
      this.celebrationAccessories?.start(this.lastPlayers || [], false);
    }
    this.resultVisible = false;
    this.photoRemaining = 2.4;
    this.photoCapturePending = false;
    this.uiManager?.hideVictory?.();
    this.uiManager?.setPhotoCountdown?.(3);
  }

  cancelPhoto() {
    if(!this.photoRequested)return;
    this.retakePhoto=true;
    this.showVictoryResult(!!this.currentPolaroidDataUrl && this.hasLiveCamera());
  }

  captureVictoryPhoto() {
    if(!this.photoRequested || this.state!=='CELEBRATING')return;
    if (!this.hasLiveCamera()) { this.showVictoryResult(false); return; }
    this.photoRemaining = null;
    this.photoCapturePending = false;
    this.uiManager?.setPhotoCountdown?.(null);
    const animalId = this.activeAnimalId || this.rescueAnimal?.animalId || 'bunny';
    const profile = GAME_CONFIG.animals[animalId] || {};
    this.currentAnimalName = profile.name || '小动物';
    this.currentPolaroidDataUrl = PolaroidManager.getDataUrl({
      videoElement: this.videoElement,
      webglCanvas: this.sceneManager?.renderer?.domElement,
      animalId, animalName: this.currentAnimalName, targetBubbles: this.targetCount,
      animalEmoji: {bunny:'🐰',cat:'🐱',frog:'🐸',dog:'🐶',dragon:'🐲',goldenDragon:'🐉'}[animalId] || '🐾'
    });
    this.audioManager?.playCameraShutter?.();
    this.uiManager?.triggerCameraFlash?.();
    this.uiManager?.setPolaroidImage?.(this.currentPolaroidDataUrl, this.currentAnimalName);
    this.showVictoryResult(!!this.currentPolaroidDataUrl);
  }

  startNextFriend() {
    this.cancelAutoNext(false);
    this.uiManager?.hideVictory?.();
    const candidates = PLAYABLE_ANIMALS.filter(id => id !== this.activeAnimalId);
    this.animalSelection = 'random';
    this.uiManager?.setAnimalSelection?.('random');
    this.applyAnimal(candidates[Math.floor(Math.random() * candidates.length)]);
    this.handleRestart();
  }

  startAutoNext() {
    this.cancelAutoNext(false);
    const session=this.celebrationSessionId;
    const ticket=this.autoNextTicket=(this.autoNextTicket||0)+1;
    this.autoNextAwaySeconds=0;
    this.autoNextDeadline=performance.now()+12000;
    this.uiManager?.setAutoNextCountdown?.(12);
    this.autoNextTimer=setTimeout(()=>{
      if(ticket!==this.autoNextTicket)return;
      this.autoNextTimer=null;
      if(this.state!=='CELEBRATING'||!this.resultVisible||session!==this.celebrationSessionId)return;
      const hidden=typeof document!=='undefined'&&document.hidden;
      const required=this.playerMode==='coop'?2:1;
      const present=this.isDemoMode || ((this.lastPlayers?.length||0)>=required && performance.now()-(this.lastPlayersReceivedAt||0)<700);
      if(hidden||!present){this.cancelAutoNext();return;}
      this.startNextFriend();
    },12000);
  }
  cancelAutoNext(showStopped=true, reason=null) {
    this.autoNextTicket=(this.autoNextTicket||0)+1;
    if(this.autoNextTimer)clearTimeout(this.autoNextTimer);
    this.autoNextTimer=null;this.autoNextDeadline=0;
    if(showStopped)this.uiManager?.setAutoNextCountdown?.(null, reason==='keep_photo'?'合影已为你保留，想玩时点击「再玩一次」':null);
  }

  // 暂停与恢复（支持庆祝状态分段有效时长冻结与恢复，暂停时隐藏手晕光芒）
  handleTogglePause(paused) {
    if (paused) {
      if(this.state==='PAUSED')return;
      this.voiceQueue?.pause({discard:true});this.clearPlayWordCue();this.uiManager?.setInteractionHint?.('');
      this.uiManager?.showSoundRecovery?.(false);
      this.cancelAutoNext();
      this.animalSpeech?.cancel();
      if(this.currentWord){this.wordPresentationToken=(this.wordPresentationToken||0)+1;this.audioManager?.stopWord?.();this.wordAudioDone=false;this.uiManager?.setWordPopupPaused?.(true);}
      this.friendInteraction?.setPaused(true);
      this.uiManager?.hideFriendPlay?.();
      this.prePauseState = this.state;
      this.state = 'PAUSED';
      this.cancelAutoCountdown();
      this.audioManager?.pauseBGM?.();
      this.bubbleManager?.resetCombo?.();
      this.comboCount = 0;
      this.uiManager?.hideCombo?.();

      // 仅在手动暂停时真正停止检测循环；柔性等待保持帧检测以便人站回时瞬间自动恢复
      if (!this.isSoftWaiting && this.poseDetector && this.poseDetector.pause) {
        this.poseDetector.pause();
      }
      if (this.rescueAnimal) {
        this.rescueAnimal.setPaused?.(true);
      }
      if (this.bubbleManager) {
        if (this.bubbleManager.hideHandIndicators) {
          this.bubbleManager.hideHandIndicators();
        } else if (this.bubbleManager.handIndicators) {
          for (const ind of this.bubbleManager.handIndicators) {
            ind.group.visible = false;
            ind.active = false;
          }
        }
      }

      // 庆祝期间暂停：计算消耗并冻结剩余庆祝有效时长，清理当前定时器
      if (this.prePauseState === 'CELEBRATING' && this.celebrationTimer) {
        clearTimeout(this.celebrationTimer);
        this.celebrationTimer = null;
        const elapsed = performance.now() - (this.celebrationStartTime || performance.now());
        this.celebrationRemainingMs = Math.max(0, this.celebrationRemainingMs - elapsed);
      }
    }
  }

  handleResume() {
    if(this.pageInBackground){if(typeof document!=='undefined'&&document.hidden)return;this.handlePageForeground();}
    if(this.state!=='PAUSED')return;
    this.lastFrameTime=performance.now();
    this.audioManager?.recoverFromGesture?.();
    if(!this.isDemoMode&&this.videoElement?.srcObject){try{this.videoElement.play()?.catch?.(()=>{});}catch{}}
    this.state = this.prePauseState || 'PLAYING';
    this.noPoseDetectedTime = 0;
    this.isSoftWaiting = false;
    this.coopLostDuration = 0;
    this.poseDetector?.resume?.();
    this.audioManager?.resumeBGM?.();
    if(this.currentWord){
      if(this.wordClosingRemaining>0){
        const anchor=this.uiManager?.wordPopupAnchor;
        this.uiManager?.showWordPopup?.(this.currentWord,anchor?.x??.5,anchor?.y??.5);
      }
      this.wordClosingRemaining=0;
      this.wordReplayReady=false;this.wordReplayDwell=0;this.wordReplayHover=false;
      this.uiManager?.setWordReplayProgress?.(0);
      this.wordElapsed=0;this.wordActiveElapsed=0;
      this.wordAudioDone=false;
      this.wordQuietElapsed=0;
      this.uiManager?.setWordPopupPaused?.(false);
      const token=this.wordPresentationToken=(this.wordPresentationToken||0)+1;
      this.waitForWordAudio(this.audioManager?.playWord?.(this.currentWord.id,{review:!!this.wordPlaybackReview}),token);
    }
    if (this.uiManager && this.uiManager.setPoseLostAlert) {
      this.uiManager.setPoseLostAlert(false);
    }
    if (this.rescueAnimal) {
      this.rescueAnimal.setPaused?.(false);
    }

    this.voiceQueue?.resume();
    this.animalSpeech?.setPaused(false);
    this.friendInteraction?.setPaused(false);
    if(this.friendInteraction?.active)this.uiManager?.showFriendPlay?.(this.friendInteraction.profile);
    // 恢复为庆祝状态：按剩余有效时长恢复计时器
    if (this.state === 'CELEBRATING' && !this.friendInteraction?.active && (!this.animalSpeech?.active||this.animalSpeech.nonBlocking)) {
      const currentSession = this.celebrationSessionId;
      this.celebrationStartTime = performance.now();
      if (this.celebrationRemainingMs <= 0) {
        this.celebrationRemainingMs = 0;
        this.showVictoryWhenReady();
        this.celebrationTimer = null;
      } else {
        this.celebrationTimer = setTimeout(() => {
          if (this.celebrationSessionId === currentSession && this.state === 'CELEBRATING') {
            this.celebrationRemainingMs = 0;
            this.showVictoryWhenReady();
            this.celebrationTimer = null;
          }
        }, this.celebrationRemainingMs);
      }
    }
  }

  // 重新开始当前关卡（彻底清除旧庆祝回调）
  handleRestart() {
    this.wordFocus?.close(false);this.voiceQueue?.cancel();this.clearPlayWordCue();this.uiManager?.hidePlayWords?.();
    this.uiManager?.showSoundRecovery?.(false);
    this.wordLibrary?.close();
    this.animalSpeech?.cancel();
    this.cancelWordPresentation();
    this.friendInteraction?.clear();this.uiManager?.hideFriendPlay?.();
    this.cancelAutoNext(false);this.resultVisible=false;this.photoRequested=false;this.retakePhoto=false;this.photoRemaining=null;this.photoCapturePending=false;this.uiManager?.setPhotoCountdown?.(null);this.celebrationAccessories?.clear();
    this.uiManager?.hideVictory?.();
    this.cancelAutoCountdown();
    this.celebrationSessionId = (this.celebrationSessionId || 0) + 1;
    if (this.celebrationTimer) {
      clearTimeout(this.celebrationTimer);
      this.celebrationTimer = null;
    }
    this.celebrationRemainingMs = 0;
    this.collectedCount = 0;
    this.noPoseDetectedTime = 0;
    this.isSoftWaiting = false;
    this.coopLostDuration = 0;
    if (this.uiManager && this.uiManager.resetProgress) {
      this.uiManager.resetProgress();
    }
    if (this.balloon) this.balloon.reset();
    if (this.rescueAnimal) this.rescueAnimal.reset();
    this.bubbleManager.clear();
    this.comboCount = 0;
    this.uiManager?.hideCombo?.();
    this.state = 'PLAYING';
    this.prePauseState = 'PLAYING';
    this.poseDetector.resume();
    this.sceneManager?.randomizeStage?.();
    this.audioManager?.setBGMStage?.(this.sceneManager?.stageId);
    this.audioManager?.startBGM?.(this.sceneManager?.stageId || "forest");
    this.beginRoundGreeting();
  }

  handleSelectAnimal(selection) {
    if (this.state !== 'START') return;
    this.animalSelection = [...PLAYABLE_ANIMALS,'random'].includes(selection) ? selection : 'bunny';
    this.uiManager?.setAnimalSelection?.(this.animalSelection);
    if (this.animalSelection !== 'random') this.applyAnimal(this.animalSelection);
  }

  prepareAnimal() { this.applyAnimal(resolveAnimal(this.animalSelection || 'bunny')); }

  applyAnimal(id) {
    this.activeAnimalId = id;
    this.sceneManager?.setAnimalTheme?.(id);
    const profile = GAME_CONFIG.animals[id];
    this.targetCount = profile.targetBubbles;
    if (this.rescueAnimal && this.rescueAnimal.animalId !== id) this.rescueAnimal.setAnimal?.(id);
    this.uiManager?.configureAnimal?.(profile);
  }

  // 切换人数模式
  handleSelectMode(mode) {
    this.playerMode = mode;
    this.bubbleManager.setPlayerMode(mode);
    this.poseDetector.setPlayerMode(mode);
  }

  // 退出回首页（取消所有异步流程、旧定时器并彻底释放摄像头）
  handleExit() {
    this.bubbleManager?.contrastSampler?.clear();
    this.wordFocus?.close(false);this.voiceQueue?.cancel();this.clearPlayWordCue();this.uiManager?.hidePlayWords?.();
    this.uiManager?.showSoundRecovery?.(false);
    this.wordLibrary?.close();
    this.animalSpeech?.cancel();
    this.cancelWordPresentation();
    this.friendInteraction?.clear();this.uiManager?.hideFriendPlay?.();
    this.cancelAutoNext(false);this.resultVisible=false;this.photoRequested=false;this.retakePhoto=false;this.photoRemaining=null;this.photoCapturePending=false;this.uiManager?.setPhotoCountdown?.(null);this.celebrationAccessories?.clear();
    this.cancelAutoCountdown();
    this.lifecycleSessionId = (this.lifecycleSessionId || 0) + 1;
    this.celebrationSessionId = (this.celebrationSessionId || 0) + 1;
    if (this.celebrationTimer) {
      clearTimeout(this.celebrationTimer);
      this.celebrationTimer = null;
    }
    this.celebrationRemainingMs = 0;
    this.isCalibrationReady = false;
    this.isDemoMode = false;
    this.isSoftWaiting = false;
    this.coopLostDuration = 0;

    this.audioManager?.stopBGM?.();
    this.bubbleManager?.resetCombo?.();
    this.comboCount = 0;
    this.uiManager?.hideCombo?.();
    this.state = 'START';
    this.prePauseState = 'START';
    this.collectedCount = 0;
    this.noPoseDetectedTime = 0;
    this.bubbleManager.clear();
    if (this.balloon) this.balloon.reset();
    if (this.rescueAnimal) this.rescueAnimal.reset();
    this.poseDetector.stop();

    if (this.uiManager) {
      if (this.uiManager.showStartScreen) this.uiManager.showStartScreen();
      if (this.uiManager.setPoseLostAlert) this.uiManager.setPoseLostAlert(false);
    }
  }

  // 启用模拟模式 (无摄像头或测试环境)
  handleEnableDemo(mode) {
    this.prepareAnimal();
    this.lifecycleSessionId = (this.lifecycleSessionId || 0) + 1;
    this.isDemoMode = true;
    this.playerMode = mode || 'single';
    this.bubbleManager.setPlayerMode(this.playerMode);
    this.poseDetector.setPlayerMode(this.playerMode);
    this.poseDetector.enableDemoMode();
    this.audioManager.init();
    this.isSoftWaiting = false;

    if (this.uiManager) {
      if (this.uiManager.hideStartScreen) this.uiManager.hideStartScreen();
      if (this.uiManager.hideCalibration) this.uiManager.hideCalibration();
      if (this.uiManager.showDemoBanner) this.uiManager.showDemoBanner(true);
    }

    this.handleReadyToPlay();
  }

  // 重试摄像头启动
  async handleRetryCamera() {
    await this.poseDetector.init();
    return this.handleStart(this.playerMode);
  }

  // 模拟模式下的鼠标与触摸交互输入
  setupDemoMouseTouchInput() {
    if (typeof window === 'undefined') return;

    const handlePointer = (e) => {
      if (!this.isDemoMode || !(this.state==='PLAYING'||(this.state==='CELEBRATING'&&this.friendInteraction?.active))) return;

      if(e.target?.closest?.('button, .word-focus-overlay, .word-library-overlay'))return;
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;

      const normX = (clientX-getViewport().left) / getViewport().width;
      const normY = (clientY-getViewport().top) / getViewport().height;

      this.poseDetector.injectDemoHand(normX, normY);
    };

    this.removeNavigationGuard=installNavigationGuard(()=>this.isDemoMode&&['PLAYING','CELEBRATING','PAUSED'].includes(this.state));
    window.addEventListener('mousemove', handlePointer);
    window.addEventListener('touchmove', handlePointer, { passive: true });
    window.addEventListener('touchstart', handlePointer, { passive: true });
  }

  // visibilitychange and pagehide can both fire; preserve the original pause state.
  handlePageBackground() {
    if(this.pageInBackground)return;
    this.wordFocus?.close(false);this.voiceQueue?.pause({discard:true});this.clearPlayWordCue();
    this.pageInBackground=true;this.isSoftWaiting=false;this.lastPlayers=[];this.lastPlayersReceivedAt=0;
    this.wordReplayReady=false;this.wordReplayHover=false;this.wordReplayDwell=0;
    this.wordLibrary?.stopPlayback();
    if(['PLAYING','CELEBRATING'].includes(this.state))this.handleTogglePause(true);
    if(this.state==='PAUSED'){this.poseDetector?.pause?.();this.uiManager?.showPause?.();}
    if(this.state==='CALIBRATING'){this.cancelAutoCountdown();this.poseDetector?.pause?.();}
    this.bubbleManager?.hideHandIndicators?.();this.audioManager?.suspendForBackground?.();
  }

  handlePageForeground() {
    if(typeof document!=='undefined'&&document.hidden)return;
    this.pageInBackground=false;this.lastFrameTime=performance.now();
    this.audioManager?.markForeground?.();
    // Keep a clear tap-to-continue gate so iOS can unlock audio in a user gesture.
    if(this.state==='PAUSED')this.uiManager?.showPause?.();
    if(this.state==='CALIBRATING')this.poseDetector?.resume?.();
  }

  setupBackgroundListener() {
    if(typeof document==='undefined'||typeof document.addEventListener!=='function')return;
    document.addEventListener('visibilitychange',()=>document.hidden?this.handlePageBackground():this.handlePageForeground());
    if(typeof window!=='undefined'){
      window.addEventListener('pagehide',()=>this.handlePageBackground());
      window.addEventListener('pageshow',event=>{if(event.persisted&&['PLAYING','CELEBRATING'].includes(this.state))this.handlePageBackground();this.handlePageForeground();});
    }
  }

  recoverAudio() {
    this.voiceQueue?.cancel();this.clearPlayWordCue();this.audioManager?.recoverFromGesture?.({rebuild:true});
    if(this.wordFocus?.overlay)this.wordFocus.play(this.wordFocus.lastReview!==false);
    else if(this.currentWord&&this.state==='PLAYING')this.replayWord();
    else if(this.animalSpeech?.active&&!this.animalSpeech.paused&&!this.animalSpeech.done)this.animalSpeech.replay();
  }

  presentWord(word,hitX,hitY,audioDone,{review=false}={}) {
    const token=this.wordPresentationToken=(this.wordPresentationToken||0)+1;
    this.currentWord=word;
    this.wordIsReview=review;
    this.wordPlaybackReview=review;
    this.wordReplayReady=false;
    this.wordReplayDwell=0;
    this.wordReplayHover=false;
    this.wordElapsed=0;this.wordActiveElapsed=0;this.wordGestureReplayCount=0;
    this.wordClosingRemaining=0;
    this.wordQuietElapsed=0;
    this.wordAudioDone=false;
    this.wordPresentationRemaining=1;
    this.uiManager?.showWordPopup?.(word,hitX,hitY);
    this.waitForWordAudio(audioDone,token);
  }

  replayWord({gesture=false}={}) {
    if(this.state!=='PLAYING'||!this.currentWord||(gesture&&(this.wordGestureReplayCount||0)>=1))return;
    if(gesture)this.wordGestureReplayCount=(this.wordGestureReplayCount||0)+1;else this.wordActiveElapsed=0;
    const token=this.wordPresentationToken=(this.wordPresentationToken||0)+1;
    this.wordPlaybackReview=true;
    this.wordElapsed=0;this.wordQuietElapsed=0;this.wordClosingRemaining=0;this.wordAudioDone=false;
    this.wordReplayReady=false;this.wordReplayDwell=0;this.wordReplayHover=false;
    const anchor=this.uiManager?.wordPopupAnchor;
    this.uiManager?.showWordPopup?.(this.currentWord,anchor?.x??.5,anchor?.y??.5);
    this.waitForWordAudio(this.audioManager?.playWord?.(this.currentWord.id,{review:true}),token);
  }

  updateWordReplay(dt) {
    this.wordReplayHover=false;
    if((this.wordGestureReplayCount||0)>=1){this.wordReplayDwell=0;this.uiManager?.setWordReplayProgress?.(0);return;}
    const target=this.uiManager?.getWordReplayTarget?.();
    if(!target || this.wordElapsed<.8)return;
    const v=getViewport();
    const tips=this.bubbleManager?.getInteractionTips?.(this.bubbleManager.latestTrackedPlayers,v.width,v.height)||[];
    const touching=tips.some(t=>Math.abs(t.px-target.x)<=target.width/2 && Math.abs(t.py-target.y)<=target.height/2);
    this.wordReplayHover=touching && this.wordReplayReady;
    if(!touching){this.wordReplayReady=true;this.wordReplayDwell=0;}
    else if(this.wordReplayReady){
      this.wordReplayDwell+=dt;
      if(this.wordReplayDwell>=.35)this.replayWord({gesture:true});
    }
    this.uiManager?.setWordReplayProgress?.(this.wordReplayDwell/.35);
  }

  waitForWordAudio(done,token) {
    const finish=()=>{if(token===this.wordPresentationToken)this.wordAudioDone=true;};
    Promise.resolve(done).then(finish,finish);
  }

  updateWordPresentation(deltaSeconds) {
    if(!this.wordPresentationRemaining)return;
    if(this.wordClosingRemaining>0){
      this.wordClosingRemaining=Math.max(0,this.wordClosingRemaining-deltaSeconds);
      if(this.wordClosingRemaining>0)return;
      this.wordPresentationRemaining=0;
      this.currentWord=null;
      this.uiManager?.clearWordPopup?.();
      const deliver=this.pendingWordDelivery;
      this.pendingWordDelivery=null;
      deliver?.();
      return;
    }
    this.wordElapsed+=deltaSeconds;this.wordActiveElapsed=(this.wordActiveElapsed||0)+deltaSeconds;
    this.updateWordReplay(deltaSeconds);
    if(this.wordAudioDone)this.wordQuietElapsed+=deltaSeconds;
    // A quiet reading beat, then a full exit, before the animal responds.
    if((this.wordElapsed>=(this.wordPlaybackReview?1.5:2.8) && this.wordAudioDone && this.wordQuietElapsed>=(this.wordPlaybackReview?.25:.4) && !this.wordReplayHover) || this.wordElapsed>=12 || this.wordActiveElapsed>=18){
      this.wordClosingRemaining=.2;
      if(!this.wordAudioDone)this.audioManager?.setRecoveryNeeded?.(true);
      this.audioManager?.stopWord?.();
      this.uiManager?.clearWordPopup?.(true);
    }
  }

  cancelWordPresentation() {
    this.wordPresentationToken=(this.wordPresentationToken||0)+1;
    this.wordPresentationRemaining=0;
    this.wordClosingRemaining=0;
    this.pendingWordDelivery=null;
    this.currentWord=null;
    this.audioManager?.stopWord?.();
    this.uiManager?.clearWordPopup?.();
  }

  // Both orientations are playable. Resizing never interrupts an active rescue.
  setupOrientationHandler() {
    if(typeof document==='undefined')return;
    const overlay=document.getElementById('orientation-modal');
    overlay?.classList.add('hidden');
    this.isOrientationPaused=false;
  }

  // One active-time clock for the character, scenery and energy feedback.
  updateFrame(deltaSeconds) {
    if (this.state !== 'PAUSED') {
      if(this.state==='PLAYING'||(this.state==='CELEBRATING'&&!this.resultVisible))this.speechPolicy?.update(deltaSeconds);
      this.animalSpeech?.update(deltaSeconds);
      if(this.wordCueRemaining>0){this.wordCueRemaining=Math.max(0,this.wordCueRemaining-deltaSeconds);if(!this.wordCueRemaining)this.uiManager?.clearWordCue?.();}
      this.updateWordPresentation(deltaSeconds);
      this.gameTime = (this.gameTime || 0) + deltaSeconds;
      this.balloon?.update(deltaSeconds, this.gameTime);
      if(!this.friendInteraction?.active){
        this.rescueAnimal?.setAnticipation?.(this.state==='PLAYING'&&!!this.bubbleManager?.isNearHand);
        this.rescueAnimal?.setAttentionTarget?.(this.bubbleManager?.activeBubble?.group.position, this.bubbleManager?.energyProjectiles?.at(-1)?.mesh.position);
      }
      this.rescueAnimal?.update(deltaSeconds, this.gameTime);
      this.bubbleManager?.update(deltaSeconds, this.gameTime);
      if(this.state==='PLAYING' && this.bubbleManager?.handsAgeSeconds<.18 && this.bubbleManager.checkHandCollisions(this.bubbleManager.latestTrackedPlayers))this.onBubblePopped();
      if(this.friendInteraction?.active){const v=getViewport();this.friendInteraction.update(deltaSeconds,this.bubbleManager?.getInteractionTips(this.bubbleManager.latestTrackedPlayers,v.width,v.height)||[]);}
      this.sceneManager?.update(deltaSeconds);
      if(this.celebrationAccessories && typeof window!=='undefined')this.celebrationAccessories.update(deltaSeconds,getViewport().width,getViewport().height);
      if (this.state === 'PLAYING') this.uiManager?.setInteractionHint?.(this.uiManager.wordCue||this.uiManager.animalSpeechCard?'':this.bubbleManager?.getInteractionHint?.()||'');
      if (this.photoRemaining !== null && this.photoRemaining !== undefined && this.state === 'CELEBRATING') {
        if (!this.hasLiveCamera()) this.showVictoryResult(false);
        else {
          const present = (this.lastPlayers?.length || 0) >= (this.playerMode === 'coop' ? 2 : 1) && performance.now() - (this.lastPlayersReceivedAt || 0) < 700;
          if (present) this.photoRemaining = Math.max(0, this.photoRemaining - deltaSeconds);
          this.uiManager?.setPhotoCountdown?.(present ? Math.max(1, Math.ceil(this.photoRemaining)) : '回来一起拍合影吧');
          if (this.photoRemaining <= 0) this.photoCapturePending = true;
        }
      }
      if (this.autoNextDeadline) {
        const present = this.isDemoMode || ((this.lastPlayers?.length || 0) >= (this.playerMode === 'coop' ? 2 : 1) && performance.now() - (this.lastPlayersReceivedAt || 0) < 700);
        this.autoNextAwaySeconds = present ? 0 : (this.autoNextAwaySeconds || 0) + deltaSeconds;
        if (this.autoNextAwaySeconds > 1) this.cancelAutoNext(true);
        else this.uiManager?.setAutoNextCountdown?.(Math.max(0, Math.ceil((this.autoNextDeadline-performance.now())/1000)));
      }
      if (this.waitingForEscape && this.state === 'CELEBRATING' && this.rescueAnimal?.state === 'ESCAPED') {
        this.showVictoryWhenReady();
      }
    }
    this.sceneManager?.render();
    // Read WebGL immediately after rendering; no preserveDrawingBuffer needed.
    if (this.photoCapturePending && this.state === 'CELEBRATING') this.captureVictoryPhoto();
  }

  renderLoop() {
    const now = performance.now();
    const dt = Math.min((now - (this.lastFrameTime || now)) / 1000, 0.1);
    this.lastFrameTime = now;
    if (!this.manualTime) this.updateFrame(dt);
    requestAnimationFrame(() => this.renderLoop());
  }

  renderGameToText() {
    const bubble = this.bubbleManager?.activeBubble;
    const animal = this.rescueAnimal;
    const camera = this.sceneManager?.camera;
    const screen = pos => {
      if (!pos || !camera) return null;
      const p = pos.clone().project(camera);
      return { x: Math.round((p.x+1)/2*getViewport().width+getViewport().left), y: Math.round((1-p.y)/2*getViewport().height+getViewport().top) };
    };
    return JSON.stringify({
      coordinates:'screen pixels; origin top-left; x right, y down',
      mode:this.state, demo:this.isDemoMode, score:this.collectedCount, target:this.targetCount, combo:this.bubbleManager?.comboCount||this.comboCount||0, animalId:this.activeAnimalId,stage:this.sceneManager?.stageId,stageName:this.sceneManager?.stageName,bgmStage:this.audioManager?.currentStageId||this.sceneManager?.stageId||"forest", tracking:this.poseDetector?.metrics,autoNext:this.autoNextDeadline?Math.max(0,Math.ceil((this.autoNextDeadline-performance.now())/1000)):null,celebrationDecorations:this.celebrationAccessories?.slots.filter(s=>s.prop.visible).map(s=>s.prop.name),
      animalSpeech:this.animalSpeech?.toJSON()||null,
      flowLearning:{word:this.lastPlayWord?.word||null,cue:this.wordCueRemaining>0?this.cueWord?.word:null,detail:this.wordFocus?.overlay?this.wordFocus.word?.word:null,voice:this.voiceQueue?.toJSON()||null,speechPolicy:this.speechPolicy?.toJSON()||null},
      wordLearning:{enabled:this.bubbleManager?.wordMode!==false, word:this.currentWord?.word||null, review:!!this.wordPlaybackReview, speaking:!!this.currentWord&&!this.wordAudioDone, elapsed:Math.round((this.wordElapsed||0)*10)/10},
      bubble:bubble ? {...screen(bubble.group.position), type:bubble.type,playStyle:bubble.playStyle,motionElapsed:Math.round((bubble.motionElapsed||0)*100)/100,ease:Math.round((this.bubbleManager.roundEase||0)*100)/100,hitsReceived:bubble.hitsReceived,leftTouched:bubble.leftTouched,rightTouched:bubble.rightTouched,merging:bubble.merging,protected:bubble.spawnElapsed<.4,assisted:!!bubble.assisted,ownerId:bubble.ownerId}:null,
      animal:animal ? {state:animal.state,emotion:animal.emotion,reaction:animal.reactionVariant,energy:animal.energyLevel,asset:animal.assetStatus,visible:animal.animalGroup.visible,...screen(animal.animalGroup.position)}:null,
      friendPlay:this.friendInteraction?.toJSON() || null,
      photoCountdown:this.photoRemaining ?? null, resultVisible:!!this.resultVisible,
      energyInFlight:this.bubbleManager?.energyProjectiles.length || 0
    });
  }

}

// 自动初始化挂载 (如果在真实浏览器环境中)
if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  window.addEventListener('DOMContentLoaded', () => {
    window.gameInstance = new Game();
    window.render_game_to_text = () => window.gameInstance.renderGameToText();
    window.advanceTime = ms => {
      const game = window.gameInstance;
      game.manualTime = true;
      const frames = Math.max(1, Math.ceil(ms / (1000/60)));
      for (let i=0;i<frames;i++) game.updateFrame(ms/1000/frames);
    };
  });
}
