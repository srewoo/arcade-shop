export type ScoreKind = 'ace' | 'albatross' | 'eagle' | 'birdie' | 'par' | 'bogey' | 'double' | 'triple' | 'over' | 'pickup';

export function scoreKind(strokes: number, par: number, pickedUp = false): ScoreKind {
  if (pickedUp) return 'pickup';
  if (strokes === 1) return 'ace';
  const d = strokes - par;
  if (d <= -3) return 'albatross';
  if (d === -2) return 'eagle';
  if (d === -1) return 'birdie';
  if (d === 0) return 'par';
  if (d === 1) return 'bogey';
  if (d === 2) return 'double';
  if (d === 3) return 'triple';
  return 'over';
}

export const KIND_LABEL: Readonly<Record<ScoreKind, string>> = {
  ace: 'Hole in one!', albatross: 'Albatross!', eagle: 'Eagle!', birdie: 'Birdie!', par: 'Par',
  bogey: 'Bogey', double: 'Double bogey', triple: 'Triple bogey', over: 'Over par', pickup: 'Pick up',
};

/** Callout worth celebrating (confetti, fanfare). */
export const isCelebration = (k: ScoreKind): boolean => k === 'ace' || k === 'albatross' || k === 'eagle' || k === 'birdie';

/** Relative-to-par label: "E", "+2", "-1". */
export const relLabel = (n: number): string => (n === 0 ? 'E' : n > 0 ? `+${n}` : `${n}`);

/** Indexes of the lowest totals (ties share the win). */
export function winners(totals: readonly number[]): number[] {
  const best = Math.min(...totals);
  return totals.flatMap((t, i) => (t === best ? [i] : []));
}

/** Play order: lowest score on the previous hole goes first; ties keep seat order. */
export function holeOrder(prev: readonly (number | null)[] | null): number[] {
  const seats = (prev ?? []).map((_, i) => i);
  if (!prev) return [];
  return seats.sort((a, b) => ((prev[a] ?? 99) - (prev[b] ?? 99)) || a - b);
}
