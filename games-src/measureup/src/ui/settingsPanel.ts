// Binds the settings dialog: segmented buttons and the volume slider.
import type { SettingKey, Settings } from '../settings';
import { SETTING_KEYS, parseField } from '../settings';
import { el } from './dom';

export function reflectSettings(s: Settings): void {
  document.querySelectorAll<HTMLElement>('fieldset[data-setting]').forEach((fs) => {
    const key = fs.dataset.setting as SettingKey;
    fs.querySelectorAll<HTMLButtonElement>('button').forEach((b) => b.setAttribute('aria-pressed', String(String(s[key]) === b.dataset.value)));
  });
  el<HTMLInputElement>('volume').value = String(s.volume);
  el('volume-out').textContent = String(s.volume);
  const sound = el('sound');
  sound.setAttribute('aria-pressed', String(s.sound));
}

/** Wire the controls; `change` receives validated values only. */
export function bindSettings(change: (key: SettingKey, value: unknown) => void): void {
  document.querySelectorAll<HTMLElement>('fieldset[data-setting]').forEach((fs) => {
    const key = fs.dataset.setting as SettingKey;
    if (!SETTING_KEYS.includes(key)) return;
    fs.querySelectorAll<HTMLButtonElement>('button').forEach((b) => {
      b.addEventListener('click', () => {
        const raw = b.dataset.value ?? '';
        const value = raw === 'true' ? true : raw === 'false' ? false : /^\d+$/.test(raw) ? Number(raw) : raw;
        const ok = parseField(key, value);
        if (ok !== undefined) change(key, ok);
      });
    });
  });
  el<HTMLInputElement>('volume').addEventListener('input', (e) => {
    const v = parseField('volume', Number((e.target as HTMLInputElement).value));
    if (v !== undefined) change('volume', v);
  });
}
