// Canvas renderer: cached static layer + interpolated moving rig.
import type { CarState } from '../car';
import { carBox, hitchPoint, trailerBox } from '../car';
import { CONFIG } from '../config';
import { wrapAngle } from '../geom';
import type { Level } from '../levels/types';
import type { SimState } from '../sim';
import { alignmentFor, closeness } from '../alignment';
import { applyView, fitView } from './camera';
import type { View } from './camera';
import { drawCaravan, drawCar } from './carArt';
import { Fx } from './fx';
import { PAL } from './palette';
import { drawBeam, drawVignette } from './lights';
import { drawBay, drawHeading, drawStatic } from './scene';

export const lerpCar = (a: CarState, b: CarState, t: number): CarState => ({
  x: a.x + (b.x - a.x) * t,
  y: a.y + (b.y - a.y) * t,
  a: a.a + wrapAngle(b.a - a.a) * t,
  v: a.v + (b.v - a.v) * t,
  steer: a.steer + (b.steer - a.steer) * t,
  phi: a.phi + wrapAngle(b.phi - a.phi) * t,
});

export interface Frame {
  readonly level: Level;
  readonly prev: SimState;
  readonly curr: SimState;
  readonly alpha: number;
  readonly time: number;
  readonly assist: boolean;
  readonly throttle: number;
}

export class Renderer {
  readonly fx = new Fx();
  private readonly ctx: CanvasRenderingContext2D;
  private cache: { key: string; layer: HTMLCanvasElement } | null = null;
  private view: View = { rotated: false, scale: 1, tx: 0, ty: 0 };
  private dpr = 1;
  private lastSkid: { lx: number; ly: number; rx: number; ry: number } | null = null;
  /** CSS px at the top of the canvas covered by the in-scene HUD. */
  topInset = 0;

  constructor(private readonly canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D is not available');
    this.ctx = ctx;
  }

  /** Match the backing store to the CSS size; returns true when it changed. */
  resize(): boolean {
    const rect = this.canvas.getBoundingClientRect();
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = Math.max(1, Math.round(rect.width * dpr));
    const h = Math.max(1, Math.round(rect.height * dpr));
    this.dpr = dpr;
    if (this.canvas.width === w && this.canvas.height === h) return false;
    this.canvas.width = w;
    this.canvas.height = h;
    this.cache = null;
    return true;
  }

  private layerFor(level: Level, assist: boolean): HTMLCanvasElement {
    const key = `${level.id}:${this.canvas.width}x${this.canvas.height}:${assist}:${Math.round(this.topInset)}`;
    if (this.cache?.key === key) return this.cache.layer;
    const layer = document.createElement('canvas');
    layer.width = this.canvas.width;
    layer.height = this.canvas.height;
    const lctx = layer.getContext('2d');
    if (lctx) {
      this.view = fitView(layer.width / this.dpr, layer.height / this.dpr, level.world.w, level.world.h, this.topInset);
      applyView(lctx, this.view, this.dpr, level.world.h, { x: 0, y: 0 });
      drawStatic(lctx, level);
      lctx.setTransform(1, 0, 0, 1, 0, 0);
      drawVignette(lctx, layer.width, layer.height);
    }
    this.cache = { key, layer };
    return layer;
  }

  draw(f: Frame): void {
    const { ctx, canvas } = this;
    const layer = this.layerFor(f.level, f.assist);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const sh = this.fx.shake();
    ctx.drawImage(layer, sh.x * this.dpr, sh.y * this.dpr);
    applyView(ctx, this.view, this.dpr, f.level.world.h, sh);
    this.drawMoving(f);
  }

  private drawMoving(f: Frame): void {
    const { ctx } = this;
    const car = lerpCar(f.prev.car, f.curr.car, f.alpha);
    const pulse = f.assist ? 0.5 : (Math.sin(f.time * 4) + 1) / 2;
    const al = alignmentFor(car, f.level);
    drawBay(ctx, f.level, f.curr.hold, f.curr.inBay, pulse, f.assist, closeness(al.quality, f.curr.inBay));
    if (f.curr.status === 'playing' && al.overlap > 0.2) drawHeading(ctx, f.level, car, al.angleOk);
    const hit = f.curr.cooldown > CONFIG.damage.hitCooldown - 0.25;
    const braking = f.throttle * car.v < 0 && Math.abs(car.v) > 0.1;
    this.markSkids(car, braking, f.curr.status === 'playing');
    this.fx.drawUnder(ctx);
    drawBeam(ctx, carBox(car));
    if (f.level.trailer) this.drawRigTrailer(car);
    drawCar(ctx, carBox(car), { color: hit ? '#ffffff' : PAL.player, dark: PAL.playerDark, steer: car.steer, braking, reversing: car.v < -0.05 || f.throttle < 0, lights: true });
    this.fx.draw(ctx);
  }

  /** Leave tyre marks from the rear wheels while braking hard or turning hard at speed. */
  private markSkids(car: CarState, braking: boolean, playing: boolean): void {
    const skidding = playing && ((braking && Math.abs(car.v) > 2.2) || (Math.abs(car.steer) > 0.45 && Math.abs(car.v) > 3.5));
    if (!skidding) {
      this.lastSkid = null;
      return;
    }
    const nx = -Math.sin(car.a) * 0.8;
    const ny = Math.cos(car.a) * 0.8;
    const now = { lx: car.x + nx, ly: car.y + ny, rx: car.x - nx, ry: car.y - ny };
    const last = this.lastSkid;
    if (!last) {
      this.lastSkid = now;
      return;
    }
    if (Math.hypot(now.lx - last.lx, now.ly - last.ly) < 0.2) return;
    this.fx.skid(last.lx, last.ly, now.lx, now.ly);
    this.fx.skid(last.rx, last.ry, now.rx, now.ry);
    if (braking && !this.fx.reduced) this.fx.smoke(car.x, car.y, 0.22);
    this.lastSkid = now;
  }

  private drawRigTrailer(car: CarState): void {
    const { ctx } = this;
    const h = hitchPoint(car);
    const tb = trailerBox(car);
    ctx.strokeStyle = '#2a2f36';
    ctx.lineWidth = 0.14;
    ctx.beginPath();
    ctx.moveTo(h.x, h.y);
    ctx.lineTo(tb.x + Math.cos(tb.a) * tb.hw, tb.y + Math.sin(tb.a) * tb.hw);
    ctx.stroke();
    drawCaravan(ctx, tb, PAL.caravan, '#2f80ed');
  }

  /** World position of the car, for effects. */
  carPoint(car: CarState): { x: number; y: number } {
    const b = carBox(car);
    return { x: b.x, y: b.y };
  }
}
