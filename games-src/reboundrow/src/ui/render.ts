// Canvas renderer. Draws interpolated positions (alpha = accumulator / step) into a canvas that
// fills the stage; the logical field is centred inside it by `placeField`.
import { CONFIG } from '../config';
import { placeField } from '../layout';
import type { World } from '../sim/world';
import { drawBalls, drawBolts, drawCapsules, drawPaddle } from './actors';
import { drawBricks } from './drawBricks';
import type { Fx } from './fx';
import { drawBackdrop, drawFieldLayer } from './scene';
import { drawBanner, drawHitFlashes, drawLostFlash, drawParticles, drawPopups, drawRings } from './renderFx';

export interface RenderOpts { assist: boolean; reduced: boolean }

export function renderFrame(
  ctx: CanvasRenderingContext2D, pxW: number, pxH: number, w: World, alpha: number, fx: Fx, o: RenderOpts,
): void {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  drawBackdrop(ctx, pxW, pxH, performance.now() / 1000, o.reduced);
  const p = placeField(
    { w: pxW, h: pxH }, w.field,
  );
  const shake = fx.shake > 0 && !o.reduced ? CONFIG.fx.shakePx * (fx.shake / (CONFIG.fx.shakeMs / 1000)) : 0;
  const jx = shake > 0 ? (Math.random() - 0.5) * shake * 2 * p.scale : 0;
  const jy = shake > 0 ? (Math.random() - 0.5) * shake * 2 * p.scale : 0;
  ctx.setTransform(p.scale, 0, 0, p.scale, p.offX + jx, p.offY + jy);
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, w.field.w, w.field.h);
  ctx.clip();
  drawFieldLayer(ctx, w.field.w, w.field.h, w.ox);
  drawBricks(ctx, w.bricks, o.assist, w.ox);
  drawHitFlashes(ctx, fx);
  drawRings(ctx, fx);
  drawCapsules(ctx, w, alpha);
  drawBolts(ctx, w);
  drawParticles(ctx, fx);
  drawPaddle(ctx, w, alpha, fx);
  drawBalls(ctx, w, alpha, o);
  drawPopups(ctx, fx);
  drawLostFlash(ctx, fx, w.field.w, w.field.h);
  drawBanner(ctx, fx, w.field.w, w.field.h);
  ctx.restore();
}
