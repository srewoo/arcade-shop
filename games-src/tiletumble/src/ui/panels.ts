// Settings panel wiring (fieldset toggle buttons + volume slider).
import { parseField, SETTING_KEYS, type SettingKey, type Settings } from '../settings';
import { el, qs } from './dom';

type Setter = <K extends SettingKey>(key: K, value: Settings[K]) => void;

function coerce(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
}

export function initSettingsPanel(set: Setter): void {
  const panel = el('settings-overlay');
  panel.querySelectorAll<HTMLElement>('fieldset[data-setting]').forEach((group) => {
    const key = group.dataset.setting as SettingKey;
    if (!SETTING_KEYS.includes(key)) return;
    group.querySelectorAll<HTMLButtonElement>('button[data-value]').forEach((btn) =>
      btn.addEventListener('click', () => {
        const value = parseField(key, coerce(btn.dataset.value ?? ''));
        if (value !== undefined) set(key, value as never);
      }),
    );
  });
  const slider = el<HTMLInputElement>('volume');
  slider.addEventListener('input', () => {
    const value = parseField('volume', Number(slider.value));
    if (value !== undefined) set('volume', value);
  });
}

export function syncSettingsPanel(s: Settings): void {
  const panel = el('settings-overlay');
  panel.querySelectorAll<HTMLElement>('fieldset[data-setting]').forEach((group) => {
    const key = group.dataset.setting as SettingKey;
    const current = String(s[key]);
    group.querySelectorAll<HTMLButtonElement>('button[data-value]').forEach((btn) =>
      btn.setAttribute('aria-pressed', String(btn.dataset.value === current)),
    );
  });
  el<HTMLInputElement>('volume').value = String(s.volume);
  qs('#volume-out').textContent = String(s.volume);
  const sound = el('sound');
  sound.setAttribute('aria-pressed', String(s.sound));
  sound.setAttribute('aria-label', s.sound ? 'Sound on' : 'Sound muted');
}
