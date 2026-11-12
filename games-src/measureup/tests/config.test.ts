import { describe, expect, it } from 'vitest';
import { CONFIG } from '../src/config';

describe('config', () => {
  it('is frozen and has sane tiers', () => {
    expect(Object.isFrozen(CONFIG)).toBe(true);
    for (const t of CONFIG.quick.tiers) {
      expect(t.parMin).toBeLessThanOrEqual(t.parMax);
      expect(t.capMax).toBeLessThanOrEqual(20);
      expect(t.jugs[0]).toBeLessThanOrEqual(t.jugs[1]);
    }
  });
  it('hint cap leaves at least one star', () => {
    expect(CONFIG.scoring.hintStarCap).toBeGreaterThanOrEqual(1);
    expect(CONFIG.progress.unlockAhead).toBeGreaterThanOrEqual(1);
  });
});
