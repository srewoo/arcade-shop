// Spawning a piece at the top of the well.
import { collides, WIDTH, type Piece } from './board';
import { shapeSize, type ShapeId } from './shapes';
import type { GameState } from './state';

/** Place a new piece. Returns false when the spawn position is blocked (top-out). */
export function spawnPiece(s: GameState, id: ShapeId): boolean {
  const x = Math.floor((WIDTH - shapeSize(id)) / 2);
  const p: Piece = { id, rot: 0, x, y: 0 };
  s.lockTimer = 0;
  s.moveResets = 0;
  s.gravAcc = 0;
  s.lastRotate = false;
  if (collides(s.board, id, 0, x, 0)) {
    s.piece = p;
    return false;
  }
  s.piece = collides(s.board, id, 0, x, 1) ? p : { ...p, y: 1 };
  s.lowestY = s.piece.y;
  return true;
}
