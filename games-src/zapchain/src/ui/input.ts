// Keyboard, pointer and focus-loss input. Arrow keys / WASD move a cursor, Enter / Space zap.
import type { Game } from '../game';
import { cellAt, type View } from '../render/view';
import { dialogOpen, topDialog } from './dialogs';

const MOVES: Readonly<Record<string, readonly [number, number]>> = {
  ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1],
  KeyA: [-1, 0], KeyD: [1, 0], KeyW: [0, -1], KeyS: [0, 1],
};
const ZAP = new Set(['Enter', 'Space', 'NumpadEnter']);

export interface InputHooks { toggleMute: () => void; resumeFromPause: () => void; closeTop: () => void; getView: () => View }

export function installInput(game: Game, canvas: HTMLElement, hooks: InputHooks): void {
  window.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.code === 'KeyM' && !e.repeat) { hooks.toggleMute(); return; }
    if (dialogOpen()) {
      if (e.key === 'Escape') { e.preventDefault(); hooks.closeTop(); }
      else if (e.code === 'KeyP' && !e.repeat && topDialog()?.el.id === 'pause-overlay') hooks.resumeFromPause();
      return;
    }
    if ((e.code === 'KeyP' || e.key === 'Escape') && !e.repeat) { game.pause(); return; }
    if (game.phase !== 'playing') return;
    const mv = MOVES[e.code];
    if (mv) { e.preventDefault(); game.moveAim(mv[0], mv[1]); return; }
    if (ZAP.has(e.code)) {
      e.preventDefault();
      if (e.repeat) return;
      if (game.aim?.source === 'kbd') game.zapAim();
      else game.moveAim(0, 0);
    }
  });

  const cell = (e: PointerEvent): { col: number; row: number } | null => {
    const r = canvas.getBoundingClientRect();
    return cellAt(hooks.getView(), e.clientX - r.left, e.clientY - r.top);
  };
  canvas.addEventListener('pointermove', (e) => {
    if (dialogOpen() || game.phase === 'title') return;
    const c = cell(e);
    if (c) game.aimAt(c.col, c.row, 'pointer');
    else if (game.aim?.source === 'pointer') game.clearAim();
  });
  canvas.addEventListener('pointerleave', () => { if (game.aim?.source === 'pointer') game.clearAim(); });
  canvas.addEventListener('pointerdown', (e) => {
    if (!e.isPrimary || dialogOpen() || game.phase !== 'playing') return;
    e.preventDefault();
    const c = cell(e);
    if (!c) return;
    game.aimAt(c.col, c.row, 'pointer');
    game.zapAt(c.col, c.row);
    if (e.pointerType !== 'mouse') game.clearAim();
  });
  canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  const autoPause = (): void => { if (game.phase === 'playing' || game.phase === 'ready') game.pause(); };
  document.addEventListener('visibilitychange', () => { if (document.hidden) autoPause(); });
  window.addEventListener('blur', autoPause);
}
