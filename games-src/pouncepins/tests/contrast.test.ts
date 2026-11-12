import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

const tokens = readFileSync(new URL('../src/style/tokens.css', import.meta.url), 'utf8');
type Palette = Record<string, string>;
type Rgb = [number, number, number];

const hex = (v: string): Rgb => {
  const m = /^#([0-9a-f]{6})$/i.exec(v.trim());
  if (!m) throw new Error(`not a hex colour: ${v}`);
  const n = parseInt(m[1] as string, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
const lin = (c: number): number => {
  const v = c / 255;
  return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
};
const lum = ([r, g, b]: Rgb): number => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
const ratioRgb = (a: Rgb, b: Rgb): number => (Math.max(lum(a), lum(b)) + 0.05) / (Math.min(lum(a), lum(b)) + 0.05);
const ratio = (a: string, b: string): number => ratioRgb(hex(a), hex(b));

function block(css: string, selector: string): Palette {
  const start = css.indexOf(selector);
  const body = css.slice(css.indexOf('{', start) + 1, css.indexOf('}', start));
  const out: Palette = {};
  for (const m of body.matchAll(/--([\w-]+):\s*(#[0-9a-fA-F]{6})/g)) out[m[1] as string] = m[2] as string;
  const chip = /--chip-bg:\s*rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)/.exec(body);
  if (chip) out['chip-a'] = chip[4] as string;
  if (chip) out['chip-rgb'] = '#' + [chip[1], chip[2], chip[3]].map((v) => Number(v).toString(16).padStart(2, '0')).join('');
  return out;
}

const light = block(tokens, ':root {');
const dark = block(tokens, ":root[data-theme='dark'] {");

describe.each([['light', light], ['dark', dark]] as [string, Palette][])('%s palette', (_n, p) => {
  const pick = (k: string): string => p[k] as string;

  it('has every token the contrast maths needs', () => {
    for (const k of ['bg', 'panel', 'ink', 'muted', 'accent', 'accent-ink', 'gold', 'warn', 'good', 'cell-now', 'chip-ink', 'chip-rgb']) expect(p[k], `${_n}:${k}`).toBeDefined();
  });
  it('text: ink and muted are >= 4.5 on bg and panel', () => {
    for (const fg of ['ink', 'muted']) for (const bg of ['bg', 'panel']) expect(ratio(pick(fg), pick(bg))).toBeGreaterThanOrEqual(4.5);
  });
  it('button text on the accent fill is >= 4.5', () => {
    expect(ratio(pick('accent-ink'), pick('accent'))).toBeGreaterThanOrEqual(4.5);
  });
  it('status colours used as text (gold, good, warn) are >= 4.5 on the panel', () => {
    for (const k of ['gold', 'good', 'warn']) expect(ratio(pick(k), pick('panel'))).toBeGreaterThanOrEqual(4.5);
  });
  it('graphics: accent and the sweet-spot green are >= 3 against the panel', () => {
    for (const k of ['accent', 'good']) expect(ratio(pick(k), pick('panel'))).toBeGreaterThanOrEqual(3);
  });
  it('current-frame highlight keeps ink text >= 4.5', () => {
    expect(ratio(pick('ink'), pick('cell-now'))).toBeGreaterThanOrEqual(4.5);
  });
  it('hint text on the translucent chip is >= 4.5 even over the lightest background', () => {
    const a = Number(pick('chip-a'));
    const base = hex(pick('bg')), tint = hex(pick('chip-rgb'));
    const mixed = base.map((v, i) => Math.round(v * (1 - a) + (tint[i] as number) * a)) as Rgb;
    expect(ratioRgb(hex(pick('chip-ink')), mixed)).toBeGreaterThanOrEqual(4.5);
  });
});

describe('scoreboard css', () => {
  const board = readFileSync(new URL('../src/style/board.css', import.meta.url), 'utf8');
  it('the current-frame number uses ink (muted was 4.42:1 on the dark highlight)', () => {
    expect(board).toMatch(/\.f\[data-now='true'\] \.n \{ color: var\(--ink\); \}/);
    expect(ratio(dark['ink'] as string, dark['cell-now'] as string)).toBeGreaterThanOrEqual(4.5);
    expect(ratio(dark['muted'] as string, dark['cell-now'] as string)).toBeLessThan(4.5);
  });
  it('provisional marks (accent on panel) stay >= 3:1 as graphics and are not colour-only (italic + dashed outline)', () => {
    for (const p of [light, dark]) expect(ratio(p['accent'] as string, p['panel'] as string)).toBeGreaterThanOrEqual(3);
    expect(board).toContain("data-prov='true'");
    expect(board).toContain('italic');
  });
});
