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
}

export function applyFxVars(root: HTMLElement = document.documentElement): void {
  const { fx, ui } = CONFIG;
  const vars: Record<string, number> = {
    '--draw-ms': fx.drawMs,
    '--stagger-ms': fx.strokeStaggerMs,
    '--strike-ms': fx.strikeMs,
    '--vanish-ms': fx.vanishMs,
    '--shake-ms': fx.shakeMs,
    '--confetti-ms': fx.confettiMs,
    '--pulse-ms': ui.pulseMs,
  };
  for (const [name, value] of Object.entries(vars)) root.style.setProperty(name, `${value}ms`);
  root.style.setProperty('--win-delay', `${fx.drawMs + fx.strokeStaggerMs}ms`);
}
