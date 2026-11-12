// A run: which round we are on, the carried score, and the seed that makes
// every round plan reproducible. Pure bookkeeping, no DOM.
import type { RoundResult } from './events';
import { Rng, roundSeed } from './rng';
import { roundParams, type Mode } from './rounds';
import { Round } from './sim';
import { planRound } from './throws';
import type { World } from './world';

export interface Session {
  readonly mode: Mode;
  readonly round: number;
  readonly runScore: number;
  readonly seedBase: number;
}

export type Verdict = 'next' | 'over' | 'practice';

export const newSession = (mode: Mode, round: number, seedBase: number): Session => ({ mode, round, runScore: 0, seedBase });

/** Build the round for this session state in the given world. */
export function buildRound(s: Session, world: World): Round {
  const params = roundParams(s.round, s.mode);
  const plan = planRound(params, new Rng(roundSeed(s.seedBase, s.round)));
  return new Round(world, params, plan);
}

/** Fold a finished round into the session and decide what happens next. */
export function finishRound(s: Session, r: RoundResult): { session: Session; verdict: Verdict } {
  if (s.mode === 'practice') return { session: s, verdict: 'practice' };
  const session = { ...s, runScore: s.runScore + r.finalScore };
  return { session, verdict: r.passed ? 'next' : 'over' };
}

export const advance = (s: Session): Session => ({ ...s, round: s.round + 1 });

export const randomSeed = (): number => Math.floor(Math.random() * 0xffffffff) >>> 0;
