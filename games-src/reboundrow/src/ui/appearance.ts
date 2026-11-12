// Applies appearance settings to the root element.
import type { Settings } from '../settings';

export const isReducedMotion = (setting: Settings['reduceMotion'], systemPrefers: boolean): boolean =>
  setting === 'on' || (setting === 'system' && systemPrefers);

export function applyAppearance(s: Settings, systemPrefersReduced: boolean, root: HTMLElement = document.documentElement): void {
  if (s.theme === 'system') delete root.dataset.theme;
  else root.dataset.theme = s.theme;
  root.dataset.text = String(s.textSize);
  root.dataset.motion = isReducedMotion(s.reduceMotion, systemPrefersReduced) ? 'reduce' : 'full';
  root.dataset.assist = s.colorAssist ? 'on' : 'off';
}
