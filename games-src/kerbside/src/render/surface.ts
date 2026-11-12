// Asphalt surface for the static layer: tone, patches, cracks, stains, puddles, worn paint and lamp light.
import type { Box } from '../geom';
import { corners } from '../geom';
import type { Level } from '../levels/types';
import { createRng } from '../rng';
import { PAL } from './palette';

type G = CanvasRenderingContext2D;

export function asphalt(ctx: G, level: Level): void {
  const { w, h } = level.world;
  const g = ctx.createLinearGradient(0, 0, w, h);
  g.addColorStop(0, '#3b424c');
  g.addColorStop(0.5, PAL.asphalt);
  g.addColorStop(1, '#2f353d');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  const rng = createRng(level.id * 7919);
  for (let i = 0; i < 16; i++) {
    const x = rng.range(0, w);
    const y = rng.range(0, h);
    const r = rng.range(2, 6);
    const rg = ctx.createRadialGradient(x, y, 0, x, y, r);
    rg.addColorStop(0, i % 2 ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.1)');
    rg.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = rg;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }
  const specks = Math.floor(w * h * 3);
  for (let i = 0; i < specks; i++) {
    ctx.fillStyle = i % 3 === 0 ? 'rgba(255,255,255,0.07)' : i % 3 === 1 ? 'rgba(0,0,0,0.14)' : PAL.asphaltSpeck;
    const s = 0.04 + rng.next() * 0.06;
    ctx.fillRect(rng.range(0, w), rng.range(0, h), s, s);
  }
}

function patches(ctx: G, w: number, h: number, rng: ReturnType<typeof createRng>): void {
  for (let i = 0; i < 3; i++) {
    const x = rng.range(1, w - 5);
    const y = rng.range(1, h - 4);
    const pw = rng.range(1.5, 3.5);
    const ph = rng.range(1, 2.4);
    ctx.fillStyle = 'rgba(14,18,24,0.16)';
    ctx.beginPath();
    ctx.roundRect(x, y, pw, ph, 0.35);
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.18)';
    ctx.lineWidth = 0.04;
    ctx.stroke();
  }
}

function drain(ctx: G, x: number, y: number): void {
  ctx.fillStyle = '#1b1f25';
  ctx.fillRect(x - 0.45, y - 0.3, 0.9, 0.6);
  ctx.strokeStyle = '#59616d';
  ctx.lineWidth = 0.05;
  ctx.strokeRect(x - 0.45, y - 0.3, 0.9, 0.6);
  for (let i = -3; i <= 3; i++) {
    ctx.beginPath();
    ctx.moveTo(x + i * 0.12, y - 0.26);
    ctx.lineTo(x + i * 0.12, y + 0.26);
    ctx.stroke();
  }
}

function puddle(ctx: G, x: number, y: number, r: number): void {
  const g = ctx.createRadialGradient(x - r * 0.2, y - r * 0.3, 0.1, x, y, r);
  g.addColorStop(0, 'rgba(150,190,230,0.34)');
  g.addColorStop(0.7, 'rgba(100,140,190,0.2)');
  g.addColorStop(1, 'rgba(100,140,190,0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.ellipse(x, y, r * 1.5, r, 0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.3)';
  ctx.beginPath();
  ctx.ellipse(x - r * 0.4, y - r * 0.3, r * 0.4, r * 0.12, 0.3, 0, Math.PI * 2);
  ctx.fill();
}

/** Patches, cracks, oil, drain and puddles so the tarmac reads as used. */
export function wear(ctx: G, level: Level): void {
  const { w, h } = level.world;
  const rng = createRng(level.id * 911 + 7);
  patches(ctx, w, h, rng);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = 'rgba(0,0,0,0.34)';
  ctx.lineWidth = 0.05;
  for (let i = 0; i < 7; i++) {
    let x = rng.range(0, w);
    let y = rng.range(0, h);
    ctx.beginPath();
    ctx.moveTo(x, y);
    for (let k = 0; k < 6; k++) {
      x += rng.range(-0.8, 0.8);
      y += rng.range(-0.8, 0.8);
      ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  for (let i = 0; i < 4; i++) {
    const x = rng.range(1, w - 1);
    const y = rng.range(1, h - 1);
    const g = ctx.createRadialGradient(x, y, 0.05, x, y, rng.range(0.5, 1));
    g.addColorStop(0, 'rgba(5,8,12,0.4)');
    g.addColorStop(1, 'rgba(5,8,12,0)');
    ctx.fillStyle = g;
    ctx.fillRect(x - 1, y - 1, 2, 2);
  }
  drain(ctx, rng.range(2, w - 2), h - 1.2);
  puddle(ctx, rng.range(3, w - 3), rng.range(3, h - 3), rng.range(0.7, 1.1));
  ctx.strokeStyle = 'rgba(0,0,0,0.16)';
  ctx.lineWidth = 0.22;
  for (let i = 0; i < 4; i++) {
    const x0 = rng.range(2, w - 2);
    const y0 = rng.range(2, h - 2);
    for (const off of [-0.55, 0.55]) {
      ctx.beginPath();
      ctx.moveTo(x0, y0 + off);
      ctx.quadraticCurveTo(x0 + rng.range(2, 5), y0 + off + rng.range(-2, 2), x0 + rng.range(5, 9), y0 + off + rng.range(-3, 3));
      ctx.stroke();
    }
  }
}

function boxPath(ctx: G, b: Box): void {
  const c = corners(b);
  ctx.beginPath();
  c.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
  ctx.closePath();
}

/** Bay lines in worn paint: a soft glow underneath, then the stroke, then asphalt-coloured scuffs on top. */
export function paintLines(ctx: G, level: Level): void {
  const rng = createRng(level.id * 41 + 9);
  ctx.lineJoin = 'round';
  for (const b of level.paint) {
    boxPath(ctx, b);
    ctx.strokeStyle = 'rgba(0,0,0,0.25)';
    ctx.lineWidth = 0.18;
    ctx.stroke();
  }
  ctx.strokeStyle = PAL.line;
  ctx.globalAlpha = 0.78;
  ctx.lineWidth = 0.1;
  for (const b of level.paint) {
    boxPath(ctx, b);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  ctx.fillStyle = 'rgba(48,54,62,0.8)';
  for (const b of level.paint) {
    const c = corners(b);
    for (let i = 0; i < 4; i++) {
      const p = c[i] as { x: number; y: number };
      const q = c[(i + 1) % 4] as { x: number; y: number };
      const n = Math.round(Math.hypot(q.x - p.x, q.y - p.y) * 3);
      for (let k = 0; k < n; k++) {
        const t = rng.next();
        ctx.fillRect(p.x + (q.x - p.x) * t - 0.03, p.y + (q.y - p.y) * t - 0.03, rng.range(0.03, 0.09), rng.range(0.03, 0.09));
      }
    }
  }
}

function lampSpots(level: Level): Array<[number, number]> {
  const { w, h } = level.world;
  return [[w * 0.2, 0], [w * 0.8, 0], [w * 0.2, h], [w * 0.8, h]];
}

/** Warm light pools from lamp posts on the lot edge (additive, clipped to the tarmac). */
export function lampPools(ctx: G, level: Level): void {
  const { w, h } = level.world;
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, w, h);
  ctx.clip();
  ctx.globalCompositeOperation = 'lighter';
  for (const [x, y] of lampSpots(level)) {
    const r = Math.min(w, h) * 0.55;
    const g = ctx.createRadialGradient(x, y, 0.2, x, y, r);
    g.addColorStop(0, 'rgba(255,230,170,0.16)');
    g.addColorStop(1, 'rgba(255,230,170,0)');
    ctx.fillStyle = g;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }
  ctx.restore();
}

/** Lamp posts seen from above, on the pavement outside the kerb. */
export function lampHeads(ctx: G, level: Level): void {
  for (const [x, y] of lampSpots(level)) {
    const dir = y === 0 ? -1 : 1;
    ctx.strokeStyle = '#303843';
    ctx.lineWidth = 0.12;
    ctx.beginPath();
    ctx.moveTo(x, y + dir * 1.4);
    ctx.lineTo(x, y + dir * 0.35);
    ctx.stroke();
    ctx.fillStyle = '#fff2bf';
    ctx.beginPath();
    ctx.roundRect(x - 0.28, y + dir * 0.35 - 0.12, 0.56, 0.24, 0.08);
    ctx.fill();
  }
}
