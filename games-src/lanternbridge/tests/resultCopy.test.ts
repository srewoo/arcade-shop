import { describe, expect, it } from 'vitest';
import { BRIDGE_LEVELS } from '../src/levels/bridge';
import { RAFT_LEVELS } from '../src/levels/raft';
import { starStates, winCopy } from '../src/puzzle/resultCopy';
import { gearPath } from '../src/art/icons';
import { S } from '../src/strings';

const lvl = BRIDGE_LEVELS[0]!;

describe('win copy never contradicts the award', () => {
  it('par without hints: 3 earned stars and "Perfect"', () => {
    const c = winCopy(lvl, lvl.par, 3, false);
    expect(c.stars).toEqual(['earned', 'earned', 'earned']);
    expect(c.lines.map((l) => l.text)).toContain(S.result.perfect);
  });
  it('par with a hint: 2 earned + a capped third, no "Perfect"', () => {
    const c = winCopy(lvl, lvl.par, 3, true);
    expect(c.stars).toEqual(['earned', 'earned', 'capped']);
    const text = c.lines.map((l) => l.text).join(' ');
    expect(text).toContain(S.result.bestWithHint);
    expect(text).not.toContain('Perfect');
  });
  it('slower than par with a hint: no cap note when nothing was withheld', () => {
    const c = winCopy(lvl, lvl.limit ?? lvl.par + 99, 5, true);
    expect(c.stars.includes('capped')).toBe(false);
    expect(c.lines.some((l) => l.text === S.result.hintNote)).toBe(false);
  });
  it('2-star run with a hint keeps 2 stars, no capped star', () => {
    expect(starStates(2, 2)).toEqual(['earned', 'earned', 'empty']);
  });
  it('raft levels use crossings wording', () => {
    const r = RAFT_LEVELS[0]!;
    expect(winCopy(r, r.par, r.par, false).lines[0]?.text).toContain('crossings');
  });
  it('states the star rule up front', () => {
    expect(S.rules.stars).toMatch(/no hints/);
    expect(S.onboard.bridge).toMatch(/Hints cap stars at 2/);
  });
});

describe('gearPath', () => {
  it('is a closed path with 4 points per tooth', () => {
    const d = gearPath(8);
    expect(d.startsWith('M')).toBe(true);
    expect(d.endsWith('Z')).toBe(true);
    expect(d.split('L').length).toBe(32);
  });
});
