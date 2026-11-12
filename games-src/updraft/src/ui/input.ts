// Keyboard, pointer and focus-loss input. Rise is "hold": press on down, release on up.
import type { Game } from '../game';
import { dialogOpen, topDialog } from './dialogs';

const RISE = new Set(['Space', 'ArrowUp', 'KeyW']);

export interface InputHooks { toggleMute: () => void; resumeFromPause: () => void; closeTop: () => void }

export function installInput(game: Game, stage: HTMLElement, hooks: InputHooks): void {
  window.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.code === 'KeyM' && !e.repeat) { hooks.toggleMute(); return; }
    if (dialogOpen()) {
      if (e.key === 'Escape') { e.preventDefault(); hooks.closeTop(); }
      else if (e.code === 'KeyP' && !e.repeat && topDialog()?.el.id === 'pause-overlay') hooks.resumeFromPause();
      return;
    }
    if ((e.code === 'KeyP' || e.key === 'Escape') && !e.repeat) { game.pause(); return; }
    if (RISE.has(e.code)) {
      e.preventDefault();
      if (!e.repeat) game.press();
    }
  });
  window.addEventListener('keyup', (e) => {
    if (!RISE.has(e.code)) return;
    if (!dialogOpen()) e.preventDefault();
    game.release();
  });
  stage.addEventListener('pointerdown', (e) => {
    if (!e.isPrimary || (e.target as HTMLElement).closest('button') || dialogOpen()) return;
    e.preventDefault();
    stage.setPointerCapture(e.pointerId);
    game.press();
  });
  const up = (): void => game.release();
  stage.addEventListener('pointerup', up);
  stage.addEventListener('pointercancel', up);
  stage.addEventListener('lostpointercapture', up);
  stage.addEventListener('contextmenu', (e) => e.preventDefault());
  const autoPause = (): void => { if (game.phase === 'playing') game.pause(); };
  document.addEventListener('visibilitychange', () => { if (document.hidden) autoPause(); });
  window.addEventListener('blur', autoPause);
}
