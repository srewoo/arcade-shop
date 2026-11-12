// Keyboard + touch-pad input. Held keys are cleared on pause, blur and when disabled.
import { NO_INPUT, type Input } from './simTypes';

type Key = 'left' | 'right' | 'gas' | 'brake';
const KEY_MAP: Readonly<Record<string, Key>> = {
  ArrowLeft: 'left', a: 'left', A: 'left',
  ArrowRight: 'right', d: 'right', D: 'right',
  ArrowUp: 'gas', w: 'gas', W: 'gas',
  ArrowDown: 'brake', s: 'brake', S: 'brake',
};

export interface InputSource { get(): Input; clear(): void; setEnabled(on: boolean): void; press(key: Key, down: boolean): void }

type Held = Set<Key>;

function bindKeyboard(held: Held, isEnabled: () => boolean): void {
  window.addEventListener('keydown', (e) => {
    const k = KEY_MAP[e.key];
    if (!k || !isEnabled() || e.ctrlKey || e.metaKey || e.altKey) return;
    e.preventDefault();
    held.add(k);
  });
  window.addEventListener('keyup', (e) => {
    const k = KEY_MAP[e.key];
    if (k) held.delete(k);
  });
}

function bindPad(b: HTMLButtonElement, held: Held): void {
  const k = b.dataset.key as Key;
  b.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    try {
      b.setPointerCapture(e.pointerId);
    } catch {
      /* synthetic pointer: no capture needed */
    }
    held.add(k);
    b.dataset.down = '1';
  });
  const up = (): void => {
    held.delete(k);
    delete b.dataset.down;
  };
  b.addEventListener('pointerup', up);
  b.addEventListener('pointercancel', up);
  b.addEventListener('lostpointercapture', up);
  b.addEventListener('contextmenu', (e) => e.preventDefault());
}

export function createInput(touchRoot: HTMLElement | null): InputSource {
  const held: Held = new Set();
  let enabled = false;
  bindKeyboard(held, () => enabled);
  touchRoot?.querySelectorAll<HTMLButtonElement>('.tbtn').forEach((b) => bindPad(b, held));

  const get = (): Input =>
    enabled
      ? { steer: held.has('left') === held.has('right') ? 0 : held.has('right') ? 1 : -1, gas: held.has('gas'), brake: held.has('brake') }
      : NO_INPUT;
  const clear = (): void => {
    held.clear();
    touchRoot?.querySelectorAll<HTMLElement>('.tbtn').forEach((b) => delete b.dataset.down);
  };
  return {
    get,
    clear,
    press: (k, down) => void (down ? held.add(k) : held.delete(k)),
    setEnabled: (on) => {
      enabled = on;
      if (!on) clear();
    },
  };
}
