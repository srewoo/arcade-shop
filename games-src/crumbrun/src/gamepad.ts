// Gamepad support (standard mapping): d-pad or left stick steers, A starts/continues, Start pauses.
// `padIntent` is pure so it can be tested without a browser.
import type { MoveDir } from './types';

export interface PadSnapshot {
  readonly buttons: readonly boolean[];
  readonly axes: readonly number[];
}

export interface PadIntent {
  readonly dir: MoveDir | null;
  readonly action: boolean;
  readonly pause: boolean;
}

export const STICK_DEADZONE = 0.5;
const BTN = { a: 0, start: 9, up: 12, down: 13, left: 14, right: 15 } as const;

function stickDir(x: number, y: number): MoveDir | null {
  if (Math.abs(x) < STICK_DEADZONE && Math.abs(y) < STICK_DEADZONE) return null;
  if (Math.abs(x) > Math.abs(y)) return x > 0 ? 'R' : 'L';
  return y > 0 ? 'D' : 'U';
}

/** Direction is level-triggered (held); action and pause fire once per press. */
export function padIntent(prev: PadSnapshot | null, cur: PadSnapshot): PadIntent {
  const b = (i: number): boolean => cur.buttons[i] === true;
  const edge = (i: number): boolean => b(i) && !(prev?.buttons[i] === true);
  let dir: MoveDir | null = null;
  if (b(BTN.up)) dir = 'U';
  else if (b(BTN.down)) dir = 'D';
  else if (b(BTN.left)) dir = 'L';
  else if (b(BTN.right)) dir = 'R';
  else dir = stickDir(cur.axes[0] ?? 0, cur.axes[1] ?? 0);
  return { dir, action: edge(BTN.a), pause: edge(BTN.start) };
}

export function readPad(): PadSnapshot | null {
  const pads = typeof navigator !== 'undefined' && navigator.getGamepads ? navigator.getGamepads() : [];
  for (const p of pads) {
    if (p && p.connected) return { buttons: p.buttons.map((x) => x.pressed), axes: Array.from(p.axes) };
  }
  return null;
}
