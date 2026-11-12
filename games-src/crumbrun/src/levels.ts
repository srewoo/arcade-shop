// Level tuning curve and maze/theme selection. Pure. Numbers come from config/tuning.ts.
import { TUNING } from './config/tuning';

export type Modifier = 'none' | 'fastCats' | 'darkKitchen' | 'quickRelease';
const MODIFIER_CYCLE: readonly Modifier[] = ['fastCats', 'darkKitchen', 'quickRelease'];

export interface Tuning {
  readonly pipSpeed: number; // tiles per second
  readonly catSpeed: number;
  readonly drenchSec: number;
  readonly releaseDelays: readonly number[]; // seconds until each cat leaves the basket
  readonly cheeseSec: number;
  readonly pounceMult: number;
  readonly graceSec: number; // opening seconds Smudge spends heading for its corner
  readonly modifier: Modifier;
}

export const MAZE_COUNT = TUNING.mazeCount;
export const THEME_COUNT = TUNING.themeCount;
export const MIN_DRENCH_SEC = TUNING.drench.minSec;

export function modifierFor(level: number): Modifier {
  const n = Math.floor(level) - TUNING.modifiers.startLevel;
  return n < 0 ? 'none' : (MODIFIER_CYCLE[n % MODIFIER_CYCLE.length] as Modifier);
}

export function tuning(level: number): Tuning {
  const l = Math.max(1, Math.floor(level)) - 1;
  const { speed, drench, release, opening, pounce, modifiers } = TUNING;
  const modifier = modifierFor(level);
  const shrink = Math.max(release.minShrink, 1 - release.shrinkPerLevel * l);
  const quick = modifier === 'quickRelease' ? modifiers.quickReleaseMult : 1;
  const catMult = modifier === 'fastCats' ? modifiers.fastCatsMult : 1;
  return {
    pipSpeed: Math.min(speed.pipCap, speed.pipBase + speed.pipPerLevel * l),
    catSpeed: Math.min(speed.catCap, speed.catBase + speed.catPerLevel * l) * catMult,
    drenchSec: Math.max(drench.minSec, drench.baseSec - drench.perLevel * l),
    releaseDelays: release.base.map((d) => d * shrink * quick),
    cheeseSec: TUNING.cheeseSec,
    pounceMult: l < pounce.earlyLevels ? pounce.multEarly : pounce.multLate,
    graceSec: Math.max(0, opening.graceSec - opening.gracePerLevel * l),
    modifier,
  };
}

export function mazeIndex(level: number): number {
  return (Math.max(1, level) - 1) % MAZE_COUNT;
}

/** The same maze comes back in a different colourway on each lap. */
export function themeIndex(level: number): number {
  const l = Math.max(1, level) - 1;
  return (l + Math.floor(l / MAZE_COUNT)) % THEME_COUNT;
}
