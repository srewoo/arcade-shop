// Dev tool: beam-search solver for the puzzle levels (not shipped).
// Run: npx esbuild scripts/solve-puzzles.ts --bundle --platform=node --format=esm --outfile=/tmp/solve.mjs && node /tmp/solve.mjs [beam] [level]
// Prints JSON: best-found shot count and the aim sequence for every level.
import { traceShot } from '../src/aim';
import { newEffects } from '../src/effects';
import { Pos, bubbleCount, forEachBubble, landingCell, lowestRow } from '../src/hex';
import { PUZZLES } from '../src/levels';
import { landAt } from '../src/resolve';
import { Game, drawNext, newGame } from '../src/state';

declare const process: { argv: string[] };

export interface Move { swap: boolean; deg: number }
interface Node { g: Game; moves: Move[] }

const clone = (g: Game): Game => ({
  ...g,
  grid: { rows: g.grid.rows.map((r) => r.slice()), phase: g.grid.phase },
  fx: newEffects(),
  events: [],
});

const key = (g: Game): string =>
  `${g.queuePos}|${g.cur?.kind}${g.cur?.color}|${g.next?.kind}${g.next?.color}|${g.grid.phase}|` +
  g.grid.rows.map((r) => r.map((c) => (c ? `${c.kind[0]}${c.color}` : '.')).join(',')).join('/');

function coloured(g: Game): number {
  let n = 0;
  forEachBubble(g.grid, (b) => {
    if (b.kind !== 'stone') n++;
  });
  return n;
}

/** Distinct landing cells reachable with 1-degree aim steps, with one angle each. */
function landings(g: Game): { pos: Pos; deg: number }[] {
  const seen = new Map<string, { pos: Pos; deg: number }>();
  for (let deg = -78; deg <= 78; deg++) {
    const end = traceShot(g.grid, (deg * Math.PI) / 180, 8).end;
    const pos = landingCell(g.grid, end.x, end.y);
    if (pos && !seen.has(`${pos.row},${pos.col}`)) seen.set(`${pos.row},${pos.col}`, { pos, deg });
  }
  return [...seen.values()];
}

function shootAt(g: Game, swap: boolean, pos: Pos): void {
  if (swap) [g.cur, g.next] = [g.next, g.cur];
  const bubble = g.cur;
  if (!bubble) return;
  g.cur = g.next;
  g.next = drawNext(g);
  g.shots++;
  landAt(g, pos, bubble);
}

function expand(n: Node): Node[] {
  const out: Node[] = [];
  const spots = landings(n.g);
  const sameNext = n.g.next && n.g.cur && n.g.next.kind === n.g.cur.kind && n.g.next.color === n.g.cur.color;
  for (const swap of sameNext || !n.g.next ? [false] : [false, true]) {
    for (const { pos, deg } of spots) {
      const g = clone(n.g);
      shootAt(g, swap, pos);
      if (g.status === 'lost') continue;
      out.push({ g, moves: [...n.moves, { swap, deg }] });
    }
  }
  return out;
}

export function solve(index: number, beam: number): { shots: number; moves: Move[] } | null {
  const root: Node = { g: newGame('puzzle', { puzzleIndex: index, seed: 1 }), moves: [] };
  let layer: Node[] = [root];
  const limit = root.g.limit;
  for (let depth = 1; depth <= limit && layer.length; depth++) {
    const next = new Map<string, Node>();
    for (const n of layer) {
      for (const c of expand(n)) {
        if (c.g.status === 'won') return { shots: depth, moves: c.moves };
        const k = key(c.g);
        if (!next.has(k)) next.set(k, c);
      }
    }
    layer = [...next.values()]
      .sort((a, b) => coloured(a.g) + 0.01 * lowestRow(a.g.grid) - (coloured(b.g) + 0.01 * lowestRow(b.g.grid)))
      .slice(0, beam);
  }
  return null;
}

const beam = Number(process.argv[2] ?? 120);
const only = process.argv[3] ? Number(process.argv[3]) : -1;
const result = PUZZLES.map((p, i) => {
  if (only >= 0 && i !== only) return null;
  const r = solve(i, beam);
  return { index: i, name: p.name, bubbles: bubbleCount(newGame('puzzle', { puzzleIndex: i, seed: 1 }).grid), ...(r ?? { shots: null, moves: [] }) };
}).filter(Boolean);
console.log(JSON.stringify(result));
