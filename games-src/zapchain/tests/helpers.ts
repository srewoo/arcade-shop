import { CONFIG } from '../src/config';
import { createRng } from '../src/rng';
import { Sim, type SimOptions } from '../src/model/sim';
import type { Kind } from '../src/model/types';
import { makeTile } from '../src/model/world';
import { emptyCells } from '../src/model/grid';

/** A sim whose grid is exactly `rows` (top to bottom, aligned to the floor); '.' is empty, 1-6 a kind. */
export function layout(rows: string[], opts: Partial<SimOptions> = {}): Sim {
  const sim = new Sim({ level: 1, rng: createRng(7), ...opts });
  sim.w.cells = emptyCells();
  sim.w.all.length = 0;
  const top = CONFIG.grid.floorRow - rows.length + 1;
  rows.forEach((line, i) => {
    [...line].forEach((ch, c) => {
      if (ch === '.') return;
      const t = makeTile(sim.w, Number(ch) as Kind, c, top + i);
      sim.w.cells[top + i]![c] = t;
      sim.w.all.push(t);
    });
  });
  return sim;
}

/** Row strings of the resting grid (rows 1..11), '.' for empty. */
export function dump(sim: Sim): string[] {
  const out: string[] = [];
  for (let r = 1; r <= CONFIG.grid.floorRow; r++) out.push(sim.cells[r]!.map((t) => (t ? String(t.kind) : '.')).join(''));
  return out;
}

/** Step until nothing is moving (or a safety cap), with the feeder frozen out of the way. */
export function settle(sim: Sim, maxSteps = 600): number {
  let n = 0;
  while (n < maxSteps && (sim.busy || n < 2)) { sim.step(CONFIG.sim.dt); n++; }
  return n;
}
