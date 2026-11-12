import { describe, expect, it } from 'vitest';
import { clearBonus, groupPoints } from '../src/scoring';

describe('scoring', () => {
  it('scores (n-2)^2 per group', () => {
    expect([1, 2, 3, 4, 5, 8].map(groupPoints)).toEqual([0, 0, 1, 4, 9, 36]);
  });
  it('has a positive clear-board bonus', () => {
    expect(clearBonus()).toBeGreaterThan(0);
  });
});

describe('preview text length', () => {
  it('stays short enough for one line in the side panel', async () => {
    const { preview } = await import('../src/strings');
    for (const [n, p] of [[2, 0], [9, 63], [64, 3969]] as const) expect(preview(n, p).length).toBeLessThanOrEqual(24);
    expect(preview(5, 15)).toBe('5 discs, +15 points');
  });
});
