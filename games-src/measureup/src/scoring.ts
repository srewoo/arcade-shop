import { CONFIG } from './config';

export type Stars = 1 | 2 | 3;

/** Most moves that still earn two stars. */
export function twoStarLimit(par: number): number {
  const { twoStarSlackRatio, twoStarMinSlack } = CONFIG.scoring;
  return par + Math.max(twoStarMinSlack, Math.ceil(par * twoStarSlackRatio));
}

/** 3 stars at par, 2 within slack, otherwise 1; hints cap the result. */
export function starsFor(moves: number, par: number, hintsUsed: number): Stars {
  const { hintStarCap } = CONFIG.scoring;
  let stars: Stars = moves <= par ? 3 : moves <= twoStarLimit(par) ? 2 : 1;
  if (hintsUsed > 0 && stars > hintStarCap) stars = hintStarCap as Stars;
  return stars;
}

export const starText = (n: number): string => '★'.repeat(n) + '☆'.repeat(Math.max(0, 3 - n));
