// Static lane layer: backdrop, lane, walls and sign are redrawn only when the camera or canvas
// changes. A frame with the same key as the previous one is served from an offscreen canvas.
import type { Camera } from './project';
import { drawBackdrop, drawLane } from './scene';

type Ctx = CanvasRenderingContext2D;

export class LaneCache {
  private layer: HTMLCanvasElement | null = null;
  private layerKey = '';
  private lastKey = '';
  /** Frames served from the cache, for tests and the debug hook. */
  hits = 0;

  static keyOf(cam: Camera, w: number, h: number, dpr: number): string {
    return [w, h, dpr, cam.x.toFixed(2), cam.y.toFixed(2), cam.h.toFixed(1), cam.f.toFixed(1)].join('|');
  }

  draw(ctx: Ctx, cam: Camera, w: number, h: number): void {
    const dpr = ctx.getTransform().a || 1;
    const key = LaneCache.keyOf(cam, w, h, dpr);
    const steady = key === this.lastKey;
    this.lastKey = key;
    if (!steady) {
      paint(ctx, cam, w, h);
      return;
    }
    if (this.layerKey !== key || !this.layer) this.rebuild(key, cam, w, h, dpr);
    if (this.layer && this.layerKey === key) {
      ctx.drawImage(this.layer, 0, 0, w, h);
      this.hits++;
    } else paint(ctx, cam, w, h);
  }

  private rebuild(key: string, cam: Camera, w: number, h: number, dpr: number): void {
    const layer = this.layer ?? document.createElement('canvas');
    layer.width = Math.round(w * dpr);
    layer.height = Math.round(h * dpr);
    const lctx = layer.getContext('2d');
    if (!lctx) return;
    lctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    paint(lctx, cam, w, h);
    this.layer = layer;
    this.layerKey = key;
  }
}

function paint(ctx: Ctx, cam: Camera, w: number, h: number): void {
  drawBackdrop(ctx, w, h, cam);
  drawLane(ctx, cam);
}
