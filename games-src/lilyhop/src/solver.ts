// Breadth-first state graph. All states reachable from `spec.start` are enumerated once;
// a reverse BFS from the goal then gives every state's distance to the finish (or none = stuck).
import { applyMove, legalMoves, type BoardSpec, type Move } from './board';
import { CONFIG } from './config';

export interface Solver {
  /** Moves still needed from `state`; undefined when the goal can no longer be reached. */
  distance(state: string): number | undefined;
  /** First move of a shortest solution, if one exists. */
  bestMove(state: string): Move | undefined;
  readonly optimal: number | undefined;
  readonly stateCount: number;
  /** All states that can still reach the goal, with their distance. */
  solvable(): [string, number][];
}

export function buildSolver(spec: BoardSpec): Solver {
  const edges = new Map<string, Move[]>();
  const reverse = new Map<string, string[]>();
  const queue = [spec.start];
  edges.set(spec.start, []);
  for (let head = 0; head < queue.length; head++) {
    const state = queue[head] as string;
    const moves = legalMoves(spec, state);
    edges.set(state, moves);
    for (const m of moves) {
      const next = applyMove(state, m);
      const back = reverse.get(next);
      if (back) back.push(state);
      else reverse.set(next, [state]);
      if (!edges.has(next)) {
        if (edges.size >= CONFIG.solver.maxStates) throw new Error(`state graph too large for ${spec.id}`);
        edges.set(next, []);
        queue.push(next);
      }
    }
  }
  const dist = new Map<string, number>();
  if (edges.has(spec.goal)) dist.set(spec.goal, 0);
  const frontier = [spec.goal];
  for (let head = 0; head < frontier.length; head++) {
    const state = frontier[head] as string;
    const d = dist.get(state) as number;
    for (const prev of reverse.get(state) ?? []) {
      if (dist.has(prev)) continue;
      dist.set(prev, d + 1);
      frontier.push(prev);
    }
  }
  const distance = (state: string): number | undefined => dist.get(state);
  return {
    distance,
    bestMove(state) {
      const d = distance(state);
      if (d === undefined || d === 0) return undefined;
      return (edges.get(state) ?? []).find((m) => distance(applyMove(state, m)) === d - 1);
    },
    optimal: distance(spec.start),
    stateCount: edges.size,
    solvable: () => [...dist.entries()],
  };
}

const cache = new Map<string, Solver>();

/** Memoised solver per board id + start (levels are immutable). */
export function solverFor(spec: BoardSpec): Solver {
  const key = `${spec.id}|${spec.start}`;
  let s = cache.get(key);
  if (!s) {
    s = buildSolver(spec);
    cache.set(key, s);
  }
  return s;
}
