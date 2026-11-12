import { describe, expect, it } from 'vitest';
import { fitSize } from '../src/canvasFit';
import { compact, addPop, burst, newEffects, pushTrail, updateEffects } from '../src/effects';
import { pendingHint } from '../src/hints';
import { setCell } from '../src/hex';
import { meterFor } from '../src/hud';
import { resultLines, resultTitle } from '../src/result';
import { shakeOffset } from '../src/render';
import { newGame } from '../src/state';
import { S } from '../src/strings';
import { mulberry32 } from '../src/rules';
import { TUNING } from '../src/config';

describe('first-appearance hints', () => {
  it('announces a bomb in the cannon once, until it is marked seen', () => {
    const g = newGame('arcade', { seed: 1 });
    g.cur = { kind: 'bomb', color: -1 };
    expect(pendingHint(g, [])).toBe('bomb');
    expect(pendingHint(g, ['bomb'])).toBeNull();
  });
  it('sees rainbow in the next slot and stones on the board', () => {
    const g = newGame('arcade', { seed: 1 });
    g.cur = { kind: 'normal', color: 0 };
    g.next = { kind: 'rainbow', color: -1 };
    expect(pendingHint(g, ['bomb'])).toBe('rainbow');
    g.next = { kind: 'normal', color: 0 };
    setCell(g.grid, 1, 1, { kind: 'stone', color: -1 });
    expect(pendingHint(g, ['bomb', 'rainbow'])).toBe('stone');
  });
  it('warns about the ceiling one miss early, never in puzzles, never when not playing', () => {
    const g = newGame('arcade', { seed: 1 });
    g.cur = { kind: 'normal', color: 0 };
    g.next = { kind: 'normal', color: 0 };
    g.sinceDrop = g.diff.dropEvery - 1;
    expect(pendingHint(g, ['bomb', 'rainbow', 'stone'])).toBe('ceiling');
    g.status = 'lost';
    expect(pendingHint(g, [])).toBeNull();
    const p = newGame('puzzle', { puzzleIndex: 0, seed: 1 });
    expect(pendingHint(p, ['stone', 'bomb', 'rainbow'])).toBeNull();
  });
  it('has a one-line text for each hint', () => {
    for (const k of ['bomb', 'rainbow', 'stone', 'ceiling'] as const) expect(S.hints[k].length).toBeGreaterThan(10);
  });
});

describe('result and HUD text', () => {
  it('explains how far from three stars a puzzle clear was', () => {
    const g = newGame('puzzle', { puzzleIndex: 0, seed: 1 });
    g.status = 'won';
    g.stars = 2;
    g.shots = 6;
    g.hits = 3;
    expect(resultTitle(g)).toContain('★★');
    const lines = resultLines(g);
    expect(lines).toContain(`3 stars at ${g.par} shots or fewer`);
    expect(lines.some((l) => l.includes('Accuracy 50%'))).toBe(true);
  });
  it('names why an Arcade run ended and the level reached', () => {
    const g = newGame('arcade', { seed: 1 });
    g.status = 'lost';
    g.loseRow = 13;
    g.level = 4;
    expect(resultTitle(g)).toBe('Game over');
    expect(resultLines(g)).toEqual(expect.arrayContaining([S.result.lostBy, S.result.level(4)]));
  });
  it('out of shots in a puzzle', () => {
    const g = newGame('puzzle', { puzzleIndex: 0, seed: 1 });
    g.status = 'lost';
    g.shots = g.limit;
    expect(resultTitle(g)).toBe('Out of shots');
  });
  it('HUD meter shows par in the label and freezes to a dash when the run ends', () => {
    const g = newGame('puzzle', { puzzleIndex: 0, seed: 1 });
    g.shots = 2;
    expect(meterFor(g)).toEqual({ label: `Shots · par ${g.par}`, value: `2/${g.limit}` });
    g.status = 'lost';
    expect(meterFor(g).value).toBe('-');
    const r = newGame('rush', { seed: 1 });
    expect(meterFor(r).value).toBe('90 s');
  });
});

describe('effects', () => {
  it('compact filters in place and keeps order', () => {
    const a = [1, 2, 3, 4, 5, 6];
    const ref = a;
    compact(a, (v) => v % 2 === 0);
    expect(a).toBe(ref);
    expect(a).toEqual([2, 4, 6]);
  });
  it('burst makes a two-size ring', () => {
    const fx = newEffects();
    burst(fx, 10, 10, '#fff', 10, mulberry32(1));
    expect(fx.particles).toHaveLength(10);
    expect(new Set(fx.particles.map((p) => p.size)).size).toBe(2);
  });
  it('pops live for the pop time then vanish; particles remember their previous position', () => {
    const fx = newEffects();
    addPop(fx, { kind: 'normal', color: 0 }, 5, 5);
    burst(fx, 0, 0, '#fff', 4, mulberry32(2));
    updateEffects(fx, 0.05);
    expect(fx.pops).toHaveLength(1);
    expect(fx.particles[0]?.px).toBe(0);
    expect(fx.particles[0]?.x).not.toBe(0);
    updateEffects(fx, TUNING.fx.popSeconds);
    expect(fx.pops).toHaveLength(0);
  });
  it('the ball trail keeps the newest points only', () => {
    const fx = newEffects();
    for (let i = 0; i < 20; i++) pushTrail(fx, i, i);
    expect(fx.trail).toHaveLength(TUNING.fx.trailLen);
    expect(fx.trail[fx.trail.length - 1]?.x).toBe(19);
  });
  it('shake is a damped sine, not noise', () => {
    expect(shakeOffset(4, 0.123)).toEqual(shakeOffset(4, 0.123));
    expect(Math.abs(shakeOffset(2, 0.01).x)).toBeLessThan(Math.abs(shakeOffset(8, 0.01).x) + 1e-9);
    expect(Math.abs(shakeOffset(0, 1).x) + Math.abs(shakeOffset(0, 1).y)).toBe(0);
  });
  it('recoil and flash decay and reduced motion skips pops', () => {
    const g = newGame('arcade', { seed: 1, reduced: true });
    g.cur = { kind: 'normal', color: 0 };
    g.recoil = 1;
    g.flash = 1;
    updateEffects(g.fx, 0.1);
    expect(g.fx.pops).toHaveLength(0);
  });
});

describe('canvas fit', () => {
  it('fills the stage height on a wide desktop stage', () => {
    const f = fitSize(860, 770);
    expect(f.h).toBe(770);
    expect(f.w).toBeCloseTo(770 * (352 / 520), -1);
  });
  it('is width-limited on a narrow phone stage and keeps the aspect ratio', () => {
    const f = fitSize(376, 700);
    expect(f.w).toBe(376);
    expect(f.h).toBeLessThanOrEqual(556);
  });
  it('never collapses below a usable size', () => {
    expect(fitSize(10, 10)).toEqual({ w: 120, h: 180 });
  });
});
