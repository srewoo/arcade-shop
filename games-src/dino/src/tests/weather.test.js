import { describe, it, expect } from 'vitest';
import {
  WEATHER_IDS, parseWeather, cycleWeather, gravityScale, particleBudget, lightningIntensity, nextLightningDelay, thunderDelay,
} from '../world/weatherModes.js';
import { paletteFor, timeOfDay, CYCLE_SCORE, samplePalette, WEATHER_KEYFRAMES } from '../world/biomes.js';
import { parseSettings, defaultSettings } from '../settings.js';

describe('weather parsing', () => {
  it('accepts the five environments and falls back to auto', () => {
    expect(WEATHER_IDS).toEqual(['auto', 'day', 'night', 'snow', 'rain']);
    for (const id of WEATHER_IDS) expect(parseWeather(id)).toBe(id);
    for (const v of ['storm', '', null, undefined, 4, 'RAIN', '__proto__', {}]) expect(parseWeather(v)).toBe('auto');
  });
  it('validates the stored setting', () => {
    expect(parseSettings({ weather: 'snow' }).weather).toBe('snow');
    expect(parseSettings({ weather: 'hail' }).weather).toBe('auto');
    expect(parseSettings('{"weather":42}').weather).toBe('auto');
    expect(defaultSettings().weather).toBe('auto');
  });
  it('cycles with wrap-around in both directions', () => {
    expect(cycleWeather('auto')).toBe('day');
    expect(cycleWeather('rain')).toBe('auto');
    expect(cycleWeather('auto', -1)).toBe('rain');
    expect(cycleWeather('bogus')).toBe('day');
  });
});

describe('Auto cycle mapping', () => {
  it('maps score to time of day around the loop', () => {
    expect(timeOfDay(0).name).toBe('day');
    expect(timeOfDay(CYCLE_SCORE * 0.25).name).toBe('dusk');
    expect(timeOfDay(CYCLE_SCORE * 0.5).name).toBe('night');
    expect(timeOfDay(CYCLE_SCORE * 0.75).name).toBe('dawn');
    expect(timeOfDay(CYCLE_SCORE).name).toBe('day');
    expect(timeOfDay(CYCLE_SCORE * 2.5).name).toBe('night');
    expect(timeOfDay(CYCLE_SCORE * 0.5).phase).toBeCloseTo(0.5);
    expect(timeOfDay(-10).name).toBe('day');
  });
  it('uses the cycle only in auto; day and night lock the palette', () => {
    expect(paletteFor('auto', CYCLE_SCORE * 0.5)).toEqual(samplePalette(CYCLE_SCORE * 0.5));
    for (const score of [0, 900, 1600, 2500]) {
      expect(paletteFor('day', score).skyTop).toBe(samplePalette(0).skyTop);
      expect(paletteFor('night', score).stars).toBe(1);
    }
    expect(paletteFor('day', 5000).name).toBe('Day');
    expect(paletteFor('night', 0).sunIntensity).toBeLessThan(paletteFor('day', 0).sunIntensity);
    expect(paletteFor("night", 0).fillLight).toBeGreaterThan(0);
  });
  it('gives snow and rain their own looks', () => {
    expect(paletteFor('snow').snow).toBe(1);
    expect(paletteFor('rain').wet).toBe(1);
    expect(paletteFor('rain').fogFar).toBeLessThan(paletteFor('day').fogFar);
    expect(paletteFor('rain').sunShow).toBe(0);
    expect(WEATHER_KEYFRAMES.snow.stars).toBe(0);
  });
});

describe('snow traction, particle budgets, lightning', () => {
  it('only snow changes gravity, and only while falling', () => {
    expect(gravityScale('snow', -5)).toBeLessThan(1);
    expect(gravityScale('snow', 5)).toBe(1);
    for (const w of ['auto', 'day', 'night', 'rain']) expect(gravityScale(w, -5)).toBe(1);
  });
  it('scales particle counts with quality, mobile and reduced motion', () => {
    expect(particleBudget('day', 'high').count).toBe(0);
    const hi = particleBudget('snow', 'high').count, lo = particleBudget('snow', 'low').count;
    expect(hi).toBeGreaterThan(lo);
    expect(particleBudget('rain', 'high', { mobile: true }).count).toBeLessThan(particleBudget('rain', 'high').count);
    const reduced = particleBudget('rain', 'high', { reduced: true });
    expect(reduced.count).toBeLessThan(particleBudget('rain', 'high').count / 2);
    expect(reduced.speed).toBeLessThan(1);
    expect(reduced.lightning).toBe(false);
    expect(particleBudget('rain', 'auto').lightning).toBe(true);
    expect(particleBudget('snow', 'auto').lightning).toBe(false);
    expect(particleBudget('snow', 'weird').count).toBe(particleBudget('snow', 'auto').count);
  });
  it('lightning flickers and ends; delays stay in range', () => {
    expect(lightningIntensity(-1)).toBe(0);
    expect(lightningIntensity(0)).toBeGreaterThan(0.5);
    expect(lightningIntensity(0.12)).toBeLessThan(lightningIntensity(0.2));
    expect(lightningIntensity(1)).toBe(0);
    expect(nextLightningDelay(0)).toBe(8);
    expect(nextLightningDelay(1)).toBe(20);
    expect(thunderDelay(0)).toBeCloseTo(0.6);
    expect(thunderDelay(5)).toBeCloseTo(2.8);
  });
});
