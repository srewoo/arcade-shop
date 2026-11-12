// Cosmetic particles: drips, splashes, stars, sparkles and floating score text.
import { FEEL } from './config/feel';
import { FONT } from './textStyle';

type Ctx = CanvasRenderingContext2D;

type Kind = 'drip' | 'drop' | 'star' | 'spark' | 'text';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  kind: Kind;
  color: string;
  size: number;
  text?: string;
}

const CAP = 260;
const POP = FEEL.popupScale;

export class Particles {
  private list: Particle[] = [];
  /** Reduced motion: fewer, calmer particles. */
  calm = false;

  private add(p: Particle): void {
    if (this.list.length < CAP) this.list.push(p);
  }

  /** Reduce motion cuts counts to the configured fraction (never to zero). */
  private count(n: number): number {
    return this.calm ? Math.max(1, Math.round(n * FEEL.calmParticles)) : n;
  }

  get size(): number {
    return this.list.length;
  }

  drip(x: number, y: number): void {
    this.add({ x: x + (Math.random() - 0.5) * 8, y, vx: 0, vy: 14 + Math.random() * 10,
      life: 0.6, max: 0.6, kind: 'drip', color: '#7cc4ff', size: 1.6 });
  }

  splash(x: number, y: number, color = '#8fd0ff'): void {
    const n = this.count(14);
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + Math.random() * 0.4;
      const s = 22 + Math.random() * 40;
      this.add({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 12, life: 0.55, max: 0.55,
        kind: 'drop', color, size: 1.8 });
    }
  }

  stars(x: number, y: number): void {
    const n = this.count(8);
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      this.add({ x, y, vx: Math.cos(a) * 30, vy: Math.sin(a) * 30, life: 0.9, max: 0.9,
        kind: 'star', color: '#ffe066', size: 3 });
    }
  }

  sparkle(w: number, h: number): void {
    const n = this.count(40);
    for (let i = 0; i < n; i++) {
      this.add({ x: Math.random() * w, y: Math.random() * h, vx: 0, vy: -8 - Math.random() * 12,
        life: 1.2, max: 1.2, kind: 'spark', color: ['#fff3b0', '#ffd1dc', '#bde7ff'][i % 3] as string, size: 2 });
    }
  }

  popup(x: number, y: number, text: string, color = '#fff6c0'): void {
    this.add({ x, y, vx: 0, vy: -16, life: 1, max: 1, kind: 'text', color, size: 12, text });
  }

  clear(): void {
    this.list = [];
  }

  update(dt: number): void {
    const list = this.list;
    let keep = 0;
    for (let i = 0; i < list.length; i++) {
      const p = list[i] as Particle;
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.kind === 'drop') p.vy += 120 * dt;
      if (p.life > 0) list[keep++] = p;
    }
    list.length = keep; // compact in place: no per-tick array allocation
  }

  draw(ctx: Ctx): void {
    for (let i = 0; i < this.list.length; i++) {
      const p = this.list[i] as Particle;
      const a = Math.max(0, p.life / p.max);
      ctx.globalAlpha = a;
      ctx.fillStyle = p.color;
      if (p.kind === 'text' && p.text) {
        const age = p.max - p.life;
        const pop = this.calm ? 1 : 1 + (POP.from - 1) * Math.max(0, 1 - age / POP.popSec);
        ctx.font = `bold ${p.size * pop}px ${FONT}`;
        ctx.textAlign = 'center';
        ctx.strokeStyle = '#2a1608';
        ctx.lineWidth = 3;
        ctx.strokeText(p.text, p.x, p.y);
        ctx.fillText(p.text, p.x, p.y);
      } else if (p.kind === 'star') {
        ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
  }
}
