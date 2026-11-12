// Aim preview: where a shot would land and what it would pop. Pure, restores the grid.
import { Trace, traceShot } from './aim';
import { Bubble, Grid, Pos, landingCell, setCell } from './hex';
import { bombCells, matchGroup, trimRows } from './match';

export interface Preview {
  trace: Trace;
  landing: Pos | null;
  /** Cells that would pop, including the landing cell itself. */
  popped: Pos[];
  bomb: boolean;
}

/** Cells popped if `b` landed at `pos` (the grid is restored before returning). */
export function poppedAt(grid: Grid, pos: Pos, b: Bubble): Pos[] {
  setCell(grid, pos.row, pos.col, b);
  const cells = b.kind === 'bomb' ? bombCells(grid, pos) : matchGroup(grid, pos);
  setCell(grid, pos.row, pos.col, null);
  trimRows(grid);
  return cells;
}

export function previewShot(grid: Grid, angle: number, b: Bubble | null, maxBounces = 1): Preview {
  const trace = traceShot(grid, angle, maxBounces);
  const landing = trace.bounces > maxBounces ? null : landingCell(grid, trace.end.x, trace.end.y);
  const popped = landing && b ? poppedAt(grid, landing, b) : [];
  return { trace, landing, popped, bomb: b?.kind === 'bomb' };
}
