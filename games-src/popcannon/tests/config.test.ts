import { describe, expect, it } from 'vitest';
import { DEFAULT_TUNING, TUNING, TuningSchema } from '../src/config';
import { arcadeDifficulty } from '../src/rules';

describe('tuning config', () => {
  it('defaults parse and are frozen', () => {
    expect(TuningSchema.safeParse(DEFAULT_TUNING).success).toBe(true);
    expect(Object.isFrozen(TUNING)).toBe(true);
    expect(Object.isFrozen(TUNING.ball)).toBe(true);
  });
  it('rejects unknown keys, negatives and non-numbers', () => {
    expect(TuningSchema.safeParse({ ...DEFAULT_TUNING, extra: 1 }).success).toBe(false);
    expect(TuningSchema.safeParse({ ...DEFAULT_TUNING, ball: { speed: -1, substep: 4 } }).success).toBe(false);
    expect(TuningSchema.safeParse({ ...DEFAULT_TUNING, ball: { speed: 'fast', substep: 4 } }).success).toBe(false);
  });
  it('keeps the original arcade curve values', () => {
    expect(arcadeDifficulty(1)).toEqual({ colors: 3, rows: 4, dropEvery: 8, specials: false });
    expect(arcadeDifficulty(3).specials).toBe(true);
    expect(arcadeDifficulty(99)).toEqual({ colors: 6, rows: 8, dropEvery: 3, specials: true });
  });
  it('keeps the shipped gameplay constants', () => {
    expect(TUNING.ball.speed).toBe(640);
    expect(TUNING.aim.turnRate).toBe(1.7);
    expect(TUNING.specials.bomb).toBe(0.06);
    expect(TUNING.rush.seconds).toBe(90);
  });
});
