import { describe, expect, it } from 'vitest';
import {
  DEFAULT_SETTINGS, PUZZLE_COUNT, ScoresSchema, SettingsSchema, emptyScores, parseScores, parseSettings, recordScore,
} from '../src/settings';

describe('settings validation', () => {
  it('returns defaults for junk input', () => {
    expect(parseSettings(null)).toEqual(DEFAULT_SETTINGS);
    expect(parseSettings('x')).toEqual(DEFAULT_SETTINGS);
    expect(parseSettings(42)).toEqual(DEFAULT_SETTINGS);
  });
  it('keeps valid fields and defaults invalid ones', () => {
    const s = parseSettings({ theme: 'dark', sound: 'yes', symbols: true, motion: 'warp', extra: 1 });
    expect(s).toEqual({ ...DEFAULT_SETTINGS, theme: 'dark', symbols: true });
  });
  it('schema is strict about unknown keys', () => {
    expect(SettingsSchema.safeParse({ ...DEFAULT_SETTINGS, evil: 1 }).success).toBe(false);
    expect(SettingsSchema.safeParse(DEFAULT_SETTINGS).success).toBe(true);
  });
});

describe('scores validation', () => {
  it('accepts a well-formed record', () => {
    const s = { ...emptyScores(), arcade: 1200 };
    expect(parseScores(s)).toEqual(s);
  });
  it('rejects negative, fractional, wrong-length and unknown data', () => {
    expect(parseScores({ ...emptyScores(), arcade: -1 })).toEqual(emptyScores());
    expect(parseScores({ ...emptyScores(), rush: 1.5 })).toEqual(emptyScores());
    expect(parseScores({ ...emptyScores(), stars: [1, 2] })).toEqual(emptyScores());
    expect(parseScores({ ...emptyScores(), stars: new Array(PUZZLE_COUNT).fill(4) })).toEqual(emptyScores());
    expect(ScoresSchema.safeParse({ ...emptyScores(), x: 1 }).success).toBe(false);
    expect(parseScores(undefined)).toEqual(emptyScores());
  });
  it('recordScore keeps the best score and best stars without mutating', () => {
    const base = emptyScores();
    const a = recordScore(base, 'puzzle', 900, { index: 2, stars: 2 });
    expect(a.best).toBe(true);
    expect(a.scores.puzzle).toBe(900);
    expect(a.scores.stars[2]).toBe(2);
    expect(base.stars[2]).toBe(0);
    const b = recordScore(a.scores, 'puzzle', 500, { index: 2, stars: 1 });
    expect(b.best).toBe(false);
    expect(b.scores.puzzle).toBe(900);
    expect(b.scores.stars[2]).toBe(2);
  });
});
