// Campaign levels as compact rows: name, jug capacities, starting water,
// goal amount, and how many jugs must hold it. Par is never stored: it is the
// BFS optimum, computed once at load. An unsolvable row fails loudly.
import { validateShape, type LevelDef } from './jugs';
import { solve } from './solver';

type Row = readonly [name: string, jugs: number[], start: number[], amount: number, count: number];

const ROWS: readonly Row[] = [
  ['First Drip', [3, 5], [0, 0], 3, 1],
  ['Odd Pair', [6, 7], [0, 0], 1, 1],
  ['Narrow Neck', [3, 8], [0, 0], 2, 1],
  ['Short Measure', [5, 11], [0, 0], 4, 1],
  ['Slow Trickle', [11, 12], [0, 0], 9, 1],
  ['A Single Pinch', [7, 10], [0, 0], 1, 1],
  ['Long Haul', [5, 12], [0, 0], 8, 1],
  ['Back and Forth', [9, 10], [0, 0], 3, 1],
  ['Three Wells Deep', [4, 8, 14], [0, 0, 0], 2, 1],
  ['Little Helper', [2, 5, 12], [0, 0, 0], 9, 1],
  ['Close Neighbours', [12, 13, 14], [0, 0, 0], 3, 1],
  ['Big Gulp', [3, 5, 14], [0, 0, 0], 13, 1],
  ['Steady Hand', [3, 8, 14], [0, 0, 0], 10, 1],
  ['Middle Ground', [9, 13, 14], [0, 0, 0], 7, 1],
  ['Careful Count', [3, 6, 14], [0, 0, 0], 7, 1],
  ['Halves, Eight Ways', [8, 5, 3], [8, 0, 0], 4, 2],
  ['Ten Into Two', [10, 7, 3], [10, 0, 0], 5, 2],
  ['Fair Dozen', [12, 8, 5], [12, 0, 0], 6, 2],
  ['Sixteen Split', [19, 13, 7], [16, 0, 0], 8, 2],
  ['Leftovers', [19, 13, 7], [0, 7, 5], 6, 2],
  ['Eighteen Split', [19, 13, 7], [18, 0, 0], 9, 2],
  ['Four Corners', [5, 7, 9, 18], [0, 0, 0, 0], 15, 1],
  ['Tiny Teaspoon', [2, 4, 11, 18], [0, 0, 0, 0], 17, 1],
  ['Cave Quartet', [3, 7, 14, 17], [0, 0, 0, 0], 15, 1],
  ['Echo Chamber', [8, 9, 10, 18], [0, 0, 0, 0], 13, 1],
  ['Deep Breath', [6, 13, 14, 20], [0, 0, 0, 0], 17, 1],
  ['Stalactite Sum', [5, 9, 14, 19], [0, 0, 0, 0], 12, 1],
  ['Four-Jug Halves', [3, 11, 13, 16], [0, 0, 0, 8], 4, 2],
  ['Sixteen, Four Ways', [15, 16, 17, 18], [0, 0, 0, 16], 8, 2],
  ['Fourteen Fair', [6, 9, 11, 14], [0, 0, 0, 14], 7, 2],
  ['Even Shares', [5, 16, 18, 19], [0, 0, 0, 8], 4, 2],
  ['Ten Equal', [10, 12, 13, 19], [0, 0, 0, 10], 5, 2],
  ['Full Tank, Small Cup', [5, 11, 16, 17], [0, 0, 0, 17], 9, 1],
  ['Reservoir Riddle', [3, 11, 14, 17], [0, 0, 0, 17], 4, 1],
  ['Last Light', [6, 12, 13, 19], [0, 0, 0, 19], 4, 1],
];

function build(row: Row, index: number): LevelDef {
  const [name, jugs, start, amount, count] = row;
  const goal = { amount, count };
  const bad = validateShape(jugs, start, goal);
  if (bad) throw new Error(`level ${index + 1} (${name}): ${bad}`);
  const path = solve(jugs, start, goal);
  if (!path) throw new Error(`level ${index + 1} (${name}) is unsolvable`);
  return { id: index + 1, name, jugs, start, goal, par: path.length };
}

export const LEVELS: readonly LevelDef[] = ROWS.map(build);
export const levelById = (id: number): LevelDef | undefined => LEVELS.find((l) => l.id === id);
