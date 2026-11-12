import { describe, expect, it } from 'vitest';
import { createWorld } from '../src/world';
import { stepWorld } from '../src/step';
import { FIXED_DT } from '../src/types';

/** Seconds until Pip is first caught (or `cap`), for a world driven by `want` each tick. */
function timeToFirstDeath(seed: number, level: number, cap: number, ai: boolean, reactionSec = 0): number {
  const w = createWorld(level, { ai: false, seed });
  for (let i = 0; i < cap * 60; i++) {
    w.ai = ai && w.time >= reactionSec;
    stepWorld(w, FIXED_DT);
    if (!w.pip.alive) return w.time;
    w.events.length = 0;
  }
  return cap;
}

const median = (xs: number[]): number => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)] as number;

describe('opening balance (level 1)', () => {
  it('an idle player survives well past the old 3 s', () => {
    const t = median(Array.from({ length: 20 }, (_, i) => timeToFirstDeath(100 + i, 1, 60, false)));
    expect(t).toBeGreaterThanOrEqual(7);
  });

  it('the demo bot (0-4.5 s reaction delay) survives a median of at least 25 s over 20 seeded runs', () => {
    const times = Array.from({ length: 20 }, (_, i) => timeToFirstDeath(200 + i, 1, 120, true, (i % 10) * 0.5));
    expect(median(times)).toBeGreaterThanOrEqual(25);
  });
});
