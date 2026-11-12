// The static scene (sky, circuit grid, board well, sockets, feeder rail, pylons), drawn once to
// an offscreen canvas and blitted every frame. Rebuilt on resize.
import { CONFIG } from '../config';
import { SCENE } from './palette';
import type { View } from './view';

type Ctx = CanvasRenderingContext2D;
const { cols, rows } = CONFIG.grid;
const TAU = Math.PI * 2;

function rrect(c: Ctx, x: number, y: number, w: number, h: number, r: number): void {
  c.beginPath();
  c.roundRect(x, y, w, h, r);
}

function sky(c: Ctx, v: View): void {
  const g = c.createLinearGradient(0, 0, 0, v.pxH);
  g.addColorStop(0, SCENE.bgTop); g.addColorStop(1, SCENE.bgBottom);
  c.fillStyle = g; c.fillRect(0, 0, v.pxW, v.pxH);
  const cx = v.ox + (cols * v.cs) / 2, cy = v.oy + (rows * v.cs) / 2;
  const glow = c.createRadialGradient(cx, cy, 0, cx, cy, Math.max(v.pxW, v.pxH) * 0.7);
  glow.addColorStop(0, 'rgba(123,92,240,0.34)'); glow.addColorStop(0.5, 'rgba(70,40,170,0.12)'); glow.addColorStop(1, 'rgba(0,0,0,0)');
  c.fillStyle = glow; c.fillRect(0, 0, v.pxW, v.pxH);
  // Faint circuit lattice.
  c.strokeStyle = 'rgba(160,140,255,0.05)'; c.lineWidth = 1;
  const step = Math.max(28, v.cs * 1.1);
  c.beginPath();
  for (let x = -v.pxH; x < v.pxW + v.pxH; x += step) { c.moveTo(x, 0); c.lineTo(x + v.pxH, v.pxH); c.moveTo(x, v.pxH); c.lineTo(x + v.pxH, 0); }
  c.stroke();
  // A scatter of dim stars, seeded so it never shimmers on resize.
  let s = 1234567;
  const rnd = (): number => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
  for (let i = 0; i < 70; i++) {
    const x = rnd() * v.pxW, y = rnd() * v.pxH, r = 0.5 + rnd() * 1.3;
    c.fillStyle = `rgba(210,200,255,${0.1 + rnd() * 0.25})`;
    c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill();
  }
  const vg = c.createRadialGradient(v.pxW / 2, v.pxH / 2, Math.min(v.pxW, v.pxH) * 0.35, v.pxW / 2, v.pxH / 2, Math.max(v.pxW, v.pxH) * 0.75);
  vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(2,0,14,0.55)');
  c.fillStyle = vg; c.fillRect(0, 0, v.pxW, v.pxH);
}

function well(c: Ctx, v: View): void {
  const x = v.ox - v.pad, y = v.oy - v.pad, w = cols * v.cs + v.pad * 2, h = rows * v.cs + v.pad * 2;
  c.save();
  c.shadowColor = 'rgba(123,92,240,0.55)'; c.shadowBlur = v.cs * 0.9;
  rrect(c, x, y, w, h, v.cs * 0.5);
  c.fillStyle = SCENE.wellDeep; c.fill();
  c.restore();
  const g = c.createLinearGradient(0, y, 0, y + h);
  g.addColorStop(0, '#1b1545'); g.addColorStop(0.5, SCENE.well); g.addColorStop(1, '#0d0a28');
  rrect(c, x, y, w, h, v.cs * 0.5); c.fillStyle = g; c.fill();
  const edge = c.createLinearGradient(x, y, x + w, y + h);
  edge.addColorStop(0, '#d2c6ff'); edge.addColorStop(0.45, SCENE.accent); edge.addColorStop(1, '#3b2a99');
  c.lineWidth = Math.max(2, v.cs * 0.07); c.strokeStyle = edge;
  rrect(c, x, y, w, h, v.cs * 0.5); c.stroke();
  c.lineWidth = 1; c.strokeStyle = 'rgba(255,255,255,0.08)';
  rrect(c, x + v.cs * 0.1, y + v.cs * 0.1, w - v.cs * 0.2, h - v.cs * 0.2, v.cs * 0.42); c.stroke();
}

function sockets(c: Ctx, v: View): void {
  for (let r = 1; r < rows; r++) {
    for (let col = 0; col < cols; col++) {
      const cx = v.ox + (col + 0.5) * v.cs, cy = v.oy + (r + 0.5) * v.cs;
      const g = c.createRadialGradient(cx, cy - v.cs * 0.06, 0, cx, cy, v.cs * 0.44);
      g.addColorStop(0, 'rgba(8,6,26,0.9)'); g.addColorStop(0.85, 'rgba(18,14,50,0.55)'); g.addColorStop(1, 'rgba(60,45,140,0.25)');
      c.fillStyle = g;
      c.beginPath(); c.arc(cx, cy, v.cs * 0.44, 0, TAU); c.fill();
      c.strokeStyle = 'rgba(160,140,255,0.1)'; c.lineWidth = 1;
      c.beginPath(); c.arc(cx, cy, v.cs * 0.44, 0, TAU); c.stroke();
    }
  }
}

function feeder(c: Ctx, v: View): void {
  const x = v.ox - v.pad * 0.5, y = v.oy + v.cs * 0.06, w = cols * v.cs + v.pad, h = v.cs * 0.88;
  const g = c.createLinearGradient(0, y, 0, y + h);
  g.addColorStop(0, 'rgba(123,92,240,0.28)'); g.addColorStop(1, 'rgba(60,40,150,0.1)');
  rrect(c, x, y, w, h, h / 2); c.fillStyle = g; c.fill();
  c.strokeStyle = 'rgba(185,166,255,0.35)'; c.lineWidth = 1.5; rrect(c, x, y, w, h, h / 2); c.stroke();
  for (let col = 0; col < cols; col++) {
    const cx = v.ox + (col + 0.5) * v.cs;
    c.fillStyle = 'rgba(185,166,255,0.28)';
    c.beginPath(); c.arc(cx, v.oy + v.cs * 0.5, v.cs * 0.38, 0, TAU); c.fill();
    c.fillStyle = 'rgba(12,8,36,0.7)';
    c.beginPath(); c.arc(cx, v.oy + v.cs * 0.5, v.cs * 0.3, 0, TAU); c.fill();
  }
  // Danger line under the feeder row.
  c.setLineDash([v.cs * 0.18, v.cs * 0.14]);
  c.strokeStyle = 'rgba(255,61,94,0.4)'; c.lineWidth = Math.max(1, v.cs * 0.03);
  c.beginPath(); c.moveTo(v.ox, v.oy + v.cs); c.lineTo(v.ox + cols * v.cs, v.oy + v.cs); c.stroke();
  c.setLineDash([]);
}

function floor(c: Ctx, v: View): void {
  const y = v.oy + rows * v.cs;
  const g = c.createLinearGradient(v.ox, 0, v.ox + cols * v.cs, 0);
  g.addColorStop(0, 'rgba(123,92,240,0)'); g.addColorStop(0.5, 'rgba(185,166,255,0.9)'); g.addColorStop(1, 'rgba(123,92,240,0)');
  c.fillStyle = g; c.fillRect(v.ox - v.pad * 0.4, y + v.cs * 0.02, cols * v.cs + v.pad * 0.8, Math.max(2, v.cs * 0.06));
  const glow = c.createLinearGradient(0, y, 0, y - v.cs * 0.6);
  glow.addColorStop(0, 'rgba(123,92,240,0.3)'); glow.addColorStop(1, 'rgba(123,92,240,0)');
  c.fillStyle = glow; c.fillRect(v.ox, y - v.cs * 0.6, cols * v.cs, v.cs * 0.6);
}

function pylons(c: Ctx, v: View): void {
  for (const side of [-1, 1] as const) {
    const px = side < 0 ? v.ox - v.pad * 0.5 : v.ox + cols * v.cs + v.pad * 0.5;
    for (let r = 0; r <= rows; r += 1) {
      const y = v.oy + r * v.cs;
      c.fillStyle = r % 3 === 0 ? 'rgba(255,231,163,0.85)' : 'rgba(185,166,255,0.5)';
      c.beginPath(); c.arc(px, y, Math.max(1.5, v.cs * (r % 3 === 0 ? 0.075 : 0.045)), 0, TAU); c.fill();
    }
  }
}

export function renderBackdrop(v: View): HTMLCanvasElement {
  const cv = document.createElement('canvas');
  cv.width = Math.round(v.pxW * v.dpr);
  cv.height = Math.round(v.pxH * v.dpr);
  const c = cv.getContext('2d') as Ctx;
  c.scale(v.dpr, v.dpr);
  sky(c, v); well(c, v); sockets(c, v); feeder(c, v); floor(c, v); pylons(c, v);
  return cv;
}
