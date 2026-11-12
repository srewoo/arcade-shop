// 8-Ball vs CPU and 2-player hot-seat. Rules live in rules8.ts; the CPU in cpu.ts.
import { CUE_START } from '../constants';
import { CPU } from '../config/cpu';
import { type Level, type Plan, chooseCuePlacementSteps, chooseShotSteps } from '../cpu';
import type { Game } from '../game';
import type { Hud, ModeCtl } from '../gameTypes';
import { eightBallRack } from '../layouts';
import { makeRng } from '../rng';
import { type EightState, initialEight, legalTargets, resolveShot } from '../rules8';
import type { Shot, ShotReport } from '../sim';
import { STR } from '../strings';

const THINK = CPU.thinkSeconds; // seconds before the CPU shows its aim
const SHOW = CPU.showSeconds; // seconds the aim line is shown before firing

export class EightMode implements ModeCtl {
  state: EightState = initialEight(0);
  private readonly rng;
  private timer = 0;
  private pending: Shot | null = null;
  private plan: Plan<Shot> | null = null;
  private planned: Shot | null = null;
  private placePlan: Plan<{ x: number; y: number }> | null = null;
  private placeSpot: { x: number; y: number } | null = null;

  constructor(private readonly g: Game, private readonly vsCpu: boolean, private readonly level: Level, seed: number) {
    this.rng = makeRng(seed);
  }

  start(): void { this.g.setBalls(eightBallRack()); }
  private name(p: 0 | 1): string { return this.vsCpu ? (p === 0 ? 'You' : 'CPU') : `Player ${p + 1}`; }
  humanTurn(): boolean { return !(this.vsCpu && this.state.current === 1); }
  targets(): number[] { return legalTargets(this.state, this.onTable()); }
  highlight(): number[] { return this.state.groups[this.state.current] === null || !this.humanTurn() ? [] : this.targets(); }
  private onTable(): number[] { return this.g.balls.filter((b) => b.id !== 0 && !b.pocketed).map((b) => b.id); }

  /** Advance a CPU plan by a few candidate simulations; returns its result once finished. */
  private work<T>(plan: Plan<T>): { done: true; value: T } | { done: false } {
    for (let i = 0; i < CPU.workPerFrame; i++) {
      const r = plan.next();
      if (r.done) return { done: true, value: r.value };
    }
    return { done: false };
  }

  tick(dt: number): void {
    if (this.humanTurn() || this.g.phase === 'over' || this.g.phase === 'rolling') return;
    this.timer += dt;
    if (this.g.phase === 'place') this.tickPlace();
    else if (!this.pending) this.tickThink();
    else if (this.timer >= SHOW) {
      const shot = this.pending;
      this.pending = null; this.timer = 0;
      this.g.shoot(shot);
    }
  }

  // Planning starts the moment the turn does and is spread over frames; the aim shows after THINK seconds.
  private tickPlace(): void {
    this.placePlan ??= chooseCuePlacementSteps(this.g.balls, legalTargets(this.state, this.onTable()));
    // Once the plan has finished keep its result: asking an exhausted generator again yields undefined.
    if (!this.placeSpot) { const r = this.work(this.placePlan); if (r.done) this.placeSpot = r.value; }
    if (!this.placeSpot || this.timer < THINK) return;
    const p = this.placeSpot;
    this.placePlan = null; this.placeSpot = null;
    this.g.movePlacing(p.x, p.y);
    this.g.confirmPlace();
    this.timer = 0;
  }

  private tickThink(): void {
    this.plan ??= chooseShotSteps(this.g.balls, legalTargets(this.state, this.onTable()), { level: this.level, rng: this.rng });
    if (!this.planned) { const r = this.work(this.plan); if (r.done) this.planned = r.value; }
    if (!this.planned || this.timer < THINK) return;
    this.pending = this.planned; this.plan = null; this.planned = null;
    this.g.angle = this.pending.angle; this.g.power = this.pending.power;
    this.timer = 0;
  }

  onShotEnd(r: ShotReport): void {
    const before = this.state;
    this.state = resolveShot(before, r);
    this.timer = 0; this.pending = null; this.plan = null; this.planned = null; this.placePlan = null; this.placeSpot = null;
    if (r.cuePotted) this.g.respawnCue(CUE_START.x, CUE_START.y);
    const tone = this.state.message.includes('foul') || /Scratch|No ball|Wrong|loss|turn passes/.test(this.state.message) ? 'bad' : 'good';
    const msg = this.state.message.startsWith('No pot') ? STR.missed(this.name(before.current)) : `${this.name(before.current)}: ${this.state.message}`;
    this.g.say(msg, tone);
    if (this.state.current !== before.current && this.state.winner === null) this.g.emit({ t: 'sfx', name: 'turn' });
    if (this.state.winner !== null) { this.finish(this.state.winner); return; }
    if (this.state.ballInHand) this.g.phase = 'place';
  }

  private finish(winner: 0 | 1): void {
    this.g.phase = 'over';
    this.g.emit({
      t: 'over',
      info: {
        mode: this.vsCpu ? 'cpu' : 'duo', won: winner === 0 || !this.vsCpu,
        title: this.vsCpu ? (winner === 0 ? 'You win!' : 'CPU wins') : `${this.name(winner)} wins!`,
        detail: this.state.message,
      },
    });
  }

  hud(): Hud {
    const s = this.state;
    const icon = { solids: '\u25CF ', stripes: '\u25A4 ' } as const; // shape cue: filled disc vs striped square
    const grp = (p: 0 | 1): string => { const g = s.groups[p]; return g ? icon[g] + g : 'open'; };
    const left = (p: 0 | 1): string => {
      const g = s.groups[p];
      if (g === null) return '';
      const n = this.onTable().filter((id) => (g === 'solids' ? id <= 7 : id >= 9)).length;
      return ` (${n} left)`;
    };
    const status = this.g.phase === 'place' && this.humanTurn() ? STR.ballInHandHuman
      : !this.humanTurn() && this.g.phase !== 'rolling' ? STR.cpuThinking : s.message;
    return {
      stats: [
        { label: this.name(0), value: grp(0) + left(0) },
        { label: this.name(1), value: grp(1) + left(1) },
        { label: 'Turn', value: this.name(s.current) },
      ],
      status,
    };
  }
}
