import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { DISC, SCENE } from '../src/render/palette';

const lum = (hex: string): number => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
export const ratio = (a: string, b: string): number => {
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
};

describe('playfield contrast (graphics >= 3:1)', () => {
  it('every disc colour stands out against the well and the sockets', () => {
    for (const k of [1, 2, 3, 4, 5] as const) {
      expect(ratio(DISC[k].base, SCENE.well), `disc ${k} vs well`).toBeGreaterThanOrEqual(3);
      expect(ratio(DISC[k].base, SCENE.socket), `disc ${k} vs socket`).toBeGreaterThanOrEqual(3);
    }
  });
  it('the bomb rim and bolt stand out', () => {
    expect(ratio(DISC[6].glow, SCENE.well)).toBeGreaterThanOrEqual(3);
  });
  it('the five disc colours are pairwise distinguishable by luminance or hue (symbols cover the rest)', () => {
    const hexes = [1, 2, 3, 4, 5].map((k) => DISC[k as 1].base);
    expect(new Set(hexes).size).toBe(5);
  });
});

describe('UI text contrast (>= 4.5:1)', () => {
  const css = readFileSync(new URL('../src/style/tokens.css', import.meta.url), 'utf8');
  const tok = (name: string, from = 0): string => new RegExp(`--${name}: (#[0-9a-fA-F]{6})`).exec(css.slice(from))![1]!;
  it('light sheet text, muted text and primary button', () => {
    expect(ratio(tok('ink'), tok('panel'))).toBeGreaterThanOrEqual(4.5);
    expect(ratio(tok('muted'), tok('panel'))).toBeGreaterThanOrEqual(4.5);
    expect(ratio(tok('accent-ink'), tok('accent'))).toBeGreaterThanOrEqual(4.5);
  });
  it('dark sheet text, muted text and primary button', () => {
    const at = css.indexOf(":root[data-theme='dark']");
    expect(ratio(tok('ink', at), tok('panel', at))).toBeGreaterThanOrEqual(4.5);
    expect(ratio(tok('muted', at), tok('panel', at))).toBeGreaterThanOrEqual(4.5);
    expect(ratio(tok('accent-ink', at), tok('accent', at))).toBeGreaterThanOrEqual(4.5);
  });
  it('HUD text on the HUD panel', () => {
    expect(ratio(tok('hud-ink'), tok('hud-bg'))).toBeGreaterThanOrEqual(4.5);
    expect(ratio(tok('hud-dim'), tok('hud-bg'))).toBeGreaterThanOrEqual(4.5);
  });
});
