import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { DISC_COLOURS, PLATE, SYMBOL_INK } from '../src/ui/palette';

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
const dark = block(tokens, ":root[data-theme='dark'] {");

describe.each([['light', light], ['dark', dark]] as [string, Palette][])('%s palette', (_n, p) => {
  const pick = (k: string): string => p[k] as string;
  it('text: ink and muted are >= 4.5 on bg and panel', () => {
    for (const fg of ['ink', 'muted']) for (const bg of ['bg', 'panel']) expect(ratio(pick(fg), pick(bg))).toBeGreaterThanOrEqual(4.5);
  });
  it('accent button text and danger text are >= 4.5', () => {
    expect(ratio(pick('accent-ink'), pick('accent'))).toBeGreaterThanOrEqual(4.5);
    expect(ratio(pick('danger'), pick('panel'))).toBeGreaterThanOrEqual(4.5);
  });
  it('focus ring and control borders are >= 3 against the page', () => {
    expect(ratio(pick('focus'), pick('bg'))).toBeGreaterThanOrEqual(3);
    expect(ratio(pick('line'), pick('bg'))).toBeGreaterThanOrEqual(3);
  });
});

describe('board palette', () => {
  it('every disc colour is >= 3:1 against the plate', () => {
    for (const c of DISC_COLOURS) expect(ratio(c, PLATE)).toBeGreaterThanOrEqual(3);
  });
  it('symbol ink is >= 4.5:1 on every disc colour', () => {
    for (const c of DISC_COLOURS) expect(ratio(SYMBOL_INK, c)).toBeGreaterThanOrEqual(4.5);
  });
  it('disc colours are pairwise distinct by luminance or hue (no duplicates)', () => {
    expect(new Set(DISC_COLOURS).size).toBe(DISC_COLOURS.length);
  });
});

describe('board plate gradient top', () => {
  it('every disc colour is still >= 3:1 against the lighter top of the plate', async () => {
    const { PLATE_TOP } = await import('../src/ui/palette');
    for (const c of DISC_COLOURS) expect(ratio(c, PLATE_TOP)).toBeGreaterThanOrEqual(3);
  });
});
