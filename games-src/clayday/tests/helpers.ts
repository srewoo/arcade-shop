import { Rng, roundSeed } from '../src/rng';
import { roundParams, type Mode, type RoundParams } from '../src/rounds';
import { Round } from '../src/sim';
import { planRound } from '../src/throws';
import { makeWorld, type World } from '../src/world';

export const DT = 1 / 60;
export const WORLD = makeWorld(1000, 600);

export function makeRound(round = 1, seed = 1234, mode: Mode = 'campaign', world: World = WORLD, over: Partial<RoundParams> = {}): Round {
  const params = { ...roundParams(round, mode), ...over };
  return new Round(world, params, planRound(params, new Rng(roundSeed(seed, round))));
}

/** Step until the ready countdown ends. */
export function goLive(r: Round): void {
  for (let i = 0; i < 600 && r.phase === 'ready'; i++) r.step(DT);
}

export interface BotOpts {
  /** Seconds after launch before the bot fires. */
  readonly after?: number;
  /** Ignore every Nth clay entirely (forces misses). */
  readonly skipEvery?: number;
}

/** A bot that leads each clay perfectly. Returns the number of sim steps used. */
export function runBot(r: Round, opts: BotOpts = {}): number {
  const after = opts.after ?? 0.5;
  const skipped = new Set<number>();
  let steps = 0;
  while (r.phase !== 'done' && steps < 60 * 400) {
    r.step(DT);
    steps++;
    if (opts.skipEvery) for (const c of r.clays) if (c.id % opts.skipEvery === 0) skipped.add(c.id);
    if (r.phase !== 'live' || r.gun.reloading || r.gun.shells <= 0) continue;
    const target = r.clays.find((c) => c.state === 'flying' && c.age >= after && !skipped.has(c.id));
    if (!target) continue;
    const p = r.predict(target, 7 / 60);
    skipped.add(target.id);
    r.fire(p.x, p.y);
  }
  return steps;
}
