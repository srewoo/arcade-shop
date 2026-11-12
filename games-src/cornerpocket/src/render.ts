// Frame renderer: table, balls, guide, stick, fx. Pure canvas drawing, no game logic.
import { FX } from './config/fx';
import { INPUT } from './config/input';
import type { Fx } from './fx';
import type { Game } from './game';
import { visibleBounds } from './geom';
import { colorOf, drawBall } from './renderBalls';
import { drawFx, drawSpinMark, drawTexts } from './renderFx';
import { drawGhostPull, drawGuide, drawHighlights, drawPlaceHint, drawRing, drawStick } from './renderGuide';
import { drawTableLayer } from './tableLayer';
import { type View, toScreen } from './view';

export interface UiState {
  dragging: boolean; // slingshot drag in progress
  grabFlash: number; // seconds left of the grab-area hint (tap that missed the cue ball)
  coachT: number | null; // onboarding ghost pull progress 0..1, null when no coachmark
}

export interface FrameOpts {
  view: View; dpr: number; cssW: number; cssH: number; fx: Fx;
  assist: boolean; textScale: number; ui: UiState; grab: number;
}

export function drawFrame(ctx: CanvasRenderingContext2D, game: Game, o: FrameOpts): void {
  ctx.setTransform(o.dpr, 0, 0, o.dpr, 0, 0);
  ctx.clearRect(0, 0, o.cssW, o.cssH);
  const [a, b, c, d, e, f] = o.view.m;
  const k = o.fx.shake > 0 ? o.fx.shake / FX.shakeSeconds : 0;
  const jx = k * FX.shakePx * (Math.random() * 2 - 1); const jy = k * FX.shakePx * (Math.random() * 2 - 1);
  drawTableLayer(ctx, o.view, o.dpr, o.cssW, o.cssH, jx, jy);
  ctx.setTransform(o.dpr * a, o.dpr * b, o.dpr * c, o.dpr * d, o.dpr * (e + jx), o.dpr * (f + jy));
  const cue = game.cue;
  if (game.phase === 'aim' && game.humanTurn) drawHighlights(ctx, game.balls, game.ctl.highlight());
  game.balls.forEach((ball, i) => {
    if (ball.pocketed || ball.id === 0) return;
    const p = game.drawPos(i);
    drawBall(ctx, ball, { x: p.x, y: p.y, scale: o.view.scale, assist: o.assist });
  });
  if (!cue.pocketed) {
    if (game.phase === 'place') drawPlaceHint(ctx, cue.x, cue.y);
    const p = game.drawPos(0);
    drawBall(ctx, cue, { x: p.x, y: p.y, scale: o.view.scale, assist: o.assist });
  }
  const guide = game.guide();
  if (guide && !cue.pocketed) {
    drawGuide(ctx, guide, game.opts.level, o.assist);
    drawStick(ctx, cue, game.angle, game.power, visibleBounds(o.view, o.cssW, o.cssH));
    if (o.ui.dragging) drawRing(ctx, cue.x, cue.y, INPUT.pullMin + 10, 0.8, true);
    if (o.ui.grabFlash > 0) drawRing(ctx, cue.x, cue.y, o.grab, Math.min(1, o.ui.grabFlash / INPUT.grabFlashSeconds), true);
    if (o.ui.coachT !== null) drawGhostPull(ctx, cue, game.angle, o.ui.coachT);
  }
  drawSpinMark(ctx, game);
  drawFx(ctx, o.fx, o.view, o.assist);
  ctx.setTransform(o.dpr, 0, 0, o.dpr, 0, 0);
  const anchor = cue.pocketed ? null : toScreen(o.view, game.drawPos(0).x, game.drawPos(0).y);
  drawTexts(ctx, o.fx, o.view, { cssW: o.cssW, cssH: o.cssH, textScale: o.textScale, anchor });
}

export { colorOf };
