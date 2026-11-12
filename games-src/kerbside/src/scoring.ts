// Stars and points. Pure.
import { CONFIG } from './config';
import type { Level } from './levels/types';

export interface Outcome {
  readonly parked: boolean;
  readonly damage: number;
  readonly time: number;
}

export type Stars = 0 | 1 | 2 | 3;

/** One star for parking, one for a clean park (no damage), one for beating par time. */
export function starsFor(o: Outcome, level: Level): Stars {
  if (!o.parked) return 0;
  const clean = o.damage === 0 ? 1 : 0;
  const fast = o.time <= level.parTime ? 1 : 0;
  return (1 + clean + fast) as Stars;
}

export function pointsFor(o: Outcome, level: Level): number {
  if (!o.parked) return 0;
  const s = CONFIG.scoring;
  const left = Math.max(0, level.timeLimit - o.time);
  return Math.max(s.minScore, Math.round(s.base + left * s.perSecondLeft - o.damage * s.perDamage));
}

export function formatTime(seconds: number): string {
  const t = Math.max(0, seconds);
  const m = Math.floor(t / 60);
  const s = t - m * 60;
  return `${m}:${s.toFixed(1).padStart(4, '0')}`;
}

export type Tier = 'perfect' | 'good' | 'ok' | 'fail';

/** Result-card tier. Drives title, note and styling, so copy always matches the stars. */
export const tierFor = (parked: boolean, stars: number): Tier => (!parked ? 'fail' : stars >= 3 ? 'perfect' : stars === 2 ? 'good' : 'ok');

/** Why the stars were awarded (or not). Never claims more than was earned. */
export function starNote(parked: boolean, clean: boolean, fast: boolean): string {
  if (!parked) return 'No stars this time.';
  if (clean && fast) return 'Clean park and under par: full marks.';
  if (clean) return 'Clean park, but over par time.';
  if (fast) return 'Under par time, but you bumped something.';
  return 'Parked, but with bumps and over par time.';
}

/** Level-card glyphs: a dash before the first attempt, filled stars for earned, outlines for the rest. */
export const starGlyphs = (stars: number | undefined): string => (stars === undefined ? '\u2013' : '\u2605'.repeat(stars) + '\u2606'.repeat(3 - stars));
