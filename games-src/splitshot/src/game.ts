// Game controller: phases, fixed-step stepping, run/lives flow, best score. DOM-free.
import { CONFIG } from './config';
import { FixedStepper } from './loop';
import { loadBest, mergeBest, saveBest, type Best } from './scores';
import { botInput } from './sim/bot';
import { bankClear, bankLoss, newRun, type Run } from './sim/run';
import { createSim, stepSim, type Sim } from './sim/sim';
import type { Input, SimEvent } from './sim/types';

export type Phase = 'title' | 'ready' | 'playing' | 'paused' | 'clear' | 'lost' | 'over';
export interface Result { score: number; stage: number; isNew: boolean }
type Resumable = 'ready' | 'playing' | 'clear' | 'lost';

export interface GameDeps { onChange: () => void; loadBest?: () => Best; saveBest?: (b: Best) => void; seed?: number }

export class Game {
  phase: Phase = 'title';
  run: Run = newRun();
  sim: Sim;
  demo: Sim;
  best: Best;
  result: Result | null = null;
  /** Real seconds left in the clear/lost pause; used by the renderer for banners. */
  phaseTimer = 0;
  /** Set when the last cleared stage granted an extra life. */
  gotExtraLife = false;
  readonly input: Input = { left: false, right: false, fire: false };
  readonly events: SimEvent[] = [];
  private pausedFrom: Resumable = 'playing';
  private demoStage = 0;
  private readonly stepper = new FixedStepper(CONFIG.sim.dt, CONFIG.sim.maxFrame, CONFIG.sim.maxSteps);
  private readonly demoStepper = new FixedStepper(CONFIG.sim.dt, CONFIG.sim.maxFrame, CONFIG.sim.maxSteps);

  constructor(private readonly deps: GameDeps) {
    this.best = (deps.loadBest ?? loadBest)();
    this.sim = createSim(0, 0, deps.seed ?? 1);
    this.demo = createSim(0, 0, 3, true);
  }

  get alpha(): number { return (this.phase === 'title' ? this.demoStepper : this.stepper).alpha; }
  /** The sim to draw for the current phase. */
  get view(): Sim { return this.phase === 'title' ? this.demo : this.sim; }

  private set(phase: Phase): void { this.phase = phase; this.deps.onChange(); }
  private anyInput(): boolean { return this.input.left || this.input.right || this.input.fire; }

  private beginStage(): void {
    this.sim = createSim(this.run.stage, this.run.score, this.deps.seed ?? 1);
    this.stepper.reset();
    this.set('ready');
  }

  start(): void {
    this.run = newRun();
    this.result = null;
    this.gotExtraLife = false;
    this.clearInput();
    this.beginStage();
  }

  toTitle(): void {
    if (this.phase !== 'title') this.commitBest();
    this.clearInput();
    this.demoStage = 0;
    this.demo = createSim(0, 0, 3, true);
    this.set('title');
  }

  pause(): void {
    if (this.phase === 'ready' || this.phase === 'playing' || this.phase === 'clear' || this.phase === 'lost') {
      this.pausedFrom = this.phase;
      this.clearInput();
      this.set('paused');
    }
  }

  resume(): void {
    if (this.phase !== 'paused') return;
    this.clearInput();
    this.stepper.reset();
    this.set(this.pausedFrom);
  }

  clearInput(): void { this.input.left = this.input.right = this.input.fire = false; }

  private commitBest(): boolean {
    const { best, isNew } = mergeBest(this.best, this.run.score, this.run.stage + 1);
    if (best.score !== this.best.score || best.stage !== this.best.stage) (this.deps.saveBest ?? saveBest)(best);
    this.best = best;
    return isNew;
  }

  private drain(sim: Sim): void {
    for (const e of sim.events) this.events.push(e);
    sim.events.length = 0;
  }

  private frameDemo(dt: number): void {
    this.demoStepper.advance(dt, () => { stepSim(this.demo, botInput(this.demo)); return true; });
    this.drain(this.demo);
    if (this.demo.status !== 'play') {
      this.demoStage = (this.demoStage + 1) % 6;
      this.demo = createSim(this.demoStage, 0, 3, true);
    }
  }

  private framePlaying(dt: number): void {
    this.stepper.advance(dt, () => { stepSim(this.sim, this.input); return this.sim.status === 'play'; });
    this.drain(this.sim);
    if (this.sim.status === 'cleared') { this.phaseTimer = CONFIG.phases.clearSec; this.set('clear'); }
    else if (this.sim.status === 'lost') { this.phaseTimer = CONFIG.phases.lostSec; this.set('lost'); }
  }

  private finishClear(): void {
    const before = this.run.lives;
    this.run = bankClear(this.run, this.sim);
    this.gotExtraLife = this.run.lives > before;
    this.commitBest();
    this.beginStage();
  }

  private finishLoss(): void {
    const { run, over } = bankLoss(this.run);
    this.run = run;
    this.gotExtraLife = false;
    if (!over) { this.beginStage(); return; }
    const isNew = this.commitBest();
    this.result = { score: this.run.score, stage: this.run.stage + 1, isNew };
    this.set('over');
  }

  /** Advance by `dt` real seconds. Returns the sim events produced (array reused each call). */
  frame(dt: number): readonly SimEvent[] {
    this.events.length = 0;
    const p = this.phase;
    if (p === 'title') this.frameDemo(dt);
    else if (p === 'ready') { if (this.anyInput()) { this.set('playing'); this.framePlaying(dt); } }
    else if (p === 'playing') this.framePlaying(dt);
    else if (p === 'clear' || p === 'lost') {
      this.phaseTimer -= dt;
      if (this.phaseTimer <= 0) { if (p === 'clear') this.finishClear(); else this.finishLoss(); }
    }
    return this.events;
  }

  /** Debug helper: rebuild the stage for the run's current stage index. */
  restageForDebug(): void { this.beginStage(); }

  /** Debug/test helper: remove all bubbles so the stage clears on the next step. */
  debugClear(): void { this.sim.bubbles.length = 0; }
}
