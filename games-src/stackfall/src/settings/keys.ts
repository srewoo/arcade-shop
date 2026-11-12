// Key bindings: schema, defaults and safe rebinding (no action is ever left unbound).
import { z } from 'zod';
import { S } from '../strings';

export const ACTIONS = ['left', 'right', 'softDrop', 'hardDrop', 'rotCW', 'rotCCW', 'stash', 'pause', 'mute'] as const;
export type Action = (typeof ACTIONS)[number];

export const ACTION_LABELS: Record<Action, string> = {
  left: 'Move left', right: 'Move right', softDrop: 'Soft drop', hardDrop: 'Hard drop',
  rotCW: 'Rotate clockwise', rotCCW: 'Rotate counter-clockwise', stash: 'Stash', pause: 'Pause', mute: 'Mute',
};

export const MAX_KEYS_PER_ACTION = 4;
const KeyList = z.array(z.string().min(1).max(32)).min(1).max(MAX_KEYS_PER_ACTION);
export const KeysSchema = z.object({
  left: KeyList, right: KeyList, softDrop: KeyList, hardDrop: KeyList, rotCW: KeyList,
  rotCCW: KeyList, stash: KeyList, pause: KeyList, mute: KeyList,
}).strict();
export type Keys = z.infer<typeof KeysSchema>;

export const DEFAULT_KEYS: Readonly<Keys> = Object.freeze({
  left: ['ArrowLeft', 'KeyA'],
  right: ['ArrowRight', 'KeyD'],
  softDrop: ['ArrowDown', 'KeyS'],
  hardDrop: ['Space'],
  rotCW: ['ArrowUp', 'KeyX', 'KeyW'],
  rotCCW: ['KeyZ'],
  stash: ['KeyC', 'ShiftLeft', 'ShiftRight'],
  pause: ['KeyP', 'Escape'],
  mute: ['KeyM'],
});

/** Keys that drive page navigation or the OS and must never be bound. */
export const BLOCKED_CODES: readonly string[] = ['Tab', 'Enter', 'NumpadEnter', 'MetaLeft', 'MetaRight', 'ContextMenu', 'OSLeft', 'OSRight'];

export const keyName = (code: string): string =>
  code.replace(/^Key/, '').replace(/^Arrow/, '').replace('Digit', '').replace('ShiftLeft', 'L-Shift').replace('ShiftRight', 'R-Shift');

export interface RebindResult {
  keys: Keys;
  ok: boolean;
  message?: string;
  swapped?: Action;
}

const unique = (list: string[]): string[] => [...new Set(list)];

/**
 * Bind `code` to `action`. `replace` makes it the action's only key; `add` appends
 * it as an alternate. A key taken from another action is removed there; if that
 * would leave the other action unbound, `replace` swaps (the other action takes
 * this action's old keys) and `add` is rejected with a message.
 */
export function rebindKey(keys: Keys, action: Action, code: string, mode: 'replace' | 'add' = 'replace'): RebindResult {
  if (BLOCKED_CODES.includes(code)) return { keys, ok: false, message: S.settings.rejected(keyName(code)) };
  const old = keys[action];
  if (mode === 'add' && !old.includes(code) && old.length >= MAX_KEYS_PER_ACTION) return { keys, ok: false, message: S.settings.maxKeys };
  const next = { ...keys } as Keys;
  let swapped: Action | undefined;
  for (const other of ACTIONS) {
    if (other === action || !keys[other].includes(code)) continue;
    const rest = keys[other].filter((c) => c !== code);
    if (rest.length > 0) {
      next[other] = rest;
      continue;
    }
    const donated = old.filter((c) => c !== code);
    if (mode === 'add' || donated.length === 0) {
      return { keys, ok: false, message: S.settings.onlyKey(keyName(code), ACTION_LABELS[other]) };
    }
    next[other] = donated;
    swapped = other;
  }
  next[action] = mode === 'add' ? unique([...old, code]) : [code];
  return swapped ? { keys: next, ok: true, swapped } : { keys: next, ok: true };
}

/** Replace-bind helper kept for callers that only need the resulting keys. */
export const rebind = (keys: Keys, action: Action, code: string): Keys => rebindKey(keys, action, code).keys;
