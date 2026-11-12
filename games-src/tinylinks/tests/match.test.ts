import { describe, expect, it } from 'vitest';
import { Match } from '../src/game/match';
import { buildScorecard } from '../src/game/scorecard';
import { MARKERS, cleanName, dedupeColors, defaultPlayers, markerFor, type Player } from '../src/game/players';

const players = (n: number): Player[] => defaultPlayers(n);

describe('Match bookkeeping', () => {
  it('limits to 4 players and starts on hole 1 in seat order', () => {
    const m = new Match({ course: 'front9', players: defaultPlayers(4).concat(defaultPlayers(1)) });
    expect(m.players).toHaveLength(4);
    expect(m.order).toEqual([0, 1, 2, 3]);
    expect(m.hole.id).toBe(1);
  });
  it('honours: the best score of the last hole plays first', () => {
    const m = new Match({ course: 'front9', players: players(3) });
    m.record(0, 4); m.record(1, 2); m.record(2, 3);
    m.beginHole(1);
    expect(m.order).toEqual([1, 2, 0]);
    expect(m.nextTurn()).toBe(true);
    expect(m.nextTurn()).toBe(true);
    expect(m.nextTurn()).toBe(false);
  });
  it('totals only count holes played, against their par', () => {
    const m = new Match({ course: 'front9', players: players(1) });
    m.record(0, 3); // hole 1 par 2
    m.beginHole(1); m.record(0, 2); // hole 2 par 3
    expect(m.total(0)).toEqual({ strokes: 5, par: 5, played: 2 });
    expect(m.standings().winners).toEqual([0]);
  });
  it('can start on a later hole and reports the last hole', () => {
    const m = new Match({ course: 'back9', players: players(1), startHole: 8 });
    expect(m.hole.id).toBe(18);
    expect(m.isLastHole).toBe(true);
  });
});

describe('Scorecard', () => {
  it('has Out/In subtotals only on the full 18', () => {
    const m18 = new Match({ course: 'all18', players: players(2) });
    expect(buildScorecard(m18).heads).toContain('Out');
    expect(buildScorecard(m18).heads).toContain('In');
    expect(buildScorecard(new Match({ course: 'front9', players: players(1) })).heads).not.toContain('Out');
  });
  it('marks birdies/bogeys and shows totals', () => {
    const m = new Match({ course: 'front9', players: players(1) });
    m.record(0, 1); // ace on par 2
    m.beginHole(1); m.record(0, 4); // bogey on par 3
    const card = buildScorecard(m);
    const row = card.rows[0];
    expect(row?.cells[0]?.kind).toBe('ace');
    expect(row?.cells[1]?.kind).toBe('bogey');
    expect(row?.cells[2]?.text).toBe('·');
    expect(row?.total).toBe('5');
    expect(row?.rel).toBe('E');
    expect(card.parTotal).toBe('27');
  });
  it('subtotals add up', () => {
    const m = new Match({ course: 'all18', players: players(1) });
    for (let i = 0; i < 9; i++) { m.beginHole(i); m.record(0, 3); }
    const row = buildScorecard(m).rows[0];
    expect(row?.cells[9]?.text).toBe('27');
  });
});

describe('Players', () => {
  it('cleans names', () => {
    expect(cleanName('  Ada   Lovelace  the Great ', 0)).toBe('Ada Lovelace');
    expect(cleanName('<b>x</b>', 0)).toBe('bx/b');
    expect(cleanName('   ', 2)).toBe('Player 3');
    expect(cleanName('a\u0000b\nc', 0)).toBe('abc');
  });
  it('gives each seat a distinct marker and de-duplicates colours', () => {
    expect(new Set([0, 1, 2, 3].map(markerFor)).size).toBe(MARKERS.length);
    const fixed = dedupeColors([{ name: 'a', color: 'sky' }, { name: 'b', color: 'sky' }, { name: 'c', color: 'sky' }]);
    expect(new Set(fixed.map((p) => p.color)).size).toBe(3);
  });
});
