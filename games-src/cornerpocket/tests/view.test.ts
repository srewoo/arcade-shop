import { describe, expect, it } from 'vitest';
import { layoutView, toScreen, toTable } from '../src/view';

describe('view transform', () => {
  for (const [w, h, portrait] of [[1000, 600, false], [400, 760, true]] as const) {
    it(`round-trips table <-> screen (${portrait ? 'portrait' : 'landscape'})`, () => {
      const v = layoutView(w, h);
      expect(v.portrait).toBe(portrait);
      for (const [x, y] of [[0, 0], [800, 400], [123, 321]] as const) {
        const s = toScreen(v, x, y);
        const t = toTable(v, s.x, s.y);
        expect(t.x).toBeCloseTo(x, 6);
        expect(t.y).toBeCloseTo(y, 6);
        expect(s.x).toBeGreaterThanOrEqual(0);
        expect(s.x).toBeLessThanOrEqual(w);
        expect(s.y).toBeGreaterThanOrEqual(0);
        expect(s.y).toBeLessThanOrEqual(h);
      }
    });
  }
  it('rotates the long axis vertical in portrait', () => {
    const v = layoutView(400, 760);
    const a = toScreen(v, 0, 200);
    const b = toScreen(v, 800, 200);
    expect(Math.abs(b.y - a.y)).toBeGreaterThan(Math.abs(b.x - a.x));
  });
});
