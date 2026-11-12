// Synthesised WebAudio engine: rolling rumble plus one-shot voices from sfx.ts. No audio files.
// The context is created on the first user gesture, as browsers require.
import { playClatter, playCrowd, playJingle, playRelease, playTick, playUi, type Graph, type Jingle, type UiCue } from './sfx';

export type { Jingle, UiCue } from './sfx';

/** Master gain at volume 100: -6 dBFS before the limiter. */
export const MASTER_MAX = 0.5;

/** Master gain for a 0-100 volume and the mute flag. */
export const masterLevel = (volume: number, muted: boolean): number => (muted ? 0 : (Math.max(0, Math.min(100, volume)) / 100) * MASTER_MAX);

export class AudioEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private noise: AudioBuffer | null = null;
  private rollSrc: AudioBufferSourceNode | null = null;
  private rollGain: GainNode | null = null;
  private rollFilter: BiquadFilterNode | null = null;
  private lastClatter = 0;
  private lastUi = 0;
  /** Rumble held silent (menu, pause overlay). */
  private paused = false;
  /** Context suspended because the tab is hidden. */
  private asleep = false;
  muted = false;
  volume = 80;

  /** Create/resume the context. Call from a user gesture. */
  unlock(): void {
    if (!this.ctx) {
      try {
        this.ctx = new AudioContext();
      } catch {
        this.ctx = null;
        return;
      }
      const limiter = this.ctx.createDynamicsCompressor();
      limiter.threshold.value = -9;
      limiter.ratio.value = 12;
      limiter.connect(this.ctx.destination);
      this.master = this.ctx.createGain();
      this.master.gain.value = masterLevel(this.volume, this.muted);
      this.master.connect(limiter);
      this.noise = this.makeNoise(this.ctx);
    }
    if (this.ctx.state === 'suspended' && !this.asleep) void this.ctx.resume();
  }

  private applyMaster(): void {
    if (this.master && this.ctx) this.master.gain.setTargetAtTime(masterLevel(this.volume, this.muted), this.ctx.currentTime, 0.02);
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
    this.applyMaster();
  }

  setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(100, Math.round(volume)));
    this.applyMaster();
  }

  /** Silence the rumble at once (menu or pause overlay); one-shot voices still work for UI cues. */
  pause(): void {
    this.paused = true;
    if (this.rollGain) {
      this.rollGain.gain.cancelScheduledValues(0);
      this.rollGain.gain.value = 0;
    }
  }

  /** Let the rumble back; `updateRoll` raises the gain on the next frame. */
  resume(): void {
    this.paused = false;
  }

  /** Suspend the whole context while the tab is hidden. */
  sleep(): void {
    this.asleep = true;
    this.pause();
    if (this.ctx && this.ctx.state === 'running') void this.ctx.suspend();
  }

  wake(): void {
    this.asleep = false;
    if (this.ctx && this.ctx.state === 'suspended') void this.ctx.resume();
  }

  /** Read-only view for the ?debug=1 hook and tests. */
  debugState(): { rollGain: number | null; master: number | null; state: string; paused: boolean; asleep: boolean } {
    return { rollGain: this.rollGain?.gain.value ?? null, master: this.master?.gain.value ?? null, state: this.ctx?.state ?? 'none', paused: this.paused, asleep: this.asleep };
  }

  private makeNoise(ctx: AudioContext): AudioBuffer {
    const buf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const data = buf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < data.length; i++) {
      last = (last + (Math.random() * 2 - 1) * 0.2) / 1.1; // brown-ish noise
      data[i] = last * 3.2;
    }
    return buf;
  }

  startRoll(): void {
    if (!this.ctx || !this.master || !this.noise || this.rollSrc) return;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noise;
    src.loop = true;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 300;
    const gain = this.ctx.createGain();
    gain.gain.value = 0;
    src.connect(filter).connect(gain).connect(this.master);
    src.start();
    this.rollSrc = src;
    this.rollGain = gain;
    this.rollFilter = filter;
  }

  /** speed 0..1 (ball speed / max); gutter makes it hollower and quieter. */
  updateRoll(speed: number, gutter: boolean): void {
    if (!this.ctx || !this.rollGain || !this.rollFilter || this.paused) return;
    const t = this.ctx.currentTime;
    this.rollGain.gain.setTargetAtTime((gutter ? 0.22 : 0.42) * speed, t, 0.05);
    this.rollFilter.frequency.setTargetAtTime((gutter ? 160 : 220) + 420 * speed, t, 0.05);
  }

  stopRoll(): void {
    if (!this.ctx) return;
    this.rollGain?.gain.setTargetAtTime(0, this.ctx.currentTime, 0.08);
    const src = this.rollSrc;
    this.rollSrc = null;
    this.rollGain = null;
    this.rollFilter = null;
    if (src) window.setTimeout(() => src.stop(), 400);
  }

  private graph(): Graph | null {
    return this.ctx && this.master && this.noise && !this.muted && !this.asleep ? { ctx: this.ctx, master: this.master, noise: this.noise } : null;
  }

  /** Pin crash. Rate-limited. */
  clatter(strength: number): void {
    const g = this.graph();
    if (!g) return;
    const now = g.ctx.currentTime;
    if (now - this.lastClatter < 0.03) return;
    this.lastClatter = now;
    playClatter(g, strength);
  }

  jingle(name: Jingle): void {
    const g = this.graph();
    if (g) playJingle(g, name);
  }

  /** Meter lock blip; `step` 0..3 rises with each lock. */
  tick(step: number): void {
    const g = this.graph();
    if (g) playTick(g, step);
  }

  release(): void {
    const g = this.graph();
    if (g) playRelease(g);
  }

  /** Button taps, menu open/close and banner pop. Rate-limited. */
  ui(cue: UiCue): void {
    const g = this.graph();
    if (!g) return;
    const now = g.ctx.currentTime;
    if (now - this.lastUi < 0.04) return;
    this.lastUi = now;
    playUi(g, cue);
  }

  crowd(): void {
    const g = this.graph();
    if (g) playCrowd(g);
  }
}
