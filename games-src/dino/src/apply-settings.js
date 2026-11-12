// Pushes the validated settings object into the live game systems (audio volume / mute / ambience, graphics quality,
// camera shake, reduced motion, theme, text size, colour-blind assist, dino skin, mode rules).  Safe to call repeatedly.
import { settings, game } from './state.js';
import { audio, shake, world, dino, hud, puffs } from './systems.js';
import { WEATHER_FACTORS } from './tuning.js';
import { applyQuality } from './quality.js';
import { applySkinColors } from './dino/recolor.js';
import { shakeScale, effectiveReducedMotion } from './settings.js';
import { resolveSkin, skinById } from './skins.js';
import { applyRules } from './session.js';
import { records } from './records.js';
import { prefersReducedMotion } from './storage.js';
import { runInProgress, taintRun } from './ranking.js';

let lastQuality = null;
let lastEnv = '';

/** Theme, text size and assist are plain DOM attributes / custom properties. */
function applyChrome() {
  const root = document.documentElement;
  if (settings.theme === 'system') delete root.dataset.theme;
  else root.dataset.theme = settings.theme;
  root.style.setProperty('--ui-scale', String(settings.textScale));
  document.body.classList.toggle('assist', settings.colorAssist);
  document.body.classList.toggle('reduced-motion', settings.reducedMotion);
}

export function applySettings() {
  settings.reducedMotion = effectiveReducedMotion(settings.motion, prefersReducedMotion());
  audio.setVolume(settings.volume);
  audio.setMuted(settings.muted);
  hud.setMuted(settings.muted);
  audio.setAmbience(settings.weather === 'rain' ? 'rain' : settings.weather === 'snow' ? 'wind' : null);
  shake.scale = shakeScale(settings);
  puffs.scale = settings.reducedMotion ? WEATHER_FACTORS.reducedCount : 1; // reduced motion: at most 40% of the dust
  world.setReducedMotion(settings.reducedMotion);
  applyChrome();
  if (settings.quality !== lastQuality) {
    lastQuality = settings.quality;
    applyQuality(settings.quality);
  }
  const env = `${settings.weather}|${settings.quality}|${settings.reducedMotion}`;
  if (env !== lastEnv) {
    lastEnv = env;
    world.setEnvironment(settings.weather, settings.quality, settings.reducedMotion);
  }
  const skin = resolveSkin(settings.skin, records.overall(), settings.unlockedSkins);
  applySkinColors(dino, skinById(skin).colors);
  // a ranking-relevant change in the middle of a run (pause > Settings) can only make that run unranked
  if (game.runRank && runInProgress(game.state)) game.runRank = taintRun(game.runRank, settings);
  game.mode = settings.mode;
  applyRules();
}
