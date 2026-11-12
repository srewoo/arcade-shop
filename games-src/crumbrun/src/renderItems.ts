// Crumbs, sugar, pistols and cheese (with its countdown ring).
import { ITEM_CRUMB, ITEM_PISTOL, ITEM_SUGAR } from './maze';
import { tileCenterX, tileCenterY } from './layout';
import { drawCheese, drawCrumb, drawPistol, drawSugar } from './spriteItems';
import type { World } from './world';

type Ctx = CanvasRenderingContext2D;

/** Index of the pistol nearest to Pip (Manhattan), or -1. Used for the level-1 READY hint. */
export function nearestPistol(w: World): number {
  let best = -1;
  let bestD = Infinity;
  const { cols } = w.maze;
  for (let i = 0; i < w.items.length; i++) {
    if (w.items[i] !== ITEM_PISTOL) continue;
    const d = Math.abs((i % cols) - w.pip.x) + Math.abs(Math.floor(i / cols) - w.pip.y);
    if (d < bestD) {
      bestD = d;
      best = i;
    }
  }
  return best;
}

function cheeseRing(ctx: Ctx, x: number, y: number, frac: number): void {
  ctx.lineWidth = 2;
  ctx.strokeStyle = 'rgba(0,0,0,0.55)';
  ctx.beginPath();
  ctx.arc(x, y, 11, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = frac < 0.3 ? '#ff9db5' : '#ffe066';
  ctx.beginPath();
  ctx.arc(x, y, 11, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.max(0, Math.min(1, frac)));
  ctx.stroke();
}

export function drawItems(ctx: Ctx, w: World, t: number, hintPistol: boolean, calm = false): void {
  const { cols } = w.maze;
  const items = w.items;
  const hint = hintPistol ? nearestPistol(w) : -1;
  for (let i = 0; i < items.length; i++) {
    const it = items[i];
    if (it === 0) continue;
    const x = tileCenterX(i % cols);
    const y = tileCenterY(Math.floor(i / cols));
    if (it === ITEM_CRUMB) drawCrumb(ctx, x, y);
    else if (it === ITEM_SUGAR) drawSugar(ctx, x, y, t);
    else if (it === ITEM_PISTOL) drawPistol(ctx, x, y, t, i === hint);
  }
  if (w.cheese.active) {
    const cx = tileCenterX(w.maze.cheese.col);
    const cy = tileCenterY(w.maze.cheese.row);
    cheeseRing(ctx, cx, cy, w.cheese.left / w.tuning.cheeseSec);
    drawCheese(ctx, cx, cy, w.cheese.left, calm);
  }
}
