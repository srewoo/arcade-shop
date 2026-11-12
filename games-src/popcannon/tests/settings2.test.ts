import { describe, expect, it } from 'vitest';
import {
  DEFAULT_SETTINGS, PUZZLE_COUNT, SCORES_VERSION, SettingsSchema, dailyTodayBest, dayNumber, emptyScores, firstRunSettings,
  parseScores, parseSettings, recordScore,
} from '../src/settings';

describe('new settings fields', () => {
  it('defaults are valid under the strict schema', () => {
    expect(SettingsSchema.safeParse(DEFAULT_SETTINGS).success).toBe(true);
    expect(DEFAULT_SETTINGS).toMatchObject({ volume: 80, textScale: 100, highContrast: false, seenTutorial: false });
  });
  it('validates each field and falls back per field', () => {
    const s = parseSettings({ volume: 40, textScale: 125, highContrast: true, seenTutorial: true, seenHints: ['bomb'], theme: 'dark' });
    expect(s).toMatchObject({ volume: 40, textScale: 125, highContrast: true, seenTutorial: true, seenHints: ['bomb'], theme: 'dark' });
    const bad = parseSettings({ volume: 101, textScale: 130, highContrast: 'yes', seenTutorial: 1, seenHints: ['nope'] });
    expect(bad).toEqual(DEFAULT_SETTINGS);
    expect(parseSettings({ volume: 5.5 }).volume).toBe(80);
    expect(parseSettings({ volume: -1 }).volume).toBe(80);
  });
  it('keeps the legacy motion values and old settings blobs working', () => {
    const old = { theme: 'light', sound: false, symbols: true, motion: 'reduce' };
    expect(parseSettings(old)).toEqual({ ...DEFAULT_SETTINGS, ...old });
  });
  it('first run turns symbols on when the OS asks for more contrast', () => {
    expect(firstRunSettings(true).symbols).toBe(true);
    expect(firstRunSettings(false).symbols).toBe(false);
    expect(parseSettings({}, firstRunSettings(true)).symbols).toBe(true);
    expect(parseSettings({ symbols: false }, firstRunSettings(true)).symbols).toBe(false);
  });
  it('does not share the default hints array between parses', () => {
    const a = parseSettings(null);
    a.seenHints.push('bomb');
    expect(parseSettings(null).seenHints).toEqual([]);
  });
});

describe('scores v2', () => {
  it('migrates a v1 record: keeps point bests, restarts puzzle stars', () => {
    const v1 = { arcade: 900, rush: 400, puzzle: 700, stars: new Array(PUZZLE_COUNT).fill(3) };
    const s = parseScores(v1);
    expect(s).toMatchObject({ v: SCORES_VERSION, arcade: 900, rush: 400, puzzle: 700 });
    expect(s.stars).toEqual(new Array(PUZZLE_COUNT).fill(0));
  });
  it('keeps v2 stars', () => {
    const v2 = { ...emptyScores(), stars: [3, 2, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0] };
    expect(parseScores(v2)).toEqual(v2);
  });
  it('ignores junk per field', () => {
    expect(parseScores({ v: 2, arcade: 'x', rush: 12, daily: -5 })).toMatchObject({ arcade: 0, rush: 12, daily: 0 });
  });
  it('records Daily results per day with a separate best', () => {
    const a = recordScore(emptyScores(), 'daily', 500, undefined, 20261111);
    expect(a.best).toBe(true);
    expect(a.scores).toMatchObject({ daily: 500, dailyDay: 20261111, dailyToday: 500, arcade: 0 });
    const b = recordScore(a.scores, 'daily', 300, undefined, 20261111);
    expect(b.best).toBe(false);
    expect(b.scores.dailyToday).toBe(500);
    const c = recordScore(b.scores, 'daily', 100, undefined, 20261112);
    expect(c.best).toBe(true);
    expect(c.scores).toMatchObject({ dailyToday: 100, dailyDay: 20261112, daily: 500 });
    expect(dailyTodayBest(c.scores, 20261111)).toBe(0);
    expect(dailyTodayBest(c.scores, 20261112)).toBe(100);
  });
  it('dayNumber is yyyymmdd in local time', () => {
    expect(dayNumber(new Date(2026, 10, 11, 23, 59))).toBe(20261111);
    expect(dayNumber(new Date(2027, 0, 5))).toBe(20270105);
  });
});
