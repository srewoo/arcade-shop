import { describe, expect, it } from 'vitest';
import { scoreLock, type ScoreContext } from '../src/core/scoring';

const ctx = (o: Partial<ScoreContext> = {}): ScoreContext => ({ lines: 1, twist: 'none', level: 1, combo: -1, b2b: false, allClear: false, ...o });

describe('scoring', () => {
  it('scores plain clears times level', () => {
    expect([1, 2, 3, 4].map((l) => scoreLock(ctx({ lines: l })).points)).toEqual([100, 300, 500, 800]);
    expect(scoreLock(ctx({ lines: 2, level: 5 })).points).toBe(1500);
  });
  it('combo adds 50 x combo x level and resets on a miss', () => {
    const a = scoreLock(ctx());
    expect(a.combo).toBe(0);
    const b = scoreLock(ctx({ combo: a.combo }));
    expect(b.combo).toBe(1);
    expect(b.points).toBe(100 + 50);
    const c = scoreLock(ctx({ combo: 3, level: 2 }));
    expect(c.points).toBe(200 + 50 * 4 * 2);
    expect(scoreLock(ctx({ lines: 0, combo: 5 })).combo).toBe(-1);
  });
  it('back-to-back: quad after quad earns 1.5x; a single breaks the chain', () => {
    const first = scoreLock(ctx({ lines: 4 }));
    expect(first.b2b).toBe(true);
    expect(first.b2bApplied).toBe(false);
    const second = scoreLock(ctx({ lines: 4, b2b: first.b2b }));
    expect(second.points).toBe(1200);
    expect(second.b2bApplied).toBe(true);
    expect(scoreLock(ctx({ lines: 1, b2b: true })).b2b).toBe(false);
  });
  it('locks without clears keep the back-to-back chain alive', () => {
    expect(scoreLock(ctx({ lines: 0, b2b: true })).b2b).toBe(true);
  });
  it('twist clears are worth more and count as difficult', () => {
    const t = scoreLock(ctx({ lines: 2, twist: 'twist' }));
    expect(t.points).toBe(1200);
    expect(t.difficult).toBe(true);
    expect(t.label).toBe('Twist Double');
    expect(scoreLock(ctx({ lines: 0, twist: 'twist' })).points).toBe(400);
    expect(scoreLock(ctx({ lines: 1, twist: 'mini' })).points).toBe(200);
  });
  it('all-clear bonus', () => {
    expect(scoreLock(ctx({ lines: 4, allClear: true })).points).toBe(800 + 2000);
  });
});
