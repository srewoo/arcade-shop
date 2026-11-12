// Binds the settings dialog controls to a settings object and reports changes.
import { parseField, SETTING_KEYS, type SettingKey, type Settings } from '../settings';
import { $ } from './dom';

const fromAttr = (key: SettingKey, raw: string): unknown => {
  if (key === 'sound' || key === 'colorAssist') return raw === 'true';
  if (key === 'textSize') return Number(raw);
  return raw;
};

export function syncSettingsPanel(root: HTMLElement, s: Settings): void {
  root.querySelectorAll<HTMLFieldSetElement>('fieldset[data-setting]').forEach((fs) => {
    const key = fs.dataset.setting as SettingKey;
    fs.querySelectorAll<HTMLButtonElement>('button').forEach((b) => {
      b.setAttribute('aria-pressed', String(fromAttr(key, b.dataset.value ?? '') === s[key]));
    });
  });
  ($('volume') as HTMLInputElement).value = String(s.volume);
  $('volume-out').textContent = String(s.volume);
}

export function bindSettingsPanel(root: HTMLElement, onChange: <K extends SettingKey>(key: K, value: Settings[K]) => void): void {
  root.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLButtonElement>('fieldset[data-setting] button');
    const key = btn?.closest('fieldset')?.dataset.setting as SettingKey | undefined;
    if (!btn || !key || !SETTING_KEYS.includes(key)) return;
    const value = parseField(key, fromAttr(key, btn.dataset.value ?? ''));
    if (value !== undefined) onChange(key, value);
  });
  $('volume').addEventListener('input', (e) => {
    const value = parseField('volume', Number((e.target as HTMLInputElement).value));
    if (value !== undefined) onChange('volume', value);
  });
}
