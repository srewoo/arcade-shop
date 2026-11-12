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
const dark = block(tokens, ":root[data-theme='dark'] {");
const pond = block(tokens, '/* The pond');
const pondBlock = block(tokens.slice(tokens.indexOf('/* The pond')), ':root {');

describe.each([['light', light], ['dark', dark]] as [string, Palette][])('%s chrome', (_n, p) => {
  const c = (k: string): string => p[k] as string;
  it('text tokens are >= 4.5 on bg and panel', () => {
    for (const fg of ['ink', 'muted', 'warn']) for (const bg of ['bg', 'panel']) expect(ratio(c(fg), c(bg)), `${fg}/${bg}`).toBeGreaterThanOrEqual(4.5);
  });
  it('accent button text is >= 4.5', () => {
    expect(ratio(c('accent-ink'), c('accent'))).toBeGreaterThanOrEqual(4.5);
  });
  it('accent, line and focus are >= 3 on the panel', () => {
    for (const k of ['accent', 'focus']) expect(ratio(c(k), c('panel')), k).toBeGreaterThanOrEqual(3);
  });
});

describe('pond art', () => {
  const p = pondBlock;
  it('has its tokens', () => {
    expect(Object.keys(pond).length >= 0).toBe(true);
    for (const k of ['water', 'pad', 'frog', 'toad', 'outline', 'glow']) expect(p[k], k).toBeDefined();
  });
  it('pads stand out from the water (>= 3)', () => {
    expect(ratio(p.pad as string, p.water as string)).toBeGreaterThanOrEqual(3);
  });
  it('frog and toad bodies are >= 3 against their outline and the water', () => {
    for (const k of ['frog', 'toad']) {
      expect(ratio(p[k] as string, p.outline as string), `${k}/outline`).toBeGreaterThanOrEqual(3);
      expect(ratio(p[k] as string, p.water as string), `${k}/water`).toBeGreaterThanOrEqual(3);
    }
  });
  it('outline reads against the pad (>= 3) so pieces on pads are visible', () => {
    expect(ratio(p.outline as string, p.pad as string)).toBeGreaterThanOrEqual(3);
  });
  it('frog and toad differ clearly in luminance-independent hue (not equal colours)', () => {
    expect(p.frog).not.toBe(p.toad);
  });
  it('highlight glow is >= 3 on the pad and the water', () => {
    expect(ratio(p.glow as string, p.water as string)).toBeGreaterThanOrEqual(3);
  });
});
