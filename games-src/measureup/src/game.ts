// Immutable game state for one level: undo history, hints, solved flag.
import { applyMove, isGoal, type Amounts, type LevelDef, type Move } from './jugs';
import { hintFor } from './solver';

export interface GameState {
  readonly level: LevelDef;
  readonly amounts: Amounts;
  /** Earlier positions (oldest first); its length is the move count. */
  readonly history: readonly Amounts[];
  readonly hintsUsed: number;
  readonly solved: boolean;
}

export const newGame = (level: LevelDef): GameState => ({
  level,
  amounts: level.start,
  history: [],
  hintsUsed: 0,
  solved: false,
});

export const moveCount = (g: GameState): number => g.history.length;

/** Apply a move; returns the same state when it is illegal or the level is done. */
export function play(g: GameState, move: Move): GameState {
  if (g.solved) return g;
  const next = applyMove(g.level.jugs, g.amounts, move);
  if (!next) return g;
  return { ...g, amounts: next, history: [...g.history, g.amounts], solved: isGoal(next, g.level.goal) };
}

export function undo(g: GameState): GameState {
  const prev = g.history.at(-1);
  if (!prev || g.solved) return g;
  return { ...g, amounts: prev, history: g.history.slice(0, -1) };
}

export const restart = (g: GameState): GameState => newGame(g.level);

/** Ask for the best next move; counts as a hint used. */
export function useHint(g: GameState): { state: GameState; move: Move | null } {
  if (g.solved) return { state: g, move: null };
  const move = hintFor(g.level.jugs, g.amounts, g.level.goal);
  return { state: move ? { ...g, hintsUsed: g.hintsUsed + 1 } : g, move };
}
