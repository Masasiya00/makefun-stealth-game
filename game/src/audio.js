// Ember Vault — synthesized sound, no audio files: footsteps, alerts and chimes
// made with the Web Audio API. Footstep volume follows the guard's distance,
// so you hear a patrol coming before you see it.
export class SoundBoard {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.master = null;
  }

  // Created on the first user gesture: browsers block audio before that.
  ensure() {
    if (!this.ctx) {
      try {
        const AC = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AC();
        this.master = this.ctx.createGain();
        this.master.gain.value = 0.5;
        this.master.connect(this.ctx.destination);
      } catch (err) { this.ctx = null; }
    }
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
  }

  toggleMute() {
    this.muted = !this.muted;
    return this.muted;
  }

  // A short filtered thud. volume 0..1, pitch shifts with the walker.
  footstep(volume, low) {
    if (!this.ctx || this.muted || volume <= 0.01) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(low ? 70 : 95, t);
    osc.frequency.exponentialRampToValueAtTime(45, t + 0.09);
    gain.gain.setValueAtTime(volume * 0.5, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
    osc.connect(gain);
    gain.connect(this.master);
    osc.start(t);
    osc.stop(t + 0.11);
  }

  // Two-note chime when a relic is pocketed.
  pickup() {
    if (!this.ctx || this.muted) return;
    const t = this.ctx.currentTime;
    [880, 1318].forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, t + i * 0.07);
      gain.gain.exponentialRampToValueAtTime(0.22, t + i * 0.07 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.07 + 0.3);
      osc.connect(gain);
      gain.connect(this.master);
      osc.start(t + i * 0.07);
      osc.stop(t + i * 0.07 + 0.32);
    });
  }

  // Rising sting when a guard's suspicion maxes out and the chase begins.
  alert() {
    if (!this.ctx || this.muted) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(220, t);
    osc.frequency.linearRampToValueAtTime(440, t + 0.35);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.16, t + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
    osc.connect(gain);
    gain.connect(this.master);
    osc.start(t);
    osc.stop(t + 0.42);
  }

  // Soft low note when a guard grows suspicious — the warning before the sting.
  suspicious() {
    if (!this.ctx || this.muted) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = 330;
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.12, t + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
    osc.connect(gain);
    gain.connect(this.master);
    osc.start(t);
    osc.stop(t + 0.24);
  }

  // Little rising arpeggio for clearing a wing.
  winJingle() {
    if (!this.ctx || this.muted) return;
    const t = this.ctx.currentTime;
    [523, 659, 784, 1046].forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, t + i * 0.1);
      gain.gain.exponentialRampToValueAtTime(0.2, t + i * 0.1 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.1 + 0.35);
      osc.connect(gain);
      gain.connect(this.master);
      osc.start(t + i * 0.1);
      osc.stop(t + i * 0.1 + 0.37);
    });
  }
}
