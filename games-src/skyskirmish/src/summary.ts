// Pure helpers for the results screens: accuracy, rank tier and the score count-up curve.
import type { RunStats } from './types';

export type Tier = 'rookie' | 'wingman' | 'veteran' | 'ace';

/** Shot accuracy as a whole percentage (0 when nothing was fired). */
export function accuracy(stats: Pick<RunStats, 'fired' | 'hit'>): number {
  if (stats.fired <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round((stats.hit / stats.fired) * 100)));
}

/** Rank shown on the results card. Winning the campaign always earns Ace. */
export function tierFor(won: boolean, wave: number): Tier {
  if (won) return 'ace';
  if (wave >= 9) return 'veteran';
  if (wave >= 5) return 'wingman';
  return 'rookie';
}

/** Ease-out count-up value at time t (seconds) for a target reached after `dur` seconds. */
export function countValue(target: number, t: number, dur: number): number {
  if (dur <= 0 || t >= dur) return target;
  if (t <= 0) return 0;
  const k = 1 - (1 - t / dur) ** 3;
  return Math.round(target * k);
}
