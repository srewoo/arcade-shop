import { describe, expect, it } from 'vitest';
import { attractDist, attractY, ATTRACT_SEED } from '../src/render/attract';
import { Popups } from '../src/render/popups';
import { hash2 } from '../src/render/terrain';
import { countUpValue } from '../src/ui/countUp';
import { hashSeed } from '../src/rng';
import { pick } from '../src/strings';
import { World } from '../src/world';

describe('attract mode', () => {
  const w = new World(hashSeed(ATTRACT_SEED));
  it('keeps the demo craft inside the free span for a long flight', () => {
    for (let t = 0; t < 120; t += 0.25) {
      const x = attractDist(t, false);
      const y = attractY(w, x, t, false);
      const [lo, hi] = w.freeSpan(x);
      expect(y).toBeGreaterThan(lo);
      expect(y).toBeLessThan(hi);
    }
  });
  it('does not scroll or sway under reduced motion', () => {
    expect(attractDist(0, true)).toBe(attractDist(50, true));
    const x = attractDist(0, true);
    expect(attractY(w, x, 0, true)).toBe(attractY(w, x, 9, true));
  });
});

describe('count-up', () => {
  it('starts at 0, is monotonic and lands exactly on the target', () => {
    let prev = -1;
    for (let ms = 0; ms <= 700; ms += 50) {
      const v = countUpValue(1234, ms, 700);
      expect(v).toBeGreaterThanOrEqual(prev);
      prev = v;
    }
    expect(countUpValue(1234, 0, 700)).toBe(0);
    expect(countUpValue(1234, 700, 700)).toBe(1234);
    expect(countUpValue(1234, 5000, 700)).toBe(1234);
    expect(countUpValue(0, 100, 700)).toBe(0);
  });
});

describe('popups', () => {
  it('expire and are capped', () => {
    const p = new Popups();
    for (let i = 0; i < 20; i++) p.add(0, 0, '+25');
    expect(p.count).toBe(8);
    p.update(1);
    expect(p.count).toBe(0);
  });
});

describe('helpers', () => {
  it('hash2 is deterministic and in [0,1)', () => {
    expect(hash2(3, 4)).toBe(hash2(3, 4));
    for (let i = 0; i < 100; i++) { const h = hash2(i, i * 7); expect(h).toBeGreaterThanOrEqual(0); expect(h).toBeLessThan(1); }
  });
  it('pick chooses touch wording on coarse pointers', () => {
    expect(pick(true, 'keys', 'touch')).toBe('touch');
    expect(pick(false, 'keys', 'touch')).toBe('keys');
  });
});
