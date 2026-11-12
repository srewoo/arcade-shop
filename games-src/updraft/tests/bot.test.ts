import { describe, expect, it } from 'vitest';
import { botHold } from '../src/bot';
import { newSim, stepSim } from '../src/sim';
import { hashSeed } from '../src/rng';
import { World } from '../src/world';

function fly(seed: number, maxTicks: number): { dist: number; alive: boolean; coins: number } {
  const world = new World(seed);
  const s = newSim();
  for (let i = 0; i < maxTicks && s.alive; i++) stepSim(world, s, botHold(world, s));
  return { dist: s.dist, alive: s.alive, coins: s.coinCount };
}

describe('level validation by autopilot', () => {
  it('a simple bot clears 12000 units (past full narrowing) on many seeds', () => {
    for (let n = 1; n <= 200; n++) {
      const r = fly(hashSeed(`seed-${n}`), 3200);
      expect(r.alive, `seed-${n} died at ${Math.round(r.dist)}`).toBe(true);
      expect(r.dist).toBeGreaterThan(12000);
    }
  });

  it('collects coins when flying the centre line', () => {
    expect(fly(hashSeed('coins'), 1500).coins).toBeGreaterThan(5);
  });

  it('crashes when never pressing anything', () => {
    const world = new World(1);
    const s = newSim();
    for (let i = 0; i < 600 && s.alive; i++) stepSim(world, s, false);
    expect(s.alive).toBe(false);
  });
});
