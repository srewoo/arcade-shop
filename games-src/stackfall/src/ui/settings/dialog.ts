// Settings dialog: native modal <dialog> with collapsible sections and a fixed footer.
import type { Settings } from '../../settings';
import { S } from '../../strings';
import { h } from '../dom';
import { section } from './controls';
import { keysBody, KEYS_DEFAULTS } from './keysSection';
import { AUDIO_DEFAULTS, audioRows, DISPLAY_DEFAULTS, displayRows, HANDLING_DEFAULTS, handlingRows, type Ctx } from './sections';

export interface SettingsHooks {
  /** Ask for the next key press; resolves the code, or null if cancelled. */
  captureKey(cb: ((code: string) => void) | null): void;
  onChange(s: Settings): void;
}

const DEFAULT_OPEN = new Set(['display']);

export function openSettings(dialog: HTMLDialogElement, current: Settings, hooks: SettingsHooks): void {
  let s: Settings = { ...current, keys: { ...current.keys } };
  const open = new Set(DEFAULT_OPEN);
  const message = { text: '' };
  const ctx: Ctx = {
    get: () => s,
    patch: (p) => { s = { ...s, ...p }; hooks.onChange(s); },
  };
  const rerender = (): void => {
    dialog.querySelectorAll<HTMLDetailsElement>('details[data-sec]').forEach((d) => (d.open ? open.add(d.dataset.sec as string) : open.delete(d.dataset.sec as string)));
    render();
  };
  const reset = (defaults: Partial<Settings>): void => { ctx.patch(defaults); rerender(); };
  const t = S.settings;
  const render = (): void => {
    const body = h('div', { class: 'dlg-body' },
      section('display', t.display, open.has('display'), displayRows(ctx), t.reset, () => reset(DISPLAY_DEFAULTS)),
      section('audio', t.audio, open.has('audio'), audioRows(ctx), t.reset, () => reset(AUDIO_DEFAULTS)),
      section('handling', t.handling, open.has('handling'), handlingRows(ctx), t.reset, () => reset(HANDLING_DEFAULTS)),
      section('keys', t.keys, open.has('keys'), keysBody(ctx, { captureKey: hooks.captureKey, rerender }, message), t.resetKeys, () => reset(KEYS_DEFAULTS())));
    const done = h('button', { type: 'button', class: 'btn', id: 'settings-close' }, t.done);
    done.addEventListener('click', () => dialog.close());
    dialog.replaceChildren(h('div', { class: 'dlg' }, h('h2', { id: 'settings-title' }, t.heading), body, h('div', { class: 'dlg-foot' }, done)));
  };
  render();
  dialog.onclick = (e) => { if (e.target === dialog) dialog.close(); };
  dialog.showModal();
}
