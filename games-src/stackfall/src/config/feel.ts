// Visual feel numbers: shake, particles, banners, flashes, tweens. Render-only.
export const feel = {
  maxShards: 600,
  shardLife: { min: 0.5, spread: 0.6 },
  bannerSeconds: 1.6,
  maxBanners: 3,
  flashSeconds: 0.35,
  flashAlpha: 0.7,
  flashMinGapSeconds: 0.34, // at most 3 luminance flashes per second
  softFlashSeconds: 0.2, // reduced motion: outline pulse, no fill
  lockFlashSeconds: 0.08,
  dissolveSeconds: 0.15,
  stashTweenSeconds: 0.12,
  garbagePulseSeconds: 0.25,
  shakeDecayPerSecond: 40,
  hardDropShake: { base: 2, perRow: 0.3, max: 10 },
  quadShake: 12,
  reducedParticleScale: 0.4,
  dangerRows: 6, // any filled cell in the top this-many visible rows
  ultraWarnSeconds: 10,
  newBestFlashSeconds: 1.2,
  resultDelayMs: 900, // pause on the final board before the result card
  resultGraceMs: 700, // result card buttons ignore input this long
  resultQuietMs: 450, // ...and stay locked while the player is still mashing keys
  resultMaxHoldMs: 3000, // but never longer than this in total
  coachSeconds: 3,
} as const;

export type ParticleLevel = 'off' | 'low' | 'full';
export const PARTICLE_SCALE: Readonly<Record<ParticleLevel, number>> = { off: 0, low: 0.4, full: 1 };
