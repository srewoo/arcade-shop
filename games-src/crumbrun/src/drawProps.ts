// Non-collidable kitchen props on the outer counter ring: a mug, toaster, loaf and salt shaker.
import { TILE } from './layout';
import { cellAt } from './maze';
import type { Maze } from './maze';

type Ctx = CanvasRenderingContext2D;

function shade(ctx: Ctx, x: number, y: number, w: number, h: number): void {
  const g = ctx.createLinearGradient(x, 0, x + w, 0);
  g.addColorStop(0, 'rgba(255,255,255,0.35)');
  g.addColorStop(0.5, 'rgba(255,255,255,0)');
  g.addColorStop(1, 'rgba(0,0,0,0.28)');
  ctx.fillStyle = g;
  ctx.fillRect(x, y, w, h);
}

function dropShadow(ctx: Ctx, x: number, y: number, rx: number): void {
  ctx.fillStyle = 'rgba(30,14,4,0.3)';
  ctx.beginPath();
  ctx.ellipse(x + 1, y + 5, rx, 2.2, 0, 0, Math.PI * 2);
  ctx.fill();
}

function mug(ctx: Ctx, x: number, y: number): void {
  dropShadow(ctx, x, y, 7);
  ctx.fillStyle = '#2f6f9f';
  ctx.fillRect(x - 4, y - 3, 8, 7);
  shade(ctx, x - 4, y - 3, 8, 7);
  ctx.strokeStyle = '#2f6f9f';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.arc(x + 5, y, 2.4, -Math.PI / 2, Math.PI / 2);
  ctx.stroke();
  ctx.fillStyle = '#5b3a1f';
  ctx.fillRect(x - 3, y - 2, 6, 1.5);
}

function toaster(ctx: Ctx, x: number, y: number): void {
  dropShadow(ctx, x, y, 9);
  ctx.fillStyle = '#b9bcc4';
  ctx.fillRect(x - 7, y - 3, 14, 8);
  shade(ctx, x - 7, y - 3, 14, 8);
  ctx.fillStyle = '#7d818c';
  ctx.fillRect(x - 5, y - 4, 4, 2);
  ctx.fillRect(x + 1, y - 4, 4, 2);
  ctx.fillStyle = '#e86a8a';
  ctx.fillRect(x + 4, y + 2, 2, 2);
}

function loaf(ctx: Ctx, x: number, y: number): void {
  dropShadow(ctx, x, y, 8);
  ctx.fillStyle = '#b57a3a';
  ctx.beginPath();
  ctx.ellipse(x, y, 7, 4, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,230,170,0.3)';
  ctx.beginPath();
  ctx.ellipse(x - 1, y - 1.5, 5, 1.6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#8a5a26';
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (const dx of [-3, 0, 3]) {
    ctx.moveTo(dx + x - 1, y - 2);
    ctx.lineTo(dx + x + 1, y + 2);
  }
  ctx.stroke();
}

function salt(ctx: Ctx, x: number, y: number): void {
  dropShadow(ctx, x, y, 5);
  ctx.fillStyle = '#f2f2f2';
  ctx.fillRect(x - 3, y - 2, 6, 6);
  shade(ctx, x - 3, y - 2, 6, 6);
  ctx.fillStyle = '#9aa0ab';
  ctx.fillRect(x - 3, y - 4, 6, 2);
  ctx.fillStyle = '#c9ccd4';
  ctx.fillRect(x - 3, y + 1, 6, 1);
}

export function drawProps(ctx: Ctx, m: Maze): void {
  const spots: readonly [number, number, (c: Ctx, x: number, y: number) => void][] = [
    [2, 0, mug], [m.cols - 3, 0, toaster], [3, m.rows - 1, loaf], [m.cols - 4, m.rows - 1, salt],
  ];
  for (const [col, row, draw] of spots) {
    if (cellAt(m, col, row) !== 'wall') continue;
    draw(ctx, col * TILE + TILE / 2, row * TILE + TILE / 2 - 1);
  }
}
