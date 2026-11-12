// Countryside backdrop painted from shapes. Two static layers (sky, landscape)
// are cached off-screen; clouds and the wind sock are drawn live between them.
import { PALETTE as P } from '../palette';
import type { Fit, World } from '../world';
import { farmland, mountains } from './far';
import { house } from './houses';
import { cloudSprite, treeSprite } from './sprites';

export interface Visible {
  readonly x0: number;
  readonly x1: number;
  readonly y0: number;
  readonly y1: number;
}

export const visibleRect = (fit: Fit, cw: number, ch: number): Visible => ({
  x0: -fit.ox / fit.scale,
  x1: (cw - fit.ox) / fit.scale,
  y0: -fit.oy / fit.scale,
  y1: (ch - fit.oy) / fit.scale,
});

export const horizonY = (w: World): number => w.launchY * 0.9;

const hash = (n: number): number => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

export function paintSky(ctx: CanvasRenderingContext2D, w: World, v: Visible): void {
  const hz = horizonY(w);
  const g = ctx.createLinearGradient(0, v.y0, 0, hz);
  g.addColorStop(0, P.skyTop);
  g.addColorStop(0.55, P.skyMid);
  g.addColorStop(1, P.skyLow);
  ctx.fillStyle = g;
  ctx.fillRect(v.x0, v.y0, v.x1 - v.x0, hz - v.y0 + 2);
  const sx = w.w * 0.8;
  const sy = w.h * 0.16;
  const sun = ctx.createRadialGradient(sx, sy, w.h * 0.012, sx, sy, w.h * 0.3);
  sun.addColorStop(0, 'rgba(255,255,255,0.95)');
  sun.addColorStop(0.12, 'rgba(255,250,225,0.65)');
  sun.addColorStop(0.4, 'rgba(255,240,200,0.2)');
  sun.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = sun;
  ctx.fillRect(v.x0, v.y0, v.x1 - v.x0, hz - v.y0);
  // Faint rays from the sun.
  ctx.save();
  ctx.beginPath();
  ctx.rect(v.x0, v.y0, v.x1 - v.x0, hz - v.y0);
  ctx.clip();
  ctx.fillStyle = 'rgba(255,255,235,0.05)';
  for (let i = 0; i < 7; i++) {
    const a = 0.5 + i * 0.32;
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(sx + Math.cos(a) * w.h * 1.6, sy + Math.sin(a) * w.h * 1.6);
    ctx.lineTo(sx + Math.cos(a + 0.08) * w.h * 1.6, sy + Math.sin(a + 0.08) * w.h * 1.6);
    ctx.fill();
  }
  ctx.restore();
  // High cirrus streaks.
  ctx.strokeStyle = 'rgba(255,255,255,0.28)';
  ctx.lineCap = 'round';
  for (let i = 0; i < 9; i++) {
    const x = v.x0 + hash(i + 3) * (v.x1 - v.x0);
    const y = v.y0 + (hz - v.y0) * (0.1 + hash(i + 40) * 0.4);
    ctx.lineWidth = 2 + hash(i) * 3;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.quadraticCurveTo(x + 60, y - 8, x + 120 + hash(i + 9) * 80, y + 2);
    ctx.stroke();
  }
  const haze = ctx.createLinearGradient(0, hz - w.h * 0.18, 0, hz);
  haze.addColorStop(0, 'rgba(220,236,245,0)');
  haze.addColorStop(1, 'rgba(220,236,245,0.6)');
  ctx.fillStyle = haze;
  ctx.fillRect(v.x0, hz - w.h * 0.18, v.x1 - v.x0, w.h * 0.18 + 2);
}

function ridge(ctx: CanvasRenderingContext2D, w: World, v: Visible, base: number, amp: number, phase: number, color: string): void {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(v.x0, base + 40);
  for (let x = v.x0; x <= v.x1 + 20; x += 20) {
    const k = x / w.w;
    ctx.lineTo(x, base - amp * (0.55 + 0.3 * Math.sin(k * 7 + phase) + 0.15 * Math.sin(k * 17 + phase * 2)));
  }
  ctx.lineTo(v.x1 + 20, base + 40);
  ctx.closePath();
  ctx.fill();
}

/** Mown field: broad light/dark bands that widen toward the viewer, blades, clover and flowers. */
function field(ctx: CanvasRenderingContext2D, w: World, v: Visible): void {
  const hz = horizonY(w);
  const g = ctx.createLinearGradient(0, hz, 0, v.y1);
  g.addColorStop(0, P.fieldFar);
  g.addColorStop(1, P.fieldNear);
  ctx.fillStyle = g;
  ctx.fillRect(v.x0, hz, v.x1 - v.x0, v.y1 - hz + 2);
  for (let i = 0; i < 12; i++) {
    const y0 = hz + (v.y1 - hz) * (i / 12) ** 1.7;
    const y1 = hz + (v.y1 - hz) * ((i + 1) / 12) ** 1.7;
    ctx.fillStyle = i % 2 ? 'rgba(255,255,255,0.05)' : 'rgba(0,30,0,0.06)';
    ctx.fillRect(v.x0, y0, v.x1 - v.x0, y1 - y0);
  }
  ctx.lineCap = 'round';
  const n = Math.round(((v.x1 - v.x0) * (v.y1 - hz)) / 900);
  for (let i = 0; i < n; i++) {
    const t = hash(i * 2 + 1) ** 1.4;
    const y = hz + 6 + t * (v.y1 - hz - 6);
    const x = v.x0 + hash(i * 2 + 2) * (v.x1 - v.x0);
    const s = 1.5 + t * 7;
    ctx.strokeStyle = i % 3 === 0 ? 'rgba(170,230,120,0.4)' : 'rgba(20,70,20,0.32)';
    ctx.lineWidth = 0.8 + t * 1.4;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + (hash(i + 5) - 0.5) * s, y - s);
    ctx.stroke();
    if (i % 17 === 0) {
      ctx.fillStyle = i % 2 ? '#fff6b0' : '#ffffff';
      ctx.beginPath();
      ctx.arc(x, y, 1 + t * 2.2, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function treeline(ctx: CanvasRenderingContext2D, w: World, v: Visible, hz: number): void {
  for (let x = v.x0 + 12; x < v.x1 + 40; x += w.w * 0.04) {
    const i = Math.floor(x / (w.w * 0.04));
    const k = hash(i) * 0.5 + 0.5;
    const s = w.h * (0.13 + 0.08 * k);
    const y = hz + w.h * 0.02 + hash(i + 7) * 8;
    ctx.drawImage(treeSprite(i), x - s * 0.36, y - s, s * 0.72, s);
  }
}

/** Post-and-rail fence along the shooting line, with lit rails and posts casting short shadows. */
function fence(ctx: CanvasRenderingContext2D, w: World, v: Visible): void {
  const y = w.launchY + w.h * 0.17;
  const ph = w.h * 0.05;
  const step = w.w * 0.05;
  ctx.fillStyle = 'rgba(10,30,10,0.22)';
  ctx.fillRect(v.x0, y + ph * 0.92, v.x1 - v.x0, 5);
  for (const f of [0.32, 0.68]) {
    const ry = y + ph * f;
    ctx.fillStyle = P.fence;
    ctx.fillRect(v.x0, ry, v.x1 - v.x0, 5);
    ctx.fillStyle = P.fenceLight;
    ctx.fillRect(v.x0, ry, v.x1 - v.x0, 1.8);
  }
  for (let x = v.x0; x < v.x1 + step; x += step) {
    const px = Math.round(x / step) * step;
    const gr = ctx.createLinearGradient(px, 0, px + 7, 0);
    gr.addColorStop(0, P.fenceLight);
    gr.addColorStop(1, P.fence);
    ctx.fillStyle = gr;
    ctx.fillRect(px, y, 7, ph);
    ctx.fillStyle = '#c29a62';
    ctx.fillRect(px - 0.5, y - 1.5, 8, 2.5);
  }
}

export function paintLand(ctx: CanvasRenderingContext2D, w: World, v: Visible): void {
  const hz = horizonY(w);
  mountains(ctx, w, v, hz - w.h * 0.02);
  farmland(ctx, w, v, hz);
  ridge(ctx, w, v, hz + w.h * 0.01, w.h * 0.1, 2.1, P.hillNear);
  ctx.fillStyle = 'rgba(214,232,240,0.28)';
  ctx.fillRect(v.x0, hz - w.h * 0.04, v.x1 - v.x0, w.h * 0.07);
  field(ctx, w, v);
  treeline(ctx, w, v, hz);
  fence(ctx, w, v);
  house(ctx, w, w.w * 0.075);
  house(ctx, w, w.w * 0.925);
  const cx = (v.x0 + v.x1) / 2;
  const vg = ctx.createRadialGradient(cx, (v.y0 + v.y1) / 2, (v.y1 - v.y0) * 0.45, cx, (v.y0 + v.y1) / 2, (v.x1 - v.x0) * 0.72);
  vg.addColorStop(0, 'rgba(8,20,32,0)');
  vg.addColorStop(1, 'rgba(8,20,32,0.28)');
  ctx.fillStyle = vg;
  ctx.fillRect(v.x0, v.y0, v.x1 - v.x0, v.y1 - v.y0);
}

export function paintClouds(ctx: CanvasRenderingContext2D, w: World, v: Visible, t: number): void {
  const span = v.x1 - v.x0 + 600;
  for (let i = 0; i < 4; i++) {
    const x = v.x0 - 300 + ((i * 0.31 * span + t * (6 + i * 3)) % span);
    const y = w.h * (0.07 + 0.09 * i);
    const s = 0.7 + (i % 3) * 0.22;
    ctx.globalAlpha = 0.92;
    ctx.drawImage(cloudSprite(i), x, y, 260 * s, 110 * s);
  }
  ctx.globalAlpha = 1;
}

/** Wind sock: banded cone that leans and stretches with the wind (world widths / s^2, + is right). */
export function paintWindsock(ctx: CanvasRenderingContext2D, w: World, wind: number, t: number, still: boolean): void {
  const x = w.w * 0.27;
  const base = w.launchY + w.h * 0.1;
  const top = base - w.h * 0.1;
  ctx.fillStyle = 'rgba(10,30,10,0.22)';
  ctx.beginPath();
  ctx.ellipse(x + 6, base + 2, 12, 3.5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = P.clayOutline;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(x, base);
  ctx.lineTo(x, top);
  ctx.stroke();
  ctx.strokeStyle = '#d9dde2';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(x - 0.5, base);
  ctx.lineTo(x - 0.5, top);
  ctx.stroke();
  const lift = Math.min(1, Math.abs(wind) / 0.075);
  const dir = wind === 0 ? 1 : Math.sign(wind);
  const len = 30 + 40 * lift;
  const flutter = still ? 0 : Math.sin(t * 6) * 3 * lift;
  const sag = (1 - lift) * 22;
  const segs = 5;
  ctx.lineWidth = 2.5;
  ctx.strokeStyle = P.clayOutline;
  ctx.lineJoin = 'round';
  for (let i = 0; i < segs; i++) {
    const a = i / segs;
    const b = (i + 1) / segs;
    const wob = (k: number): number => sag * k + flutter * Math.sin(k * 3.2 + t * 2);
    const hA = 18 - 7 * a;
    const hB = 18 - 7 * b;
    ctx.fillStyle = i % 2 ? '#ffffff' : '#ff7a2f';
    ctx.beginPath();
    ctx.moveTo(x + dir * len * a, top + wob(a));
    ctx.lineTo(x + dir * len * b, top + wob(b) + (18 - hB) / 2);
    ctx.lineTo(x + dir * len * b, top + wob(b) + (18 - hB) / 2 + hB);
    ctx.lineTo(x + dir * len * a, top + wob(a) + hA);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
}
