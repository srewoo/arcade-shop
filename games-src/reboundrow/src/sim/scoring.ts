// Pure scoring rules.
import { CONFIG } from '../config';

const S = CONFIG.score;

export const comboMultiplier = (combo: number): number => Math.min(1 + Math.floor(combo / S.comboStep), S.comboMaxMul);

/** Points for one ball hit on a brick; `combo` already includes this hit. */
export function brickPoints(destroyed: boolean, maxHp: number, combo: number): number {
  const base = destroyed ? S.breakPerHp * maxHp : S.hit;
  return base * comboMultiplier(combo);
}

export const clearBonus = (lives: number): number => S.clearBase + S.clearPerLife * Math.max(0, lives);

export type ClearTier = 'flawless' | 'steady' | 'scraped';

/** Result-card tier for a cleared level, from lives lost on that level. */
export const clearTier = (livesLost: number): ClearTier =>
  livesLost <= 0 ? 'flawless' : livesLost === 1 ? 'steady' : 'scraped';
