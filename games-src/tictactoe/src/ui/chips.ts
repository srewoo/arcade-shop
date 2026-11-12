// Segmented option buttons (shared by the Game options box and Settings panel).
import { levelDescription, levelName, optionsSummary } from '../strings';
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
    buttons.forEach((btn) => {
      btn.setAttribute('aria-pressed', String(String(settings[key]) === btn.dataset.value));
    });
    // Roving tabindex: one tab stop per group, on the selected option.
    const stop = buttons.find((b) => b.getAttribute('aria-pressed') === 'true') ?? buttons[0];
    buttons.forEach((b) => (b.tabIndex = b === stop ? 0 : -1));
    if (key === 'level') group.disabled = settings.opponent !== 'cpu';
  });
}

/** Level chip text follows the variant (the top level is "Expert" in both variants). */
export function renderLevelLabels(root: HTMLElement, settings: Settings, describeId: string): void {
  const group = root.querySelector<HTMLFieldSetElement>('fieldset[data-setting="level"]');
  group?.querySelectorAll<HTMLButtonElement>('button[data-value]').forEach((btn) => {
    const level = btn.dataset.value as Settings['level'];
    btn.textContent = levelName(level, settings.variant);
    btn.title = levelDescription(level, settings.variant);
  });
  group?.setAttribute('aria-describedby', describeId);
}

export function renderOptionsText(settings: Settings, summary: HTMLElement, desc: HTMLElement): void {
  summary.textContent = optionsSummary(settings);
  desc.textContent = settings.opponent === 'cpu' ? levelDescription(settings.level, settings.variant) : '';
  desc.hidden = settings.opponent !== 'cpu';
}
