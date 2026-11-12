// One round of 25 clays: ready countdown, throws, shots, scoring and the
// clock. Pure and DOM-free; the controller steps it at a fixed timestep.
import { clayPoint, launchClay, landingAge, stepClay, type Clay } from './clay';
import { CONFIG } from './config';
import type { RoundOutcome, RoundResult, SimEvent } from './events';
import { Gun } from './gun';
import type { RoundParams } from './rounds';
import { doubleBonus, hitScore, perfectBonus, timeBonus } from './scoring';
import { claysInPattern, type Shot } from './shots';
import type { ThrowSpec } from './throws';
import type { World } from './world';

export type Phase = 'ready' | 'live' | 'done';
export type ClayMark = 'pending' | 'hit' | 'miss';

interface ActiveThrow {
  readonly index: number;
  readonly spec: ThrowSpec;
  t: number;
  launched: number;
}

const LOW_TIME = [10, 5, 3, 2, 1] as const;

export class Round {
  readonly gun = new Gun();
  readonly clays: Clay[] = [];
  readonly shots: Shot[] = [];
  readonly marks: ClayMark[];
  readonly events: SimEvent[] = [];
  phase: Phase = 'ready';
  readyLeft = CONFIG.round.readyMs / 1000;
  timeLeft: number;
  score = 0;
  streak = 0;
  bestStreak = 0;
  hits = 0;
  shotsFired = 0;
  doubles = 0;
  wind = 0;
  result: RoundResult | null = null;
  private active: ActiveThrow | null = null;
  private nextThrow = 0;
  private gapLeft = 0.4;
  private lowIdx = 0;
  private resolved = 0;

  constructor(
    readonly world: World,
    readonly params: RoundParams,
    readonly plan: readonly ThrowSpec[],
  ) {
    this.timeLeft = params.timeSec > 0 ? params.timeSec : Number.POSITIVE_INFINITY;
    this.marks = Array.from({ length: params.clays }, () => 'pending');
    this.wind = plan[0]?.wind ?? 0;
  }

  get timed(): boolean {
    return Number.isFinite(this.timeLeft);
  }

  get launched(): number {
    return this.clays.length;
  }

  /** Advance by one fixed step. */
  step(dt: number): void {
    if (this.phase === 'done') return;
    if (this.phase === 'ready') {
      this.readyLeft -= dt;
      if (this.readyLeft <= 0) {
        this.phase = 'live';
        this.events.push({ type: 'pull' });
      }
      return;
    }
    this.tickClock(dt);
    if (this.phase !== 'live') return;
    if (this.gun.step(dt)) this.events.push({ type: 'loaded' });
    this.advanceThrow(dt);
    for (const clay of this.clays) if (clay.state === 'flying') this.moveClay(clay, dt);
    this.resolveShots(dt);
    this.settleThrow();
    if (this.resolved >= this.params.clays) this.finish('complete');
  }

  /** Pull the trigger at a world point. Returns true if a shell went off. */
  fire(x: number, y: number): boolean {
    if (this.phase !== 'live') return false;
    const r = this.gun.fire();
    if (r !== 'fired') {
      this.events.push({ type: 'dry' });
      return false;
    }
    this.shotsFired += 1;
    this.shots.push({ x, y, age: 0 });
    this.events.push({ type: 'shot', x, y, shells: this.gun.shells });
    if (this.gun.reloading) this.events.push({ type: 'reload' });
    return true;
  }

  reload(): boolean {
    if (this.phase !== 'live' || !this.gun.reload()) return false;
    this.events.push({ type: 'reload' });
    return true;
  }

  private tickClock(dt: number): void {
    if (!this.timed) return;
    this.timeLeft -= dt;
    const left = Math.ceil(this.timeLeft);
    const mark = LOW_TIME[this.lowIdx];
    if (mark !== undefined && this.timeLeft <= mark) {
      this.events.push({ type: 'lowtime', seconds: left });
      this.lowIdx += 1;
    }
    if (this.timeLeft <= 0) {
      this.timeLeft = 0;
      this.finish('timeout');
    }
  }

  private advanceThrow(dt: number): void {
    if (!this.active) {
      this.gapLeft -= dt;
      const spec = this.plan[this.nextThrow];
      if (!spec || this.gapLeft > 0 || !this.gunReadyFor(spec)) return;
      this.active = { index: this.nextThrow, spec, t: 0, launched: 0 };
      this.nextThrow += 1;
      this.wind = spec.wind;
    }
    const a = this.active;
    a.t += dt;
    while (a.launched < a.spec.clays.length && a.spec.clays[a.launched]!.delay <= a.t) {
      const cs = a.spec.clays[a.launched]!;
      const clay = launchClay(this.clays.length, a.index, cs, this.world, a.spec.wind);
      this.clays.push(clay);
      a.launched += 1;
      this.events.push({ type: 'launch', id: clay.id, kind: cs.kind, side: cs.side, throwKind: a.spec.kind, wind: a.spec.wind });
    }
  }

  /** Pairs need two shells: the range tops the gun up first instead of throwing an unwinnable pair. */
  private gunReadyFor(spec: ThrowSpec): boolean {
    const need = Math.min(spec.clays.length, this.gun.cap);
    if (this.gun.shells >= need) return true;
    if (this.gun.reload()) this.events.push({ type: 'reload' });
    return false;
  }

  private moveClay(clay: Clay, dt: number): void {
    stepClay(clay, this.world, dt);
    if (clay.age < landingAge(clay.spec, this.world)) return;
    clay.state = 'missed';
    this.marks[clay.id] = 'miss';
    this.streak = 0;
    this.resolved += 1;
    this.events.push({ type: 'miss', id: clay.id, x: clay.x, y: Math.min(clay.y, this.world.groundY) });
  }

  private resolveShots(dt: number): void {
    const delay = CONFIG.gun.pelletDelayMs / 1000;
    for (const shot of this.shots) shot.age += dt;
    while (this.shots[0] && this.shots[0].age >= delay) {
      const shot = this.shots.shift()!;
      for (const clay of claysInPattern(shot, this.clays, this.params.spread)) this.breakClay(clay);
    }
  }

  private breakClay(clay: Clay): void {
    clay.state = 'broken';
    this.marks[clay.id] = 'hit';
    this.hits += 1;
    this.resolved += 1;
    this.streak += 1;
    this.bestStreak = Math.max(this.bestStreak, this.streak);
    const s = hitScore(clay.spec.kind, this.streak);
    this.score += s.points;
    this.events.push({ type: 'break', id: clay.id, x: clay.x, y: clay.y, kind: clay.spec.kind, points: s.points, mult: s.mult, streak: this.streak });
  }

  /** When every clay of the active throw is down: award the double bonus and start the gap. */
  private settleThrow(): void {
    const a = this.active;
    if (!a || a.launched < a.spec.clays.length) return;
    const mine = this.clays.filter((c) => c.throwIndex === a.index);
    if (mine.some((c) => c.state === 'flying')) return;
    if (mine.length > 1 && mine.every((c) => c.state === 'broken')) {
      const points = doubleBonus(this.streak);
      this.score += points;
      this.doubles += 1;
      const last = mine[mine.length - 1]!;
      this.events.push({ type: 'double', points, x: last.x, y: last.y });
    }
    this.active = null;
    this.gapLeft = a.spec.gap;
    const nxt = this.plan[this.nextThrow];
    if (nxt) this.wind = nxt.wind;
  }

  private finish(outcome: RoundOutcome): void {
    for (const clay of this.clays) if (clay.state === 'flying') clay.state = 'missed';
    this.phase = 'done';
    const total = this.params.clays;
    const left = outcome === 'complete' ? this.timeLeft : 0;
    const tb = timeBonus(left);
    const pb = perfectBonus(this.hits, total);
    this.result = {
      outcome,
      hits: this.hits,
      total,
      score: this.score,
      timeBonus: tb,
      perfectBonus: pb,
      finalScore: this.score + tb + pb,
      passed: this.params.mode === 'practice' || this.hits >= this.params.passHits,
      shotsFired: this.shotsFired,
      doubles: this.doubles,
      bestStreak: this.bestStreak,
      secondsLeft: Number.isFinite(left) ? Math.floor(left) : 0,
    };
    this.events.push({ type: 'end', outcome });
  }

  /** Where a live clay will be `ahead` seconds from now (used by tests and the debug bot). */
  predict(clay: Clay, ahead: number): { x: number; y: number } {
    return clayPoint(clay.spec, this.world, clay.wind, clay.age + ahead);
  }
}
