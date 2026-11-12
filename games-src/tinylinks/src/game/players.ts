// Player identity: a ball colour plus a non-colour marker so colour is never the only cue.
export const BALL_COLORS = [
  { id: 'tomato', name: 'Tomato', hex: '#ff5a4e' },
  { id: 'sky', name: 'Sky', hex: '#3fa9ff' },
  { id: 'sun', name: 'Sun', hex: '#ffd23f' },
  { id: 'violet', name: 'Violet', hex: '#b58cff' },
  { id: 'orange', name: 'Orange', hex: '#ff9a3d' },
  { id: 'pink', name: 'Pink', hex: '#ff7ac6' },
  { id: 'white', name: 'White', hex: '#f6f6ef' },
  { id: 'slate', name: 'Slate', hex: '#4a5568' },
] as const;
export type ColorId = (typeof BALL_COLORS)[number]['id'];
export const COLOR_IDS = BALL_COLORS.map((c) => c.id) as [ColorId, ...ColorId[]];

export const MARKERS = ['dot', 'triangle', 'square', 'diamond'] as const;
export type Marker = (typeof MARKERS)[number];
export const MARKER_GLYPH: Readonly<Record<Marker, string>> = { dot: '●', triangle: '▲', square: '■', diamond: '◆' };

export interface Player { name: string; color: ColorId }

export const colorHex = (id: ColorId): string => (BALL_COLORS.find((c) => c.id === id) ?? BALL_COLORS[0]).hex;
export const colorName = (id: ColorId): string => (BALL_COLORS.find((c) => c.id === id) ?? BALL_COLORS[0]).name;
export const markerFor = (seat: number): Marker => MARKERS[seat % MARKERS.length] as Marker;

export const MAX_NAME = 12;

/** Trim, collapse whitespace, drop control characters, clip; empty names become "Player N". */
export function cleanName(raw: string, seat: number): string {
  // eslint-disable-next-line no-control-regex
  const s = raw.replace(/[\u0000-\u001f\u007f<>]/g, '').replace(/\s+/g, ' ').trim().slice(0, MAX_NAME).trim();
  return s || `Player ${seat + 1}`;
}

/** Default distinct colours for `count` seats. */
export const defaultPlayers = (count: number): Player[] =>
  Array.from({ length: count }, (_, i) => ({ name: `Player ${i + 1}`, color: COLOR_IDS[i] as ColorId }));

/** Make colours distinct: a later duplicate takes the first free colour. */
export function dedupeColors(players: readonly Player[]): Player[] {
  const used = new Set<ColorId>();
  return players.map((p) => {
    let color = p.color;
    if (used.has(color)) color = COLOR_IDS.find((c) => !used.has(c)) ?? color;
    used.add(color);
    return { ...p, color };
  });
}
