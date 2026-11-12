// Static layer: asphalt, painted bays, kerbs, parked cars. Rendered once per level/size.
import type { Level } from '../levels/types';
import { drawObstacle } from './carArt';
import { bayNumber, bushes, grass, kerbStones, pavement, wheelStop } from './lot';
import { asphalt, lampHeads, lampPools, paintLines, wear } from './surface';

export { drawBay, drawHeading } from './bay';

/** Draw everything that never moves. Expects the view transform to be applied. */
export function drawStatic(ctx: CanvasRenderingContext2D, level: Level): void {
  grass(ctx, level);
  pavement(ctx, level);
  bushes(ctx, level);
  asphalt(ctx, level);
  wear(ctx, level);
  lampPools(ctx, level);
  paintLines(ctx, level);
  level.paint.forEach((b, i) => {
    if (b.hw > b.hh) bayNumber(ctx, b, i + 1);
    wheelStop(ctx, b, level.world);
  });
  wheelStop(ctx, level.bay, level.world);
  for (const o of level.obstacles) drawObstacle(ctx, o);
  kerbStones(ctx, level);
  lampHeads(ctx, level);
}

