import type { Move } from './jugs';
import { S } from './strings';

/** Plain-language text for a move (hints and screen readers). */
export function describeMove(move: Move): string {
  if (move.kind === 'fill') return S.moveFill(S.jugName(move.jug));
  if (move.kind === 'empty') return S.moveEmpty(S.jugName(move.jug));
  return S.movePour(S.jugName(move.from), S.jugName(move.to));
}
