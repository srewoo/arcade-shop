// Keyboard, swipe and on-screen d-pad input. Emits intent only; the game decides what it means.
import type { MoveDir } from './types';

export interface InputHandlers {
  dir(d: MoveDir): void;
  action(): void;
  pause(): void;
  mute(): void;
  settings(): void;
  /** True while a dialog is open: board keys and taps are ignored so the dialog owns the input. */
  modalOpen(): boolean;
  /** Called on any first gesture so audio can unlock. */
  gesture(): void;
}

const KEY_DIRS: Readonly<Record<string, MoveDir>> = {
  ArrowUp: 'U', ArrowDown: 'D', ArrowLeft: 'L', ArrowRight: 'R',
  w: 'U', W: 'U', s: 'D', S: 'D', a: 'L', A: 'L', d: 'R', D: 'R',
};

export const SWIPE_MIN_PX = 24;

/** Dominant-axis swipe classification; null means "a tap". */
export function swipeDir(dx: number, dy: number, min = SWIPE_MIN_PX): MoveDir | null {
  if (Math.abs(dx) < min && Math.abs(dy) < min) return null;
  if (Math.abs(dx) > Math.abs(dy)) return dx > 0 ? 'R' : 'L';
  return dy > 0 ? 'D' : 'U';
}

/** Enter / Space on a focused control must activate that control, not start the game. */
export function isInteractive(target: EventTarget | null): boolean {
  const el = target as Element | null;
  return !!el && typeof el.closest === 'function' && el.closest('button, input, select, textarea, a, [role="switch"]') !== null;
}

function attachKeys(h: InputHandlers): void {
  window.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    h.gesture();
    const k = e.key;
    if ((k === 'p' || k === 'P' || k === 'Escape') && !e.repeat) {
      h.pause();
      e.preventDefault();
      return;
    }
    if ((k === 'm' || k === 'M') && !e.repeat) {
      h.mute();
      return;
    }
    if ((k === 'o' || k === 'O') && !e.repeat) {
      h.settings();
      return;
    }
    if (h.modalOpen()) return; // arrows, Enter and Space belong to the focused dialog control
    const d = KEY_DIRS[k];
    if (d) {
      h.dir(d);
      e.preventDefault();
    } else if (k === 'Enter' || k === ' ') {
      if (isInteractive(e.target)) return; // native button activation
      if (!e.repeat) h.action();
      e.preventDefault();
    }
  });
}

function attachSwipe(stage: HTMLElement, h: InputHandlers): void {
  let start: { x: number; y: number; id: number } | null = null;
  stage.addEventListener('pointerdown', (e) => {
    if (h.modalOpen() || (e.target as HTMLElement).closest('.dpad, .corner-btn, .title-actions')) return;
    h.gesture();
    start = { x: e.clientX, y: e.clientY, id: e.pointerId };
  });
  stage.addEventListener('pointermove', (e) => {
    if (!start || start.id !== e.pointerId) return;
    const d = swipeDir(e.clientX - start.x, e.clientY - start.y);
    if (d) {
      h.dir(d);
      start = { x: e.clientX, y: e.clientY, id: e.pointerId };
    }
  });
  const end = (e: PointerEvent): void => {
    if (!start || start.id !== e.pointerId) return;
    const moved = swipeDir(e.clientX - start.x, e.clientY - start.y);
    if (!moved) h.action();
    start = null;
  };
  stage.addEventListener('pointerup', end);
  stage.addEventListener('pointercancel', () => {
    start = null;
  });
}

/** Direction of the d-pad button under a screen point, or null. */
function dpadDirAt(x: number, y: number): MoveDir | null {
  const hit = document.elementFromPoint(x, y)?.closest<HTMLElement>('[data-dir]');
  return (hit?.dataset.dir as MoveDir | undefined) ?? null;
}

/** Pressing a d-pad button steers, and sliding the thumb onto another button re-steers (no lifting). */
function attachDpad(h: InputHandlers): void {
  const pad = document.querySelector<HTMLElement>('.dpad');
  let active: number | null = null;
  let last: MoveDir | null = null;
  const steer = (e: PointerEvent): void => {
    const d = dpadDirAt(e.clientX, e.clientY);
    if (d && d !== last) {
      last = d;
      h.dir(d);
    }
  };
  pad?.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    h.gesture();
    active = e.pointerId;
    last = null;
    steer(e);
  });
  pad?.addEventListener('pointermove', (e) => {
    if (active === e.pointerId) steer(e);
  });
  const release = (e: PointerEvent): void => {
    if (active === e.pointerId) active = null;
  };
  pad?.addEventListener('pointerup', release);
  pad?.addEventListener('pointercancel', release);
  document.querySelector('#btn-pause')?.addEventListener('click', () => h.pause());
  document.querySelector('#btn-mute')?.addEventListener('click', () => h.mute());
  document.querySelector('#btn-settings')?.addEventListener('click', () => h.settings());
}

export function attachInput(stage: HTMLElement, h: InputHandlers): void {
  attachKeys(h);
  attachSwipe(stage, h);
  attachDpad(h);
}
