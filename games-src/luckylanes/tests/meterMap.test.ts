import { describe, expect, it } from 'vitest';
import { MAX_AIM } from '../src/constants';
import {
  aimFromBar, aimToBar, perfectZoneU, pocketCall, spinFromBar, spinToBar, strikeWindowSeconds,
} from '../src/meterMap';
import { TUNING } from '../src/tuning';

describe('meter mapping', () => {
  it('is odd, monotonic and reaches the ends', () => {
    for (const assist of [false, true]) {
      expect(aimFromBar(0, assist)).toBe(0);
      expect(aimFromBar(1, assist)).toBeCloseTo(MAX_AIM);
      expect(aimFromBar(-1, assist)).toBeCloseTo(-MAX_AIM);
      expect(spinFromBar(1, assist)).toBe(1);
      let prev = -Infinity;
      for (let u = -1; u <= 1; u += 0.05) {
        const a = aimFromBar(u, assist);
        expect(a).toBeGreaterThanOrEqual(prev);
        expect(aimFromBar(-u, assist)).toBeCloseTo(-a);
        prev = a;
      }
    }
  });
  it('clamps out-of-range bar positions', () => {
    expect(aimFromBar(5)).toBeCloseTo(MAX_AIM);
    expect(spinFromBar(-5)).toBe(-1);
  });
  it('inverse functions round-trip', () => {
    for (const assist of [false, true]) {
      for (let u = -1; u <= 1; u += 0.1) {
        expect(aimToBar(aimFromBar(u, assist), assist)).toBeCloseTo(u, 6);
        expect(spinToBar(spinFromBar(u, assist), assist)).toBeCloseTo(u, 6);
      }
    }
  });
  it('keeps the whole strike band inside the perfect zone', () => {
    for (const assist of [false, true]) {
      const z = perfectZoneU(assist);
      expect(aimFromBar(z, assist)).toBeCloseTo(TUNING.meters.strikeBandRad, 9);
      expect(aimFromBar(z * 0.99, assist)).toBeLessThan(TUNING.meters.strikeBandRad);
    }
  });
  it('widens the strike window in time versus the old linear meter (about 65 ms)', () => {
    const oldLinear = (2 * TUNING.meters.strikeBandRad) / (MAX_AIM * 4 * 0.5);
    expect(oldLinear).toBeCloseTo(0.0667, 3);
    const now = strikeWindowSeconds(false);
    const wide = strikeWindowSeconds(true);
    expect(now).toBeGreaterThan(oldLinear * 4);
    expect(wide).toBeGreaterThan(now * 1.5);
    expect(wide / now).toBeLessThan(2.2);
  });
  it('judges the head-pin crossing as pocket, nice or neither', () => {
    const p = TUNING.meters.pocketX;
    expect(pocketCall(p)).toBe('pocket');
    expect(pocketCall(-p + 2)).toBe('pocket');
    expect(pocketCall(p + TUNING.meters.pocketWindowCm * 1.5)).toBe('nice');
    expect(pocketCall(0)).toBeNull();
    expect(pocketCall(40)).toBeNull();
  });
});
