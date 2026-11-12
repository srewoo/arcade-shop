import { describe, expect, it } from 'vitest';
import { CONFIG } from '../src/config';
import { EMPTY_BEST, isUnlocked, parseBest, withScore } from '../src/scores';
import { DEFAULT_SETTINGS, parseField, parseSettings } from '../src/settings';

describe('best scores', () => {
  it('falls back per field on garbage', () => {
    expect(parseBest(null)).toEqual(EMPTY_BEST);
    expect(parseBest({ classic: 12, twoballs: -3, windy: 'x' })).toEqual({ classic: 12, twoballs: 0, windy: 0 });
  });
  it('records only improvements', () => {
    const b = { ...EMPTY_BEST, classic: 10 };
    expect(withScore(b, 'classic', 8)).toEqual({ best: b, isNew: false });
    expect(withScore(b, 'classic', 11)).toEqual({ best: { ...b, classic: 11 }, isNew: true });
    expect(withScore(b, 'windy', 3).best.windy).toBe(3);
  });
  it('Two Balls unlocks at the configured Classic score', () => {
    const n = CONFIG.twoBalls.unlockScore;
    expect(isUnlocked('twoballs', { ...EMPTY_BEST, classic: n - 1 })).toBe(false);
    expect(isUnlocked('twoballs', { ...EMPTY_BEST, classic: n })).toBe(true);
    expect(isUnlocked('classic', EMPTY_BEST)).toBe(true);
    expect(isUnlocked('windy', EMPTY_BEST)).toBe(true);
  });
});

describe('settings', () => {
  it('defaults and per-field validation', () => {
    expect(parseSettings(undefined)).toEqual(DEFAULT_SETTINGS);
    const s = parseSettings({ volume: 40, reduceMotion: 'bogus', textSize: 125, mode: 'windy', extra: 1 });
    expect(s.volume).toBe(40);
    expect(s.reduceMotion).toBe('system');
    expect(s.textSize).toBe(125);
    expect(s.mode).toBe('windy');
    expect(parseField('volume', 101)).toBeUndefined();
  });
});
