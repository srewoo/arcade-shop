import { describe, it, expect } from 'vitest';
import { SKINS, bestOverall, isUnlocked, unlockedSkins, resolveSkin, newlyUnlocked, nextUnlock, skinById } from '../skins.js';

describe('skin unlocks', () => {
  it('uses the 500 / 1000 / 2000 / 4000 milestones', () => {
    expect(SKINS.map((s) => s.unlock)).toEqual([0, 500, 1000, 2000, 4000]);
  });
  it('unlocks exactly at the threshold', () => {
    expect(isUnlocked('ember', 499)).toBe(false);
    expect(isUnlocked('ember', 500)).toBe(true);
    expect(isUnlocked('royal', 3999)).toBe(false);
    expect(isUnlocked('royal', 4000)).toBe(true);
    expect(unlockedSkins(0).map((s) => s.id)).toEqual(['classic']);
    expect(unlockedSkins(1500).map((s) => s.id)).toEqual(['classic', 'ember', 'frost']);
  });
  it('takes the best across all modes', () => {
    expect(bestOverall({ classic: 120, hardcore: 2100, zen: 0, timeattack: 800 })).toBe(2100);
    expect(bestOverall({})).toBe(0);
    expect(bestOverall({ a: NaN, b: 40 })).toBe(40);
    expect(bestOverall(null)).toBe(0);
  });
  it('falls back to the original skin when the choice is locked or unknown', () => {
    expect(resolveSkin('frost', 100)).toBe('classic');
    expect(resolveSkin('frost', 1000)).toBe('frost');
    expect(resolveSkin('nope', 99999)).toBe('classic');
    expect(resolveSkin(undefined, 99999)).toBe('classic');
  });
  it('reports skins newly crossed by a new best', () => {
    expect(newlyUnlocked(0, 499)).toEqual([]);
    expect(newlyUnlocked(450, 520).map((s) => s.id)).toEqual(['ember']);
    expect(newlyUnlocked(400, 1200).map((s) => s.id)).toEqual(['ember', 'frost']);
    expect(newlyUnlocked(500, 600)).toEqual([]);
  });
  it('finds the next locked skin', () => {
    expect(nextUnlock(0).id).toBe('ember');
    expect(nextUnlock(1999).id).toBe('toxic');
    expect(nextUnlock(4000)).toBeNull();
  });
  it('has colours for every skin except the original', () => {
    expect(skinById('classic').colors).toBeNull();
    for (const s of SKINS.slice(1)) expect(Object.keys(s.colors).sort()).toEqual(['belly', 'body', 'dark']);
    expect(skinById('missing').id).toBe('classic');
  });
});
