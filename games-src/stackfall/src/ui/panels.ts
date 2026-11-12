// Stash and Next panels (canvas). Labels are at least 12 px and slots are centred.
import { cellsOf, shapeIndex, type ShapeId } from '../core/shapes';
import type { Layout } from './layout';
import { stoneSprite } from './stones';

export interface PanelOpts { dpr: number; assist: boolean; paused: boolean }

function panelFrame(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, label: string, l: Layout): void {
  c.fillStyle = 'rgba(255,255,255,0.09)';
  c.strokeStyle = 'rgba(255,255,255,0.4)';
  c.lineWidth = 1;
  c.beginPath();
  c.roundRect(x, y, w, h, 8);
  c.fill();
  c.stroke();
  c.fillStyle = 'rgba(255,255,255,0.82)';
  c.font = `700 ${l.labelPx}px system-ui, sans-serif`;
  c.textAlign = 'left';
  c.textBaseline = 'alphabetic';
  c.fillText(label.toUpperCase(), x + 6, y + l.labelPx + 2);
}

/** Draw a shape centred in a slot (rotation 0), at `mini` cell size. */
export function drawMini(c: CanvasRenderingContext2D, l: Layout, id: ShapeId, sx: number, sy: number, o: PanelOpts, dim: boolean): void {
  const cells = cellsOf(id, 0);
  const xs = cells.map(([x]) => x);
  const ys = cells.map(([, y]) => y);
  const w = Math.max(...xs) - Math.min(...xs) + 1;
  const h = Math.max(...ys) - Math.min(...ys) + 1;
  const ox = sx + (l.slot.w - w * l.mini) / 2 - Math.min(...xs) * l.mini;
  const oy = sy + (l.slot.h - h * l.mini) / 2 - Math.min(...ys) * l.mini;
  const sprite = stoneSprite(shapeIndex(id), l.mini * o.dpr, o.assist);
  c.globalAlpha = dim ? 0.45 : 1;
  for (const [cx, cy] of cells) c.drawImage(sprite, ox + cx * l.mini, oy + cy * l.mini, l.mini, l.mini);
  c.globalAlpha = 1;
}

export function drawPanels(c: CanvasRenderingContext2D, l: Layout, stash: ShapeId | null, canStash: boolean, upcoming: readonly ShapeId[], o: PanelOpts, hideStashSlot = false): void {
  const { stash: sb, next: nb } = l;
  panelFrame(c, sb.x, sb.y, sb.w, sb.h, 'Stash', l);
  if (stash && !hideStashSlot) drawMini(c, l, stash, sb.x + (sb.w - l.slot.w) / 2, sb.y + l.labelH, o, !canStash);
  panelFrame(c, nb.x, nb.y, nb.w, nb.h, 'Next', l);
  if (o.paused) return;
  upcoming.forEach((id, i) => {
    const x = nb.horizontal ? nb.x + 6 + i * nb.step : nb.x + (nb.w - l.slot.w) / 2;
    const y = nb.horizontal ? nb.y + l.labelH : nb.y + l.labelH + i * nb.step;
    drawMini(c, l, id, x, y, o, false);
  });
}

/** Top-left of the Stash slot, used as the target of the stash slide. */
export const stashSlot = (l: Layout): { x: number; y: number } => ({ x: l.stash.x + (l.stash.w - l.slot.w) / 2, y: l.stash.y + l.labelH });
