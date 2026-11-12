// Original "polished stone" palettes for the glass-terrarium look.
export interface Stone {
  readonly name: string;
  readonly base: string;
  readonly light: string;
  readonly dark: string;
  readonly glow: string;
}

const hexToRgb = (h: string): [number, number, number] => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)) as [number, number, number];
const toHex = (c: number[]): string => '#' + c.map((v) => Math.round(v).toString(16).padStart(2, '0')).join('');
const mixHex = (a: string, b: string, t: number): string => {
  const x = hexToRgb(a);
  const y = hexToRgb(b);
  return toHex(x.map((v, i) => v + ((y[i] as number) - v) * t));
};

/** Build light/dark/glow variants from one base colour. */
const stone = (name: string, base: string): Stone => ({
  name, base, light: mixHex(base, '#ffffff', 0.55), dark: mixHex(base, '#000000', 0.42), glow: mixHex(base, '#ffffff', 0.28),
});

// Index 1..7 follow SHAPE_IDS order; 8 is the garbage pebble. Garnet and Pebble were
// lightened so every stone is at least 3:1 (Garnet and Pebble 4.5:1) against the well.
export const DEFAULT_STONES: readonly (Stone | undefined)[] = [
  undefined,
  { name: 'Copper', base: '#d98a52', light: '#ffd0a6', dark: '#8f4a22', glow: '#ffb27a' },
  { name: 'Rose quartz', base: '#ee9bb5', light: '#ffe0ea', dark: '#a8506f', glow: '#ffb8cf' },
  { name: 'Jade', base: '#3fbf95', light: '#b4f5dc', dark: '#17715a', glow: '#6cf0c0' },
  { name: 'Sapphire', base: '#5b86ee', light: '#c0d2ff', dark: '#2a3f94', glow: '#8aaaff' },
  { name: 'Sandstone', base: '#d6c17c', light: '#f7ecc0', dark: '#8a7638', glow: '#f1de96' },
  { name: 'Amethyst', base: '#a77be0', light: '#e3d0ff', dark: '#5d3a96', glow: '#c9a4ff' },
  { name: 'Garnet', base: '#fd687c', light: '#ffc4cc', dark: '#9c2338', glow: '#ff9aa8' },
  { name: 'Pebble', base: '#a19b91', light: '#d9d3c8', dark: '#5c564e', glow: '#c4bcae' },
];

// Colour-blind assist: seven stones chosen so every pair stays at least 20 delta-E apart
// in normal, protan, deutan and tritan simulation (see tests/palette.test.ts).
export const ASSIST_STONES: readonly (Stone | undefined)[] = [
  undefined,
  stone('Peridot', '#49dc85'),
  stone('Orchid', '#c983d4'),
  stone('Moss agate', '#4a8d6a'),
  stone('Iolite', '#8a61e4'),
  stone('Carnelian', '#ce702c'),
  stone('Moonstone', '#b0dad7'),
  stone('Citrine', '#dadb27'),
  { name: 'Pebble', base: '#a19b91', light: '#d9d3c8', dark: '#5c564e', glow: '#c4bcae' },
];

export const stoneOf = (idx: number, assist = false): Stone => {
  const list = assist ? ASSIST_STONES : DEFAULT_STONES;
  return (list[idx] ?? list[8]) as Stone;
};

/** Hue (degrees) of the terrarium sky for a level: drifts from dawn-green to dusk-violet. */
export const levelHue = (level: number): number => (150 + (level - 1) * 17) % 360;

/** Glyph ink: near-black, drawn with a light halo, so a glyph is at least 3:1 on every stone (tests/glyph.test.ts). */
export const GLYPH_INK = '#12141c';
export const GLYPH_HALO = '#ffffff';
