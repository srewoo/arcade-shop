import { describe, expect, it } from 'vitest';
import { createFx, fxHandle, fxUpdate } from '../src/fx';
import { createGame } from '../src/state';
import { stepGame } from '../src/step';
import { NO_INPUT } from '../src/types';
import { accuracy, countValue, tierFor } from '../src/summary';

describe('accuracy', () => {
  it('is 0 with no shots and rounds otherwise', () => {
    expect(accuracy({ fired: 0, hit: 0 })).toBe(0);
    expect(accuracy({ fired: 3, hit: 1 })).toBe(33);
    expect(accuracy({ fired: 10, hit: 99 })).toBe(100);
  });
});

describe('tierFor', () => {
  it('winning is always Ace; otherwise by wave reached', () => {
    expect(tierFor(true, 1)).toBe('ace');
    expect(tierFor(false, 1)).toBe('rookie');
    expect(tierFor(false, 5)).toBe('wingman');
    expect(tierFor(false, 9)).toBe('veteran');
  });
});

describe('countValue', () => {
  it('eases from 0 to the target and never overshoots', () => {
    expect(countValue(1000, 0, 1)).toBe(0);
    expect(countValue(1000, 1, 1)).toBe(1000);
    expect(countValue(1000, 5, 1)).toBe(1000);
    const mid = countValue(1000, 0.5, 1);
    expect(mid).toBeGreaterThan(500);
    expect(mid).toBeLessThan(1000);
    expect(countValue(1000, 0.5, 0)).toBe(1000);
  });
});

describe('run stats', () => {
  it('count shots fired and start at a x1 best combo', () => {
    const g = createGame(5, 'endless', 'normal');
    expect(g.stats).toEqual({ fired: 0, hit: 0, bestMult: 1 });
    for (let i = 0; i < 30; i++) stepGame(g, { ...NO_INPUT, fire: true });
    expect(g.stats.fired).toBeGreaterThan(0);
  });
});

describe('fx reduce motion', () => {
  const kill = [{ type: 'kill', x: 10, y: 10, big: true, points: 500 }] as const;
  it('adds rings, shake and a rising popup normally', () => {
    const fx = createFx();
    fxHandle(fx, kill, false);
    expect(fx.rings.length).toBeGreaterThan(0);
    expect(fx.shake).toBeGreaterThan(0);
    const y0 = fx.popups[0]!.y;
    fxUpdate(fx, 0.1);
    expect(fx.popups[0]!.y).toBeLessThan(y0);
  });
  it('with reduce motion: no rings, no shake, no hurt flash, static popup, fewer particles', () => {
    const fx = createFx();
    const full = createFx();
    fxHandle(full, kill, false);
    const killOnly = createFx();
    fxHandle(killOnly, kill, true);
    fxHandle(fx, [...kill, { type: 'hurt', x: 1, y: 1 }], true);
    expect(fx.rings).toHaveLength(0);
    expect(fx.shake).toBe(0);
    expect(fx.hurt).toBe(0);
    expect(killOnly.particles.length).toBeLessThan(full.particles.length);
    const y0 = fx.popups[0]!.y;
    fxUpdate(fx, 0.1);
    expect(fx.popups[0]!.y).toBe(y0);
  });
});
