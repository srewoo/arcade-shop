import { describe, expect, it } from 'vitest';
import {
  COLS, R, ROW_H, TOP_Y, cellCenter, createGrid, hitsBubble, inBounds, neighbours, nearestFreeCell, rowLen, setCell,
} from '../src/hex';

const key = (p: { row: number; col: number }): string => `${p.row},${p.col}`;
const sorted = (ps: { row: number; col: number }[]): string[] => ps.map(key).sort();
const stone = { kind: 'normal', color: 0 } as const;

describe('hex neighbours', () => {
  it('even (unshifted) row uses cols c-1 and c on adjacent rows', () => {
    expect(sorted(neighbours(2, 3, 0))).toEqual(['1,2', '1,3', '2,2', '2,4', '3,2', '3,3']);
  });
  it('odd (shifted) row uses cols c and c+1 on adjacent rows', () => {
    expect(sorted(neighbours(3, 3, 0))).toEqual(['2,3', '2,4', '3,2', '3,4', '4,3', '4,4']);
  });
  it('clips to the playfield at edges and the ceiling', () => {
    expect(sorted(neighbours(0, 0, 0))).toEqual(['0,1', '1,0']);
    expect(sorted(neighbours(1, rowLen(1, 0) - 1, 0))).toEqual(['0,10', '0,9', '1,8', '2,10', '2,9'].sort());
  });
  it('is symmetric', () => {
    for (const phase of [0, 1] as const) {
      for (let row = 0; row < 4; row++) {
        for (let col = 0; col < rowLen(row, phase); col++) {
          for (const n of neighbours(row, col, phase)) {
            expect(sorted(neighbours(n.row, n.col, phase))).toContain(key({ row, col }));
          }
        }
      }
    }
  });
  it('phase flips which rows are offset and their length', () => {
    expect(rowLen(0, 0)).toBe(COLS);
    expect(rowLen(0, 1)).toBe(COLS - 1);
    expect(inBounds(0, COLS - 1, 1)).toBe(false);
  });
});

describe('cell geometry and snapping', () => {
  it('offset rows sit half a bubble to the right', () => {
    expect(cellCenter(1, 0, 0).x - cellCenter(0, 0, 0).x).toBe(R);
    expect(cellCenter(1, 0, 0).y - cellCenter(0, 0, 0).y).toBeCloseTo(ROW_H);
  });
  it('snaps to the nearest free cell under the ball', () => {
    const grid = createGrid(0);
    const c = cellCenter(2, 4, 0);
    expect(nearestFreeCell(grid, c.x + 3, c.y - 2)).toEqual({ row: 2, col: 4 });
  });
  it('skips occupied cells', () => {
    const grid = createGrid(0);
    setCell(grid, 2, 4, stone);
    const c = cellCenter(2, 4, 0);
    const got = nearestFreeCell(grid, c.x, c.y);
    expect(got).not.toBeNull();
    expect(got).not.toEqual({ row: 2, col: 4 });
    expect(neighbours(2, 4, 0).map(key)).toContain(key(got as { row: number; col: number }));
  });
  it('snaps to row 0 when hitting the ceiling', () => {
    const grid = createGrid(0);
    expect(nearestFreeCell(grid, 100, TOP_Y + R)?.row).toBe(0);
  });
  it('collides with ceiling and bubbles only', () => {
    const grid = createGrid(0);
    expect(hitsBubble(grid, 100, 300)).toBe(false);
    expect(hitsBubble(grid, 100, TOP_Y + R)).toBe(true);
    setCell(grid, 3, 3, stone);
    const c = cellCenter(3, 3, 0);
    expect(hitsBubble(grid, c.x, c.y + R * 1.5)).toBe(true);
    expect(hitsBubble(grid, c.x, c.y + R * 2.5)).toBe(false);
  });
});
