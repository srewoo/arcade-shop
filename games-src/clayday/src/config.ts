// Single home for gameplay tuning. Validated and frozen at load; tests import
// the same object so defaults stay in lockstep. CSS timings are exported to
// custom properties by ui/appearance.ts.
import * as z from 'zod/mini';

const num = (lo: number, hi: number) => z.number().check(z.gte(lo), z.lte(hi));
const int = (lo: number, hi: number) => z.int().check(z.gte(lo), z.lte(hi));

const ConfigSchema = z.strictObject({
  sim: z.strictObject({ step: num(1 / 240, 1 / 20), maxCatchUp: int(1, 20), maxFrame: num(0.02, 0.5) }),
  world: z.strictObject({
    minW: int(300, 2000), maxW: int(300, 2000), minH: int(300, 2000), maxH: int(300, 2000),
    /** Aspect at/above which the world is maxW wide, and at/below which it is minW wide. */
    wideAspect: num(0.8, 3), tallAspect: num(0.3, 1.2),
    /** Arc heights are measured against min(h, arcRatio * w). */
    arcRatio: num(0.3, 1),
    launchY: num(0.4, 0.9), houseX: num(0.02, 0.2), groundDrop: num(0, 0.2),
  }),
  round: z.strictObject({
    clays: int(5, 100), readyMs: int(0, 5000), baseTimeSec: int(20, 300), timeStepSec: int(0, 10), minTimeSec: int(20, 300),
    passBase: int(1, 100), passEvery: int(1, 10), passMax: int(1, 100),
  }),
  gun: z.strictObject({
    shells: int(1, 6), reloadMs: int(100, 5000), pelletDelayMs: int(0, 500), spread: num(0, 100),
    spreadHardStep: num(0, 10), minSpread: num(0, 100), kbSpeed: num(100, 3000),
  }),
  clay: z.strictObject({
    radius: num(8, 80), miniScale: num(0.3, 1), flightMin: num(0.8, 6), flightMax: num(0.8, 6),
    speedStep: num(0, 0.2), speedFloor: num(0.3, 1),
    apexMin: num(0.1, 1), apexMax: num(0.1, 1), rangeMin: num(0.1, 1), rangeMax: num(0.1, 1),
    margin: num(0, 0.2),
  }),
  mix: z.strictObject({
    miniFrom: int(1, 99), miniMax: num(0, 1), goldFrom: int(1, 99), goldChance: num(0, 1),
    doubleFrom: int(1, 99), doubleWeight: num(0, 1), crossFrom: int(1, 99), crossWeight: num(0, 1),
  }),
  pace: z.strictObject({ gapMinMs: int(0, 5000), gapMaxMs: int(0, 5000), staggerMs: int(0, 2000) }),
  wind: z.strictObject({ from: int(1, 99), perRound: num(0, 0.1), max: num(0, 0.3), kmhPerUnit: num(1, 1000), gust: num(0, 1) }),
  score: z.strictObject({
    hit: int(0, 10_000), miniBonus: int(0, 10_000), goldBonus: int(0, 10_000), doubleBonus: int(0, 10_000),
    comboStep: num(0, 2), comboMax: num(1, 10), timeBonusPerSec: int(0, 1000), perfectBonus: int(0, 100_000),
    shellBonus: int(0, 1000),
  }),
  audio: z.strictObject({ masterGain: num(0, 1), defaultVolume: int(0, 100) }),
  fx: z.strictObject({
    fragments: int(0, 60), puffs: int(0, 60), shakePx: num(0, 30), shakeMs: int(0, 2000), flashMs: int(0, 2000),
    floatMs: int(0, 5000), recoilMs: int(0, 2000), maxParticles: int(10, 1000), reducedFactor: num(0, 1),
  }),
});
export type Config = z.infer<typeof ConfigSchema>;

const RAW: Config = {
  sim: { step: 1 / 60, maxCatchUp: 5, maxFrame: 0.1 },
  world: {
    minW: 600, maxW: 1000, minH: 450, maxH: 1100, wideAspect: 1.3, tallAspect: 0.65, arcRatio: 0.62,
    launchY: 0.7, houseX: 0.075, groundDrop: 0.04,
  },
  round: {
    clays: 25, readyMs: 1600, baseTimeSec: 62, timeStepSec: 2, minTimeSec: 46,
    passBase: 15, passEvery: 2, passMax: 21,
  },
  gun: {
    shells: 2, reloadMs: 850, pelletDelayMs: 110, spread: 15, spreadHardStep: 0.8, minSpread: 9, kbSpeed: 650,
  },
  clay: {
    radius: 26, miniScale: 0.62, flightMin: 2.0, flightMax: 2.7, speedStep: 0.045, speedFloor: 0.6,
    apexMin: 0.35, apexMax: 0.6, rangeMin: 0.4, rangeMax: 0.8, margin: 0.035,
  },
  mix: {
    miniFrom: 2, miniMax: 0.25, goldFrom: 3, goldChance: 0.08,
    doubleFrom: 1, doubleWeight: 0.28, crossFrom: 2, crossWeight: 0.24,
  },
  pace: { gapMinMs: 650, gapMaxMs: 1100, staggerMs: 300 },
  wind: { from: 3, perRound: 0.012, max: 0.075, kmhPerUnit: 200, gust: 0.5 },
  score: {
    hit: 100, miniBonus: 50, goldBonus: 150, doubleBonus: 150, comboStep: 0.25, comboMax: 3,
    timeBonusPerSec: 10, perfectBonus: 500, shellBonus: 0,
  },
  audio: { masterGain: 0.5, defaultVolume: 70 },
  fx: {
    fragments: 12, puffs: 8, shakePx: 6, shakeMs: 160, flashMs: 90, floatMs: 900, recoilMs: 220,
    maxParticles: 400, reducedFactor: 0.4,
  },
};

function deepFreeze<T>(value: T): T {
  if (typeof value === 'object' && value !== null) {
    Object.values(value).forEach(deepFreeze);
    Object.freeze(value);
  }
  return value;
}

export const CONFIG: Readonly<Config> = deepFreeze(z.parse(ConfigSchema, RAW));
