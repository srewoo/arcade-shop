// WebAudio plumbing shared by every sound: lazy context creation on the first gesture, master gain -> limiter,
// a polyphony cap, a short queue for sounds requested while the context is still waking up, and a looping
// ambience bed.  The individual sound effects live in audio.js.
import { AUDIO } from './tuning.js';

export class AudioCore {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.volume = 1; // 0..1 user master volume (settings)
    this.paused = false;
    this._voices = 0;
    this._queue = []; // [{run, at}] sounds asked for before the context finished resuming
    this._ambience = null; // { src, gain, kind }
    this._ambienceKind = null;
  }

  get level() {
    return this.muted ? 0 : 0.5 * this.volume;
  }

  /** Create the context (needs a user gesture) and wake it up; sounds requested meanwhile are queued, not lost. */
  unlock() {
    try {
      if (!this.ctx) this._create();
      if (this.ctx.state === 'suspended') this.ctx.resume().then(() => this._flush(), () => {});
    } catch {
      this.ctx = null;
    }
  }

  _create() {
    const Ctor = window.AudioContext || window.webkitAudioContext;
    if (!Ctor) throw new Error('no WebAudio');
    this.ctx = new Ctor();
    this.master = this.ctx.createGain();
    this.master.gain.value = this.level;
    const lim = AUDIO.limiter;
    this.limiter = this.ctx.createDynamicsCompressor(); // master limiter: stacked crash layers can not clip
    this.limiter.threshold.value = lim.threshold;
    this.limiter.ratio.value = lim.ratio;
    this.limiter.knee.value = lim.knee;
    this.limiter.attack.value = lim.attack;
    this.limiter.release.value = lim.release;
    this.master.connect(this.limiter).connect(this.ctx.destination);
    const rate = this.ctx.sampleRate; // 1 s of white noise, reused (random start offsets) by every noise burst
    this.noiseBuf = this.ctx.createBuffer(1, rate, rate);
    const data = this.noiseBuf.getChannelData(0);
    for (let i = 0; i < rate; i++) data[i] = Math.random() * 2 - 1;
    this._applyAmbience();
  }

  _flush() {
    const now = performance.now();
    const queued = this._queue.splice(0);
    for (const q of queued) if (now - q.at <= AUDIO.queueMaxAgeMs && this.ready) q.run();
  }

  setMuted(muted) {
    this.muted = muted;
    if (this.master) this.master.gain.value = this.level;
  }

  setVolume(volume) {
    this.volume = Math.min(1, Math.max(0, volume));
    if (this.master) this.master.gain.value = this.level;
  }

  /** Pause: stop the ambience bed; a hidden / unfocused window also suspends the whole context. */
  setPaused(paused, { suspend = false } = {}) {
    this.paused = paused;
    this._applyAmbience();
    if (!this.ctx) return;
    if (paused && suspend) this.ctx.suspend().catch(() => {});
    else if (!paused && this.ctx.state === 'suspended') this.ctx.resume().then(() => this._flush(), () => {});
  }

  get ready() {
    return Boolean(this.ctx) && this.ctx.state === 'running' && !this.muted;
  }

  /** Run `fn` now, queue it while the context wakes up, or drop it (muted / over the voice cap). */
  _admit(fn, priority) {
    if (!this.ctx || this.muted) return;
    if (this.ctx.state === 'suspended' && !this.paused) {
      if (this._queue.length < AUDIO.maxVoices) this._queue.push({ run: fn, at: performance.now() });
      return;
    }
    if (!this.ready || (this._voices >= AUDIO.maxVoices && !priority)) return;
    fn();
  }

  _track(node) {
    this._voices++;
    node.onended = () => {
      this._voices = Math.max(0, this._voices - 1);
    };
  }

  /** Oscillator sweep f0 -> f1 over `dur` s with a 12 ms attack.  `priority` voices ignore the polyphony cap. */
  _tone(opts) {
    this._admit(() => this._toneNow(opts), opts.priority);
  }

  _toneNow({ type = 'sine', f0, f1 = f0, dur, gain = 0.2, delay = 0 }) {
    const t0 = this.ctx.currentTime + delay;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(f0, t0);
    osc.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t0 + dur);
    g.gain.setValueAtTime(1e-4, t0);
    g.gain.exponentialRampToValueAtTime(gain, t0 + 0.012);
    g.gain.exponentialRampToValueAtTime(1e-4, t0 + dur);
    osc.connect(g).connect(this.master);
    this._track(osc);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  }

  /** Low-passed noise burst with exponential decay. */
  _noise(opts) {
    this._admit(() => this._noiseNow(opts), opts.priority);
  }

  _noiseNow({ dur, gain = 0.2, freq = 400, delay = 0 }) {
    const t0 = this.ctx.currentTime + delay;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuf;
    const lp = this.ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = freq;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(gain, t0);
    g.gain.exponentialRampToValueAtTime(1e-4, t0 + dur);
    src.connect(lp).connect(g).connect(this.master);
    this._track(src);
    src.start(t0, Math.random() * 0.5);
    src.stop(t0 + dur + 0.02);
  }

  /** Looping filtered-noise bed: 'rain' (bright hiss), 'wind' (low swell) or null.  Respects volume, mute and pause. */
  setAmbience(kind) {
    this._ambienceKind = kind;
    this._applyAmbience();
  }

  _applyAmbience() {
    if (!this.ctx || !this.noiseBuf) return;
    const kind = this.paused ? null : this._ambienceKind;
    if (kind !== this._ambience?.kind) {
      this._stopAmbience();
      if (kind) this._startAmbience(kind);
    }
    if (this._ambience) {
      const target = this.muted ? 0 : AUDIO.ambienceGain;
      this._ambience.gain.gain.setTargetAtTime(target, this.ctx.currentTime, 0.4);
    }
  }

  _startAmbience(kind) {
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuf;
    src.loop = true;
    const filter = this.ctx.createBiquadFilter();
    filter.type = kind === 'rain' ? 'highpass' : 'lowpass';
    filter.frequency.value = kind === 'rain' ? 1800 : 380;
    const gain = this.ctx.createGain();
    gain.gain.value = 0;
    src.connect(filter).connect(gain).connect(this.master);
    src.start();
    this._ambience = { src, gain, kind };
  }

  _stopAmbience() {
    if (!this._ambience) return;
    const { src, gain } = this._ambience;
    gain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.2);
    src.stop(this.ctx.currentTime + 1);
    this._ambience = null;
  }
}
