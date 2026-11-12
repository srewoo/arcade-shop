// Cars, caravans and street furniture drawn in world metres. Bodies are cached sprites; wheels and lamps are live.
import type { Box } from '../geom';
import type { Obstacle } from '../levels/types';
import { paintCaravanBody, paintCarBody, paintShadow, SPRITE_PAD } from './carPaint';
import { PAL, tint } from './palette';
import { drawFurniture } from './furniture';
import { bake, blit } from './sprites';

function rr(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

export interface CarLook {
  readonly color: string;
  readonly dark: string;
  readonly steer: number;
  readonly braking: boolean;
  readonly reversing: boolean;
  readonly lights: boolean;
}

function wheel(ctx: CanvasRenderingContext2D, x: number, y: number, a: number): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(a);
  ctx.fillStyle = PAL.tyre;
  rr(ctx, -0.36, -0.16, 0.72, 0.32, 0.09);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.14)';
  rr(ctx, -0.3, -0.12, 0.6, 0.06, 0.03);
  ctx.fill();
  ctx.fillStyle = '#9aa3af';
  ctx.beginPath();
  ctx.arc(0, 0, 0.07, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/** Ground shadow, offset in world space so it keeps falling the same way as the car turns. */
function groundShadow(ctx: CanvasRenderingContext2D, b: Box, key: string, dx = 0.2, dy = 0.26): void {
  const s = bake(`sh|${key}|${b.hw.toFixed(2)}|${b.hh.toFixed(2)}`, b.hw, b.hh, 0.7, (g) => paintShadow(g, b.hw, b.hh));
  ctx.save();
  ctx.translate(b.x + dx, b.y + dy);
  ctx.rotate(b.a);
  blit(ctx, s, b.hw, b.hh, 0.7);
  ctx.restore();
}

/** Draw a car centred on its body box. Front of the car is +x in local space. */
export function drawCar(ctx: CanvasRenderingContext2D, b: Box, look: CarLook): void {
  groundShadow(ctx, b, 'car');
  ctx.save();
  ctx.translate(b.x, b.y);
  ctx.rotate(b.a);
  const ax = b.hw * 0.6;
  const wy = b.hh - 0.02;
  wheel(ctx, -ax, -wy, 0);
  wheel(ctx, -ax, wy, 0);
  wheel(ctx, ax, -wy, look.steer);
  wheel(ctx, ax, wy, look.steer);
  const key = `car|${look.color}|${look.dark}|${b.hw.toFixed(2)}|${b.hh.toFixed(2)}`;
  blit(ctx, bake(key, b.hw, b.hh, SPRITE_PAD, (g) => paintCarBody(g, b.hw, b.hh, look.color, look.dark)), b.hw, b.hh, SPRITE_PAD);
  lamps(ctx, b, look);
  ctx.restore();
}

function lampGlow(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, rgb: string, a: number): void {
  const g = ctx.createRadialGradient(x, y, 0.02, x, y, r);
  g.addColorStop(0, `rgba(${rgb},${a})`);
  g.addColorStop(1, `rgba(${rgb},0)`);
  ctx.fillStyle = g;
  ctx.fillRect(x - r, y - r, r * 2, r * 2);
}

function lamps(ctx: CanvasRenderingContext2D, b: Box, look: CarLook): void {
  const { hw, hh } = b;
  for (const s of [-1, 1]) {
    ctx.fillStyle = look.lights ? PAL.headlight : 'rgba(255,255,255,0.5)';
    ctx.beginPath();
    ctx.ellipse(hw - 0.14, s * (hh - 0.3), 0.1, 0.18, 0, 0, Math.PI * 2);
    ctx.fill();
    if (look.lights) lampGlow(ctx, hw - 0.1, s * (hh - 0.3), 0.55, '255,246,196', 0.55);
  }
  const on = look.reversing || look.braking;
  for (const s of [-1, 1]) {
    ctx.fillStyle = look.reversing ? PAL.reverse : look.braking ? PAL.tail : look.lights ? '#a8222b' : 'rgba(120,20,25,0.7)';
    rr(ctx, -hw + 0.04, s * (hh - 0.31) - 0.15, 0.15, 0.3, 0.05);
    ctx.fill();
    if (on) lampGlow(ctx, -hw, s * (hh - 0.31), 0.7, look.reversing ? '255,255,255' : '255,46,58', 0.6);
  }
}

export function drawCaravan(ctx: CanvasRenderingContext2D, b: Box, color: string, stripe: string): void {
  groundShadow(ctx, b, 'van', 0.18, 0.24);
  ctx.save();
  ctx.translate(b.x, b.y);
  ctx.rotate(b.a);
  ctx.fillStyle = PAL.tyre;
  rr(ctx, -0.42, -b.hh - 0.05, 0.84, 0.24, 0.07);
  ctx.fill();
  rr(ctx, -0.42, b.hh - 0.19, 0.84, 0.24, 0.07);
  ctx.fill();
  const key = `cvn|${color}|${stripe}|${b.hw.toFixed(2)}|${b.hh.toFixed(2)}`;
  blit(ctx, bake(key, b.hw, b.hh, 0.9, (g) => paintCaravanBody(g, b.hw, b.hh, color, stripe)), b.hw, b.hh, 0.9);
  ctx.restore();
}

export function drawObstacle(ctx: CanvasRenderingContext2D, o: Obstacle): void {
  const b = o.box;
  switch (o.kind) {
    case 'car':
      drawCar(ctx, b, { color: tint(o.tint), dark: '#4a5360', steer: 0, braking: false, reversing: false, lights: false });
      break;
    case 'caravan':
      drawCaravan(ctx, b, PAL.caravan, tint(o.tint));
      break;
    default:
      drawFurniture(ctx, o);
  }
}
