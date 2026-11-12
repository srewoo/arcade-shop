import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

const tokens = readFileSync(new URL('../src/style/tokens.css', import.meta.url), 'utf8');

type Palette = Record<string, string>;

const hex = (v: string): [number, number, number] => {
  const m = /^#([0-9a-f]{6})$/i.exec(v.trim());
  if (!m) throw new Error(`not a hex colour: ${v}`);
  const n = parseInt(m[1] as string, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
const lin = (c: number): number => {
  const v = c / 255;
  return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
};
const lum = ([r, g, b]: [number, number, number]): number => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
const ratio = (a: string, b: string): number => {
  const [x, y] = [lum(hex(a)), lum(hex(b))];
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
};
const mix = (a: string, b: string, pct: number): string =>
  '#' + hex(a).map((v, i) => Math.round(v * pct + hex(b)[i]!* (1 - pct)).toString(16).padStart(2, '0')).join('');

function block(css: string, selector: string): Palette {
  const start = css.indexOf(selector);
  const body = css.slice(css.indexOf('{', start) + 1, css.indexOf('}', start));
  const out: Palette = {};
  for (const m of body.matchAll(/--([\w-]+):\s*(#[0-9a-fA-F]{6})/g)) out[m[1] as string] = m[2] as string;
  return out;
}

const light = block(tokens, ':root {');
const dark = block(tokens, ":root[data-theme='dark'] {");

describe.each([['light', light], ['dark', dark]] as [string, Palette][])('%s palette', (_n, p) => {
  const pick = (k: string): string => p[k] as string;

  it('has every token the contrast maths needs', () => {
    for (const k of ['bg', 'panel', 'ink', 'muted', 'grid', 'x', 'o', 'win-ring']) expect(p[k], `${_n}:${k}`).toBeDefined();
  });

  it('text: ink and muted are >= 4.5 on bg and panel', () => {
    for (const fg of ['ink', 'muted']) for (const bg of ['bg', 'panel']) expect(ratio(pick(fg), pick(bg))).toBeGreaterThanOrEqual(4.5);
  });

  it('muted text keeps a margin (>= 5) on the page background', () => {
    expect(ratio(pick('muted'), pick('bg'))).toBeGreaterThanOrEqual(5);
  });

  it('graphics: marks, cell edge and win ring are >= 3 against the cell', () => {
    for (const k of ['x', 'o', 'win-ring', 'grid']) expect(ratio(pick(k), pick('panel'))).toBeGreaterThanOrEqual(3);
  });

  it('marks stay >= 3 on the win tint', () => {
    for (const k of ['x', 'o']) expect(ratio(pick(k), pick('win-fill'))).toBeGreaterThanOrEqual(3);
  });

  it('win fill is a warm gold (red channel high, blue low) with readable ink', () => {
    const [r, , b] = hex(pick('win-fill'));
    expect(r).toBeGreaterThan(b);
    expect(ratio(pick('ink'), pick('win-fill'))).toBeGreaterThanOrEqual(4.5);
  });

  it('faded (dashed) next-out marks stay >= 3 at 80% opacity', () => {
    for (const k of ['x', 'o']) expect(ratio(mix(pick(k), pick('panel'), 0.8), pick('panel'))).toBeGreaterThanOrEqual(3);
  });
});
