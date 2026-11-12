import { describe, expect, it } from 'vitest';
import { compactShifts, findGroup, hasMove, releaseFloating, restRow, topRow } from '../src/model/grid';
import { layout } from './helpers';

describe('findGroup', () => {
  it('finds the 4-connected same-colour group in BFS order with parents', () => {
    const sim = layout(['112..', '211..', '2....']);
    const g = findGroup(sim.cells, 0, 9);
    expect(g.map((c) => `${c.col},${c.row}`).sort()).toEqual(['0,9', '1,10', '1,9', '2,10']);
    expect(g[0]).toMatchObject({ parent: -1, depth: 0 });
    for (const c of g.slice(1)) expect(g[c.parent]).toBeDefined();
  });
  it('does not connect diagonals, and a lone disc is a group of one', () => {
    const sim = layout(['1.', '.1']);
    expect(findGroup(sim.cells, 0, 10)).toHaveLength(1);
  });
  it('returns nothing for empty cells, bombs and out-of-range cells', () => {
    const sim = layout(['66', '..']);
    expect(findGroup(sim.cells, 0, 10)).toEqual([]);
    expect(findGroup(sim.cells, 5, 11)).toEqual([]);
    expect(findGroup(sim.cells, -1, 11)).toEqual([]);
    expect(findGroup(sim.cells, 0, 0)).toEqual([]);
  });
  it('does not mix colours or bombs into a group', () => {
    const sim = layout(['1161', '1211']);
    expect(findGroup(sim.cells, 0, 10)).toHaveLength(3);
  });
});

describe('hasMove', () => {
  it('detects dead and live boards', () => {
    expect(hasMove(layout(['12', '21']).cells)).toBe(false);
    expect(hasMove(layout(['12', '22']).cells)).toBe(true);
    expect(hasMove(layout(['16', '23']).cells)).toBe(true);
  });
});

describe('releaseFloating / restRow / topRow', () => {
  it('releases every disc above a gap', () => {
    const sim = layout(['1.', '2.', '3.', '4.']);
    sim.w.cells[11]![0] = null;
    const out = releaseFloating(sim.cells);
    expect(out.map((t) => t.kind).sort()).toEqual([1, 2, 3]);
    expect(sim.cells[10]![0]).toBeNull();
  });
  it('leaves a settled grid alone', () => {
    const sim = layout(['1.2', '112']);
    expect(releaseFloating(sim.cells)).toEqual([]);
  });
  it('finds the row a disc rests on', () => {
    const sim = layout(['1', '1']);
    expect(restRow(sim.cells, 0, 2)).toBe(9);
    expect(restRow(sim.cells, 3, 2)).toBe(11);
    expect(topRow(sim.cells, 0)).toBe(10);
    expect(topRow(sim.cells, 3)).toBe(12);
  });
});

describe('compactShifts', () => {
  const t = true, f = false;
  it('does nothing for a full or empty base', () => {
    expect(compactShifts(Array(10).fill(t))).toEqual(Array(10).fill(0));
    expect(compactShifts(Array(10).fill(f))).toEqual(Array(10).fill(0));
  });
  it('closes gaps towards the centre column', () => {
    //            0  1  2  3  4  5  6  7  8  9
    const base = [t, f, t, t, t, f, f, t, f, t];
    expect(compactShifts(base)).toEqual([1, 0, 0, 0, 0, 0, 0, -2, 0, -3]);
  });
  it('anchors on the centre-most filled column, including column 9', () => {
    const base = [f, f, f, f, f, f, f, f, f, t];
    expect(compactShifts(base)).toEqual(Array(10).fill(0));
    const two = [t, f, f, f, f, f, f, f, f, t];
    expect(compactShifts(two)).toEqual([0, 0, 0, 0, 0, 0, 0, 0, 0, -8]);
  });
});
