// Canvas scene renderer. Reads Game state only; never mutates it.
import { lerp } from './clock';
import { TUNING } from './config';
import { R, cellCenter, forEachBubble } from './hex';
import { banners, effects, highlight, loseHighlight } from './renderFx';
import { guide } from './renderGuide';
import { cannon, ceiling, dangerLine } from './renderParts';
import { RenderOpts } from './renderTypes';
import { drawBackground, drawSprite } from './sprites';
import { Game } from './state';

export { NEXT_POS } from './renderTypes';
export type { RenderOpts } from './renderTypes';

/** Damped 30 Hz shake offset for the current effect clock. */
export function shakeOffset(amp: number, clock: number): { x: number; y: number } {
  const w = clock * Math.PI * 2 * TUNING.fx.shakeHz;
  return { x: Math.sin(w) * amp * 0.5, y: Math.cos(w * 1.3) * amp * 0.35 };
}

export function render(ctx: CanvasRenderingContext2D, g: Game, o: RenderOpts): void {
  ctx.save();
  if (g.shake > 0 && !g.reduced) {
    const s = shakeOffset(g.shake, g.fx.clock + o.alpha / 60);
    ctx.translate(s.x, s.y);
  }
  drawBackground(ctx, o.scale);
  ctx.save();
  ctx.translate(0, -lerp(g.prevDropAnim, g.dropAnim, o.alpha));
  forEachBubble(g.grid, (b, p) => {
    const c = cellCenter(p.row, p.col, g.grid.phase);
    drawSprite(ctx, b, c.x, c.y, R, o.symbols, o.scale);
  });
  ctx.restore();
  loseHighlight(ctx, g, o);
  ceiling(ctx, g, o);
  dangerLine(ctx, g, o);
  if (g.status === 'playing' && !g.ball && g.cur) guide(ctx, g, o);
  cannon(ctx, g, o);
  if (g.ball && g.flying) {
    drawSprite(ctx, g.flying, lerp(g.ball.px, g.ball.rx, o.alpha), lerp(g.ball.py, g.ball.ry, o.alpha), R, o.symbols, o.scale);
  }
  effects(ctx, g, o);
  banners(ctx, g, o);
  highlight(ctx, o);
  ctx.restore();
}
