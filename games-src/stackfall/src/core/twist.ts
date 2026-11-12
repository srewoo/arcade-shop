// "Twist" detection for the spur shape (3-corner rule).
import { HEIGHT, WIDTH, type Board, type Piece } from './board';

export type TwistKind = 'none' | 'mini' | 'twist';

const CORNERS: readonly (readonly [number, number])[] = [[0, 0], [2, 0], [0, 2], [2, 2]];
// Corner indexes in front of the spur's nose for each rotation (up, right, down, left).
const FRONT: readonly (readonly [number, number])[] = [[0, 1], [1, 3], [2, 3], [0, 2]];

function filled(board: Board, x: number, y: number): boolean {
  if (x < 0 || x >= WIDTH || y < 0 || y >= HEIGHT) return true;
  return (board[y] as number[])[x] !== 0;
}

/** Call before the piece is merged into the board. */
export function detectTwist(board: Board, p: Piece, lastWasRotation: boolean): TwistKind {
  if (p.id !== 'spur' || !lastWasRotation) return 'none';
  const hit = CORNERS.map(([cx, cy]) => filled(board, p.x + cx, p.y + cy));
  if (hit.filter(Boolean).length < 3) return 'none';
  const [a, b] = FRONT[p.rot % 4] as readonly [number, number];
  return hit[a] && hit[b] ? 'twist' : 'mini';
}
