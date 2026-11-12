// Applies appearance settings to the root element and exports CSS timings from the tuning config.
import { CONFIG } from '../config';
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

export function applyFxVars(root: HTMLElement = document.documentElement): void {
  const { fx } = CONFIG;
  root.style.setProperty('--move-ms', `${fx.moveMs}ms`);
  root.style.setProperty('--shake-ms', `${fx.shakeMs}ms`);
  root.style.setProperty('--confetti-ms', `${fx.confettiMs}ms`);
  CONFIG.ui.figurePalette.forEach((c, i) => root.style.setProperty(`--fig-${i}`, c));
}
