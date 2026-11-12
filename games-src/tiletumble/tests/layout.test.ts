import { describe, expect, it } from 'vitest';
import { fitBoard, MAX_CELL } from '../src/ui/fit';
import { DEFAULT_SETTINGS, migrateAssist, parseSettings } from '../src/settings';
import { endDetail } from '../src/strings';
import { HERO_SPOTS } from '../src/ui/hero';
import { PLATE_TOP, DISC_COLOURS } from '../src/ui/palette';
import { boardFromRows, hasMoves } from '../src/board';

describe('fitBoard', () => {
  it('is limited by height in landscape and uses the whole height', () => {
    const f = fitBoard(600, 396, 8, 9);
    expect(f.cell).toBe(44);
    expect(f.height).toBe(396);
    expect(f.width).toBe(352);
  });
  it('is limited by width in a narrow portrait slot', () => {
    const f = fitBoard(360, 700, 8, 9);
    expect(f.cell).toBe(45);
    expect(f.width).toBe(360);
  });
  it('grows to fill a tall phone slot and keeps the 8:9 aspect', () => {
    const f = fitBoard(368, 560, 8, 9);
    expect(f.width / f.height).toBeCloseTo(8 / 9, 5);
    expect(f.cell).toBe(46);
  });
  it('caps the cell, floors to whole pixels and survives zero or NaN slots', () => {
    expect(fitBoard(5000, 5000, 8, 9).cell).toBe(MAX_CELL);
    expect(fitBoard(0, 0, 8, 9).cell).toBe(1);
    expect(fitBoard(Number.NaN, 100, 8, 9).cell).toBe(1);
    expect(Number.isInteger(fitBoard(333, 777, 8, 9).cell)).toBe(true);
  });
});

describe('colour-blind assist default and migration', () => {
  it('new players get glyphs on', () => {
    expect(DEFAULT_SETTINGS.colorAssist).toBe(true);
    expect(parseSettings(null).colorAssist).toBe(true);
    expect(parseSettings({}).colorAssist).toBe(true);
  });
  it('legacy saves with colorAssist=false (never explicitly chosen) are upgraded', () => {
    expect(parseSettings({ theme: 'dark', colorAssist: false }).colorAssist).toBe(true);
    expect(parseSettings({ theme: 'dark', colorAssist: false }).theme).toBe('dark');
  });
  it('an explicit Off (assistChosen) is kept, and On stays On', () => {
    expect(parseSettings({ colorAssist: false, assistChosen: true }).colorAssist).toBe(false);
    expect(parseSettings({ colorAssist: true, assistChosen: true }).colorAssist).toBe(true);
    expect(parseSettings({ colorAssist: true }).colorAssist).toBe(true);
  });
  it('bad values fall back per field to the new default', () => {
    expect(parseSettings({ colorAssist: 'no', assistChosen: 'x' })).toMatchObject({ colorAssist: true, assistChosen: false });
    expect(migrateAssist({ ...DEFAULT_SETTINGS, colorAssist: false, assistChosen: false }).colorAssist).toBe(true);
  });
});

describe('no-moves card text', () => {
  it('says how many discs are left and why play ended', () => {
    expect(endDetail('stuck', 40, 250, 32)).toContain('32 discs left');
    expect(endDetail('stuck', 40, 250, 1)).toContain('1 disc left');
    expect(endDetail('short', 40, 250, 9)).toBe('Final score 40.');
  });
  it('a board with only lone discs has no moves', () => {
    expect(hasMoves(boardFromRows(['01', '10']))).toBe(false);
  });
});

describe('hero art and board plate', () => {
  it('hero spots are unique cells using valid colours', () => {
    const keys = new Set(HERO_SPOTS.map((s) => `${s.x},${s.y}`));
    expect(keys.size).toBe(HERO_SPOTS.length);
    for (const s of HERO_SPOTS) expect(DISC_COLOURS[s.c]).toBeDefined();
  });
  it('plate gradient top is a hex colour', () => {
    expect(PLATE_TOP).toMatch(/^#[0-9a-f]{6}$/i);
  });
});
