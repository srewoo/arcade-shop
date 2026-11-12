import { describe, expect, it } from 'vitest';
import { PAL } from '../src/render/palette';

const lum = (hex: string): number => {
  const n = parseInt(hex.slice(1), 16);
  const c = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * (c[0] as number) + 0.7152 * (c[1] as number) + 0.0722 * (c[2] as number);
};
const ratio = (a: string, b: string): number => {
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
};

function tokens(block: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const m of block.matchAll(/--([a-z0-9-]+):\s*(#[0-9a-fA-F]{6})/g)) out[m[1] as string] = m[2] as string;
  return out;
}
interface NodeProc {
  getBuiltinModule(name: 'node:fs'): { readFileSync(path: URL, enc: 'utf8'): string };
}
const proc = (globalThis as unknown as { process: NodeProc }).process;
const css = proc.getBuiltinModule('node:fs').readFileSync(new URL('../src/style/tokens.css', import.meta.url), 'utf8');
const light = tokens(css.slice(0, css.indexOf('@media')));
const dark = tokens(css.slice(css.indexOf(":root[data-theme='dark']")));

describe('UI colour contrast', () => {
  for (const [name, t] of [['light', light], ['dark', dark]] as const) {
    it(`${name}: text on panel and page meets 4.5:1`, () => {
      expect(ratio(t.ink as string, t.panel as string)).toBeGreaterThanOrEqual(4.5);
      expect(ratio(t.muted as string, t.panel as string)).toBeGreaterThanOrEqual(4.5);
      expect(ratio(t.muted as string, t.bg as string)).toBeGreaterThanOrEqual(4.5);
      expect(ratio(t['accent-ink'] as string, t.accent as string)).toBeGreaterThanOrEqual(4.5);
      expect(ratio(t.warn as string, t.panel as string)).toBeGreaterThanOrEqual(4.5);
      expect(ratio(t.star as string, t.panel as string)).toBeGreaterThanOrEqual(3);
    });
    it(`${name}: borders and focus ring meet 3:1`, () => {
      expect(ratio(t.line as string, t.panel as string)).toBeGreaterThanOrEqual(3);
      expect(ratio(t.focus as string, t.panel as string)).toBeGreaterThanOrEqual(3);
      expect(ratio(t.focus as string, t.bg as string)).toBeGreaterThanOrEqual(3);
    });
  }
});

describe('title screen contrast', () => {
  it('title text and green button meet 4.5:1', () => {
    const t = light;
    expect(ratio(t['t-ink'] as string, t['t-bg'] as string)).toBeGreaterThanOrEqual(4.5);
    expect(ratio(t['t-muted'] as string, t['t-bg2'] as string)).toBeGreaterThanOrEqual(4.5);
    expect(ratio(t['t-green'] as string, t['t-bg2'] as string)).toBeGreaterThanOrEqual(4.5);
    expect(ratio(t['t-green-ink'] as string, t['t-green'] as string)).toBeGreaterThanOrEqual(4.5);
    expect(ratio(t['t-line'] as string, t['t-bg'] as string)).toBeGreaterThanOrEqual(3);
  });
});

describe('canvas colour contrast (3:1 on asphalt)', () => {
  for (const key of ['line', 'kerb', 'wall', 'bay', 'bayOk', 'player', 'cone', 'pillar', 'caravan'] as const) {
    it(`${key} stands out from the road`, () => {
      expect(ratio(PAL[key], PAL.asphalt)).toBeGreaterThanOrEqual(3);
    });
  }
  it('every traffic tint is visible against the road', () => {
    for (const t of PAL.tints) expect(ratio(t, PAL.asphalt)).toBeGreaterThanOrEqual(3);
  });
  it('the player car is distinguishable from traffic', () => {
    for (const t of PAL.tints) expect(ratio(PAL.player, t)).toBeGreaterThan(1.1);
  });
});
