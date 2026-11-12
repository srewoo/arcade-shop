// Chooses how to fold a 1-D lily path into rows (serpentine) so every pad stays tappable.
import { CONFIG } from './config';

export interface Placement {
  readonly x: number;
  readonly y: number;
}
export interface Layout {
  readonly perRow: number;
  readonly rows: number;
  readonly cell: number;
}

/**
 * Fewest rows whose pads are big enough to fill the pond (fillCell); otherwise the row count
 * with the biggest pads (fewer rows win ties). Never smaller than minCell.
 */
export function chooseLayout(count: number, width: number, height: number): Layout {
  const { minCell, fillCell, maxCell } = CONFIG.layout;
  let best: Layout | undefined;
  for (let rows = 1; rows <= count; rows++) {
    const perRow = Math.ceil(count / rows);
    const cell = Math.min(width / perRow, height / rows, maxCell);
    if (cell >= fillCell) return { perRow, rows, cell };
    if (!best || cell > best.cell) best = { perRow, rows, cell };
  }
  if (!best || best.cell < minCell) {
    const perRow = Math.max(1, Math.floor(width / minCell));
    return { perRow, rows: Math.ceil(count / perRow), cell: minCell };
  }
  return best;
}

/** Serpentine placement: odd rows run right-to-left so neighbours along the path stay adjacent. */
export function placeLine(index: number, perRow: number): Placement {
  const y = Math.floor(index / perRow);
  const col = index % perRow;
  return { x: y % 2 === 0 ? col : perRow - 1 - col, y };
}
