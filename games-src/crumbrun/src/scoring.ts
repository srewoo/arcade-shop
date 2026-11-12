// Score, lives and the splash chain. Pure. Numbers come from config/tuning.ts.
import { TUNING } from './config/tuning';

const S = TUNING.scoring;
export const POINTS = S.points;
export const CHAIN_POINTS: readonly number[] = S.chain;
/** Score thresholds that each grant one extra life, once. */
export const EXTRA_LIFE_SCORES: readonly number[] = S.extraLifeAt;
export const START_LIVES = S.startLives;
export const MAX_LIVES = S.maxLives;

export interface ScoreState {
  score: number;
  lives: number;
  /** How many of EXTRA_LIFE_SCORES have already paid out. */
  extrasGiven: number;
}

export function newScore(): ScoreState {
  return { score: 0, lives: START_LIVES, extrasGiven: 0 };
}

/** Add points; returns true when this award crossed an extra-life threshold. */
export function addPoints(s: ScoreState, pts: number): boolean {
  s.score += pts;
  let granted = false;
  while (s.extrasGiven < EXTRA_LIFE_SCORES.length && s.score >= (EXTRA_LIFE_SCORES[s.extrasGiven] as number)) {
    s.extrasGiven++;
    s.lives = Math.min(MAX_LIVES, s.lives + 1);
    granted = true;
  }
  return granted;
}

/** Points for the nth cat splashed during one drench (0-based); caps at the last step. */
export function chainPoints(n: number): number {
  return CHAIN_POINTS[Math.min(n, CHAIN_POINTS.length - 1)] as number;
}
