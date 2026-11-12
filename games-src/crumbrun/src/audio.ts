// Original WebAudio sound effects: everything is synthesised, nothing is loaded.
// Graph: voices -> master gain (volume/mute) -> compressor -> destination.
import { FEEL } from './config/feel';

type Ctx = BaseAudioContext;
const G = FEEL.audio.gain;
const NOTE = (n: readonly number[]): readonly number[] => n;

export class Sfx {
  private ac: Ctx | null = null;
  private master: GainNode | null = null;
  private noiseBuf = new Map<number, AudioBuffer>();
  private lastSqueak = -1;
  private nextBeat = 0;
  private beatIdx = 0;
  muted = false;
  volume = 1;

  /** Must be called from a user gesture the first time. */
  unlock(): void {
    try {
      if (!this.ac) {
        const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (!Ctor) return;
        this.attach(new Ctor());
      }
      const live = this.ac as AudioContext;
      if (live.state === 'suspended') void live.resume();
    } catch {
      this.ac = null;
    }
  }

  /** Wire the graph onto any audio context (a real one, or an OfflineAudioContext in checks). */
  attach(ac: Ctx): void {
    const c = FEEL.audio.compressor;
    const comp = ac.createDynamicsCompressor();
    comp.threshold.value = c.threshold;
    comp.knee.value = c.knee;
    comp.ratio.value = c.ratio;
    comp.attack.value = c.attack;
    comp.release.value = c.release;
    comp.connect(ac.destination);
    this.master = ac.createGain();
    this.master.gain.value = this.level();
    this.master.connect(comp);
    this.ac = ac;
  }

  private level(): number {
    return this.muted ? 0 : this.volume * FEEL.audio.master;
  }

  private apply(): void {
    if (this.master && this.ac) this.master.gain.setTargetAtTime(this.level(), this.ac.currentTime, 0.02);
  }

  setMuted(m: boolean): void {
    this.muted = m;
    this.apply();
  }

  /** 0..1, from the settings slider. */
  setVolume(v: number): void {
    this.volume = Math.min(1, Math.max(0, v));
    this.apply();
  }

  private get live(): boolean {
    return this.ac !== null && !this.muted && this.volume > 0;
  }

  private now(): number {
    return this.ac ? this.ac.currentTime + 0.005 : 0;
  }

  private tone(freq: number, to: number, start: number, dur: number, vol: number, type: OscillatorType = 'sine'): void {
    const { ac, master } = this;
    if (!ac || !master) return;
    const o = ac.createOscillator();
    const g = ac.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, start);
    o.frequency.exponentialRampToValueAtTime(Math.max(20, to), start + dur);
    g.gain.setValueAtTime(0.0001, start);
    g.gain.exponentialRampToValueAtTime(vol, start + Math.min(0.02, dur / 3));
    g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
    o.connect(g).connect(master);
    o.start(start);
    o.stop(start + dur + 0.02);
  }

  /** Noise buffers are rendered once per duration and reused (no per-sound allocation). */
  private noiseBuffer(dur: number): AudioBuffer | null {
    const ac = this.ac;
    if (!ac) return null;
    const hit = this.noiseBuf.get(dur);
    if (hit) return hit;
    const len = Math.floor(ac.sampleRate * dur);
    const buf = ac.createBuffer(1, len, ac.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    this.noiseBuf.set(dur, buf);
    return buf;
  }

  private noise(start: number, dur: number, f0: number, f1: number, vol: number): void {
    const { ac, master } = this;
    const buf = this.noiseBuffer(dur);
    if (!ac || !master || !buf) return;
    const src = ac.createBufferSource();
    src.buffer = buf;
    const bp = ac.createBiquadFilter();
    bp.type = 'bandpass';
    bp.Q.value = 1.2;
    bp.frequency.setValueAtTime(f0, start);
    bp.frequency.exponentialRampToValueAtTime(f1, start + dur);
    const g = ac.createGain();
    g.gain.setValueAtTime(vol, start);
    g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
    src.connect(bp).connect(g).connect(master);
    src.start(start);
  }

  private notes(freqs: readonly number[], step: number, dur: number, vol: number, delay = 0): void {
    if (!this.live) return;
    const t = this.now() + delay;
    freqs.forEach((f, i) => this.tone(f, f * 1.003, t + i * step, dur, vol, 'triangle'));
  }

  /** Soft squeak per crumb, rate limited, with slightly random pitch. */
  squeak(): void {
    if (!this.live) return;
    const t = this.now();
    if (t - this.lastSqueak < FEEL.audio.squeakGapSec) return;
    this.lastSqueak = t;
    const f = 1500 + Math.random() * 500;
    this.tone(f, f * 1.45, t, 0.05, G.squeak, 'sine');
  }

  splash(): void {
    if (!this.live) return;
    const t = this.now();
    this.noise(t, 0.4, 2400, 500, G.splash);
    this.tone(500, 900, t + 0.05, 0.12, 0.05);
    this.tone(420, 760, t + 0.14, 0.1, 0.04);
  }

  /** Meow follows the splash a beat later so the two never stack into one loud transient. */
  meow(): void {
    if (!this.live) return;
    const t = this.now() + 0.12;
    this.tone(420, 760, t, 0.16, G.meow, 'sawtooth');
    this.tone(760, 480, t + 0.16, 0.26, G.meow, 'sawtooth');
    this.tone(1250, 1500, t, 0.4, 0.015, 'triangle');
  }

  jingleStart(): void { this.notes(NOTE([523.25, 659.25, 783.99, 659.25, 783.99, 1046.5]), 0.13, 0.2, G.jingle); }
  jingleClear(): void { this.notes(NOTE([392, 523.25, 659.25, 783.99, 659.25, 783.99, 1046.5, 1318.5]), 0.11, 0.22, G.jingle); }
  pistol(): void { this.notes(NOTE([880, 1318.5]), 0.07, 0.16, G.pistol); }
  cheese(): void { this.notes(NOTE([987.77, 1318.5]), 0.09, 0.2, G.cheese); }
  cheeseAppear(): void { this.notes(NOTE([1174.66, 1567.98]), 0.1, 0.14, G.cheese * 0.7); }
  extraLife(): void { this.notes(NOTE([659.25, 783.99, 987.77, 1318.5]), 0.08, 0.18, G.extraLife); }
  /** A cat slips out of the basket: a short pad blip. */
  release(): void { this.notes(NOTE([329.63, 392]), 0.07, 0.14, G.release); }
  /** Ticks while the drench is about to wear off. */
  drenchTick(): void {
    if (!this.live) return;
    const t = this.now();
    for (let i = 0; i < 4; i++) this.tone(1900, 1700, t + i * 0.4, 0.04, G.drenchTick, 'square');
  }
  drenchEnd(): void { this.notes(NOTE([523.25, 392]), 0.09, 0.14, G.phase); }
  /** Cats start or stop grooming: a low two-note. */
  phase(): void { this.notes(NOTE([196, 246.94]), 0.12, 0.2, G.phase); }
  /** Tuxedo winds up: a rising saw. */
  pounce(): void {
    if (!this.live) return;
    this.tone(180, 520, this.now(), 0.15, G.pounce, 'sawtooth');
  }
  gameOver(): void { this.notes(NOTE([392, 329.63, 261.63, 196]), 0.2, 0.3, G.gameOver); }
  ui(): void { this.notes(NOTE([740]), 0.05, 0.08, G.ui); }

  death(): void {
    if (!this.live) return;
    const t = this.now();
    this.noise(t, 0.12, 3000, 1500, 0.25);
    this.tone(700, 120, t + 0.1, 0.9, G.death, 'triangle');
  }

  /**
   * Quiet bass pulse that speeds up as crumbs run out. Call every frame while playing;
   * `remaining` is 1 at the start of a level and 0 when the last crumb is gone.
   */
  bass(remaining: number): void {
    const { ac } = this;
    if (!ac || !this.live) return;
    const t = ac.currentTime;
    if (this.nextBeat < t) this.nextBeat = t;
    if (this.nextBeat > t + 0.25) return;
    const bpm = FEEL.audio.bassBpmSlow + (FEEL.audio.bassBpmFast - FEEL.audio.bassBpmSlow) * (1 - Math.min(1, Math.max(0, remaining)));
    const f = this.beatIdx++ % 2 === 0 ? 55 : 65.4;
    this.tone(f * 1.5, f, this.nextBeat, 0.16, G.bass, 'sine');
    this.nextBeat += 60 / bpm / 2;
  }
}
