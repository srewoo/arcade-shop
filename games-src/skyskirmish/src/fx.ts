// Render-only effects (particles, rings, popups, shake, flash). Uses Math.random on purpose:
// nothing here feeds back into the simulation. Reduce motion removes shake, flashes and rings,
// cuts particles and keeps score popups static.
import { CONFIG } from './config';
import type { SimEvent } from './types';

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  size: number;
  color: string;
  /** 0 fire (additive glow), 1 spark (streak), 2 smoke. */
  kind: 0 | 1 | 2;
}

export interface Ring {
  x: number;
  y: number;
  r: number;
  grow: number;
  life: number;
  max: number;
  color: string;
  /** Filled radial fireball instead of a thin ring. */
  fill?: boolean;
}

export interface Popup {
  x: number;
  y: number;
  text: string;
  life: number;
  max: number;
  big: boolean;
  rise: number;
}

export interface Fx {
  particles: Particle[];
  rings: Ring[];
  popups: Popup[];
  shake: number;
  flash: number;
  /** Red damage vignette strength 0..1. */
  hurt: number;
  /** Combo label pop 0..1. */
  comboPop: number;
}

export const createFx = (): Fx => ({ particles: [], rings: [], popups: [], shake: 0, flash: 0, hurt: 0, comboPop: 0 });

export function burst(fx: Fx, x: number, y: number, count: number, speed: number, colors: readonly string[], reduce: boolean, kind: 0 | 1 | 2 = 0): void {
  const n = Math.max(1, Math.round(count * (reduce ? CONFIG.fx.reduceFactor : 1)));
  for (let i = 0; i < n && fx.particles.length < 300; i++) {
    const a = Math.random() * Math.PI * 2;
    const v = speed * (0.3 + Math.random() * 0.7);
    const life = kind === 2 ? 0.55 + Math.random() * 0.5 : kind === 1 ? 0.25 + Math.random() * 0.3 : 0.3 + Math.random() * 0.4;
    const size = kind === 2 ? 6 + Math.random() * 7 : 1.5 + Math.random() * 2.5;
    fx.particles.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life, max: life, size, color: colors[i % colors.length] ?? '#fff', kind });
  }
}

function ring(fx: Fx, x: number, y: number, grow: number, color: string, reduce: boolean, fill = false): void {
  if (reduce || fx.rings.length > 24) return;
  fx.rings.push({ x, y, r: fill ? 6 : 4, grow, life: fill ? 0.28 : 0.35, max: fill ? 0.28 : 0.35, color, fill });
}

/** Layered explosion: hot core flash, fire, streaking sparks, rising smoke and a shockwave. */
export function explosion(fx: Fx, x: number, y: number, size: number, reduce: boolean): void {
  burst(fx, x, y, Math.round(10 * size), 150 * size, ['#ffffff', '#ffd25a', '#ff8a3c'], reduce, 0);
  burst(fx, x, y, Math.round(9 * size), 260 * size, ['#fff2b0', '#ffd25a'], reduce, 1);
  burst(fx, x, y, Math.round(5 * size), 55 * size, ['#2a3350', '#46506e'], reduce, 2);
  ring(fx, x, y, 150 * size, '#ffb040', reduce, true);
  ring(fx, x, y, 200 * size, '#ffd25a', reduce);
}

function popup(fx: Fx, x: number, y: number, text: string, big: boolean, reduce: boolean): void {
  if (fx.popups.length > 14) fx.popups.shift();
  fx.popups.push({ x, y: y - 10, text, life: 0.8, max: 0.8, big, rise: reduce ? 0 : 38 });
}

/** A big blast used when the run ends (player down) or is won. */
export function explodeAt(fx: Fx, x: number, y: number, reduce: boolean): void {
  explosion(fx, x, y, 3.2, reduce);
  burst(fx, x, y, 40, 300, ['#ffffff', '#ffd25a', '#ff7a3c', '#ff4b3a'], reduce);
  ring(fx, x, y, 420, '#ffd25a', reduce);
  ring(fx, x, y, 260, '#ffffff', reduce);
  if (!reduce) fx.shake = Math.max(fx.shake, CONFIG.fx.shake * 2);
}

export function fxHandle(fx: Fx, events: readonly SimEvent[], reduce: boolean): void {
  const kick = (amount: number): void => {
    if (!reduce) fx.shake = Math.max(fx.shake, amount);
  };
  for (const e of events) {
    if (e.type === 'kill') {
      explosion(fx, e.x, e.y, e.big ? 2.6 : 1, reduce);
      if (e.big) ring(fx, e.x, e.y, 360, '#ffd25a', reduce);
      popup(fx, e.x, e.y, `+${e.points.toLocaleString('en-US')}`, e.big, reduce);
      kick(e.big ? CONFIG.fx.shake : 2);
    } else if (e.type === 'hurt') {
      burst(fx, e.x, e.y, 30, 200, ['#ff5b3a', '#ffffff'], reduce);
      ring(fx, e.x, e.y, 300, '#ff5b3a', reduce);
      if (!reduce) fx.hurt = 1;
      kick(CONFIG.fx.shake);
    } else if (e.type === 'hit') burst(fx, e.x, e.y, 3, 60, ['#fff2b0'], reduce);
    else if (e.type === 'pickup') {
      burst(fx, e.x, e.y, 14, 120, ['#ffffff', '#7dffb2'], reduce);
      ring(fx, e.x, e.y, 160, '#7dffb2', reduce);
    } else if (e.type === 'shieldBreak') burst(fx, e.x, e.y, 20, 160, ['#7dffb2', '#ffffff'], reduce);
    else if (e.type === 'multUp') fx.comboPop = 1;
    else if (e.type === 'bomb') {
      burst(fx, e.x, e.y, 50, 320, ['#ffffff', '#ffd25a'], reduce);
      ring(fx, e.x, e.y, 700, '#ffffff', reduce);
      ring(fx, e.x, e.y, 520, '#9fe7ff', reduce, true);
      kick(CONFIG.fx.shake * 1.5);
      if (!reduce) fx.flash = 0.7;
    }
    if (e.type === 'down') kick(CONFIG.fx.shake * 1.5);
  }
}

export function fxUpdate(fx: Fx, dt: number): void {
  fx.shake = Math.max(0, fx.shake - dt * 22);
  fx.flash = Math.max(0, fx.flash - dt * 1.6);
  fx.hurt = Math.max(0, fx.hurt - dt * 1.8);
  fx.comboPop = Math.max(0, fx.comboPop - dt * 3);
  for (const p of fx.particles) {
    p.life -= dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    const drag = p.kind === 2 ? 0.93 : 0.96;
    p.vx *= drag;
    p.vy *= drag;
    if (p.kind === 2) p.y -= 18 * dt;
  }
  fx.particles = fx.particles.filter((p) => p.life > 0);
  for (const r of fx.rings) {
    r.life -= dt;
    r.r += r.grow * dt;
  }
  fx.rings = fx.rings.filter((r) => r.life > 0);
  for (const q of fx.popups) {
    q.life -= dt;
    q.y -= q.rise * dt;
  }
  fx.popups = fx.popups.filter((q) => q.life > 0);
}
