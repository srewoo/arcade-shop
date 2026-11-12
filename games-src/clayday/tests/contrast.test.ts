import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { PALETTE as P } from '../src/palette';

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
export const ratio = (a: string, b: string): number => {
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

describe.each([['light', light], ['dark', dark]] as [string, Palette][])('%s UI palette', (_n, p) => {
  const pick = (k: string): string => p[k] as string;
  it('has every token', () => {
    for (const k of ['bg', 'panel', 'ink', 'muted', 'line', 'accent', 'accent-ink', 'clay', 'good', 'bad', 'focus']) expect(p[k], k).toBeDefined();
  });
  it('text: ink, muted, clay, good and bad are >= 4.5 on bg and panel', () => {
    for (const fg of ['ink', 'muted', 'clay', 'good', 'bad']) for (const bg of ['bg', 'panel']) expect(ratio(pick(fg), pick(bg)), `${fg} on ${bg}`).toBeGreaterThanOrEqual(4.5);
  });
  it('primary button text is >= 4.5 on the accent', () => {
    expect(ratio(pick('accent-ink'), pick('accent'))).toBeGreaterThanOrEqual(4.5);
  });
  it('graphics: focus ring and tally marks are >= 3 on the panel', () => {
    for (const k of ['focus', 'good', 'bad', 'muted', 'clay']) expect(ratio(pick(k), pick('panel')), k).toBeGreaterThanOrEqual(3);
  });
});

describe('canvas scene contrast (things you must see to play)', () => {
  const backgrounds = { skyTop: P.skyTop, skyLow: P.skyLow, hillFar: P.hillFar, fieldFar: P.fieldFar, fieldNear: P.fieldNear, treeDark: P.treeDark, barn: P.barn };
  it('clay has a dark outline inside a white halo: one of them reads >= 3 against every backdrop it can cross', () => {
    for (const [name, bg] of Object.entries(backgrounds)) expect(Math.max(ratio(P.clayOutline, bg), ratio(P.clayHalo, bg)), name).toBeGreaterThanOrEqual(3);
  });
  it('clay body is distinct from its outline and from the rim', () => {
    expect(ratio(P.clay, P.clayOutline)).toBeGreaterThanOrEqual(3);
    expect(ratio(P.clayGold, P.clayOutline)).toBeGreaterThanOrEqual(3);
  });
  it('reticle outline (dark halo) reads >= 3 on sky and grass, ring reads >= 3 on its halo', () => {
    for (const bg of [P.skyTop, P.skyLow, P.fieldFar, P.fieldNear, P.hillNear, P.hillFar]) expect(ratio(P.reticleOutline, bg)).toBeGreaterThanOrEqual(3);
    expect(ratio(P.reticle, P.reticleOutline)).toBeGreaterThanOrEqual(3);
  });
  it('floating score text has a dark outline that reads against its fill', () => {
    expect(ratio(P.text, P.textOutline)).toBeGreaterThanOrEqual(4.5);
  });
});
