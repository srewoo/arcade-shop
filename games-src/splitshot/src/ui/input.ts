// Keyboard, touch buttons and focus-loss input. Walk = hold, fire = hold (the line fires again when free).
import type { Game } from '../game';
import { dialogOpen, topDialog } from './dialogs';

const LEFT = new Set(['ArrowLeft', 'KeyA']);
const RIGHT = new Set(['ArrowRight', 'KeyD']);
const FIRE = new Set(['Space', 'ArrowUp', 'KeyW']);

export interface InputHooks { toggleMute: () => void; resumeFromPause: () => void; closeTop: () => void }

type Held = { left: boolean; right: boolean; fire: boolean };

/** Combine keyboard and touch holds into the game's input. */
function sync(game: Game, kb: Held, touch: Held): void {
  game.input.left = kb.left || touch.left;
  game.input.right = kb.right || touch.right;
  game.input.fire = kb.fire || touch.fire;
}

function bindTouch(game: Game, touchHeld: Held, kb: Held): void {
  const map: [string, keyof Held][] = [['t-left', 'left'], ['t-right', 'right'], ['t-fire', 'fire']];
  for (const [id, key] of map) {
    const el = document.getElementById(id);
    if (!el) continue;
    const set = (on: boolean): void => { touchHeld[key] = on; el.classList.toggle('held', on); sync(game, kb, touchHeld); };
    el.addEventListener('pointerdown', (e) => { e.preventDefault(); el.setPointerCapture(e.pointerId); set(true); });
    for (const ev of ['pointerup', 'pointercancel', 'lostpointercapture']) el.addEventListener(ev, () => set(false));
    el.addEventListener('contextmenu', (e) => e.preventDefault());
  }
}

export function installInput(game: Game, stage: HTMLElement, hooks: InputHooks): { clear: () => void } {
  const kb: Held = { left: false, right: false, fire: false };
  const touch: Held = { left: false, right: false, fire: false };
  const clear = (): void => {
    for (const h of [kb, touch]) h.left = h.right = h.fire = false;
    document.querySelectorAll('.tbtn.held').forEach((b) => b.classList.remove('held'));
    game.clearInput();
  };
  const keyOf = (code: string): keyof Held | null => (LEFT.has(code) ? 'left' : RIGHT.has(code) ? 'right' : FIRE.has(code) ? 'fire' : null);
  window.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.code === 'KeyM' && !e.repeat) { hooks.toggleMute(); return; }
    if (dialogOpen()) {
      if (e.key === 'Escape') { e.preventDefault(); hooks.closeTop(); }
      else if (e.code === 'KeyP' && !e.repeat && topDialog()?.el.id === 'pause-overlay') hooks.resumeFromPause();
      return;
    }
    if ((e.code === 'KeyP' || e.key === 'Escape') && !e.repeat) { game.pause(); clear(); return; }
    const k = keyOf(e.code);
    if (!k) return;
    e.preventDefault();
    kb[k] = true;
    sync(game, kb, touch);
  });
  window.addEventListener('keyup', (e) => {
    const k = keyOf(e.code);
    if (!k) return;
    kb[k] = false;
    sync(game, kb, touch);
  });
  bindTouch(game, touch, kb);
  stage.addEventListener('contextmenu', (e) => e.preventDefault());
  const autoPause = (): void => { if (game.phase === 'playing' || game.phase === 'ready') game.pause(); clear(); };
  document.addEventListener('visibilitychange', () => { if (document.hidden) autoPause(); });
  window.addEventListener('blur', autoPause);
  return { clear };
}
