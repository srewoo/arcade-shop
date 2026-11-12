import { describe, expect, it } from 'vitest';
import { LEVELS } from '../src/levels';
import { planLevels } from '../src/levelList';
import { starsFor, twoStarLimit } from '../src/scoring';
import { DEFAULT_SETTINGS, parseField } from '../src/settings';
import { S } from '../src/strings';
import { starsMarkup, winCopy } from '../src/winCopy';

describe('star copy never contradicts the award', () => {
  it('three stars: perfect, no advice', () => {
    expect(winCopy(3, 3, 3, false)).toEqual({ tier: S.winTierThree, note: S.winPerfect });
  });
  it('two stars after a hint at par explains the hint cap', () => {
    const stars = starsFor(4, 4, 1);
    expect(stars).toBe(2);
    expect(winCopy(stars, 4, 4, true).note).toBe(S.noteHintCap);
  });
  it('two stars over par asks for par, mentioning hints only when used', () => {
    expect(winCopy(2, 6, 4, false).note).toBe(S.noteNeedPar(4, false));
    expect(winCopy(2, 6, 4, true).note).toContain('no hints');
    expect(winCopy(2, 6, 4, false).note).not.toContain('hint');
  });
  it('one star points at the exact two-star limit', () => {
    const par = 4;
    const moves = twoStarLimit(par) + 1;
    expect(starsFor(moves, par, 0)).toBe(1);
    expect(winCopy(1, moves, par, false).note).toBe(S.noteNeedTwo(twoStarLimit(par)));
    expect(starsFor(twoStarLimit(par), par, 0)).toBe(2);
  });
  it('earned stars render gold, the rest as outlines', () => {
    const html = starsMarkup(2);
    expect(html.match(/star on/g)?.length).toBe(2);
    expect(html.match(/star off/g)?.length).toBe(1);
  });
});

describe('level list plan', () => {
  it('groups by jug count and lists only a few locked levels', () => {
    const plan = planLevels(LEVELS, 4, 4);
    expect(plan.groups.flatMap((g) => g.items).length).toBe(8);
    expect(plan.hidden).toBe(LEVELS.length - 8);
    for (const g of plan.groups) for (const l of g.items) expect(l.jugs.length).toBe(g.jugs);
  });
  it('shows everything once far enough along', () => {
    const plan = planLevels(LEVELS, LEVELS.length, 4);
    expect(plan.hidden).toBe(0);
    expect(plan.groups.flatMap((g) => g.items).length).toBe(LEVELS.length);
  });
  it('splits a group when jug counts change', () => {
    const plan = planLevels([{ id: 1, jugs: [1, 2] }, { id: 2, jugs: [1, 2, 3] }, { id: 3, jugs: [1, 2, 3] }], 3, 0);
    expect(plan.groups.map((g) => [g.jugs, g.items.length])).toEqual([[2, 1], [3, 2]]);
  });
});

describe('timer setting', () => {
  it('is hidden by default and validated', () => {
    expect(DEFAULT_SETTINGS.showTimer).toBe(false);
    expect(parseField('showTimer', true)).toBe(true);
    expect(parseField('showTimer', 'yes')).toBeUndefined();
  });
});
