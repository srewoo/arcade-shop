// Settings overlay wiring: fieldsets of toggle buttons + volume slider.
import type { SettingKey, Settings } from '../settings';
import { parseField } from '../settings';
import { el } from './dom';

export function renderSettings(s: Settings): void {
  document.querySelectorAll<HTMLFieldSetElement>('#settings-overlay fieldset[data-setting]').forEach((fs) => {
    const key = fs.dataset.setting as SettingKey;
    fs.querySelectorAll<HTMLButtonElement>('button').forEach((b) => b.setAttribute('aria-pressed', String(String(s[key]) === b.dataset.value)));
  });
  const vol = el<HTMLInputElement>('volume');
  vol.value = String(s.volume);
  el('volume-out').textContent = String(s.volume);
}

function coerce(key: SettingKey, raw: string): unknown {
  if (key === 'textSize') return Number(raw);
  if (key === 'sound' || key === 'colorAssist') return raw === 'true';
  return raw;
}

export function bindSettings(get: () => Settings, set: (next: Settings) => void): void {
  document.querySelectorAll<HTMLButtonElement>('#settings-overlay fieldset[data-setting] button').forEach((b) => {
    b.addEventListener('click', () => {
      const key = (b.closest('fieldset') as HTMLFieldSetElement).dataset.setting as SettingKey;
      const value = parseField(key, coerce(key, b.dataset.value ?? ''));
      if (value !== undefined) set({ ...get(), [key]: value });
    });
  });
  el<HTMLInputElement>('volume').addEventListener('input', (e) => {
    const value = parseField('volume', Number((e.target as HTMLInputElement).value));
    if (value !== undefined) set({ ...get(), volume: value });
  });
}
