import { describe, it, expect } from 'vitest';
import {
  MODES, MODE_ORDER, CLASSIC_BEST_KEY, parseMode, cycleMode, modeFromKey, speedParams, parseBest,
  effectiveRules, hitOutcome, timeRemaining, formatClock,
} from '../modes.js';

describe('mode table', () => {
  it('keeps Classic identical to the original tuning, storage key and leaderboard board', () => {
    expect(MODES.classic).toMatchObject({ startSpeed: 13, maxSpeed: 31, accel: 0.2, onHit: 'crash', board: 'dino', bestKey: CLASSIC_BEST_KEY });
    expect(CLASSIC_BEST_KEY).toBe('dino-run-locked-in:best');
  });
  it('uses the requested leaderboard ids and none for Zen', () => {
    expect(MODES.hardcore.board).toBe('dino:hardcore');
    expect(MODES.timeattack.board).toBe('dino:timeattack');
    expect(MODES.zen.board).toBeNull();
  });
  it('gives every mode its own best-score key', () => {
    expect(new Set(MODE_ORDER.map((id) => MODES[id].bestKey)).size).toBe(4);
  });
  it('makes Hardcore faster than Classic and Time Attack 60 s', () => {
    expect(MODES.hardcore.startSpeed).toBeGreaterThan(MODES.classic.startSpeed);
    expect(MODES.hardcore.accel).toBeGreaterThan(MODES.classic.accel);
    expect(MODES.timeattack.timeLimit).toBe(60);
  });
  it('has no Shield pickups in Hardcore (one hit ends the run)', () => {
    expect(MODES.hardcore.pickups).not.toContain('shield');
  });
});

describe('mode selection', () => {
  it('falls back to classic for unknown ids, including prototype keys', () => {
    expect(parseMode('zen')).toBe('zen');
    for (const v of ['nope', '', null, undefined, 3, '__proto__', 'constructor']) expect(parseMode(v)).toBe('classic');
  });
  it('cycles with wrap-around', () => {
    expect(cycleMode('classic', 1)).toBe('hardcore');
    expect(cycleMode('classic', -1)).toBe('timeattack');
    expect(cycleMode('timeattack', 1)).toBe('classic');
  });
  it('maps number keys 1-4 and ignores others', () => {
    expect(modeFromKey('Digit1')).toBe('classic');
    expect(modeFromKey('Digit4')).toBe('timeattack');
    expect(modeFromKey('Numpad3')).toBe('zen');
    expect(modeFromKey('Digit5')).toBeNull();
    expect(modeFromKey('KeyA')).toBeNull();
    expect(modeFromKey(undefined)).toBeNull();
  });
});

describe('rules', () => {
  it('scales speeds by the difficulty multiplier', () => {
    expect(speedParams('classic', 1)).toEqual({ start: 13, max: 31, accel: 0.2 });
    const hard = speedParams('hardcore', 1.15);
    expect(hard.start).toBeCloseTo(17 * 1.15);
    expect(hard.max).toBeCloseTo(36 * 1.15);
  });
  it('keeps Classic free of power-ups and new obstacles unless Classic Plus is on', () => {
    expect(effectiveRules('classic', { powerups: true, classicPlus: false })).toMatchObject({ powerups: false, newObstacles: false });
    expect(effectiveRules('classic', { powerups: false, classicPlus: true })).toMatchObject({ powerups: true, newObstacles: true });
  });
  it('lets the power-ups setting control the other modes, which always get new obstacles', () => {
    expect(effectiveRules('zen', { powerups: false })).toMatchObject({ powerups: false, newObstacles: true });
    expect(effectiveRules('hardcore', { powerups: true })).toMatchObject({ powerups: true, newObstacles: true });
  });
  it('resolves hits per mode', () => {
    expect(hitOutcome('classic')).toBe('crash');
    expect(hitOutcome('hardcore')).toBe('crash');
    expect(hitOutcome('timeattack')).toBe('crash');
    expect(hitOutcome('zen')).toBe('stumble');
    expect(hitOutcome('classic', { shield: true })).toBe('shield');
    expect(hitOutcome('zen', { shield: true })).toBe('shield');
    expect(hitOutcome('classic', { invulnerable: true, shield: true })).toBe('ignore');
  });
});

describe('countdown and best parsing', () => {
  it('counts down and clamps at zero', () => {
    expect(timeRemaining(60, 0)).toBe(60);
    expect(timeRemaining(60, 12.5)).toBeCloseTo(47.5);
    expect(timeRemaining(60, 75)).toBe(0);
    expect(timeRemaining(0, 100)).toBe(Infinity);
  });
  it('formats the clock', () => {
    expect(formatClock(60)).toBe('1:00');
    expect(formatClock(59.2)).toBe('1:00');
    expect(formatClock(9)).toBe('0:09');
    expect(formatClock(-3)).toBe('0:00');
  });
  it('parses stored bests defensively', () => {
    expect(parseBest('1234')).toBe(1234);
    for (const v of [null, undefined, '', 'abc', '-5', 'NaN', '0']) expect(parseBest(v)).toBe(0);
    expect(parseBest('9'.repeat(30))).toBeLessThanOrEqual(99999999);
  });
});
