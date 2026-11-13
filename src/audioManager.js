import {withDeadline} from './audioRecovery.js';
import { getWordById, getWordCn,resolveAssetUrl, WORDS_LIST } from './wordsConfig.js';
/**
 * Web Audio API 音频管理器
 * 1. 拟真卡通泡泡破裂声 (多振荡器调频微合成 FM + 水滴瞬态 + Combo 阶梯音阶步步爬升)
 * 2. 能量注入晶莹风铃与金币充盈感 (Chime & Crystal Shimmer)
 * 3. 6 位萌宠专属拟声与欢呼 (小兔、橘猫、小狗、青蛙、飞龙、金龙)
 * 4. 5 大主题场景轻快治愈童话 BGM (林间、溪流、果园、竹林、云谷)
 * 5. 起飞欢庆大和弦、3-2-1 倒计时提示音与 GO! 启程和弦
 */

// 5 大舞台专属童话伴奏音阶与和弦配置 (纯 Web Audio 程序化合成，无外部音频依赖)
const STAGE_TRACKS = {
  forest: {
    // 林间花径：C大调五声音阶，活泼轻快
    melody: [523.25, 0, 659.25, 0, 783.99, 880.00, 783.99, 0, 659.25, 0, 587.33, 659.25, 523.25, 0, 0, 0],
    bass: [130.81, 0, 0, 0, 174.61, 0, 0, 0, 196.00, 0, 0, 0, 130.81, 0, 0, 0],
    noteDuration: 0.32
  },
  brook: {
    // 溪边栈道：F大调波光琶音，温润水琴
    melody: [349.23, 440.00, 523.25, 659.25, 523.25, 440.00, 392.00, 440.00, 349.23, 523.25, 659.25, 783.99, 659.25, 523.25, 440.00, 0],
    bass: [174.61, 0, 0, 0, 130.81, 0, 0, 0, 146.83, 0, 0, 0, 174.61, 0, 0, 0],
    noteDuration: 0.30
  },
  orchard: {
    // 秋日果园：G大调暖阳摇摆，丰收木琴
    melody: [392.00, 0, 493.88, 587.33, 0, 659.25, 587.33, 0, 493.88, 0, 392.00, 493.88, 587.33, 0, 0, 0],
    bass: [196.00, 0, 0, 0, 146.83, 0, 0, 0, 196.00, 0, 0, 0, 146.83, 0, 0, 0],
    noteDuration: 0.28
  },
  bamboo: {
    // 竹林石径：东方空灵五音（羽/宫调式），悠扬竹风
    melody: [293.66, 0, 349.23, 0, 392.00, 440.00, 0, 0, 523.25, 0, 440.00, 0, 392.00, 349.23, 293.66, 0],
    bass: [146.83, 0, 0, 0, 110.00, 0, 0, 0, 130.81, 0, 0, 0, 146.83, 0, 0, 0],
    noteDuration: 0.38
  },
  cloud: {
    // 云上花园：梦幻八音盒，轻盈漂浮
    melody: [659.25, 0, 830.61, 987.77, 0, 1108.73, 987.77, 0, 830.61, 0, 659.25, 830.61, 987.77, 0, 0, 0],
    bass: [164.81, 0, 0, 0, 123.47, 0, 0, 0, 138.59, 0, 0, 0, 164.81, 0, 0, 0],
    noteDuration: 0.36
  }
};

export class AudioManager {
  constructor() {
    this.ctx = null;
    this.isMuted = false;
    this.initialized = false;

    // BGM 状态
    this.currentStageId = 'forest';
    this.bgmGainNode = null;
    this.bgmFilterNode = null;
    this.bgmInterval = null;
    this.bgmStep = 0;
    this.isBGMPlaying = false;
    this.isBGMPaused = false;

    // 英语单词音频发音缓存
    this.lastPlayedWord = null;
    this._wordAudioBuffers = new Map();
    this._wordAudioPromises = new Map();
    this._wordAudioElements = new Map();
  }

  init() {
    if(this.ctx?.state==='closed'){this.ctx=null;this.initialized=false;this.bgmGainNode=null;this.bgmFilterNode=null;}
    if (this.initialized && this.ctx) {
      this._requestContextResume();
      return;
    }
    const AudioContextClass = typeof window !== 'undefined' ? (window.AudioContext || window.webkitAudioContext) : null;
    if (AudioContextClass) {
      try {
        this.ctx = new AudioContextClass();
        this.initialized = true;
        this._setupBGMGraph();
        this._requestContextResume();

      } catch (e) {
        // 容错处理
      }
    }
  }

  _requestContextResume() {
    const ctx=this.ctx;
    if(this._audioInBackground)return;
    if(!ctx||!['suspended','interrupted'].includes(ctx.state)||typeof ctx.resume!=='function')return;
    if(this._resumeContext===ctx&&this._resumePromise)return;
    this._resumeContext=ctx;
    try{const pending=Promise.resolve(ctx.resume()).then(()=>ctx.state==='running',()=>false);
      this._resumePromise=pending;pending.finally(()=>{if(this._resumePromise===pending)this._resumePromise=null;});
    }catch{this._resumePromise=null;}
  }

  async ensureRunning() {
    this.init();const ctx=this.ctx;
    if(!ctx)return false;
    if(!ctx.state||ctx.state==='running')return true;
    this._requestContextResume();
    await withDeadline(this._resumePromise,600,false);
    return ctx===this.ctx&&ctx.state==='running';
  }

  // Call synchronously from a real tap before awaiting anything (mobile audio activation).
  recoverFromGesture({rebuild=false}={}) {
    this.markForeground();const recoveryToken=this._recoveryToken;
    if(rebuild&&this.ctx){
      this.stopWord();if(this.bgmInterval)clearInterval(this.bgmInterval);this.bgmInterval=null;
      try{this.ctx.close?.()?.catch?.(()=>{});}catch{}
      this.ctx=null;this.initialized=false;this.bgmGainNode=null;this.bgmFilterNode=null;this._resumePromise=null;this._resumeContext=null;
    }
    this.init();
    return this.ensureRunning().then(ok=>{
      if(recoveryToken!==this._recoveryToken)return false;
      if(ok){this.setRecoveryNeeded(false);if(this.isBGMPlaying&&!this.isBGMPaused&&!this.isMuted&&!this.bgmInterval)this._startBGMSequencer();}
      else if(!this.isMuted)this.setRecoveryNeeded(true);
      return ok;
    });
  }

  setRecoveryNeeded(needed) {
    this.recoveryNeeded=!!needed&&!this.isMuted;
    this.onRecoveryNeeded?.(this.recoveryNeeded);
  }

  markForeground() {this._recoveryToken=(this._recoveryToken||0)+1;this._audioInBackground=false;this._resumePromise=null;this._resumeContext=null;}

  suspendForBackground() {
    this._recoveryToken=(this._recoveryToken||0)+1;this._audioInBackground=true;this.stopWord();if(this.bgmInterval)clearInterval(this.bgmInterval);this.bgmInterval=null;
    try{this.ctx?.suspend?.()?.catch?.(()=>{});}catch{}
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    this._syncMuteState();
    return this.isMuted;
  }

  setMuted(muted) {
    this.isMuted = !!muted;
    this._syncMuteState();
  }

  _setupBGMGraph() {
    if (!this.ctx || typeof this.ctx.createGain !== 'function' || !this.ctx.destination) return;
    try {
      this.bgmGainNode = this.ctx.createGain();
      const now = this.ctx.currentTime || 0;
      this.bgmGainNode.gain.setValueAtTime(this.isMuted ? 0 : 0.08, now);

      if (typeof this.ctx.createBiquadFilter === 'function') {
        this.bgmFilterNode = this.ctx.createBiquadFilter();
        this.bgmFilterNode.type = 'lowpass';
        this.bgmFilterNode.frequency.setValueAtTime(4200, now);
        this.bgmFilterNode.connect(this.bgmGainNode);
      } else {
        this.bgmFilterNode = null;
      }

      this.bgmGainNode.connect(this.ctx.destination);
    } catch (e) {
      // 容错处理
    }
  }

  _syncMuteState() {
    if (this.isMuted) {this.stopWord();this.setRecoveryNeeded(false);}
    if (this.isMuted && this._wordAudioElements) {
      for (const a of this._wordAudioElements.values()) {
        try { a.pause(); } catch (e) {}
      }
    }
    if (!this.isMuted && this.isBGMPlaying && !this.isBGMPaused) {
      this.init();
      if (this.ctx && !this.bgmInterval) this._startBGMSequencer();
    }
    if (this.bgmGainNode && this.ctx && typeof this.ctx.currentTime === 'number') {
      try {
        const now = this.ctx.currentTime;
        this.bgmGainNode.gain.cancelScheduledValues(now);
        if (this.isMuted) {
          this.bgmGainNode.gain.setValueAtTime(0, now);
        } else if (this.isBGMPlaying && !this.isBGMPaused) {
          this.bgmGainNode.gain.linearRampToValueAtTime(0.08, now + 0.3);
        }
      } catch (e) {}
    }
  }

  // 1. 泡泡碰破音效 (拟真卡通水泡“啵~💦”与 Combo 阶梯音阶爬升)
  playPop(combo = 0) {
    if (this.isMuted || !this.ctx) return;
    this.init();
    if (!this.ctx || typeof this.ctx.createOscillator !== 'function') return;

    try {
      const now = this.ctx.currentTime;
      const COMBO_PITCHES = [
        480.0,   // combo 0: 标准清脆水泡
        523.25,  // combo 1: C5 (Do)
        587.33,  // combo 2: D5 (Re)
        659.25,  // combo 3: E5 (Mi)
        698.46,  // combo 4: F5 (Fa)
        783.99,  // combo 5: G5 (Sol)
        880.00,  // combo 6: A5 (La)
        987.77,  // combo 7: B5 (Si)
        1046.50  // combo 8+: C6 (高音Do)
      ];
      const baseFreq = COMBO_PITCHES[Math.min(Math.max(0, combo), COMBO_PITCHES.length - 1)];

      // 主载波振荡器 (拟真下沉回弹水泡体)
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';

      // 调频 FM 调制器 (创造水泡膜张力瞬间释放的噗润质感)
      const modOsc = this.ctx.createOscillator();
      const modGain = this.ctx.createGain();
      modOsc.type = 'sine';
      modOsc.frequency.setValueAtTime(baseFreq * 2.2, now);
      modGain.gain.setValueAtTime(baseFreq * 0.75, now);
      modGain.gain.exponentialRampToValueAtTime(1, now + 0.05);
      modOsc.connect(modGain);
      modGain.connect(osc.frequency);

      // 快速向上弹跳再下沉，模拟水泡“啵”
      osc.frequency.setValueAtTime(baseFreq * 0.85, now);
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.5, now + 0.025);
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.7, now + 0.09);

      const mainGainLevel = combo >= 2 ? Math.min(0.42, 0.32 + combo * 0.015) : 0.35;
      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(mainGainLevel, now + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      modOsc.start(now);
      modOsc.stop(now + 0.12);
      osc.start(now);
      osc.stop(now + 0.13);

      // 高频清脆水珠飞溅音 (Splash ping)
      const splash = this.ctx.createOscillator();
      const splashGain = this.ctx.createGain();
      splash.type = 'triangle';
      splash.frequency.setValueAtTime(baseFreq * 2.5, now + 0.005);
      splash.frequency.exponentialRampToValueAtTime(baseFreq * 3.6, now + 0.04);
      splash.frequency.exponentialRampToValueAtTime(baseFreq * 1.8, now + 0.08);

      splashGain.gain.setValueAtTime(0.01, now + 0.005);
      splashGain.gain.linearRampToValueAtTime(0.16 + (combo >= 2 ? 0.05 : 0), now + 0.012);
      splashGain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

      splash.connect(splashGain);
      splashGain.connect(this.ctx.destination);
      splash.start(now + 0.005);
      splash.stop(now + 0.10);

      // 连击 2+ 时的晶莹风铃谐波 (Combo Crystal Chime)
      if (combo >= 2) {
        const chime = this.ctx.createOscillator();
        const chimeGain = this.ctx.createGain();
        chime.type = 'sine';
        chime.frequency.setValueAtTime(baseFreq * 4.0, now + 0.01);
        chimeGain.gain.setValueAtTime(0.10 + Math.min(0.12, combo * 0.018), now + 0.01);
        chimeGain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
        chime.connect(chimeGain);
        chimeGain.connect(this.ctx.destination);
        chime.start(now + 0.01);
        chime.stop(now + 0.19);
      }
    } catch (e) {}
  }

  // 2. 能量注入音效：金属水晶风铃 (Chime) 与金币充盈感
  playEnergyCharge(stepIndex = 1, animalId = null) {
    if (this.isMuted || !this.ctx) return;
    this.init();
    if (!this.ctx || typeof this.ctx.createOscillator !== 'function') return;

    try {
      const now = this.ctx.currentTime;
      // 五步阶梯音高: 对应童谣常见的大调音阶 (C5, D5, E5, G5, A5 / C6)
      const pitches = [523.25, 587.33, 659.25, 783.99, 1046.50];
      const targetFreq = pitches[Math.min(Math.max(1, stepIndex) - 1, pitches.length - 1)];

      // 主音暖润丰盈层 (Body)
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(targetFreq * 0.72, now);
      osc.frequency.exponentialRampToValueAtTime(targetFreq, now + 0.12);

      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.28, now + 0.06);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.42);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.43);

      // 金币底蕴饱满膨胀层 (Low coin fullness)
      const coin = this.ctx.createOscillator();
      const coinGain = this.ctx.createGain();
      coin.type = 'sine';
      coin.frequency.setValueAtTime(targetFreq * 0.5, now);
      coin.frequency.exponentialRampToValueAtTime(targetFreq, now + 0.08);
      coinGain.gain.setValueAtTime(0.01, now);
      coinGain.gain.linearRampToValueAtTime(0.18, now + 0.04);
      coinGain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
      coin.connect(coinGain);
      coinGain.connect(this.ctx.destination);
      coin.start(now);
      coin.stop(now + 0.29);

      // 多层水晶风铃泛音 (Crystal Chimes)
      const chimeHarmonics = [2.0, 2.76, 4.2];
      chimeHarmonics.forEach((mult, i) => {
        const chime = this.ctx.createOscillator();
        const chimeGain = this.ctx.createGain();
        chime.type = 'sine';
        chime.frequency.setValueAtTime(targetFreq * mult, now + 0.03 * i);

        chimeGain.gain.setValueAtTime(0.01, now + 0.03 * i);
        chimeGain.gain.linearRampToValueAtTime(0.12 / (i + 1), now + 0.03 * i + 0.02);
        chimeGain.gain.exponentialRampToValueAtTime(0.001, now + 0.38 + i * 0.08);

        chime.connect(chimeGain);
        chimeGain.connect(this.ctx.destination);
        chime.start(now + 0.03 * i);
        chime.stop(now + 0.40 + i * 0.08);
      });

      if (animalId) {
        this.playAnimalSound(animalId, 'energy');
      }
    } catch (e) {}
  }

  // 3. 6 位萌宠专属童话拟声与欢叫
  playAnimalSound(animalId, type = 'energy') {
    if (this.isMuted || !this.ctx) return;
    this.init();
    if (!this.ctx || typeof this.ctx.createOscillator !== 'function') return;

    try {
      const id = animalId || 'bunny';
      switch (id) {
        case 'cat':
          this._playCatSound(type);
          break;
        case 'dog':
          this._playDogSound(type);
          break;
        case 'frog':
          this._playFrogSound(type);
          break;
        case 'dragon':
          this._playDragonSound(type);
          break;
        case 'goldenDragon':
          this._playGoldenDragonSound(type);
          break;
        case 'bunny':
        default:
          this._playBunnySound(type);
          break;
      }
    } catch (e) {}
  }

  _playCatSound(type) {
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';

    if (type === 'escape') {
      // 欢庆逃生：富有表现力的两段上扬“喵~~呜~！”
      osc.frequency.setValueAtTime(580, now);
      osc.frequency.exponentialRampToValueAtTime(1020, now + 0.16);
      osc.frequency.exponentialRampToValueAtTime(760, now + 0.38);

      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.26, now + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.40);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.41);
    } else {
      // 能量回应：软萌短促的上扬“喵~”
      osc.frequency.setValueAtTime(640, now);
      osc.frequency.exponentialRampToValueAtTime(920, now + 0.09);
      osc.frequency.exponentialRampToValueAtTime(780, now + 0.22);

      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.20, now + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.23);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.24);
    }
  }

  _playDogSound(type) {
    const now = this.ctx.currentTime;
    if (type === 'escape') {
      // 欢庆逃生：连跳双声欢跃“汪！汪！”
      for (const [offset, pitch] of [[0, 420], [0.15, 460]]) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(pitch, now + offset);
        osc.frequency.exponentialRampToValueAtTime(230, now + offset + 0.08);

        gain.gain.setValueAtTime(0.01, now + offset);
        gain.gain.linearRampToValueAtTime(0.24, now + offset + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.09);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + offset);
        osc.stop(now + offset + 0.10);
      }
    } else {
      // 能量回应：短促轻快“汪！”
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(360, now);
      osc.frequency.exponentialRampToValueAtTime(210, now + 0.075);

      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.22, now + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.085);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.09);
    }
  }

  _playFrogSound(type) {
    const now = this.ctx.currentTime;
    if (type === 'escape') {
      // 欢庆逃生：双音节圆润“呱~呱~！”
      for (const [offset, pStart, pEnd] of [[0, 190, 140], [0.17, 220, 155]]) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(pStart, now + offset);
        osc.frequency.exponentialRampToValueAtTime(pEnd, now + offset + 0.11);

        gain.gain.setValueAtTime(0.01, now + offset);
        gain.gain.linearRampToValueAtTime(0.18, now + offset + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.12);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + offset);
        osc.stop(now + offset + 0.13);
      }
    } else {
      // 能量回应：单音节“呱~”
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(185, now);
      osc.frequency.exponentialRampToValueAtTime(145, now + 0.10);

      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.16, now + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.11);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.12);
    }
  }

  _playDragonSound(type) {
    const now = this.ctx.currentTime;
    if (type === 'escape') {
      // 欢庆逃生：空灵翱翔升腾长鸣 (Dual whistle chord)
      for (const [freqStart, freqEnd] of [[880, 1174], [1320, 1760]]) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freqStart, now);
        osc.frequency.exponentialRampToValueAtTime(freqEnd, now + 0.45);

        gain.gain.setValueAtTime(0.01, now);
        gain.gain.linearRampToValueAtTime(0.16, now + 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.50);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.52);
      }
    } else {
      // 能量回应：轻柔空灵龙鸣
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(750, now);
      osc.frequency.exponentialRampToValueAtTime(1280, now + 0.12);
      osc.frequency.exponentialRampToValueAtTime(1050, now + 0.24);

      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.18, now + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.26);
    }
  }

  _playGoldenDragonSound(type) {
    const now = this.ctx.currentTime;
    if (type === 'escape') {
      // 欢庆逃生：祥云钟铃升腾和弦 (C5-E5-G5-C6)
      const chord = [523.25, 659.25, 783.99, 1046.50];
      chord.forEach((freq, idx) => {
        const time = now + idx * 0.08;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, time);

        gain.gain.setValueAtTime(0.01, time);
        gain.gain.linearRampToValueAtTime(0.18, time + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.55);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(time);
        osc.stop(time + 0.58);
      });
    } else {
      // 能量回应：金色天籁风铃
      const chord = [523.25, 1046.50, 1568.00];
      chord.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.02);

        gain.gain.setValueAtTime(0.01, now + idx * 0.02);
        gain.gain.linearRampToValueAtTime(0.15 / (idx + 1), now + idx * 0.02 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.32);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + idx * 0.02);
        osc.stop(now + 0.34);
      });
    }
  }

  _playBunnySound(type) {
    const now = this.ctx.currentTime;
    if (type === 'escape') {
      // 欢庆逃生：蹦跳高频唧啾
      for (const [offset, f1, f2] of [[0, 980, 1380], [0.12, 1180, 1680]]) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f1, now + offset);
        osc.frequency.exponentialRampToValueAtTime(f2, now + offset + 0.08);

        gain.gain.setValueAtTime(0.01, now + offset);
        gain.gain.linearRampToValueAtTime(0.20, now + offset + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.09);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + offset);
        osc.stop(now + offset + 0.10);
      }
    } else {
      // 能量回应：轻快短跳唧啾
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(950, now);
      osc.frequency.exponentialRampToValueAtTime(1420, now + 0.075);

      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.18, now + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.085);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.09);
    }
  }

  // 4. 起飞欢庆和弦乐 (Fanfare)
  playCelebration() {
    if (this.isMuted || !this.ctx) return;
    this.init();
    if (!this.ctx || typeof this.ctx.createOscillator !== 'function') return;

    try {
      const now = this.ctx.currentTime;
      const chords = [
        [523.25, 659.25, 783.99],          // C
        [587.33, 739.99, 880.00],          // D
        [659.25, 830.61, 987.77],          // E
        [783.99, 987.77, 1174.66, 1567.98] // G / C 终奏
      ];

      chords.forEach((chord, i) => {
        const time = now + i * 0.22;
        chord.forEach((freq) => {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = i === 3 ? 'sine' : 'triangle';
          osc.frequency.setValueAtTime(freq, time);

          gain.gain.setValueAtTime(0.15 / chord.length, time);
          gain.gain.exponentialRampToValueAtTime(0.001, time + (i === 3 ? 1.5 : 0.35));

          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start(time);
          osc.stop(time + (i === 3 ? 1.6 : 0.36));
        });
      });
    } catch (e) {}
  }

  // 5. 自动就位 3-2-1 倒计时提示音
  playCountdown(num = 3) {
    if (this.isMuted || !this.ctx) return;
    this.init();
    if (!this.ctx || typeof this.ctx.createOscillator !== 'function') return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      const freqs = { 3: 440.0, 2: 523.25, 1: 659.25 };
      const freq = freqs[num] || 523.25;

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.28, now + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.3);
    } catch (e) {}
  }

  // 6. 倒计时结束 GO! 欢快清脆起跑和弦
  playCountdownGo() {
    if (this.isMuted || !this.ctx) return;
    this.init();
    if (!this.ctx || typeof this.ctx.createOscillator !== 'function') return;

    try {
      const now = this.ctx.currentTime;
      const chord = [523.25, 659.25, 783.99, 1046.50];

      chord.forEach((freq, idx) => {
        const time = now + idx * 0.04;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = "triangle";
        osc.frequency.setValueAtTime(freq, time);

        gain.gain.setValueAtTime(0.18, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.5);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(time);
        osc.stop(time + 0.52);
      });
    } catch (e) {}
  }

  // 7. Q弹果冻大泡泡触碰弹性形变音效 (Duang~ 软糯回弹)
  playJellyBoing() {
    if (this.isMuted || !this.ctx) return;
    this.init();
    if (!this.ctx || typeof this.ctx.createOscillator !== 'function') return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(230, now);
      osc.frequency.exponentialRampToValueAtTime(120, now + 0.12);
      osc.frequency.exponentialRampToValueAtTime(160, now + 0.20);
      osc.frequency.exponentialRampToValueAtTime(95, now + 0.30);

      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.25, now + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.32);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.33);
    } catch (e) {}
  }

  // 8. 彩虹流光泡泡清脆滑音与微星光雨 (Crystal Glide & Stars)
  playRainbowGlide() {
    if (this.isMuted || !this.ctx) return;
    this.init();
    if (!this.ctx || typeof this.ctx.createOscillator !== 'function') return;

    try {
      const now = this.ctx.currentTime;
      const notes = [659.25, 783.99, 987.77, 1174.66, 1318.51, 1567.98, 2093.00];
      notes.forEach((freq, idx) => {
        const time = now + idx * 0.035;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, time);

        gain.gain.setValueAtTime(0.08, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.22);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(time);
        osc.stop(time + 0.23);
      });
    } catch (e) {}
  }

  // 9. 双人同心合力泡泡吸附合并破裂和弦 (Coop Heart Merge & Pop)
  playHeartMerge() {
    if (this.isMuted || !this.ctx) return;
    this.init();
    if (!this.ctx || typeof this.ctx.createOscillator !== 'function') return;

    try {
      const now = this.ctx.currentTime;
      const leftOsc = this.ctx.createOscillator();
      const rightOsc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      leftOsc.type = 'triangle';
      rightOsc.type = 'sine';

      leftOsc.frequency.setValueAtTime(440, now);
      leftOsc.frequency.exponentialRampToValueAtTime(659.25, now + 0.18);

      rightOsc.frequency.setValueAtTime(554.37, now);
      rightOsc.frequency.exponentialRampToValueAtTime(880.00, now + 0.18);

      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.22, now + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);

      leftOsc.connect(gain);
      rightOsc.connect(gain);
      gain.connect(this.ctx.destination);

      leftOsc.start(now);
      leftOsc.stop(now + 0.38);
      rightOsc.start(now);
      rightOsc.stop(now + 0.38);

      const chime = this.ctx.createOscillator();
      const chimeGain = this.ctx.createGain();
      chime.type = 'sine';
      chime.frequency.setValueAtTime(1318.51, now + 0.18);
      chimeGain.gain.setValueAtTime(0.12, now + 0.18);
      chimeGain.gain.exponentialRampToValueAtTime(0.001, now + 0.50);
      chime.connect(chimeGain);
      chimeGain.connect(this.ctx.destination);
      chime.start(now + 0.18);
      chime.stop(now + 0.52);
    } catch (e) {}
  }

  // 10. 胜利拍立得抓拍快门音效 (Ka-cha!)
  playCameraShutter() {
    if (this.isMuted || !this.ctx) return;
    this.init();
    if (!this.ctx || typeof this.ctx.createOscillator !== 'function') return;

    try {
      const now = this.ctx.currentTime;
      const click1 = this.ctx.createOscillator();
      const gain1 = this.ctx.createGain();
      click1.type = 'triangle';
      click1.frequency.setValueAtTime(1800, now);
      click1.frequency.exponentialRampToValueAtTime(400, now + 0.025);
      gain1.gain.setValueAtTime(0.24, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.028);
      click1.connect(gain1);
      gain1.connect(this.ctx.destination);
      click1.start(now);
      click1.stop(now + 0.03);

      const flap = this.ctx.createOscillator();
      const flapGain = this.ctx.createGain();
      flap.type = 'sine';
      flap.frequency.setValueAtTime(140, now + 0.025);
      flap.frequency.exponentialRampToValueAtTime(65, now + 0.075);
      flapGain.gain.setValueAtTime(0.18, now + 0.025);
      flapGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      flap.connect(flapGain);
      flapGain.connect(this.ctx.destination);
      flap.start(now + 0.025);
      flap.stop(now + 0.082);

      const click2 = this.ctx.createOscillator();
      const gain2 = this.ctx.createGain();
      click2.type = 'sine';
      click2.frequency.setValueAtTime(2400, now + 0.075);
      click2.frequency.exponentialRampToValueAtTime(800, now + 0.12);
      gain2.gain.setValueAtTime(0.20, now + 0.075);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.13);
      click2.connect(gain2);
      gain2.connect(this.ctx.destination);
      click2.start(now + 0.075);
      click2.stop(now + 0.135);
    } catch (e) {}
  }
  // 11. 划破气泡时播报对应英语单词发音 (Web Audio API 0延迟缓冲播放 + 标准美语少儿教学发音 + Fallback)
  getWordAudioUrl(wordId, {review = false, phrase = null} = {}) {
    if(phrase)return resolveAssetUrl(phrase.audio);
    const raw = String(wordId || "").trim().toLowerCase();
    const id = getWordById(raw)?.id || raw;
    const base = (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.BASE_URL) || "/";
    const cleanBase = base.endsWith("/") ? base : base + "/";
    return `${cleanBase}audio/words/${review ? "review/" : ""}${id}.mp3`;
  }

  async loadWordBuffer(wordId, {review = false, phrase = null} = {}) {
    const raw = String(wordId || "").trim().toLowerCase();
    const id = getWordById(raw)?.id || raw;
    if (!id) return null;
    const key = phrase ? `phrase:${id}` : review ? `review:${id}` : id;
    if (this._wordAudioBuffers.has(key)) return this._wordAudioBuffers.get(key);
    if (this._wordAudioPromises.has(key)) return this._wordAudioPromises.get(key);

    const promise = (async () => {
      if (typeof fetch === "undefined") return null;
      try {
        const url = this.getWordAudioUrl(id,{review,phrase});
        const controller=typeof AbortController!=='undefined'?new AbortController():null;
        const abort=setTimeout(()=>controller?.abort(),6500);
        let res;try{res=await withDeadline(fetch(url,controller?{signal:controller.signal}:undefined),7000,null);}finally{clearTimeout(abort);}
        if(!res)return null;
        if (!res.ok) throw new Error(`Failed to fetch word audio: ${res.status}`);
        const arrayBuffer = await res.arrayBuffer();
        this.init();
        if (!this.ctx || typeof this.ctx.decodeAudioData !== "function") return null;
        const audioBuffer = await withDeadline(this.ctx.decodeAudioData(arrayBuffer),3000,null);
        if(!audioBuffer)return null;
        this._wordAudioBuffers.set(key, audioBuffer);
        return audioBuffer;
      } catch (e) {
        return null;
      } finally {
        this._wordAudioPromises.delete(key);
      }
    })();

    this._wordAudioPromises.set(key, promise);
    return promise;
  }

  // Resolve only after the recording (or speech fallback) actually ends.
  playWord(wordId, {review = false, phrase = null} = {}) {
    this.stopWord();
    const raw = (typeof wordId === 'string' ? wordId : wordId?.id || '').trim().toLowerCase();
    const id = getWordById(raw)?.id || raw;
    if (!id || this.isMuted) return Promise.resolve();
    this.lastPlayedWord = id;
    this.lastWordReview = review;
    this.init();
    const token = this._wordToken;
    if (this.bgmGainNode && this.ctx && !this.isBGMPaused) {
      const g=this.bgmGainNode.gain, now=this.ctx.currentTime;
      try{g.cancelScheduledValues(now);g.setTargetAtTime(.025,now,.08);}catch{}
    }
    return new Promise(resolve=>{
      let finished=false,mediaAttempted=false,fallingBack=false,started=false,watch=null,startup=null,deadline=null;
      const current=()=>!finished&&token===this._wordToken&&!this.isMuted;
      const stopSource=()=>{const source=this._activeWordSource;this._activeWordSource=null;if(source){source.onended=null;try{source.stop();}catch{}}};
      const stopElement=()=>{const audio=this._activeWordElement;this._activeWordElement=null;if(audio){audio.onended=null;audio.onpause=null;audio.onerror=null;try{audio.pause();}catch{}}};
      const finish=(reason='ended')=>{
        if(finished)return;finished=true;clearInterval(watch);clearTimeout(startup);clearTimeout(deadline);stopSource();stopElement();
        if(this._wordFinish===finish)this._wordFinish=null;
        if(token===this._wordToken){
          this.lastVoiceStatus=reason;
          if(reason==='ended')this.setRecoveryNeeded(!!this.ctx?.state&&this.ctx.state!=='running');
          if(!this.isMuted&&!this.isBGMPaused&&this.bgmGainNode&&this.ctx){
            const g=this.bgmGainNode.gain,now=this.ctx.currentTime;try{g.cancelScheduledValues(now);g.setTargetAtTime(.08,now,.2);}catch{}
          }
        }
        resolve();
      };
      this._wordFinish=finish;
      const blocked=()=>{if(current())this.setRecoveryNeeded(true);};
      const fallback=()=>{
        if(fallingBack||!current()){if(!finished&&!current())finish('cancelled');return;}
        fallingBack=true;stopSource();stopElement();
        if(typeof window==='undefined'||!window.speechSynthesis||typeof SpeechSynthesisUtterance==='undefined'){finish('unavailable');return;}
        try{started=true;this._speakWordFallback(id,()=>finish(),review,phrase);}catch{finish('unavailable');}
      };
      const playElement=()=>{
        if(!current()){if(!finished)finish('cancelled');return;}
        if(mediaAttempted)return;mediaAttempted=true;stopSource();clearInterval(watch);watch=null;
        if(typeof Audio==='undefined'){fallback();return;}
        try{
          const audio=new Audio(this.getWordAudioUrl(id,{review,phrase}));this._activeWordElement=audio;audio.volume=.95;
          audio.onended=()=>finish();audio.onerror=fallback;
          audio.onpause=()=>{if(current()&&!audio.ended){blocked();finish('interrupted');}};
          if(typeof audio.currentTime==='number'){
            let mediaClock=audio.currentTime,advancedAt=Date.now();
            watch=setInterval(()=>{
              if(!current())return;
              if(audio.currentTime>mediaClock+.0001){mediaClock=audio.currentTime;advancedAt=Date.now();}
              if(!audio.ended&&Date.now()-advancedAt>(started?(this.voiceStallTimeoutMs||1500):(this.voiceStartupTimeoutMs||3000))){blocked();finish('stalled');}
            },250);watch?.unref?.();
          }
          const playing=audio.play();
          if(playing?.then)playing.then(()=>{if(current()){started=true;this.setRecoveryNeeded(!!this.ctx?.state&&this.ctx.state!=='running');}else try{audio.pause();}catch{};},error=>{
            if(error?.name==='NotAllowedError'){blocked();finish('blocked');}else fallback();
          });else started=true;
        }catch{fallback();}
      };
      const playBuffer=buffer=>{
        if(!current()){if(!finished)finish('cancelled');return;}
        if(mediaAttempted||fallingBack)return;
        if(!buffer||!this.ctx){playElement();return;}
        if(this.ctx.state&&this.ctx.state!=='running'){
          this.ensureRunning().then(ok=>{if(!current())return;if(ok)playBuffer(buffer);else playElement();});return;
        }
        try{
          const ctx=this.ctx,source=ctx.createBufferSource(),gain=ctx.createGain();this._activeWordSource=source;
          source.buffer=buffer;gain.gain.value=.95;source.connect(gain);gain.connect(ctx.destination);source.onended=()=>finish();source.start();started=true;this.setRecoveryNeeded(false);
          let clock=ctx.currentTime,advancedAt=Date.now();
          if(ctx.state)watch=setInterval(()=>{
            if(!current())return;
            if(ctx.currentTime>clock+.0001){clock=ctx.currentTime;advancedAt=Date.now();}
            if(ctx.state!=='running'||Date.now()-advancedAt>(this.voiceStallTimeoutMs||1500))playElement();
          },250);
          watch?.unref?.();
        }catch{playElement();}
      };
      startup=setTimeout(()=>{if(current()&&!started)playElement();},this.voiceStartupTimeoutMs||1800);startup?.unref?.();
      deadline=setTimeout(()=>{if(!current())return;blocked();finish('timeout');try{if(typeof window!=='undefined')window.speechSynthesis?.cancel();}catch{}},this.voiceTimeoutMs||16000);deadline?.unref?.();
      if(this.ctx&&typeof this.ctx.createBufferSource==='function')this.loadWordBuffer(id,{review,phrase}).then(playBuffer).catch(playElement);
      else playElement();
    });
  }

  // Phrases share the word voice channel, cancellation and BGM ducking.
  playPhrase(phrase) { return this.playWord(phrase.id,{phrase}); }
  stopPhrase() { this.stopWord(); }

  stopWord() {
    this._wordToken=(this._wordToken||0)+1;
    try{this._activeWordSource?.stop();}catch{}
    try{this._activeWordElement?.pause();}catch{}
    if(typeof window!=='undefined')window.speechSynthesis?.cancel();
    this._activeWordSource=null;this._activeWordElement=null;
    this._wordFinish?.('cancelled');
    if(!this.isMuted&&!this.isBGMPaused&&this.bgmGainNode&&this.ctx){try{this.bgmGainNode.gain.setTargetAtTime(.08,this.ctx.currentTime,.2);}catch{}}
  }

  _speakWordFallback(id, onDone=()=>{}, review=false, phrase=null) {
    try {
      const cfg=getWordById(id), zh=cfg?.zh||getWordCn(id), en=cfg?.word||id;
      const pair=[{text:zh,lang:'zh-CN'},{text:en,lang:'en-US'}].filter(p=>p.text);
      const phrases=phrase ? [{text:phrase.en,lang:'en-US'}] : review ? [{text:en,lang:'en-US'}] : [...pair,...pair];
      if(!phrases.length){onDone();return;}
      phrases.forEach((phrase,index)=>{
        const utterance=new SpeechSynthesisUtterance(phrase.text);
        utterance.lang=phrase.lang;utterance.rate=.9;utterance.pitch=1.05;
        utterance.onend=()=>{if(index===phrases.length-1)onDone();};
        utterance.onerror=onDone;
        window.speechSynthesis.speak(utterance);
      });
    } catch { onDone(); }
  }

  preloadWordAudios(wordIds = [], {review=false} = {}) {
    const ids = Array.isArray(wordIds) && wordIds.length > 0 ? wordIds : WORDS_LIST.map(word=>word.id);

    for (const id of ids) {
      this.loadWordBuffer(id,{review}).catch(() => {});
      if (typeof Audio !== "undefined") {
        if (!this._wordAudioElements) this._wordAudioElements = new Map();
        const key=review?`review:${id}`:id;
        if (!this._wordAudioElements.has(key)) {
          try {
            const a = new Audio(this.getWordAudioUrl(id,{review}));
            a.preload = "auto";
            this._wordAudioElements.set(key, a);
          } catch (e) {}
        }
      }
    }
  }

  // 7. 多场景童话 BGM 系统
  startBGM(stageId = 'forest') {
    this.currentStageId = stageId || 'forest';
    this.isBGMPlaying = true;
    this.isBGMPaused = false;

    if (this.isMuted || !this.ctx) return;
    this.init();
    if (!this.ctx || typeof this.ctx.createOscillator !== 'function') return;

    // 平滑淡入 (Fade In: 1.5s)
    if (this.bgmGainNode && typeof this.ctx.currentTime === 'number') {
      try {
        const now = this.ctx.currentTime;
        this.bgmGainNode.gain.cancelScheduledValues(now);
        this.bgmGainNode.gain.setValueAtTime(0, now);
        this.bgmGainNode.gain.linearRampToValueAtTime(0.08, now + 1.5);
      } catch (e) {}
    }
    if (this.bgmFilterNode && typeof this.ctx.currentTime === 'number') {
      try {
        const now = this.ctx.currentTime;
        this.bgmFilterNode.frequency.setValueAtTime(4200, now);
      } catch (e) {}
    }

    this._startBGMSequencer();
  }

  stopBGM(fadeDuration = 0.6) {
    this.isBGMPlaying = false;
    this.isBGMPaused = false;
    if (this.bgmInterval) {
      clearInterval(this.bgmInterval);
      this.bgmInterval = null;
    }
    if (this.bgmGainNode && this.ctx && typeof this.ctx.currentTime === 'number') {
      try {
        const now = this.ctx.currentTime;
        this.bgmGainNode.gain.cancelScheduledValues(now);
        this.bgmGainNode.gain.linearRampToValueAtTime(0.0001, now + fadeDuration);
      } catch (e) {}
    }
  }

  setBGMStage(stageId) {
    if (!stageId) return;
    this.currentStageId = stageId;
    this.bgmStep = 0;
  }

  pauseBGM() {
    this.isBGMPaused = true;
    if (this.ctx && typeof this.ctx.currentTime === 'number') {
      const now = this.ctx.currentTime;
      if (this.bgmFilterNode) {
        try {
          this.bgmFilterNode.frequency.cancelScheduledValues(now);
          this.bgmFilterNode.frequency.linearRampToValueAtTime(400, now + 0.3);
        } catch (e) {}
      }
      if (this.bgmGainNode && !this.isMuted) {
        try {
          this.bgmGainNode.gain.cancelScheduledValues(now);
          this.bgmGainNode.gain.linearRampToValueAtTime(0.02, now + 0.3);
        } catch (e) {}
      }
    }
  }

  resumeBGM() {
    this.init();
    this.isBGMPaused = false;
    if(this.isBGMPlaying&&!this.bgmInterval&&!this.isMuted)this._startBGMSequencer();
    if (!this.isBGMPlaying) {
      this.startBGM(this.currentStageId);
      return;
    }
    if (this.ctx && typeof this.ctx.currentTime === 'number') {
      const now = this.ctx.currentTime;
      if (this.bgmFilterNode) {
        try {
          this.bgmFilterNode.frequency.cancelScheduledValues(now);
          this.bgmFilterNode.frequency.linearRampToValueAtTime(4200, now + 0.4);
        } catch (e) {}
      }
      if (this.bgmGainNode && !this.isMuted) {
        try {
          this.bgmGainNode.gain.cancelScheduledValues(now);
          this.bgmGainNode.gain.linearRampToValueAtTime(0.08, now + 0.4);
        } catch (e) {}
      }
    }
  }

  fadeInBGM(duration = 1.5) {
    if (!this.bgmGainNode || !this.ctx || this.isMuted || typeof this.ctx.currentTime !== 'number') return;
    try {
      const now = this.ctx.currentTime;
      this.bgmGainNode.gain.cancelScheduledValues(now);
      this.bgmGainNode.gain.linearRampToValueAtTime(0.08, now + duration);
    } catch (e) {}
  }

  fadeOutBGM(duration = 1.0) {
    if (!this.bgmGainNode || !this.ctx || typeof this.ctx.currentTime !== 'number') return;
    try {
      const now = this.ctx.currentTime;
      this.bgmGainNode.gain.cancelScheduledValues(now);
      this.bgmGainNode.gain.linearRampToValueAtTime(0.0001, now + duration);
    } catch (e) {}
  }

  _startBGMSequencer() {
    if (this.bgmInterval) {
      clearInterval(this.bgmInterval);
      this.bgmInterval = null;
    }
    this.bgmStep = 0;
    const tickMs = 280;
    this.bgmInterval = setInterval(() => {
      if (!this.isBGMPlaying || this.isBGMPaused || this.isMuted || !this.ctx) return;
      this._tickBGM();
    }, tickMs);
    if (this.bgmInterval && typeof this.bgmInterval.unref === "function") {
      this.bgmInterval.unref();
    }
  }

  _tickBGM() {
    if (this.isMuted || !this.ctx) return;
    const stage = this.currentStageId || 'forest';
    const track = STAGE_TRACKS[stage] || STAGE_TRACKS.forest;
    const step = this.bgmStep % track.melody.length;
    const note = track.melody[step];
    if (note) {
      this._playBGMNote(note, false, track.noteDuration || 0.32);
    }
    const bass = track.bass[step];
    if (bass) {
      this._playBGMNote(bass, true, 0.55);
    }
    this.bgmStep++;
  }

  _playBGMNote(freq, isBass = false, duration = 0.32) {
    if (this.isMuted || !this.ctx) return;
    if (!freq || typeof this.ctx.createOscillator !== 'function') return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = isBass ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(freq, now);

      const peakGain = isBass ? 0.30 : 0.22;
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(peakGain, now + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

      osc.connect(gain);
      if (this.bgmFilterNode) {
        gain.connect(this.bgmFilterNode);
      } else if (this.bgmGainNode) {
        gain.connect(this.bgmGainNode);
      } else {
        gain.connect(this.ctx.destination);
      }

      osc.start(now);
      osc.stop(now + duration + 0.02);
    } catch (e) {}
  }
}
