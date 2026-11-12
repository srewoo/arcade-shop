// Shared model types. Kinds 1..5 are the disc colours, 6 is the bomb.
export type Kind = 1 | 2 | 3 | 4 | 5 | 6;
export const BOMB: Kind = 6;
export const COLOUR_KINDS = [1, 2, 3, 4, 5] as const;

export type TileState = 'queued' | 'rest' | 'fall' | 'slide';

export interface Tile {
  readonly id: number;
  readonly kind: Kind;
  /** Logical column and row. For a falling tile `row` is the last row it passed. */
  col: number;
  row: number;
  /** Visual position in cells (floats while moving) and the previous step, for interpolation. */
  x: number;
  y: number;
  px: number;
  py: number;
  vy: number;
  state: TileState;
  /** Seconds since the tile spawned (for the pop-in) and since it last landed (squash). */
  age: number;
  squash: number;
  /** Seconds a released tile hovers before it starts to fall (lets the zap read first). */
  hold: number;
  /** Landing impact 0..1 for the squash depth. */
  impact: number;
  /** True for feeder tiles that fall in from the top (rather than ones released by a zap). */
  fresh: boolean;
}

export type Cell = Tile | null;
export type Cells = Cell[][];

export interface CellRef { readonly col: number; readonly row: number }
export interface GroupCell extends CellRef { readonly parent: number; readonly depth: number }

export interface ZapInfo { readonly col: number; readonly row: number; readonly kind: Kind; readonly depth: number; readonly parent: number }

export type OverReason = 'full' | 'time';

export type SimEvent =
  | { t: 'zap'; kind: Kind; n: number; points: number; cells: readonly ZapInfo[] }
  | { t: 'bomb'; col: number; row: number; n: number; points: number; cells: readonly ZapInfo[] }
  | { t: 'invalid'; col: number; row: number }
  | { t: 'spawn'; col: number }
  | { t: 'land'; col: number; row: number; fresh: boolean; speed: number }
  | { t: 'slide' }
  | { t: 'wipe'; bonus: number }
  | { t: 'warn' }
  | { t: 'cleared' }
  | { t: 'over'; reason: OverReason };

export interface LevelParams {
  readonly level: number;
  readonly maxRows: number;
  readonly colours: number;
  readonly seconds: number;
  readonly target: number;
  readonly spawnInterval: number;
  readonly bombs: boolean;
}
