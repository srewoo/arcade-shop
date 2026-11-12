// Single home for gameplay tuning. Validated with zod at load and frozen.
import { z } from 'zod';

const pos = z.number().positive();
const int = z.number().int().nonnegative();

export const TuningSchema = z
  .object({
    ball: z.object({ speed: pos, substep: pos }).strict(),
    aim: z.object({ turnRate: pos, maxDeg: pos }).strict(),
    score: z
      .object({
        perBubble: int, groupBonus: int, groupBonusFrom: int, comboStep: z.number().nonnegative(),
        fallBase: int, arcadeClear: int, arcadeClearPerLevel: int, rushClear: int, puzzleClear: int, puzzleShot: int,
      })
      .strict(),
    specials: z.object({ bomb: pos, rainbowUpTo: pos, stone: pos, fromLevel: int, bombRadius: int }).strict(),
    arcade: z
      .object({
        maxColors: int, colorEvery: int, baseColors: int, maxRows: int, baseRows: int, rowEvery: int,
        dropStart: int, dropMin: int, dropLevelsPerStep: pos, dropStepSize: pos, dangerRow: int,
      })
      .strict(),
    rush: z
      .object({
        seconds: pos, clearBonusSeconds: z.number().nonnegative(), urgentSeconds: pos,
        colors: int, rows: int, dropEvery: int,
      })
      .strict(),
    puzzle: z.object({ twoStarSlack: z.number().min(0).max(1), queuePerPar: pos }).strict(),
    timers: z
      .object({ clearBanner: pos, resultDelayMs: int, fireBuffer: pos, hintMs: int, firstRunHintMs: int })
      .strict(),
    fx: z
      .object({
        shakeDecay: pos, shakeHz: pos, dropSlide: pos, popSeconds: pos, burst: int, burstReduced: int,
        recoilSeconds: pos, recoilPx: pos, flashSeconds: pos, trailLen: int,
      })
      .strict(),
  })
  .strict();
export type Tuning = z.infer<typeof TuningSchema>;

export const DEFAULT_TUNING = {
  ball: { speed: 640, substep: 4 },
  aim: { turnRate: 1.7, maxDeg: 80 },
  score: {
    perBubble: 10, groupBonus: 10, groupBonusFrom: 3, comboStep: 0.5, fallBase: 20,
    arcadeClear: 500, arcadeClearPerLevel: 50, rushClear: 300, puzzleClear: 500, puzzleShot: 100,
  },
  specials: { bomb: 0.06, rainbowUpTo: 0.12, stone: 0.07, fromLevel: 3, bombRadius: 2 },
  arcade: {
    maxColors: 6, colorEvery: 2, baseColors: 3, maxRows: 8, baseRows: 4, rowEvery: 2,
    dropStart: 8, dropMin: 3, dropLevelsPerStep: 3, dropStepSize: 2, dangerRow: 13,
  },
  rush: { seconds: 90, clearBonusSeconds: 3, urgentSeconds: 10, colors: 4, rows: 5, dropEvery: 7 },
  puzzle: { twoStarSlack: 0.25, queuePerPar: 1.6 },
  timers: { clearBanner: 1.8, resultDelayMs: 900, fireBuffer: 0.15, hintMs: 4500, firstRunHintMs: 9000 },
  fx: {
    shakeDecay: 14, shakeHz: 30, dropSlide: 260, popSeconds: 0.1, burst: 10, burstReduced: 4,
    recoilSeconds: 0.12, recoilPx: 4, flashSeconds: 0.04, trailLen: 6,
  },
} as const;

function deepFreeze<T>(o: T): T {
  if (typeof o === 'object' && o !== null) {
    for (const v of Object.values(o)) deepFreeze(v);
    Object.freeze(o);
  }
  return o;
}

export const TUNING: Readonly<Tuning> = deepFreeze(TuningSchema.parse(DEFAULT_TUNING));
