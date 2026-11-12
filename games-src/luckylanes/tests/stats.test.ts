import { describe, expect, it } from 'vitest';
import { emptyStats, parseStats, recordGame, spareStars, tallyRolls } from '../src/stats';
import { detailLine, starText } from '../src/resultsText';
import { statsLine } from '../src/menu';
import { createMatch, recordRoll } from '../src/match';
import { fullRack } from '../src/pins';

describe('lifetime stats', () => {
  it('starts at zero and survives junk', () => {
    expect(parseStats(null)).toEqual(emptyStats());
    expect(parseStats('x')).toEqual(emptyStats());
    expect(parseStats({ games: 'many', best: 999, strikes: 4, spares: -1, gutters: 2.5 })).toEqual({ ...emptyStats(), strikes: 4 });
  });
  it('keeps valid stored values', () => {
    const s = { games: 3, best: 150, strikes: 7, spares: 9, gutters: 2 };
    expect(parseStats(s)).toEqual(s);
  });
  it('counts strikes, spares and gutters from rolls', () => {
    expect(tallyRolls([10, 7, 3, 0, 4, 10, 10])).toEqual({ strikes: 3, spares: 1, gutters: 1 });
    expect(tallyRolls([])).toEqual({ strikes: 0, spares: 0, gutters: 0 });
  });
  it('records a game: totals add up and best only rises', () => {
    let s = recordGame(emptyStats(), 120, { strikes: 2, spares: 3, gutters: 1 });
    s = recordGame(s, 90, { strikes: 1, spares: 0, gutters: 4 });
    expect(s).toEqual({ games: 2, best: 120, strikes: 3, spares: 3, gutters: 5 });
    expect(recordGame(s, 999, { strikes: 0, spares: 0, gutters: 0 }).best).toBe(300);
  });
  it('rates the spare challenge 0-3 stars at 15/25/35', () => {
    expect([0, 14, 15, 24, 25, 34, 35, 80].map(spareStars)).toEqual([0, 0, 1, 1, 2, 2, 3, 3]);
    expect(starText(2)).toBe('★★☆');
  });
  it('writes the menu stats line and the results detail', () => {
    expect(statsLine(emptyStats())).toMatch(/Play a game/);
    expect(statsLine({ games: 2, best: 140, strikes: 5, spares: 6, gutters: 1 })).toBe('Games 2 · Best 140 · Strikes 5 · Spares 6 · Gutters 1');
    let m = createMatch({ mode: 'solo', players: 1, cpuLevel: 'casual' });
    m = recordRoll(m, new Array(10).fill(false));
    expect(detailLine(m)).toBe('1 strike, 0 spares');
    const sp = createMatch({ mode: 'spare', players: 1, cpuLevel: 'casual', seed: 3 });
    expect(detailLine(sp)).toMatch(/Stars: ☆☆☆/);
    expect(fullRack()).toHaveLength(10);
  });
});
