// Applies display settings to <html>: theme, reduce motion, colour-blind palette, text size.
import type { Settings } from '../storage';

const SYSTEM_MOTION = '(prefers-reduced-motion: reduce)';

export const THEMES = ['system', 'light', 'dark'] as const;

export function effectiveReduceMotion(setting: Settings['reduceMotion'], systemPrefers: boolean): boolean {
  if (setting === 'on') return true;
  if (setting === 'off') return false;
  return systemPrefers;
}

export function applyAppearance(s: Settings): void {
  const root = document.documentElement;
  if (s.theme === 'system') root.removeAttribute('data-theme');
  else root.setAttribute('data-theme', s.theme);
  const reduce = effectiveReduceMotion(s.reduceMotion, window.matchMedia(SYSTEM_MOTION).matches);
  root.dataset.motion = reduce ? 'reduce' : 'full';
  if (s.colorBlind) root.dataset.cb = 'on';
  else root.removeAttribute('data-cb');
  root.style.setProperty('--tscale', String(s.textSize / 100));
}

/** Re-applies when the OS motion preference changes while the setting is "system". */
export function watchSystemMotion(get: () => Settings): void {
  window.matchMedia(SYSTEM_MOTION).addEventListener('change', () => applyAppearance(get()));
}
