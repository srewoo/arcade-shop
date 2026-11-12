// Run-level state across stages: lives, stage index, score rollback on loss, extra lives.
import { CONFIG } from '../config';
import type { Sim } from './state';

export interface Run { stage: number; lives: number; score: number; nextLifeAt: number; extraLives: number }

export const newRun = (): Run => ({ stage: 0, lives: CONFIG.run.lives, score: 0, nextLifeAt: CONFIG.score.extraLifeEvery, extraLives: 0 });

/** Bank a cleared stage: carry the score, award extra lives, move to the next stage. */
export function bankClear(run: Run, sim: Sim): Run {
  let { lives, nextLifeAt, extraLives } = run;
  while (sim.score >= nextLifeAt) {
    nextLifeAt += CONFIG.score.extraLifeEvery;
    if (lives < CONFIG.run.maxLives) { lives++; extraLives++; }
  }
  return { stage: run.stage + 1, lives, score: sim.score, nextLifeAt, extraLives };
}

/** A lost stage costs a life; the score rolls back to the start of the stage. */
export function bankLoss(run: Run): { run: Run; over: boolean } {
  const next: Run = { ...run, lives: run.lives - 1 };
  return { run: next, over: next.lives <= 0 };
}
