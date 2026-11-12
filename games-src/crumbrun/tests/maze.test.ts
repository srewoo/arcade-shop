import { describe, expect, it } from 'vitest';
import { distanceField, validateMaze } from '../src/graph';
import { ITEM_CRUMB, ITEM_PISTOL, ITEM_SUGAR, canMove, neighbor, parseMaze } from '../src/maze';
import { MAZE_DEFS, MAZES } from '../src/mazes';
import { tinyMaze } from './helpers';

describe('maze parsing', () => {
  it('parses glyphs into cells and items', () => {
    const m = tinyMaze();
    expect(m.cols).toBe(11);
    expect(m.rows).toBe(7);
    expect(m.start).toEqual({ col: 1, row: 1 });
    expect(m.door).toEqual({ col: 5, row: 5 });
    expect(m.exit).toEqual({ col: 5, row: 4 });
    expect(m.cheese).toEqual({ col: 9, row: 1 });
    expect(m.tunnelRows).toEqual([4]);
  });

  it('rejects ragged rows and unknown glyphs', () => {
    const base = { name: 'bad', route: [], corners: [] };
    expect(() => parseMaze({ ...base, rows: ['###', '##'] })).toThrow(/length/);
    expect(() => parseMaze({ ...base, rows: ['#?#'] })).toThrow(/unknown glyph/);
  });
});

describe.each(MAZES.map((m, i) => [m.name, m, i] as const))('maze %s', (_name, maze, i) => {
  it('is 21x23 with a basket, door, 4 pistols and a tunnel', () => {
    expect(maze.cols).toBe(21);
    expect(maze.rows).toBe(23);
    expect(maze.basket.length).toBeGreaterThanOrEqual(3);
    expect(maze.pistolCount).toBe(4);
    expect(maze.tunnelRows.length).toBeGreaterThan(0);
  });

  it('passes validation (every crumb reachable, route/corners reachable)', () => {
    expect(validateMaze(maze)).toEqual([]);
  });

  it('can reach every crumb, sugar cube and pistol from the start', () => {
    const field = distanceField(maze, maze.start, 'pip');
    let checked = 0;
    maze.items.forEach((it, idx) => {
      if (it === ITEM_CRUMB || it === ITEM_SUGAR || it === ITEM_PISTOL) {
        checked++;
        expect(field[idx], `item at index ${idx}`).toBeGreaterThanOrEqual(0);
      }
    });
    expect(checked).toBeGreaterThan(150);
  });

  it('wraps through the tunnel on both edges', () => {
    const row = maze.tunnelRows[0] as number;
    expect(canMove(maze, 0, row, 'L', 'pip')).toBe(true);
    expect(neighbor(maze, 0, row, 'L')).toEqual({ col: maze.cols - 1, row });
    expect(neighbor(maze, maze.cols - 1, row, 'R')).toEqual({ col: 0, row });
  });

  it('keeps Pip out of the basket but lets cats home in', () => {
    expect(canMove(maze, maze.exit.col, maze.exit.row, 'D', 'pip')).toBe(false);
    expect(canMove(maze, maze.exit.col, maze.exit.row, 'D', 'cat')).toBe(false);
    expect(canMove(maze, maze.exit.col, maze.exit.row, 'D', 'home')).toBe(true);
    expect(MAZE_DEFS[i]?.rows).toHaveLength(23);
  });
});

it('the three layouts are all different', () => {
  const joined = MAZE_DEFS.map((d) => d.rows.join('/'));
  expect(new Set(joined).size).toBe(3);
});
