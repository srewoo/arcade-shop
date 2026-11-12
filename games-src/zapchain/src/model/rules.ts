// Pure rule helpers: level parameters, scoring and the opening board. No DOM.
import { CONFIG } from '../config';
import type { Rng } from '../rng';
import type { Kind, LevelParams } from './types';

const L = CONFIG.level;

export function levelParams(level: number): LevelParams {
  const lv = Math.max(1, Math.floor(level));
  return {
    level: lv,
    maxRows: Math.min(lv + L.startRowsBase, L.maxStartRows),
    colours: Math.min(lv + L.coloursBase, L.maxColours),
    seconds: L.secondsBase + lv * L.secondsPerLevel,
    target: lv * L.targetPerLevel + L.targetBase,
    spawnInterval: Math.max(L.minSpawnInterval, L.spawnIntervalBase - (lv + 2) * L.spawnIntervalPerLevel),
    bombs: lv >= L.bombFromLevel,
  };
}

/** Superlinear: 2^n for an n-disc zap (exponent capped so the score stays displayable). */
export const zapPoints = (n: number): number => (n <= 0 ? 0 : 2 ** Math.min(n, CONFIG.score.exponentCap));

/** Time bonus on a level clear: more for finishing with more of the clock left. */
export function levelBonus(level: number, remainingSec: number, durationSec: number): number {
  if (durationSec <= 0) return 0;
  const frac = Math.min(1, Math.max(0, remainingSec / durationSec));
  return Math.floor(level * CONFIG.score.levelBonusPerLevel * frac);
}

/** Opening column heights: 1..maxRows discs per column. */
export function openingHeights(rng: Rng, p: LevelParams): number[] {
  const out: number[] = [];
  for (let c = 0; c < CONFIG.grid.cols; c++) out.push(rng.int(1, p.maxRows));
  return out;
}

export const randomColour = (rng: Rng, p: LevelParams): Kind => (rng.int(1, p.colours)) as Kind;

/** Kind for a new feeder disc: usually a colour, sometimes a bomb from level 2. */
export function feederKind(rng: Rng, p: LevelParams): Kind {
  if (p.bombs && rng.chance(L.bombChance)) return 6;
  return randomColour(rng, p);
}
