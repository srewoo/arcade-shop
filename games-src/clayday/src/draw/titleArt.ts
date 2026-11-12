// Title illustration: the countryside scene with two clays in flight, painted with the game's own backdrop code.
import { drawClayShape } from './clays';
import { paintClouds, paintLand, paintSky, paintWindsock } from './scene';
import { makeWorld } from '../world';

const W = 720;
const H = 330;

/** Paint into `canvas` (CSS-sized; the backing store follows devicePixelRatio, capped at 2). */
export function drawTitleArt(canvas: HTMLCanvasElement): void {
  const r = canvas.getBoundingClientRect();
  if (r.width < 2) return;
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  canvas.width = Math.round(r.width * dpr);
  canvas.height = Math.round(r.height * dpr);
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const s = (canvas.width / W);
  ctx.setTransform(s, 0, 0, s, 0, (canvas.height - H * s) / 2);
  const world = makeWorld(W, H);
  const v = { x0: 0, x1: W, y0: -(canvas.height - H * s) / 2 / s, y1: H + (canvas.height - H * s) / 2 / s };
  paintSky(ctx, world, v);
  paintClouds(ctx, world, v, 3);
  paintLand(ctx, world, v);
  paintWindsock(ctx, world, 0.03, 1, true);
  drawClayShape(ctx, W * 0.34, H * 0.28, 'std', 0.4, false);
  drawClayShape(ctx, W * 0.66, H * 0.2, 'gold', 1.2, false);
}
