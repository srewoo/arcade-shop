// Pure jug rules: three moves (fill from the well, empty to the drain, pour
// between jugs) and the gate goal. No DOM, no randomness.
export type Amounts = readonly number[];

export type Move =
  | { readonly kind: 'fill'; readonly jug: number }
  | { readonly kind: 'empty'; readonly jug: number }
  | { readonly kind: 'pour'; readonly from: number; readonly to: number };

/** The gate opens when at least `count` jugs each hold exactly `amount`. */
export interface Goal {
  readonly amount: number;
  readonly count: number;
}

export interface LevelDef {
  readonly id: number;
  readonly name: string;
  readonly jugs: readonly number[];
  readonly start: Amounts;
  readonly goal: Goal;
  readonly par: number;
}

/** Result of a legal move, or null when the move would change nothing. */
export function applyMove(caps: readonly number[], amounts: Amounts, move: Move): Amounts | null {
  const next = [...amounts];
  if (move.kind === 'fill') {
    const cap = caps[move.jug];
    if (cap === undefined || amounts[move.jug] === cap) return null;
    next[move.jug] = cap;
    return next;
  }
  if (move.kind === 'empty') {
    if (amounts[move.jug] === undefined || amounts[move.jug] === 0) return null;
    next[move.jug] = 0;
    return next;
  }
  const { from, to } = move;
  const src = amounts[from];
  const dst = amounts[to];
  const room = caps[to];
  if (from === to || src === undefined || dst === undefined || room === undefined) return null;
  const moved = Math.min(src, room - dst);
  if (moved <= 0) return null;
  next[from] = src - moved;
  next[to] = dst + moved;
  return next;
}

export function legalMoves(caps: readonly number[], amounts: Amounts): Move[] {
  const out: Move[] = [];
  caps.forEach((_, i) => {
    out.push({ kind: 'fill', jug: i }, { kind: 'empty', jug: i });
    caps.forEach((__, j) => out.push({ kind: 'pour', from: i, to: j }));
  });
  return out.filter((m) => applyMove(caps, amounts, m) !== null);
}

export const jugsHolding = (amounts: Amounts, amount: number): number[] =>
  amounts.flatMap((v, i) => (v === amount ? [i] : []));

export const isGoal = (amounts: Amounts, goal: Goal): boolean => jugsHolding(amounts, goal.amount).length >= goal.count;

/** Check a level definition is well formed (used for data and generated levels). */
export function validateShape(caps: readonly number[], start: Amounts, goal: Goal): string | null {
  if (caps.length < 2 || caps.length > 4) return 'needs 2 to 4 jugs';
  if (start.length !== caps.length) return 'start length mismatch';
  if (caps.some((c) => !Number.isInteger(c) || c < 1 || c > 20)) return 'bad capacity';
  if (start.some((v, i) => !Number.isInteger(v) || v < 0 || v > (caps[i] ?? 0))) return 'bad start amount';
  if (!Number.isInteger(goal.amount) || goal.amount < 1) return 'bad goal amount';
  if (goal.count < 1 || goal.count > caps.length) return 'bad goal count';
  return null;
}
