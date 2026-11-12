// Pushes the current settings into the DOM, audio engine and effects.
import { configureAudio } from '../audio';
import { applyAppearance, isReducedMotion } from './appearance';
import { syncSettingsUi } from './settingsUi';
import { app } from './state';

export function applyAll(): void {
  const s = app.settings;
  applyAppearance(s, app.systemReduced);
  app.reduced = isReducedMotion(s.reduceMotion, app.systemReduced);
  configureAudio({ enabled: s.sound, volume: s.volume });
  syncSettingsUi(s);
}
