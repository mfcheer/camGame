/**
 * UI 界面与交互状态管理器
 * 1. 5 个彩色发光圆点进度指示（免识字设计，直观友好）
 * 2. 模式选择（单人 / 亲子双人）
 * 3. 简短取景校准提示、常驻退出与首个泡泡动态伸手示范（留白避让、淡入与单次触碰淡出）
 * 4. 摄像头异常明确友好中文提示、重试与独立模拟模式入口（彻底隐藏校准弹层）
 * 5. 暂停、音效开关、起飞庆祝后家长选择
 * 6. 连击 Combo 呼吸彩虹微光浪圈与浮动连击徽章 (不挡人脸)
 */
export class UIManager {
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
      demoModeBanner: document.getElementById('demo-mode-banner'),
      poseAlert: document.getElementById('pose-lost-alert'),

      // 顶部条与控制
      btnSound: document.getElementById('btn-sound'),
      btnPause: document.getElementById('btn-pause'),
      modeBadge: document.getElementById('mode-badge'),
      progressDots: Array.from(document.querySelectorAll('.progress-dot')),

      animalChoices: Array.from(document.querySelectorAll('[data-animal]')),
      animalBrief: document.getElementById('animal-brief'),
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
      comboCountNum: document.getElementById('combo-count-num')
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
    if(this.dom.animalBrief)this.dom.animalBrief.textContent=`${profile.name}需要 ${profile.targetBubbles} 个泡泡。${profile.description} 不计时，慢慢来也没关系。`;
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
    this.dom.hud.classList.remove('hidden');
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

  setAutoNextCountdown(seconds) {
    if(!this.dom.autoNextStatus)return;
    const text=seconds===null?'自动开始已停止，可以慢慢选择。':`${seconds} 秒后随机遇见下一位朋友`;
    if(this.dom.autoNextStatus.textContent!==text)this.dom.autoNextStatus.textContent=text;
    if(this.dom.btnStopAutoNext)this.dom.btnStopAutoNext.hidden=seconds===null;
  }

  showVictory() {
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

  // 首个泡泡的动态动作示范引导 (放置于泡泡旁空白侧，>=12px 留白，首次命中后淡出且不再显示)
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
    const winW = (typeof window !== 'undefined' ? window.innerWidth : 1280) || 1280;
    const winH = (typeof window !== 'undefined' ? window.innerHeight : 720) || 720;

    let posX = winW * 0.35;
    let posY = winH * 0.42;

    if (bubbleScreenPos) {
      // 位于泡泡一侧，至少留 16px
      const isLeft = bubbleScreenPos.x > winW * 0.5;
      posX = isLeft ? Math.max(20, bubbleScreenPos.x - 140) : Math.min(winW - 160, bubbleScreenPos.x + 80);
      posY = Math.max(90, Math.min(winH - 180, bubbleScreenPos.y));
    }

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
}
