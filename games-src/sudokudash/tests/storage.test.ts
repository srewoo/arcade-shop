import { describe, expect, it } from 'vitest';
import { formatGrid, parseGrid } from '../src/core/grid';
import { newGame } from '../src/core/game';
import { dashStart } from '../src/core/scoring';
import { parseSavedGame, toSavedGame, type Restored } from '../src/savedGame';
import { emptyBests, parseBests, recordResult } from '../src/bests';
import { DEFAULT_SETTINGS, parseSettings } from '../src/storage';
import { PUZZLE, SOLUTION } from './fixtures';

describe('settings validation', () => {
  it('falls back to defaults for junk', () => {
    expect(parseSettings(null)).toEqual(DEFAULT_SETTINGS);
    expect(parseSettings('nope')).toEqual(DEFAULT_SETTINGS);
    expect(parseSettings({ theme: 'neon', sound: 'yes' })).toEqual(DEFAULT_SETTINGS);
  });

  it('keeps valid fields and defaults the rest', () => {
    const s = parseSettings({ theme: 'dark', sound: false, difficulty: 'wizard', mode: 'classic' });
    expect(s.theme).toBe('dark');
    expect(s.sound).toBe(false);
    expect(s.mode).toBe('classic');
    expect(s.difficulty).toBe(DEFAULT_SETTINGS.difficulty);
  });
});

describe('bests', () => {
  it('validates per difficulty', () => {
    const b = parseBests({
      easy: { classicTimeMs: 95_000, dashTimeMs: 90_000, dashScore: 1200 },
      hard: { classicTimeMs: -5, dashTimeMs: null, dashScore: 1 },
      medium: { classicTimeMs: 1, dashTimeMs: null, dashScore: 0, extra: true },
      extra: 1,
    });
    expect(b.easy).toEqual({ classicTimeMs: 95_000, dashTimeMs: 90_000, dashScore: 1200 });
    expect(b.hard).toEqual(emptyBests().hard);
    expect(b.medium).toEqual(emptyBests().medium);
    expect(parseBests(42)).toEqual(emptyBests());
  });

  it('migrates the old single-time shape without losing records', () => {
    const b = parseBests({
      easy: { bestTimeMs: 90_000, bestScore: 1200 },
      medium: { bestTimeMs: 150_000, bestScore: 0 },
      hard: { bestTimeMs: null, bestScore: 0 },
    });
    expect(b.easy).toEqual({ classicTimeMs: null, dashTimeMs: 90_000, dashScore: 1200 });
    expect(b.medium).toEqual({ classicTimeMs: 150_000, dashTimeMs: null, dashScore: 0 });
    expect(b.hard).toEqual(emptyBests().hard);
  });

  it('records improvements only, per mode', () => {
    const first = recordResult(emptyBests(), 'medium', 'dash', 100_000, 800);
    expect(first.newTime && first.newScore).toBe(true);
    const slower = recordResult(first.bests, 'medium', 'dash', 120_000, 500);
    expect(slower.newTime || slower.newScore).toBe(false);
    expect(slower.bests.medium).toEqual({ classicTimeMs: null, dashTimeMs: 100_000, dashScore: 800 });
    const better = recordResult(first.bests, 'medium', 'dash', 90_000, 0);
    expect(better.newTime).toBe(true);
    expect(better.bests.medium.dashScore).toBe(800);
  });

  it('a Classic win never alters the Dash row, and a Dash win never alters Classic', () => {
    const dash = recordResult(emptyBests(), 'easy', 'dash', 60_000, 900).bests;
    const classic = recordResult(dash, 'easy', 'classic', 200_000, 0);
    expect(classic.bests.easy.dashTimeMs).toBe(60_000);
    expect(classic.bests.easy.dashScore).toBe(900);
    expect(classic.bests.easy.classicTimeMs).toBe(200_000);
    expect(classic.newTime).toBe(true);
    expect(classic.newScore).toBe(false);
    const dash2 = recordResult(classic.bests, 'easy', 'dash', 50_000, 1000);
    expect(dash2.bests.easy.classicTimeMs).toBe(200_000);
  });
});

describe('settings (polish pass)', () => {
  it('validates each new field and falls back per field', () => {
    const s = parseSettings({ volume: 40, reduceMotion: 'on', colorBlind: true, textSize: 125, theme: 'dark' });
    expect(s).toMatchObject({ volume: 40, reduceMotion: 'on', colorBlind: true, textSize: 125, theme: 'dark' });
    const bad = parseSettings({ volume: 140, reduceMotion: 'maybe', colorBlind: 'yes', textSize: 110 });
    expect(bad.volume).toBe(DEFAULT_SETTINGS.volume);
    expect(bad.reduceMotion).toBe('system');
    expect(bad.colorBlind).toBe(false);
    expect(bad.textSize).toBe(100);
    expect(parseSettings({ volume: 33.5 }).volume).toBe(DEFAULT_SETTINGS.volume);
  });

  it('old saves without the new fields still load with defaults', () => {
    const old = { theme: 'light', sound: false, mode: 'classic', difficulty: 'hard', mistakeLimit: false, autoRemoveNotes: false };
    expect(parseSettings(old)).toEqual({ ...DEFAULT_SETTINGS, ...old });
  });
});

describe('saved game validation', () => {
  const base = (): Restored => ({
    state: newGame(parseGrid(PUZZLE) as number[], parseGrid(SOLUTION) as number[]),
    mode: 'dash', difficulty: 'easy', daily: '2026-11-11', custom: false, mistakes: 1, mistakeLimit: true,
    elapsedMs: 12_345.6, hintsUsed: 2, assisted: false, dash: dashStart('easy'),
    awarded: [2, 3], bestCombo: 2, mistakeCells: [5],
  });

  it('round-trips through JSON', () => {
    const json = JSON.parse(JSON.stringify(toSavedGame(base()))) as unknown;
    const back = parseSavedGame(json);
    expect(back).not.toBeNull();
    expect(formatGrid(back!.state.puzzle)).toBe(PUZZLE);
    expect(back?.mistakes).toBe(1);
    expect(back?.daily).toBe('2026-11-11');
    expect(back?.elapsedMs).toBe(12_346);
    expect(back?.awarded).toEqual([2, 3]);
    expect(back?.bestCombo).toBe(2);
    expect(back?.mistakeCells).toEqual([5]);
  });

  it('loads a version-1 save (no paid-cell tracking) and treats correct entries as already paid', () => {
    const values = `${PUZZLE.slice(0, 2)}${SOLUTION.slice(2, 4)}${PUZZLE.slice(4)}`;
    const v1 = { ...toSavedGame(base()), v: 1, values } as Record<string, unknown>;
    delete v1.awarded;
    delete v1.bestCombo;
    delete v1.mistakeCells;
    const back = parseSavedGame(v1);
    expect(back).not.toBeNull();
    expect(back?.awarded).toEqual([2, 3]);
    expect(back?.mistakeCells).toEqual([]);
  });

  it('rejects tampered or inconsistent saves', () => {
    const good = toSavedGame(base());
    expect(parseSavedGame({ ...good, v: 3 })).toBeNull();
    expect(parseSavedGame({ ...good, awarded: [99] })).toBeNull();
    expect(parseSavedGame({ ...good, puzzle: 'abc' })).toBeNull();
    expect(parseSavedGame({ ...good, extra: true })).toBeNull();
    expect(parseSavedGame({ ...good, notes: [1, 2, 3] })).toBeNull();
    expect(parseSavedGame({ ...good, solution: `9${SOLUTION.slice(1)}` })).toBeNull();
    expect(parseSavedGame({ ...good, values: `.${good.values.slice(1)}` })).toBeNull();
    expect(parseSavedGame({ ...good, dash: null })).toBeNull();
    expect(parseSavedGame(null)).toBeNull();
  });
});
