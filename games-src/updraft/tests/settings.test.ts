import { describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS, parseField, parseSettings } from '../src/settings';
import { coerceValue } from '../src/ui/settingsPanel';
import { EMPTY_BEST, bestFor, ghostFor, parseBest, parseGhosts, withGhost, withScore } from '../src/scores';

describe('settings validation', () => {
  it('falls back per field', () => {
    const p = parseSettings({ volume: 40, reduceMotion: 'on', colorAssist: true, textSize: 150, theme: 'nope', mode: 'daily' });
    expect(p).toMatchObject({ volume: 40, reduceMotion: 'on', colorAssist: true, textSize: 150, theme: 'system', mode: 'daily' });
  });
  it.each([['volume', 101], ['volume', -1], ['volume', 5.5], ['volume', '50'], ['textSize', 110], ['reduceMotion', 'maybe'], ['colorAssist', 'yes'], ['mode', 'hard']] as const)(
    'rejects %s = %s', (k, v) => {
      expect(parseField(k, v)).toBeUndefined();
      expect(parseSettings({ [k]: v })[k]).toBe(DEFAULT_SETTINGS[k]);
    });
  it('handles junk and prototype pollution', () => {
    expect(parseSettings(null)).toEqual(DEFAULT_SETTINGS);
    expect(parseSettings('x')).toEqual(DEFAULT_SETTINGS);
    expect(parseSettings(JSON.parse('{"__proto__":{"sound":false},"x":1}'))).toEqual(DEFAULT_SETTINGS);
  });
  it('coerces DOM strings', () => {
    expect([coerceValue('true'), coerceValue('false'), coerceValue('125'), coerceValue('dark')]).toEqual([true, false, 125, 'dark']);
  });
});

describe('best and ghost persistence', () => {
  it('parses bests per field', () => {
    expect(parseBest({ endless: 50, practice: -3, daily: 'x', dailyDate: '2026-11-11' })).toEqual({ endless: 50, practice: 0, daily: 0, dailyDate: '2026-11-11' });
    expect(parseBest(undefined)).toEqual(EMPTY_BEST);
    expect(parseBest({ dailyDate: '11/11/2026' }).dailyDate).toBe('');
  });
  it('records a new best only when higher; daily best resets per day', () => {
    let r = withScore(EMPTY_BEST, 'endless', 80, '2026-11-11');
    expect(r).toMatchObject({ isNew: true, best: { endless: 80 } });
    r = withScore(r.best, 'endless', 80, '2026-11-11');
    expect(r.isNew).toBe(false);
    const d = withScore(EMPTY_BEST, 'daily', 120, '2026-11-11');
    expect(bestFor(d.best, 'daily', '2026-11-11')).toBe(120);
    expect(bestFor(d.best, 'daily', '2026-11-12')).toBe(0);
    expect(withScore(d.best, 'daily', 10, '2026-11-12').isNew).toBe(true);
  });
  it('validates ghosts, matches by seed and keeps the better one', () => {
    expect(parseGhosts({ practice: { seedKey: 'p', score: 10, toggles: [1, 5] }, daily: { seedKey: '', score: 1, toggles: [] } }))
      .toEqual({ practice: { seedKey: 'p', score: 10, toggles: [1, 5] }, daily: null });
    expect(parseGhosts({ practice: { seedKey: 'p', score: 10, toggles: [-1] } }).practice).toBeNull();
    expect(parseGhosts({ practice: { seedKey: 'p', score: 10, toggles: [1], extra: 1 } }).practice).toBeNull();
    const g0 = { practice: null, daily: null };
    const g1 = withGhost(g0, 'practice', { seedKey: 'p', score: 50, toggles: [3] });
    expect(ghostFor(g1, 'practice', 'p')?.score).toBe(50);
    expect(ghostFor(g1, 'practice', 'other')).toBeNull();
    expect(withGhost(g1, 'practice', { seedKey: 'p', score: 40, toggles: [] })).toBe(g1);
    expect(withGhost(g1, 'endless', { seedKey: 'e', score: 99, toggles: [] })).toBe(g1);
  });
});
