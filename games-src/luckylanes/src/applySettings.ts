// Applies validated settings to the page and the game: theme, text size, motion, assists, volume.
import type { AudioEngine } from './audio';
import { byId } from './dom';
import type { Game } from './game';
import type { Settings } from './settings';

/** Effective reduced-motion flag: the setting, or the OS preference when it is "System". */
export const reducedMotion = (s: Settings, systemPrefers: boolean): boolean => s.reduceMotion === 'on' || (s.reduceMotion === 'system' && systemPrefers);

export function applySettings(s: Settings, game: Game, audio: AudioEngine, systemMotion: boolean): void {
  const root = document.documentElement;
  if (s.theme === 'system') root.removeAttribute('data-theme');
  else root.setAttribute('data-theme', s.theme);
  root.style.fontSize = `${s.textSize}%`;
  root.dataset.ts = String(s.textSize);
  root.dataset.rm = reducedMotion(s, systemMotion) ? 'on' : 'off';
  root.dataset.cb = s.cbAssist ? 'on' : 'off';
  audio.setVolume(s.volume);
  audio.setMuted(!s.sound);
  const sound = byId('sound');
  sound.setAttribute('aria-pressed', String(s.sound));
  const lbl = sound.querySelector('.lbl');
  if (lbl) lbl.textContent = s.sound ? 'Sound on' : 'Sound off';
  game.pres.setReducedMotion(reducedMotion(s, systemMotion));
  game.pres.highContrast = s.cbAssist;
  game.assist = s.widePocket;
  game.input = { ...game.input, assist: s.widePocket };
  game.pacing.fastCpu = s.fastCpu;
}
