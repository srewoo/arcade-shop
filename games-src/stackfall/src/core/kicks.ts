// Rotation with wall/floor kicks. Own table: try in place, then sideways,
// then upward (floor kick). The spur also tries downward slides so twists
// into overhangs are reachable. CCW mirrors the horizontal preference of CW.
import { collides, type Board, type Piece } from './board';
import type { ShapeId } from './shapes';

type Offset = readonly [number, number];

const BASE: readonly Offset[] = [[0, 0], [-1, 0], [1, 0], [0, -1], [-1, -1], [1, -1]];
const WIDE: readonly Offset[] = [[0, 0], [-1, 0], [1, 0], [-2, 0], [2, 0], [0, -1], [0, -2], [-1, -1], [1, -1]];
const SLIDE: readonly Offset[] = [...BASE, [0, 1], [-1, 1], [1, 1]];

export function kickTable(id: ShapeId, dir: 1 | -1): readonly Offset[] {
  if (id === 'cube') return [[0, 0]];
  const table = id === 'bar' ? WIDE : id === 'spur' ? SLIDE : BASE;
  if (dir === 1) return table;
  return table.map(([dx, dy]): Offset => [-dx, dy]);
}

export interface RotateResult {
  piece: Piece;
  kick: number; // index of the kick used (0 = none)
}

/** Rotate by dir (+1 clockwise, -1 counter-clockwise); null if every kick collides. */
export function rotateWithKicks(board: Board, p: Piece, dir: 1 | -1): RotateResult | null {
  const rot = (p.rot + dir + 4) % 4;
  const table = kickTable(p.id, dir);
  for (let i = 0; i < table.length; i++) {
    const [dx, dy] = table[i] as Offset;
    if (!collides(board, p.id, rot, p.x + dx, p.y + dy)) {
      return { piece: { id: p.id, rot, x: p.x + dx, y: p.y + dy }, kick: i };
    }
  }
  return null;
}
