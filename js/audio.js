export class AudioManager {
  constructor(getSettings) {
    this.getSettings = getSettings;
    this.ctx = null;
  }
  ensureContext() {
    if (this.ctx) return this.ctx;
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return null;
    try { this.ctx = new AudioCtx(); } catch { return null; }
    return this.ctx;
  }
  beep(type = 'click') {
    const settings = this.getSettings();
    if (!settings.sound) return;
    const ctx = this.ensureContext();
    if (!ctx) return;
    if (ctx.state === 'suspended') ctx.resume().catch(() => {});
    const presets = {
      click: [420, 0.04], correct: [660, 0.14], wrong: [150, 0.18], reveal: [520, 0.09], countdown: [300, 0.08], win: [780, 0.25]
    };
    const [freq, duration] = presets[type] || presets.click;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type === 'wrong' ? 'sawtooth' : 'sine';
    osc.frequency.value = freq;
    gain.gain.value = Math.max(0, Math.min(1, settings.sfxVolume ?? 0.6)) * 0.12;
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  }
}
