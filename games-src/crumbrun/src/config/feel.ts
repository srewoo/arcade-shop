// Game-feel numbers: juice, camera, audio mix. None of these affect the simulation.

export const FEEL = Object.freeze({
  hitStop: Object.freeze({ deathSec: 0.08, splashSec: 0.06 }),
  shake: Object.freeze({ deathSec: 0.15, deathPx: 2 }),
  popupScale: Object.freeze({ popSec: 0.18, from: 1.7 }),
  /** Reduced-motion particle budget (fraction of normal counts). */
  calmParticles: 0.4,
  light: Object.freeze({ vignetteOuterAlpha: 0.55, warmAlpha: 0.12 }),
  audio: Object.freeze({
    /** Master gain at volume 100; the user slider scales it. */
    master: 1,
    compressor: Object.freeze({ threshold: -18, knee: 12, ratio: 6, attack: 0.003, release: 0.2 }),
    gain: Object.freeze({
      squeak: 0.08, jingle: 0.14, splash: 0.25, meow: 0.07, pistol: 0.12, cheese: 0.12,
      death: 0.14, extraLife: 0.12, release: 0.1, drenchTick: 0.09, phase: 0.1,
      pounce: 0.1, gameOver: 0.13, ui: 0.09, bass: 0.05,
    }),
    squeakGapSec: 0.085,
    /** Ambient bass pulse: beats per second at 100% and 0% crumbs remaining. */
    bassBpmSlow: 70, bassBpmFast: 130,
  }),
});
