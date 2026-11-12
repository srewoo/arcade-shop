// Canvas renderer. Reads game state, never mutates it (apart from caches/particles).
import { FEEL } from './config/feel';
import { boardSize, fitScale, HUD_TOP, ORIGIN_Y, TILE } from './layout';
import type { Fit, Size } from './layout';
import { drawReady, drawSummary, drawTitle } from './overlays';
import { Particles } from './particles';
import { drawItems } from './renderItems';
import { ActorPainter } from './renderActors';
import { drawDarkness, Layers } from './renderLayers';
import { lerpMover } from './movement';
import { setTextScale } from './textStyle';
import { themeIndex } from './levels';
import type { Game } from './flow';

export interface RenderOptions {
  readonly textScale: number;
  readonly assist: boolean;
  readonly highContrast: boolean;
}

export const DEFAULT_RENDER_OPTIONS: RenderOptions = { textScale: 1, assist: false, highContrast: false };

export class Renderer {
  readonly particles = new Particles();
  private readonly ctx: CanvasRenderingContext2D;
  private readonly layers = new Layers();
  private readonly actors: ActorPainter;
  private fit: Fit;
  private opts: RenderOptions = DEFAULT_RENDER_OPTIONS;

  constructor(private readonly canvas: HTMLCanvasElement, private readonly size: Size) {
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D is not available');
    this.ctx = ctx;
    this.fit = fitScale(size.w, size.h, 1, size);
    this.actors = new ActorPainter(this.particles);
  }

  get currentFit(): Fit {
    return this.fit;
  }

  setOptions(o: RenderOptions): void {
    this.opts = o;
    setTextScale(o.textScale);
  }

  /** Returns true when the backing store changed. Unchanged sizes cost nothing. */
  resize(availW: number, availH: number, dpr: number): boolean {
    const next = fitScale(availW, availH, dpr, this.size);
    if (next.pxW === this.fit.pxW && next.pxH === this.fit.pxH && next.scale === this.fit.scale
      && this.canvas.width === next.pxW) return false;
    this.fit = next;
    this.canvas.width = next.pxW;
    this.canvas.height = next.pxH;
    this.canvas.style.width = `${next.cssW}px`;
    this.canvas.style.height = `${next.cssH}px`;
    this.layers.invalidate();
    return true;
  }

  private shakeOffset(game: Game): { x: number; y: number } {
    if (game.reducedMotion || game.shakeLeft <= 0) return { x: 0, y: 0 };
    const k = game.shakeLeft / FEEL.shake.deathSec;
    return { x: (Math.random() - 0.5) * 2 * FEEL.shake.deathPx * k, y: (Math.random() - 0.5) * 2 * FEEL.shake.deathPx * k };
  }

  /** `alpha` = accumulator / FIXED_DT, for interpolating movers between simulation ticks. */
  draw(game: Game, now: number, alpha = 1): void {
    const { ctx } = this;
    const { w, h } = this.size;
    const t = now / 1000;
    const world = game.world;
    // Everything is drawn at its full-board y; the transform slides the cropped canvas over it.
    ctx.setTransform(this.fit.scale, 0, 0, this.fit.scale, 0, -ORIGIN_Y * this.fit.scale);
    ctx.fillStyle = '#120a0e';
    ctx.fillRect(0, ORIGIN_Y, w, h);
    const sh = this.shakeOffset(game);
    const boardH = world.maze.rows * TILE;
    const stat = this.layers.ensureStatic(world.maze, themeIndex(game.demoOrLevel()), this.opts.highContrast, this.fit);
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, HUD_TOP, w, boardH);
    ctx.clip();
    ctx.translate(sh.x, sh.y);
    ctx.drawImage(stat, 0, HUD_TOP, world.maze.cols * TILE, boardH);
    drawItems(ctx, world, t, game.phase === 'ready' && game.level === 1, game.reducedMotion);
    this.actors.draw(ctx, game, t, alpha, { assist: this.opts.assist, bold: this.opts.highContrast });
    this.particles.draw(ctx);
    ctx.restore();
    this.drawLight(game, alpha);
    this.drawPhase(game, t, w, h);
  }

  private drawLight(game: Game, alpha: number): void {
    const { ctx } = this;
    const { w, h } = this.size;
    const light = this.layers.ensureLight(this.size, this.fit, this.opts.highContrast);
    if (light) ctx.drawImage(light, 0, ORIGIN_Y, w, h);
    const world = game.world;
    if (world.tuning.modifier === 'darkKitchen' && !game.demo) {
      const p = lerpMover(world.pip, alpha);
      const x = p.x * TILE + TILE / 2;
      const y = p.y * TILE + TILE / 2 + HUD_TOP;
      drawDarkness(ctx, x, y, { x: 0, y: HUD_TOP, w, h: world.maze.rows * TILE });
    }
  }

  private drawPhase(game: Game, t: number, w: number, h: number): void {
    const { ctx } = this;
    const blink = Math.floor(t * 2) % 2 === 0;
    if (game.phase === 'clearing' && !game.reducedMotion) {
      const flash = Math.floor(game.phaseT * 6) % 2 === 0 ? 0.42 : 0;
      ctx.fillStyle = `rgba(255,248,220,${flash})`;
      ctx.fillRect(0, HUD_TOP, w, game.world.maze.rows * TILE);
    } else if (game.phase === 'clearing') {
      ctx.fillStyle = 'rgba(255,248,220,0.1)';
      ctx.fillRect(0, HUD_TOP, w, game.world.maze.rows * TILE);
    }
    const bottom = ORIGIN_Y + h;
    if (game.phase === 'title') drawTitle(ctx, w, ORIGIN_Y, bottom, t, game.reducedMotion);
    else if (game.phase === 'ready') drawReady(ctx, w, game.world.tuning.modifier);
    else if (game.phase === 'summary' && game.summary) drawSummary(ctx, w, ORIGIN_Y + bottom, game.summary, blink);

  }
}

export function initialSize(game: Game): Size {
  return boardSize(game.world.maze);
}
