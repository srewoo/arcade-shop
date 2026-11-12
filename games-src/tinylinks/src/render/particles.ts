// A fixed pool of particles (no per-frame allocation). Heights (z) fake a top-down arc.
import { CONFIG } from '../config';

type Kind = 'dust' | 'confetti' | 'drop' | 'sand' | 'ring';
interface P { on: boolean; kind: Kind; x: number; y: number; z: number; vx: number; vy: number; vz: number; life: number; max: number; size: number; color: string; spin: number }

export class Particles {
  private readonly pool: P[] = Array.from({ length: CONFIG.fx.maxParticles }, () => ({ on: false, kind: 'dust', x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, life: 0, max: 1, size: 1, color: '#fff', spin: 0 }));
  private seed = 1;
  count = 0;

  private rand(): number {
    this.seed = (this.seed * 1664525 + 1013904223) >>> 0;
    return this.seed / 4294967296;
  }

  private spawn(kind: Kind, x: number, y: number, o: Partial<P>): void {
    const p = this.pool.find((q) => !q.on);
    if (!p) return;
    Object.assign(p, { on: true, kind, x, y, z: 0, vx: 0, vy: 0, vz: 0, life: 0, max: 0.6, size: 2, color: '#fff', spin: 0 }, o);
  }

  burst(kind: Kind, x: number, y: number, n: number, speed: number, colors: readonly string[], reduced: boolean, o: Partial<P> = {}): void {
    const count = Math.max(reduced ? 1 : 2, Math.round(n * (reduced ? CONFIG.fx.reducedFactor : 1)));
    for (let i = 0; i < count; i++) {
      const a = this.rand() * Math.PI * 2;
      const s = speed * (0.35 + this.rand() * 0.65);
      this.spawn(kind, x, y, {
        vx: Math.cos(a) * s, vy: Math.sin(a) * s, vz: 40 + this.rand() * 90, max: 0.5 + this.rand() * 0.7,
        size: 1.8 + this.rand() * 2.4, color: colors[Math.floor(this.rand() * colors.length)] as string, spin: this.rand() * 6, ...o,
      });
    }
  }

  ring(x: number, y: number, color: string, lag = 0): void {
    this.spawn('ring', x, y, { max: 0.8, size: 3, color, life: -lag });
  }

  update(dt: number): void {
    let n = 0;
    for (const p of this.pool) {
      if (!p.on) continue;
      p.life += dt;
      if (p.life >= p.max) { p.on = false; continue; }
      n++;
      p.x += p.vx * dt; p.y += p.vy * dt;
      if (p.kind === 'ring') continue;
      p.vx *= p.kind === 'dust' ? 0.9 : 0.985; p.vy *= p.kind === 'dust' ? 0.9 : 0.985;
      if (p.kind !== 'dust') { p.vz -= 260 * dt; p.z = Math.max(0, p.z + p.vz * dt); if (p.z === 0) p.vz = Math.abs(p.vz) * 0.3; }
    }
    this.count = n;
  }

  clear(): void { for (const p of this.pool) p.on = false; this.count = 0; }

  draw(ctx: CanvasRenderingContext2D): void {
    for (const p of this.pool) {
      if (!p.on) continue;
      const k = p.life / p.max;
      ctx.globalAlpha = Math.max(0, 1 - k * k);
      if (p.kind === 'ring') {
        if (p.life < 0) continue;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.size + k * 34, 0, Math.PI * 2);
        ctx.lineWidth = 2.6 * (1 - k) + 0.4; ctx.strokeStyle = p.color; ctx.stroke();
        continue;
      }
      const y = p.y - p.z * 0.35;
      if (p.kind === 'dust') {
        ctx.beginPath(); ctx.arc(p.x, p.y, p.size * (1 + k * 2.2), 0, Math.PI * 2);
        ctx.fillStyle = p.color; ctx.fill();
      } else if (p.kind === 'confetti') {
        ctx.save(); ctx.translate(p.x, y); ctx.rotate(p.spin + p.life * 9);
        ctx.fillStyle = p.color; ctx.fillRect(-p.size, -p.size * 0.5, p.size * 2, p.size);
        ctx.restore();
      } else {
        ctx.beginPath(); ctx.arc(p.x, y, p.size * 0.8, 0, Math.PI * 2);
        ctx.fillStyle = p.color; ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
  }
}
