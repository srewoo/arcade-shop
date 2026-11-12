import { describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS, SETTINGS_KEY, parseField, parseSettings } from '../src/settings';
import { EMPTY_SCORES, SCORES_KEY, parseScores, recordRun } from '../src/scores';
import { readJson, writeJson } from '../src/storage';
import { coerceValue } from '../src/ui/settingsPanel';

describe('settings', () => {
  it('uses the zapchain: key prefix', () => {
    expect(SETTINGS_KEY.startsWith('zapchain:')).toBe(true);
    expect(SCORES_KEY.startsWith('zapchain:')).toBe(true);
  });
  it('defaults for junk input', () => {
    expect(parseSettings(null)).toEqual(DEFAULT_SETTINGS);
    expect(parseSettings('x')).toEqual(DEFAULT_SETTINGS);
    expect(parseSettings([])).toEqual(DEFAULT_SETTINGS);
  });
  it('keeps valid fields and defaults only the bad ones', () => {
    const s = parseSettings({ volume: 35, theme: 'purple', colorAssist: true, textSize: 125, reduceMotion: 'on', sound: 'yes' });
    expect(s).toMatchObject({ volume: 35, theme: 'system', colorAssist: true, textSize: 125, reduceMotion: 'on', sound: true });
  });
  it('rejects out-of-range volume and odd text sizes', () => {
    expect(parseField('volume', 101)).toBeUndefined();
    expect(parseField('volume', -1)).toBeUndefined();
    expect(parseField('volume', 12.5)).toBeUndefined();
    expect(parseField('textSize', 110)).toBeUndefined();
    expect(parseField('volume', 0)).toBe(0);
  });
  it('colour-blind assist defaults off and reduce motion defaults to System', () => {
    expect(DEFAULT_SETTINGS.colorAssist).toBe(false);
    expect(DEFAULT_SETTINGS.reduceMotion).toBe('system');
  });
  it('coerces data-value strings', () => {
    expect(coerceValue('true')).toBe(true);
    expect(coerceValue('125')).toBe(125);
    expect(coerceValue('dark')).toBe('dark');
  });
});

describe('storage wrapper', () => {
  it('never throws when localStorage is missing', () => {
    expect(readJson('x')).toBeNull();
    expect(writeJson('x', { a: 1 })).toBe(false);
  });
});

describe('scores', () => {
  it('rejects bad stored data', () => {
    expect(parseScores({ best: -5, bestLevel: 1 })).toEqual(EMPTY_SCORES);
    expect(parseScores({ best: 10, bestLevel: 0 })).toEqual(EMPTY_SCORES);
    expect(parseScores({ best: 10, bestLevel: 2, extra: 1 })).toEqual(EMPTY_SCORES);
    expect(parseScores({ best: 10, bestLevel: 2 })).toEqual({ best: 10, bestLevel: 2 });
  });
  it('flags only a strictly higher score as a new best and tracks the top level', () => {
    const a = recordRun(EMPTY_SCORES, 100, 2);
    expect(a.isNew).toBe(true);
    expect(a.scores).toEqual({ best: 100, bestLevel: 2 });
    const b = recordRun(a.scores, 100, 1);
    expect(b.isNew).toBe(false);
    expect(b.scores).toEqual({ best: 100, bestLevel: 2 });
    const c = recordRun(b.scores, 60, 5);
    expect(c.isNew).toBe(false);
    expect(c.scores.bestLevel).toBe(5);
  });
});
