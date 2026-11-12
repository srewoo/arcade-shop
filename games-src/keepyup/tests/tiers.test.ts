import { describe, expect, it } from 'vitest';
import { nextTier, tierCrossed, tierFor } from '../src/tiers';

describe('score tiers', () => {
  it('has no tier below the first milestone', () => {
    expect(tierFor(0)).toBeNull();
    expect(tierFor(9)).toBeNull();
  });
  it('maps milestones to the brief wording', () => {
    expect(tierFor(10)?.label).toBe('Warm-up');
    expect(tierFor(20)?.label).toBe('Nice!');
    expect(tierFor(39)?.label).toBe('Smooth');
    expect(tierFor(50)?.label).toBe('Pro');
    expect(tierFor(60)?.label).toBe('Champion');
    expect(tierFor(500)?.label).toBe('Untouchable');
  });
  it('ranks increase with score', () => {
    let prev = 0;
    for (let s = 0; s <= 120; s++) { const r = tierFor(s)?.rank ?? 0; expect(r).toBeGreaterThanOrEqual(prev); prev = r; }
  });
  it('fires a callout exactly once, on the crossing hit', () => {
    expect(tierCrossed(19, 20)?.label).toBe('Nice!');
    expect(tierCrossed(20, 21)).toBeNull();
    expect(tierCrossed(0, 5)).toBeNull();
    expect(tierCrossed(49, 50)?.label).toBe('Pro');
  });
  it('reports the next milestone', () => {
    expect(nextTier(0)?.min).toBe(10);
    expect(nextTier(25)?.min).toBe(30);
    expect(nextTier(1000)).toBeNull();
  });
});
