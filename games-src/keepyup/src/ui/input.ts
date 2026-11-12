// Pointer taps hit the ball under the cursor; the keyboard drives an aim reticle (arrows move,
// Space kicks, X snaps it under the lowest ball). Focus loss pauses.
import type { Game } from '../game';
import { dialogOpen, topDialog } from './dialogs';

const DIRS: Readonly<Record<string, readonly [number, number]>> = {
  ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1],
};
const KICK = new Set(['Space', 'Enter']);

export interface InputHooks {
  toggleMute: () => void; resumeFromPause: () => void; closeTop: () => void;
  toWorld: (clientX: number, clientY: number) => { x: number; y: number };
}

export const heldAxis = (held: ReadonlySet<string>, neg: string, pos: string): number =>
  (held.has(pos) ? 1 : 0) - (held.has(neg) ? 1 : 0);

export function installInput(game: Game, stage: HTMLElement, hooks: InputHooks): void {
  const held = new Set<string>();
  const syncAim = (): void => {
    game.aim.dx = heldAxis(held, 'ArrowLeft', 'ArrowRight');
    game.aim.dy = heldAxis(held, 'ArrowUp', 'ArrowDown');
  };
  window.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.code === 'KeyM' && !e.repeat) { hooks.toggleMute(); return; }
    if (dialogOpen()) {
      if (e.key === 'Escape') { e.preventDefault(); hooks.closeTop(); }
      else if (e.code === 'KeyP' && !e.repeat && topDialog()?.el.id === 'pause-overlay') hooks.resumeFromPause();
      return;
    }
    if ((e.code === 'KeyP' || e.key === 'Escape') && !e.repeat) { game.pause(); return; }
    if (e.code in DIRS) { e.preventDefault(); held.add(e.code); game.aim.visible = true; syncAim(); return; }
    if (e.code === 'KeyX' && !e.repeat) { game.snapAim(); return; }
    if (KICK.has(e.code)) { e.preventDefault(); if (!e.repeat) game.kickAtAim(); }
  });
  window.addEventListener('keyup', (e) => { if (held.delete(e.code)) syncAim(); });
  const clear = (): void => { held.clear(); syncAim(); };
  stage.addEventListener('pointermove', (e) => {
    if (dialogOpen()) return;
    const p = hooks.toWorld(e.clientX, e.clientY);
    game.aim.x = p.x; game.aim.y = p.y;
    if (e.pointerType === 'mouse') game.aim.visible = false;
  });
  stage.addEventListener('pointerdown', (e) => {
    if (!e.isPrimary || (e.target as HTMLElement).closest('button') || dialogOpen()) return;
    e.preventDefault();
    const p = hooks.toWorld(e.clientX, e.clientY);
    game.aim.x = p.x; game.aim.y = p.y; game.aim.visible = false;
    game.strike(p.x, p.y);
  });
  stage.addEventListener('contextmenu', (e) => e.preventDefault());
  const autoPause = (): void => { clear(); if (game.phase === 'playing') game.pause(); };
  document.addEventListener('visibilitychange', () => { if (document.hidden) autoPause(); });
  window.addEventListener('blur', autoPause);
}
