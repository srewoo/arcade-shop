import { describe, expect, it } from 'vitest';
import { CONFIG, STEP } from '../src/config';
import { LEVELS } from '../src/levels';
import { Session } from '../src/session';

const L = LEVELS[0]!;
const gas = { throttle: 1, brake: false, steer: 0 };

describe('session fixed timestep', () => {
  it('takes whole steps and keeps the remainder as alpha', () => {
    const s = new Session(L);
    s.advance(STEP * 1000 * 2.5, gas);
    expect(s.curr.time).toBeCloseTo(STEP * 2, 6);
    expect(s.alpha).toBeGreaterThan(0.3);
    expect(s.alpha).toBeLessThan(0.7);
  });
  it('gives the same result regardless of frame slicing', () => {
    const a = new Session(L);
    const b = new Session(L);
    for (let i = 0; i < 60; i++) a.advance(1000 / 60, gas);
    for (let i = 0; i < 30; i++) b.advance(2000 / 60, gas);
    expect(b.curr.car.x).toBeCloseTo(a.curr.car.x, 6);
  });
  it('caps catch-up after a long stall', () => {
    const s = new Session(L);
    s.advance(10_000, gas);
    expect(s.curr.time).toBeLessThanOrEqual(CONFIG.sim.maxStepsPerFrame * STEP + 1e-9);
  });
  it('reset restores the start state', () => {
    const s = new Session(L);
    s.advance(500, gas);
    s.reset();
    expect(s.curr.status).toBe('ready');
    expect(s.curr.car.x).toBe(L.start.x);
  });
});
