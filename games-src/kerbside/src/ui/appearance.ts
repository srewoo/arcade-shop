// Applies appearance settings (theme, text size, motion, colour-blind assist, touch controls) to <html>.
import type { Settings } from '../settings';
import { isTouchCapable } from './dom';

export const isReducedMotion = (setting: Settings['reduceMotion'], systemPrefers: boolean): boolean =>
  setting === 'on' || (setting === 'system' && systemPrefers);

export const touchVisible = (setting: Settings['touchControls'], coarse: boolean): boolean => setting === 'on' || (setting === 'auto' && coarse);

export function applyAppearance(s: Settings, systemPrefersReduced: boolean, root: HTMLElement = document.documentElement): void {
  if (s.theme === 'system') delete root.dataset.theme;
  else root.dataset.theme = s.theme;
  root.dataset.text = String(s.textSize);
  root.dataset.motion = isReducedMotion(s.reduceMotion, systemPrefersReduced) ? 'reduce' : 'full';
  root.dataset.assist = s.colorAssist ? 'on' : 'off';
  root.dataset.touch = touchVisible(s.touchControls, isTouchCapable()) ? 'on' : 'off';
}
