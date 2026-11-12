// A simple greedy player: used by the title-screen attract mode and the ?debug=1 autopilot.
import { CONFIG } from '../config';
import { findGroup } from './grid';
import type { Sim } from './sim';
import { BOMB, type CellRef } from './types';

/** The best available zap: the biggest colour group, or a bomb when its row holds enough discs. */
export function bestMove(sim: Sim): CellRef | null {
  let best: (CellRef & { n: number }) | null = null;
  const seen = new Set<number>();
  for (let r = CONFIG.grid.floorRow; r >= 1; r--) {
    for (let c = 0; c < CONFIG.grid.cols; c++) {
      const t = sim.cells[r]?.[c];
      if (!t || seen.has(t.id)) continue;
      let n = 0;
      if (t.kind === BOMB) {
        n = (sim.cells[r] ?? []).filter(Boolean).length;
        n = n >= 6 ? n + 3 : 0;
      } else {
        const g = findGroup(sim.cells, c, r);
        for (const cell of g) { const o = sim.cells[cell.row]?.[cell.col]; if (o) seen.add(o.id); }
        n = g.length >= 2 ? g.length : 0;
      }
      if (n > 0 && (!best || n > best.n)) best = { col: c, row: r, n };
    }
  }
  return best ? { col: best.col, row: best.row } : null;
}
