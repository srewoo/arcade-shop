import { parseMaze } from '../src/maze';
import type { Maze } from '../src/maze';

/** 11x7 hand-built maze: ring corridor on rows 1/4, columns 1/9, tunnel on row 4. */
export const TINY_ROWS = [
  '###########',
  '#M.......x#',
  '#.#######.#',
  '#.#######.#',
  ' ......... ',
  '#####-#####',
  '###########',
];

export function tinyMaze(): Maze {
  return parseMaze({
    name: 'tiny',
    rows: TINY_ROWS,
    route: [{ col: 1, row: 1 }, { col: 9, row: 1 }, { col: 9, row: 4 }, { col: 1, row: 4 }],
    corners: [{ col: 1, row: 1 }, { col: 9, row: 1 }, { col: 1, row: 4 }, { col: 9, row: 4 }],
  });
}
