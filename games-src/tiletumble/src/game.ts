// Pure game session: immutable state in, immutable state out. No DOM, no clock.
import { addColumn, clearGroup, findGroup, hasMoves, isEmpty, makeBoard, type Board, type ClearResult, type Pt } from './board';
import { CONFIG, type ModeId } from './config';
import { generatePuzzle, randomColumn } from './generator';
import { Rng } from './rng';
import { clearBonus, groupPoints } from './scoring';
import { solve } from './solver';

export type EndReason = 'cleared' | 'stuck' | 'target' | 'short' | 'overflow';
interface Snapshot {
  readonly board: Board;
  readonly score: number;
  readonly moves: number;
  readonly rngState: number;
  readonly riseIn: number;
}
export interface GameState extends Snapshot {
  readonly mode: ModeId;
  readonly seed: number;
  readonly colours: number;
  readonly target: number;
  readonly moveLimit: number;
  readonly status: 'playing' | 'finished';
  readonly end: EndReason | null;
  readonly undo: Snapshot | null;
}
export interface Rise {
  readonly x: number;
  readonly colours: readonly number[];
}
export interface PlayResult {
  readonly state: GameState;
  readonly group: readonly Pt[];
  readonly clear: ClearResult;
  readonly points: number;
  readonly bonus: number;
  readonly rises: readonly Rise[];
}

const rounded10 = (n: number): number => Math.max(10, Math.round(n / 10) * 10);

function endlessBoard(seed: number): { board: Board; rngState: number } {
  const cfg = CONFIG.modes.endless;
  const rng = new Rng(seed);
  for (;;) {
    const cols = Array.from({ length: cfg.startCols }, () => randomColumn(rng, cfg.colours, cfg.startRows, cfg.startRows));
    const board = makeBoard(cols, CONFIG.board.cols, CONFIG.board.rows);
    if (hasMoves(board)) return { board, rngState: rng.state };
  }
}

/** Start a game. `seed` fixes the deal (daily passes a date-derived seed). */
export function newGame(mode: ModeId, seed: number): GameState {
  const base = { mode, seed, score: 0, moves: 0, riseIn: 0, target: 0, moveLimit: 0, status: 'playing', end: null, undo: null } as const;
  if (mode === 'endless') {
    const { board, rngState } = endlessBoard(seed);
    return { ...base, board, rngState, colours: CONFIG.modes.endless.colours, riseIn: CONFIG.modes.endless.risePeriod };
  }
  const colours = CONFIG.modes[mode].colours;
  const puzzle = generatePuzzle(seed, colours);
  const state: GameState = { ...base, board: puzzle.board, rngState: 0, colours };
  if (mode !== 'moves') return state;
  const { moveLimit, targetShare } = CONFIG.modes.moves;
  const best = solve(puzzle.board, moveLimit).score;
  return { ...state, moveLimit, target: rounded10(best * targetShare) };
}

export const groupAt = (s: GameState, x: number, y: number): readonly Pt[] => findGroup(s.board, x, y);
export const isWin = (s: GameState): boolean => s.end === 'cleared' || s.end === 'target';
export const movesLeft = (s: GameState): number => (s.moveLimit > 0 ? Math.max(0, s.moveLimit - s.moves) : 0);

function riseColumns(board: Board, rng: Rng, colours: number): { board: Board; rises: Rise[]; overflow: boolean } {
  const cfg = CONFIG.modes.endless;
  const rises: Rise[] = [];
  let b = board;
  do {
    const cols = randomColumn(rng, colours, cfg.riseMin, cfg.riseMax);
    const added = addColumn(b, cols);
    if (!added) return { board: b, rises, overflow: true };
    b = added.board;
    rises.push({ x: added.x, colours: cols });
  } while (!hasMoves(b));
  return { board: b, rises, overflow: false };
}

function finish(s: GameState): GameState {
  if (s.mode === 'moves') {
    const over = isEmpty(s.board) || s.moves >= s.moveLimit || !hasMoves(s.board);
    if (!over) return s;
    return { ...s, status: 'finished', end: isEmpty(s.board) ? 'cleared' : s.score >= s.target ? 'target' : 'short' };
  }
  if (hasMoves(s.board)) return s;
  return { ...s, status: 'finished', end: isEmpty(s.board) ? 'cleared' : 'stuck' };
}

function endlessStep(s: GameState, empty: boolean): { state: GameState; rises: Rise[] } {
  const riseIn = s.riseIn - 1;
  if (riseIn > 0 && !empty && hasMoves(s.board)) return { state: { ...s, riseIn }, rises: [] };
  const rng = new Rng(s.rngState);
  const grown = riseColumns(s.board, rng, s.colours);
  const state = { ...s, board: grown.board, rngState: rng.state, riseIn: CONFIG.modes.endless.risePeriod };
  return grown.overflow
    ? { state: { ...state, status: 'finished', end: 'overflow' }, rises: grown.rises }
    : { state, rises: grown.rises };
}

/** Clear the group at (x, y). Returns null when there is no group or play is over. */
export function play(s: GameState, x: number, y: number): PlayResult | null {
  const group = s.status === 'playing' ? findGroup(s.board, x, y) : [];
  if (group.length === 0) return null;
  const clear = clearGroup(s.board, group);
  const empty = isEmpty(clear.board);
  const points = groupPoints(group.length);
  const bonus = empty ? clearBonus() : 0;
  const undo: Snapshot = { board: s.board, score: s.score, moves: s.moves, rngState: s.rngState, riseIn: s.riseIn };
  const moved: GameState = { ...s, board: clear.board, score: s.score + points + bonus, moves: s.moves + 1, undo };
  if (s.mode !== 'endless') return { state: finish(moved), group, clear, points, bonus, rises: [] };
  const step = endlessStep(moved, empty);
  return { state: step.state, group, clear, points, bonus, rises: step.rises };
}

/** Take back the last move (one level only). */
export function undo(s: GameState): GameState | null {
  if (!s.undo || s.status !== 'playing') return null;
  return { ...s, ...s.undo, undo: null };
}
