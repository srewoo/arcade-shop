// Cosmetic effects: impact ripples, fuzz/dust particles, floating popups, tier callouts, shake.
// Not part of the sim (own RNG). Reduced motion cuts particles to 40% and removes shake.
import { CONFIG } from '../config';
import { mulberry32 } from '../rng';
import { PAL } from './palette';

interface Ripple { x: number; y: number; age: number; sweet: boolean; ground: boolean }
interface Particle { x: number; y: number; vx: number; vy: number; age: number; life: number; size: number; dust: boolean }
interface Popup { x: number; y: number; age: number; text: string }

export class Effects {
  private ripples: Ripple[] = [];
  private parts: Particle[] = [];
  private popups: Popup[] = [];
  private callout: { text: string; age: number } | null = null;
  private shake = 0;
  private readonly rnd = mulberry32(0x7e51);
  factor = 1;

  get count(): number { return this.parts.length; }
  private get limit(): number { return Math.round(CONFIG.fx.maxParticles * this.factor); }

  clear(): void { this.ripples = []; this.parts = []; this.popups = []; this.callout = null; this.shake = 0; }

  hit(x: number, y: number, sweet: boolean, label: string): void {
    this.ripples.push({ x, y: y + CONFIG.ball.radius * 0.6, age: 0, sweet, ground: false });
    this.burst(x, y + CONFIG.ball.radius * 0.7, sweet ? 9 : 5, false);
    this.popups.push({ x, y: y - CONFIG.ball.radius - 4, age: 0, text: label });
  }

  land(x: number): void {
    const y = CONFIG.world.groundY;
    this.ripples.push({ x, y, age: 0, sweet: false, ground: true });
    this.burst(x, y, 18, true);
    this.shake = 1;
  }

  wall(x: number, y: number): void { this.burst(x, y, 4, false); }
  tier(text: string): void { this.callout = { text, age: 0 }; this.shake = Math.max(this.shake, 0.35); }

  private burst(x: number, y: number, count: number, dust: boolean): void {
    const n = Math.round(count * this.factor);
    for (let i = 0; i < n && this.parts.length < this.limit; i++) {
      const a = -Math.PI * (0.1 + this.rnd() * 0.8);
      const sp = 70 + this.rnd() * 200;
      this.parts.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, age: 0, life: 0.35 + this.rnd() * 0.45, size: 1.8 + this.rnd() * 2.6, dust });
    }
  }

  update(dt: number): void {
    for (const p of this.parts) { p.age += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 520 * dt; p.vx *= 1 - 1.5 * dt; }
    this.parts = this.parts.filter((p) => p.age < p.life);
    for (const r of this.ripples) r.age += dt;
    this.ripples = this.ripples.filter((r) => r.age < CONFIG.fx.rippleLife);
    for (const p of this.popups) p.age += dt;
    this.popups = this.popups.filter((p) => p.age < CONFIG.fx.popupLife);
    if (this.callout) { this.callout.age += dt; if (this.callout.age > CONFIG.fx.calloutLife) this.callout = null; }
    this.shake = Math.max(0, this.shake - dt * 3);
  }

  /** Screen-shake offset in logical px (0 when reduced). */
  shakeOffset(t: number): { x: number; y: number } {
    if (this.shake <= 0 || this.factor < 1) return { x: 0, y: 0 };
    const a = this.shake * 5;
    return { x: Math.sin(t * 90) * a, y: Math.cos(t * 77) * a };
  }

  drawGround(ctx: CanvasRenderingContext2D, assist: boolean): void {
    for (const r of this.ripples) {
      const k = r.age / CONFIG.fx.rippleLife;
      ctx.globalAlpha = (1 - k) * 0.9;
      ctx.strokeStyle = r.sweet ? PAL.sweet : PAL.ripple;
      ctx.lineWidth = r.sweet ? 4 * (1 - k) + 1 : 2.5 * (1 - k) + 0.8;
      ctx.setLineDash(assist && !r.sweet && !r.ground ? [6, 5] : []);
      const rad = 14 + k * (r.ground ? 90 : 56);
      ctx.beginPath(); ctx.ellipse(r.x, r.y, rad, rad * (r.ground ? 0.28 : 0.5), 0, 0, Math.PI * 2); ctx.stroke();
      if (r.sweet) { ctx.beginPath(); ctx.ellipse(r.x, r.y, rad * 0.62, rad * 0.31, 0, 0, Math.PI * 2); ctx.stroke(); }
    }
    ctx.setLineDash([]); ctx.globalAlpha = 1;
  }

  drawParticles(ctx: CanvasRenderingContext2D): void {
    for (const p of this.parts) {
      const t = p.age / p.life;
      ctx.globalAlpha = (1 - t) * (p.dust ? 0.7 : 0.95);
      ctx.fillStyle = p.dust ? '#e9efe4' : PAL.ballLight;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.size * (p.dust ? 1 + t : 1 - t * 0.4), 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  drawPopups(ctx: CanvasRenderingContext2D, animate: boolean): void {
    ctx.textAlign = 'center'; ctx.font = '800 22px ui-rounded, system-ui, sans-serif';
    for (const p of this.popups) {
      const k = p.age / CONFIG.fx.popupLife;
      ctx.globalAlpha = 1 - k * k;
      const y = p.y - (animate ? k * 36 : 10);
      ctx.lineWidth = 5; ctx.strokeStyle = 'rgba(10,25,40,0.85)'; ctx.strokeText(p.text, p.x, y);
      ctx.fillStyle = '#fff'; ctx.fillText(p.text, p.x, y);
    }
    ctx.globalAlpha = 1;
  }

  /** Big tier callout near the top of the world. */
  drawCallout(ctx: CanvasRenderingContext2D, cx: number, animate: boolean): void {
    const c = this.callout;
    if (!c) return;
    const k = c.age / CONFIG.fx.calloutLife;
    const pop = animate ? Math.min(1, c.age / 0.18) : 1;
    const scale = animate ? 0.6 + 0.4 * (1 - (1 - pop) ** 3) + (k > 0.8 ? 0 : 0.0) : 1;
    ctx.save();
    ctx.globalAlpha = k < 0.75 ? 1 : 1 - (k - 0.75) * 4;
    ctx.translate(cx, 150); ctx.scale(scale, scale);
    ctx.textAlign = 'center'; ctx.font = '900 54px ui-rounded, system-ui, sans-serif';
    ctx.lineJoin = 'round'; ctx.lineWidth = 12; ctx.strokeStyle = 'rgba(10,30,15,0.9)'; ctx.strokeText(c.text, 0, 0);
    ctx.fillStyle = PAL.callout; ctx.fillText(c.text, 0, 0);
    ctx.restore();
  }
}
