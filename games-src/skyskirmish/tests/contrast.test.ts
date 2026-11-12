import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { ASSIST, NORMAL, PICKUP_COLOUR } from '../src/palette';

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

const dark = block(tokens, ':root {');
const light = block(tokens, ":root[data-theme='light'] {");

describe.each([['dark', dark], ['light', light]] as [string, Palette][])('%s UI palette', (_n, p) => {
  const c = (k: string): string => p[k] as string;
  it('defines every token', () => {
    for (const k of ['bg', 'panel', 'ink', 'muted', 'line', 'accent', 'accent-ink', 'danger', 'danger-ink', 'focus', 'hud-bg', 'hud-ink', 'hud-muted', 'hot', 'gold', 'gold-ink'])
      expect(p[k], `${_n}:${k}`).toBeDefined();
  });
  it('text is >= 4.5:1 on its surface', () => {
    for (const bg of ['bg', 'panel']) for (const fg of ['ink', 'muted']) expect(ratio(c(fg), c(bg)), `${fg}/${bg}`).toBeGreaterThanOrEqual(4.5);
    expect(ratio(c('accent-ink'), c('accent'))).toBeGreaterThanOrEqual(4.5);
    expect(ratio(c('accent'), c('panel'))).toBeGreaterThanOrEqual(4.5);
    expect(ratio(c('danger'), c('panel'))).toBeGreaterThanOrEqual(4.5);
    expect(ratio(c('hud-ink'), c('hud-bg'))).toBeGreaterThanOrEqual(4.5);
    expect(ratio(c('hud-muted'), c('hud-bg'))).toBeGreaterThanOrEqual(4.5);
    expect(ratio(c('hot'), c('hud-bg'))).toBeGreaterThanOrEqual(4.5);
    expect(ratio(c('gold-ink'), c('gold'))).toBeGreaterThanOrEqual(4.5);
  });
  it('control borders and focus ring are >= 3:1', () => {
    expect(ratio(c('line'), c('panel'))).toBeGreaterThanOrEqual(3);
    expect(ratio(c('focus'), c('panel'))).toBeGreaterThanOrEqual(3);
    expect(ratio(c('focus'), c('bg'))).toBeGreaterThanOrEqual(3);
  });
});

describe.each([['normal', NORMAL], ['assist', ASSIST]] as const)('%s canvas palette', (_n, p) => {
  it('gameplay graphics are >= 3:1 against both ends of the sky', () => {
    for (const fg of [p.enemyShot, p.playerShot, p.playerBody, p.shield]) for (const bg of [p.skyTop, p.skyBottom]) expect(ratio(fg, bg), `${fg} on ${bg}`).toBeGreaterThanOrEqual(3);
  });
  it('enemy fire carries a dark outline ring (shape and outline, not hue alone)', () => {
    expect(ratio(p.enemyShotRing, p.enemyShot)).toBeGreaterThanOrEqual(3);
    expect(ratio(p.enemyShotCore, p.enemyShot)).toBeGreaterThanOrEqual(1.2);
  });
  it('pickups read against the sky', () => {
    for (const col of Object.values(PICKUP_COLOUR)) for (const bg of [p.skyTop, p.skyBottom]) expect(ratio(col, bg)).toBeGreaterThanOrEqual(3);
  });
});
