import {getViewport,getSafeInsets,getHudBottom} from './viewport.js';
import { getWordCn, getWordById, resolveAssetUrl } from './wordsConfig.js';
import {GAME_CONFIG,PLAYABLE_ANIMALS} from './config.js';
/**
 * UI 界面与交互状态管理器
 * 1. 5 个彩色发光圆点进度指示（免识字设计，直观友好）
 * 2. 模式选择（单人 / 亲子双人）
 * 3. 简短取景校准提示、常驻退出与首点能量动态伸手示范（留白避让、淡入与单次触碰淡出）
 * 4. 摄像头异常明确友好中文提示、重试与独立模拟模式入口（彻底隐藏校准弹层）
 * 5. 暂停、音效开关、起飞庆祝后家长选择
 * 6. 连击 Combo 呼吸彩虹微光浪圈与浮动连击徽章 (不挡人脸)
 */
export class UIManager {
  showAnimalSpeech(phrase,animalId,phase) {
    this.hideAnimalSpeech();
    const id=PLAYABLE_ANIMALS.includes(animalId)?animalId:'bunny';
    const card=document.createElement('section');card.className='animal-speech';
    card.setAttribute('role','status');card.setAttribute('aria-live','polite');
    const portrait=document.createElement('img');portrait.className='animal-speech-portrait';
    portrait.src=resolveAssetUrl(`/models/${id}-preview.png`);portrait.alt='';
    const body=document.createElement('div');body.className='animal-speech-body';
    const name=document.createElement('div');name.className='animal-speech-name';name.textContent=GAME_CONFIG.animals[id].name;
    const en=document.createElement('div');en.className='animal-speech-en';en.lang='en';en.textContent=phrase.en;
    const zh=document.createElement('div');zh.className='animal-speech-zh';zh.lang='zh-CN';zh.textContent=phrase.zh;
    const footer=document.createElement('div');footer.className='animal-speech-footer';
    const hint=document.createElement('span');hint.className='animal-speech-hint';hint.textContent='听朋友说一句';
    const replay=document.createElement('button');replay.type='button';replay.className='animal-speech-replay';replay.textContent='↻ 再听一次';replay.setAttribute('aria-label','再听一次这句话');replay.addEventListener('click',()=>this.handlers?.onReplaySpeech?.());
    footer.append(hint,replay);body.append(name,en,zh,footer);card.append(portrait,body);card.dataset.phase=phase;
    (document.getElementById('app')||document.body).appendChild(card);this.animalSpeechCard=card;
  }
  setAnimalSpeechListening(){
    this.animalSpeechCard?.classList.add('is-listening');
    const hint=this.animalSpeechCard?.querySelector('.animal-speech-hint');if(hint)hint.textContent='可以跟着说一说';
  }
  showSoundRecovery(show){document.getElementById('btn-recover-audio')?.classList.toggle('hidden',!show);}
  hideAnimalSpeech(animate=false){if(animate){this.animalSpeechCard?.classList.add('is-leaving');return;}this.animalSpeechCard?.remove();this.animalSpeechCard=null;}

  constructor(handlers = {}) {
    this.handlers = handlers; // { onStart, onSelectMode, onTogglePause, onResume, onRestart, onExit, onToggleAudio, onEnableDemo, onRetryCamera }
    this.isPaused = false;
    this.currentMode = 'single';
    this.soundMuted = false;
    this.hasDismissedGuide = false;

    this.dom = {};
    this.bindDOM();
    this.bindEvents();
  }

  bindDOM() {
    this.dom = {
      // 屏幕层
      startScreen: document.getElementById('start-screen'),
      calibrationScreen: document.getElementById('calibration-screen'),
      hud: document.getElementById('game-hud'),
      pauseModal: document.getElementById('pause-modal'),
      errorModal: document.getElementById('error-modal'),
      victoryModal: document.getElementById('victory-modal'),
      victoryCard: document.querySelector('.victory-card'),
      demoModeBanner: document.getElementById('demo-mode-banner'),
      poseAlert: document.getElementById('pose-lost-alert'),

      // 顶部条与控制
      btnSound: document.getElementById('btn-sound'),
      btnPause: document.getElementById('btn-pause'),
      modeBadge: document.getElementById('mode-badge'),
      progressDots: Array.from(document.querySelectorAll('.progress-dot')),

      animalChoices: Array.from(document.querySelectorAll('[data-animal]')),
      animalBrief: document.getElementById('animal-brief'),
      startChoices: document.querySelector('.start-choices'),
      startCard: document.querySelector('.start-card'),
      progressContainer: document.querySelector('.progress-dots-container'),
      victoryAnimalTitle: document.getElementById('victory-animal-title'),
      victoryAnimalCopy: document.getElementById('victory-animal-copy'),
      autoNextStatus: document.getElementById('auto-next-status'),
      btnStopAutoNext: document.getElementById('btn-stop-auto-next'),

      // 开始界面按钮
      btnModeSingle: document.getElementById('btn-mode-single'),
      btnModeCoop: document.getElementById('btn-mode-coop'),
      btnStartGame: document.getElementById('btn-start-game'),
      btnDemoMode: document.getElementById('btn-demo-mode'),

      // 校准界面
      btnReadyGo: document.getElementById('btn-ready-go'),
      btnCalibrationExit: document.getElementById('btn-calibration-exit'),

      // 暂停与错误
      btnResume: document.getElementById('btn-resume'),
      btnRestart: document.getElementById('btn-restart'),
      btnSwitchModeInPause: document.getElementById('btn-switch-mode-in-pause'),
      btnExit: document.getElementById('btn-exit'),
      errorMsg: document.getElementById('error-message'),
      btnRetryCamera: document.getElementById('btn-retry-camera'),
      btnErrorUseDemo: document.getElementById('btn-error-use-demo'),

      // 胜利结算
      btnPlayAgain: document.getElementById('btn-play-again'),
      btnVictoryExit: document.getElementById('btn-victory-exit'),

      // 伸手引导
      handGuide: document.getElementById('hand-guide-anim'),
      countdownOverlay: document.getElementById('countdown-overlay'),
      countdownNumber: document.getElementById('countdown-number'),
      countdownTip: document.querySelector('.countdown-tip'),

      // 连击光浪与徽章
      comboWave: document.getElementById('combo-rainbow-wave'),
      comboBadge: document.getElementById('combo-badge'),
      comboCountNum: document.getElementById('combo-count-num'),

      // 拍照快门闪光与拍立得合影
      cameraFlash: document.getElementById('camera-flash'),
      polaroidWrapper: document.getElementById('polaroid-wrapper'),
      polaroidImg: document.getElementById('polaroid-img'),
      btnSavePolaroid: document.getElementById('btn-save-polaroid'),
      btnRetakePhoto: document.getElementById('btn-retake-photo'),
      btnTakePhoto: document.getElementById('btn-take-photo'),
      btnCancelPhoto: document.getElementById('btn-cancel-photo'),
      btnNextFriend: document.getElementById('btn-next-friend'),
      photoCountdown: document.getElementById('photo-countdown'),
      interactionHint: document.getElementById('interaction-hint'),
      friendPlay: document.getElementById('friend-play'),
      friendTitle: document.getElementById('friend-play-title'),
      friendHint: document.getElementById('friend-play-hint'),
      btnFriendDone: document.getElementById('btn-friend-done'),

      // 森林营地图鉴
      btnOpenCamp: document.getElementById('btn-open-camp'),
      campBadgeCount: document.getElementById('camp-badge-count'),
      campModal: document.getElementById('camp-modal'),
      campGrid: document.getElementById('camp-grid'),
      campUnlockedCount: document.getElementById('camp-unlocked-count'),
      campTotalCount: document.getElementById('camp-total-count'),
      btnCloseCamp: document.getElementById('btn-close-camp')
    };
  }

  bindEvents() {
    this.dom.btnStopAutoNext?.addEventListener('click',()=>this.handlers.onStopAutoNext?.());
    for (const button of this.dom.animalChoices) button.addEventListener('click', () => {
      this.handlers.onSelectAnimal?.(button.dataset.animal);
    });
    // 模式选择
    this.dom.btnModeSingle.addEventListener('click', () => {
      this.setModeSelection('single');
    });
    this.dom.btnModeCoop.addEventListener('click', () => {
      this.setModeSelection('coop');
    });

    // 开始游戏
    this.dom.btnStartGame.addEventListener('click', () => {
      if (this.handlers.onStart) {
        this.handlers.onStart(this.currentMode);
      }
    });

    // 鼠标模拟模式
    this.dom.btnDemoMode.addEventListener('click', () => {
      if (this.handlers.onEnableDemo) {
        this.handlers.onEnableDemo(this.currentMode);
      }
    });

    // 校准完成确认
    this.dom.btnReadyGo.addEventListener('click', () => {
      this.hideCalibration();
      if (this.handlers.onReady) {
        this.handlers.onReady();
      }
    });

    // 校准页退出返回首页
    if (this.dom.btnCalibrationExit) {
      this.dom.btnCalibrationExit.addEventListener('click', () => {
        this.hideCalibration();
        if (this.handlers.onExit) {
          this.handlers.onExit();
        }
      });
    }

    // 音效开关
    this.dom.btnSound.addEventListener('click', () => {
      if (this.handlers.onToggleAudio) {
        const isMuted = this.handlers.onToggleAudio();
        this.soundMuted = isMuted;
        this.dom.btnSound.textContent = isMuted ? '🔇' : '🔊';
      }
    });

    // 暂停
    this.dom.btnPause.addEventListener('click', () => {
      this.showPause();
      if (this.handlers.onTogglePause) this.handlers.onTogglePause(true);
    });

    // 恢复
    this.dom.btnResume.addEventListener('click', () => {
      this.hidePause();
      if (this.handlers.onTogglePause) this.handlers.onTogglePause(false);
      if (this.handlers.onResume) this.handlers.onResume();
    });

    // 重新开始
    this.dom.btnRestart.addEventListener('click', () => {
      this.hidePause();
      if (this.handlers.onRestart) this.handlers.onRestart();
    });

    // 在暂停菜单中切换模式
    if (this.dom.btnSwitchModeInPause) {
      this.dom.btnSwitchModeInPause.addEventListener('click', () => {
        const targetMode = this.currentMode === 'single' ? 'coop' : 'single';
        this.setModeSelection(targetMode);
        if (this.handlers.onSelectMode) this.handlers.onSelectMode(targetMode);
        this.updatePauseSwitchButtonText();
      });
    }

    // 退出回首页
    this.dom.btnExit.addEventListener('click', () => {
      this.hidePause();
      if (this.handlers.onExit) this.handlers.onExit();
    });

    // 错误重试与降级
    this.dom.btnRetryCamera.addEventListener('click', () => {
      this.hideError();
      if (this.handlers.onRetryCamera) this.handlers.onRetryCamera();
    });
    this.dom.btnErrorUseDemo.addEventListener('click', () => {
      this.hideError();
      if (this.handlers.onEnableDemo) this.handlers.onEnableDemo(this.currentMode);
    });

    // 胜利再玩一次
    this.dom.btnPlayAgain.addEventListener('click', () => {
      this.hideVictory();
      if (this.handlers.onRestart) this.handlers.onRestart();
    });
    this.dom.btnVictoryExit.addEventListener('click', () => {
      this.hideVictory();
      if (this.handlers.onExit) this.handlers.onExit();
    });

    // 保存拍立得合影（保存并智能冻结自动跳转）
    this.dom.btnSavePolaroid?.addEventListener('click', () => {
      this.handlers.onSavePolaroid?.();
      this.markPolaroidSaved();
      this.handlers.onStopAutoNext?.('keep_photo');
    });

    this.dom.btnFriendDone?.addEventListener('click',()=>this.handlers.onFriendDone?.());
    this.dom.btnRetakePhoto?.addEventListener('click', () => this.handlers.onRetakePhoto?.());
    this.dom.btnTakePhoto?.addEventListener('click', () => this.handlers.onTakePhoto?.());
    this.dom.btnCancelPhoto?.addEventListener('click', () => this.handlers.onCancelPhoto?.());
    this.dom.btnNextFriend?.addEventListener('click', () => this.handlers.onNextFriend?.());

    // 触碰结算弹窗区域即智能驻留冻结倒计时（不干扰「再玩一次」和「回首页」）
    this.dom.victoryModal?.addEventListener('pointerdown', (e) => {
      if (e.target?.closest?.('#btn-play-again, #btn-victory-restart, #btn-victory-exit')) return;
      this.handlers.onStopAutoNext?.(this.hasVictoryPhoto ? 'keep_photo' : 'keep_result');
    });

    document.getElementById('btn-recover-audio')?.addEventListener('click',()=>this.handlers.onRecoverAudio?.());
    document.getElementById('btn-open-vocabulary')?.addEventListener('click',()=>this.handlers.onOpenVocabulary?.());

    // 森林营地图鉴
    this.dom.btnOpenCamp?.addEventListener('click', () => {
      this.handlers.onOpenCamp?.();
    });
    this.dom.btnCloseCamp?.addEventListener('click', () => {
      this.hideCamp();
    });
  }

  setAnimalSelection(selection) {
    this.animalSelection=selection;
    for(const button of this.dom.animalChoices || []) {
      const selected=button.dataset.animal===selection;
      button.classList.toggle('selected',selected);button.setAttribute('aria-pressed',String(selected));
    }
    if(selection==='random'&&this.dom.animalBrief)this.dom.animalBrief.textContent='开局揭晓一位朋友；再玩一次会保留它，方便继续练习。';
  }

  configureAnimal(profile) {
    this.targetCount=profile.targetBubbles;
    const container=this.dom.progressContainer;
    if(container) {
      const dots=Array.from({length:this.targetCount},()=>{const dot=document.createElement('div');dot.className='progress-dot';dot.setAttribute('aria-hidden','true');return dot;});
      container.replaceChildren(...dots);container.dataset.target=String(this.targetCount);container.dataset.compact=String(this.targetCount>=8);container.style.setProperty('--energy-dot-size',this.targetCount>8?'22px':'26px');this.dom.progressDots=dots;
      container.setAttribute('role','progressbar');container.setAttribute('aria-valuemin','0');container.setAttribute('aria-valuemax',String(this.targetCount));
      container.setAttribute('aria-label',profile.name+'的彩虹能量');
    }
    if(this.dom.animalBrief)this.dom.animalBrief.textContent=`${profile.name}需要 ${profile.targetBubbles} 点能量。${profile.description} 不计时，慢慢来也没关系。`;
    if(this.dom.victoryAnimalTitle)this.dom.victoryAnimalTitle.textContent=`${profile.name}自由啦，谢谢你！`;
    if(this.dom.victoryAnimalCopy)this.dom.victoryAnimalCopy.textContent=profile.victoryText ? `${profile.targetBubbles} 份彩虹能量！${profile.victoryText}` : profile.escapeStyle==='trot' ? `${profile.targetBubbles} 份彩虹能量！橘子伸了个懒腰，摇着尾巴回森林啦。` : `${profile.targetBubbles} 份彩虹能量！萌萌跳回森林，还记得回头向你挥挥手。`;
    this.updateProgress(0);
  }

  setModeSelection(mode) {
    this.currentMode = mode;
    if (mode === 'single') {
      this.dom.btnModeSingle.classList.add('selected');
      this.dom.btnModeCoop.classList.remove('selected');
      this.dom.modeBadge.textContent = '👶 单人模式';
    } else {
      this.dom.btnModeSingle.classList.remove('selected');
      this.dom.btnModeCoop.classList.add('selected');
      this.dom.modeBadge.textContent = '👨‍👩‍👦 亲子双人合作';
    }
  }

  showStartScreen() {
    this.dom.startScreen.classList.remove('hidden');
    this.dom.calibrationScreen.classList.add('hidden');
    this.dom.hud.classList.add('hidden');
    this.dom.pauseModal.classList.add('hidden');
    this.dom.victoryModal.classList.add('hidden');
    this.hideCountdownOverlay();
    this.hideCombo();
    this.dom.demoModeBanner.classList.add('hidden');
    this.showHandGuide(false);
    this.hasDismissedGuide = false;
    this.resetProgress();
    if (this.dom.animalBrief) {
      this.dom.animalBrief.textContent = '选一位森林朋友，用食指送给它彩虹能量。';
    }
    if (this.dom.startChoices) this.dom.startChoices.scrollTop = 0;
    if (this.dom.startCard) this.dom.startCard.scrollTop = 0;
    this.setAnimalSelection?.(this.animalSelection || 'bunny');
  }

  hideStartScreen() {
    this.dom.startScreen.classList.add('hidden');
  }

  showCalibration() {
    this.dom.calibrationScreen.classList.remove('hidden');
    this.hideCombo();
  }

  hideCalibration() {
    this.dom.calibrationScreen.classList.add('hidden');
    this.hideCountdownOverlay();
  }

  showCountdownOverlay(numberText, tipText) {
    if (!this.dom.countdownOverlay) return;
    if (this.dom.countdownNumber) {
      if (this.dom.countdownNumber.textContent !== numberText) {
        this.dom.countdownNumber.textContent = numberText;
        // 重置动画
        this.dom.countdownNumber.style.animation = 'none';
        void this.dom.countdownNumber.offsetHeight;
        this.dom.countdownNumber.style.animation = 'countdownPop 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275) both';
      }
    }
    if (this.dom.countdownTip && tipText) {
      this.dom.countdownTip.textContent = tipText;
    }
    this.dom.countdownOverlay.classList.remove('hidden');
  }

  updateCountdownTip(tipText) {
    if (this.dom.countdownTip && tipText) {
      this.dom.countdownTip.textContent = tipText;
    }
  }

  hideCountdownOverlay() {
    if (this.dom.countdownOverlay) {
      this.dom.countdownOverlay.classList.add('hidden');
    }
  }

  setCalibrationReady(ready, text) {
    if (this.dom.btnReadyGo) {
      this.dom.btnReadyGo.disabled = !ready;
      this.dom.btnReadyGo.textContent = text;
      if (!ready) {
        this.dom.btnReadyGo.style.opacity = '0.6';
        this.dom.btnReadyGo.style.cursor = 'wait';
      } else {
        this.dom.btnReadyGo.style.opacity = '1.0';
        this.dom.btnReadyGo.style.cursor = 'pointer';
      }
    }
  }

  showHUD() {
    this.dom.hud.classList.remove('hidden');this.updateLayout();
  }

  hideHUD() {
    this.dom.hud.classList.add('hidden');
    this.hideCombo();
  }

  showPause() {
    this.isPaused = true;
    this.dom.pauseModal.classList.remove('hidden');
    this.showHandGuide(false);
    this.hideCombo();
  }

  hidePause() {
    this.isPaused = false;
    this.dom.pauseModal.classList.add('hidden');
  }

  showError(rawMessage) {
    let friendly = rawMessage || '未检测到可用摄像头或权限被拒绝。';
    if (typeof friendly === 'string') {
      if (friendly.includes('Permission denied') || friendly.includes('NotAllowedError')) {
        friendly = '摄像头权限已被拒绝，请在浏览器地址栏允许使用摄像头，或改用鼠标/触屏模拟模式体验哦 📷';
      } else if (friendly.includes('NotFoundError') || friendly.includes('DevicesNotFoundError')) {
        friendly = '未检测到可用的摄像头设备，请检查连接或改用鼠标/触屏模拟模式 📷';
      } else if (friendly.includes('NotReadableError') || friendly.includes('TrackStartError')) {
        friendly = '摄像头可能被其他程序占用，请关闭其他应用后重试，或改用模拟模式 📷';
      }
    }
    this.dom.errorMsg.textContent = friendly;
    this.dom.errorModal.classList.remove('hidden');
    this.hideCombo();
  }

  hideError() {
    this.dom.errorModal.classList.add('hidden');
  }

  setAutoNextCountdown(seconds, customMessage = null) {
    if(!this.dom.autoNextStatus)return;
    const text=customMessage || (seconds===null?(this.hasVictoryPhoto?'合影已为你保留，想玩时点击「再玩一次」':'本轮成果已保留，准备好再继续'):`${seconds} 秒后随机遇见下一位朋友`);
    if(this.dom.autoNextStatus.textContent!==text)this.dom.autoNextStatus.textContent=text;
    if(this.dom.btnStopAutoNext)this.dom.btnStopAutoNext.hidden=seconds===null;
  }

  markPolaroidSaved() {
    if (!this.dom.btnSavePolaroid) return;
    this.dom.btnSavePolaroid.textContent = '已发起下载 · 可再次下载';
    this.dom.btnSavePolaroid.classList.add('btn-saved');
  }

  showVictory({hasPhoto = false, canTakePhoto = false} = {}) {
    this.hasVictoryPhoto = hasPhoto;
    this.dom.btnTakePhoto?.classList.toggle('hidden',!canTakePhoto || hasPhoto);
    this.dom.victoryCard?.classList?.toggle?.('without-photo', !hasPhoto);
    this.dom.polaroidWrapper?.classList?.toggle?.('hidden', !hasPhoto);
    if (this.dom.btnSavePolaroid) {
      this.dom.btnSavePolaroid.textContent = '保存合影 📸';
      this.dom.btnSavePolaroid.classList.remove('btn-saved');
    }
    this.setInteractionHint('');
    this.dom.victoryModal.classList.remove('hidden');
    this.showHandGuide(false);
    this.hideCombo();
  }

  hideVictory() {
    this.dom.victoryModal.classList.add('hidden');
  }

  showDemoBanner(visible = true) {
    if (visible) {
      this.dom.demoModeBanner.classList.remove('hidden');
    } else {
      this.dom.demoModeBanner.classList.add('hidden');
    }
  }

  // 姿态丢失提示
  setPoseLostAlert(visible, customText = '哎呀，没有看到小手呢~ 请稍微后退一点站在摄像头前哦') {
    if (visible) {
      this.dom.poseAlert.textContent = customText;
      this.dom.poseAlert.classList.remove('hidden');
    } else {
      this.dom.poseAlert.classList.add('hidden');
    }
  }

  // 首点能量的动态动作示范引导 (放置于泡泡旁空白侧，>=12px 留白，首次命中后淡出且不再显示)
  updateLayout(){
    if(typeof document==='undefined'||!document.documentElement?.style)return;
    document.documentElement.style.setProperty('--hud-bottom',`${getHudBottom()}px`);
    if(this.dom.interactionHint)this.dom.interactionHint.style.top=`${getHudBottom()+8}px`;
    this.showHandGuide(false);
    this.positionWordPopup();
  }

  showHandGuide(show = true, bubbleScreenPos = null) {
    if (!this.dom.handGuide) return;

    if (!show || this.hasDismissedGuide) {
      if (!this.dom.handGuide.classList.contains('hidden')) {
        this.dom.handGuide.classList.add('fading-out');
        setTimeout(() => {
          this.dom.handGuide.classList.add('hidden');
          this.dom.handGuide.classList.remove('fading-out');
        }, 200);
      }
      return;
    }

    // 定位在泡泡旁边空白区域
    const winW = (typeof window !== 'undefined' ? getViewport().width : 1280) || 1280;
    const winH = (typeof window !== 'undefined' ? getViewport().height : 720) || 720;

    let posX = winW * 0.35;
    let posY = winH * 0.42;

    if (bubbleScreenPos) {
      // 位于泡泡一侧，至少留 16px
      const isLeft = bubbleScreenPos.x > winW * 0.5;
      posX = isLeft ? Math.max(20, bubbleScreenPos.x - 140) : Math.min(winW - 160, bubbleScreenPos.x + 80);
      posY = Math.max(getHudBottom()+40, Math.min(winH - 160-getSafeInsets().bottom, bubbleScreenPos.y));
    }

    if(winH<420)return;
    posX=Math.max(8+getSafeInsets().left,Math.min(winW-180-getSafeInsets().right,posX));
    this.dom.handGuide.style.left = `${posX}px`;
    this.dom.handGuide.style.top = `${posY}px`;
    this.dom.handGuide.classList.remove('hidden');
    this.dom.handGuide.classList.remove('fading-out');

    // 最多显示 3 秒后淡出
    if (this.guideAutoTimer) clearTimeout(this.guideAutoTimer);
    this.guideAutoTimer = setTimeout(() => {
      this.showHandGuide(false);
    }, 3000);
  }

  dismissHandGuidePermanently() {
    this.hasDismissedGuide = true;
    this.showHandGuide(false);
  }

  // 连击彩虹微光浪圈与徽章更新 (不挡人脸)
  updateCombo(comboCount) {
    if (!this.dom.comboWave || !this.dom.comboBadge) return;
    if (comboCount >= 2) {
      this.dom.comboWave.classList.remove('hidden');
      this.dom.comboBadge.classList.remove('hidden');
      if (this.dom.comboCountNum) {
        this.dom.comboCountNum.textContent = String(comboCount);
      }
      this.dom.comboBadge.style.animation = 'none';
      void this.dom.comboBadge.offsetHeight;
      this.dom.comboBadge.style.animation = 'comboBounce 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275)';

      this.dom.comboWave.classList.remove('combo-tier-1', 'combo-tier-2', 'combo-tier-3');
      if (comboCount >= 6) {
        this.dom.comboWave.classList.add('combo-tier-3');
      } else if (comboCount >= 4) {
        this.dom.comboWave.classList.add('combo-tier-2');
      } else {
        this.dom.comboWave.classList.add('combo-tier-1');
      }
    } else {
      this.hideCombo();
    }
  }

  hideCombo() {
    if (this.dom.comboWave) {
      this.dom.comboWave.classList.add('hidden');
      this.dom.comboWave.classList.remove('combo-tier-1', 'combo-tier-2', 'combo-tier-3');
    }
    if (this.dom.comboBadge) {
      this.dom.comboBadge.classList.add('hidden');
    }
  }

  // 更新 5 个圆点进度指示
  updateProgress(currentCount) {
    this.dom.progressContainer?.setAttribute('aria-valuenow',String(currentCount));
    this.dom.progressDots.forEach((dot, index) => {
      if (index < currentCount) {
        dot.classList.add('filled');
      } else {
        dot.classList.remove('filled');
      }
    });
  }

  resetProgress() {
    this.updateProgress(0);
  }

  // 拍立得快门轻微白光微闪烁
  triggerCameraFlash() {
    if (!this.dom.cameraFlash) return;
    this.dom.cameraFlash.classList.remove('hidden');
    this.dom.cameraFlash.classList.add('flash-active');
    setTimeout(() => {
      this.dom.cameraFlash?.classList.remove('flash-active');
      this.dom.cameraFlash?.classList.add('hidden');
    }, 180);
  }

  showFriendPlay(profile, reacted=false) {
    if(!this.dom.friendPlay)return;
    this.dom.friendPlay.classList.remove('hidden');
    this.dom.friendTitle.textContent=reacted?profile.reply:profile.title;
    this.dom.friendHint.textContent=profile.hint;
    this.setInteractionHint('');
  }

  hideFriendPlay() { this.dom.friendPlay?.classList.add('hidden'); }

  setPhotoCountdown(value) {
    const el = this.dom.photoCountdown;
    if (!el) return;
    el.classList.toggle('hidden', value === null);
    this.dom.btnCancelPhoto?.classList.toggle('hidden',value===null);
    if (value !== null) {
      const text = typeof value === 'number' ? `看镜头，合影倒数 ${value}` : value;
      if (el.textContent !== text) el.textContent = text;
    }
    this.setInteractionHint('');
  }

  setInteractionHint(text = '') {
    const el = this.dom.interactionHint;
    if (!el) return;
    if (this.lastInteractionHint === text) return;
    this.lastInteractionHint = text;
    el.classList.toggle('hidden', !text);
    if (el.textContent !== text) el.textContent = text;
    if (text) el.style.top = `${getHudBottom() + 8}px`;
  }

  // 设置拍立得合影预览
  setPolaroidImage(dataUrl, animalName = '小动物') {
    this.polaroidDataUrl = dataUrl;
    this.currentAnimalName = animalName;
    if (this.dom.polaroidImg && dataUrl) {
      this.dom.polaroidImg.src = dataUrl;
      this.dom.polaroidWrapper?.classList.remove('hidden');
    } else {
      this.dom.polaroidImg?.removeAttribute?.('src');
      this.dom.polaroidWrapper?.classList.add('hidden');
    }
  }

  // 打开森林营地图鉴模态框
  showCamp(campManager, audioManager) {
    if (!this.dom.campModal || !this.dom.campGrid) return;
    this.dom.campGrid.innerHTML = '';

    const rescues = campManager ? campManager.getRescues() : {};
    const unlockedCount = campManager ? campManager.getUnlockedCount() : 0;
    const totalCount = campManager ? campManager.getTotalRescues() : 0;

    if (this.dom.campUnlockedCount) this.dom.campUnlockedCount.textContent = String(unlockedCount);
    if (this.dom.campTotalCount) this.dom.campTotalCount.textContent = String(totalCount);

    const animals = [
      { id: 'bunny', name: '小兔 萌萌', preview: 'models/bunny-preview.png', title: '森林第一站', badge: '🐰' },
      { id: 'cat', name: '橘猫 橘子', preview: 'models/cat-preview.png', title: '耐心挑战', badge: '🐱' },
      { id: 'frog', name: '青蛙 呱呱', preview: 'models/frog-preview.png', title: '池塘探险', badge: '🐸' },
      { id: 'dog', name: '小狗 旺旺', preview: 'models/dog-preview.png', title: '活力挑战', badge: '🐶' },
      { id: 'dragon', name: '飞龙 翼翼', preview: 'models/dragon-preview.png', title: '云谷奇遇', badge: '🐲' },
      { id: 'goldenDragon', name: '金龙 小金', preview: 'models/goldenDragon-preview.png', title: '祥云漫游', badge: '🐉' }
    ];

    animals.forEach(animal => {
      const count = rescues[animal.id] || 0;
      const isUnlocked = count > 0;

      const item = document.createElement('div');
      item.className = `camp-animal-item ${isUnlocked ? 'unlocked' : 'locked'}`;
      item.setAttribute('role', 'button');
      item.setAttribute('tabindex', '0');
      item.setAttribute('aria-label', `${animal.name}，${isUnlocked ? `已解救 ${count} 次` : '探索中'}`);

      item.innerHTML = `
        <div class="camp-animal-avatar-wrapper">
          <img src="${animal.preview}" alt="${animal.name}" class="camp-animal-avatar" />
          <span class="camp-animal-badge">${animal.badge}</span>
        </div>
        <strong class="camp-animal-name">${animal.name}</strong>
        <span class="camp-animal-status">${isUnlocked ? `已解救 ${count} 次 ✨` : '探索中 🌲'}</span>
      `;

      item.addEventListener('click', () => {
        if (isUnlocked) {
          item.classList.remove('camp-card-bounce');
          void item.offsetWidth;
          item.classList.add('camp-card-bounce');
          if (audioManager && typeof audioManager.playAnimalSound === 'function') {
            audioManager.playAnimalSound(animal.id, 'escape');
          }
        } else {
          item.classList.remove('camp-card-shake');
          void item.offsetWidth;
          item.classList.add('camp-card-shake');
        }
      });

      this.dom.campGrid.appendChild(item);
    });

    this.dom.campModal.classList.remove('hidden');
  }

  hideCamp() {
    if (this.dom.campModal) {
      this.dom.campModal.classList.add('hidden');
    }
  }

  updateCampBadge(campManager) {
    if (!this.dom.campBadgeCount || !campManager) return;
    const unlocked = campManager.getUnlockedCount();
    this.dom.campBadgeCount.textContent = `${unlocked}/6`;
  }
  // 划破气泡浮现实物认知卡片 (高清实物大图 + 英文单词标牌 + 视听立体刺激)
  showWordPopup(word, hitX = 0.5, hitY = 0.5) {
    if (typeof document === "undefined") return;
    const wordData = typeof word === "string" ? getWordById(word) || { word, id: word, accent: "#ff6b81" } : word;
    if (!wordData || !wordData.word) return;

    const restoreFocus=document.activeElement===this.activeWordPopup?.replayButton;
    this.clearWordPopup();
    const popup = document.createElement("div");
    popup.className = "word-popup-card word-popup-pill";
    if (typeof popup.setAttribute === "function") {
      popup.setAttribute("role", "status");
      popup.setAttribute("aria-live", "off");
    }
    if (popup.style && typeof popup.style.setProperty === "function") {
      popup.style.setProperty("--word-accent", wordData.accent || "#ff6b81");
    }

    const normX = Math.min(0.84, Math.max(0.16, Number(hitX) || 0.5));
    const normY = Math.min(0.76, Math.max(0.20, Number(hitY) || 0.5));
    if (popup.style) {
      popup.style.left = `${(normX * 100).toFixed(1)}%`;
      popup.style.top = `${(normY * 100).toFixed(1)}%`;
    }

    const wordId = String(wordData.id || wordData.word || "").toLowerCase();
    const wordName = String(wordData.word || wordId).toLowerCase();

    // 1. 实物物品大照片/高清矢量图
    const photoFrame = document.createElement("button");
    photoFrame.className = "word-popup-photo-frame";
    photoFrame.setAttribute("type", "button");
    photoFrame.setAttribute("aria-label", `再听一次 ${wordName}`);
    photoFrame.addEventListener?.('click',()=>this.handlers?.onReplayWord?.());
    popup.replayButton=photoFrame;

    const rawSrc = wordData.itemImage || wordData.image || `images/words/items/${wordId}.png`;
    const fullImgSrc = resolveAssetUrl(rawSrc);
    const img = document.createElement("img");
    img.className = "word-popup-photo";
    img.src = fullImgSrc;
    img.alt = wordName;
    img.loading = "eager";
    const fallbacks=[...new Set([wordData.itemSvg,wordData.bubbleImage,wordData.bubbleSvg,wordData.svg].filter(Boolean).map(resolveAssetUrl))].filter(src=>src!==fullImgSrc);
    img.onerror=()=>{
      const next=fallbacks.shift();
      if(next)img.src=next;
      else img.onerror=null;
    };
    photoFrame.appendChild(img);
    const replayIcon=document.createElement('span');
    replayIcon.className='word-replay-icon';replayIcon.textContent='↻';replayIcon.setAttribute('aria-hidden','true');
    photoFrame.appendChild(replayIcon);
    popup.appendChild(photoFrame);

    const wordCn = wordData.zh || wordData.wordCn || wordData.chinese || getWordCn(wordId) || "";

    // 2. 醒目中英双语名牌 (大号英文 + 清晰中文)
    const badge = document.createElement("div");
    badge.className = "word-popup-badge";
    const textSpan = document.createElement("span");
    textSpan.className = "word-popup-text";
    textSpan.textContent = wordName;
    textSpan.setAttribute("lang", "en");
    badge.appendChild(textSpan);

    if (wordCn) {
      const cnSpan = document.createElement("span");
      cnSpan.className = "word-popup-cn";
      cnSpan.textContent = wordCn;
      cnSpan.setAttribute("lang", "zh-CN");
      badge.appendChild(cnSpan);
      popup.cnSpan = cnSpan;
      popup.textCn = cnSpan;
    }

    popup.appendChild(badge);

    popup.photo = img;
    popup.textSpan = textSpan;

    const container = document.getElementById("app") || document.getElementById("ui-layer") || document.body;
    if (container && typeof container.appendChild === "function") {
      container.appendChild(popup);
    }

    this.activeWordPopup=popup;
    this.wordPopupAnchor={x:normX,y:normY};
    this.positionWordPopup();
    if(restoreFocus)photoFrame.focus?.({preventScroll:true});
    return popup;
  }

  getWordReplayTarget() {
    const rect=this.activeWordPopup?.replayButton?.getBoundingClientRect?.();
    if(!rect)return null;
    const v=getViewport();
    return {x:rect.x+rect.width/2-v.left,y:rect.y+rect.height/2-v.top,width:rect.width,height:rect.height};
  }

  setWordReplayProgress(progress) {
    this.activeWordPopup?.style?.setProperty('--replay-progress',String(Math.min(1,Math.max(0,progress))));
  }

  positionWordPopup() {
    const card=this.activeWordPopup;
    if(!card)return;
    const v=getViewport(), safe=getSafeInsets(), anchor=this.wordPopupAnchor||{x:.5,y:.45};
    const halfW=(card.offsetWidth||196)/2, halfH=(card.offsetHeight||228)/2;
    const left=safe.left+12+halfW, right=v.width-safe.right-12-halfW;
    const top=Math.max(safe.top+12,getHudBottom()+12)+halfH;
    const bottom=v.height-safe.bottom-20-halfH;
    const clamp=(value,min,max)=>max<min?(min+max)/2:Math.max(min,Math.min(max,value));
    card.style.left=`${clamp(anchor.x*v.width,left,right)}px`;
    card.style.top=`${clamp(anchor.y*v.height,top,bottom)}px`;
  }

  setWordPopupPaused(paused) {
    if(this.activeWordPopup)this.activeWordPopup.style.visibility=paused?'hidden':'visible';
  }

  clearWordPopup(animate=false) {
    const card=this.activeWordPopup;
    if(animate && card?.classList){
      card.classList.add('word-card-leaving');
      // The timeout removes only this card, never a replacement from a new round.
      setTimeout(()=>{
        card.remove();
        if(this.activeWordPopup===card)this.activeWordPopup=null;
      },180);
    }else{
      card?.remove?.();
      this.activeWordPopup=null;
    }
  }
}
