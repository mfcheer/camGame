/**
 * Web Audio API 音频管理器
 * 纯本地合成童趣音效：
 * 1. 泡泡破裂清脆水滴声 (Pop)
 * 2. 能量飞入气球升调音 (Whoosh & Chime)
 * 3. 进度点亮阶梯音 (C4, D4, E4, G4, C5)
 * 4. 起飞欢庆和弦乐 (Fanfare)
 */
export class AudioManager {
  constructor() {
    this.ctx = null;
    this.isMuted = false;
    this.initialized = false;
  }

  init() {
    if (this.initialized && this.ctx) {
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      return;
    }
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      this.ctx = new AudioContextClass();
      this.initialized = true;
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    return this.isMuted;
  }

  setMuted(muted) {
    this.isMuted = muted;
  }

  // 1. 泡泡碰破音效 (清脆、活泼、微弹)
  playPop() {
    if (this.isMuted || !this.ctx) return;
    this.init();

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    // 快速向上扫频再滑落，模拟水泡“啵”
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(780, now + 0.05);
    osc.frequency.exponentialRampToValueAtTime(450, now + 0.12);

    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.15);
  }

  // 2. 能量注入音效与进度点亮阶梯音
  playEnergyCharge(stepIndex = 1) {
    if (this.isMuted || !this.ctx) return;
    this.init();

    const now = this.ctx.currentTime;
    // 五步阶梯音高: 对应童谣常见的大调音阶 (C5, D5, E5, G5, A5 / C6)
    const pitches = [523.25, 587.33, 659.25, 783.99, 1046.50];
    const targetFreq = pitches[Math.min(stepIndex - 1, pitches.length - 1)];

    // 主音
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(targetFreq * 0.7, now);
    osc.frequency.exponentialRampToValueAtTime(targetFreq, now + 0.15);

    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.3, now + 0.08);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.46);

    // 泛音星星闪烁
    const shimmer = this.ctx.createOscillator();
    const shimmerGain = this.ctx.createGain();
    shimmer.type = 'sine';
    shimmer.frequency.setValueAtTime(targetFreq * 2, now + 0.05);

    shimmerGain.gain.setValueAtTime(0.12, now + 0.05);
    shimmerGain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

    shimmer.connect(shimmerGain);
    shimmerGain.connect(this.ctx.destination);
    shimmer.start(now + 0.05);
    shimmer.stop(now + 0.41);
  }

  // 3. 达成5个起飞欢庆和弦
  playCelebration() {
    if (this.isMuted || !this.ctx) return;
    this.init();

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
  }

  // 4. 自动就位 3-2-1 倒计时蜂鸣/提示音
  playCountdown(num = 3) {
    if (this.isMuted || !this.ctx) return;
    this.init();

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
  }

  // 5. 倒计时结束 GO! 欢快清脆起跑和弦
  playCountdownGo() {
    if (this.isMuted || !this.ctx) return;
    this.init();

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
  }
}
