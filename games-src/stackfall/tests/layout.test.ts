import { describe, expect, it } from 'vitest';
import { computeLayout } from '../src/ui/layout';

describe('well size within the canvas', () => {
  it.each([[1022, 782], [550, 389]])('uses nearly all of the height at %ix%i', (w, h) => {
    const l = computeLayout(w, h);
    expect(l.well.h / h).toBeGreaterThan(0.9);
  });
  it('keeps stash and next panels inside the canvas in landscape', () => {
    for (const [w, h] of [[1022, 782], [550, 389], [480, 300]] as const) {
      const l = computeLayout(w, h);
      expect(l.stash.x).toBeGreaterThanOrEqual(0);
      expect(l.next.x + l.next.w).toBeLessThanOrEqual(w);
    }
  });
});
