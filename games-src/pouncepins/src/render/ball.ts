// The yarn ball, the bonus fish and the ghost arrow.
import { CONFIG } from '../config';
import { previewPath } from '../preview';
import { INK } from './palette';
import type { Camera } from './camera';
import type { Ball } from '../worldTypes';

const { ball: B } = CONFIG;

export function drawYarn(c: CanvasRenderingContext2D, cam: Camera, x: number, y: number, spin: number): void {
  const p = cam.project(x, y, B.radius);
  const s = cam.project(x, y, 0);
  const r = Math.max(7, B.radius * cam.k * 1.15);
  const sg = c.createRadialGradient(s.x, s.y, 0, s.x, s.y, r * 1.3);
  sg.addColorStop(0, 'rgba(30,20,40,0.42)'); sg.addColorStop(1, 'rgba(30,20,40,0)');
  c.save(); c.translate(s.x, s.y); c.scale(1, 0.38); c.translate(-s.x, -s.y);
  c.fillStyle = sg; c.beginPath(); c.arc(s.x, s.y, r * 1.3, 0, 7); c.fill(); c.restore();
  const g = c.createRadialGradient(p.x - r * 0.35, p.y - r * 0.4, r * 0.08, p.x, p.y, r);
  g.addColorStop(0, '#e2c9ff'); g.addColorStop(0.45, '#9a68d8'); g.addColorStop(1, '#4a2686');
  c.fillStyle = g; c.strokeStyle = INK; c.lineWidth = 2;
  c.beginPath(); c.arc(p.x, p.y, r, 0, 7); c.fill(); c.stroke();
  c.save(); c.beginPath(); c.arc(p.x, p.y, r - 1, 0, 7); c.clip();
  c.lineCap = 'round';
  for (let i = 0; i < 7; i++) {
    c.strokeStyle = i % 2 ? 'rgba(255,255,255,0.5)' : 'rgba(40,10,80,0.32)';
    c.lineWidth = Math.max(1.2, r * (i % 2 ? 0.1 : 0.13));
    c.beginPath(); c.ellipse(p.x, p.y, r * 1.45, r * (0.4 + (i % 3) * 0.12), spin + (i * Math.PI) / 7, 0, 7); c.stroke();
  }
  const sh = c.createRadialGradient(p.x - r * 0.3, p.y - r * 0.35, r * 0.4, p.x, p.y, r * 1.05);
  sh.addColorStop(0, 'rgba(40,10,80,0)'); sh.addColorStop(1, 'rgba(40,10,80,0.45)');
  c.fillStyle = sh; c.fillRect(p.x - r, p.y - r, r * 2, r * 2);
  c.restore();
  c.fillStyle = 'rgba(255,255,255,0.8)';
  c.beginPath(); c.ellipse(p.x - r * 0.38, p.y - r * 0.45, r * 0.2, r * 0.11, -0.6, 0, 7); c.fill();
  // fuzz and a loose thread
  c.strokeStyle = '#c3a1ec'; c.lineWidth = 1;
  for (let i = 0; i < 16; i++) { const a = i * 0.39 + spin * 0.2; c.beginPath(); c.moveTo(p.x + Math.cos(a) * r, p.y + Math.sin(a) * r); c.lineTo(p.x + Math.cos(a + 0.12) * r * 1.12, p.y + Math.sin(a + 0.12) * r * 1.12); c.stroke(); }
  c.strokeStyle = INK; c.lineWidth = 2;
  c.beginPath(); c.moveTo(p.x + r * 0.7, p.y + r * 0.7); c.quadraticCurveTo(p.x + r * 1.3, p.y + r * 0.9, p.x + r * 1.1, p.y + r * 1.4); c.stroke();
  c.strokeStyle = '#b48be6'; c.lineWidth = 1;
  c.beginPath(); c.moveTo(p.x + r * 0.7, p.y + r * 0.7); c.quadraticCurveTo(p.x + r * 1.3, p.y + r * 0.9, p.x + r * 1.1, p.y + r * 1.4); c.stroke();
}

export function drawBall(c: CanvasRenderingContext2D, cam: Camera, b: Ball, alpha: number, spin: number): void {
  drawYarn(c, cam, b.px + (b.x - b.px) * alpha, b.py + (b.y - b.py) * alpha, spin);
}

export function drawFish(c: CanvasRenderingContext2D, cam: Camera, x: number, y: number, t: number, reduce: boolean): void {
  const bob = reduce ? 0 : Math.sin(t * 4) * 3;
  const p = cam.project(x, y, 12 + bob);
  const u = Math.max(0.5, cam.k);
  const gs = cam.project(x, y, 0);
  c.fillStyle = 'rgba(30,20,40,0.25)'; c.beginPath(); c.ellipse(gs.x, gs.y, 12 * u, 4 * u, 0, 0, 7); c.fill();
  if (!reduce) {
    const halo = c.createRadialGradient(p.x, p.y, 2, p.x, p.y, 30 * u);
    halo.addColorStop(0, 'rgba(255,236,150,0.55)'); halo.addColorStop(1, 'rgba(255,236,150,0)');
    c.fillStyle = halo; c.beginPath(); c.arc(p.x, p.y, 30 * u, 0, 7); c.fill();
  }
  c.save(); c.translate(p.x, p.y); c.scale(u, u);
  const g = c.createLinearGradient(0, -8, 0, 8);
  g.addColorStop(0, '#ffe98a'); g.addColorStop(0.6, '#ffd24a'); g.addColorStop(1, '#f2a33a');
  c.fillStyle = g; c.strokeStyle = INK; c.lineWidth = 2; c.lineJoin = 'round';
  c.beginPath(); c.moveTo(12, 0); c.lineTo(23, -9); c.lineTo(21, 0); c.lineTo(23, 9); c.closePath(); c.fill(); c.stroke();
  c.beginPath(); c.moveTo(-3, -7); c.lineTo(2, -13); c.lineTo(6, -6); c.closePath(); c.fill(); c.stroke();
  c.beginPath(); c.ellipse(0, 0, 14, 8, 0, 0, 7); c.fill(); c.stroke();
  c.strokeStyle = 'rgba(190,100,20,0.6)'; c.lineWidth = 1.2;
  for (const dx of [-2, 3, 8]) { c.beginPath(); c.arc(dx, 0, 5, -1, 1); c.stroke(); }
  c.fillStyle = '#fff'; c.beginPath(); c.arc(-7, -2, 2.6, 0, 7); c.fill(); c.stroke();
  c.fillStyle = INK; c.beginPath(); c.arc(-7.4, -2, 1.4, 0, 7); c.fill();
  c.fillStyle = 'rgba(255,255,255,0.55)'; c.beginPath(); c.ellipse(1, -4.6, 6, 1.6, 0, 0, 7); c.fill();
  c.restore();
}

/** Translucent guide: a dashed path with an arrowhead where the straight section ends. */
export function drawGhost(c: CanvasRenderingContext2D, cam: Camera, angle: number, curve: number, assist: boolean): void {
  const pts = previewPath(angle, curve, 0.7, B.hookStartX + 260).map((p) => cam.project(p.x, p.y, 4));
  const tip = pts.at(-1);
  const prev = pts.at(-3);
  if (!tip || !prev) return;
  const dir = Math.atan2(tip.y - prev.y, tip.x - prev.x);
  const trace = (): void => { c.beginPath(); pts.forEach((p, i) => (i ? c.lineTo(p.x, p.y) : c.moveTo(p.x, p.y))); };
  c.lineCap = 'round'; c.lineJoin = 'round';
  c.setLineDash(assist ? [4, 8] : [14, 9]);
  trace(); c.strokeStyle = INK; c.lineWidth = 8; c.globalAlpha = 0.5; c.stroke();
  trace(); c.strokeStyle = '#eafcff'; c.lineWidth = 4.5; c.globalAlpha = 0.95; c.stroke();
  c.setLineDash([]); c.globalAlpha = 1;
  const h = Math.max(14, 20 * cam.k);
  c.save(); c.translate(tip.x, tip.y); c.rotate(dir);
  c.beginPath(); c.moveTo(h, 0); c.lineTo(-h * 0.4, -h * 0.75); c.lineTo(-h * 0.1, 0); c.lineTo(-h * 0.4, h * 0.75); c.closePath();
  c.fillStyle = '#eafcff'; c.strokeStyle = INK; c.lineWidth = 2.5; c.fill(); c.stroke();
  c.restore();
}
