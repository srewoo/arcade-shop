// Beam-search solver. Used to validate generated boards and to set the target
// score for the moves-limited mode. Deterministic (no randomness).
import { allGroups, boardKey, clearGroup, discCount, isEmpty, type Board, type Pt } from './board';
import { CONFIG } from './config';
import { clearBonus, groupPoints } from './scoring';

export interface SolveResult {
  readonly score: number;
  readonly moves: number;
  readonly cleared: boolean;
  readonly leftover: number;
  readonly path: readonly Pt[];
}
interface Node {
  readonly board: Board;
  readonly score: number;
  readonly path: readonly Pt[];
}

const potential = (b: Board): number => allGroups(b).reduce((n, g) => n + groupPoints(g.length), 0);
const rank = (n: Node): number => n.score + CONFIG.solver.potentialWeight * potential(n.board);

function expand(node: Node, bestByKey: Map<string, Node>): boolean {
  const groups = allGroups(node.board);
  for (const g of groups) {
    const res = clearGroup(node.board, g);
    const score = node.score + groupPoints(g.length) + (isEmpty(res.board) ? clearBonus() : 0);
    const key = boardKey(res.board);
    const prior = bestByKey.get(key);
    const first = g[0];
    if (first && (!prior || prior.score < score)) bestByKey.set(key, { board: res.board, score, path: [...node.path, first] });
  }
  return groups.length > 0;
}

const summarise = (n: Node): SolveResult => ({
  score: n.score,
  moves: n.path.length,
  cleared: isEmpty(n.board),
  leftover: discCount(n.board),
  path: n.path,
});

/** Best score found within maxMoves clears (Infinity = play to the end). */
export function solve(board: Board, maxMoves = Infinity, beam: number = CONFIG.solver.beam): SolveResult {
  let frontier: Node[] = [{ board, score: 0, path: [] }];
  let best = frontier[0] as Node;
  for (let step = 0; step < maxMoves && frontier.length > 0; step++) {
    const next = new Map<string, Node>();
    for (const node of frontier) expand(node, next);
    frontier = [...next.values()].sort((a, b) => rank(b) - rank(a)).slice(0, beam);
    for (const n of frontier) if (n.score > best.score || (n.score === best.score && n.path.length < best.path.length)) best = n;
  }
  return summarise(best);
}
