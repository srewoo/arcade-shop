// Applies settings to the page: theme, text size, assist flag. Pure DOM, no game state.
import { type Settings, effectiveReduced } from './settings';

export interface Applied { reduced: boolean; textScale: number }

export function applyPrefs(s: Settings, systemReduced: boolean): Applied {
  const root = document.documentElement;
  if (s.theme === 'system') root.removeAttribute('data-theme'); else root.setAttribute('data-theme', s.theme);
  root.style.fontSize = `${s.textSize}%`;
  const reduced = effectiveReduced(s, systemReduced);
  root.dataset['motion'] = reduced ? 'reduced' : 'full';
  root.dataset['assist'] = s.colorAssist ? 'on' : 'off';
  return { reduced, textScale: s.textSize / 100 };
}
