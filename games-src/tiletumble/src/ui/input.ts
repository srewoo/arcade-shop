// Board input: mouse hover/click, touch tap and keyboard cursor.
import type { Board, Pt } from '../board';
import type { BoardView } from './boardView';

export interface BoardInputHandlers {
  readonly board: () => Board | null;
  readonly enabled: () => boolean;
  readonly onHover: (p: Pt | null) => void;
  readonly onPick: (p: Pt) => void;
  readonly onCursor: (p: Pt | null) => void;
}

/** Move the keyboard cursor between existing discs (any other key just re-clamps it). */
export function stepCursor(board: Board, from: Pt | null, key: string): Pt | null {
  const filled = board.cols.map((c, x) => ({ x, n: c.length })).filter((c) => c.n > 0);
  const first = filled[0];
  if (!first) return null;
  if (!from) return { x: first.x, y: 0 };
  const near = filled.reduce((a, c) => (Math.abs(c.x - from.x) < Math.abs(a.x - from.x) ? c : a), first);
  const idx = filled.indexOf(near);
  const y = key === 'ArrowUp' ? from.y + 1 : key === 'ArrowDown' ? from.y - 1 : from.y;
  const target = key === 'ArrowRight' ? filled[idx + 1] : key === 'ArrowLeft' ? filled[idx - 1] : near;
  const col = target ?? near;
  return { x: col.x, y: Math.max(0, Math.min(col.n - 1, y)) };
}

export function attachBoardInput(canvas: HTMLCanvasElement, view: BoardView, h: BoardInputHandlers): void {
  let cursor: Pt | null = null;
  canvas.addEventListener('pointermove', (e) => {
    if (!h.enabled() || e.pointerType === 'touch') return;
    cursor = null;
    h.onCursor(null);
    h.onHover(view.cellFromPoint(e.clientX, e.clientY));
  });
  canvas.addEventListener('pointerleave', () => h.onHover(null));
  canvas.addEventListener('click', (e) => {
    if (!h.enabled()) return;
    const p = view.cellFromPoint(e.clientX, e.clientY);
    if (!p) return;
    h.onPick(p);
    if (e instanceof PointerEvent && e.pointerType === 'touch') return;
    h.onHover(p);
  });
  canvas.addEventListener('focus', () => {
    const board = h.board();
    if (!board || !h.enabled() || !canvas.matches(':focus-visible')) return;
    cursor = cursor ?? stepCursor(board, null, '');
    h.onCursor(cursor);
    if (cursor) h.onHover(cursor);
  });
  canvas.addEventListener('blur', () => {
    h.onCursor(null);
    h.onHover(null);
  });
  canvas.addEventListener('keydown', (e) => {
    const board = h.board();
    if (!board || !h.enabled()) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (!cursor) return;
      h.onPick(cursor);
      cursor = stepCursor(h.board() ?? board, cursor, '');
      h.onCursor(cursor);
      h.onHover(cursor);
      return;
    }
    if (!e.key.startsWith('Arrow')) return;
    e.preventDefault();
    cursor = stepCursor(board, cursor, e.key);
    h.onCursor(cursor);
    h.onHover(cursor);
  });
}
