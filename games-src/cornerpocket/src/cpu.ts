// CPU opponent: generate candidate shots geometrically, simulate each with the real
// physics, score the outcome, then perturb the winner with aim noise (Easy/Pro).
import { BALL_R, POCKETS, TABLE_H, TABLE_W } from './constants';
import { CPU } from './config/cpu';
import { type Ball, cloneBalls } from './physics';
import { validSpot } from './layouts';
import { type Rng, gauss } from './rng';
import { type Shot, clamp, simulateShot } from './sim';

export type Level = 'easy' | 'pro';
export interface CpuOptions { level: Level; rng: Rng }
interface Scored { shot: Shot; score: number; cost: number }

const NOISE = CPU.noise;

function candidateShots(balls: readonly Ball[], targets: readonly number[], limit: number): Shot[] {
  const cue = balls.find((b) => b.id === 0 && !b.pocketed);
  if (!cue) return [];
  const out: { shot: Shot; cost: number }[] = [];
  for (const t of balls) {
    if (t.pocketed || !targets.includes(t.id)) continue;
    const direct = Math.atan2(t.y - cue.y, t.x - cue.x);
    out.push({ shot: { angle: direct, power: 0.4, spin: 0 }, cost: 5000 });
    for (const p of POCKETS) {
      const dx = p.x - t.x; const dy = p.y - t.y;
      const dl = Math.hypot(dx, dy) || 1;
      const gx = t.x - (dx / dl) * 2 * BALL_R; const gy = t.y - (dy / dl) * 2 * BALL_R;
      if (gx < BALL_R || gx > TABLE_W - BALL_R || gy < BALL_R || gy > TABLE_H - BALL_R) continue;
      const cd = Math.hypot(gx - cue.x, gy - cue.y) || 1;
      const cut = ((gx - cue.x) / cd) * (dx / dl) + ((gy - cue.y) / cd) * (dy / dl);
      if (cut < 0.2) continue;
      const base = clamp(0.28 + (cd + dl) / 1100, 0.3, 1);
      const angle = Math.atan2(gy - cue.y, gx - cue.x);
      const cost = cd + dl + (1 - cut) * 400;
      out.push({ shot: { angle, power: base, spin: 0 }, cost });
      out.push({ shot: { angle, power: Math.min(1, base + 0.3), spin: 0 }, cost: cost + 1 });
    }
  }
  return out.sort((a, b) => a.cost - b.cost).slice(0, limit).map((c) => c.shot);
}

function scoreShot(balls: readonly Ball[], shot: Shot, targets: readonly number[]): number {
  const { report } = simulateShot(balls, shot, CPU.simSeconds);
  let s = 0;
  const legal = report.firstHit !== null && targets.includes(report.firstHit);
  if (report.cuePotted) s -= 300;
  if (!legal) s -= 200;
  for (const id of report.potted) {
    if (targets.includes(id)) s += id === 8 ? 2000 : 100;
    else s -= id === 8 ? 5000 : 60;
  }
  if (report.potted.some((id) => targets.includes(id)) && !report.cuePotted && legal) s += 40;
  return s;
}

/** Steps of CPU planning: one candidate shot is simulated per `yield`, so callers can spread the work across frames. */
export type Plan<T> = Generator<void, T, void>;

function* rankSteps(balls: readonly Ball[], targets: readonly number[], limit: number): Plan<Scored[]> {
  const shots = candidateShots(balls, targets, limit);
  const out: Scored[] = [];
  for (let cost = 0; cost < shots.length; cost++) {
    out.push({ shot: shots[cost]!, cost, score: scoreShot(balls, shots[cost]!, targets) });
    yield;
  }
  return out.sort((a, b) => b.score - a.score || a.cost - b.cost);
}

/** Run a plan to completion in one go (tests, benchmarks, headless callers). */
export function drain<T>(plan: Plan<T>): T {
  for (;;) {
    const r = plan.next();
    if (r.done) return r.value;
  }
}

export function perturb(shot: Shot, opts: CpuOptions): Shot {
  const sd = NOISE[opts.level];
  const pw = opts.level === 'easy' ? 0.08 : 0.01;
  return {
    angle: shot.angle + gauss(opts.rng) * sd,
    power: clamp(shot.power * (1 + gauss(opts.rng) * pw), 0.08, 1),
    spin: shot.spin,
  };
}

/** Pick a shot for the CPU. `targets` are the ball ids it may legally hit first. */
export function* chooseShotSteps(balls: readonly Ball[], targets: readonly number[], opts: CpuOptions): Plan<Shot> {
  const ranked = yield* rankSteps(balls, targets, CPU.candidates);
  let pick = ranked[0]?.shot;
  if (opts.level === 'easy' && ranked.length > 1 && opts.rng() < CPU.runnerUpChance) pick = ranked[1]!.shot;
  if (!pick) {
    const cue = balls.find((b) => b.id === 0);
    pick = { angle: opts.rng() * Math.PI * 2, power: 0.3, spin: 0 };
    if (cue) pick = { ...pick, angle: Math.atan2(TABLE_H / 2 - cue.y, TABLE_W / 2 - cue.x) };
  }
  return perturb(pick, opts);
}
export const chooseShot = (balls: readonly Ball[], targets: readonly number[], opts: CpuOptions): Shot => drain(chooseShotSteps(balls, targets, opts));

/** Choose where to place the cue ball (ball in hand): best simulated outlook among a few spots. */
export function* chooseCuePlacementSteps(balls: readonly Ball[], targets: readonly number[]): Plan<{ x: number; y: number }> {
  const spots: { x: number; y: number }[] = [];
  for (const fx of [0.15, 0.3, 0.5]) for (const fy of [0.25, 0.5, 0.75]) spots.push({ x: TABLE_W * fx, y: TABLE_H * fy });
  let best = { x: 200, y: TABLE_H / 2 }; let bestScore = -Infinity;
  for (const sp of spots) {
    const trial = cloneBalls(balls);
    const cue = trial.find((b) => b.id === 0)!;
    cue.pocketed = false; cue.x = sp.x; cue.y = sp.y;
    if (!validSpot(trial, sp.x, sp.y)) continue;
    const top = (yield* rankSteps(trial, targets, CPU.placementCandidates))[0];
    const sc = top ? top.score : -999;
    if (sc > bestScore) { bestScore = sc; best = sp; }
  }
  return best;
}
export const chooseCuePlacement = (balls: readonly Ball[], targets: readonly number[]): { x: number; y: number } => drain(chooseCuePlacementSteps(balls, targets));
