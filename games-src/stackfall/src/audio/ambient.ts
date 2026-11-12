// Procedural ambient loop: slow detuned pads that drift between chords plus
// sparse "droplet" notes picked at random from a pentatonic scale. Nothing
// here encodes an existing melody; notes are random draws with random timing.
// Every node is tracked and disposed on stop (faded out first).
import { ambient as A, mix } from '../config/audio';
import type { AudioEngine } from './engine';

const hz = (semi: number): number => A.root * Math.pow(2, semi / 12);

/** One chord pad: eight detuned triangles, each at 1/8 gain so the sum never exceeds `peak`. */
export function playPad(ctx: BaseAudioContext, dest: AudioNode, t: number, rootSemi: number, peak: number, track?: (o: OscillatorNode) => void): GainNode {
  const lp = ctx.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = A.padCutoff;
  const env = ctx.createGain();
  env.gain.setValueAtTime(0.0001, t);
  env.gain.exponentialRampToValueAtTime(peak, t + 3.5);
  env.gain.exponentialRampToValueAtTime(0.0001, t + 9);
  lp.connect(env).connect(dest);
  const count = A.padIntervals.length * A.padDetunes.length;
  const share = ctx.createGain();
  share.gain.value = 1 / count;
  share.connect(lp);
  for (const interval of A.padIntervals) {
    for (const detune of A.padDetunes) {
      const o = ctx.createOscillator();
      o.type = 'triangle';
      o.frequency.value = hz(rootSemi + interval) / 2;
      o.detune.value = detune;
      o.connect(share);
      o.start(t);
      o.stop(t + 10);
      track?.(o);
    }
  }
  return env;
}

export class Ambient {
  private timer: number | null = null;
  private nextPad = 0;
  private nextDrop = 0;
  private chord = 0;
  private chain: { input: GainNode; nodes: AudioNode[] } | null = null;
  private live = new Set<OscillatorNode>();
  private disposeTimer: number | null = null;

  constructor(private readonly engine: AudioEngine) {}

  get running(): boolean {
    return this.timer !== null;
  }

  /** Oscillators currently alive (test hook for the leak check). */
  get liveCount(): number {
    return this.live.size;
  }

  start(): void {
    if (this.timer !== null) return;
    const ctx = this.engine.ensure();
    const out = this.engine.musicBus;
    if (!ctx || !out) return;
    if (this.disposeTimer !== null) this.dispose();
    this.chain = this.buildChain(ctx, out);
    this.nextPad = ctx.currentTime + 0.1;
    this.nextDrop = ctx.currentTime + 1.5;
    this.resume();
  }

  /** Keep scheduling (also used when resuming from pause). */
  resume(): void {
    if (this.timer !== null || !this.chain) return;
    const ctx = this.engine.ensure();
    if (ctx) {
      this.nextPad = Math.max(this.nextPad, ctx.currentTime + 0.1);
      this.nextDrop = Math.max(this.nextDrop, ctx.currentTime + 1);
    }
    this.timer = window.setInterval(() => this.schedule(), 250);
  }

  /** Stop scheduling new notes; sounding pads are left to the duck/fade. */
  halt(): void {
    if (this.timer !== null) window.clearInterval(this.timer);
    this.timer = null;
  }

  /** Stop and fade out; nodes are released after the fade. */
  stop(): void {
    this.halt();
    const chain = this.chain;
    const ctx = this.engine.context;
    if (!chain || !ctx) return;
    chain.input.gain.setTargetAtTime(0, ctx.currentTime, mix.fadeSeconds / 4);
    this.disposeTimer = window.setTimeout(() => this.dispose(), mix.fadeSeconds * 1500);
  }

  private dispose(): void {
    if (this.disposeTimer !== null) window.clearTimeout(this.disposeTimer);
    this.disposeTimer = null;
    for (const o of this.live) {
      try { o.stop(); } catch { /* already stopped */ }
      o.disconnect();
    }
    this.live.clear();
    this.chain?.nodes.forEach((n) => n.disconnect());
    this.chain?.input.disconnect();
    this.chain = null;
  }

  private buildChain(ctx: AudioContext, out: AudioNode): { input: GainNode; nodes: AudioNode[] } {
    const input = ctx.createGain();
    const delay = ctx.createDelay(1.5);
    delay.delayTime.value = A.delaySeconds;
    const fb = ctx.createGain();
    fb.gain.value = A.feedback;
    const wet = ctx.createGain();
    wet.gain.value = A.wet;
    input.connect(out);
    delay.connect(fb).connect(delay);
    delay.connect(wet).connect(input);
    return { input, nodes: [delay, fb, wet] };
  }

  private schedule(): void {
    const ctx = this.engine.ensure();
    if (!ctx || !this.chain || !this.engine.musicOn) return;
    while (this.nextPad < ctx.currentTime + 1) {
      this.pad(ctx, this.nextPad);
      this.nextPad += 7 + Math.random() * 3;
    }
    while (this.nextDrop < ctx.currentTime + 1) {
      this.droplet(ctx, this.nextDrop);
      this.nextDrop += 1.1 + Math.random() * 3.2;
    }
  }

  private track = (o: OscillatorNode): void => {
    this.live.add(o);
    o.onended = () => {
      this.live.delete(o);
      o.disconnect();
    };
  };

  private pad(ctx: AudioContext, t: number): void {
    const chain = this.chain;
    if (!chain) return;
    this.chord = (this.chord + 1 + Math.floor(Math.random() * 3)) % A.chordRoots.length;
    playPad(ctx, chain.input, t, A.chordRoots[this.chord] as number, mix.padPeak, this.track);
  }

  private droplet(ctx: AudioContext, t: number): void {
    const chain = this.chain;
    const delay = chain?.nodes[0] as DelayNode | undefined;
    if (!chain || !delay) return;
    const note = A.pentatonic[Math.floor(Math.random() * A.pentatonic.length)] as number;
    const semi = (A.chordRoots[this.chord] as number) + note + 12 * Math.floor(Math.random() * 2);
    const o = ctx.createOscillator();
    o.type = 'sine';
    o.frequency.value = hz(semi) * 2;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(mix.dropletPeak, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 1.42);
    o.connect(g);
    g.connect(chain.input);
    g.connect(delay);
    o.start(t);
    o.stop(t + 1.6);
    this.track(o);
  }
}
