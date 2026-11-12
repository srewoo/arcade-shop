// Balance maths: a casual meter player should strike far more often than with the old linear
// meters, and a random-meter player should knock a respectable average. Deterministic (seeded).
import { describe, expect, it } from 'vitest';
import { MAX_AIM } from '../src/constants';
import { aimFromBar, spinFromBar } from '../src/meterMap';
import { knockedCount, simulate } from '../src/physics';
import { fullRack } from '../src/pins';
import { clamp, createRng, gauss } from '../src/rng';

interface Result { readonly strikePct: number; readonly mean: number }

/** A casual player: lines up on a pocket tick (+/-3 cm) and times each meter with some error. */
function casual(aim: (u: number) => number, spin: (u: number) => number, n = 500): Result {
  const r = createRng(11);
  let strikes = 0;
  let sum = 0;
  for (let i = 0; i < n; i++) {
    const x = clamp((r() < 0.5 ? -9 : 9) + gauss(r) * 3, -42, 42);
    const shot = { x, aim: aim(clamp(gauss(r) * 0.2, -1, 1)), power: 0.7 + r() * 0.3, spin: spin(clamp(gauss(r) * 0.3, -1, 1)) };
    const k = knockedCount(simulate(fullRack(), shot));
    sum += k;
    if (k === 10) strikes++;
  }
  return { strikePct: (100 * strikes) / n, mean: sum / n };
}

/** The review's blind player: every meter at a uniformly random time. */
function blind(aim: (u: number) => number, spin: (u: number) => number, n = 400): Result {
  const r = createRng(7);
  let sum = 0;
  let strikes = 0;
  for (let i = 0; i < n; i++) {
    const x = clamp((r() < 0.5 ? -9 : 9) + gauss(r) * 4, -42, 42);
    const k = knockedCount(simulate(fullRack(), { x, aim: aim(r() * 2 - 1), power: 0.5 + r() * 0.5, spin: spin(r() * 2 - 1) }));
    sum += k;
    if (k === 10) strikes++;
  }
  return { strikePct: (100 * strikes) / n, mean: sum / n };
}

const linearAim = (u: number): number => u * MAX_AIM;
const linearSpin = (u: number): number => u;

describe('meter balance', () => {
  const old = casual(linearAim, linearSpin);
  const now = casual((u) => aimFromBar(u), (u) => spinFromBar(u));
  const wide = casual((u) => aimFromBar(u, true), (u) => spinFromBar(u, true));

  it('lifts the casual strike rate from about 5% into the 10-15% target band', () => {
    expect(old.strikePct).toBeLessThan(7);
    expect(now.strikePct).toBeGreaterThanOrEqual(9);
    expect(now.strikePct).toBeLessThanOrEqual(16);
    expect(now.strikePct).toBeGreaterThan(old.strikePct * 1.8);
  });
  it('raises the casual average pins per ball', () => {
    expect(now.mean).toBeGreaterThan(old.mean + 1);
  });
  it('the wide-pocket assist is no worse than the default', () => {
    expect(wide.strikePct).toBeGreaterThanOrEqual(now.strikePct - 1.5);
    expect(wide.mean).toBeGreaterThan(now.mean - 0.2);
  });
  it('a random-meter player averages at least 3 pins (was about 2)', () => {
    const before = blind(linearAim, linearSpin);
    const after = blind((u) => aimFromBar(u), (u) => spinFromBar(u));
    expect(before.mean).toBeLessThan(2.6);
    expect(after.mean).toBeGreaterThanOrEqual(3);
  });
});
