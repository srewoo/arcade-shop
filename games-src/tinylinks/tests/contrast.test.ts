import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { BALL_COLORS, colorHex } from '../src/game/players';
import { INK_DARK, luminance, markInk } from '../src/render/ball';
import { PAL } from '../src/render/palette';

const ratio = (a: string, b: string): number => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
};

const css = readFileSync(new URL('../src/style/tokens.css', import.meta.url), 'utf8');
function tokens(block: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const m of block.matchAll(/--([a-z-]+):\s*(#[0-9a-fA-F]{6})/g)) out[m[1] as string] = m[2] as string;
  return out;
}
const light = tokens(css.slice(0, css.indexOf('@media')));
const dark = { ...light, ...tokens(css.slice(css.indexOf(":root[data-theme='dark']"))) };

describe('graphics contrast (>= 3:1)', () => {
  it('wall edge, ball outline and cup read against the turf', () => {
    for (const turf of [PAL.turf, PAL.turfLight, PAL.turfDark]) {
      expect(ratio(PAL.wallEdge, turf)).toBeGreaterThanOrEqual(3);
      expect(ratio(PAL.ballEdge, turf)).toBeGreaterThanOrEqual(3);
      expect(ratio(PAL.cupDark, turf)).toBeGreaterThanOrEqual(3);
      expect(ratio(PAL.guide, turf)).toBeGreaterThanOrEqual(3);
    }
  });
  it('wall body, sand and water stand out from the turf or have a dark rim', () => {
    expect(ratio(PAL.wallBody, PAL.turf)).toBeGreaterThanOrEqual(1.9);
    expect(ratio(PAL.sandEdge, PAL.sand)).toBeGreaterThanOrEqual(3);
    expect(ratio(PAL.waterRim, PAL.waterDeep)).toBeGreaterThanOrEqual(3);
  });
  it('every ball colour has a marker with >= 3:1 ink contrast', () => {
    for (const c of BALL_COLORS) expect(ratio(markInk(c.id), c.hex)).toBeGreaterThanOrEqual(3);
    expect(ratio(INK_DARK, colorHex('tomato'))).toBeGreaterThanOrEqual(3);
  });
});

describe('UI text contrast (>= 4.5:1)', () => {
  it.each([['light', light], ['dark', dark]] as const)('%s theme', (_n, t) => {
    expect(ratio(t.ink as string, t.panel as string)).toBeGreaterThanOrEqual(4.5);
    expect(ratio(t.muted as string, t.panel as string)).toBeGreaterThanOrEqual(4.5);
    expect(ratio(t['accent-ink'] as string, t.accent as string)).toBeGreaterThanOrEqual(4.5);
    expect(ratio(t.ink as string, t.cell as string)).toBeGreaterThanOrEqual(4.5);
    expect(ratio(t.ink as string, t['cell-head'] as string)).toBeGreaterThanOrEqual(4.5);
    expect(ratio(t.muted as string, t.cell as string)).toBeGreaterThanOrEqual(4.5);
    expect(ratio(t.line as string, t.panel as string)).toBeGreaterThanOrEqual(3);
    expect(ratio(t.focus as string, t.panel as string)).toBeGreaterThanOrEqual(3);
  });
  it('HUD text on the dark chip', () => {
    expect(ratio(light['hud-ink'] as string, light['hud-bg'] as string)).toBeGreaterThanOrEqual(4.5);
    expect(ratio(light['hud-dim'] as string, light['hud-bg'] as string)).toBeGreaterThanOrEqual(4.5);
    expect(ratio('#0b1a10', '#86d9a0')).toBeGreaterThanOrEqual(4.5); // Putt button
  });
});
