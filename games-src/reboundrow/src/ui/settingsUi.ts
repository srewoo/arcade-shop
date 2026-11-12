// Binds the settings dialog controls to a Settings object.
import { parseField, type SettingKey, type Settings } from '../settings';
import { $ } from './dom';

export function syncSettingsUi(s: Settings): void {
  const volume = $<HTMLInputElement>('volume');
  volume.value = String(s.volume);
  $('volume-out').textContent = String(s.volume);
  document.querySelectorAll<HTMLFieldSetElement>('fieldset[data-setting]').forEach((fs) => {
    const key = fs.dataset.setting as SettingKey;
    fs.querySelectorAll<HTMLButtonElement>('button[data-value]').forEach((b) => {
      b.setAttribute('aria-pressed', String(String(s[key]) === b.dataset.value));
    });
  });
}

function decode(key: SettingKey, raw: string): unknown {
  if (key === 'sound' || key === 'colorAssist') return raw === 'true';
  if (key === 'textSize') return Number(raw);
  return raw;
}

/** Calls onChange with the full updated settings whenever a control changes. */
export function bindSettingsUi(get: () => Settings, onChange: (next: Settings) => void): void {
  $<HTMLInputElement>('volume').addEventListener('input', (e) => {
    const v = parseField('volume', Number((e.target as HTMLInputElement).value));
    if (v !== undefined) onChange({ ...get(), volume: v });
  });
  document.querySelectorAll<HTMLButtonElement>('fieldset[data-setting] button[data-value]').forEach((b) => {
    b.addEventListener('click', () => {
      const key = (b.closest('fieldset') as HTMLFieldSetElement).dataset.setting as SettingKey;
      const parsed = parseField(key, decode(key, b.dataset.value ?? ''));
      if (parsed !== undefined) onChange({ ...get(), [key]: parsed });
    });
  });
}
