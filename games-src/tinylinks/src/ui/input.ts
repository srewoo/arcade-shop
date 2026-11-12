// Pointer (drag-back) and keyboard aiming. Only reads/writes game.aim and calls game.shoot().
import { aimFromDrag, nudgeAngle, nudgePower } from '../game/aim';
import type { Game } from '../game/game';
import { vecToWorld, type View } from '../render/view';
import { dialogOpen } from './dialogs';

export interface InputHooks {
  view: () => View;
  toggleMute: () => void;
  openCard: () => void;
  pauseOrBack: () => void;
  onDrag: (active: boolean) => void;
}

const isTyping = (t: EventTarget | null): boolean => t instanceof HTMLElement && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA');

export function installInput(game: Game, stage: HTMLElement, h: InputHooks): void {
  let drag: { id: number; sx: number; sy: number; valid: boolean } | null = null;
  const end = (): void => { drag = null; stage.classList.remove('dragging'); h.onDrag(false); };

  stage.addEventListener('pointerdown', (e) => {
    if (e.button !== 0 || !game.canShoot || dialogOpen()) return;
    if ((e.target as HTMLElement).closest('button, .dock, .hintbox')) return;
    drag = { id: e.pointerId, sx: e.clientX, sy: e.clientY, valid: false };
    stage.setPointerCapture(e.pointerId);
    stage.classList.add('dragging');
    h.onDrag(true);
  });
  stage.addEventListener('pointermove', (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    const dx = e.clientX - drag.sx;
    const dy = e.clientY - drag.sy;
    const w = vecToWorld(h.view(), dx, dy);
    const aim = aimFromDrag(w.x, w.y, Math.hypot(dx, dy));
    drag.valid = aim !== null;
    if (aim) game.aim = aim;
  });
  stage.addEventListener('pointerup', (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    const fire = drag.valid;
    end();
    if (fire) game.shoot();
  });
  stage.addEventListener('pointercancel', end);
  stage.addEventListener('contextmenu', (e) => { if (drag) { e.preventDefault(); end(); } });

  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey || isTyping(e.target)) return;
    const k = e.key.toLowerCase();
    if (k === 'm') { h.toggleMute(); return; }
    if (k === 'escape' || k === 'p') {
      if (drag) { end(); e.preventDefault(); return; }
      h.pauseOrBack();
      return;
    }
    if (dialogOpen() || !game.canShoot) return;
    if (k === 'c' && game.match) { h.openCard(); return; }
    if (aimKey(game, k, e.shiftKey)) { e.preventDefault(); return; }
    const onButton = (e.target as HTMLElement).closest?.('button');
    if ((k === ' ' || k === 'enter') && !onButton) { e.preventDefault(); game.shoot(); }
  });
}

/** Apply a keyboard aim adjustment; returns true when the key was one. */
function aimKey(game: Game, k: string, fine: boolean): boolean {
  const left = k === 'arrowleft' || k === 'a';
  const right = k === 'arrowright' || k === 'd';
  const up = k === 'arrowup' || k === 'w';
  const down = k === 'arrowdown' || k === 's';
  if (left || right) game.aim = nudgeAngle(game.aim, left ? -1 : 1, fine);
  else if (up || down) game.aim = nudgePower(game.aim, up ? 1 : -1, fine);
  return left || right || up || down;
}
