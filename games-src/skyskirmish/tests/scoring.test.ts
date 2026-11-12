import { describe, expect, it } from 'vitest';
import { CONFIG } from '../src/config';
import { addBonus, registerKill, resetMultiplier, tickChain } from '../src/scoring';
import { createGame } from '../src/state';

describe('scoring', () => {
  it('multiplies by the current multiplier and difficulty factor', () => {
    const s = createGame(1, 'campaign', 'easy');
    expect(registerKill(s, 100)).toBe(100);
    s.mult = 3;
    expect(registerKill(s, 100)).toBe(300);
    const n = createGame(1, 'campaign', 'normal');
    expect(registerKill(n, 100)).toBe(125);
  });
  it('raises the multiplier every few kills, capped', () => {
    const s = createGame(1, 'campaign', 'easy');
    for (let i = 0; i < CONFIG.score.killsPerStep; i++) registerKill(s, 10);
    expect(s.mult).toBe(2);
    expect(s.events.some((e) => e.type === 'multUp')).toBe(true);
    for (let i = 0; i < 200; i++) registerKill(s, 10);
    expect(s.mult).toBe(CONFIG.score.multMax);
  });
  it('drains the multiplier when kills stop, and resets on a hit', () => {
    const s = createGame(1, 'campaign', 'easy');
    s.mult = 4;
    s.chainTimer = 1;
    tickChain(s, 1.1);
    expect(s.mult).toBe(3);
    resetMultiplier(s);
    expect(s.mult).toBe(1);
    tickChain(s, 10);
    expect(s.mult).toBe(1);
  });
  it('bonus scales with difficulty', () => {
    const s = createGame(1, 'campaign', 'hard');
    expect(addBonus(s, 100)).toBe(175);
    expect(s.score).toBe(175);
  });
});
