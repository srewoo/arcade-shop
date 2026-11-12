// WebAudio synthesis: engine hum, reverse beeper, bump, success and fail cues.
// One master gain + compressor; the context is created on the first user gesture.
import { CONFIG } from './config';

export interface AudioSettings {
  readonly sound: boolean;
  readonly volume: number;
}

type Ctx = AudioContext;

export class Sfx {
  private ctx: Ctx | null = null;
  private master: GainNode | null = null;
  private engine: { osc: OscillatorNode; sub: OscillatorNode; gain: GainNode; filter: BiquadFilterNode } | null = null;
  private settings: AudioSettings = { sound: true, volume: CONFIG.audio.defaultVolume };
  private beepAt = 0;

  configure(s: AudioSettings): void {
    this.settings = s;
    this.applyVolume();
  }

  private applyVolume(): void {
    if (!this.master || !this.ctx) return;
    const level = this.settings.sound ? (this.settings.volume / 100) * CONFIG.audio.master : 0;
    this.master.gain.setTargetAtTime(level, this.ctx.currentTime, 0.02);
  }

  /** Call from a user gesture. Safe to call repeatedly. */
  unlock(): void {
    if (this.ctx) {
      void this.ctx.resume();
      return;
    }
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return;
    const ctx = new Ctor();
    const comp = ctx.createDynamicsCompressor();
    const master = ctx.createGain();
    master.connect(comp);
    comp.connect(ctx.destination);
    this.ctx = ctx;
    this.master = master;
    this.applyVolume();
  }

  private tone(freq: number, dur: number, type: OscillatorType, gain: number, delay = 0, slideTo?: number): void {
    const { ctx, master } = this;
    if (!ctx || !master) return;
    const t = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    if (slideTo !== undefined) osc.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g);
    g.connect(master);
    osc.start(t);
    osc.stop(t + dur + 0.05);
  }

  private noise(dur: number, gain: number, cutoff: number): void {
    const { ctx, master } = this;
    if (!ctx || !master) return;
    const len = Math.floor(ctx.sampleRate * dur);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = ctx.createBufferSource();
    const filter = ctx.createBiquadFilter();
    const g = ctx.createGain();
    filter.type = 'lowpass';
    filter.frequency.value = cutoff;
    g.gain.value = gain;
    src.buffer = buf;
    src.connect(filter);
    filter.connect(g);
    g.connect(master);
    src.start();
  }

  click(): void { this.tone(520, 0.06, 'triangle', 0.25); }
  start(): void { this.tone(330, 0.12, 'triangle', 0.3); this.tone(495, 0.16, 'triangle', 0.3, 0.1); }
  hit(strength: number): void {
    const s = Math.min(1, 0.35 + strength / 6);
    this.noise(0.22, 0.7 * s, 900);
    this.tone(120, 0.2, 'square', 0.25 * s, 0, 60);
  }
  parked(stars: number): void {
    const notes = [523, 659, 784, 1047];
    notes.slice(0, 2 + stars).forEach((f, i) => this.tone(f, 0.28, 'triangle', 0.3, i * 0.11));
  }
  fail(): void { [440, 370, 294].forEach((f, i) => this.tone(f, 0.3, 'sawtooth', 0.18, i * 0.14)); }
  hold(progress: number): void { this.tone(600 + progress * 400, 0.05, 'sine', 0.12); }

  /** Per-frame engine and reverse beeper update. */
  drive(speed: number, throttle: number, running: boolean): void {
    const { ctx, master } = this;
    if (!ctx || !master) return;
    if (!this.engine) this.engine = this.buildEngine(ctx, master);
    const e = this.engine;
    const v = Math.min(1, Math.abs(speed) / CONFIG.car.maxForward);
    const base = 48 + v * 70 + Math.abs(throttle) * 12;
    const t = ctx.currentTime;
    e.osc.frequency.setTargetAtTime(base, t, 0.06);
    e.sub.frequency.setTargetAtTime(base / 2, t, 0.06);
    e.filter.frequency.setTargetAtTime(260 + v * 700, t, 0.08);
    e.gain.gain.setTargetAtTime(running ? CONFIG.audio.engineGain * (0.5 + 0.5 * Math.min(1, v + Math.abs(throttle))) : 0, t, 0.08);
    if (running && speed < -0.2 && t > this.beepAt) {
      this.tone(1000, 0.09, 'square', 0.05);
      this.beepAt = t + 0.65;
    }
  }

  private buildEngine(ctx: Ctx, master: GainNode): NonNullable<Sfx['engine']> {
    const osc = ctx.createOscillator();
    const sub = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    sub.type = 'square';
    filter.type = 'lowpass';
    gain.gain.value = 0;
    osc.connect(filter);
    sub.connect(filter);
    filter.connect(gain);
    gain.connect(master);
    osc.start();
    sub.start();
    return { osc, sub, gain, filter };
  }

  silence(): void { this.drive(0, 0, false); }
}
