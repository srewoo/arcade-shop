// Composes one frame: lane (cached when still), guide, pins/ball sorted by depth, particles.
import type { Game } from './game';
import { drawDragTrail, drawGuideLayer, drawPocketTicks } from './drawOverlay';
import { LaneCache } from './laneCache';
import { project } from './project';
import { drawSweeper } from './scene';
import { drawParticles } from './drawFx';
import { drawBall, drawPin } from './renderPins';
import { TUNING } from './tuning';

type Ctx = CanvasRenderingContext2D;

const laneCache = new LaneCache();

export const laneCacheHits = (): number => laneCache.hits;

export function drawFrame(ctx: Ctx, game: Game): void {
  const { size, cam, juice, reduced } = game.pres;
  ctx.save();
  if (juice.shake > 0 && !reduced) {
    const a = juice.shake * TUNING.juice.shakePx;
    ctx.translate((Math.random() - 0.5) * a, (Math.random() - 0.5) * a);
  }
  laneCache.draw(ctx, cam, size.w, size.h);
  drawPocketTicks(ctx, game);
  drawGuideLayer(ctx, game);
  drawActors(ctx, game);
  if (game.stage === 'sweep') drawSweeper(ctx, cam, game.sweepY);
  ctx.restore();
  drawParticles(ctx, game);
  drawDragTrail(ctx, game);
}

function drawActors(ctx: Ctx, game: Game): void {
  const { cam, time } = game.pres;
  const { ball, pins } = game.view();
  const sweeping = game.stage === 'sweep';
  const showDown = game.stage === 'settle' || sweeping;
  const items: { y: number; draw: () => void }[] = [];
  for (const pin of pins) {
    const visible = pin.state !== 'down' || (showDown && game.world.startMask[pin.index] && pin.y < 2150 && (!sweeping || pin.y > game.sweepY));
    if (!visible || pin.y < cam.y - 40) continue;
    items.push({ y: pin.y, draw: () => drawPin(ctx, cam, pin, time) });
  }
  const shown = game.stage === 'rolling' || game.stage === 'settle' ? ball : { ...ball, x: game.input.startX, y: 0, vx: 0, vy: 0, active: true, inGutter: false };
  const ballVisible = game.stage === 'rolling' ? ball.active : game.stage === 'ready' || game.stage === 'cpu';
  if (ballVisible) items.push({ y: shown.y, draw: () => drawBall(ctx, cam, shown) });
  items.sort((a, b) => b.y - a.y);
  for (const it of items) it.draw();
}

/** Map a screen x on the foul line back to lane centimetres. */
export function laneXFromScreen(game: Game, sx: number): number {
  const { cam } = game.pres;
  const p = project(cam, 0, 0, 0);
  return (sx - p.sx) / p.s + cam.x;
}

/** Foul-line screen y and scale, for hit-testing the "slide the ball" zone. */
export const foulLineScreenY = (game: Game): number => project(game.pres.cam, 0, 0, 0).sy;
