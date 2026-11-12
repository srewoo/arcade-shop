import { describe, expect, it } from 'vitest';
import { contrast, parseHex } from '../src/ui/colorMath';
import { ASSIST_STONES, DEFAULT_STONES, GLYPH_HALO, GLYPH_INK } from '../src/ui/palette';
import { DEFAULT_SETTINGS, parseSettings } from '../src/settings';

describe('glyph contrast', () => {
  for (const [name, list] of [['default', DEFAULT_STONES], ['assist', ASSIST_STONES]] as const) {
    it(`ink is at least 3:1 on every ${name} stone body (>= 4:1)`, () => {
      for (const st of list.slice(1)) expect(contrast(parseHex(GLYPH_INK), parseHex(st!.base))).toBeGreaterThanOrEqual(4);
    });
    it(`halo is at least 3:1 on the shaded corner of every ${name} stone`, () => {
      for (const st of list.slice(1)) expect(contrast(parseHex(GLYPH_HALO), parseHex(st!.dark))).toBeGreaterThanOrEqual(3);
    });
  }
});

describe('colour assist default and migration', () => {
  it('is on for new players', () => {
    expect(DEFAULT_SETTINGS.colorAssist).toBe(true);
    expect(parseSettings(null).colorAssist).toBe(true);
    expect(parseSettings({ colorAssist: 'maybe' }).colorAssist).toBe(true);
  });
  it('keeps an explicit saved choice', () => {
    expect(parseSettings({ colorAssist: false }).colorAssist).toBe(false);
  });
});
