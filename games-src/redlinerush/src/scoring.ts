// Pure scoring rules.
import { CONFIG } from './config';

const S = CONFIG.scoring;

export const distancePoints = (units: number): number => units * S.perUnit;

/** Combo multiplier: x1 at first near miss, +1 every `multEvery` further, capped. */
export const multiplier = (combo: number): number =>
  combo <= 0 ? 1 : Math.min(S.maxMult, 1 + Math.floor((combo - 1) / S.multEvery));

export const nearPoints = (combo: number, boosted: boolean): number =>
  S.near * multiplier(combo) * (boosted ? S.boostMul : 1);

/** Clearance is the gap between car bodies in lanes; 0 would be contact. */
export const isNearMiss = (clearance: number): boolean => clearance >= 0 && clearance < S.nearGap;

export const finishBonus = (timeLeft: number): number =>
  CONFIG.trial.finishPoints + Math.floor(Math.max(0, timeLeft)) * CONFIG.trial.timePoints;

/** Top speed rises with distance until the cap. */
export const topSpeed = (z: number): number =>
  Math.min(CONFIG.speed.topCap, CONFIG.speed.baseTop + z * CONFIG.speed.topPerUnit);
