// Star rating against par, and dead-end detection against the time limit.
import { CONFIG } from '../config';
import { solve } from './solver';
import type { Level, State } from './types';

/** 3 stars at par; 2 within half the spare time (bridge) or a few crossings (raft); 1 otherwise. */
export function rate(level: Level, cost: number, hintsUsed: number): number {
  const { maxStars, raftTwoStarSlack, hintStarCap } = CONFIG.rating;
  let stars = 1;
  if (cost <= level.par) stars = maxStars;
  else if (level.limit === null) stars = cost <= level.par + raftTwoStarSlack ? 2 : 1;
  else if (cost <= level.par + Math.ceil((level.limit - level.par) / 2)) stars = 2;
  return hintsUsed > 0 ? Math.min(stars, hintStarCap) : stars;
}

/** True when no route from here can still finish inside the limit. */
export function isDeadEnd(level: Level, s: State): boolean {
  if (level.limit === null) return false;
  const rest = solve(level, s);
  return rest === null || s.cost + rest.cost > level.limit;
}
