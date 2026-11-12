// Cosmetic effects: fluff puffs, sparkles, confetti, speech bubbles, screen shake.
// Purely visual (never feeds back into the sim), so Math.random is fine here.
import { CONFIG } from '../config';
import { INK } from './palette';
import type { Camera } from './camera';

interface Particle { x: number; y: number; z: number; vx: number; vy: number; vz: number; life: number; max: number; color: string; size: number; shape: 'dot' | 'star' | 'rect' }
interface Bubble { x: number; y: number; text: string; t: number }
/** Comic impact star that pops and fades. */
interface Pop { x: number; y: number; t: number; rot: number }

export interface Fx { parts: Particle[]; bubbles: Bubble[]; pops: Pop[]; shake: number }
export const newFx = (): Fx => ({ parts: [], bubbles: [], pops: [], shake: 0 });
const POP_SECS = 0.28;

const r = (a: number, b: number): number => a + Math.random() * (b - a);

export type BurstKind = 'fluff' | 'sparkle' | 'confetti';

export function burst(fx: Fx, kind: BurstKind, x: number, y: number, reduce: boolean): void {
  const n = Math.round(CONFIG.fx.particles * (kind === 'confetti' ? 2.2 : kind === 'sparkle' ? 0.8 : 0.5) * (reduce ? CONFIG.fx.reducedParticleFactor : 1));
  if (kind === 'fluff' && !reduce) fx.pops.push({ x, y, t: 0, rot: Math.random() * 3 });
  const palette = kind === 'fluff' ? ['#fff8ec', '#f4d9a6'] : kind === 'sparkle' ? ['#ffd24a', '#fff'] : ['#e8553e', '#f2a33a', '#3aa6b0', '#8a63c9', '#5aa469'];
  for (let i = 0; i < n; i++) {
    const a = r(0, Math.PI * 2), sp = kind === 'confetti' ? r(60, 260) : r(30, 140);
    fx.parts.push({
      x, y, z: kind === 'confetti' ? r(20, 60) : 20, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp * 0.6, vz: r(60, 220),
      life: 0, max: r(0.5, kind === 'confetti' ? 1.5 : 0.9), color: palette[i % palette.length] ?? '#fff', size: r(2, 5),
      shape: kind === 'confetti' ? 'rect' : kind === 'sparkle' ? 'star' : 'dot',
    });
  }
}

export function addBubble(fx: Fx, x: number, y: number, text: string): void {
  fx.bubbles.push({ x, y, text, t: 0 });
}

export function updateFx(fx: Fx, dt: number): void {
  for (const p of fx.parts) {
    p.life += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt; p.vz -= 420 * dt;
    if (p.z < 0) { p.z = 0; p.vz *= -0.3; }
  }
  fx.parts = fx.parts.filter((p) => p.life < p.max);
  for (const o of fx.pops) o.t += dt;
  fx.pops = fx.pops.filter((o) => o.t < POP_SECS);
  for (const b of fx.bubbles) b.t += dt;
  fx.bubbles = fx.bubbles.filter((b) => b.t < CONFIG.fx.yowlSecs);
  fx.shake = Math.max(0, fx.shake - dt / (CONFIG.fx.shakeMs / 1000));
}

function sparkle(c: CanvasRenderingContext2D, x: number, y: number, r: number): void {
  c.beginPath();
  c.moveTo(x, y - r); c.quadraticCurveTo(x + r * 0.12, y - r * 0.12, x + r, y);
  c.quadraticCurveTo(x + r * 0.12, y + r * 0.12, x, y + r); c.quadraticCurveTo(x - r * 0.12, y + r * 0.12, x - r, y);
  c.quadraticCurveTo(x - r * 0.12, y - r * 0.12, x, y - r); c.fill();
}

export function drawParticles(c: CanvasRenderingContext2D, cam: Camera, fx: Fx): void {
  for (const p of fx.parts) {
    const s = cam.project(p.x, p.y, p.z);
    const fade = Math.max(0, 1 - p.life / p.max);
    const sz = p.size * Math.max(0.7, cam.k);
    c.fillStyle = p.color;
    if (p.shape === 'rect') {
      c.save(); c.translate(s.x, s.y); c.rotate(p.life * 9 + p.size); c.scale(1, Math.cos(p.life * 14 + p.size));
      c.globalAlpha = fade; c.fillRect(-sz * 0.8, -sz * 0.5, sz * 1.6, sz); c.strokeStyle = 'rgba(43,36,32,0.55)'; c.lineWidth = 0.8; c.strokeRect(-sz * 0.8, -sz * 0.5, sz * 1.6, sz);
      c.restore();
    } else if (p.shape === 'star') {
      c.globalAlpha = fade * 0.35; c.beginPath(); c.arc(s.x, s.y, sz * 2.2, 0, 7); c.fill();
      c.globalAlpha = fade; sparkle(c, s.x, s.y, sz * 2.1 * (0.6 + 0.4 * Math.sin(p.life * 18 + p.size)));
    } else {
      c.globalAlpha = fade * 0.4; c.beginPath(); c.arc(s.x, s.y, sz * 1.6, 0, 7); c.fill();
      c.globalAlpha = fade; c.beginPath(); c.arc(s.x, s.y, sz, 0, 7); c.fill();
    }
  }
  c.globalAlpha = 1;
  for (const o of fx.pops) drawPop(c, cam, o);
}

function drawPop(c: CanvasRenderingContext2D, cam: Camera, o: Fx['pops'][number]): void {
  const t = o.t / POP_SECS;
  const s = cam.project(o.x, o.y, 34);
  const r = (10 + 26 * Math.sqrt(t)) * Math.max(0.7, cam.k);
  c.save(); c.translate(s.x, s.y); c.rotate(o.rot + t * 0.5); c.globalAlpha = 1 - t;
  c.beginPath();
  for (let i = 0; i < 16; i++) { const a = (i * Math.PI) / 8, rr = i % 2 ? r * 0.55 : r; c.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); }
  c.closePath(); c.fillStyle = '#ffe36a'; c.strokeStyle = INK; c.lineWidth = 2; c.fill(); c.stroke();
  c.restore(); c.globalAlpha = 1;
}

export function drawBubbles(c: CanvasRenderingContext2D, cam: Camera, fx: Fx): void {
  c.font = `800 ${Math.max(12, 13 * cam.k)}px system-ui, sans-serif`;
  c.textAlign = 'center';
  for (const b of fx.bubbles) {
    const p = cam.project(b.x, b.y, 74);
    const w = c.measureText(b.text).width + 14, h = Math.max(20, 22 * cam.k);
    const rise = Math.min(1, b.t * 6) * 6;
    c.globalAlpha = Math.min(1, (CONFIG.fx.yowlSecs - b.t) * 3);
    c.fillStyle = '#fff'; c.strokeStyle = INK; c.lineWidth = 2;
    c.beginPath(); c.roundRect(p.x - w / 2, p.y - h - rise, w, h, 8); c.fill(); c.stroke();
    c.beginPath(); c.moveTo(p.x - 5, p.y - rise - 1); c.lineTo(p.x + 1, p.y - rise + 7); c.lineTo(p.x + 5, p.y - rise - 1); c.fill();
    c.beginPath(); c.moveTo(p.x - 5, p.y - rise); c.lineTo(p.x + 1, p.y - rise + 7); c.lineTo(p.x + 5, p.y - rise); c.stroke();
    c.fillStyle = '#fff'; c.fillRect(p.x - 4, p.y - rise - 3, 8, 3);
    c.fillStyle = INK; c.fillText(b.text, p.x, p.y - h * 0.3 - rise);
  }
  c.globalAlpha = 1; c.textAlign = 'left';
}
