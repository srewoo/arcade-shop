import { describe, expect, it } from 'vitest';
import { advanceClock } from '../src/clock';
import { CONFIG } from '../src/config';
import type { RoundResult } from '../src/events';
import { advance, buildRound, finishRound, newSession } from '../src/session';
import { WORLD } from './helpers';

const result = (over: Partial<RoundResult> = {}): RoundResult => ({
  outcome: 'complete', hits: 20, total: 25, score: 2000, timeBonus: 100, perfectBonus: 0, finalScore: 2100,
  passed: true, shotsFired: 30, doubles: 2, bestStreak: 8, secondsLeft: 10, ...over,
});

describe('session', () => {
  it('builds reproducible rounds from the seed', () => {
    const s = newSession('campaign', 2, 1234);
    expect(buildRound(s, WORLD).plan).toEqual(buildRound(s, WORLD).plan);
    expect(buildRound(s, WORLD).plan).not.toEqual(buildRound(newSession('campaign', 2, 1235), WORLD).plan);
    expect(buildRound(s, WORLD).params.round).toBe(2);
  });
  it('a passed campaign round carries the score on; a failed one ends the run', () => {
    const s = newSession('campaign', 1, 1);
    const ok = finishRound(s, result());
    expect(ok.verdict).toBe('next');
    expect(ok.session.runScore).toBe(2100);
    expect(advance(ok.session).round).toBe(2);
    const bad = finishRound(ok.session, result({ passed: false, finalScore: 500 }));
    expect(bad.verdict).toBe('over');
    expect(bad.session.runScore).toBe(2600);
  });
  it('practice never changes the session or ends the run', () => {
    const s = newSession('practice', 4, 1);
    const out = finishRound(s, result({ passed: false }));
    expect(out.verdict).toBe('practice');
    expect(out.session).toBe(s);
  });
});

describe('fixed-step clock', () => {
  it('splits frames into whole steps and keeps the remainder', () => {
    const step = CONFIG.sim.step;
    const a = advanceClock(0, step * 2.5);
    expect(a.steps).toBe(2);
    expect(a.alpha).toBeCloseTo(0.5);
    const b = advanceClock(a.acc, step * 0.6);
    expect(b.steps).toBe(1);
  });
  it('same total time gives the same number of steps at 60 and 144 Hz', () => {
    const run = (hz: number): number => {
      let acc = 0;
      let steps = 0;
      for (let i = 0; i < hz * 5; i++) {
        const r = advanceClock(acc, 1 / hz);
        acc = r.acc;
        steps += r.steps;
      }
      return steps;
    };
    expect(Math.abs(run(60) - run(144))).toBeLessThanOrEqual(1);
    expect(Math.abs(run(60) - 300)).toBeLessThanOrEqual(1);
  });
  it('clamps long frames and never runs away', () => {
    const r = advanceClock(0, 10);
    expect(r.steps).toBeLessThanOrEqual(CONFIG.sim.maxCatchUp);
    expect(r.alpha).toBeLessThanOrEqual(1);
    expect(advanceClock(0, -1).steps).toBe(0);
  });
});
