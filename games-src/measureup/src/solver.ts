// Breadth-first solver over jug states. The shortest path length is the
// level's par; the first step of it is the hint.
import { applyMove, isGoal, legalMoves, type Amounts, type Goal, type Move } from './jugs';

/** Shortest move list from `start` to the goal, or null when unreachable. */
export function solve(caps: readonly number[], start: Amounts, goal: Goal): Move[] | null {
  const base = Math.max(...caps) + 1;
  const keyOf = (a: Amounts): number => a.reduce((acc, v) => acc * base + v, 0);
  const states: Amounts[] = [start];
  const parent: number[] = [-1];
  const via: (Move | null)[] = [null];
  const seen = new Set<number>([keyOf(start)]);
  for (let head = 0; head < states.length; head++) {
    const here = states[head] as Amounts;
    if (isGoal(here, goal)) return pathTo(head, parent, via);
    for (const move of legalMoves(caps, here)) {
      const next = applyMove(caps, here, move);
      if (!next || seen.has(keyOf(next))) continue;
      seen.add(keyOf(next));
      states.push(next);
      parent.push(head);
      via.push(move);
    }
  }
  return null;
}

function pathTo(index: number, parent: number[], via: (Move | null)[]): Move[] {
  const path: Move[] = [];
  for (let at = index; at > 0; at = parent[at] as number) path.push(via[at] as Move);
  return path.reverse();
}

export const parOf = (caps: readonly number[], start: Amounts, goal: Goal): number | null =>
  solve(caps, start, goal)?.length ?? null;

/** Next best move from the current position (null when solved or stuck). */
export function hintFor(caps: readonly number[], amounts: Amounts, goal: Goal): Move | null {
  return solve(caps, amounts, goal)?.[0] ?? null;
}
