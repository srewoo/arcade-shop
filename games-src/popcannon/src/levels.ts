// Twelve hand-made puzzle layouts. Grid chars: R G B Y P O = colours,
// '#' = stone, '.' = empty. Even rows hold 11 cells, odd rows 10.
// Queue chars: colours plus '!' = bomb and '?' = rainbow. The queue length is
// the shot limit. `par` is the shot count that earns three stars: solver best + 1 or 2
// (see scripts/solve-puzzles.ts and tests/puzzles.test.ts), and the queue is about par x 1.6.
import { TUNING } from './config';
import { Bubble, Grid, createGrid, rowLen, setCell } from './hex';

export interface PuzzleDef {
  readonly name: string;
  readonly rows: readonly string[];
  readonly queue: string;
  readonly par: number;
}

export const COLOR_LETTERS = 'RGBYPO';

export const PUZZLES: readonly PuzzleDef[] = [
  { name: 'First Steps', par: 4, queue: 'RGBRGBG',
    rows: ['RRRRGGGGBBB', 'RRRGGGGBBB', '.RRGGGBBB..', '..RGGGBB..'] },
  { name: 'Pairs', par: 9, queue: 'RGBYRGBYGRYBRGB',
    rows: ['RRGGBBYYRRG', 'RGGBBYYRRG', 'GBBYYRRGGB.', '.BYYRRGGB.', '..YRRGG....'] },
  { name: 'Stone Age', par: 5, queue: 'RGBY!RGB',
    rows: ['RRRGGGBBBYY', 'RRGGGBBBYY', 'R#GG#BB#YY.', '..GGBBYY..', '...GBBY....'] },
  { name: 'Ladder', par: 15, queue: 'RGBYRGBYRGBY!RGBYGBRGY',
    rows: ['RGRGRGRGRGR', 'GRGRGRGRGR', 'BBYYBBYYBBY', 'BYYBBYYBBY', '..RRGG.YY..'] },
  { name: 'Five Colours', par: 7, queue: 'PRGBYPRGBY?P',
    rows: ['PPRRGGBBYYP', 'PRRGGBBYYP', 'RRGGBBYYPP.', 'RGGBBYYPP.', 'GGBB#YYP...', '..BBYYP...'] },
  { name: 'Pillars', par: 15, queue: 'RGBY!RBGYRBGY?RGBYRGBY!R',
    rows: ['RGBYRGBYRGB', 'RGBYRGBYRG', 'R#B#R#B#R#B', 'RGBYRGBYRG', '..B.R.B.R..'] },
  { name: 'Funnel', par: 15, queue: 'RGBYRGBYRGBYRGBY!?RGBYRG',
    rows: ['RGBYRGBYRGB', 'GBYRGBYRGB', '.YRGBYRGB..', '..RGBYRG..', '...GBYR....', '....BY....', '.....Y.....'] },
  { name: 'Stone Wall', par: 6, queue: 'RGYB!RGYBR',
    rows: ['RRRGGGBBBYY', 'RRGGGBBBYY', '##RRYYGG###', '..RRYYGG..', '...RYYG....'] },
  { name: 'Rainbow Road', par: 18, queue: 'RGBYPRGBYP?RGBYPRGBYP?RGBYPRG',
    rows: ['RGBYPRGBYPR', 'GBYPRGBYPR', 'BYPRGBYPRG.', '.YPRGBYPR.', '..PRGBYP...', '...RGBY...'] },
  { name: 'Bomb Squad', par: 5, queue: '!!RGBY!R',
    rows: ['RRRRRGGGGGG', 'RRRRRGGGGG', 'BBBBBYYYYYY', 'BBBBBYYYYY', 'RRR#GGG#BBB', '..RGGGB...'] },
  { name: 'Brickwork', par: 13, queue: 'RGBYPRGBYP??RGBYPRGBY',
    rows: ['RRGGBBYYPPR', 'RGGBBYYPPR', 'GGBBYYPPRRG', 'GBBYYPPRRG', 'BBYYPPRRGGB', '#R#G#B#Y#P', '....B.G....'] },
  { name: 'Finale', par: 29, queue: 'RGBYPORGBYPO??RGBYPORGBYPO!!RGBYPORGBYPO!?RGBYP',
    rows: ['RGBYPORGBYP', 'GBYPORGBYP', 'B#Y#O#G#Y#P', 'RGBYPORGBY', 'O#Y#R#G#B#P', 'GBYPORGBYP', '..BYPORG...', '...YPOR...'] },
];

export interface ParsedLevel {
  readonly grid: Grid;
  readonly queue: Bubble[];
  readonly limit: number;
  readonly colors: number[];
  readonly par: number;
}

function parseBubble(ch: string, allowSpecial: boolean): Bubble {
  const idx = COLOR_LETTERS.indexOf(ch);
  if (idx >= 0) return { kind: 'normal', color: idx };
  if (allowSpecial && ch === '!') return { kind: 'bomb', color: -1 };
  if (allowSpecial && ch === '?') return { kind: 'rainbow', color: -1 };
  throw new Error(`bad bubble char "${ch}"`);
}

/** Parse a layout; throws a descriptive Error when it is malformed. */
export function parseLevel(def: PuzzleDef): ParsedLevel {
  const grid = createGrid(0);
  const colors = new Set<number>();
  def.rows.forEach((line, row) => {
    if (line.length !== rowLen(row, 0)) throw new Error(`${def.name}: row ${row} needs ${rowLen(row, 0)} chars`);
    [...line].forEach((ch, col) => {
      if (ch === '.') return;
      const b: Bubble = ch === '#' ? { kind: 'stone', color: -1 } : parseBubble(ch, false);
      if (b.kind === 'normal') colors.add(b.color);
      setCell(grid, row, col, b);
    });
  });
  const queue = [...def.queue].map((ch) => parseBubble(ch, true));
  return { grid, queue, limit: queue.length, colors: [...colors].sort(), par: def.par };
}

/** Highest shot count that still earns two stars: par plus a quarter of the slack up to the limit. */
export const twoStarShots = (limit: number, par: number): number => par + Math.ceil((limit - par) * TUNING.puzzle.twoStarSlack);

/** 1 star for a clear, 2 within the slack band, 3 at par or better. */
export function starsFor(shotsUsed: number, limit: number, par: number): 1 | 2 | 3 {
  if (shotsUsed <= par) return 3;
  return shotsUsed <= twoStarShots(limit, par) ? 2 : 1;
}
