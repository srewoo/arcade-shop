// Game flow state machine: title/demo -> ready -> play -> dying/clearing -> summary -> game over.
// Owns the World, scoring across levels, pause and persistence. No DOM or canvas access.
import { FEEL } from './config/feel';
import { TUNING } from './config/tuning';
import { saveHighScore, loadHighScore, defaultStore } from './storage';
import type { KeyValueStore } from './storage';
import { stepWorld } from './step';
import { addPoints, newScore } from './scoring';
import type { ScoreState } from './scoring';
import { FIXED_DT } from './types';
import type { MoveDir } from './types';
import { createWorld, respawn } from './world';
import type { GameEvent, World } from './world';
import type { Summary } from './overlays';
import { RunTracker } from './runStats';
import type { RunResult } from './runStats';

export type { RunResult } from './runStats';

export type Phase = 'title' | 'ready' | 'play' | 'dying' | 'clearing' | 'summary' | 'gameover';

export interface GameDeps {
  readonly storage?: KeyValueStore | null;
  readonly reducedMotion: boolean;
  readonly onEvent: (e: GameEvent, demo: boolean) => void;
  readonly onPhase: (p: Phase) => void;
  /** Fired whenever `paused` flips; `auto` is true for blur / hidden-tab pauses. */
  readonly onPause?: (paused: boolean, auto: boolean) => void;
  readonly onRunEnd?: (r: RunResult) => void;
}

const FLOW = TUNING.flow;

export class Game {
  phase: Phase = 'title';
  phaseT = 0;
  paused = false;
  /** Frozen by a modal (settings, how-to) opened from anywhere: simulation and timers stand still. */
  frozen = false;
  autoPaused = false;
  level = 1;
  hi: number;
  muted = false;
  summary: Summary | null = null;
  lastRun: RunResult | null = null;
  world: World;
  reducedMotion: boolean;
  /** Seconds of camera shake left (render only). */
  shakeLeft = 0;
  private hitStop = 0;
  private demoLevel = 1;
  private demoEnd = 0;
  private levelStart = { score: 0, crumbs: 0, splashes: 0, cheese: 0 };
  private readonly run = new RunTracker();

  constructor(private readonly deps: GameDeps) {
    this.reducedMotion = deps.reducedMotion;
    this.hi = loadHighScore(this.store());
    this.world = this.newDemo();
  }

  private store(): KeyValueStore | null {
    return this.deps.storage === undefined ? defaultStore() : this.deps.storage;
  }

  get score(): ScoreState {
    return this.world.score;
  }

  get demo(): boolean {
    return this.phase === 'title';
  }

  /** True while the world is being stepped, so render interpolation is meaningful. */
  get interpolating(): boolean {
    return (this.phase === 'play' || this.phase === 'title') && !this.paused && !this.frozen && this.hitStop <= 0;
  }

  demoOrLevel(): number {
    return this.demo ? this.demoLevel : this.level;
  }

  private newDemo(): World {
    return createWorld(this.demoLevel, { ai: true, seed: 99 + this.demoLevel, score: newScore() });
  }

  private setPhase(p: Phase): void {
    this.phase = p;
    this.phaseT = 0;
    this.deps.onPhase(p);
  }

  private emit(): void {
    const demo = this.demo;
    for (const e of this.world.events) {
      if (!demo) this.juice(e);
      this.deps.onEvent(e, demo);
    }
    this.world.events.length = 0;
  }

  private juice(e: GameEvent): void {
    if (e.type === 'death') {
      this.hitStop = FEEL.hitStop.deathSec;
      this.shakeLeft = FEEL.shake.deathSec;
    } else if (e.type === 'splash') this.hitStop = Math.max(this.hitStop, FEEL.hitStop.splashSec);
  }

  private get blocked(): boolean {
    return this.paused || this.frozen;
  }

  get blockedNow(): boolean {
    return this.blocked;
  }

  /** Enter / Space / tap. */
  action(): void {
    if (this.blocked) return;
    if (this.phase === 'title') this.startGame();
    else if (this.phase === 'summary' && this.phaseT > FLOW.summaryInputDelaySec) this.nextLevel();
    else if (this.phase === 'gameover' && this.phaseT > FLOW.gameOverInputDelaySec) this.toTitle();
  }

  startGame(): void {
    this.level = 1;
    this.world = createWorld(1, { score: newScore() });
    this.run.start(this.hi);
    this.beginLevelStats();
    this.setPaused(false, false);
    this.setPhase('ready');
  }

  private nextLevel(): void {
    this.run.bank(this.world.stats);
    this.level++;
    this.world = createWorld(this.level, { score: this.world.score });
    this.beginLevelStats();
    this.setPhase('ready');
  }

  toTitle(): void {
    this.demoLevel++;
    this.world = this.newDemo();
    this.setPaused(false, false);
    this.setPhase('title');
  }

  private beginLevelStats(): void {
    this.levelStart = { score: this.world.score.score, crumbs: 0, splashes: 0, cheese: 0 };
  }

  /** Run-wide totals: banked from finished levels plus the live level. */
  runTotals(): { splashes: number; bestChain: number } {
    return this.run.totals(this.world.stats);
  }

  private endRun(abandoned: boolean): void {
    const score = this.world.score.score;
    this.hi = Math.max(this.hi, score);
    saveHighScore(this.hi, this.store());
    this.lastRun = this.run.result(score, this.level, this.world.stats, abandoned);
    this.deps.onRunEnd?.(this.lastRun);
  }

  /** Pause-menu actions. Both end the current run (the UI asks for confirmation first). */
  restart(): void {
    if (this.phase === 'title') return;
    this.endRun(true);
    this.startGame();
  }

  quitToTitle(): void {
    if (this.phase === 'title') return;
    this.endRun(true);
    this.toTitle();
  }

  press(dir: MoveDir): void {
    if (this.blocked) return;
    if (this.phase === 'play' || this.phase === 'ready') this.world.pip.want = dir;
  }

  /** Held inputs are cleared whenever the game pauses, so nothing sticks on resume. */
  private setPaused(p: boolean, auto: boolean): void {
    if (this.paused === p) return;
    this.paused = p;
    this.autoPaused = p && auto;
    if (p) this.world.pip.want = 'N';
    this.deps.onPause?.(p, auto);
  }

  private canPause(): boolean {
    return this.phase === 'play' || this.phase === 'ready' || this.phase === 'dying';
  }

  togglePause(): void {
    if (this.paused) this.setPaused(false, false);
    else if (this.canPause() && !this.frozen) this.setPaused(true, false);
  }

  resume(): void {
    this.setPaused(false, false);
  }

  autoPause(): void {
    if (!this.paused && this.canPause()) this.setPaused(true, true);
  }

  setFrozen(f: boolean): void {
    this.frozen = f;
    if (f) this.world.pip.want = 'N';
  }

  persistHigh(): void {
    this.hi = Math.max(this.hi, this.world.score.score);
    if (this.phase !== 'title') saveHighScore(this.hi, this.store());
  }

  /** One fixed simulation tick. */
  update(dt: number = FIXED_DT): void {
    if (this.blocked) return;
    this.shakeLeft = Math.max(0, this.shakeLeft - dt);
    if (this.hitStop > 0) {
      this.hitStop -= dt;
      return;
    }
    this.phaseT += dt;
    if (this.phase === 'title') this.updateDemo(dt);
    else if (this.phase === 'ready') {
      if (this.phaseT >= FLOW.readySec) this.setPhase('play');
    } else if (this.phase === 'play') this.updatePlay(dt);
    else if (this.phase === 'dying') this.updateDying();
    else if (this.phase === 'clearing') this.updateClearing();
    this.hi = Math.max(this.hi, this.phase === 'title' ? this.hi : this.world.score.score);
  }

  private updateDemo(dt: number): void {
    const w = this.world;
    stepWorld(w, dt);
    this.emit();
    if (!w.pip.alive || w.cleared) {
      this.demoEnd += dt;
      if (this.demoEnd > FLOW.demoRestartSec) {
        this.demoEnd = 0;
        this.demoLevel++;
        this.world = this.newDemo();
      }
    }
  }

  private updatePlay(dt: number): void {
    const w = this.world;
    stepWorld(w, dt);
    const died = w.events.some((e) => e.type === 'death');
    this.emit();
    if (died) {
      w.score.lives -= 1;
      this.persistHigh();
      this.setPhase('dying');
    } else if (w.cleared) {
      this.finishLevel();
    }
  }

  private finishLevel(): void {
    const w = this.world;
    const s = this.levelStart;
    this.summary = {
      level: this.level, crumbs: w.stats.crumbs - s.crumbs, splashes: w.stats.splashes - s.splashes,
      bestChain: w.stats.bestChain, cheese: w.stats.cheese - s.cheese, seconds: w.time, points: w.score.score - s.score,
    };
    this.persistHigh();
    this.setPhase('clearing');
  }

  private updateDying(): void {
    if (this.phaseT < FLOW.dyingSec) return;
    if (this.world.score.lives <= 0) {
      this.endRun(false);
      this.setPhase('gameover');
    } else {
      respawn(this.world);
      this.setPhase('ready');
    }
  }

  private updateClearing(): void {
    if (this.phaseT >= FLOW.clearingSec) this.setPhase('summary');
  }

  /** Test/debug helper: grant points through the normal rules (extra lives at 7,500 and 25,000). */
  grant(points: number): void {
    if (addPoints(this.world.score, points)) this.deps.onEvent({ type: 'extralife' }, false);
  }
}
