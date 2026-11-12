// WCAG contrast for the UI tokens (text >= 4.5, graphics >= 3) and the canvas palette.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { PALETTE, trafficColor } from '../src/palette';

const css = readFileSync(new URL('../src/style/tokens.css', import.meta.url), 'utf8');

function block(start: string): Record<string, string> {
  const from = css.indexOf(start);
  const body = css.slice(css.indexOf('{', from) + 1, css.indexOf('}', from));
  const out: Record<string, string> = {};
  for (const m of body.matchAll(/--([a-z-]+):\s*(#[0-9a-fA-F]{6})/g)) out[m[1] ?? ''] = m[2] ?? '';
  return out;
}
const light = block(':root {');
const dark = { ...light, ...block(":root[data-theme='dark']") };

const lum = (hex: string): number => {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * (c[0] ?? 0) + 0.7152 * (c[1] ?? 0) + 0.0722 * (c[2] ?? 0);
};
const ratio = (a: string, b: string): number => {
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return ((hi ?? 0) + 0.05) / ((lo ?? 0) + 0.05);
};
const hslToHex = (h: number, s: number, l: number): string => {
  const a = (s / 100) * Math.min(l / 100, 1 - l / 100);
  const f = (n: number): string => {
    const k = (n + h / 30) % 12;
    const v = l / 100 - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
    return Math.round(v * 255).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
};

describe.each([['light', light], ['dark', dark]] as const)('%s tokens', (_name, t) => {
  it('text on backgrounds is >= 4.5', () => {
    for (const bg of ['bg', 'panel'] as const) {
      expect(ratio(t.ink ?? '', t[bg] ?? '')).toBeGreaterThanOrEqual(4.5);
      expect(ratio(t.muted ?? '', t[bg] ?? '')).toBeGreaterThanOrEqual(4.5);
    }
    expect(ratio(t['accent-ink'] ?? '', t.accent ?? '')).toBeGreaterThanOrEqual(4.5);
    expect(ratio(t.bad ?? '', t.panel ?? '')).toBeGreaterThanOrEqual(4.5);
  });
  it('borders, focus ring and meters are >= 3 against their surface', () => {
    expect(ratio(t.line ?? '', t.panel ?? '')).toBeGreaterThanOrEqual(3);
    expect(ratio(t.line ?? '', t.bg ?? '')).toBeGreaterThanOrEqual(3);
    expect(ratio(t.focus ?? '', t.panel ?? '')).toBeGreaterThanOrEqual(3);
    expect(ratio(t.focus ?? '', t.bg ?? '')).toBeGreaterThanOrEqual(3);
    expect(ratio(t.fuel ?? '', t.track ?? '')).toBeGreaterThanOrEqual(3);
    expect(ratio(t.bad ?? '', t.track ?? '')).toBeGreaterThanOrEqual(3);
  });
});

describe('canvas palette', () => {
  it('everything you must see to play is >= 3:1 against the road', () => {
    for (const c of [PALETTE.player, PALETTE.fuel, PALETTE.boost, PALETTE.dash, PALETTE.roadEdge]) {
      expect(ratio(c, PALETTE.road)).toBeGreaterThanOrEqual(3);
    }
  });
  it('every traffic hue is >= 3:1 against the road', () => {
    for (const hue of [210, 172, 48, 275, 135, 30, 195, 320]) {
      const m = /hsl\((\d+) (\d+)% (\d+)%\)/.exec(trafficColor(hue));
      const hex = hslToHex(Number(m?.[1]), Number(m?.[2]), Number(m?.[3]));
      expect(ratio(hex, PALETTE.road), `hue ${hue}`).toBeGreaterThanOrEqual(3);
    }
  });
});
