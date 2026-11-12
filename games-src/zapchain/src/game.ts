// Run flow: title, level intro, play, pause, level cleared, game over. Wraps the Sim with the
// score carried across levels, the fixed-step loop, keyboard cursor state and best scores.
import { Attract } from './attract';
import { CONFIG } from './config';
import { FixedStepper } from './loop';
import { bestMove } from './model/bot';
import { levelBonus } from './model/rules';
import { Sim } from './model/sim';
import type { OverReason, SimEvent } from './model/types';
import { createRng } from './rng';
import { loadScores, recordRun, type Scores } from './scores';

export type Phase = 'title' | 'ready' | 'playing' | 'paused' | 'cleared' | 'over';
export interface Hooks { seed: () => number; onSim: (e: SimEvent, attract: boolean) => void; onChange: () => void }
export interface Result { score: number; level: number; reason: OverReason; isNew: boolean }
export interface ClearInfo { level: number; bonus: number; score: number }
export interface Aim { col: number; row: number; source: 'kbd' | 'pointer' }

export class Game {
  phase: Phase = 'title';
  level = 1;
  sim: Sim | null = null;
  readonly attract: Attract;
  result: Result | null = null;
  clearInfo: ClearInfo | null = null;
  aim: Aim | null = null;
  scores: Scores = loadScores();
  private resumeTo: 'ready' | 'playing' = 'playing';
  private timer = 0;
  private ending: 'cleared' | 'over' | null = null;
  private readonly stepper = new FixedStepper(CONFIG.sim.dt, CONFIG.sim.maxFrameSec, CONFIG.sim.maxStepsPerFrame);
  private readonly attractStepper = new FixedStepper(CONFIG.sim.dt, CONFIG.sim.maxFrameSec, CONFIG.sim.maxStepsPerFrame);

  constructor(private readonly hooks: Hooks) {
    this.attract = new Attract(hooks.seed);
  }

  /** The sim to draw: the live level, or the attract demo on the title screen. */
  get scene(): Sim { return this.sim && this.phase !== 'title' ? this.sim : this.attract.sim; }
  get score(): number { return this.sim?.score ?? 0; }
  /** Interpolation factor for the fixed step. */
  get alpha(): number { return (this.phase === 'title' ? this.attractStepper : this.stepper).alpha; }
  get readyLeft(): number { return this.timer; }

  private set(p: Phase): void {
    if (this.phase === p) return;
    this.phase = p;
    this.hooks.onChange();
  }

  private newSim(level: number, score: number): void {
    this.level = level;
    this.sim = new Sim({ level, rng: createRng(this.hooks.seed()), startScore: score });
    this.ending = null;
    this.timer = CONFIG.flow.readySec;
    this.stepper.reset();
    this.aim = null;
  }

  start(): void {
    this.result = null;
    this.clearInfo = null;
    this.newSim(1, 0);
    this.set('ready');
  }

  nextLevel(): void {
    if (this.phase !== 'cleared' || !this.sim) return;
    this.newSim(this.level + 1, this.sim.score);
    this.set('ready');
  }

  pause(): void {
    if (this.phase !== 'playing' && this.phase !== 'ready') return;
    this.resumeTo = this.phase;
    this.set('paused');
  }

  resume(): void {
    if (this.phase !== 'paused') return;
    this.stepper.reset();
    this.set(this.resumeTo);
  }

  toTitle(): void {
    this.sim = null;
    this.ending = null;
    this.aim = null;
    this.set('title');
  }

  /** Zap the disc at (col,row). Only while playing. */
  zapAt(col: number, row: number): boolean {
    if (this.phase !== 'playing' || !this.sim || this.ending) return false;
    const ok = this.sim.zap(col, row);
    this.flush(this.sim, false);
    return ok;
  }

  zapAim(): boolean { return this.aim ? this.zapAt(this.aim.col, this.aim.row) : false; }

  aimAt(col: number, row: number, source: Aim['source']): void { this.aim = { col, row, source }; }
  clearAim(): void { this.aim = null; }

  /** Move the keyboard cursor; the first press just reveals it. */
  moveAim(dc: number, dr: number): void {
    const cur = this.aim?.source === 'kbd' ? this.aim : { col: 4, row: CONFIG.grid.floorRow - 2 };
    const reveal = this.aim?.source !== 'kbd';
    const col = Math.min(CONFIG.grid.cols - 1, Math.max(0, cur.col + (reveal ? 0 : dc)));
    const row = Math.min(CONFIG.grid.floorRow, Math.max(1, cur.row + (reveal ? 0 : dr)));
    this.aim = { col, row, source: 'kbd' };
  }

  private flush(sim: Sim, attract: boolean): void {
    for (const e of sim.drain()) this.hooks.onSim(e, attract);
  }

  /** Advance by a real frame of `dtSec` seconds. */
  frame(dtSec: number): void {
    if (this.phase === 'title') { this.stepAttract(dtSec); return; }
    const sim = this.sim;
    if (!sim) return;
    if (this.phase === 'ready') {
      this.timer -= dtSec;
      if (this.timer <= 0) { this.timer = 0; this.set('playing'); }
      return;
    }
    if (this.phase === 'playing') this.stepPlay(sim, dtSec);
  }

  private stepAttract(dtSec: number): void {
    this.attractStepper.advance(dtSec, () => {
      for (const e of this.attract.step(CONFIG.sim.dt)) this.hooks.onSim(e, true);
      return true;
    });
  }

  private stepPlay(sim: Sim, dtSec: number): void {
    if (this.ending) { this.stepEnding(dtSec); return; }
    this.stepper.advance(dtSec, () => {
      sim.step(CONFIG.sim.dt);
      this.flush(sim, false);
      return sim.status === 'playing';
    });
    if (sim.status !== 'playing') this.beginEnding(sim);
  }

  private beginEnding(sim: Sim): void {
    this.ending = sim.status === 'cleared' ? 'cleared' : 'over';
    this.timer = this.ending === 'cleared' ? CONFIG.flow.clearDelaySec : CONFIG.flow.endDelaySec;
    if (this.ending === 'cleared') {
      const bonus = levelBonus(this.level, sim.remaining, sim.params.seconds);
      sim.score += bonus;
      this.clearInfo = { level: this.level, bonus, score: sim.score };
    }
  }

  private stepEnding(dtSec: number): void {
    this.timer -= dtSec;
    if (this.timer > 0) return;
    const sim = this.sim as Sim;
    if (this.ending === 'cleared') { this.set('cleared'); return; }
    const reason = sim.overReason ?? 'time';
    const rec = recordRun(this.scores, sim.score, this.level);
    this.scores = rec.scores;
    this.result = { score: sim.score, level: this.level, reason, isNew: rec.isNew };
    this.set('over');
  }

  /** Debug helpers (used by ?debug=1 only). */
  autoplayOnce(): boolean {
    const m = this.sim ? bestMove(this.sim) : null;
    return m ? this.zapAt(m.col, m.row) : false;
  }
}
