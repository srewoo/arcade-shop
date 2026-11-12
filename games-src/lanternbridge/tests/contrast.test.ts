import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { CONFIG } from '../src/config';

const css = readFileSync(new URL('../src/style/tokens.css', import.meta.url), 'utf8');
type Palette = Record<string, string>;

const hex = (v: string): [number, number, number] => {
  const m = /^#([0-9a-f]{6})$/i.exec(v.trim());
  if (!m) throw new Error(`not a hex colour: ${v}`);
  const n = parseInt(m[1] as string, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
const lin = (c: number): number => { const v = c / 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
const lum = ([r, g, b]: [number, number, number]): number => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
const ratio = (a: string, b: string): number => {
  const [x, y] = [lum(hex(a)), lum(hex(b))];
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
};

function block(selector: string): Palette {
  const start = css.indexOf(selector);
  const body = css.slice(css.indexOf('{', start) + 1, css.indexOf('}', start));
  const out: Palette = {};
  for (const m of body.matchAll(/--([\w-]+):\s*(#[0-9a-fA-F]{6})/g)) out[m[1] as string] = m[2] as string;
  return out;
}

const root = block(':root {');
const light = root;
const dark = { ...root, ...block(":root[data-theme='dark'] {") };

describe.each([['light', light], ['dark', dark]] as [string, Palette][])('%s chrome', (_n, p) => {
  const c = (k: string): string => p[k] as string;
  it('text is >= 4.5 on bg and panel', () => {
    for (const fg of ['ink', 'muted', 'danger', 'star', 'good']) for (const bg of ['bg', 'panel']) {
      expect(ratio(c(fg), c(bg)), `${fg} on ${bg}`).toBeGreaterThanOrEqual(4.5);
    }
  });
  it('button text is >= 4.5 on accent', () => {
    expect(ratio(c('accent-ink'), c('accent'))).toBeGreaterThanOrEqual(4.5);
  });
  it('graphics (meter fill, focus ring, muted outline) are >= 3 on the panel', () => {
    for (const fg of ['fill', 'focus', 'muted']) expect(ratio(c(fg), c('panel')), fg).toBeGreaterThanOrEqual(3);
  });
});

describe('night scene (theme independent)', () => {
  const c = (k: string): string => root[k] as string;
  it('every figure colour is >= 3 against the bank, river and deck', () => {
    for (const fig of CONFIG.ui.figurePalette) for (const bg of ['bank', 'river', 'deck']) {
      expect(ratio(fig, c(bg)), `${fig} on ${bg}`).toBeGreaterThanOrEqual(3);
    }
  });
  it('scene text and the selection ring are readable on the bank and river', () => {
    for (const bg of ['bank', 'river']) {
      expect(ratio(c('scene-ink'), c(bg))).toBeGreaterThanOrEqual(4.5);
      expect(ratio(c('scene-pick'), c(bg))).toBeGreaterThanOrEqual(3);
      expect(ratio(c('scene-focus'), c(bg))).toBeGreaterThanOrEqual(3);
    }
  });
  it('bank is distinguishable from the river', () => {
    expect(ratio(c('bank'), c('river'))).toBeGreaterThanOrEqual(1.1);
  });
  it('chest marks read on every figure colour', () => {
    for (const fig of CONFIG.ui.figurePalette) expect(ratio(c('mark'), fig)).toBeGreaterThanOrEqual(4.5);
  });
});
