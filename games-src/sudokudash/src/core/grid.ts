// Grid model: a Grid is 81 numbers (row-major), 0 = empty. Pure, DOM-free.
export type Grid = number[];
export const CELLS = 81;

export const rowOf = (c: number): number => Math.floor(c / 9);
export const colOf = (c: number): number => c % 9;
export const boxOf = (c: number): number => Math.floor(rowOf(c) / 3) * 3 + Math.floor(colOf(c) / 3);

export type HouseKind = 'row' | 'col' | 'box';
export interface House {
  readonly kind: HouseKind;
  readonly index: number;
  readonly cells: readonly number[];
}

function buildHouses(): House[] {
  const out: House[] = [];
  for (let i = 0; i < 9; i++) {
    out.push({ kind: 'row', index: i, cells: Array.from({ length: 9 }, (_, k) => i * 9 + k) });
  }
  for (let i = 0; i < 9; i++) {
    out.push({ kind: 'col', index: i, cells: Array.from({ length: 9 }, (_, k) => k * 9 + i) });
  }
  for (let i = 0; i < 9; i++) {
    const r0 = Math.floor(i / 3) * 3;
    const c0 = (i % 3) * 3;
    const cells: number[] = [];
    for (let k = 0; k < 9; k++) cells.push((r0 + Math.floor(k / 3)) * 9 + c0 + (k % 3));
    out.push({ kind: 'box', index: i, cells });
  }
  return out;
}
export const HOUSES: readonly House[] = buildHouses();
export const ROWS = HOUSES.slice(0, 9);
export const COLS = HOUSES.slice(9, 18);
export const BOXES = HOUSES.slice(18, 27);

export const PEERS: readonly (readonly number[])[] = Array.from({ length: CELLS }, (_, c) => {
  const set = new Set<number>();
  for (const h of [ROWS[rowOf(c)], COLS[colOf(c)], BOXES[boxOf(c)]]) {
    for (const p of h?.cells ?? []) if (p !== c) set.add(p);
  }
  return [...set];
});

export const cellName = (c: number): string => `r${rowOf(c) + 1}c${colOf(c) + 1}`;

const BOX_NAMES = [
  'top-left', 'top-middle', 'top-right',
  'middle-left', 'centre', 'middle-right',
  'bottom-left', 'bottom-middle', 'bottom-right',
];
export function houseName(h: House): string {
  if (h.kind === 'row') return `row ${h.index + 1}`;
  if (h.kind === 'col') return `column ${h.index + 1}`;
  return `the ${BOX_NAMES[h.index] ?? ''} box`;
}

export const emptyGrid = (): Grid => new Array<number>(CELLS).fill(0);

/** Parse 81 chars of 1-9 / "." / "0" into a Grid; null when malformed. */
export function parseGrid(text: string): Grid | null {
  if (!/^[0-9.]{81}$/.test(text)) return null;
  return [...text].map((ch) => (ch === '.' ? 0 : Number(ch)));
}

export const formatGrid = (g: readonly number[]): string => g.map((d) => (d === 0 ? '.' : String(d))).join('');

export interface Conflict {
  readonly digit: number;
  readonly house: House;
  readonly cells: readonly number[];
}

/** Every digit that appears more than once in a house. */
export function findConflictDetails(g: readonly number[]): Conflict[] {
  const out: Conflict[] = [];
  for (const house of HOUSES) {
    const seen = new Map<number, number[]>();
    for (const c of house.cells) {
      const d = g[c] ?? 0;
      if (d === 0) continue;
      const list = seen.get(d) ?? [];
      list.push(c);
      seen.set(d, list);
    }
    for (const [digit, cells] of seen) if (cells.length > 1) out.push({ digit, house, cells });
  }
  return out;
}

export function findConflicts(g: readonly number[]): Set<number> {
  const out = new Set<number>();
  for (const k of findConflictDetails(g)) for (const c of k.cells) out.add(c);
  return out;
}

export const isComplete = (g: readonly number[]): boolean => g.every((d) => d >= 1 && d <= 9);

export const isValidSolution = (g: readonly number[]): boolean =>
  g.length === CELLS && isComplete(g) && findConflictDetails(g).length === 0;

export const countClues = (g: readonly number[]): number => g.filter((d) => d !== 0).length;
