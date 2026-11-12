// Impact feel: shake, hit-stop and the big strike flourish. Render-side only: none of it
// feeds back into the physics, so determinism is untouched.
import type { AudioEngine } from './audio';
import { HEAD_Y } from './constants';
import { burst, ring, type ParticleSystem } from './particles';
import { project, type Camera } from './project';
import type { Rng } from './rng';
import { TUNING } from './tuning';
import type { SimEvent } from './worldTypes';

export interface Juice {
  shake: number;
  /** Seconds of render-only freeze left. */
  hitStop: number;
  contacted: boolean;
  /** The launched shot will clear every standing pin. */
  predictedClear: boolean;
}

export const createJuice = (): Juice => ({ shake: 0, hitStop: 0, contacted: false, predictedClear: false });

export function resetForThrow(j: Juice, predictedClear: boolean): void {
  j.contacted = false;
  j.hitStop = 0;
  j.predictedClear = predictedClear;
}

export function decayJuice(j: Juice, dt: number): void {
  j.shake = Math.max(0, j.shake - dt * TUNING.juice.shakeDecay);
}

export interface FxContext {
  readonly particles: ParticleSystem;
  readonly rng: Rng;
  readonly cam: Camera;
  readonly audio: AudioEngine;
  readonly reduced: boolean;
}

/** Big burst, ring flash and a shake pulse where the ball meets the rack. */
export function strikeFlourish(j: Juice, fx: FxContext): void {
  const p = project(fx.cam, 0, HEAD_Y + 20, 14);
  burst(fx.particles, fx.rng, p.sx, p.sy, 600, p.s, true);
  ring(fx.particles, p.sx, p.sy, Math.max(60, p.s * 70), '#fff4c2');
  ring(fx.particles, p.sx, p.sy, Math.max(90, p.s * 120), '#ff5cae');
  ring(fx.particles, p.sx, p.sy, Math.max(120, p.s * 170), '#4dd8ff');
  if (!fx.reduced) j.shake = Math.min(1, Math.max(j.shake, TUNING.juice.strikeShake));
}

/** Handle one physics contact event: sound, sparks, shake, and hit-stop on the first strike. */
export function onImpact(j: Juice, fx: FxContext, e: SimEvent): void {
  fx.audio.clatter(e.strength);
  const p = project(fx.cam, e.x, e.y, 12);
  burst(fx.particles, fx.rng, p.sx, p.sy, e.strength, p.s);
  if (!fx.reduced) j.shake = Math.min(1, j.shake + e.strength * TUNING.juice.shakePerStrength);
  if (e.kind === 'ballPin' && !j.contacted) {
    j.contacted = true;
    if (!fx.reduced) j.hitStop = TUNING.timing.hitStopS;
    if (j.predictedClear) strikeFlourish(j, fx);
  }
}

/** A ball that drops into the gutter: dust puff and a small thump (nothing under reduced motion except the puff). */
export function gutterThud(j: Juice, fx: FxContext, x: number, y: number): void {
  const p = project(fx.cam, x, Math.min(y, HEAD_Y), 4);
  burst(fx.particles, fx.rng, p.sx, p.sy, 220, p.s);
  if (!fx.reduced) j.shake = Math.min(1, Math.max(j.shake, TUNING.juice.gutterShake));
}
