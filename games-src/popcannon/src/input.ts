// Keyboard / mouse / touch input. Translates DOM events into game intents.
import { angleToPoint } from './aim';
import { NEXT_POS } from './render';
import { H, SHOOTER, W } from './hex';
import { Held } from './update';

export interface InputHooks {
  /** True while the playfield should react to input. */
  active(): boolean;
  aim(angle: number): void;
  fire(): void;
  swap(): void;
  pause(): void;
  /** Esc: close the open screen, or pause during play. */
  back(): void;
  mute(): void;
  gesture(): void;
}

function toGame(canvas: HTMLCanvasElement, e: PointerEvent): { x: number; y: number } {
  const r = canvas.getBoundingClientRect();
  return { x: ((e.clientX - r.left) * W) / r.width, y: ((e.clientY - r.top) * H) / r.height };
}

function bindPointer(canvas: HTMLCanvasElement, hooks: InputHooks): void {
  let dragging = false;
  const aimAt = (e: PointerEvent): { x: number; y: number } => {
    const p = toGame(canvas, e);
    hooks.aim(angleToPoint(p.x, p.y));
    return p;
  };
  canvas.addEventListener('pointerdown', (e) => {
    hooks.gesture();
    if (!hooks.active()) return;
    const p = toGame(canvas, e);
    if (Math.hypot(p.x - NEXT_POS.x, p.y - NEXT_POS.y) < 34) {
      hooks.swap();
      return;
    }
    dragging = true;
    canvas.setPointerCapture(e.pointerId);
    aimAt(e);
  });
  canvas.addEventListener('pointermove', (e) => {
    if (dragging) aimAt(e);
  });
  const end = (e: PointerEvent, fire: boolean): void => {
    if (!dragging) return;
    dragging = false;
    const p = aimAt(e);
    // Releasing below the cannon cancels the shot.
    if (fire && p.y < SHOOTER.y - 20) hooks.fire();
  };
  canvas.addEventListener('pointerup', (e) => end(e, true));
  canvas.addEventListener('pointercancel', (e) => end(e, false));
}

function isFormTarget(t: EventTarget | null): boolean {
  return t instanceof HTMLButtonElement || t instanceof HTMLInputElement || t instanceof HTMLSelectElement;
}

function bindKeys(held: Held, hooks: InputHooks): void {
  window.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    hooks.gesture();
    const k = e.key.toLowerCase();
    if (k === 'm') return hooks.mute();
    if (k === 'escape') return hooks.back();
    if (k === 'p') return hooks.pause();
    if (!hooks.active()) return;
    if (k === 'arrowleft' || k === 'a') held.left = true;
    else if (k === 'arrowright' || k === 'd') held.right = true;
    else if (k === 'x') hooks.swap();
    else if ((k === ' ' || k === 'arrowup') && !isFormTarget(e.target)) hooks.fire();
    else return;
    if (!isFormTarget(e.target) || k.startsWith('arrow')) e.preventDefault();
  });
  window.addEventListener('keyup', (e) => {
    const k = e.key.toLowerCase();
    if (k === 'arrowleft' || k === 'a') held.left = false;
    if (k === 'arrowright' || k === 'd') held.right = false;
  });
  window.addEventListener('blur', () => {
    held.left = false;
    held.right = false;
  });
}

function bindHold(btn: HTMLElement, set: (on: boolean) => void): void {
  btn.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    set(true);
  });
  for (const ev of ['pointerup', 'pointerleave', 'pointercancel'] as const) btn.addEventListener(ev, () => set(false));
}

export function bindInput(canvas: HTMLCanvasElement, held: Held, hooks: InputHooks): void {
  bindPointer(canvas, hooks);
  bindKeys(held, hooks);
  const left = document.getElementById('aim-left');
  const right = document.getElementById('aim-right');
  if (left) bindHold(left, (on) => (held.left = on));
  if (right) bindHold(right, (on) => (held.right = on));
}
