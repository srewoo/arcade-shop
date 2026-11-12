import { describe, expect, it } from 'vitest';
import {
  addHighScore, DEFAULT_SETTINGS, emptyHighScores, MAX_ENTRIES, parseHighScores, parseSettings, SettingsSchema,
} from '../src/settings';

describe('parseSettings', () => {
  it('returns defaults for junk', () => {
    expect(parseSettings(null)).toEqual(DEFAULT_SETTINGS);
    expect(parseSettings('x')).toEqual(DEFAULT_SETTINGS);
    expect(parseSettings([1, 2])).toEqual(DEFAULT_SETTINGS);
  });
  it('keeps valid fields and defaults invalid ones', () => {
    const s = parseSettings({ mode: 'cpu', players: 9, cpuLevel: 'pro', theme: 'neon', sound: 'yes' });
    expect(s).toEqual({ ...DEFAULT_SETTINGS, mode: 'cpu', cpuLevel: 'pro' });
  });
  it('schema is strict about unknown keys and ranges', () => {
    expect(SettingsSchema.safeParse({ ...DEFAULT_SETTINGS, extra: 1 }).success).toBe(false);
    expect(SettingsSchema.safeParse({ ...DEFAULT_SETTINGS, players: 1 }).success).toBe(false);
    expect(SettingsSchema.safeParse({ ...DEFAULT_SETTINGS, players: 4 }).success).toBe(true);
  });
});

describe('high scores', () => {
  it('starts empty and tolerates junk', () => {
    expect(parseHighScores(undefined)).toEqual(emptyHighScores());
    expect(parseHighScores({ solo: 'nope', cpuPro: [{ score: -3, at: 1 }] })).toEqual(emptyHighScores());
  });
  it('drops invalid entries individually, sorts and trims', () => {
    const entries = [
      { score: 120, at: 1 }, { score: 301, at: 2 }, { score: 'x', at: 3 }, { score: 200, at: 4 },
      { score: 90.5, at: 5 }, { score: 50, at: 6 }, { score: 60, at: 7 }, { score: 70, at: 8 }, { score: 80, at: 9 },
      { score: 100, at: 10, extra: true },
    ];
    const hs = parseHighScores({ solo: entries });
    expect(hs.solo.map((e) => e.score)).toEqual([200, 120, 80, 70, 60]);
    expect(hs.solo).toHaveLength(MAX_ENTRIES);
  });
  it('adds a score and reports its rank', () => {
    let hs = emptyHighScores();
    let r = addHighScore(hs, 'solo', 150, 1);
    expect(r.rank).toBe(1);
    hs = r.scores;
    r = addHighScore(hs, 'solo', 200, 2);
    expect(r.rank).toBe(1);
    hs = r.scores;
    r = addHighScore(hs, 'solo', 170, 3);
    expect(r.rank).toBe(2);
    expect(r.scores.solo.map((e) => e.score)).toEqual([200, 170, 150]);
    expect(hs.solo).toHaveLength(2);
  });
  it('keeps modes separate and rejects bad scores', () => {
    const r = addHighScore(emptyHighScores(), 'cpuPro', 99, 1);
    expect(r.scores.solo).toEqual([]);
    expect(r.scores.cpuPro).toHaveLength(1);
    expect(addHighScore(emptyHighScores(), 'solo', 0, 1).rank).toBeNull();
    expect(addHighScore(emptyHighScores(), 'solo', 301, 1).rank).toBeNull();
    expect(addHighScore(emptyHighScores(), 'solo', 12.5, 1).rank).toBeNull();
  });
  it('a score below a full table does not place', () => {
    let hs = emptyHighScores();
    for (let i = 0; i < MAX_ENTRIES; i++) hs = addHighScore(hs, 'spare', 100 + i, i).scores;
    expect(addHighScore(hs, 'spare', 50, 99).rank).toBeNull();
    expect(addHighScore(hs, 'spare', 50, 99).scores.spare).toHaveLength(MAX_ENTRIES);
  });
});
