// Key remapping rows: Replace (click the key) and Add key (alternates), with swap and rejection messages.
import { ACTION_LABELS, ACTIONS, DEFAULT_KEYS, keyName, rebindKey, type Action, type Settings } from '../../settings';
import { S } from '../../strings';
import { h } from '../dom';
import type { Ctx } from './sections';

export interface KeyHooks {
  captureKey(cb: ((code: string) => void) | null): void;
  rerender(): void;
}

export function keysBody(c: Ctx, hooks: KeyHooks, message: { text: string }): HTMLElement[] {
  const rows = ACTIONS.map((a) => keyRow(c, hooks, a, message));
  const note = h('p', { class: 'note', id: 'key-msg', role: 'status' }, message.text || S.settings.pressEsc);
  return [note, ...rows];
}

function keyRow(c: Ctx, hooks: KeyHooks, a: Action, message: { text: string }): HTMLElement {
  const keys = c.get().keys[a];
  const mk = (label: string, id: string, mode: 'replace' | 'add'): HTMLButtonElement => {
    const b = h('button', { type: 'button', class: mode === 'add' ? 'keybtn add' : 'keybtn', id, 'aria-pressed': 'false' }, label) as HTMLButtonElement;
    b.addEventListener('click', () => capture(c, hooks, a, mode, b, message));
    return b;
  };
  const add = mk('+', `keyadd-${a}`, 'add');
  add.setAttribute('aria-label', `${S.settings.addKey}: ${ACTION_LABELS[a]}`);
  add.title = S.settings.addKey;
  return h('div', { class: 'field keyrow' }, h('span', {}, ACTION_LABELS[a]), mk(keys.map(keyName).join(' / '), `key-${a}`, 'replace'), add);
}

function capture(c: Ctx, hooks: KeyHooks, a: Action, mode: 'replace' | 'add', btn: HTMLElement, message: { text: string }): void {
  btn.textContent = S.settings.pressKey;
  btn.setAttribute('aria-pressed', 'true');
  hooks.captureKey((code) => {
    message.text = '';
    if (code !== 'Escape') {
      const r = rebindKey(c.get().keys, a, code, mode);
      if (r.ok) c.patch({ keys: r.keys });
      message.text = r.message ?? (r.swapped ? S.settings.swapped(keyName(code), ACTION_LABELS[r.swapped]) : '');
    }
    hooks.captureKey(null);
    hooks.rerender();
    document.getElementById(mode === 'add' ? `keyadd-${a}` : `key-${a}`)?.focus();
  });
}

export const KEYS_DEFAULTS = (): Partial<Settings> => ({ keys: { ...DEFAULT_KEYS } });
