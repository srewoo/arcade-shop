// Cosmetic effects: clay fragments, dust, floating score text, shake, flashes.
// Uses Math.random on purpose: nothing here may influence the simulation.
import { CONFIG } from './config';
import { PALETTE as P } from './palette';
import type { ClayKind } from './clay';
import { drawParticle } from './draw/fxDraw';
import { clampLabelX, clampLabelY, scatterInDisc } from './visuals';

export interface Bounds { readonly x0: number; readonly x1: number; readonly y0: number; readonly y1: number }

export interface Particle {
  x: number; y: number; vx: number; vy: number; life: number; max: number; size: number; color: string;
  kind: 'frag' | 'puff' | 'pellet' | 'smoke' | 'ring' | 'star';
  rot: number; vr: number;
}
interface Floater { x: number; y: number; text: string; life: number; max: number; big: boolean }

export class Fx {
  reduced = false;
  shake = 0;
  flash = 0;
  recoil = 0;
  /** Pellet spread radius (world units) for the landing cloud; set by the game each round. */
  spread = CONFIG.gun.spread;
  private smokePending = false;
  private readonly parts: Particle[] = [];
  private readonly floats: Floater[] = [];

  private count(n: number): number {
    return this.reduced ? Math.round(n * CONFIG.fx.reducedFactor) : n;
  }

  private add(p: Particle): void {
    if (this.parts.length >= CONFIG.fx.maxParticles) this.parts.shift();
    this.parts.push(p);
  }

  breakClay(x: number, y: number, kind: ClayKind): void {
    const color = kind === 'gold' ? P.clayGold : P.clay;
    for (let i = 0; i < this.count(CONFIG.fx.fragments); i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = 120 + Math.random() * 260;
      const dark = i % 3 === 0;
      this.add({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 80, life: 0, max: 0.7 + Math.random() * 0.4, size: 4 + Math.random() * 6, color: dark ? (kind === 'gold' ? '#c9961a' : '#c95e0a') : color, kind: 'frag', rot: Math.random() * 6, vr: (Math.random() - 0.5) * 22 });
    }
    this.add({ x, y, vx: 0, vy: 0, life: 0, max: 0.35, size: 56, color: kind === 'gold' ? P.clayGold : P.clayRim, kind: 'ring', rot: 0, vr: 0 });
    if (kind === 'gold') {
      for (let i = 0; i < this.count(8); i++) {
        const a = (i / 8) * Math.PI * 2;
        this.add({ x, y, vx: Math.cos(a) * 150, vy: Math.sin(a) * 150, life: 0, max: 0.6, size: 9, color: '#fff7c4', kind: 'star', rot: i, vr: 4 });
      }
    }
    for (let i = 0; i < this.count(CONFIG.fx.puffs); i++) {
      const a = Math.random() * Math.PI * 2;
      this.add({ x, y, vx: Math.cos(a) * 60, vy: Math.sin(a) * 60 - 20, life: 0, max: 0.5 + Math.random() * 0.3, size: 10 + Math.random() * 10, color: P.dust, kind: 'puff', rot: 0, vr: 0 });
    }
    if (!this.reduced) this.shake = CONFIG.fx.shakeMs / 1000 * 0.6;
  }

  dust(x: number, y: number): void {
    for (let i = 0; i < this.count(6); i++) {
      this.add({ x: x + (Math.random() - 0.5) * 30, y, vx: (Math.random() - 0.5) * 80, vy: -30 - Math.random() * 40, life: 0, max: 0.6, size: 8 + Math.random() * 8, color: P.dust, kind: 'puff', rot: 0, vr: 0 });
    }
  }

  shot(x: number, y: number): void {
    this.recoil = CONFIG.fx.recoilMs / 1000;
    if (!this.reduced) {
      this.shake = CONFIG.fx.shakeMs / 1000;
      this.flash = CONFIG.fx.flashMs / 1000;
    }
    this.smokePending = true;
    for (let i = 0; i < this.count(5); i++) {
      this.add({ x, y, vx: (Math.random() - 0.5) * 140, vy: (Math.random() - 0.5) * 140, life: 0, max: 0.3, size: 3, color: P.flash, kind: 'puff', rot: 0, vr: 0 });
    }
    // Faint pellet cloud where the charge will land: teaches leading a moving clay.
    for (const d of scatterInDisc(this.count(10), this.spread, Math.random)) {
      this.add({ x: x + d.dx, y: y + d.dy, vx: 0, vy: 0, life: 0, max: CONFIG.gun.pelletDelayMs / 1000 + 0.25, size: 2.6, color: P.pellet, kind: 'pellet', rot: 0, vr: 0 });
    }
  }

  /** Called by the renderer with the muzzle position; emits one smoke puff set per shot. */
  muzzleSmoke(x: number, y: number): void {
    if (!this.smokePending) return;
    this.smokePending = false;
    for (let i = 0; i < this.count(5); i++) {
      this.add({ x: x + (Math.random() - 0.5) * 10, y, vx: (Math.random() - 0.5) * 40, vy: -30 - Math.random() * 40, life: 0, max: 0.7 + Math.random() * 0.3, size: 7 + Math.random() * 6, color: P.smoke, kind: 'smoke', rot: 0, vr: 0 });
    }
  }

  float(x: number, y: number, text: string, big = false): void {
    this.floats.push({ x, y, text, life: 0, max: CONFIG.fx.floatMs / 1000, big });
    if (this.floats.length > 12) this.floats.shift();
  }

  update(dt: number): void {
    this.shake = Math.max(0, this.shake - dt);
    this.flash = Math.max(0, this.flash - dt);
    this.recoil = Math.max(0, this.recoil - dt);
    for (const p of this.parts) {
      p.life += dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.rot += p.vr * dt;
      p.vy += (p.kind === 'frag' ? 700 : 0) * dt;
    }
    for (const f of this.floats) {
      f.life += dt;
      f.y -= 38 * dt;
    }
    for (let i = this.parts.length - 1; i >= 0; i--) if (this.parts[i]!.life >= this.parts[i]!.max) this.parts.splice(i, 1);
    for (let i = this.floats.length - 1; i >= 0; i--) if (this.floats[i]!.life >= this.floats[i]!.max) this.floats.splice(i, 1);
  }

  clear(): void {
    this.parts.length = 0;
    this.floats.length = 0;
    this.shake = this.flash = this.recoil = 0;
    this.smokePending = false;
  }

  /** Gun kick 0..1; kept small (not removed) under Reduce motion so a shot still reads. */
  get recoilAmount(): number {
    const a = Math.min(1, this.recoil / (CONFIG.fx.recoilMs / 1000));
    return this.reduced ? a * CONFIG.fx.reducedFactor : a;
  }

  /** Muzzle flash 0..1 (always 0 under Reduce motion: flash() is never set there). */
  get flashAmount(): number {
    return this.reduced ? 0 : Math.min(1, this.flash / (CONFIG.fx.flashMs / 1000));
  }

  draw(ctx: CanvasRenderingContext2D, scale: number, view: Bounds): void {
    for (const p of this.parts) drawParticle(ctx, p);
    ctx.globalAlpha = 1;
    this.drawFloaters(ctx, 1 / scale, view);
  }

  private drawFloaters(ctx: CanvasRenderingContext2D, px: number, view: Bounds): void {
    ctx.textAlign = 'center';
    ctx.lineJoin = 'round';
    for (const f of this.floats) {
      const size = (f.big ? 24 : 18) * px;
      ctx.globalAlpha = Math.max(0, 1 - f.life / f.max);
      ctx.font = `800 ${size}px system-ui, sans-serif`;
      const width = ctx.measureText(f.text).width + 5 * px;
      const x = clampLabelX(f.x, width, view.x0, view.x1, 6 * px);
      const y = clampLabelY(f.y, size, view.y0, 4 * px);
      ctx.lineWidth = 5 * px;
      ctx.strokeStyle = P.textOutline;
      ctx.strokeText(f.text, x, y);
      ctx.fillStyle = P.text;
      ctx.fillText(f.text, x, y);
    }
    ctx.globalAlpha = 1;
  }
}
