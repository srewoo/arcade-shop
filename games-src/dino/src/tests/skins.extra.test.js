import { describe, it, expect } from 'vitest';
import { bestOverall, legacyUnlockedIds, isNewBest, isSkinOpen, resolveSkin, SKIN_EXCLUDED_MODES } from '../skins.js';

describe('skin unlocks no longer count Zen', () => {
  it('ignores the Zen best', () => {
    expect(SKIN_EXCLUDED_MODES).toContain('zen');
    expect(bestOverall({ classic: 100, hardcore: 200, zen: 5000, timeattack: 300 })).toBe(300);
    expect(bestOverall({ zen: 9999 })).toBe(0);
  });
  it('grandfathers skins earned under the old every-mode rule', () => {
    expect(legacyUnlockedIds({ classic: 10, zen: 4100 })).toEqual(['classic', 'ember', 'frost', 'toxic', 'royal']);
    expect(legacyUnlockedIds({ classic: 600, zen: 0 })).toEqual(['classic', 'ember']);
    expect(legacyUnlockedIds(null)).toEqual(['classic']);
  });
  it('lets an owned skin stay usable even when the score rule would lock it', () => {
    expect(isSkinOpen('royal', 100, [])).toBe(false);
    expect(isSkinOpen('royal', 100, ['royal'])).toBe(true);
    expect(resolveSkin('royal', 100, ['royal'])).toBe('royal');
    expect(resolveSkin('royal', 100, [])).toBe('classic');
    expect(resolveSkin('nope', 5000, [])).toBe('classic');
  });
});

describe('NEW BEST rule', () => {
  it('needs a previous best above 0 and a real score', () => {
    expect(isNewBest(0, 400)).toBe(false); // first ever run
    expect(isNewBest(10, 20)).toBe(false); // trivial score
    expect(isNewBest(100, 100)).toBe(false);
    expect(isNewBest(100, 101)).toBe(true);
    expect(isNewBest(40, 49)).toBe(false);
    expect(isNewBest(40, 50)).toBe(true);
  });
});
