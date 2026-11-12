// Feedback tuning: popups, shake, flashes, confetti.
export const JUICE = {
  popupLifeMs: 1000,
  /** Global cap on live floating score popups (the oldest is dropped first). */
  maxPopups: 4,
  shakeMs: 180,
  houseFlashMs: 450,
  houseFlashStaggerMs: 25,
  /** A placed digit pops in over this long (Reduce motion: none). */
  digitPopMs: 260,
  digitPop: [{ transform: 'scale(0.3)', opacity: 0 }, { transform: 'scale(1.3)', opacity: 1, offset: 0.55 }, { transform: 'scale(1)', opacity: 1 }] as Keyframe[],
  confettiCount: 90,
  /** Radial spark burst when a run is won. */
  sparkCount: 28,
  /** Share of the particles that remain when Reduce motion is on (confetti is skipped entirely). */
  reducedParticleShare: 0.4,
  confettiShapes: ['rect', 'dot', 'star', 'ribbon'] as readonly string[],
  confettiColors: ['#ffd23f', '#ff4d6d', '#5a3df0', '#3ee0ff', '#5ee59a'] as readonly string[],
} as const;
