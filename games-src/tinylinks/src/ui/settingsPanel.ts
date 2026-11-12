// Binds the settings dialog controls to the Settings object.
import { parseField, type SettingKey, type Settings } from '../settings';

/** Map a DOM data-value string back to its stored type. */
export function coerceValue(raw: string): string | number | boolean {
  if (raw === 'true') return true;
  if (raw === 'false') return false;
  return /^\d+$/.test(raw) ? Number(raw) : raw;
}

export function bindSettings(root: HTMLElement, get: () => Settings, set: (key: SettingKey, value: unknown) => void): () => void {
  const volume = root.querySelector<HTMLInputElement>('#volume');
  const out = root.querySelector<HTMLOutputElement>('#volume-out');
  const sync = (): void => {
    const s = get();
    for (const fs of root.querySelectorAll<HTMLElement>('fieldset[data-setting]')) {
      const key = fs.dataset.setting as SettingKey;
      for (const b of fs.querySelectorAll<HTMLButtonElement>('button')) {
        b.setAttribute('aria-pressed', String(String(s[key]) === b.dataset.value));
      }
    }
    if (volume) volume.value = String(s.volume);
    if (out) out.textContent = String(s.volume);
  };
  root.addEventListener('click', (e) => {
    const b = (e.target as HTMLElement).closest<HTMLButtonElement>('fieldset[data-setting] button');
    const key = b?.closest<HTMLElement>('fieldset')?.dataset.setting as SettingKey | undefined;
    if (!b || !key) return;
    const v = parseField(key, coerceValue(b.dataset.value ?? ''));
    if (v !== undefined) set(key, v);
  });
  volume?.addEventListener('input', () => set('volume', Number(volume.value)));
  return sync;
}
