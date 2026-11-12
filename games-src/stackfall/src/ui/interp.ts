// Render interpolation between fixed simulation steps (alpha = accumulator / step).
// The simulation is untouched: this only changes where the active piece is drawn.
import type { Piece } from '../core/board';

export interface PieceSnap extends Piece { placed: number }

const MAX_JUMP = 2; // cells; larger moves (spawn, hard drop, stash) snap instead of sliding

export const snapOf = (p: Piece | null, placed: number): PieceSnap | null => (p ? { ...p, placed } : null);

/** Fractional draw position of the current piece, blended from the previous step. */
export function lerpPiece(prev: PieceSnap | null, cur: Piece, placed: number, alpha: number): { x: number; y: number } {
  const a = Math.min(1, Math.max(0, alpha));
  if (!prev || prev.id !== cur.id || prev.rot !== cur.rot || prev.placed !== placed) return { x: cur.x, y: cur.y };
  if (Math.abs(cur.x - prev.x) > MAX_JUMP || Math.abs(cur.y - prev.y) > MAX_JUMP) return { x: cur.x, y: cur.y };
  return { x: prev.x + (cur.x - prev.x) * a, y: prev.y + (cur.y - prev.y) * a };
}
