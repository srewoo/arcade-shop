// How much movement and flashing the player has asked for. Pure, so it is testable.
import { feel, PARTICLE_SCALE } from '../config/feel';
import type { Settings } from '../settings';

export interface MotionProfile {
  shake: boolean;
  flash: 'full' | 'outline' | 'off'; // outline = no luminance change (reduced motion)
  particleScale: number; // 0..1 of the normal particle count
  tweens: boolean; // dissolves, stash slide, banner pop, pulses, drifting motes
}

export type MotionInput = Pick<Settings, 'shake' | 'flashes' | 'particles'>;

export function motionProfile(s: MotionInput, reduced: boolean): MotionProfile {
  const cap = reduced ? feel.reducedParticleScale : 1;
  return {
    shake: s.shake && !reduced,
    flash: !s.flashes ? 'off' : reduced ? 'outline' : 'full',
    particleScale: Math.min(PARTICLE_SCALE[s.particles], cap),
    tweens: !reduced,
  };
}

/** Reduced motion is on when forced, or when set to follow the system and the system asks for it. */
export const isReduced = (mode: Settings['reducedMotion'], systemPrefers: boolean): boolean =>
  mode === 'on' || (mode === 'system' && systemPrefers);
