// How much celebration a device / setting gets (pure, unit-tested).  Reduced motion cuts every burst to zero.
import { JUICE } from './tuning.js';

/** Particles in the pickup ring burst: 0 under reduced motion, halved on quality low, x0.6 on mobile. */
export function pickupBurstCount({ reduced = false, quality = 'auto', mobile = false } = {}) {
  if (reduced) return 0;
  let n = JUICE.pickupBurst;
  if (quality === 'low') n = Math.round(n / 2);
  if (mobile) n = Math.round(n * 0.6);
  return Math.max(0, n);
}

/** Confetti pieces for a new best (0 under reduced motion, fewer on quality low / mobile). */
export function confettiCount({ reduced = false, quality = 'auto', mobile = false } = {}) {
  if (reduced) return 0;
  let n = JUICE.confettiCount;
  if (quality === 'low') n = Math.round(n / 2);
  if (mobile) n = Math.round(n * 0.7);
  return n;
}
