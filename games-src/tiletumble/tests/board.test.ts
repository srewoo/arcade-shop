import { describe, expect, it } from 'vitest';
import { addColumn, allGroups, boardFromRows, cellAt, clearGroup, discCount, findGroup, hasMoves, isEmpty, makeBoard } from '../src/board';

describe('groups', () => {
  const b = boardFromRows(['0011', '0121', '2211']);
  it('finds a connected same-colour group', () => {
    expect(findGroup(b, 3, 0)).toHaveLength(5);
    expect(findGroup(b, 0, 1)).toHaveLength(3);
  });
  it('is 4-connected, not diagonal', () => {
    const d = boardFromRows(['01', '10']);
    expect(findGroup(d, 0, 0)).toEqual([]);
    expect(hasMoves(d)).toBe(false);
  });
  it('returns [] for a lone disc or an empty cell', () => {
    expect(findGroup(boardFromRows(['01', '10']), 0, 1)).toEqual([]);
    expect(findGroup(b, 3, 5)).toEqual([]);
  });
  it('lists every group once', () => {
    const groups = allGroups(boardFromRows(['0011']));
    expect(groups.map((g) => g.length).sort()).toEqual([2, 2]);
  });
});

describe('clearGroup', () => {
  it('drops discs down after a clear', () => {
    const b = boardFromRows(['2.', '0.', '0.', '1.']);
    const g = findGroup(b, 0, 1);
    const res = clearGroup(b, g);
    expect(res.board.cols[0]).toEqual([1, 2]);
    expect(res.removed).toHaveLength(2);
    expect(res.moves).toEqual([{ from: { x: 0, y: 3 }, to: { x: 0, y: 1 } }]);
  });
  it('slides columns left when a column empties', () => {
    const b = boardFromRows(['01', '01']);
    const res = clearGroup(b, findGroup(b, 0, 0));
    expect(res.board.cols.map((c) => c.length).slice(0, 2)).toEqual([2, 0]);
    expect(res.moves).toEqual([
      { from: { x: 1, y: 0 }, to: { x: 0, y: 0 } },
      { from: { x: 1, y: 1 }, to: { x: 0, y: 1 } },
    ]);
  });
  it('leaves other columns untouched', () => {
    const b = boardFromRows(['.10', '.10', '231']);
    const res = clearGroup(b, findGroup(b, 1, 2));
    expect(res.board.cols.slice(0, 3).map((c) => [...c])).toEqual([[2], [3], [1, 0, 0]]);
    expect(res.moves).toEqual([]);
  });
});

describe('board helpers', () => {
  it('compacts empty columns to the right', () => {
    const b = makeBoard([[], [1], [], [2]], 4, 3);
    expect(b.cols.map((c) => c.length)).toEqual([1, 1, 0, 0]);
    expect(cellAt(b, 1, 0)).toBe(2);
  });
  it('counts discs and detects empty', () => {
    expect(discCount(boardFromRows(['01', '10']))).toBe(4);
    expect(isEmpty(makeBoard([], 3, 3))).toBe(true);
  });
  it('adds a column at the first free slot, or null when full', () => {
    const b = makeBoard([[0], [1]], 3, 3);
    const added = addColumn(b, [2, 2]);
    expect(added?.x).toBe(2);
    expect(added?.board.cols[2]).toEqual([2, 2]);
    expect(addColumn(added!.board, [1])).toBeNull();
  });
});
