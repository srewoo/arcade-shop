import { describe, expect, it } from 'vitest';
import { LAYERS, hash2, hexA, ridgeY } from '../src/render/caveMath';

describe('cave scenery maths', () => {
  it('hash2 is deterministic and within 0..1', () => {
    for (let i = 0; i < 200; i++) {
      const v = hash2(i, i * 7 + 3);
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
      expect(hash2(i, i * 7 + 3)).toBe(v);
    }
  });

  it('ridge height stays inside its layer band', () => {
    LAYERS.forEach((L, i) => {
      for (let u = -500; u < 2000; u += 13) {
        const y = ridgeY(i, u);
        expect(Math.abs(y - L.base)).toBeLessThanOrEqual(L.amp * 1.4 + 0.001);
      }
    });
  });

  it('hexA converts #rrggbb and falls back for other formats', () => {
    expect(hexA('#ff8000', 0.5)).toBe('rgba(255,128,0,0.5)');
    expect(hexA('red', 0.5)).toBe('rgba(120,160,190,0.5)');
  });
});
