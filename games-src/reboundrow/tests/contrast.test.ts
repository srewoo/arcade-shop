import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { PALETTE } from '../src/palette';

const tokens = readFileSync(new URL('../src/style/tokens.css', import.meta.url), 'utf8');
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
function block(css: string, selector: string): Record<string, string> {
  const start = css.indexOf(selector);
  const body = css.slice(css.indexOf('{', start) + 1, css.indexOf('}', start));
  const out: Record<string, string> = {};
  for (const m of body.matchAll(/--([\w-]+):\s*(#[0-9a-fA-F]{6})/g)) out[m[1] as string] = m[2] as string;
  return out;
}

describe.each([
  ['light', block(tokens, ':root {')],
  ['dark', block(tokens, ":root[data-theme='dark'] {")],
  ['title/game scope', block(tokens, '.dark-scope {')],
] as [string, Record<string, string>][])('%s chrome palette', (_n, p) => {
  const c = (k: string): string => p[k] as string;
  it('text on backgrounds is >= 4.5', () => {
    for (const bg of ['bg', 'panel']) {
      expect(ratio(c('ink'), c(bg))).toBeGreaterThanOrEqual(4.5);
      expect(ratio(c('muted'), c(bg))).toBeGreaterThanOrEqual(4.5);
      expect(ratio(c('danger'), c(bg))).toBeGreaterThanOrEqual(4.5);
    }
    expect(ratio(c('accent-ink'), c('accent'))).toBeGreaterThanOrEqual(4.5);
  });
  it('borders and focus rings are >= 3 against the panel', () => {
    expect(ratio(c('line'), c('panel'))).toBeGreaterThanOrEqual(3);
    expect(ratio(c('focus'), c('bg'))).toBeGreaterThanOrEqual(3);
    expect(ratio(c('focus'), c('panel'))).toBeGreaterThanOrEqual(3);
  });
});

describe('playfield palette', () => {
  const bgs = [PALETTE.field, PALETTE.fieldTop];
  it('ball, paddle, bricks, steel and capsules stand out (>= 3)', () => {
    const things = [PALETTE.ball, PALETTE.paddle, PALETTE.steel, PALETTE.edge, PALETTE.heart, ...PALETTE.rows, ...PALETTE.brick, ...Object.values(PALETTE.power)];
    for (const t of things) for (const bg of bgs) expect(ratio(t, bg), `${t} on ${bg}`).toBeGreaterThanOrEqual(3);
  });
  it('capsule and brick letters are readable (>= 4.5)', () => {
    for (const col of Object.values(PALETTE.power)) expect(ratio(PALETTE.ink, col), col).toBeGreaterThanOrEqual(4.5);
    expect(ratio(PALETTE.text, PALETTE.field)).toBeGreaterThanOrEqual(4.5);
  });
});
