// Ending a run and top-out handling, shared by lock, stash and creation.
import { createBoard } from './board';
import { spawnPiece } from './spawn';
import type { ShapeId } from './shapes';
import type { GameState } from './state';

/** End the run once and emit exactly one `end` event. */
export function finish(s: GameState, status: 'won' | 'over' | 'time'): void {
  if (s.status !== 'playing') return;
  s.status = status;
  s.endSent = true;
  s.events.push({ type: 'end', status });
}

/**
 * A spawn was blocked. Game over in scoring modes; in Zen the terrarium resets
 * itself and `id` (or the next bag piece) is spawned on the empty board.
 */
export function handleTopOut(s: GameState, id?: ShapeId): void {
  if (s.rules.gameOver) {
    finish(s, 'over');
    return;
  }
  s.board = createBoard();
  s.events.push({ type: 'wipe' });
  spawnPiece(s, id ?? s.bag.next());
}
