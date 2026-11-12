// Per-round difficulty and the rating ladder. Pure functions of the round number.
import { CONFIG } from './config';

export type Mode = 'campaign' | 'practice';

export interface RoundParams {
  readonly round: number;
  readonly mode: Mode;
  readonly clays: number;
  /** Multiplier on flight time (< 1 is faster). */
  readonly flightScale: number;
  /** Max wind in fractions of world width per second squared. */
  readonly windMax: number;
  /** Seconds on the clock (0 = no limit). */
  readonly timeSec: number;
  readonly passHits: number;
  readonly miniChance: number;
  readonly goldChance: number;
  readonly doubleWeight: number;
  readonly crossWeight: number;
  /** Pellet spread radius in world units. */
  readonly spread: number;
}

export function roundParams(round: number, mode: Mode = 'campaign'): RoundParams {
  const { round: r, clay, mix, wind, gun } = CONFIG;
  const n = Math.max(1, Math.floor(round));
  const early = n - 1;
  const campaign = mode === 'campaign';
  return {
    round: n,
    mode,
    clays: r.clays,
    flightScale: Math.max(clay.speedFloor, 1 - clay.speedStep * early),
    windMax: campaign && n >= wind.from ? Math.min(wind.max, (n - wind.from + 1) * wind.perRound) : 0,
    timeSec: campaign ? Math.max(r.minTimeSec, r.baseTimeSec - r.timeStepSec * early) : 0,
    passHits: campaign ? Math.min(r.passMax, r.passBase + Math.floor(early / r.passEvery)) : 0,
    miniChance: n >= mix.miniFrom ? Math.min(mix.miniMax, 0.08 * (n - mix.miniFrom + 1)) : 0,
    goldChance: n >= mix.goldFrom ? mix.goldChance : 0,
    doubleWeight: n >= mix.doubleFrom ? mix.doubleWeight : 0,
    crossWeight: n >= mix.crossFrom ? mix.crossWeight : 0,
    spread: Math.max(gun.minSpread, gun.spread - gun.spreadHardStep * early),
  };
}

export interface Rating {
  readonly id: 'perfect' | 'ace' | 'marksman' | 'sporting' | 'novice' | 'bystander';
  readonly min: number;
}

/** Descending thresholds as a fraction of the clays in the round. */
const LADDER: readonly { id: Rating['id']; frac: number }[] = [
  { id: 'perfect', frac: 1 },
  { id: 'ace', frac: 0.88 },
  { id: 'marksman', frac: 0.72 },
  { id: 'sporting', frac: 0.56 },
  { id: 'novice', frac: 0.36 },
  { id: 'bystander', frac: 0 },
];

export function ratingFor(hits: number, total: number): Rating['id'] {
  const share = total > 0 ? hits / total : 0;
  const found = LADDER.find((l) => share >= l.frac - 1e-9);
  return (found ?? LADDER[LADDER.length - 1]!).id;
}
