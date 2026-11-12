import { describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS, SETTINGS_KEY, SETTING_KEYS, parseField, parseSettings } from '../src/settings';
import { applyChange, coerce } from '../src/store';
import { DEFAULT_STATS, parseStats, recordRound } from '../src/stats';

describe('settings parsing', () => {
  it('returns defaults for junk', () => {
    for (const raw of [null, undefined, 5, 'x', [], true]) expect(parseSettings(raw)).toEqual(DEFAULT_SETTINGS);
  });
  it('keeps valid fields and defaults only the bad ones', () => {
    const s = parseSettings({ volume: 20, theme: 'neon', textSize: 125, sound: 'yes', reduceMotion: 'on', colorAssist: true, mode: 'practice', practiceRound: 99 });
    expect(s.volume).toBe(20);
    expect(s.textSize).toBe(125);
    expect(s.reduceMotion).toBe('on');
    expect(s.colorAssist).toBe(true);
    expect(s.mode).toBe('practice');
    expect(s.theme).toBe(DEFAULT_SETTINGS.theme);
    expect(s.sound).toBe(DEFAULT_SETTINGS.sound);
    expect(s.practiceRound).toBe(DEFAULT_SETTINGS.practiceRound);
  });
  it('rejects out-of-range and non-integer volume', () => {
    expect(parseField('volume', 101)).toBeUndefined();
    expect(parseField('volume', -1)).toBeUndefined();
    expect(parseField('volume', 10.5)).toBeUndefined();
    expect(parseField('volume', 55)).toBe(55);
  });
  it('only 100/125/150 are valid text sizes', () => {
    expect(parseField('textSize', 110)).toBeUndefined();
    expect(parseField('textSize', '125')).toBeUndefined();
    expect(parseField('textSize', 150)).toBe(150);
  });
  it('ignores unknown keys and exposes the storage key', () => {
    expect(parseSettings({ evil: 1, __proto__: { x: 1 } })).toEqual(DEFAULT_SETTINGS);
    expect(SETTINGS_KEY).toBe('clayday-settings');
    expect(SETTING_KEYS).toContain('colorAssist');
  });
});

describe('settings store', () => {
  it('coerces string inputs from the UI', () => {
    expect(coerce('sound', 'false')).toBe(false);
    expect(coerce('textSize', '125')).toBe(125);
    expect(coerce('theme', 'dark')).toBe('dark');
  });
  it('applies valid changes and ignores invalid or no-op ones', () => {
    const s = DEFAULT_SETTINGS;
    expect(applyChange(s, 'textSize', '150').textSize).toBe(150);
    expect(applyChange(s, 'theme', 'purple')).toBe(s);
    expect(applyChange(s, 'volume', '500')).toBe(s);
    expect(applyChange(s, 'theme', 'system')).toBe(s);
    expect(applyChange(s, 'sound', false).sound).toBe(false);
    expect(applyChange(s, 'volume', '40').volume).toBe(40);
  });
});

describe('stats', () => {
  it('defaults and per-field fallback', () => {
    expect(parseStats(null)).toEqual(DEFAULT_STATS);
    expect(parseStats({ bestRun: 900, bestRound: -4, bestHits: 500, roundsPlayed: 'x' })).toEqual({ ...DEFAULT_STATS, bestRun: 900 });
  });
  it('records campaign bests and only counts practice rounds played', () => {
    const a = recordRound(DEFAULT_STATS, { runScore: 4000, round: 3, bestRoundHits: 21, counted: true });
    expect(a).toEqual({ bestRun: 4000, bestRound: 3, bestHits: 21, roundsPlayed: 1 });
    const b = recordRound(a, { runScore: 100, round: 1, bestRoundHits: 5, counted: true });
    expect(b.bestRun).toBe(4000);
    expect(b.roundsPlayed).toBe(2);
    const c = recordRound(b, { runScore: 99999, round: 9, bestRoundHits: 25, counted: false });
    expect(c.bestRun).toBe(4000);
    expect(c.roundsPlayed).toBe(3);
  });
});
