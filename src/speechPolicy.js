// Speech frequency uses active game time, never wall-clock time spent in another app.
export const AUTO_ENGLISH_KEY = 'camgame:autoEnglish:v1';
export class SpeechPolicy {
  constructor(storage) {
    try { this.storage = storage === undefined ? globalThis.localStorage : storage; } catch {}
    this.automaticEnabled = false;
    try { this.automaticEnabled = this.storage?.getItem(AUTO_ENGLISH_KEY) === 'true'; } catch {}
    this.activeSeconds = 0;
    this.lastSpeechEnd = -Infinity;
    this.spokenThisRound = 0;
    this.serial = 0;
    this.speakingToken = null;
  }
  setAutomatic(enabled) {
    this.automaticEnabled = !!enabled;
    try { this.storage?.setItem(AUTO_ENGLISH_KEY, String(this.automaticEnabled)); } catch {}
  }
  beginRound() { this.spokenThisRound = 0; }
  update(dt) { this.activeSeconds += Math.max(0, dt); }
  allowAutomatic({busy = false} = {}) {
    if (!this.automaticEnabled || busy || this.speakingToken !== null ||
        this.spokenThisRound >= 1 || this.activeSeconds - this.lastSpeechEnd < 12) return false;
    this.spokenThisRound++;
    return true;
  }
  beginSpeech() { return this.speakingToken = ++this.serial; }
  endSpeech(token) {
    if (token !== this.speakingToken) return;
    this.speakingToken = null;
    this.lastSpeechEnd = this.activeSeconds;
  }
  toJSON() {
    return {automaticEnabled: this.automaticEnabled, spokenThisRound: this.spokenThisRound,
      cooldownSeconds: Math.max(0, Math.round((12 - (this.activeSeconds - this.lastSpeechEnd)) * 10) / 10)};
  }
}
