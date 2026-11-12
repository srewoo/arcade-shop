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

function block(css: string, selector: string): Palette {
  const start = css.indexOf(selector);
  const body = css.slice(css.indexOf('{', start) + 1, css.indexOf('}', start));
  const out: Palette = {};
  for (const m of body.matchAll(/--([\w-]+):\s*(#[0-9a-fA-F]{6})/g)) out[m[1] as string] = m[2] as string;
  return out;
}

const light = block(tokens, ':root {');
const dark = { ...light, ...block(tokens, ":root[data-theme='dark'] {") };
const media = block(tokens, ':root:not([data-theme=');

describe.each([['light', light], ['dark', dark], ['dark via media query', { ...light, ...media }]] as [string, Palette][])('%s palette', (_n, p) => {
  const c = (k: string): string => p[k] as string;
  it('body and panel text is at least 4.5:1', () => {
    for (const [fg, bg] of [['ink', 'bg'], ['ink', 'panel'], ['muted', 'bg'], ['muted', 'panel'], ['accent-ink', 'accent'], ['plate-ink', 'plate'], ['goal', 'bg'], ['good', 'panel'], ['focus', 'bg'], ['focus', 'panel']] as const) {
      expect(ratio(c(fg), c(bg)), `${fg} on ${bg}`).toBeGreaterThanOrEqual(4.5);
    }
  });
  it('things you must see to play are at least 3:1', () => {
    for (const k of ['w0', 'w1', 'w2', 'w3']) expect(ratio(c(k), c('vessel')), `${k} on vessel`).toBeGreaterThanOrEqual(3);
    expect(ratio(c('line'), c('bg')), 'outline on bg').toBeGreaterThanOrEqual(3);
    expect(ratio(c('line'), c('panel')), 'outline on panel').toBeGreaterThanOrEqual(3);
    expect(ratio(c('goal'), c('vessel')), 'goal mark on vessel').toBeGreaterThanOrEqual(3);
    expect(ratio(c('bar'), c('cave')), 'gate bars on cave').toBeGreaterThanOrEqual(3);
    expect(ratio(c('gold'), c('panel')), 'gold stars on panel').toBeGreaterThanOrEqual(3);
    expect(ratio(c('gold'), c('bg')), 'gold stars on bg').toBeGreaterThanOrEqual(3);
    expect(ratio(c('ink'), c('vessel')), 'ticks on vessel').toBeGreaterThanOrEqual(3);
  });
});
