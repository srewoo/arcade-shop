// Draws a frame: cached backdrop, live clouds, clays (interpolated), gun, fx.
import type { Fx } from '../fx';
import type { Round } from '../sim';
import { fitWorld, type Fit, type World } from '../world';
import { drawClays, drawReticle } from './clays';
import { drawGun, drawMuzzleFlash } from './gun';
import { paintClouds, paintLand, paintSky, paintWindsock, visibleRect } from './scene';
import { CONFIG } from '../config';

export const MAX_DPR = 2;

export interface FrameState {
  readonly round: Round | null;
  readonly world: World;
  readonly alpha: number;
  readonly aim: { x: number; y: number };
  readonly time: number;
  readonly assist: boolean;
  readonly still: boolean;
  readonly showReticle: boolean;
  readonly wind: number;
}

function layer(w: number, h: number): { c: HTMLCanvasElement; x: CanvasRenderingContext2D } {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return { c, x: c.getContext('2d')! };
}

export class Renderer {
  fit: Fit = { scale: 1, ox: 0, oy: 0 };
  private dpr = 1;
  private cw = 0;
  private ch = 0;
  private sky: HTMLCanvasElement | null = null;
  private land: HTMLCanvasElement | null = null;
  private worldKey = '';
  private readonly ctx: CanvasRenderingContext2D;

  constructor(private readonly canvas: HTMLCanvasElement) {
    this.ctx = canvas.getContext('2d')!;
  }

  /** Size the canvas to its CSS box. Returns true if the size changed. */
  resize(world: World): boolean {
    const r = this.canvas.getBoundingClientRect();
    const cw = Math.max(1, Math.round(r.width));
    const ch = Math.max(1, Math.round(r.height));
    const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
    const key = `${cw}x${ch}@${dpr}:${world.w}x${world.h}`;
    if (key === this.worldKey) return false;
    this.worldKey = key;
    this.cw = cw;
    this.ch = ch;
    this.dpr = dpr;
    this.canvas.width = Math.round(cw * dpr);
    this.canvas.height = Math.round(ch * dpr);
    this.fit = fitWorld(world, cw, ch);
    this.bake(world);
    return true;
  }

  get size(): { w: number; h: number } {
    return { w: this.cw, h: this.ch };
  }

  private bake(world: World): void {
    const v = visibleRect(this.fit, this.cw, this.ch);
    const mk = (paint: (c: CanvasRenderingContext2D) => void): HTMLCanvasElement => {
      const l = layer(this.canvas.width, this.canvas.height);
      this.apply(l.x);
      paint(l.x);
      return l.c;
    };
    this.sky = mk((c) => paintSky(c, world, v));
    this.land = mk((c) => paintLand(c, world, v));
  }

  private apply(c: CanvasRenderingContext2D): void {
    const s = this.fit.scale * this.dpr;
    c.setTransform(s, 0, 0, s, this.fit.ox * this.dpr, this.fit.oy * this.dpr);
  }

  draw(f: FrameState, fx: Fx): void {
    const { ctx, canvas } = this;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (this.sky) ctx.drawImage(this.sky, 0, 0);
    this.apply(ctx);
    if (!f.still) paintClouds(ctx, f.world, visibleRect(this.fit, this.cw, this.ch), f.time);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    if (this.land) ctx.drawImage(this.land, 0, 0);
    this.apply(ctx);
    const sh = fx.shake > 0 ? CONFIG.fx.shakePx * (fx.shake / (CONFIG.fx.shakeMs / 1000)) : 0;
    if (sh > 0) ctx.translate((Math.random() - 0.5) * sh * 2, (Math.random() - 0.5) * sh * 2);
    paintWindsock(ctx, f.world, f.wind, f.time, f.still);
    if (f.round) drawClays(ctx, f.round.clays, f.alpha, f.assist, f.world, !f.still);
    const tip = drawGun(ctx, f.world, f.aim.x, f.aim.y, fx.recoilAmount);
    drawMuzzleFlash(ctx, tip, fx.flashAmount, this.fit.scale);
    fx.muzzleSmoke(tip.tipX, tip.tipY);
    fx.draw(ctx, this.fit.scale, visibleRect(this.fit, this.cw, this.ch));
    if (f.showReticle) drawReticle(ctx, f.aim.x, f.aim.y, f.round?.params.spread ?? CONFIG.gun.spread, this.fit.scale);
  }
}
