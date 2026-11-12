// Phase machine around the sim: title -> ready -> playing <-> paused -> over.
// Owns bests, the keyboard aim reticle and the effect queue the renderer consumes.
import { CONFIG } from './config';
import { isUnlocked, loadBest, saveBest, withScore, type Best } from './scores';
import type { Mode } from './modes';
import { Sim, type SimEvent } from './sim';
import type { Sfx } from './audioCues';
import { FixedStepper } from './loop';

export type Phase = 'title' | 'ready' | 'playing' | 'paused' | 'over';
export interface RunResult { score: number; isNew: boolean; tier: string | null; unlocked: boolean }
export interface GameDeps {
  rand: () => number;
  emit: (s: Sfx, delay?: number) => void;
  onChange: () => void;
  onEvent: (e: SimEvent) => void;
}
export interface Aim { x: number; y: number; visible: boolean; dx: number; dy: number }

export class Game {
  phase: Phase = 'title';
  mode: Mode;
  sim: Sim;
  best: Best = loadBest();
  result: RunResult | null = null;
  width: number = CONFIG.world.minWidth + 120;
  readonly aim: Aim = { x: 0, y: 0, visible: false, dx: 0, dy: 0 };
  readonly stepper = new FixedStepper(CONFIG.step.dt, CONFIG.step.maxFrame, CONFIG.step.maxSteps);
  private lastTier: string | null = null;

  constructor(mode: Mode, private readonly deps: GameDeps) {
    this.mode = isUnlocked(mode, this.best) ? mode : 'classic';
    this.sim = this.makeSim();
    this.resetAim();
  }

  get bestScore(): number { return this.best[this.mode]; }
  get unlocked(): boolean { return isUnlocked('twoballs', this.best); }
  private makeSim(): Sim {
    return new Sim(this.mode, Math.floor(this.deps.rand() * 2 ** 32), this.width, (e) => this.onSim(e));
  }

  private onSim(e: SimEvent): void {
    if (e.t === 'tier') this.lastTier = e.tier.label;
    this.deps.onEvent(e);
  }

  setMode(m: Mode): boolean {
    if (!isUnlocked(m, this.best)) return false;
    this.mode = m;
    this.sim = this.makeSim();
    this.deps.onChange();
    return true;
  }

  setWidth(w: number): void {
    this.width = w;
    this.sim.setWidth(w);
    this.aim.x = Math.min(this.aim.x, w);
  }

  resetAim(): void {
    this.aim.x = this.width * CONFIG.aim.start.x;
    this.aim.y = CONFIG.world.groundY * CONFIG.aim.start.y;
  }

  private set(p: Phase): void { this.phase = p; this.deps.onChange(); }

  /** Begin a fresh rally (from title, game over or pause > restart). */
  start(): void {
    this.sim = this.makeSim();
    this.result = null;
    this.lastTier = null;
    this.stepper.reset();
    this.aim.dx = this.aim.dy = 0;
    this.resetAim();
    this.deps.emit('start');
    this.set('ready');
  }

  toTitle(): void { this.sim = this.makeSim(); this.set('title'); }
  pause(): void { if (this.phase !== 'playing' && this.phase !== 'ready') return; this.aim.dx = this.aim.dy = 0; this.set('paused'); this.deps.emit('pause'); }
  resume(): void {
    if (this.phase !== 'paused') return;
    this.set(this.sim.started ? 'playing' : 'ready');
  }

  /** A tap or kick at a world point. Starts the rally from the ready screen. */
  strike(x: number, y: number): void {
    if (this.phase === 'ready') { this.phase = 'playing'; this.deps.onChange(); }
    if (this.phase !== 'playing') return;
    this.sim.tap(x, y);
  }

  kickAtAim(): void { this.aim.visible = true; this.strike(this.aim.x, this.aim.y); }

  /** Jump the reticle under the lowest active ball (keyboard helper). */
  snapAim(): void {
    let low = this.sim.balls[0];
    for (const b of this.sim.balls) if (b.active && (!low || b.y > low.y)) low = b;
    if (!low) return;
    this.aim.x = low.x; this.aim.y = low.y + CONFIG.ball.radius * 0.5; this.aim.visible = true;
  }

  frame(dt: number): void {
    if (this.aim.dx || this.aim.dy) {
      const k = CONFIG.aim.speed * Math.min(dt, 0.05);
      this.aim.x = Math.min(this.width, Math.max(0, this.aim.x + this.aim.dx * k));
      this.aim.y = Math.min(CONFIG.world.groundY, Math.max(0, this.aim.y + this.aim.dy * k));
    }
    if (this.phase !== 'playing') return;
    this.stepper.advance(dt, () => { this.sim.step(CONFIG.step.dt); return !this.sim.over; });
    if (this.sim.over) this.finish();
  }

  private finish(): void {
    const { best, isNew } = withScore(this.best, this.mode, this.sim.score);
    const wasLocked = !this.unlocked;
    this.best = best;
    if (isNew) saveBest(best);
    this.result = { score: this.sim.score, isNew, tier: this.lastTier, unlocked: wasLocked && this.unlocked };
    this.deps.emit(isNew && this.sim.score > 0 ? 'best' : 'miss');
    this.set('over');
  }
}
