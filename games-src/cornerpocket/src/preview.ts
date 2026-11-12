// Title-screen table preview: the same procedural art as the game, with a fresh rack. Static, no animation.
import { eightBallRack } from './layouts';
import { drawBall } from './renderBalls';
import { drawTable } from './renderTable';
import { layoutView } from './view';

export function drawPreview(canvas: HTMLCanvasElement): void {
  const w = Math.floor(canvas.clientWidth); const h = Math.floor(canvas.clientHeight);
  const ctx = canvas.getContext('2d');
  if (!ctx || w < 40 || h < 40) return;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
  const v = layoutView(w, h);
  const [a, b, c, d, e, f] = v.m;
  ctx.setTransform(dpr * a, dpr * b, dpr * c, dpr * d, dpr * e, dpr * f);
  drawTable(ctx);
  for (const ball of eightBallRack()) drawBall(ctx, ball, { x: ball.x, y: ball.y, scale: v.scale, assist: true });
}
