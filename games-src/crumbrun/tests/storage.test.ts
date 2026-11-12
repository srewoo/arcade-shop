import { describe, expect, it, vi } from 'vitest';
import {
  DEFAULT_SETTINGS, HIGHSCORE_KEY, HighScoreSchema, SCORES_KEY, SETTINGS_KEY, STATS_KEY, loadHighScore, loadScores,
  loadSettings, loadStats, recordScore, resetWarnings, recordStats, saveHighScore, saveSettings, updateSettings,
} from '../src/storage';
import type { KeyValueStore, ScoreEntry } from '../src/storage';

function memStore(seed: Record<string, string> = {}): KeyValueStore & { data: Record<string, string> } {
  const data = { ...seed };
  return {
    data,
    getItem: (k) => data[k] ?? null,
    setItem: (k, v) => {
      data[k] = v;
    },
  };
}

const throwing: KeyValueStore = {
  getItem: () => {
    throw new Error('denied');
  },
  setItem: () => {
    throw new Error('quota');
  },
};

describe('settings validation', () => {
  it('round-trips valid settings', () => {
    const s = memStore();
    const mine = { ...DEFAULT_SETTINGS, muted: true, volume: 35, reduceMotion: 'on' as const, textSize: 150 as const, seen: true };
    expect(saveSettings(mine, s)).toBe(true);
    expect(loadSettings(s)).toEqual(mine);
  });

  it('migrates a legacy save that only had `muted`', () => {
    const s = memStore({ [SETTINGS_KEY]: '{"muted":true}' });
    expect(loadSettings(s)).toEqual({ ...DEFAULT_SETTINGS, muted: true });
  });

  it.each([
    ['garbage', 'not json{'],
    ['array', '[]'],
    ['null', 'null'],
    ['number', '7'],
  ])('falls back to defaults on %s', (_n, raw) => {
    expect(loadSettings(memStore({ [SETTINGS_KEY]: raw }))).toEqual(DEFAULT_SETTINGS);
  });

  it('one bad key never resets the others', () => {
    const raw = JSON.stringify({ muted: 'yes', volume: 20, reduceMotion: 'sometimes', textSize: 125, colorAssist: true, leftHanded: 1, seen: true });
    expect(loadSettings(memStore({ [SETTINGS_KEY]: raw }))).toEqual({
      ...DEFAULT_SETTINGS, volume: 20, textSize: 125, colorAssist: true, seen: true,
    });
  });

  it.each([
    ['volume above range', { volume: 101 }],
    ['volume fractional', { volume: 50.5 }],
    ['volume negative', { volume: -1 }],
    ['text size off list', { textSize: 110 }],
  ])('rejects %s per field', (_n, patch) => {
    const loaded = loadSettings(memStore({ [SETTINGS_KEY]: JSON.stringify(patch) }));
    expect(loaded).toEqual(DEFAULT_SETTINGS);
  });

  it('ignores unknown keys but keeps valid known ones', () => {
    expect(loadSettings(memStore({ [SETTINGS_KEY]: '{"muted":true,"admin":true}' })).muted).toBe(true);
  });

  it('warns once, not on every load, when a value is discarded', () => {
    resetWarnings();
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const store = memStore({ [SETTINGS_KEY]: '{"volume":"loud"}' });
    loadSettings(store);
    loadSettings(store);
    expect(spy.mock.calls.filter((c) => String(c[0]).includes('settings.volume')).length).toBe(1);
    spy.mockRestore();
  });

  it('updateSettings merges a patch and persists the whole object', () => {
    const s = memStore({ [SETTINGS_KEY]: '{"volume":10}' });
    const next = updateSettings({ muted: true }, s);
    expect(next).toEqual({ ...DEFAULT_SETTINGS, volume: 10, muted: true });
    expect(JSON.parse(s.data[SETTINGS_KEY] as string)).toEqual(next);
  });

  it('schema rejects invalid whole objects on save', () => {
    expect(() => saveSettings({ ...DEFAULT_SETTINGS, volume: 500 }, memStore())).toThrow();
  });

  it('never throws when storage is unavailable', () => {
    expect(loadSettings(throwing)).toEqual(DEFAULT_SETTINGS);
    expect(saveSettings({ ...DEFAULT_SETTINGS, muted: true }, throwing)).toBe(false);
    expect(loadSettings(null)).toEqual(DEFAULT_SETTINGS);
    expect(updateSettings({ muted: true }, throwing).muted).toBe(true);
  });
});

describe('top-5 scores and stats', () => {
  const e = (score: number, level = 1, date = '2026-11-11T10:00:00.000Z'): ScoreEntry => ({ score, level, date });

  it('keeps the best five, sorted, and ignores zero scores', () => {
    const s = memStore();
    for (const sc of [500, 0, 9000, 100, 7000, 300, 12000]) recordScore(e(sc), s);
    expect(loadScores(s).map((x) => x.score)).toEqual([12000, 9000, 7000, 500, 300]);
  });

  it('drops invalid entries individually and survives garbage', () => {
    const raw = JSON.stringify([e(100), { score: -4, level: 1, date: 'x' }, { score: 'a' }, e(900, 3)]);
    expect(loadScores(memStore({ [SCORES_KEY]: raw })).map((x) => x.score)).toEqual([900, 100]);
    expect(loadScores(memStore({ [SCORES_KEY]: '{"a":1}' }))).toEqual([]);
    expect(loadScores(memStore({ [SCORES_KEY]: 'zzz' }))).toEqual([]);
    expect(loadScores(throwing)).toEqual([]);
  });

  it('stats only ever go up, per field', () => {
    const s = memStore();
    expect(recordStats(4, 3, s)).toEqual({ bestLevel: 4, bestChain: 3 });
    expect(recordStats(2, 4, s)).toEqual({ bestLevel: 4, bestChain: 4 });
    expect(loadStats(memStore({ [STATS_KEY]: '{"bestLevel":"x","bestChain":2}' }))).toEqual({ bestLevel: 0, bestChain: 2 });
  });
});

describe('high score validation', () => {
  it('round-trips a valid score', () => {
    const s = memStore();
    expect(saveHighScore(12345, s)).toBe(true);
    expect(loadHighScore(s)).toBe(12345);
  });

  it.each([['-5'], ['1.5'], ['"9000"'], ['1e12'], ['abc'], ['{"a":1}']])('rejects %s', (raw) => {
    expect(loadHighScore(memStore({ [HIGHSCORE_KEY]: raw }))).toBe(0);
  });

  it('refuses to save invalid scores and survives broken storage', () => {
    const s = memStore();
    expect(saveHighScore(-1, s)).toBe(false);
    expect(saveHighScore(Number.NaN, s)).toBe(false);
    expect(s.data[HIGHSCORE_KEY]).toBeUndefined();
    expect(loadHighScore(throwing)).toBe(0);
    expect(saveHighScore(10, throwing)).toBe(false);
    expect(HighScoreSchema.safeParse(10.5).success).toBe(false);
  });
});
