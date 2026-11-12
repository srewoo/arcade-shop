// Binds the settings sheet and the title-screen choosers to the settings object.
import type { Els } from './dom';
import { parseField, type SettingKey, type Settings } from '../settings';

type Change = <K extends SettingKey>(key: K, value: Settings[K]) => void;

/** Reflect `s` into every [data-setting] fieldset, the volume slider and the mute button. */
export function syncSettingsView(root: ParentNode, els: Els, s: Settings): void {
  root.querySelectorAll<HTMLFieldSetElement>('fieldset[data-setting]').forEach((fs) => {
    const key = fs.dataset.setting as SettingKey;
    fs.querySelectorAll<HTMLButtonElement>('button').forEach((b) => b.setAttribute('aria-pressed', String(String(s[key]) === b.dataset.value)));
  });
  els.volume.value = String(s.volume);
  els.volumeOut.value = String(s.volume);
  els.mute.setAttribute('aria-pressed', String(s.sound && s.volume > 0));
  els.mute.setAttribute('aria-label', s.sound ? 'Sound on' : 'Sound muted');
}

export function bindSettingsView(root: ParentNode, els: Els, change: Change): void {
  root.querySelectorAll<HTMLFieldSetElement>('fieldset[data-setting]').forEach((fs) => {
    const key = fs.dataset.setting as SettingKey;
    fs.addEventListener('click', (e) => {
      const btn = (e.target as HTMLElement).closest<HTMLButtonElement>('button[data-value]');
      if (!btn) return;
      const raw = btn.dataset.value ?? '';
      const candidates: unknown[] = [raw, raw === 'true' ? true : raw === 'false' ? false : raw, Number(raw)];
      for (const c of candidates) {
        const parsed = parseField(key, c);
        if (parsed !== undefined) { change(key, parsed as Settings[typeof key]); return; }
      }
    });
  });
  els.volume.addEventListener('input', () => {
    const v = parseField('volume', Number(els.volume.value));
    if (v !== undefined) change('volume', v);
  });
}
