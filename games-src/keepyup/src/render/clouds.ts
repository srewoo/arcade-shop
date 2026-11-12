// Soft code-drawn clouds. Sprites are pre-rendered once; drifting is just a translate.
import { makeCanvas } from './layout';
import { PAL } from './palette';

const VARIANTS = [[0, 0, 40], [34, -12, 34], [66, 0, 38], [30, 8, 36], [92, 6, 26], [-24, 8, 26]] as const;

export class Clouds {
  private sprites: HTMLCanvasElement[] = [];
  private px = 0;

  private bake(scale: number, variant: number): HTMLCanvasElement {
    const w = Math.round(260 * scale); const h = Math.round(120 * scale);
    const c = makeCanvas(w, h);
    const g = c.getContext('2d') as CanvasRenderingContext2D;
    g.translate(60 * scale, 70 * scale); g.scale(scale, scale);
    VARIANTS.forEach(([x, y, r], i) => {
      if ((i + variant) % 5 === 4) return;
      const grad = g.createRadialGradient(x - r * 0.3, y - r * 0.4, 2, x, y, r);
      grad.addColorStop(0, PAL.cloud); grad.addColorStop(0.7, PAL.cloud); grad.addColorStop(1, PAL.cloudShade);
      g.fillStyle = grad; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
    });
    return c;
  }

  ensure(pxScale: number): void {
    const key = Math.round(pxScale * 10);
    if (key === this.px) return;
    this.px = key;
    this.sprites = [0, 1, 2].map((v) => this.bake(pxScale, v));
  }

  draw(ctx: CanvasRenderingContext2D, t: number, x0: number, x1: number, animate: boolean, pxScale: number): void {
    const span = x1 - x0 + 400;
    const spots = [[0.1, 70, 0.9, 6, 0], [0.45, 130, 0.7, 9, 1], [0.8, 50, 1.1, 4, 2], [0.28, 175, 0.55, 7, 1]] as const;
    for (const [fx, y, sc, speed, v] of spots) {
      const drift = animate ? t * speed : 0;
      const x = x0 - 200 + ((fx * span + drift) % span);
      const spr = this.sprites[v];
      if (!spr) continue;
      const k = (sc * 1) / pxScale;
      ctx.globalAlpha = 0.92;
      ctx.drawImage(spr, x - 60 * sc, y - 70 * sc, spr.width * k, spr.height * k);
    }
    ctx.globalAlpha = 1;
  }
}
