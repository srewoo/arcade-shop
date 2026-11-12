import { describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS, motionReduced, parseField, parseSettings } from '../src/settings';
import { ALL_KEYS, bestFor, boardKey, parseScores, recordRun } from '../src/scores';

describe('settings parsing', () => {
  it('falls back to defaults for junk', () => {
    expect(parseSettings(null)).toEqual(DEFAULT_SETTINGS);
    expect(parseSettings('x')).toEqual(DEFAULT_SETTINGS);
    expect(parseSettings([])).toEqual(DEFAULT_SETTINGS);
  });
  it('keeps valid fields and defaults only the bad ones', () => {
    const s = parseSettings({ difficulty: 'hard', volume: 500, textSize: 125, theme: 'neon', autoFire: false, extra: 1 });
    expect(s.difficulty).toBe('hard');
    expect(s.textSize).toBe(125);
    expect(s.autoFire).toBe(false);
    expect(s.volume).toBe(DEFAULT_SETTINGS.volume);
    expect(s.theme).toBe('system');
    expect('extra' in s).toBe(false);
  });
  it('validates individual fields', () => {
    expect(parseField('volume', 55)).toBe(55);
    expect(parseField('volume', 55.5)).toBeUndefined();
    expect(parseField('textSize', 110)).toBeUndefined();
    expect(parseField('reduceMotion', 'on')).toBe('on');
    expect(parseField('mode', 'endless')).toBe('endless');
    expect(parseField('colorAssist', 'yes')).toBeUndefined();
  });
  it('resolves reduce motion against the system preference', () => {
    expect(motionReduced({ reduceMotion: 'system' }, true)).toBe(true);
    expect(motionReduced({ reduceMotion: 'system' }, false)).toBe(false);
    expect(motionReduced({ reduceMotion: 'on' }, false)).toBe(true);
    expect(motionReduced({ reduceMotion: 'off' }, true)).toBe(false);
  });
});

describe('high scores', () => {
  it('parses per entry with fallback', () => {
    const book = parseScores({ 'campaign-easy': { score: 1200, wave: 5 }, 'campaign-hard': { score: -4, wave: 1 }, 'endless-normal': 'bad' });
    expect(book['campaign-easy']).toEqual({ score: 1200, wave: 5 });
    expect(book['campaign-hard']).toBeUndefined();
    expect(bestFor(book, 'endless', 'normal')).toEqual({ score: 0, wave: 0 });
    expect(ALL_KEYS).toHaveLength(6);
  });
  it('records only improvements and flags a new best', () => {
    let r = recordRun({}, 'campaign', 'normal', 5000, 4);
    expect(r.isBest).toBe(true);
    r = recordRun(r.book, 'campaign', 'normal', 3000, 6);
    expect(r.isBest).toBe(false);
    expect(bestFor(r.book, 'campaign', 'normal')).toEqual({ score: 5000, wave: 6 });
    expect(r.book[boardKey('campaign', 'easy')]).toBeUndefined();
  });
  it('clamps absurd values', () => {
    const r = recordRun({}, 'endless', 'hard', 1e12, 1e6);
    expect(bestFor(r.book, 'endless', 'hard')).toEqual({ score: 999_999_999, wave: 9999 });
    expect(parseScores(JSON.parse(JSON.stringify(r.book)))['endless-hard']).toBeDefined();
  });
});
