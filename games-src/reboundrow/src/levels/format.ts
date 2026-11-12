// Compact level format.
//   "Name|row/row/row"   rows top to bottom, '/' separated, 12 columns each.
//   '.' empty   '1' '2' '3' bricks with that many hits   '#' indestructible
//   'w' 'm' 's' 'l' one-hit bricks that always drop wide / multiball / slow / laser
//   A row starting with '~' lists only the left 6 columns and is mirrored.
import { LEVEL_COLS, CONFIG } from '../config';

export type PowerKind = 'wide' | 'multi' | 'slow' | 'laser';
export type Cell = null | { readonly kind: 'steel' } | { readonly kind: 'brick'; readonly hp: number; readonly power: PowerKind | null };
export interface ParsedLevel {
  readonly name: string;
  readonly cells: readonly (readonly Cell[])[];
}

export const POWER_CHARS: Readonly<Record<string, PowerKind>> = { w: 'wide', m: 'multi', s: 'slow', l: 'laser' };

function parseChar(ch: string): Cell {
  if (ch === '.') return null;
  if (ch === '#') return { kind: 'steel' };
  if (ch === '1' || ch === '2' || ch === '3') return { kind: 'brick', hp: Number(ch), power: null };
  const power = POWER_CHARS[ch];
  if (power) return { kind: 'brick', hp: 1, power };
  throw new Error(`unknown cell character "${ch}"`);
}

export function expandRow(row: string): string {
  if (!row.startsWith('~')) return row;
  const half = row.slice(1);
  return half + [...half].reverse().join('');
}

export function parseLevel(raw: string): ParsedLevel {
  const bar = raw.indexOf('|');
  if (bar < 1) throw new Error('level needs "Name|rows"');
  const rows = raw.slice(bar + 1).split('/').map(expandRow);
  const cells = rows.map((row) => {
    if (row.length !== LEVEL_COLS) throw new Error(`row "${row}" must be ${LEVEL_COLS} columns`);
    return [...row].map(parseChar);
  });
  if (cells.length > CONFIG.field.maxRows) throw new Error('too many rows');
  return { name: raw.slice(0, bar).trim(), cells };
}

export const isDestructible = (c: Cell): boolean => c !== null && c.kind === 'brick';
export const countDestructible = (cells: readonly (readonly Cell[])[]): number =>
  cells.reduce((n, row) => n + row.filter(isDestructible).length, 0);
