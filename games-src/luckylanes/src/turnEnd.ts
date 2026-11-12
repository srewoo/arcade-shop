// What happens when the pins stop: score the roll, pick the banner, and cue the celebration.
import { bannerFor, type Banner } from './announce';
import type { AudioEngine } from './audio';
import { recordRoll, type Match } from './match';
import { confetti, type ParticleSystem } from './particles';
import { knockedCount, standingMask } from './physics';
import type { Rng } from './rng';
import type { World } from './worldTypes';

export interface Resolution {
  readonly match: Match;
  readonly banner: Banner | null;
}

/** Record the finished roll and decide its banner. Throws if the roll is illegal. */
export function resolveRoll(match: Match, world: World): Resolution {
  const player = match.current;
  const knocked = knockedCount(world);
  const next = recordRoll(match, standingMask(world));
  return { match: next, banner: bannerFor(next, player, knocked, world.ball.inGutter) };
}

export function celebrate(audio: AudioEngine, ps: ParticleSystem, rng: Rng, size: { w: number; h: number }, banner: Banner): void {
  const big = banner.kind === 'strike' || banner.kind === 'turkey';
  audio.jingle(banner.kind === 'turkey' ? 'turkey' : banner.kind === 'strike' ? 'strike' : banner.kind === 'spare' ? 'spare' : 'gutter');
  if (big) {
    audio.crowd();
    confetti(ps, rng, size.w, size.h);
  }
  audio.ui('pop');
}
