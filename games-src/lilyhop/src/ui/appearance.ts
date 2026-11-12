// Applies appearance settings (theme, text size, motion, colour-blind assist) to the root element.
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
  root.style.setProperty('--hop-ms', `${CONFIG.timing.hopMs}ms`);
  root.style.setProperty('--jump-ms', `${CONFIG.timing.jumpMs}ms`);
  root.style.setProperty('--shake-ms', `${CONFIG.timing.shakeMs}ms`);
}
