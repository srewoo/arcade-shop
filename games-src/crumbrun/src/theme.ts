// Colourways: the same kitchen at night, three tile/cabinet treatments plus a high-contrast one.
// Floors sit in a narrow, dark, low-chroma band (floorA:floorB <= 1.1:1) so crumbs and actors pop;
// counters are light so wall:floor is >= 3:1. tests/theme.test.ts guards every ratio.
export type TileStyle = 'checker' | 'terracotta' | 'plank' | 'flat';

export interface Theme {
  readonly name: string;
  readonly style: TileStyle;
  readonly floorA: string;
  readonly floorB: string;
  readonly grout: string;
  readonly wallTop: string;
  readonly wallFace: string;
  readonly wallEdge: string;
  readonly handle: string;
}

export const THEMES: readonly Theme[] = [
  { name: 'Checker Night', style: 'checker', floorA: '#5a4e41', floorB: '#54483c', grout: '#42382e',
    wallTop: '#ecc283', wallFace: '#d29c5e', wallEdge: '#3a2410', handle: '#6b4420' },
  { name: 'Terracotta', style: 'terracotta', floorA: '#5e463f', floorB: '#58413a', grout: '#46332e',
    wallTop: '#a8dcd8', wallFace: '#7dbcbc', wallEdge: '#1d3d3f', handle: '#1f4a4c' },
  { name: 'Slate Plank', style: 'plank', floorA: '#425564', floorB: '#3e505e', grout: '#33434f',
    wallTop: '#f4ead0', wallFace: '#dccca6', wallEdge: '#6a5a38', handle: '#6b4a2c' },
];

export const HIGH_CONTRAST_THEME: Theme = {
  name: 'High contrast', style: 'flat', floorA: '#1b1b22', floorB: '#1b1b22', grout: '#1b1b22',
  wallTop: '#ffffff', wallFace: '#e8e8e8', wallEdge: '#000000', handle: '#1b1b22',
};

/** Colours the actors and pickups are drawn with; the theme test checks them against each floor. */
export const ACTOR_COLORS = Object.freeze({
  pip: '#d5d9e2', rim: '#f6ecd2', crumb: '#fff0c0', pistolHalo: '#ffffff', dark: '#120a0e',
});

export function themeFor(index: number, highContrast = false): Theme {
  if (highContrast) return HIGH_CONTRAST_THEME;
  return THEMES[((index % THEMES.length) + THEMES.length) % THEMES.length] as Theme;
}
