// Visual effect tuning. Reduce motion removes shake, particles, flashes and drops.
export const FX = Object.freeze({
  particles: 22,
  damping: 0.96,
  flashSeconds: 0.4,
  dropSeconds: 0.18, // pocketed ball shrinks toward the pocket
  shakeSeconds: 0.15,
  shakePx: 2,
  textRisePx: 24,
  textSeconds: 2.0,
  textSecondsReduced: 2.4,
  maxTexts: 4,
  strikeSeconds: 0.22,
});
