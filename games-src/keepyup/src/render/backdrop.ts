// Caches the two static scenery layers as offscreen canvases, rebuilt when the view changes.
import { drawBack } from './backdropBack';
import { drawFront } from './backdropFront';
import { makeCanvas } from './layout';
import type { View } from './view';

const BACK_BOTTOM = 400;
const FRONT_TOP = 240;

interface Baked { canvas: HTMLCanvasElement; x0: number; y0: number; w: number; h: number }

function bake(v: View, x0: number, x1: number, y0: number, y1: number, paint: (g: CanvasRenderingContext2D) => void): Baked {
  const k = v.s * v.dpr;
  const canvas = makeCanvas((x1 - x0) * k, (y1 - y0) * k);
  const g = canvas.getContext('2d') as CanvasRenderingContext2D;
  g.setTransform(k, 0, 0, k, -x0 * k, -y0 * k);
  paint(g);
  return { canvas, x0, y0, w: x1 - x0, h: y1 - y0 };
}

export class Backdrop {
  private back: Baked | null = null;
  private front: Baked | null = null;
  private key = '';

  ensure(v: View): void {
    const key = `${v.pxW}x${v.pxH}@${v.dpr}`;
    if (key === this.key) return;
    this.key = key;
    const x0 = -v.ox; const x1 = v.wv - v.ox;
    this.back = bake(v, x0, x1, v.top, BACK_BOTTOM, (g) => drawBack(g, { x0, x1, top: v.top, bottom: BACK_BOTTOM }));
    this.front = bake(v, x0, x1, FRONT_TOP, v.bottom, (g) => drawFront(g, { x0, x1, bottom: v.bottom, worldW: v.worldW }));
  }

  private blit(ctx: CanvasRenderingContext2D, b: Baked | null): void {
    if (b) ctx.drawImage(b.canvas, b.x0, b.y0, b.w, b.h);
  }
  drawBack(ctx: CanvasRenderingContext2D): void { this.blit(ctx, this.back); }
  drawFront(ctx: CanvasRenderingContext2D): void { this.blit(ctx, this.front); }
}
