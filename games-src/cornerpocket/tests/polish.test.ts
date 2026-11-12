import { describe, expect, it } from 'vitest';
import { placeText } from '../src/geom';
import { isPrimaryStat, isUrgentClock } from '../src/hudFormat';
import { applyRackShot, initialRack } from '../src/rack';
import { resultStats, resultTier } from '../src/results';
import { DEFAULT_SETTINGS } from '../src/settings';
import { layoutView } from '../src/view';
import { RAIL, TABLE_H, TABLE_W } from '../src/constants';
import { numberMetrics } from '../src/renderBalls';

describe('table fills a stage of its own aspect', () => {
  it('uses at least 99% of a canvas with the table aspect (no pillar bands)', () => {
    const fw = TABLE_W + 2 * RAIL; const fh = TABLE_H + 2 * RAIL;
    for (const w of [600, 1196, 1600]) {
      const h = Math.round(w * fh / fw);
      const v = layoutView(w, h);
      expect((fw * v.scale * fh * v.scale) / (w * h)).toBeGreaterThan(0.99);
    }
  });
  it('portrait rotation fills a tall stage', () => {
    const fw = TABLE_W + 2 * RAIL; const fh = TABLE_H + 2 * RAIL;
    const w = 400; const h = Math.round(w * fw / fh);
    const v = layoutView(w, h);
    expect(v.portrait).toBe(true);
    expect((fw * v.scale * fh * v.scale) / (w * h)).toBeGreaterThan(0.99);
  });
});

describe('ball numbers', () => {
  it('render at least 11 screen px at desktop and phone scales', () => {
    for (const scale of [0.8, 1.4]) expect(numberMetrics(scale, false).font * scale).toBeGreaterThanOrEqual(10.99);
  });
});

describe('colour-blind assist default', () => {
  it('is on for new players', () => expect(DEFAULT_SETTINGS.colorAssist).toBe(true));
});

describe('HUD format', () => {
  it('makes score and shots the headline', () => {
    expect(isPrimaryStat('Score')).toBe(true);
    expect(isPrimaryStat('Rack')).toBe(false);
  });
  it('turns the clock urgent under 10s only', () => {
    expect(isUrgentClock('Time', '9.9s')).toBe(true);
    expect(isUrgentClock('Time', '10.0s')).toBe(false);
    expect(isUrgentClock('Time', '35.0s')).toBe(false);
    expect(isUrgentClock('Score', '3')).toBe(false);
  });
});

describe('feedback', () => {
  it('says why a shot missed', () => {
    const a = applyRackShot(initialRack(), 0, false, 5, true);
    expect(a.texts).toContain('No contact');
    const b = applyRackShot(initialRack(), 0, false, 5, false);
    expect(b.texts).toContain('Miss');
  });
  it('keeps floating text inside the canvas', () => {
    expect(placeText(-50, -50, 100, 20, 400, 300)).toEqual({ x: 50, y: 10 });
    expect(placeText(999, 999, 100, 20, 400, 300)).toEqual({ x: 350, y: 290 });
    expect(placeText(200, 150, 100, 20, 400, 300)).toEqual({ x: 200, y: 150 });
  });
});

describe('result card', () => {
  it('tiers never contradict stars', () => {
    const base = { mode: 'trick', title: '', detail: '' } as const;
    expect(resultTier({ ...base, won: true, stars: 3 })).toBe('Perfect!');
    expect(resultTier({ ...base, won: true, stars: 2 })).toBe('Nice shot');
    expect(resultTier({ ...base, won: true, stars: 1 })).toBe('Solved');
    expect(resultTier({ ...base, won: false, stars: 0 })).toMatch(/Try again/);
  });
  it('lists pots and shots for a rack run', () => {
    const s = resultStats({ mode: 'rack', won: false, title: '', detail: '', score: 120, rack: 2, pots: 7, shotsTaken: 11, bestCombo: 3 });
    expect(s.map((x) => x.value)).toEqual(['120', '2', '7', '11', 'x3']);
  });
});
