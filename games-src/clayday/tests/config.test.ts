import { describe, expect, it } from 'vitest';
import { CONFIG } from '../src/config';

describe('config', () => {
  it('is deeply frozen', () => {
    expect(Object.isFrozen(CONFIG)).toBe(true);
    expect(Object.isFrozen(CONFIG.gun)).toBe(true);
    expect(() => {
      (CONFIG.gun as { shells: number }).shells = 9;
    }).toThrow();
  });
  it('matches the design brief: 25 clays, two shells', () => {
    expect(CONFIG.round.clays).toBe(25);
    expect(CONFIG.gun.shells).toBe(2);
  });
  it('ranges are ordered', () => {
    expect(CONFIG.clay.flightMin).toBeLessThanOrEqual(CONFIG.clay.flightMax);
    expect(CONFIG.clay.apexMin).toBeLessThanOrEqual(CONFIG.clay.apexMax);
    expect(CONFIG.clay.rangeMin).toBeLessThanOrEqual(CONFIG.clay.rangeMax);
    expect(CONFIG.pace.gapMinMs).toBeLessThanOrEqual(CONFIG.pace.gapMaxMs);
    expect(CONFIG.round.minTimeSec).toBeLessThanOrEqual(CONFIG.round.baseTimeSec);
    expect(CONFIG.round.passBase).toBeLessThanOrEqual(CONFIG.round.passMax);
    expect(CONFIG.round.passMax).toBeLessThanOrEqual(CONFIG.round.clays);
  });
});
