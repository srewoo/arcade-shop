import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

const css = readFileSync(new URL('../src/style/tokens.css', import.meta.url), 'utf8');
type Palette = Record<string, string>;
const hex = (v: string): number[] => {
  const n = parseInt(/^#([0-9a-f]{6})$/i.exec(v.trim())?.[1] ?? 'zzzzzz', 16);
  if (Number.isNaN(n)) throw new Error(`bad colour ${v}`);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
const lin = (c: number): number => { const v = c / 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
const lum = (h: string): number => { const [r, g, b] = hex(h) as [number, number, number]; return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b); };
const ratio = (a: string, b: string): number => (Math.max(lum(a), lum(b)) + 0.05) / (Math.min(lum(a), lum(b)) + 0.05);

function block(selector: string): Palette {
  const start = css.indexOf(selector);
  const body = css.slice(css.indexOf('{', start) + 1, css.indexOf('}', start));
  const out: Palette = {};
  for (const m of body.matchAll(/--([\w-]+):\s*(#[0-9a-fA-F]{6})/g)) out[m[1] as string] = m[2] as string;
  return out;
}
const light = block(':root {');
const dark = block(":root[data-theme='dark']");
const mediaDark = block(":root:not([data-theme='light'])");

const scene = light; // cave scene + HUD tokens are shared by every theme
const sg = (k: string): string => scene[k] as string;

describe.each([['light', light], ['dark', dark]] as const)('%s dialog palette', (_n, p) => {
  const g = (k: string): string => (p[k] ?? scene[k]) as string;
  it.each([['ink', 'bg'], ['ink', 'panel'], ['muted', 'panel'], ['muted', 'bg'], ['accent-ink', 'accent']])('text %s on %s >= 4.5', (a, b) => {
    expect(ratio(g(a), g(b))).toBeGreaterThanOrEqual(4.5);
  });
  it.each([['line', 'panel'], ['focus', 'bg']])('graphic %s vs %s >= 3', (a, b) => {
    expect(ratio(g(a), g(b))).toBeGreaterThanOrEqual(3);
  });
});

describe('cave scene (same in light and dark)', () => {
  it.each([['rim', 'cave'], ['rim', 'rock'], ['craft', 'cave'], ['craft', 'rock'], ['coin', 'cave'], ['ghost', 'cave'], ['glow', 'cave']])('graphic %s vs %s >= 3', (a, b) => {
    expect(ratio(sg(a), sg(b))).toBeGreaterThanOrEqual(3);
  });
  it.each([['hud-ink', 'hud-bg'], ['hud-dim', 'hud-bg']])('HUD text %s on %s >= 4.5', (a, b) => {
    expect(ratio(sg(a), sg(b))).toBeGreaterThanOrEqual(4.5);
  });
  it('dark theme blocks do not redefine scene tokens', () => {
    for (const k of ['cave', 'rock', 'rim', 'hud-bg']) expect(dark[k]).toBeUndefined();
  });
});

it('the media-query dark palette matches the explicit dark theme', () => expect(mediaDark).toEqual(dark));
