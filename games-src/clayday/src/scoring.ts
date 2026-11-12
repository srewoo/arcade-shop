// Pure scoring rules: hit values, the combo multiplier, double bonus and the
// end-of-round bonuses. No state lives here; the simulation owns the streak.
import { CONFIG } from './config';
import type { ClayKind } from './clay';

/** Multiplier for the Nth consecutive hit (1 = first hit of a streak). */
export function comboMult(streak: number): number {
  const s = CONFIG.score;
  if (streak <= 1) return 1;
  return Math.min(s.comboMax, 1 + s.comboStep * (streak - 1));
}

export function baseValue(kind: ClayKind): number {
  const s = CONFIG.score;
  if (kind === 'mini') return s.hit + s.miniBonus;
  if (kind === 'gold') return s.hit + s.goldBonus;
  return s.hit;
}

export interface HitScore {
  readonly base: number;
  readonly mult: number;
  readonly points: number;
}

export function hitScore(kind: ClayKind, streak: number): HitScore {
  const base = baseValue(kind);
  const mult = comboMult(streak);
  return { base, mult, points: Math.round(base * mult) };
}

/** Bonus for breaking every clay of a double or crossing throw. */
export const doubleBonus = (streak: number): number => Math.round(CONFIG.score.doubleBonus * comboMult(streak));

export const timeBonus = (secondsLeft: number): number =>
  Number.isFinite(secondsLeft) ? Math.max(0, Math.floor(secondsLeft)) * CONFIG.score.timeBonusPerSec : 0;

export const perfectBonus = (hits: number, total: number): number => (hits === total && total > 0 ? CONFIG.score.perfectBonus : 0);
