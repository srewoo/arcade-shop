import { describe, it, expect } from 'vitest';
import { spawnTable, NEW_OBSTACLES, rampFactor } from '../obstacles/difficulty.js';
import { meteorPhase, timeToArrival, IMPACT_LEAD, WARN_TIME, FALL_TIME } from '../obstacles/meteorMath.js';
import { samplePalette, biomeName, mixHex, KEYFRAMES, CYCLE_SCORE } from '../world/biomes.js';
import { clears, shouldAirJump, minHeightOver } from '../autopilotMath.js';

describe('difficulty curve', () => {
  it('reproduces the original table when new obstacles are off', () => {
    expect(spawnTable(0).map(([k]) => k)).toEqual(['cactusS', 'cactusL']);
    expect(spawnTable(1000).map(([k]) => k)).toEqual(['cactusS', 'cactusL', 'group2', 'group3', 'weed', 'pteroLow', 'pteroMid', 'pteroHigh']);
  });
  it('fades new obstacles in gradually, in order', () => {
    const kinds = (d) => spawnTable(d, { newObstacles: true }).map(([k]) => k);
    expect(kinds(200)).not.toContain('boulder');
    expect(kinds(300)).toContain('boulder');
    expect(kinds(300)).not.toContain('log');
    expect(kinds(450)).toContain('log');
    expect(kinds(450)).not.toContain('meteor');
    expect(kinds(600)).toContain('meteor');
    const w = (d) => Object.fromEntries(spawnTable(d, { newObstacles: true })).boulder;
    expect(w(300)).toBeLessThan(w(400));
    expect(w(1000)).toBe(NEW_OBSTACLES.boulder.weight);
    expect(rampFactor(0, 250)).toBe(0);
  });
});

describe('meteor timing', () => {
  it('lands at least IMPACT_LEAD seconds before the player arrives', () => {
    expect(meteorPhase(WARN_TIME + 1).marker).toBe(false);
    expect(meteorPhase(WARN_TIME - 0.1)).toMatchObject({ marker: true, landed: false });
    expect(meteorPhase(IMPACT_LEAD + 0.05).landed).toBe(false);
    expect(meteorPhase(IMPACT_LEAD).landed).toBe(true);
    expect(meteorPhase(0.5).altitude).toBe(0);
    expect(WARN_TIME).toBeGreaterThan(IMPACT_LEAD + FALL_TIME);
  });
  it('falls monotonically', () => {
    const a = meteorPhase(IMPACT_LEAD + 1).altitude;
    const b = meteorPhase(IMPACT_LEAD + 0.5).altitude;
    expect(a).toBeGreaterThan(b);
  });
  it('computes time to arrival toward -z', () => {
    expect(timeToArrival(0, -26, 13)).toBeCloseTo(2);
    expect(timeToArrival(0, 5, 13)).toBe(Infinity);
  });
});

describe('biomes', () => {
  it('starts as the original desert palette', () => {
    expect(samplePalette(0)).toMatchObject({ name: 'Desert', skyTop: KEYFRAMES[0].skyTop, sunIntensity: 5.6, stars: 0 });
  });
  it('reaches dusk, night and dawn along the cycle and loops', () => {
    expect(biomeName(CYCLE_SCORE * 0.25)).toBe('Dusk Canyon');
    expect(biomeName(CYCLE_SCORE * 0.5)).toBe('Moonlit Desert');
    expect(biomeName(CYCLE_SCORE * 0.75)).toBe('Dawn Dunes');
    expect(samplePalette(CYCLE_SCORE * 0.5).stars).toBe(1);
    expect(biomeName(CYCLE_SCORE)).toBe('Desert');
    expect(samplePalette(CYCLE_SCORE * 0.5).sunIntensity).toBeLessThan(samplePalette(0).sunIntensity);
  });
  it('blends colours between keyframes', () => {
    expect(mixHex(0x000000, 0xffffff, 0.5)).toBe(0x808080);
    const mid = samplePalette(CYCLE_SCORE * 0.125 + 100).sunIntensity;
    expect(mid).toBeLessThan(5.6);
    expect(mid).toBeGreaterThan(3.4);
  });
  it('treats negative scores as zero', () => {
    expect(samplePalette(-50)).toEqual(samplePalette(0));
  });
});

describe('autopilot double jump', () => {
  it('computes minimum height of a ballistic arc', () => {
    expect(minHeightOver(0, 15.5, 0.1, 0.6)).toBeGreaterThan(0.5);
    expect(minHeightOver(0, 0, 0, 1)).toBe(0);
  });
  it('detects an arc that clears a low obstacle at its apex, and one that does not', () => {
    // apex of a full jump is ~0.37 s in: well clear of a 1.45 m boulder
    expect(clears(0, 15.5, 0.3, 0.45, 1.45)).toBe(true);
    // jumped far too early: back on the ground when the obstacle arrives
    expect(clears(0, -1, 0.3, 0.45, 1.45)).toBe(false);
  });
  it('spends the second jump when falling toward an obstacle, not when the arc is fine', () => {
    expect(shouldAirJump({ y: 2.5, vy: 0, t0: 0.3, t1: 0.45, y1: 1.45 })).toBe(false);
    // falling at 0.3 m with a 2.0 m obstacle 0.15 s away: jump now (waiting 0.05 s would be too late)
    expect(shouldAirJump({ y: 0.3, vy: -8, t0: 0.15, t1: 0.3, y1: 2.0 })).toBe(true);
    // same arc but the obstacle is far off: wait for the last moment
    expect(shouldAirJump({ y: 0.3, vy: -8, t0: 0.6, t1: 0.8, y1: 2.0 })).toBe(false);
  });
});
