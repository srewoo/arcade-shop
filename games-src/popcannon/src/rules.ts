// Arcade / Time Rush rules: difficulty curve and random bubble generation.
import { TUNING } from './config';
import { Bubble, Cell, Grid, forEachBubble } from './hex';

export type Rng = () => number;

export function mulberry32(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const SPECIALS_FROM_LEVEL = TUNING.specials.fromLevel;
export const MAX_COLORS = TUNING.arcade.maxColors;

export interface Difficulty {
  readonly colors: number;
  readonly rows: number;
  /** Misses (shots that pop nothing) allowed between ceiling drops. */
  readonly dropEvery: number;
  readonly specials: boolean;
}

export function arcadeDifficulty(level: number): Difficulty {
  const a = TUNING.arcade;
  const l = Math.max(1, level) - 1;
  return {
    colors: Math.min(a.maxColors, a.baseColors + Math.floor(l / a.colorEvery)),
    rows: Math.min(a.maxRows, a.baseRows + Math.floor(l / a.rowEvery)),
    dropEvery: Math.max(a.dropMin, a.dropStart - Math.floor((l * a.dropStepSize) / a.dropLevelsPerStep)),
    specials: level >= SPECIALS_FROM_LEVEL,
  };
}

export const RUSH_DIFFICULTY: Difficulty = {
  colors: TUNING.rush.colors, rows: TUNING.rush.rows, dropEvery: TUNING.rush.dropEvery, specials: true,
};

export function randomColor(rng: Rng, palette: readonly number[]): number {
  return palette[Math.floor(rng() * palette.length)] ?? 0;
}

/** Colours still on the board, so the shooter never hands out a dead colour. */
export function colorsOnBoard(grid: Grid): number[] {
  const set = new Set<number>();
  forEachBubble(grid, (b) => {
    if (b.kind === 'normal') set.add(b.color);
  });
  return [...set];
}

export function shooterBubble(rng: Rng, palette: readonly number[], specials: boolean): Bubble {
  const roll = rng();
  if (specials && roll < TUNING.specials.bomb) return { kind: 'bomb', color: -1 };
  if (specials && roll < TUNING.specials.rainbowUpTo) return { kind: 'rainbow', color: -1 };
  return { kind: 'normal', color: randomColor(rng, palette) };
}

/** Fill callback for a new row: colours, with the odd stone from level 3. */
export function makeRowFiller(rng: Rng, d: Difficulty): (len: number) => Cell[] {
  const palette = Array.from({ length: d.colors }, (_, i) => i);
  return (len) =>
    Array.from({ length: len }, (): Cell =>
      d.specials && rng() < TUNING.specials.stone ? { kind: 'stone', color: -1 } : { kind: 'normal', color: randomColor(rng, palette) },
    );
}
