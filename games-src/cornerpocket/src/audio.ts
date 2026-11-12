// Synthesised WebAudio effects. No audio files. Context is created lazily on a user gesture.
// Everything routes through one master gain (volume) and a compressor, so levels live in config/audio.ts.
import { MIX } from './config/audio';
import type { SfxCall, SfxName } from './sfxNames';

const clamp = (v: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, v));
const NOTE = (semis: number): number => 523.25 * Math.pow(2, semis / 12); // C5 + semitones

export class Sfx {
  muted = false;
  private volume = 1;
  private ctx: BaseAudioContext | null = null;
  private out: AudioNode | null = null;
  private master: GainNode | null = null;
  private noiseBuf: AudioBuffer | null = null;
  private voices = 0;
  private last = new Map<string, number>();

  /** Master volume 0..1 (the settings slider, already divided by 100). */
  setVolume(v: number): void {
    this.volume = clamp(v, 0, 1);
    if (this.master) this.master.gain.value = MIX.master * this.volume;
  }

  /** Use an existing context (tests render sounds into an OfflineAudioContext). */
  useContext(c: BaseAudioContext): void {
    this.ctx = c;
    this.master = c.createGain();
    this.master.gain.value = MIX.master * this.volume;
    const comp = c.createDynamicsCompressor();
    this.master.connect(comp).connect(c.destination);
    this.out = this.master;
    this.noiseBuf = null;
  }

  private ensure(): BaseAudioContext | null {
    if (this.muted || this.volume === 0) return null;
    try {
      if (!this.ctx) {
        const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (!Ctor) return null;
        this.useContext(new Ctor());
      }
      const c = this.ctx as AudioContext;
      if (c.state === 'suspended' && typeof c.resume === 'function' && !(c instanceof OfflineAudioContext)) void c.resume().catch(() => undefined);
      return this.ctx;
    } catch {
      return null;
    }
  }

  private throttled(key: string, ms: number): boolean {
    const now = performance.now();
    if (now - (this.last.get(key) ?? -1e9) < ms) return true;
    this.last.set(key, now);
    return false;
  }

  private canPlay(priority: boolean): boolean { return priority || this.voices < MIX.maxVoices; }

  private release(node: AudioScheduledSourceNode): void {
    this.voices++;
    node.onended = () => { this.voices = Math.max(0, this.voices - 1); };
  }

  private tone(c: BaseAudioContext, type: OscillatorType, f0: number, f1: number, dur: number, gain: number, delay = 0, priority = false): void {
    if (!this.out || !this.canPlay(priority)) return;
    const t = c.currentTime + delay;
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f0, t);
    if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(this.out);
    this.release(o);
    o.start(t);
    o.stop(t + dur + 0.02);
  }

  /** One shared white-noise buffer; each hit applies its own decay envelope. */
  private noiseBuffer(c: BaseAudioContext): AudioBuffer {
    if (this.noiseBuf) return this.noiseBuf;
    const n = Math.floor(c.sampleRate * MIX.noiseSeconds);
    const buf = c.createBuffer(1, n, c.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    this.noiseBuf = buf;
    return buf;
  }

  private noise(c: BaseAudioContext, dur: number, gain: number, freq: number): void {
    if (!this.out || !this.canPlay(false)) return;
    const t = c.currentTime;
    const src = c.createBufferSource();
    const f = c.createBiquadFilter();
    const g = c.createGain();
    f.type = 'bandpass'; f.frequency.value = freq;
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + Math.min(dur, MIX.noiseSeconds));
    src.buffer = this.noiseBuffer(c);
    src.connect(f).connect(g).connect(this.out);
    this.release(src);
    src.start(t, 0, Math.min(dur, MIX.noiseSeconds));
  }

  /** Ball-ball click, volume and pitch scale with impact speed. */
  clack(speed: number): void {
    const c = this.ensure();
    if (!c || this.throttled('clack', 25)) return;
    const v = clamp(speed / 800, 0.06, 1);
    this.tone(c, 'triangle', 1500 + v * 900, 700, 0.06, MIX.clack * v);
    this.noise(c, 0.03, MIX.clack * 1.2 * v, 3200);
  }

  cushion(speed: number): void {
    const c = this.ensure();
    if (!c || this.throttled('cushion', 40)) return;
    const v = clamp(speed / 700, 0.05, 1);
    this.tone(c, 'sine', 240, 110, 0.09, MIX.cushion * v);
  }

  pot(): void {
    const c = this.ensure();
    if (!c || this.throttled('pot', 60)) return;
    this.tone(c, 'sine', 170, 55, 0.22, MIX.pot);
    this.noise(c, 0.12, MIX.pot * 0.36, 900);
  }

  shot(power: number): void { this.clack(200 + power * 900); }

  chime(level: number): void {
    const c = this.ensure();
    if (!c || this.throttled('chime', 150)) return;
    const base = 520 * Math.pow(1.122, Math.min(level, 8));
    this.tone(c, 'sine', base, base, 0.18, MIX.chime);
    this.tone(c, 'sine', base * 1.5, base * 1.5, 0.22, MIX.chime * 0.75, 0.08);
  }

  scratch(): void {
    const c = this.ensure();
    if (c) this.tone(c, 'sawtooth', 300, 90, 0.3, MIX.scratch, 0, true);
  }

  /** Short rising arpeggio: a rack was cleared. */
  rackClear(): void { this.arp([0, 4, 7], 0.09, 'triangle'); }

  /** Longer, brighter arpeggio with a top octave: Clean Sweep. */
  sweep(): void { this.arp([0, 4, 7, 12, 16], 0.07, 'triangle'); }

  win(): void { this.arp([0, 4, 7, 12], 0.12, 'triangle'); }

  lose(): void { this.arp([7, 3, 0, -5], 0.16, 'sine'); }

  /** Rack Attack new personal best. */
  newBest(): void { this.arp([0, 7, 12, 16, 19], 0.09, 'triangle'); }

  /** `n` rising pings, one per star. */
  star(n: number): void {
    const c = this.ensure();
    if (!c) return;
    for (let i = 0; i < clamp(n, 1, 3); i++) this.tone(c, 'sine', NOTE(12 + i * 4), NOTE(12 + i * 4), 0.18, MIX.stinger * 0.7, 0.55 + i * 0.14, true);
  }

  /** Low-time countdown tick. */
  tick(): void {
    const c = this.ensure();
    if (!c || this.throttled('tick', 200)) return;
    this.tone(c, 'sine', 1100, 900, 0.05, MIX.tick, 0, true);
  }

  /** Turn passes to the other player. */
  turn(): void {
    const c = this.ensure();
    if (!c || this.throttled('turn', 300)) return;
    this.tone(c, 'sine', NOTE(0), NOTE(0), 0.1, MIX.stinger * 0.6, 0, true);
    this.tone(c, 'sine', NOTE(-5), NOTE(-5), 0.14, MIX.stinger * 0.6, 0.09, true);
  }

  /** Button press. */
  ui(): void {
    const c = this.ensure();
    if (!c || this.throttled('ui', 40)) return;
    this.tone(c, 'square', 680, 520, 0.03, MIX.ui, 0, true);
  }

  private arp(semis: number[], gap: number, type: OscillatorType): void {
    const c = this.ensure();
    if (!c || this.throttled('arp', 250)) return;
    semis.forEach((s, i) => this.tone(c, type, NOTE(s), NOTE(s), gap * 2.2, MIX.stinger, i * gap, true));
  }

  /** Single dispatch used for both game events and UI feedback. */
  play(name: SfxName, n?: number): void {
    switch (name) {
      case 'rackClear': this.rackClear(); break;
      case 'sweep': this.sweep(); break;
      case 'win': this.win(); break;
      case 'lose': this.lose(); break;
      case 'newBest': this.newBest(); break;
      case 'star': this.star(n ?? 1); break;
      case 'tick': this.tick(); break;
      case 'turn': this.turn(); break;
      case 'ui': this.ui(); break;
    }
  }

  playCall(c: SfxCall): void { this.play(c.name, c.n); }
}
