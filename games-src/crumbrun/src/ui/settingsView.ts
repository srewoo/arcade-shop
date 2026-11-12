// Settings panel (shared wording across the arcadeShop games).
import { STR } from '../strings';
import { h } from './dom';
import type { Settings } from '../storage';

export interface SettingsViewDeps {
  readonly get: () => Settings;
  readonly change: (patch: Partial<Settings>) => void;
  readonly howTo: () => void;
  readonly done: () => void;
}

function volumeRow(d: SettingsViewDeps): HTMLElement {
  const out = h('output', { cls: 'val', text: `${d.get().volume}%` });
  const input = h('input', {
    attrs: { type: 'range', min: '0', max: '100', step: '5', value: String(d.get().volume), id: 'set-volume', 'aria-label': STR.settings.volume },
    on: {
      input: (e) => {
        const v = Number((e.target as HTMLInputElement).value);
        out.textContent = `${v}%`;
        d.change({ volume: v });
      },
    },
  });
  return h('div', { cls: 'row' }, h('label', { text: STR.settings.volume, attrs: { for: 'set-volume' } }), input, out);
}

interface Choice<T extends string | number> {
  readonly value: T;
  readonly label: string;
}

function segmented<T extends string | number>(label: string, choices: readonly Choice<T>[], current: () => T,
  set: (v: T) => void): HTMLElement {
  const group = h('div', { cls: 'seg', attrs: { role: 'group', 'aria-label': label } });
  const buttons = choices.map((c) => h('button', {
    cls: 'seg-btn', text: c.label, attrs: { type: 'button', 'aria-pressed': String(current() === c.value) },
    on: {
      click: () => {
        set(c.value);
        buttons.forEach((b, i) => b.setAttribute('aria-pressed', String(choices[i]?.value === c.value)));
      },
    },
  }));
  group.append(...buttons);
  return h('div', { cls: 'row stack-row' }, h('span', { cls: 'lbl', text: label }), group);
}

function toggle(label: string, current: () => boolean, set: (v: boolean) => void): HTMLElement {
  const btn = h('button', {
    cls: 'switch', attrs: { type: 'button', role: 'switch', 'aria-checked': String(current()), 'aria-label': label },
    on: {
      click: () => {
        const next = btn.getAttribute('aria-checked') !== 'true';
        btn.setAttribute('aria-checked', String(next));
        btn.textContent = next ? STR.settings.on : STR.settings.off;
        set(next);
      },
    },
  });
  btn.textContent = current() ? STR.settings.on : STR.settings.off;
  return h('div', { cls: 'row' }, h('span', { cls: 'lbl', text: label }), btn);
}

export function settingsView(d: SettingsViewDeps): HTMLElement {
  const S = STR.settings;
  const rm: readonly Choice<Settings['reduceMotion']>[] = [
    { value: 'system', label: S.system }, { value: 'on', label: S.on }, { value: 'off', label: S.off }];
  const ts: readonly Choice<Settings['textSize']>[] = [
    { value: 100, label: '100%' }, { value: 125, label: '125%' }, { value: 150, label: '150%' }];
  return h('div', { cls: 'panel settings' },
    h('h2', { text: S.title }),
    volumeRow(d),
    segmented(S.reduceMotion, rm, () => d.get().reduceMotion, (v) => d.change({ reduceMotion: v })),
    toggle(S.colorAssist, () => d.get().colorAssist, (v) => d.change({ colorAssist: v })),
    segmented(S.textSize, ts, () => d.get().textSize, (v) => d.change({ textSize: v })),
    toggle(S.highContrast, () => d.get().highContrast, (v) => d.change({ highContrast: v })),
    toggle(S.showDpad, () => d.get().showDpad, (v) => d.change({ showDpad: v })),
    toggle(S.leftHanded, () => d.get().leftHanded, (v) => d.change({ leftHanded: v })),
    h('div', { cls: 'stack gap' },
      h('button', { cls: 'btn', text: S.howTo, attrs: { type: 'button' }, on: { click: () => d.howTo() } }),
      h('button', { cls: 'btn primary', text: S.done, attrs: { type: 'button', 'data-initial': '1' }, on: { click: () => d.done() } })));
}
