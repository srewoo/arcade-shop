// Turn flow for one hot-seat match: aim -> rolling -> (sink | splash | rest) -> next player/hole.
import { CONFIG } from '../config';
import { FixedStepper } from '../loop';
import { Sim } from '../physics/sim';
import type { SimEvent } from '../physics/types';
import { aimAt, type Aim } from './aim';
import { Match, type MatchSetup } from './match';
import { KIND_LABEL, isCelebration, scoreKind, type ScoreKind } from './scoring';

export type Phase = 'setup' | 'aim' | 'rolling' | 'sinking' | 'splash' | 'pickup' | 'holeDone' | 'complete';
export type FxEvent =
  | SimEvent
  | { readonly type: 'callout'; readonly text: string; readonly kind: ScoreKind | 'water'; readonly celebrate: boolean }
  | { readonly type: 'turn'; readonly player: number }
  | { readonly type: 'holeDone' }
  | { readonly type: 'complete' };

export interface GameHooks { onFx: (e: FxEvent) => void; onChange: () => void }

export class Game {
  phase: Phase = 'setup';
  match: Match | null = null;
  sim: Sim | null = null;
  aim: Aim = { angle: 0, power: CONFIG.aim.defaultPower };
  strokes = 0;
  paused = false;
  /** 0..1 progress of the ball dropping into the cup. */
  sinkT = 0;
  readonly stepper = new FixedStepper(CONFIG.sim.dt, CONFIG.sim.maxFrameSec, CONFIG.sim.maxStepsPerFrame);
  private timer = 0;
  private holeTick = 0;
  private lastKind: ScoreKind = 'par';

  constructor(private readonly hooks: GameHooks) {}

  get playerIdx(): number { return this.match?.player ?? 0; }
  get alpha(): number { return this.stepper.alpha; }
  get lastScoreKind(): ScoreKind { return this.lastKind; }

  start(setup: MatchSetup): void {
    this.match = new Match(setup);
    this.holeTick = 0;
    this.paused = false;
    this.beginTurn();
  }

  toSetup(): void {
    this.match = null; this.sim = null; this.paused = false;
    this.set('setup');
  }

  restartMatch(): void { if (this.match) this.start(this.match.setup); }

  pause(): void {
    if (this.phase === 'setup' || this.phase === 'holeDone' || this.phase === 'complete' || this.paused) return;
    this.paused = true;
    this.hooks.onChange();
  }

  resume(): void {
    if (!this.paused) return;
    this.paused = false;
    this.stepper.reset();
    this.hooks.onChange();
  }

  /** Player is on the tee or resting: can they hit? */
  get canShoot(): boolean { return this.phase === 'aim' && !this.paused; }

  shoot(): boolean {
    if (!this.canShoot || !this.sim) return false;
    if (!this.sim.strike(this.aim.angle, this.aim.power)) return false;
    this.strokes++;
    this.stepper.reset();
    this.set('rolling');
    return true;
  }

  frame(dt: number): void {
    const sim = this.sim;
    if (this.paused || !sim) return;
    this.stepper.advance(dt, () => { sim.step(); this.drain(sim); });
    if (this.timer > 0) {
      this.timer -= dt;
      if (this.phase === 'sinking') this.sinkT = Math.min(1, 1 - this.timer / CONFIG.flow.sinkSec);
      if (this.timer <= 0) this.afterTimer();
    }
  }

  nextHole(): void {
    const m = this.match;
    if (!m || this.phase !== 'holeDone') return;
    if (m.isLastHole) { this.set('complete'); this.hooks.onFx({ type: 'complete' }); return; }
    m.beginHole(m.holeIdx + 1);
    this.holeTick = 0;
    this.beginTurn();
  }

  private set(p: Phase): void {
    this.phase = p;
    this.hooks.onChange();
  }

  private beginTurn(): void {
    const m = this.match;
    if (!m) return;
    this.sim = new Sim(m.hole, this.holeTick);
    this.strokes = 0;
    this.sinkT = 0;
    this.timer = 0;
    this.aim = aimAt(m.hole.tee, m.hole.cup);
    this.stepper.reset();
    this.hooks.onFx({ type: 'turn', player: m.player });
    this.set('aim');
  }

  private drain(sim: Sim): void {
    if (sim.events.length === 0) return;
    const evs = sim.events.splice(0);
    for (const e of evs) {
      this.hooks.onFx(e);
      if (e.type === 'sink') this.onSink();
      else if (e.type === 'splash') this.onSplash();
      else if (e.type === 'rest') this.onRest();
    }
  }

  private onSink(): void {
    const m = this.match;
    if (!m) return;
    const kind = scoreKind(this.strokes, m.hole.par);
    this.lastKind = kind;
    m.record(m.player, this.strokes);
    this.hooks.onFx({ type: 'callout', text: KIND_LABEL[kind], kind, celebrate: isCelebration(kind) });
    this.timer = CONFIG.flow.sinkSec;
    this.sinkT = 0;
    this.set('sinking');
  }

  private onSplash(): void {
    this.strokes += CONFIG.shot.waterPenalty;
    this.hooks.onFx({ type: 'callout', text: `Splash! +${CONFIG.shot.waterPenalty} stroke`, kind: 'water', celebrate: false });
    this.timer = CONFIG.flow.waterSec;
    this.set('splash');
  }

  private onRest(): void {
    if (this.strokes >= CONFIG.shot.maxStrokes) this.pickUp();
    else this.set('aim');
    if (this.phase === 'aim' && this.sim && this.match) this.aim = aimAt(this.sim.ball, this.match.hole.cup, this.aim.power);
  }

  private pickUp(): void {
    const m = this.match;
    if (!m) return;
    this.lastKind = 'pickup';
    m.record(m.player, CONFIG.shot.maxStrokes, true);
    this.hooks.onFx({ type: 'callout', text: KIND_LABEL.pickup, kind: 'pickup', celebrate: false });
    this.timer = CONFIG.flow.pickupSec;
    this.set('pickup');
  }

  private afterTimer(): void {
    const m = this.match;
    const sim = this.sim;
    if (!m || !sim) return;
    if (this.phase === 'splash') {
      if (this.strokes >= CONFIG.shot.maxStrokes) { this.pickUp(); return; }
      sim.place(sim.lastSpot);
      this.aim = aimAt(sim.ball, m.hole.cup, this.aim.power);
      this.set('aim');
      return;
    }
    this.holeTick = sim.tick;
    if (m.nextTurn()) this.beginTurn();
    else { this.set('holeDone'); this.hooks.onFx({ type: 'holeDone' }); }
  }
}
