import { CONFIG } from './config';

/** 3 stars = optimal, 2 = within the tolerance, 1 = solved. A hint caps the result. */
export function starsFor(moves: number, optimal: number, hintsUsed: number): 1 | 2 | 3 {
  let stars: 1 | 2 | 3 = 1;
  if (moves <= optimal) stars = 3;
  else if (moves <= Math.ceil(optimal * CONFIG.stars.twoStarFactor)) stars = 2;
  if (hintsUsed > 0 && stars > CONFIG.stars.hintCap) stars = CONFIG.stars.hintCap;
  return stars;
}

/** Move counts needed for each star tier (hints cap the result separately). */
export function starThresholds(optimal: number): { three: number; two: number } {
  return { three: optimal, two: Math.ceil(optimal * CONFIG.stars.twoStarFactor) };
}

export type ResultKind = 'perfect' | 'hintCapped' | 'close' | 'done';

/**
 * Which copy the result card uses. 'perfect' is only for best-possible moves with no hints;
 * best-possible moves with a hint is 'hintCapped' so the card never claims perfection it withheld.
 */
export function resultKind(moves: number, optimal: number, hints: number): ResultKind {
  if (moves <= optimal) return hints > 0 ? 'hintCapped' : 'perfect';
  return moves <= starThresholds(optimal).two ? 'close' : 'done';
}

export function formatTime(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

/** Optimal formula for a classic line of n + n with one gap. */
export const classicOptimal = (n: number): number => n * n + 2 * n;
