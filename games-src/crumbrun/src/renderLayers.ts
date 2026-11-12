// Cached full-board layers: the static kitchen and the lighting overlay, plus the dark-kitchen mask.
import { FEEL } from './config/feel';
import { TUNING } from './config/tuning';
import { drawStaticLayer } from './drawStatic';
import { TILE } from './layout';
import type { Fit, Size } from './layout';
import type { Maze } from './maze';
import { themeFor } from './theme';

type Ctx = CanvasRenderingContext2D;

function context2d(c: HTMLCanvasElement): Ctx {
  return c.getContext('2d') as Ctx;
}

export class Layers {
  private readonly stat = document.createElement('canvas');
  private readonly lightCanvas = document.createElement('canvas');
  private staticKey = '';
  private lightKey = '';

  /** Canvases are reused across resizes; only the cache keys reset. */
  invalidate(): void {
    this.staticKey = '';
    this.lightKey = '';
  }

  ensureStatic(maze: Maze, themeIdx: number, highContrast: boolean, fit: Fit): HTMLCanvasElement {
    const key = `${maze.name}|${themeIdx}|${highContrast}|${fit.scale}`;
    if (key === this.staticKey) return this.stat;
    this.stat.width = Math.round(maze.cols * TILE * fit.scale);
    this.stat.height = Math.round(maze.rows * TILE * fit.scale);
    const g = context2d(this.stat);
    g.setTransform(fit.scale, 0, 0, fit.scale, 0, 0);
    drawStaticLayer(g, maze, themeFor(themeIdx, highContrast));
    this.staticKey = key;
    return this.stat;
  }

  /** Warm glow + soft vignette. High contrast has none, so nothing dims a corner crumb. */
  ensureLight(size: Size, fit: Fit, highContrast: boolean): HTMLCanvasElement | null {
    if (highContrast) return null;
    const key = `${fit.pxW}x${fit.pxH}|${fit.scale}`;
    if (key === this.lightKey) return this.lightCanvas;
    const { w, h } = size;
    this.lightCanvas.width = fit.pxW;
    this.lightCanvas.height = fit.pxH;
    const g = context2d(this.lightCanvas);
    g.setTransform(fit.scale, 0, 0, fit.scale, 0, 0);
    const warm = g.createRadialGradient(w / 2, h * 0.42, 10, w / 2, h * 0.42, h * 0.62);
    warm.addColorStop(0, `rgba(255,196,120,${FEEL.light.warmAlpha})`);
    warm.addColorStop(1, 'rgba(255,196,120,0)');
    g.fillStyle = warm;
    g.fillRect(0, 0, w, h);
    const vig = g.createRadialGradient(w / 2, h * 0.47, h * 0.22, w / 2, h * 0.47, h * 0.72);
    vig.addColorStop(0, 'rgba(10,4,12,0)');
    vig.addColorStop(1, `rgba(10,4,12,${FEEL.light.vignetteOuterAlpha})`);
    g.fillStyle = vig;
    g.fillRect(0, 0, w, h);
    this.lightKey = key;
    return this.lightCanvas;
  }
}

/** "Dark kitchen" modifier: everything beyond a lamp radius around Pip fades to near black. */
export function drawDarkness(ctx: Ctx, x: number, y: number, rect: { x: number; y: number; w: number; h: number }): void {
  const r = TUNING.modifiers.darkRadiusTiles * TILE;
  const g = ctx.createRadialGradient(x, y, r * 0.55, x, y, r + TILE * 2);
  g.addColorStop(0, 'rgba(4,2,8,0)');
  g.addColorStop(1, 'rgba(4,2,8,0.93)');
  ctx.fillStyle = g;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
}
