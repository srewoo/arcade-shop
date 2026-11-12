// Piece actions: spawn, move, rotate, stash, drops.
import { collides } from './board';
import { rotateWithKicks } from './kicks';
import { hardDropPoints } from './scoring';
import { handleTopOut } from './end';
import { spawnPiece } from './spawn';
import type { GameState } from './state';

/** Spawn the next bag piece; false when blocked. */
export const spawnPieceChecked = (s: GameState): boolean => spawnPiece(s, s.bag.next());

export const isGrounded = (s: GameState): boolean =>
  s.piece !== null && collides(s.board, s.piece.id, s.piece.rot, s.piece.x, s.piece.y + 1);

/** A successful shift/rotate while grounded restarts lock delay, up to the reset limit. */
function onManipulate(s: GameState): void {
  if (isGrounded(s) && s.moveResets < s.cfg.moveResetLimit) {
    s.lockTimer = 0;
    s.moveResets++;
  }
}

export function tryMove(s: GameState, dx: number, dy: number): boolean {
  const p = s.piece;
  if (!p || collides(s.board, p.id, p.rot, p.x + dx, p.y + dy)) return false;
  p.x += dx;
  p.y += dy;
  s.lastRotate = false;
  if (dy > 0) {
    if (p.y > s.lowestY) {
      s.lowestY = p.y;
      s.moveResets = 0;
      s.lockTimer = 0;
    }
  } else {
    onManipulate(s);
    s.events.push({ type: 'move' });
  }
  return true;
}

export function tryRotate(s: GameState, dir: 1 | -1): boolean {
  if (!s.piece) return false;
  const r = rotateWithKicks(s.board, s.piece, dir);
  if (!r) {
    s.events.push({ type: 'deny', what: 'rotate' });
    return false;
  }
  s.piece = r.piece;
  s.lastRotate = true;
  if (r.piece.y > s.lowestY) {
    s.lowestY = r.piece.y;
    s.moveResets = 0;
    s.lockTimer = 0;
  }
  onManipulate(s);
  s.events.push({ type: 'rotate' });
  return true;
}

export function ghostY(s: GameState): number {
  const p = s.piece;
  if (!p) return 0;
  let y = p.y;
  while (!collides(s.board, p.id, p.rot, p.x, y + 1)) y++;
  return y;
}

/** Drop to the floor; returns rows travelled and awards 2 points per row. */
export function hardDrop(s: GameState): number {
  const p = s.piece;
  if (!p) return 0;
  const rows = ghostY(s) - p.y;
  if (rows > 0) s.lastRotate = false;
  p.y += rows;
  s.score += hardDropPoints(rows);
  s.events.push({ type: 'hardDrop', rows });
  return rows;
}

/** Swap the active piece with the stash (once per drop). */
export function doStash(s: GameState): boolean {
  const p = s.piece;
  if (!p) return false;
  if (!s.canStash) {
    s.events.push({ type: 'deny', what: 'stash' });
    return false;
  }
  const held = s.stash;
  s.stash = p.id;
  s.canStash = false;
  s.events.push({ type: 'stash', id: p.id });
  const next = held ?? s.bag.next();
  if (!spawnPiece(s, next)) handleTopOut(s, next);
  return true;
}
