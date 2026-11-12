// Game flow controller. DOM-free: phases, input, the fixed-step loop and persistence.
import { CONFIG } from './config';
import { FixedStepper } from './loop';
import { hasGhost, seedKeyFor, type Mode } from './modes';
import { dateStamp } from './rng';
import {
  bestFor, ghostFor, loadBest, loadGhosts, saveBest, saveGhosts, withGhost, withScore,
  type Best, type Ghosts,
} from './scores';
import { Run } from './session';
import type { Sfx } from './audioCues';
import { metres } from './sim';

export type Phase = 'title' | 'ready' | 'playing' | 'paused' | 'crashed' | 'over';

export interface Result { readonly score: number; readonly metres: number; readonly coins: number; readonly isNew: boolean }

export interface GameDeps {
  now: () => Date;
  rand: () => number;
  emit: (sfx: Sfx) => void;
  onChange: () => void;
}

export class Game {
  phase: Phase = 'title';
  run: Run | null = null;
  result: Result | null = null;
  best: Best = loadBest();
  ghosts: Ghosts = loadGhosts();
  hold = false;
  crashClock = 0;
  private resumeTo: Phase = 'playing';
  private readonly stepper = new FixedStepper(CONFIG.sim.dt, CONFIG.sim.maxFrameSec, CONFIG.sim.maxStepsPerFrame);

  constructor(public mode: Mode, private readonly deps: GameDeps) {}

  get alpha(): number { return this.phase === 'playing' ? this.stepper.alpha : 1; }
  get today(): string { return dateStamp(this.deps.now()); }
  get bestScore(): number { return bestFor(this.best, this.mode, this.today); }
  get hasGhost(): boolean { return !!this.run?.ghostSim; }

  /** Start a fresh run in the current mode, waiting for the first press. */
  start(mode: Mode = this.mode): void {
    this.mode = mode;
    const key = seedKeyFor(mode, this.deps.now(), this.deps.rand);
    this.run = new Run(key, hasGhost(mode) ? ghostFor(this.ghosts, mode, key) : null);
    this.result = null;
    this.hold = false;
    this.stepper.reset();
    this.setPhase('ready');
  }

  toTitle(): void {
    this.hold = false;
    this.run = null;
    this.setPhase('title');
  }

  press(): void {
    if (this.phase === 'ready') {
      this.deps.emit('start');
      this.setPhase('playing');
    }
    if (this.phase !== 'playing') return;
    if (!this.hold) this.deps.emit('rise');
    this.hold = true;
  }

  release(): void { this.hold = false; }

  pause(): void {
    if (this.phase !== 'playing' && this.phase !== 'ready') return;
    this.resumeTo = this.phase;
    this.hold = false;
    this.deps.emit('pause');
    this.setPhase('paused');
  }

  resume(): void {
    if (this.phase !== 'paused') return;
    this.stepper.reset();
    this.setPhase(this.resumeTo);
  }

  /** Advance by one rendered frame of `sec` seconds. */
  frame(sec: number): void {
    if (this.phase === 'playing' && this.run) {
      const run = this.run;
      this.stepper.advance(sec, () => this.stepOnce(run));
    } else if (this.phase === 'crashed') {
      this.crashClock += sec;
      if (this.crashClock >= CONFIG.flow.crashSec) this.setPhase('over');
    }
  }

  private stepOnce(run: Run): boolean {
    const alive = run.step(this.hold);
    if (run.sim.gotCoin) this.deps.emit('coin');
    if (!alive) this.finish(run);
    return alive;
  }

  private finish(run: Run): void {
    this.hold = false;
    this.deps.emit('crash');
    const { best, isNew } = withScore(this.best, this.mode, run.score, this.today);
    this.best = best;
    saveBest(best);
    if (hasGhost(this.mode)) {
      this.ghosts = withGhost(this.ghosts, this.mode, run.record());
      saveGhosts(this.ghosts);
    }
    this.result = { score: run.score, metres: metres(run.sim), coins: run.sim.coinCount, isNew };
    this.crashClock = 0;
    this.setPhase('crashed');
    if (isNew) this.deps.emit('best');
  }

  private setPhase(p: Phase): void {
    this.phase = p;
    this.deps.onChange();
  }
}
