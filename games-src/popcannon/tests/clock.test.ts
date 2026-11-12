import { describe, expect, it } from 'vitest';
import { SHOOTER } from '../src/hex';
import { advanceClock, lerp, shouldSimulate } from '../src/clock';
import { aim, fire } from '../src/shoot';
import { newGame } from '../src/state';
import { STEP, update } from '../src/update';

describe('fixed-step clock', () => {
  it('runs 60 steps per second at any refresh rate', () => {
    for (const hz of [30, 60, 75, 120, 144, 240]) {
      let acc = 0;
      let steps = 0;
      for (let i = 0; i < hz * 10; i++) {
        const r = advanceClock(acc, 1 / hz);
        acc = r.acc;
        steps += r.steps;
        expect(r.alpha).toBeGreaterThanOrEqual(0);
        expect(r.alpha).toBeLessThan(1);
      }
      expect(Math.abs(steps - 600)).toBeLessThanOrEqual(1);
    }
  });
  it('clamps a long stall to 0.1 s', () => {
    expect(advanceClock(0, 5).steps).toBe(6);
  });
  it('only simulates in play, menu and result phases', () => {
    expect(shouldSimulate('play')).toBe(true);
    expect(shouldSimulate('pause')).toBe(false);
    expect(shouldSimulate('coach')).toBe(false);
  });
  it('lerp blends', () => {
    expect(lerp(0, 10, 0.25)).toBe(2.5);
  });
});

/** Interpolated ball y per frame for a straight shot. */
function frameYs(hz: number, interpolate: boolean): number[] {
  const g = newGame('arcade', { seed: 2 });
  g.grid.rows = [];
  g.cur = { kind: 'normal', color: 0 };
  aim(g, 0);
  fire(g);
  const ys: number[] = [];
  let acc = 0;
  for (let f = 0; f < hz * 0.5; f++) {
    const c = advanceClock(acc, 1 / hz);
    acc = c.acc;
    for (let i = 0; i < c.steps; i++) update(g, STEP, { left: false, right: false });
    if (!g.ball) break;
    ys.push(interpolate ? lerp(g.ball.py, g.ball.ry, c.alpha) : g.ball.ry);
  }
  return ys;
}

describe('render interpolation', () => {
  it('moves the ball uniformly per frame at 144 Hz (within 1 px)', () => {
    const ys = frameYs(144, true);
    const deltas = ys.slice(3).map((y, i) => (ys[i + 2] as number) - y).map(Math.abs);
    const want = 640 / 144;
    expect(deltas.length).toBeGreaterThan(30);
    for (const d of deltas) expect(Math.abs(d - want)).toBeLessThanOrEqual(1);
  });
  it('without interpolation the same shot judders (control)', () => {
    const ys = frameYs(144, false);
    const deltas = ys.slice(1).map((y, i) => Math.abs(y - (ys[i] as number)));
    expect(Math.max(...deltas) - Math.min(...deltas)).toBeGreaterThan(5);
  });
  it('starts the flight at the cannon', () => {
    const g = newGame('arcade', { seed: 2 });
    fire(g);
    expect(g.ball?.px).toBe(SHOOTER.x);
    expect(g.ball?.ry).toBe(SHOOTER.y);
  });
});
