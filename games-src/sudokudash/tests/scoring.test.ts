import { describe, expect, it } from 'vitest';
import {
  DASH, classicScore, dashCorrect, dashFinishBonus, dashHint, dashMistake, dashStart, dashTick, formatClock,
  formatElapsed, formatSeconds, isTimeUp, isLowTime, comboWindowLeft, nextCombo,
} from '../src/core/scoring';

describe('Dash timer maths', () => {
  it('starts with the per-difficulty countdown and ticks down to zero', () => {
    const s = dashStart('hard');
    expect(s.timeLeftMs).toBe(280_000);
    expect(dashTick(s, 1500).timeLeftMs).toBe(278_500);
    expect(dashTick(s, 999_999).timeLeftMs).toBe(0);
    expect(isTimeUp(dashTick(s, 999_999))).toBe(true);
    expect(isTimeUp(s)).toBe(false);
  });

  it('adds time and points per correct placement', () => {
    const a = dashCorrect(dashStart('easy'), 1000, 'easy');
    expect(a.seconds).toBe(DASH.gainSeconds.easy);
    expect(a.state.timeLeftMs).toBe(223_000);
    expect(a.points).toBe(50);
    expect(a.combo).toBe(1);
  });

  it('grows the combo for quick entries, and restarts it after a pause', () => {
    let s = dashStart('medium');
    const gains: number[] = [];
    for (let i = 0; i < 4; i++) {
      const a = dashCorrect(s, 1000 + i * 2000, 'medium');
      gains.push(a.points);
      s = a.state;
    }
    expect(gains).toEqual([75, 150, 225, 300]);
    expect(s.combo).toBe(4);
    expect(nextCombo(s, 8000 + DASH.comboWindowMs + 1)).toBe(1);
    expect(nextCombo(s, 7000 + DASH.comboWindowMs)).toBe(5);
  });

  it('caps the combo and the clock', () => {
    let s = dashStart('easy');
    for (let i = 0; i < 40; i++) s = dashCorrect(s, i * 1000, 'easy').state;
    expect(s.combo).toBe(DASH.maxCombo);
    expect(s.timeLeftMs).toBe(s.startMs * DASH.capFactor);
    expect(DASH.capFactor).toBe(1.25);
  });

  it('charges mistakes and hints, resets the combo, never goes negative', () => {
    let s = dashCorrect(dashStart('expert'), 500, 'expert').state;
    s = dashMistake(s);
    expect(s.combo).toBe(0);
    expect(s.lastCorrectAt).toBeNull();
    expect(s.timeLeftMs).toBe(285_000 + 4500 - 10_000);
    expect(dashHint(s).timeLeftMs).toBe(s.timeLeftMs - 8000);
    expect(dashMistake({ ...s, timeLeftMs: 3000 }).timeLeftMs).toBe(0);
  });

  it('pays a bonus for time left and formats clocks', () => {
    expect(dashFinishBonus({ ...dashStart('easy'), timeLeftMs: 12_900 })).toBe(120);
    expect(formatClock(61_000)).toBe('1:01');
    expect(formatClock(0)).toBe('0:00');
    expect(formatClock(59_001)).toBe('1:00');
    expect(formatElapsed(59_999)).toBe('0:59');
  });

  it('gives no finish bonus when the solver was used', () => {
    expect(dashFinishBonus({ ...dashStart('easy'), timeLeftMs: 12_900 }, true)).toBe(0);
  });

  it('flags low time and tracks the open share of the combo window', () => {
    const s = dashStart('easy');
    expect(isLowTime(s)).toBe(false);
    expect(isLowTime({ ...s, timeLeftMs: 29_000 })).toBe(true);
    const c = dashCorrect(s, 1000, 'easy').state;
    expect(comboWindowLeft(c, 1000)).toBe(1);
    expect(comboWindowLeft(c, 1000 + DASH.comboWindowMs / 2)).toBeCloseTo(0.5);
    expect(comboWindowLeft(c, 1000 + DASH.comboWindowMs * 2)).toBe(0);
    expect(comboWindowLeft(s, 0)).toBe(0);
  });

  it('formats fractional gains compactly', () => {
    expect(formatSeconds(3)).toBe('3s');
    expect(formatSeconds(3.5)).toBe('3.5s');
  });
});

describe('classic score', () => {
  it('rewards speed and cleanliness, floors at zero', () => {
    expect(classicScore('easy', 120_000, 0, 0)).toBe(1880);
    expect(classicScore('hard', 120_000, 2, 1)).toBe(4000 - 120 - 200 - 50);
    expect(classicScore('easy', 9_999_999, 9, 9)).toBe(0);
  });
});
