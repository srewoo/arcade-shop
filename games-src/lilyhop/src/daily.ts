// Daily puzzle: a seeded scramble of a classic or two-gap line. The scramble is a state
// reachable from the standard start that can still be solved, so every seed is playable.
import type { BoardSpec } from './board';
import { CONFIG } from './config';
import { lineSpec } from './levels';
import { createRng, hashString } from './rng';
import { buildSolver } from './solver';

export const dailyKey = (d: Date): string =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export interface DailyPuzzle {
  readonly date: string;
  readonly spec: BoardSpec;
}

export function generateDaily(date: string): DailyPuzzle {
  const rng = createRng(hashString(`lilyhop:${date}`));
  const n = rng.pick(CONFIG.daily.sizes);
  const gaps = rng.pick(CONFIG.daily.gaps);
  const base = lineSpec(`daily-${date}`, n, gaps);
  const candidates = buildSolver(base)
    .solvable()
    .filter(([, d]) => d >= CONFIG.daily.minDistance)
    .map(([state]) => state)
    .sort();
  const start = candidates.length > 0 ? rng.pick(candidates) : base.start;
  return { date, spec: { ...base, start } };
}
