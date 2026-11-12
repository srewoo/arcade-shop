// Applies appearance settings (theme, text size, motion, colour-blind assist)
// to the root element, and exports CSS timings from the tuning config.
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
  root.dataset.timer = s.showTimer ? 'on' : 'off';
}

export function applyFxVars(root: HTMLElement = document.documentElement): void {
  root.style.setProperty('--gate-ms', `${CONFIG.fx.gateMs}ms`);
  root.style.setProperty('--pour-ms', `${CONFIG.fx.pourMs}ms`);
}
