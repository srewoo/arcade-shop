// Optimal-route solver: uniform-cost search (BFS generalised to weighted moves)
// over (start-bank mask, carrier side). Used to rate par, validate every level,
// give hints and detect dead ends. State spaces are tiny (<= 2^9 * 2).
import { applyMove, checkMove, initialState, isWon, legalMoves } from './engine';
import type { Level, State } from './types';

export interface Solution {
  /** Remaining cost from the starting state of the search. */
  readonly cost: number;
  readonly path: readonly (readonly number[])[];
}

const keyOf = (s: State): number => s.start * 2 + (s.carrierAtStart ? 1 : 0);

export function solve(level: Level, from: State = initialState(level)): Solution | null {
  const best = new Map<number, number>([[keyOf(from), 0]]);
  const prev = new Map<number, { from: number; group: readonly number[] }>();
  const done = new Set<number>();
  const states = new Map<number, State>([[keyOf(from), { ...from, cost: 0, moves: 0 }]]);
  for (;;) {
    let cur = -1;
    for (const [k, c] of best) if (!done.has(k) && (cur < 0 || c < (best.get(cur) ?? Infinity))) cur = k;
    if (cur < 0) return null;
    done.add(cur);
    const s = states.get(cur) as State;
    if (isWon(s)) return { cost: best.get(cur) as number, path: rebuild(prev, cur) };
    for (const group of legalMoves(level, s)) {
      const next = applyMove(level, s, group);
      const nk = keyOf(next);
      if (next.cost < (best.get(nk) ?? Infinity)) {
        best.set(nk, next.cost);
        states.set(nk, next);
        prev.set(nk, { from: cur, group });
      }
    }
  }
}

function rebuild(prev: Map<number, { from: number; group: readonly number[] }>, end: number): (readonly number[])[] {
  const path: (readonly number[])[] = [];
  for (let k = end, p = prev.get(k); p; p = prev.get(k)) {
    path.unshift(p.group);
    k = p.from;
  }
  return path;
}

export interface Verdict {
  readonly valid: boolean;
  readonly solved: boolean;
  readonly cost: number;
  readonly moves: number;
  readonly withinLimit: boolean;
  readonly optimal: boolean;
}

/** Replay a list of moves from the start and judge it against par and the limit. */
export function checkSolution(level: Level, moves: readonly (readonly number[])[]): Verdict {
  let s = initialState(level);
  for (const group of moves) {
    if (!checkMove(level, s, group).ok) return { valid: false, solved: false, cost: s.cost, moves: s.moves, withinLimit: false, optimal: false };
    s = applyMove(level, s, group);
  }
  const solved = isWon(s);
  const withinLimit = level.limit === null || s.cost <= level.limit;
  return { valid: true, solved, cost: s.cost, moves: s.moves, withinLimit, optimal: solved && s.cost === level.par };
}
