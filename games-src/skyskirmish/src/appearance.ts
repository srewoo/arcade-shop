// Applies theme, text size and motion preference to the document root.
import { motionReduced, type Settings } from './settings';

export const systemPrefersReduced = (): boolean =>
  typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function applyAppearance(s: Settings, root: HTMLElement = document.documentElement): void {
  if (s.theme === 'system') root.removeAttribute('data-theme');
  else root.setAttribute('data-theme', s.theme);
  root.style.setProperty('--text-scale', String(s.textSize / 100));
  root.dataset.reduce = String(motionReduced(s, systemPrefersReduced()));
  root.dataset.assist = String(s.colorAssist);
}
