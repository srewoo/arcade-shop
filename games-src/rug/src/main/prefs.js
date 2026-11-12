// Applies the accessibility / audio preferences to the live game: Reduce motion, colour-blind assist,
// HUD size and the audio channels. Called on load and whenever one of those settings changes.
import { resolveReduceMotion, hudScaleFactor, particleScale } from "../logic/settings.js";
import { sfx } from "../audio/sfx.js";
import { cameraRig, particles, ui } from "./bootstrap.js";
import { stage } from "./stage.js";
import { layout, requestResize } from "./layout.js";

const motionQuery = typeof matchMedia === "function" ? matchMedia("(prefers-reduced-motion: reduce)") : null;
let lastSettings = null;

/** Effective Reduce motion for the given settings (System follows the OS). */
export const isReducedMotion = (settings) => resolveReduceMotion(settings.reduceMotion, motionQuery?.matches);

export function applyPrefs(settings) {
  lastSettings = settings;
  const reduced = isReducedMotion(settings);
  document.documentElement.dataset.reduceMotion = reduced ? "1" : "0";
  cameraRig.motionScale = reduced ? 0 : 1;
  particles.density = particleScale(reduced);
  stage.classList.toggle("cb", !!settings.colourBlind);
  ui.colourBlind = !!settings.colourBlind;
  const scale = hudScaleFactor(settings.hudScale);
  if (layout.hudScale !== scale) {
    layout.hudScale = scale;
    requestResize();
  }
  sfx.setVolume(settings.volume);
  sfx.setBus("sfx", settings.sfxVolume);
  sfx.setBus("engine", settings.engineVolume);
}

// "System" follows the OS setting live
motionQuery?.addEventListener?.("change", () => lastSettings && applyPrefs(lastSettings));
