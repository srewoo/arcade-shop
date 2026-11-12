// Canvas layout. Landscape: the well fills the stage height with Stash on the
// left and Next on the right. Portrait phones: a strip above the well.
import { layoutCfg as L } from '../config/layout';

export interface Box { x: number; y: number; w: number; h: number }
export interface NextBox extends Box { horizontal: boolean; step: number }
export interface Layout {
  portrait: boolean;
  cell: number;
  mini: number;
  labelPx: number; // panel label font size, never below 12 px
  labelH: number; // height reserved for the label inside a panel
  slot: { w: number; h: number }; // one piece slot (Stash or a Next entry)
  well: Box;
  stash: Box;
  next: NextBox;
}

const PAD = 6;

function metrics(mini: number, textScale: number): { labelPx: number; labelH: number; slot: { w: number; h: number } } {
  const slot = { w: 4.2 * mini, h: 2.6 * mini };
  const labelPx = Math.max(L.labelMinPx, Math.round(mini * L.miniFactor * textScale));
  return { labelPx, labelH: labelPx + 6, slot };
}

export function computeLayout(W: number, H: number, textScale = 1): Layout {
  return W / H < L.portraitBelow ? portraitLayout(W, H, textScale) : landscapeLayout(W, H, textScale);
}

function landscapeLayout(W: number, H: number, textScale: number): Layout {
  const { rows, cols } = L;
  const cell = Math.max(L.minCell, Math.min((H - 2 * L.gapPx) / (rows + L.bedRows), W / (cols + 2 * L.sideCells)));
  const mini = cell * L.miniFactor;
  const m = metrics(mini, textScale);
  const wx = (W - cols * cell) / 2;
  const wy = Math.max(0, (H - cell * (rows + L.bedRows)) / 2);
  const panelW = m.slot.w + 2 * PAD;
  const gap = cell * 0.6;
  return {
    portrait: false, cell, mini, ...m,
    well: { x: wx, y: wy, w: cols * cell, h: rows * cell },
    stash: { x: wx - panelW - gap, y: wy, w: panelW, h: m.labelH + m.slot.h + PAD },
    next: { x: wx + cols * cell + gap, y: wy, w: panelW, h: m.labelH + 5 * m.slot.h + PAD, horizontal: false, step: m.slot.h },
  };
}

function portraitLayout(W: number, H: number, textScale: number): Layout {
  const { rows, cols } = L;
  const gap = 6;
  const miniFit = (W - 2 * gap - 6 * 2 * PAD - 5 * gap) / (6 * 4.2);
  const heightCell = (stripH: number): number => (H - stripH - 3 * gap - 4) / (rows + L.bedRows * 0.5);
  const widthCell = (W - 2 * gap) / cols;
  const first = metrics(miniFit, textScale);
  const cell0 = Math.max(L.minCell, Math.min(widthCell, heightCell(first.labelH + first.slot.h + PAD)));
  const mini = Math.max(4, Math.min(cell0 * 0.5, miniFit));
  const m = metrics(mini, textScale);
  const stripH = m.labelH + m.slot.h + PAD;
  const cell = Math.max(L.minCell, Math.min(widthCell, heightCell(stripH)));
  const panelW = m.slot.w + 2 * PAD;
  const stripW = 6 * panelW + 5 * gap;
  const sx = (W - stripW) / 2;
  const wx = (W - cols * cell) / 2;
  const wy = stripH + 2 * gap + Math.max(0, (H - stripH - 3 * gap - rows * cell - 4) / 2);
  return {
    portrait: true, cell, mini, ...m,
    well: { x: wx, y: wy, w: cols * cell, h: rows * cell },
    stash: { x: sx, y: gap, w: panelW, h: stripH },
    next: { x: sx + panelW + gap, y: gap, w: 5 * panelW + 4 * gap, h: stripH, horizontal: true, step: panelW + gap },
  };
}
