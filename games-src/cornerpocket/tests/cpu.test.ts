import { describe, expect, it } from 'vitest';
import { chooseCuePlacement, chooseShot } from '../src/cpu';
import { eightBallRack, validSpot } from '../src/layouts';
import { makeRng } from '../src/rng';
import { simulateShot } from '../src/sim';

describe('CPU shot search', () => {
  const balls = eightBallRack();
  const solids = [1, 2, 3, 4, 5, 6, 7];

  for (const level of ['easy', 'pro'] as const) {
    it(`returns a well-formed shot (${level})`, () => {
      const shot = chooseShot(balls, solids, { level, rng: makeRng(7) });
      expect(Number.isFinite(shot.angle)).toBe(true);
      expect(shot.power).toBeGreaterThan(0);
      expect(shot.power).toBeLessThanOrEqual(1);
      expect(Math.abs(shot.spin)).toBeLessThanOrEqual(1);
    });
  }

  it('pro finds a legal shot (first contact is a target, no scratch)', () => {
    const shot = chooseShot(balls, solids, { level: 'pro', rng: makeRng(3) });
    const { report } = simulateShot(balls, shot);
    expect(solids).toContain(report.firstHit);
    expect(report.cuePotted).toBe(false);
  });

  it('pro pots an open shot', () => {
    const open = [
      { ...balls[0]!, x: 200, y: 200 },
      { ...balls[1]!, id: 3, x: 600, y: 120 },
    ];
    const shot = chooseShot(open, [3], { level: 'pro', rng: makeRng(1) });
    expect(simulateShot(open, shot).report.potted).toContain(3);
  });

  it('is reproducible for the same seed', () => {
    const a = chooseShot(balls, solids, { level: 'easy', rng: makeRng(11) });
    const b = chooseShot(balls, solids, { level: 'easy', rng: makeRng(11) });
    expect(a).toEqual(b);
  });

  it('places the cue ball on a valid spot', () => {
    const p = chooseCuePlacement(balls, solids);
    expect(validSpot(balls, p.x, p.y)).toBe(true);
  });
});
