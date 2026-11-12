// Board sizing: the largest whole-pixel cell that fits the free slot, so the board
// uses the shorter dimension in every orientation.
export interface BoardFit {
  readonly cell: number;
  readonly width: number;
  readonly height: number;
}

export const MAX_CELL = 120;

export function fitBoard(slotW: number, slotH: number, cols: number, rows: number): BoardFit {
  const raw = Math.min(slotW / cols, slotH / rows);
  const cell = Math.max(1, Math.min(MAX_CELL, Math.floor(Number.isFinite(raw) ? raw : 1)));
  return { cell, width: cell * cols, height: cell * rows };
}

/** Keep `wrap` sized to the best fit inside `slot` (re-fits on every slot resize). */
export function installBoardFit(slot: HTMLElement, wrap: HTMLElement, cols: number, rows: number): () => void {
  const apply = (): void => {
    const fit = fitBoard(slot.clientWidth, slot.clientHeight, cols, rows);
    wrap.style.width = `${fit.width}px`;
    wrap.style.height = `${fit.height}px`;
  };
  new ResizeObserver(apply).observe(slot);
  apply();
  return apply;
}
