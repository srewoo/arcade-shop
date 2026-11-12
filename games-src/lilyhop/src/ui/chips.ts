// Segmented option buttons in the Settings panel.
import type { SettingKey, Settings } from '../settings';

/** DOM values are strings; map them back to the stored type before validation. */
export function coerceValue(raw: string): string | number | boolean {
  if (raw === 'true') return true;
  if (raw === 'false') return false;
  return /^\d+$/.test(raw) ? Number(raw) : raw;
}

export function renderChips(root: HTMLElement, settings: Settings): void {
  root.querySelectorAll<HTMLFieldSetElement>('fieldset[data-setting]').forEach((group) => {
    const key = group.dataset.setting as SettingKey;
    const buttons = [...group.querySelectorAll<HTMLButtonElement>('button[data-value]')];
    buttons.forEach((btn) => btn.setAttribute('aria-pressed', String(String(settings[key]) === btn.dataset.value)));
    const stop = buttons.find((b) => b.getAttribute('aria-pressed') === 'true') ?? buttons[0];
    buttons.forEach((b) => (b.tabIndex = b === stop ? 0 : -1));
  });
}
