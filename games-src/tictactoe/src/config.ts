// Single home for gameplay tuning. Validated and frozen at load; tests import
// the same object so defaults stay in lockstep. CSS timings are exported to
// custom properties by ui/appearance.ts.
import * as z from 'zod/mini';

const ms = z.int().check(z.gte(0), z.lte(10_000));
const rate = z.number().check(z.gte(0), z.lte(1));
const count = z.int().check(z.gte(1), z.lte(1000));

const ConfigSchema = z.strictObject({
  cpu: z.strictObject({
    /** Pause before the CPU answers, so the move reads as a reply. */
    delayMs: ms,
    /** Chance that Medium plays the best move (otherwise random) after win/block checks. */
    mediumBestRate: rate,
    /** Same for the "Hard" tier (mistake rate = 1 - this). */
    strongBestRate: rate,
  }),
  ai: z.strictObject({ vanishDepth: count }),
  rules: z.strictObject({ vanishLimit: count, vanishMoveCap: count, vanishWarnAt: count }),
  audio: z.strictObject({
    masterGain: rate,
    xGain: rate,
    oGain: rate,
    cueGain: rate,
    defaultVolume: z.int().check(z.gte(0), z.lte(100)),
  }),
  fx: z.strictObject({
    drawMs: ms,
    strokeStaggerMs: ms,
    strikeMs: ms,
    vanishMs: ms,
    shakeMs: ms,
    confettiCount: z.int().check(z.gte(0), z.lte(60)),
    confettiMs: ms,
    startMessageMs: ms,
  }),
  ui: z.strictObject({ confirmResetMs: ms, confirmNewRoundMs: ms, pulseMs: ms, resultDelayMs: ms }),
  stats: z.strictObject({ milestones: z.array(count) }),
});
export type Config = z.infer<typeof ConfigSchema>;

const RAW: Config = {
  cpu: { delayMs: 380, mediumBestRate: 0.5, strongBestRate: 0.85 },
  ai: { vanishDepth: 8 },
  rules: { vanishLimit: 3, vanishMoveCap: 60, vanishWarnAt: 50 },
  audio: { masterGain: 0.5, xGain: 0.12, oGain: 0.2, cueGain: 0.18, defaultVolume: 70 },
  fx: {
    drawMs: 220, strokeStaggerMs: 120, strikeMs: 350, vanishMs: 150, shakeMs: 160,
    confettiCount: 14, confettiMs: 900, startMessageMs: 1200,
  },
  ui: { confirmResetMs: 3000, confirmNewRoundMs: 2000, pulseMs: 900, resultDelayMs: 250 },
  stats: { milestones: [3, 5, 10] },
};

function deepFreeze<T>(value: T): T {
  if (typeof value === 'object' && value !== null) {
    Object.values(value).forEach(deepFreeze);
    Object.freeze(value);
  }
  return value;
}

export const CONFIG: Readonly<Config> = deepFreeze(z.parse(ConfigSchema, RAW));
