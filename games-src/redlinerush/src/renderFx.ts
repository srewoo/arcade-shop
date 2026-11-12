// Visual effects state: sparks, smoke, debris, shockwave rings, floating score text, screen shake, flash.
// Reduce motion removes shake, flash and speed lines and trims particles to 40%.
import { CONFIG } from './config';
import { PALETTE } from './palette';

type Kind = 'spark' | 'smoke' | 'debris' | 'ring' | 'glow';
interface Particle {
  kind: Kind; x: number; y: number; vx: number; vy: number; life: number; max: number; size: number; color: string; rot: number; vr: number;
}
interface Floater { text: string; x: number; y: number; life: number }

export interface Fx {
  particles: Particle[];
  floaters: Floater[];
  shake: number;
  flash: number;
  reduce: boolean;
  tick: number;
}

export const createFx = (): Fx => ({ particles: [], floaters: [], shake: 0, flash: 0, reduce: false, tick: 0 });

function add(fx: Fx, p: Particle): void {
  if (fx.particles.length < CONFIG.fx.particleMax) fx.particles.push(p);
}
const scaled = (fx: Fx, n: number): number => Math.round(n * (fx.reduce ? 0.4 : 1));

export function burst(fx: Fx, x: number, y: number, count: number, color: string, speed = 160): void {
  const n = scaled(fx, count);
  for (let i = 0; i < n; i++) {
    const a = (i / Math.max(1, n)) * Math.PI * 2 + i * 0.7;
    const sp = speed * (0.4 + ((i * 37) % 10) / 10);
    add(fx, { kind: 'spark', x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 0.5, max: 0.5, size: 2 + (i % 3), color, rot: 0, vr: 0 });
  }
}

export function smoke(fx: Fx, x: number, y: number, vy: number, size: number, life = 0.9): void {
  if (fx.reduce && fx.tick % 3 !== 0) return;
  add(fx, { kind: 'smoke', x, y, vx: (Math.sin(fx.tick * 1.7) * 14), vy, life, max: life, size, color: '', rot: 0, vr: 0 });
}

export function debris(fx: Fx, x: number, y: number, count: number, color: string, speed: number): void {
  const n = scaled(fx, count);
  for (let i = 0; i < n; i++) {
    const a = (i / Math.max(1, n)) * Math.PI * 2 + i * 1.3;
    const sp = speed * (0.35 + ((i * 53) % 10) / 12);
    add(fx, {
      kind: 'debris', x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 30, life: 0.9, max: 0.9,
      size: 3 + (i % 4), color, rot: i, vr: (i % 2 ? 1 : -1) * (6 + (i % 5) * 3),
    });
  }
}

export function ring(fx: Fx, x: number, y: number, color: string, kind: 'ring' | 'glow' = 'ring', size = 46): void {
  add(fx, { kind, x, y, vx: 0, vy: 0, life: 0.45, max: 0.45, size, color, rot: 0, vr: 0 });
}

export function floatText(fx: Fx, text: string, x: number, y: number): void {
  fx.floaters.push({ text, x, y, life: CONFIG.fx.floatMs / 1000 });
}

export function hitShake(fx: Fx): void {
  if (fx.reduce) return;
  fx.shake = CONFIG.fx.shakeMs / 1000;
  fx.flash = 0.25;
}

export function updateFx(fx: Fx, dt: number): void {
  fx.shake = Math.max(0, fx.shake - dt);
  fx.flash = Math.max(0, fx.flash - dt);
  fx.tick++;
  for (const p of fx.particles) {
    p.life -= dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.rot += p.vr * dt;
    if (p.kind === 'smoke') { p.vx *= 0.97; p.vy *= 0.97; }
    else if (p.kind === 'debris') p.vy += 260 * dt;
    else if (p.kind === 'spark') { p.vx *= 0.96; p.vy = p.vy * 0.96 + 40 * dt; }
  }
  fx.particles = fx.particles.filter((p) => p.life > 0);
  for (const f of fx.floaters) {
    f.life -= dt;
    f.y -= 30 * dt;
  }
  fx.floaters = fx.floaters.filter((f) => f.life > 0);
}

function drawParticle(g: CanvasRenderingContext2D, p: Particle): void {
  const k = Math.max(0, p.life / p.max);
  switch (p.kind) {
    case 'spark':
      g.globalAlpha = k;
      g.strokeStyle = p.color;
      g.lineWidth = Math.max(1, p.size * 0.7);
      g.beginPath();
      g.moveTo(p.x, p.y);
      g.lineTo(p.x - p.vx * 0.045, p.y - p.vy * 0.045);
      g.stroke();
      g.fillStyle = '#fff';
      g.fillRect(p.x - 0.8, p.y - 0.8, 1.6, 1.6);
      break;
    case 'smoke': {
      const r = p.size * (1.1 - k * 0.9 + 0.6);
      g.globalAlpha = Math.min(0.5, k * 0.6);
      g.fillStyle = 'rgb(70,74,84)';
      g.beginPath();
      g.arc(p.x, p.y, r, 0, 7);
      g.fill();
      g.globalAlpha = Math.min(0.3, k * 0.35);
      g.fillStyle = 'rgb(150,156,166)';
      g.beginPath();
      g.arc(p.x - r * 0.25, p.y - r * 0.25, r * 0.55, 0, 7);
      g.fill();
      break;
    }
    case 'debris':
      g.globalAlpha = Math.min(1, k * 1.6);
      g.save();
      g.translate(p.x, p.y);
      g.rotate(p.rot);
      g.fillStyle = p.color;
      g.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
      g.fillStyle = 'rgba(255,255,255,0.35)';
      g.fillRect(-p.size / 2, -p.size / 4, p.size, 1);
      g.restore();
      break;
    case 'ring':
      g.globalAlpha = k;
      g.strokeStyle = p.color;
      g.lineWidth = 1 + k * 5;
      g.beginPath();
      g.arc(p.x, p.y, p.size * (1 - k) + 6, 0, 7);
      g.stroke();
      break;
    default:
      g.globalAlpha = k * 0.5;
      g.fillStyle = p.color;
      g.beginPath();
      g.arc(p.x, p.y, p.size * (0.5 + (1 - k) * 0.7), 0, 7);
      g.fill();
  }
}

export function drawFx(g: CanvasRenderingContext2D, fx: Fx): void {
  for (const p of fx.particles) if (p.kind === 'smoke' || p.kind === 'debris') drawParticle(g, p);
  g.globalCompositeOperation = 'lighter';
  for (const p of fx.particles) if (p.kind === 'spark' || p.kind === 'ring' || p.kind === 'glow') drawParticle(g, p);
  g.globalCompositeOperation = 'source-over';
  g.globalAlpha = 1;
  g.font = 'italic 900 17px system-ui, sans-serif';
  g.textAlign = 'center';
  g.lineJoin = 'round';
  for (const f of fx.floaters) {
    const age = 1 - f.life / (CONFIG.fx.floatMs / 1000);
    const pop = fx.reduce ? 1 : 1 + Math.max(0, 0.3 - age * 1.5);
    g.globalAlpha = Math.min(1, f.life * 2);
    g.save();
    g.translate(f.x, f.y);
    g.scale(pop, pop);
    g.lineWidth = 5;
    g.strokeStyle = PALETTE.ink;
    g.strokeText(f.text, 0, 0);
    g.fillStyle = PALETTE.text;
    g.fillText(f.text, 0, 0);
    g.restore();
  }
  g.globalAlpha = 1;
  if (fx.flash > 0) {
    g.fillStyle = `rgba(255,77,61,${fx.flash})`;
    g.fillRect(0, 0, CONFIG.view.width * 4, CONFIG.view.height * 4);
  }
}

export const shakeOffset = (fx: Fx, time: number): [number, number] =>
  fx.shake > 0 ? [Math.sin(time * 90) * 5 * fx.shake * 3, Math.cos(time * 70) * 4 * fx.shake * 3] : [0, 0];
