import { describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS, parseField, parseSettings } from '../src/settings';
import { EMPTY_SCORES, parseScores, recordGame } from '../src/scores';

describe('settings parsing', () => {
  it('returns defaults for junk', () => {
    expect(parseSettings(null)).toEqual(DEFAULT_SETTINGS);
    expect(parseSettings('x')).toEqual(DEFAULT_SETTINGS);
    expect(parseSettings([1, 2])).toEqual(DEFAULT_SETTINGS);
  });
  it('keeps valid fields and falls back per field', () => {
    const s = parseSettings({ volume: 30, theme: 'purple', textSize: 125, reduceMotion: 'on', colorAssist: 'yes', players: 2, sound: false, difficulty: 'tricky' });
    expect(s).toMatchObject({ volume: 30, theme: 'system', textSize: 125, reduceMotion: 'on', colorAssist: false, players: 2, sound: false, difficulty: 'tricky' });
  });
  it('rejects out-of-range and non-integer volume', () => {
    expect(parseField('volume', 101)).toBeUndefined();
    expect(parseField('volume', -1)).toBeUndefined();
    expect(parseField('volume', 5.5)).toBeUndefined();
    expect(parseField('volume', 100)).toBe(100);
  });
  it('rejects unknown text sizes and players', () => {
    expect(parseField('textSize', 110)).toBeUndefined();
    expect(parseField('players', 3)).toBeUndefined();
  });
  it('ignores unknown extra keys', () => {
    expect(parseSettings({ evil: 1, volume: 10 }).volume).toBe(10);
  });
});

describe('score persistence', () => {
  it('defaults and per-field fallback', () => {
    expect(parseScores(undefined)).toEqual(EMPTY_SCORES);
    expect(parseScores({ best: 200, games: -4, strikes: 'x', spares: 3.5, fish: 2 })).toEqual({ best: 200, games: 0, strikes: 0, spares: 0, fish: 2 });
  });
  it('records a finished game and keeps the best', () => {
    const a = recordGame(EMPTY_SCORES, { score: 120, strikes: 2, spares: 3, fish: 1 });
    expect(a).toEqual({ best: 120, games: 1, strikes: 2, spares: 3, fish: 1 });
    const b = recordGame(a, { score: 90, strikes: 1, spares: 0, fish: 0 });
    expect(b.best).toBe(120);
    expect(b.games).toBe(2);
    expect(b.strikes).toBe(3);
  });
});
