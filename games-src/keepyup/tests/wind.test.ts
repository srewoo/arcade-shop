import { describe, expect, it } from 'vitest';
import { CONFIG } from '../src/config';
import { createRng } from '../src/rng';
import { envelope, Wind } from '../src/wind';

describe('wind', () => {
  it('is zero when disabled', () => {
    const w = new Wind(createRng(1), false);
    expect(w.at(5)).toBe(0);
    expect(w.untilNext(5)).toBe(Infinity);
  });
  it('envelope ramps smoothly from 0 to 1 and back', () => {
    const g = { start: 10, end: 14, force: 100 };
    expect(envelope(10, g)).toBe(0);
    expect(envelope(12, g)).toBe(1);
    expect(envelope(14, g)).toBe(0);
    expect(envelope(10 + CONFIG.wind.rise / 2, g)).toBeCloseTo(0.5, 6);
  });
  it('has calm spells and gusts within configured force, gusts alternate directions over time', () => {
    const w = new Wind(createRng(11), true);
    const vals: number[] = [];
    for (let t = 0; t < 120; t += 0.25) vals.push(w.at(t));
    expect(vals.some((v) => v === 0)).toBe(true);
    expect(vals.some((v) => v > 0)).toBe(true);
    expect(vals.some((v) => v < 0)).toBe(true);
    expect(Math.max(...vals.map(Math.abs))).toBeLessThanOrEqual(CONFIG.wind.forceMax);
  });
  it('gives advance notice of the next gust', () => {
    const w = new Wind(createRng(2), true);
    expect(w.untilNext(0)).toBeGreaterThanOrEqual(CONFIG.wind.calmMin);
  });
});
