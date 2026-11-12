import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { cuesFor } from '../src/audioEvents';
import { CUES } from '../src/audioCues';
import { CONFIG } from '../src/config';
import { Particles } from '../src/render/particles';
import { BUBBLE_COLORS } from '../src/render/themes';
import { computeView } from '../src/render/view';
import { isReducedMotion } from '../src/ui/appearance';

const css = readFileSync(new URL('../src/style/tokens.css', import.meta.url), 'utf8');
const tok = (n: string): string => new RegExp(`--${n}:\\s*(#[0-9a-fA-F]{6})`).exec(css)?.[1] ?? '#000000';
const lum = (h: string): number => {
  const n = parseInt(h.slice(1), 16);
  const f = (c: number): number => { const v = c / 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
  return 0.2126 * f((n >> 16) & 255) + 0.7152 * f((n >> 8) & 255) + 0.0722 * f(n & 255);
};
const ratio = (a: string, b: string): number => (Math.max(lum(a), lum(b)) + 0.05) / (Math.min(lum(a), lum(b)) + 0.05);

describe('contrast', () => {
  it('light dialog text and accent', () => {
    expect(ratio(tok('ink'), tok('panel'))).toBeGreaterThanOrEqual(4.5);
    expect(ratio(tok('muted'), tok('panel'))).toBeGreaterThanOrEqual(4.5);
    expect(ratio(tok('accent-ink'), tok('accent'))).toBeGreaterThanOrEqual(4.5);
    expect(ratio(tok('line'), tok('panel'))).toBeGreaterThanOrEqual(3);
  });
  it('HUD text on HUD chips', () => {
    expect(ratio(tok('hud-ink'), tok('hud-bg'))).toBeGreaterThanOrEqual(4.5);
    expect(ratio(tok('hud-dim'), tok('hud-bg'))).toBeGreaterThanOrEqual(4.5);
  });
  it('bubble colours differ in lightness so size is readable without hue', () => {
    const l = BUBBLE_COLORS.map((c) => lum(c.body));
    expect(new Set(l.map((x) => x.toFixed(2))).size).toBe(4);
  });
});

describe('render helpers', () => {
  it('view keeps uniform scale, caps dpr at 2 and the world inside the canvas', () => {
    for (const [w, h] of [[1280, 800], [400, 860], [860, 400], [1920, 1080]] as const) {
      const v = computeView(w, h, 3, 58, 0);
      expect(v.dpr).toBe(2);
      expect(v.ox).toBeGreaterThanOrEqual(0);
      expect(v.oy).toBeGreaterThanOrEqual(57.99);
      expect(v.oy + CONFIG.world.h * v.s).toBeLessThanOrEqual(h + 0.001);
      expect(v.x1 - v.x0).toBeGreaterThanOrEqual(CONFIG.world.w);
    }
  });
  it('reduce motion setting resolution', () => {
    expect(isReducedMotion('system', true)).toBe(true);
    expect(isReducedMotion('off', true)).toBe(false);
  });
  it('particle budget drops to 40% when reduced', () => {
    const full = new Particles(1), red = new Particles(CONFIG.fx.reducedFactor);
    for (let i = 0; i < 900; i++) { full.spawn(0, 0, 0, 0, 0, 1, 1, '#fff'); red.spawn(0, 0, 0, 0, 0, 1, 1, '#fff'); }
    expect(full.count).toBe(CONFIG.fx.maxParticles);
    expect(red.count).toBeLessThanOrEqual(Math.round(CONFIG.fx.maxParticles * 0.4));
    full.update(2);
    expect(full.count).toBe(0);
  });
});

describe('audio mapping', () => {
  it('every mapped cue exists and pops scale with size', () => {
    const evs = [
      { type: 'fire', x: 1 }, { type: 'hitLine', x: 1, y: 1, size: 0, points: 1 }, { type: 'hitLine', x: 1, y: 1, size: 3, points: 1 },
      { type: 'bounce', id: 1, size: 3, x: 1, y: 1 }, { type: 'block', x: 1, y: 1, broke: true }, { type: 'hit', x: 1, y: 1 }, { type: 'clear', bonus: 1 },
    ] as const;
    for (const e of evs) for (const c of cuesFor(e)) expect(c in CUES).toBe(true);
    expect(cuesFor(evs[1])).toEqual(['pop0']);
    expect(cuesFor(evs[2])).toEqual(['pop3']);
    expect(cuesFor({ type: 'bounce', id: 1, size: 0, x: 1, y: 1 })).toEqual([]);
  });
});
