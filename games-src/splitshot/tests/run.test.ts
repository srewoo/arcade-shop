import { describe, expect, it } from 'vitest';
import { CONFIG } from '../src/config';
import { bankClear, bankLoss, newRun } from '../src/sim/run';
import { createSim } from '../src/sim/sim';

describe('run flow', () => {
  it('starts with 3 lives on stage 0', () => {
    const r = newRun();
    expect(r.lives).toBe(CONFIG.run.lives);
    expect(r.stage).toBe(0);
  });
  it('losing costs a life and ends the run at zero', () => {
    let r = newRun();
    for (let i = 0; i < CONFIG.run.lives - 1; i++) {
      const o = bankLoss(r);
      expect(o.over).toBe(false);
      r = o.run;
    }
    expect(bankLoss(r).over).toBe(true);
  });
  it('a loss keeps the banked score and stage', () => {
    const r = { ...newRun(), score: 900, stage: 2 };
    const o = bankLoss(r);
    expect(o.run.score).toBe(900);
    expect(o.run.stage).toBe(2);
  });
  it('clearing carries the score, advances the stage and awards extra lives (capped)', () => {
    const sim = createSim(0, 0);
    sim.score = CONFIG.score.extraLifeEvery * 2 + 5;
    const r = bankClear(newRun(), sim);
    expect(r.stage).toBe(1);
    expect(r.score).toBe(sim.score);
    expect(r.lives).toBe(CONFIG.run.lives + 2);
    const capped = bankClear({ ...newRun(), lives: CONFIG.run.maxLives }, sim);
    expect(capped.lives).toBe(CONFIG.run.maxLives);
  });
});
