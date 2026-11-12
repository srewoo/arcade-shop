// Particles, banners, screen shake, row flashes, lock flashes and edge pulses. Visual only.
import { feel } from '../config/feel';
import type { MotionProfile } from './motion';
import { stoneOf } from './palette';

interface Shard { x: number; y: number; vx: number; vy: number; rot: number; vr: number; life: number; max: number; size: number; color: string }
interface Banner { text: string; sub: string; age: number }
interface Flash { y: number; h: number; age: number; max: number; outline: boolean }
interface LockFlash { x: number; y: number; size: number; age: number }

/** Remove dead items in place (swap-remove): no per-frame array allocation. */
function compact<T>(list: T[], alive: (t: T) => boolean): void {
  for (let i = list.length - 1; i >= 0; i--) {
    if (alive(list[i] as T)) continue;
    list[i] = list[list.length - 1] as T;
    list.pop();
  }
}

export class Effects {
  private shards: Shard[] = [];
  private banners: Banner[] = [];
  private flashes: Flash[] = [];
  private lockFlashes: LockFlash[] = [];
  private pulseAge = Infinity;
  private flashClock = Infinity;
  shake = 0;
  assist = false;
  profile: MotionProfile = { shake: true, flash: 'full', particleScale: 1, tweens: true };

  get shardCount(): number {
    return this.shards.length;
  }

  burst(x: number, y: number, idx: number, count: number, power: number): void {
    const n = Math.round(count * this.profile.particleScale);
    if (n <= 0) return;
    const color = stoneOf(idx, this.assist).glow;
    for (let i = 0; i < n && this.shards.length < feel.maxShards; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = (0.4 + Math.random()) * power;
      const life = feel.shardLife.min + Math.random() * feel.shardLife.spread;
      this.shards.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - power * 0.4, rot: Math.random() * 6, vr: (Math.random() - 0.5) * 12, life, max: life, size: 2 + Math.random() * 4, color });
    }
  }

  /** Flash the cleared rows. At most one luminance flash per `flashMinGapSeconds`. */
  flashRows(rowsY: readonly number[], h: number): void {
    const mode = this.profile.flash;
    if (mode === 'off' || rowsY.length === 0 || this.flashClock < feel.flashMinGapSeconds) return;
    this.flashClock = 0;
    const max = mode === 'outline' ? feel.softFlashSeconds : feel.flashSeconds;
    for (const y of rowsY) this.flashes.push({ y, h, age: 0, max, outline: mode === 'outline' });
  }

  lockFlash(x: number, y: number, size: number): void {
    if (this.profile.flash !== 'full') return;
    this.lockFlashes.push({ x, y, size, age: 0 });
  }

  /** Rising edge pulse for garbage. Skipped when tweens are off. */
  pulse(): void {
    if (this.profile.tweens) this.pulseAge = 0;
  }

  banner(text: string, sub = ''): void {
    this.banners.push({ text, sub, age: 0 });
    if (this.banners.length > feel.maxBanners) this.banners.shift();
  }

  kick(amount: number): void {
    if (this.profile.shake) this.shake = Math.max(this.shake, amount);
  }

  update(dt: number, cell: number): void {
    for (const s of this.shards) {
      s.life -= dt;
      s.vy += cell * 22 * dt;
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.rot += s.vr * dt;
    }
    compact(this.shards, (s) => s.life > 0);
    for (const b of this.banners) b.age += dt;
    compact(this.banners, (b) => b.age < feel.bannerSeconds);
    for (const f of this.flashes) f.age += dt;
    compact(this.flashes, (f) => f.age < f.max);
    for (const f of this.lockFlashes) f.age += dt;
    compact(this.lockFlashes, (f) => f.age < feel.lockFlashSeconds);
    this.pulseAge += dt;
    this.flashClock += dt;
    this.shake = Math.max(0, this.shake - dt * feel.shakeDecayPerSecond);
  }

  shakeOffset(): [number, number] {
    if (this.shake <= 0) return [0, 0];
    return [(Math.random() - 0.5) * this.shake, (Math.random() - 0.5) * this.shake];
  }

  drawFlashes(c: CanvasRenderingContext2D, x: number, w: number): void {
    for (const f of this.flashes) {
      const k = 1 - f.age / f.max;
      if (f.outline) {
        c.strokeStyle = `rgba(255,255,240,${0.9 * k})`;
        c.lineWidth = 2;
        c.strokeRect(x + 1, f.y + 1, w - 2, f.h - 2);
      } else {
        c.fillStyle = `rgba(255,255,240,${feel.flashAlpha * k})`;
        c.fillRect(x, f.y, w, f.h);
      }
    }
    for (const f of this.lockFlashes) {
      c.fillStyle = `rgba(255,255,255,${0.55 * (1 - f.age / feel.lockFlashSeconds)})`;
      c.fillRect(f.x, f.y, f.size, f.size);
    }
  }

  /** Brief bright edge on the well after a garbage row rises. */
  drawPulse(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, cell: number): void {
    if (this.pulseAge >= feel.garbagePulseSeconds) return;
    const k = 1 - this.pulseAge / feel.garbagePulseSeconds;
    c.save();
    c.strokeStyle = `rgba(255,214,150,${0.8 * k})`;
    c.lineWidth = Math.max(2, cell * 0.2) * k + 1;
    c.strokeRect(x, y, w, h);
    c.fillStyle = `rgba(255,214,150,${0.25 * k})`;
    c.fillRect(x, y + h - cell * 1.2 * (1 - k * 0.5), w, cell * 1.2);
    c.restore();
  }

  drawShards(c: CanvasRenderingContext2D): void {
    if (this.shards.length === 0) return;
    c.save();
    c.globalCompositeOperation = 'lighter';
    for (const s of this.shards) {
      const a = Math.max(0, s.life / s.max);
      c.globalAlpha = a;
      c.fillStyle = s.color;
      c.save();
      c.translate(s.x, s.y);
      c.rotate(s.rot);
      c.beginPath();
      c.moveTo(0, -s.size);
      c.lineTo(s.size * 0.7, s.size * 0.6);
      c.lineTo(-s.size * 0.7, s.size * 0.6);
      c.closePath();
      c.fill();
      c.globalAlpha = a * 0.25;
      c.beginPath();
      c.arc(0, 0, s.size * 2.2, 0, Math.PI * 2);
      c.fill();
      c.restore();
    }
    c.restore();
  }

  drawBanners(c: CanvasRenderingContext2D, cx: number, y: number, cell: number): void {
    if (this.banners.length === 0) return;
    const tweens = this.profile.tweens;
    c.save();
    c.textAlign = 'center';
    let offset = 0;
    this.banners.forEach((b) => {
      const k = b.age / feel.bannerSeconds;
      const pop = tweens ? 1 + Math.max(0, 0.3 - b.age) * 1.5 : 1;
      c.globalAlpha = k < 0.7 ? 1 : 1 - (k - 0.7) / 0.3;
      c.fillStyle = '#fff6d8';
      c.shadowColor = 'rgba(255,220,140,0.9)';
      c.shadowBlur = 12;
      c.font = `700 ${Math.max(12, Math.round(cell * 0.85 * pop))}px ui-rounded, system-ui, sans-serif`;
      const yy = y + offset - (tweens ? k * cell : 0);
      offset += cell * (b.sub ? 1.9 : 1.3);
      c.fillText(b.text, cx, yy);
      if (b.sub) {
        c.font = `600 ${Math.max(12, Math.round(cell * 0.55))}px ui-rounded, system-ui, sans-serif`;
        c.fillText(b.sub, cx, yy + cell * 0.7);
      }
    });
    c.restore();
  }
}
