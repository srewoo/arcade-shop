// WebAudio engine: lazy context, mixer buses, synthesised SFX. No audio files.
import { mix } from '../config/audio';
import type { Sfx } from '../config/sfx';
import { busGains, createBus, type Bus } from './bus';
import { playSfx } from './synth';

export type { Sfx };

const GAPS: Partial<Record<Sfx, number>> = { move: mix.moveMinGapMs, softDrop: mix.softDropMinGapMs, deny: mix.denyMinGapMs };

export class AudioEngine {
  private ctx: AudioContext | null = null;
  private bus: Bus | null = null;
  private last = new Map<Sfx, number>();
  private suspendedByUs = false;
  sfxOn = true;
  musicOn = true;
  muted = false;
  master = 100;
  sfx = 100;
  music = 100;

  /** Create/resume on a user gesture. Returns null if WebAudio is unavailable. */
  ensure(): AudioContext | null {
    try {
      if (!this.ctx) {
        const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (!Ctor) return null;
        this.ctx = new Ctor();
        this.bus = createBus(this.ctx);
        this.applyLevels(true);
      }
      if (this.ctx.state === 'suspended' && !this.suspendedByUs) void this.ctx.resume();
      return this.ctx;
    } catch {
      return null;
    }
  }

  /** The context if it already exists (never creates one). */
  get context(): AudioContext | null {
    return this.ctx;
  }

  /** Music bus: ambient pads connect here. */
  get musicBus(): AudioNode | null {
    return this.bus?.music ?? null;
  }

  get state(): AudioContextState | 'none' {
    return this.ctx?.state ?? 'none';
  }

  /** Push the user's levels to the buses (instant when `now`, else a short ramp). */
  applyLevels(now = false): void {
    if (!this.ctx || !this.bus) return;
    const g = busGains(this);
    const t = this.ctx.currentTime;
    const set = (p: AudioParam, v: number): void => (now ? void (p.value = v) : void p.setTargetAtTime(v, t, 0.05));
    set(this.bus.master.gain, g.master);
    set(this.bus.sfx.gain, g.sfx);
    set(this.bus.music.gain, g.music);
  }

  setMuted(m: boolean): void {
    this.muted = m;
    this.applyLevels();
  }

  /** Silence the ambient pads (pause) without touching SFX, so UI sounds still work. */
  duckMusic(on: boolean): void {
    if (!this.ctx || !this.bus) return;
    this.bus.musicDuck.gain.setTargetAtTime(on ? 0 : 1, this.ctx.currentTime, 0.06);
  }

  /** Hard-suspend the whole context (tab hidden). */
  suspend(): void {
    if (!this.ctx || this.ctx.state !== 'running') return;
    this.suspendedByUs = true;
    void this.ctx.suspend();
  }

  resume(): void {
    if (!this.ctx || !this.suspendedByUs) return;
    this.suspendedByUs = false;
    void this.ctx.resume();
  }

  play(name: Sfx, arg = 0, delay = 0): void {
    if (!this.sfxOn || this.muted || this.suspendedByUs) return;
    const ctx = this.ensure();
    if (!ctx || !this.bus) return;
    const now = performance.now();
    const gap = GAPS[name];
    if (gap !== undefined && now - (this.last.get(name) ?? -1e9) < gap) return;
    this.last.set(name, now);
    playSfx(ctx, this.bus.sfx, name, ctx.currentTime + delay, arg);
  }
}
