// Game modes and the seed each one uses.
import { CONFIG } from './config';
import { dailyKey } from './rng';

export type Mode = 'endless' | 'daily' | 'practice';
export const MODES: readonly Mode[] = ['endless', 'daily', 'practice'];

/** Seed key for a run. Endless draws a fresh random course; the others are fixed. */
export function seedKeyFor(mode: Mode, now: Date, rand: () => number): string {
  if (mode === 'daily') return dailyKey(now);
  if (mode === 'practice') return CONFIG.practiceSeed;
  return `endless-${Math.floor(rand() * 4294967296).toString(36)}`;
}

/** Only fixed courses can replay a ghost. */
export const hasGhost = (mode: Mode): boolean => mode !== 'endless';
