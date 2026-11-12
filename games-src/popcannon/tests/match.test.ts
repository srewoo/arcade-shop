import { describe, expect, it } from 'vitest';
import { Bubble, Grid, bubbleCount, createGrid, getCell, neighbours, setCell } from '../src/hex';
import {
  bombCells, dropCeiling, findFloating, floodMatch, isCleared, matchGroup, removeCells,
} from '../src/match';

const n = (color: number): Bubble => ({ kind: 'normal', color });
const STONE: Bubble = { kind: 'stone', color: -1 };
const RAINBOW: Bubble = { kind: 'rainbow', color: -1 };

function build(rows: string[]): Grid {
  const g = createGrid(0);
  rows.forEach((line, row) =>
    [...line].forEach((ch, col) => {
      if (ch === '.') return;
      setCell(g, row, col, ch === '#' ? STONE : ch === '*' ? RAINBOW : n(Number(ch)));
    }),
  );
  return g;
}

describe('flood match and pop counts', () => {
  it('finds a connected group of the same colour', () => {
    const g = build(['00.1.......', '0.1.......']);
    expect(floodMatch(g, { row: 0, col: 0 }, 0)).toHaveLength(3);
  });
  it('pops 3 or more but not 2', () => {
    const three = build(['000........']);
    expect(matchGroup(three, { row: 0, col: 1 })).toHaveLength(3);
    const two = build(['00.........']);
    expect(matchGroup(two, { row: 0, col: 0 })).toHaveLength(0);
  });
  it('does not join different colours or distant groups', () => {
    const g = build(['001........', '..........']);
    expect(matchGroup(g, { row: 0, col: 0 })).toHaveLength(0);
  });
  it('rainbow matches the best neighbouring colour', () => {
    const g = build(['00*11......']);
    // rainbow joins the two 0s -> group of 3 beats group of 3? equal -> first best kept (size 3)
    expect(matchGroup(g, { row: 0, col: 2 }).length).toBe(3);
    const lone = build(['0*.........']);
    expect(matchGroup(lone, { row: 0, col: 1 })).toHaveLength(0);
  });
  it('stone never matches', () => {
    const g = build(['###........']);
    expect(floodMatch(g, { row: 0, col: 0 }, 0)).toHaveLength(0);
  });
  it('bomb pops everything within two steps except stones', () => {
    const g = build(['00000000000', '0000#00000', '00000000000']);
    const cells = bombCells(g, { row: 1, col: 4 });
    expect(cells.some((p) => p.row === 1 && p.col === 4)).toBe(false);
    expect(cells.length).toBeGreaterThan(8);
    const neighbourKeys = neighbours(1, 4, 0).filter((p) => getCell(g, p.row, p.col));
    for (const p of neighbourKeys) expect(cells).toContainEqual(p);
  });
});

describe('floating detection', () => {
  it('flags clusters cut off from the ceiling', () => {
    const g = build(['01.........', '.1........', '.0........']);
    expect(findFloating(g)).toHaveLength(0);
    removeCells(g, [{ row: 0, col: 1 }]);
    // row 0 col 0 still holds on to col 0 only; the rest hangs from row 1 col 1 -> floating
    const floating = findFloating(g);
    expect(floating.map((p) => `${p.row},${p.col}`).sort()).toEqual(['1,1', '2,1']);
  });
  it('stones fall when unsupported and count as floating', () => {
    const g = build(['0..........', '#.........']);
    expect(findFloating(g)).toHaveLength(0);
    removeCells(g, [{ row: 0, col: 0 }]);
    expect(findFloating(g)).toEqual([{ row: 1, col: 0 }]);
  });
  it('an empty grid has nothing floating and is cleared', () => {
    expect(findFloating(createGrid(0))).toEqual([]);
    expect(isCleared(createGrid(0))).toBe(true);
  });
  it('a board with only stones counts as cleared', () => {
    expect(isCleared(build(['#.#'.padEnd(11, '.')]))).toBe(true);
    expect(isCleared(build(['#0.........']))).toBe(false);
  });
});

describe('ceiling drop', () => {
  it('shifts all rows down, flips phase and keeps relative layout', () => {
    const g = build(['01.........', '.1........']);
    const before = bubbleCount(g);
    dropCeiling(g, (len) => new Array<Bubble | null>(len).fill(n(2)));
    expect(g.phase).toBe(1);
    expect(g.rows[0]).toHaveLength(10);
    expect(g.rows).toHaveLength(3);
    expect(getCell(g, 1, 0)).toEqual(n(0));
    expect(getCell(g, 2, 1)).toEqual(n(1));
    expect(bubbleCount(g)).toBe(before + 10);
  });
  it('preserves neighbour relations after a drop (visual positions unchanged relative to each other)', () => {
    const g = build(['0.........0', '.1........']);
    dropCeiling(g, (len) => new Array<Bubble | null>(len).fill(null));
    // old (1,1) is now (2,1); its old upper neighbours (0,1) and (0,2) are now (1,1) and (1,2)
    expect(neighbours(2, 1, g.phase)).toEqual(expect.arrayContaining([{ row: 1, col: 1 }, { row: 1, col: 2 }]));
  });
});
