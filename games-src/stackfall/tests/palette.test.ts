import { describe, expect, it } from 'vitest';
import { contrast, minPairDeltaE, parseHex, type Cvd, type Rgb } from '../src/ui/colorMath';
import { ASSIST_STONES, DEFAULT_STONES, levelHue } from '../src/ui/palette';

const bases = (list: typeof DEFAULT_STONES, n: number): Rgb[] => list.slice(1, n + 1).map((s) => parseHex((s as { base: string }).base));
const hsl = (h: number, s: number, l: number): Rgb => {
  const a = (s / 100) * Math.min(l / 100, 1 - l / 100);
  const f = (n: number): number => { const k = (n + h / 30) % 12; return 255 * (l / 100 - a * Math.max(-1, Math.min(k - 3, 9 - k, 1))); };
  return [Math.round(f(0)), Math.round(f(8)), Math.round(f(4))];
};

/** Well fill at every level hue: sky gradient stops under the 45% dark glass. */
function wellFills(): Rgb[] {
  const out: Rgb[] = [];
  for (let level = 1; level <= 15; level++) {
    const h = levelHue(level);
    for (const [dh, s, l] of [[0, 42, 24], [30, 46, 14], [60, 50, 8]] as const) {
      const bg = hsl((h + dh) % 360, s, l);
      out.push([0, 1, 2].map((i) => Math.round(0.55 * (bg[i] as number) + 0.45 * ([8, 16, 20][i] as number))) as unknown as Rgb);
    }
  }
  return out;
}
const worstContrast = (hex: string): number => Math.min(...wellFills().map((f) => contrast(parseHex(hex), f)));

describe('colour-blind assist palette (STACKFALL-13)', () => {
  it('keeps every pair at least 20 delta-E apart in all vision simulations', () => {
    const colors = bases(ASSIST_STONES, 7);
    expect(minPairDeltaE(colors)).toBeGreaterThanOrEqual(20);
    for (const kind of ['protan', 'deutan', 'tritan'] as Cvd[]) expect(minPairDeltaE(colors, kind)).toBeGreaterThanOrEqual(20);
  });
  it('every stone in both palettes is at least 3:1 against the well at every level', () => {
    for (const list of [DEFAULT_STONES, ASSIST_STONES]) {
      for (const s of list.slice(1)) expect(worstContrast((s as { base: string }).base)).toBeGreaterThanOrEqual(3);
    }
  });
  it('Garnet and Pebble now reach 4.5:1 in the default palette', () => {
    expect(worstContrast((DEFAULT_STONES[7] as { base: string }).base)).toBeGreaterThanOrEqual(4.5);
    expect(worstContrast((DEFAULT_STONES[8] as { base: string }).base)).toBeGreaterThanOrEqual(4.5);
  });
  it('default palette still separates all pairs in normal vision', () => {
    expect(minPairDeltaE(bases(DEFAULT_STONES, 7))).toBeGreaterThan(20);
  });
  it('lightening Garnet did not make any default pair harder to tell apart than before', () => {
    const colors = bases(DEFAULT_STONES, 7);
    expect(minPairDeltaE(colors, 'protan')).toBeGreaterThanOrEqual(6.6);
    expect(minPairDeltaE(colors, 'deutan')).toBeGreaterThanOrEqual(8.4);
    expect(minPairDeltaE(colors, 'tritan')).toBeGreaterThanOrEqual(13.5);
  });
});
