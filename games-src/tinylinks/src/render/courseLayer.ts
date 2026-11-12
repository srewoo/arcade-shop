// Pre-renders everything on a hole that never changes into one offscreen canvas.
import type { HoleDef } from '../physics/types';
import { PAL } from './palette';
import { polyPath } from './paths';
import { textures } from './textures';
import { drawDecor } from './decor';
import { drawSand, drawPost, drawSlopeBase, drawTee, drawWaterBase, drawCup } from './surfaces';
import { drawWallAO, drawWalls } from './walls';

/** World rectangle covered by the layer. */
export const LAYER = { x: -30, y: -10, w: 860, h: 520 } as const;

export interface Layer { canvas: HTMLCanvasElement; hole: HoleDef; key: string }

function drawTurf(ctx: CanvasRenderingContext2D, hole: HoleDef): void {
  ctx.save();
  polyPath(ctx, hole.walls);
  ctx.clip('evenodd');
  const g = ctx.createLinearGradient(0, 40, 0, 460);
  g.addColorStop(0, PAL.turfLight); g.addColorStop(1, PAL.turfDark);
  ctx.fillStyle = g;
  ctx.fillRect(LAYER.x, LAYER.y, LAYER.w, LAYER.h);
  const angle = [0, Math.PI / 2, Math.PI / 4, -Math.PI / 4, 0.2, Math.PI / 2 + 0.2][hole.id % 6] as number;
  ctx.save();
  ctx.translate(400, 250);
  ctx.rotate(angle);
  for (let k = -30; k < 30; k++) {
    ctx.fillStyle = k % 2 === 0 ? 'rgba(255,255,255,0.07)' : 'rgba(0,40,10,0.07)';
    ctx.fillRect(k * 34, -700, 34, 1400);
  }
  ctx.restore();
  const pat = ctx.createPattern(textures().speckle, 'repeat');
  if (pat) { ctx.fillStyle = pat; ctx.fillRect(LAYER.x, LAYER.y, LAYER.w, LAYER.h); }
  const vg = ctx.createRadialGradient(400, 250, 120, 400, 250, 470);
  vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,25,8,0.22)');
  ctx.fillStyle = vg;
  ctx.fillRect(LAYER.x, LAYER.y, LAYER.w, LAYER.h);
  ctx.restore();
}

export function buildLayer(hole: HoleDef, scale: number, assist: boolean, canvas?: HTMLCanvasElement): Layer {
  const cv = canvas ?? document.createElement('canvas');
  cv.width = Math.ceil(LAYER.w * scale);
  cv.height = Math.ceil(LAYER.h * scale);
  const ctx = cv.getContext('2d');
  if (!ctx) return { canvas: cv, hole, key: '' };
  ctx.setTransform(scale, 0, 0, scale, -LAYER.x * scale, -LAYER.y * scale);
  drawDecor(ctx, hole);
  drawTurf(ctx, hole);
  ctx.save();
  polyPath(ctx, hole.walls);
  ctx.clip('evenodd');
  hole.slopes?.forEach((s) => drawSlopeBase(ctx, s));
  ctx.restore();
  hole.sand?.forEach((s, i) => drawSand(ctx, s, hole.id * 31 + i, assist));
  drawTee(ctx, hole.tee);
  drawCup(ctx, hole.cup);
  hole.hazards?.forEach((h) => drawWaterBase(ctx, h, assist));
  drawWallAO(ctx, hole.walls);
  hole.posts?.forEach((p) => drawPost(ctx, p));
  drawWalls(ctx, hole.walls, scale);
  return { canvas: cv, hole, key: '' };
}
