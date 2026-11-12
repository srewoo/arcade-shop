// Pure rules for Tic-Tac-Toe. No DOM, no randomness: safe to unit test and to
// search with the AI. Every function returns a new state; nothing is mutated.

import { CONFIG } from './config';

export type Player = 'X' | 'O';
export type Cell = Player | null;
export type Variant = 'classic' | 'vanishing';

export interface GameState {
  readonly board: readonly Cell[];
  readonly turn: Player;
  readonly variant: Variant;
  /** Cell indices each player owns, oldest first (used by the vanishing variant). */
  readonly marks: Readonly<Record<Player, readonly number[]>>;
  readonly winner: Player | null;
  readonly line: readonly number[] | null;
  readonly draw: boolean;
  readonly moves: number;
}

export const SIZE = 3;
export const CELLS = SIZE * SIZE;
/** In the vanishing variant a player keeps at most this many marks. */
export const VANISH_LIMIT = CONFIG.rules.vanishLimit;
/** Vanishing games can cycle forever; call it a draw after this many moves. */
export const VANISH_MOVE_CAP = CONFIG.rules.vanishMoveCap;

export const LINES: readonly (readonly number[])[] = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
];

export const other = (p: Player): Player => (p === 'X' ? 'O' : 'X');

export function newGame(variant: Variant, first: Player = 'X'): GameState {
  return {
    board: Array<Cell>(CELLS).fill(null),
    turn: first,
    variant,
    marks: { X: [], O: [] },
    winner: null,
    line: null,
    draw: false,
    moves: 0,
  };
}

export function findWin(board: readonly Cell[]): { winner: Player; line: readonly number[] } | null {
  for (const line of LINES) {
    const [a, b, c] = line as [number, number, number];
    const v = board[a];
    if (v && v === board[b] && v === board[c]) return { winner: v, line };
  }
  return null;
}

export const isOver = (s: GameState): boolean => s.winner !== null || s.draw;

export function legalMoves(s: GameState): number[] {
  if (isOver(s)) return [];
  const out: number[] = [];
  s.board.forEach((c, i) => {
    if (c === null) out.push(i);
  });
  return out;
}

/** The cell that will disappear when `player` next moves, if any (vanishing only). */
export function nextToVanish(s: GameState, player: Player): number | null {
  if (s.variant !== 'vanishing') return null;
  const own = s.marks[player];
  return own.length >= VANISH_LIMIT ? (own[0] ?? null) : null;
}

/** Cell of the most recent mark, or null before the first move. */
export function lastMove(s: GameState): number | null {
  if (s.moves === 0) return null;
  return s.marks[other(s.turn)].at(-1) ?? null;
}

export function play(s: GameState, index: number): GameState {
  if (!Number.isInteger(index) || index < 0 || index >= CELLS) throw new RangeError(`bad cell ${index}`);
  if (isOver(s)) throw new Error('game is over');
  if (s.board[index] !== null) throw new Error(`cell ${index} is taken`);

  const board = [...s.board];
  let own = [...s.marks[s.turn]];
  const vanish = nextToVanish(s, s.turn);
  if (vanish !== null) {
    board[vanish] = null;
    own = own.slice(1);
  }
  board[index] = s.turn;
  own.push(index);

  const moves = s.moves + 1;
  const win = findWin(board);
  const full = board.every((c) => c !== null);
  const draw = !win && (s.variant === 'classic' ? full : moves >= VANISH_MOVE_CAP);

  return {
    board,
    turn: other(s.turn),
    variant: s.variant,
    marks: { ...s.marks, [s.turn]: own },
    winner: win?.winner ?? null,
    line: win?.line ?? null,
    draw,
    moves,
  };
}
