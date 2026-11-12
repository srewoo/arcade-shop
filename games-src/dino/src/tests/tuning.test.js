import { describe, it, expect } from 'vitest';
import { TUNING } from '../config.js';
import { MODES, speedParams, effectiveRules } from '../modes.js';
import { CLASSIC, GATES, SKIN_UNLOCKS } from '../tuning.js';
import { SKINS } from '../skins.js';
import { WEATHER_COUNTS, WEATHER_FACTORS } from '../tuning.js';
import { particleBudget } from '../world/weatherModes.js';

describe('Classic fidelity guard', () => {
  it('derives Classic from the original TUNING table (never a second literal)', () => {
    expect(CLASSIC).toEqual({ startSpeed: TUNING.startSpeed, maxSpeed: TUNING.maxSpeed, accel: TUNING.accel });
    expect(MODES.classic.startSpeed).toBe(TUNING.startSpeed);
    expect(MODES.classic.maxSpeed).toBe(TUNING.maxSpeed);
    expect(MODES.classic.accel).toBe(TUNING.accel);
    expect(TUNING).toMatchObject({ startSpeed: 13, maxSpeed: 31, accel: 0.2, crashToGameOver: 2 }); // the original numbers
  });
  it('Classic on Normal runs at exactly the original speeds', () => {
    expect(speedParams('classic', 1)).toEqual({ start: 13, max: 31, accel: 0.2 });
  });
  it('Classic with Classic Plus off has no gates, no breathers and no new obstacles or pickups', () => {
    const r = effectiveRules('classic', { powerups: true, classicPlus: false }, 1);
    expect(r).toMatchObject({ powerups: false, newObstacles: false, gates: null, breather: null });
  });
});

describe('tuning tables', () => {
  it('keeps the skin thresholds in tuning.js', () => {
    expect(SKINS.filter((s) => s.unlock > 0).map((s) => s.unlock)).toEqual(Object.values(SKIN_UNLOCKS));
  });
  it('keeps the weather particle counts in tuning.js', () => {
    expect(particleBudget('snow', 'high').count).toBe(WEATHER_COUNTS.snow.high);
    expect(particleBudget('rain', 'low', { mobile: true, reduced: true }).count).toBe(
      Math.round(WEATHER_COUNTS.rain.low * WEATHER_FACTORS.mobileCount * WEATHER_FACTORS.reducedCount),
    );
  });
  it('orders the new-obstacle gates boulder < log < meteor', () => {
    expect(GATES.boulder.atS).toBeLessThan(GATES.log.atS);
    expect(GATES.log.atS).toBeLessThan(GATES.meteor.atS);
  });
});
