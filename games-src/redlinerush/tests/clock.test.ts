import { describe, expect, it } from 'vitest';
import { advanceClock, lerp } from '../src/clock';
import { CONFIG } from '../src/config';

describe('fixed-step clock', () => {
  it('splits a frame into whole steps and keeps the remainder', () => {
    const r = advanceClock(0, CONFIG.step * 2.5);
    expect(r.steps).toBe(2);
    expect(r.alpha).toBeCloseTo(0.5, 5);
  });
  it('clamps long frames (tab switch) so the sim cannot spiral', () => {
    expect(advanceClock(0, 5).steps).toBeLessThanOrEqual(Math.ceil(CONFIG.maxFrame / CONFIG.step));
  });
  it('ignores negative time', () => {
    expect(advanceClock(0, -1).steps).toBe(0);
  });
  it('accumulates small frames, as on a 144 Hz display', () => {
    let acc = 0;
    let total = 0;
    for (let i = 0; i < 144; i++) {
      const r = advanceClock(acc, 1 / 144);
      acc = r.acc;
      total += r.steps;
    }
    expect(total).toBeGreaterThanOrEqual(59);
    expect(total).toBeLessThanOrEqual(60);
  });
  it('lerp interpolates', () => {
    expect(lerp(0, 10, 0.25)).toBe(2.5);
  });
});
