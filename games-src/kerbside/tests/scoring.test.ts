import { describe, expect, it } from 'vitest';
import { LEVELS } from '../src/levels';
import { formatTime, pointsFor, starsFor } from '../src/scoring';

const L = LEVELS[0]!;

describe('scoring', () => {
  it('awards no stars for a failed run', () => {
    expect(starsFor({ parked: false, damage: 0, time: 1 }, L)).toBe(0);
    expect(pointsFor({ parked: false, damage: 0, time: 1 }, L)).toBe(0);
  });
  it('gives one star for parking, one for clean, one for par time', () => {
    expect(starsFor({ parked: true, damage: 2, time: L.parTime + 5 }, L)).toBe(1);
    expect(starsFor({ parked: true, damage: 0, time: L.parTime + 5 }, L)).toBe(2);
    expect(starsFor({ parked: true, damage: 1, time: L.parTime }, L)).toBe(2);
    expect(starsFor({ parked: true, damage: 0, time: L.parTime }, L)).toBe(3);
  });
  it('rewards time left and punishes damage in points', () => {
    const fast = pointsFor({ parked: true, damage: 0, time: 10 }, L);
    const slow = pointsFor({ parked: true, damage: 0, time: 40 }, L);
    const dented = pointsFor({ parked: true, damage: 3, time: 10 }, L);
    expect(fast).toBeGreaterThan(slow);
    expect(fast).toBeGreaterThan(dented);
    expect(pointsFor({ parked: true, damage: 99, time: L.timeLimit }, L)).toBe(100);
  });
  it('formats times as m:ss.s', () => {
    expect(formatTime(0)).toBe('0:00.0');
    expect(formatTime(65.43)).toBe('1:05.4');
    expect(formatTime(-3)).toBe('0:00.0');
  });
});
