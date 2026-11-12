import { describe, expect, it } from 'vitest';
import { MAX_AIM, START_X_LIMIT } from '../src/constants';
import { chooseShot, type CpuLevel } from '../src/cpu';
import { knockedCount, simulate, standingMask } from '../src/physics';
import { fullRack, maskFromNumbers, SPARE_LEAVES } from '../src/pins';
import { createRng } from '../src/rng';
import { Game } from '../src/game';
import { matchScore } from '../src/match';
import { PROFILES } from '../src/cpu';
import type { AudioEngine } from '../src/audio';
import type { Shot } from '../src/worldTypes';

function valid(s: Shot): void {
  expect(Number.isFinite(s.x + s.aim + s.power + s.spin)).toBe(true);
  expect(Math.abs(s.x)).toBeLessThanOrEqual(START_X_LIMIT);
  expect(Math.abs(s.aim)).toBeLessThanOrEqual(MAX_AIM);
  expect(s.power).toBeGreaterThanOrEqual(0.3);
  expect(s.power).toBeLessThanOrEqual(1);
  expect(Math.abs(s.spin)).toBeLessThanOrEqual(1);
}

describe('chooseShot', () => {
  it.each<CpuLevel>(['casual', 'easy', 'pro'])('returns in-range shots for %s on a full rack', (level) => {
    const rng = createRng(1);
    for (let i = 0; i < 4; i++) valid(chooseShot(fullRack(), level, rng));
  });
  it.each<CpuLevel>(['casual', 'easy', 'pro'])('returns in-range shots for %s on spare leaves', (level) => {
    const rng = createRng(2);
    for (const leave of SPARE_LEAVES.filter((_, i) => i % 5 === 0)) valid(chooseShot(maskFromNumbers(leave), level, rng));
  });
  it('is reproducible for a given seed', () => {
    expect(chooseShot(fullRack(), 'easy', createRng(9))).toEqual(chooseShot(fullRack(), 'easy', createRng(9)));
  });
  it('pro knocks more pins than easy on average', () => {
    const avg = (level: CpuLevel): number => {
      const rng = createRng(77);
      let total = 0;
      const n = 14;
      for (let i = 0; i < n; i++) total += knockedCount(simulate(fullRack(), chooseShot(fullRack(), level, rng)));
      return total / n;
    };
    const pro = avg('pro');
    const easy = avg('easy');
    expect(pro).toBeGreaterThan(easy);
    expect(pro).toBeGreaterThan(8);
  });
  it('pro converts a simple single-pin spare most of the time', () => {
    const mask = maskFromNumbers([10]);
    const rng = createRng(5);
    let made = 0;
    for (let i = 0; i < 8; i++) {
      const w = simulate(mask, chooseShot(mask, 'pro', rng));
      if (standingMask(w).every((s) => !s)) made++;
    }
    expect(made).toBeGreaterThanOrEqual(5);
  });
});

describe('casual CPU level', () => {
  it('is the weakest profile and lives in the tuning table', () => {
    expect(PROFILES.casual.candidates).toBe(1);
    expect(PROFILES.casual.aimNoise).toBeGreaterThan(PROFILES.easy.aimNoise);
    expect(PROFILES.casual.powerNoise).toBeGreaterThan(PROFILES.easy.powerNoise);
    expect(PROFILES.easy.candidates).toBeLessThan(PROFILES.pro.candidates);
  });
  it('averages 60-90 points over simulated games (easy was 104-143)', () => {
    const silent = new Proxy({}, { get: () => () => undefined }) as unknown as AudioEngine;
    const scores: number[] = [];
    for (let seed = 1; seed <= 10; seed++) {
      const g = new Game(silent, { onChange: () => undefined, onBanner: () => undefined, onOver: () => undefined }, seed);
      g.start({ mode: 'cpu', players: 2, cpuLevel: 'casual' });
      for (let t = 0; t < 4000 && !g.match.over; t += 1 / 60) {
        if (g.humanTurn) g.throwShot({ x: 0, aim: 0, power: 0.5, spin: 0 });
        g.update(1 / 60);
      }
      scores.push(matchScore(g.match, 1));
    }
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    expect(avg).toBeGreaterThanOrEqual(60);
    expect(avg).toBeLessThanOrEqual(90);
  });
});
