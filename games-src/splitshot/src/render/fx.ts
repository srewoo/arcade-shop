// Turns sim events into visual effects: particles, floating score text, shake, flashes, squash.
import { CONFIG } from '../config';
import { POWER_LABEL } from '../strings';
import type { SimEvent } from '../sim/types';
import { Kind, Particles } from './particles';
import { BUBBLE_COLORS, POWER_COLORS, type ThemeArt } from './themes';

export interface Popup { text: string; x: number; y: number; life: number; color: string }
const POPUP_CAP = 14;

export class Fx {
  readonly particles = new Particles(1);
  readonly popups: Popup[] = [];
  readonly squash = new Map<number, number>();
  shake = 0;
  flash = 0;
  flashColor = '#ff3b3b';
  reduced = false;
  private seed = 1;

  private rnd(): number {
    this.seed = (Math.imul(this.seed, 1664525) + 1013904223) >>> 0;
    return this.seed / 4294967296;
  }

  setReduced(on: boolean): void {
    this.reduced = on;
    this.particles.setFactor(on ? CONFIG.fx.reducedFactor : 1);
  }

  private burst(x: number, y: number, n: number, color: string, speed: number, kind: Kind = Kind.Shard): void {
    for (let i = 0; i < n; i++) {
      const a = this.rnd() * Math.PI * 2;
      const v = speed * (0.4 + this.rnd() * 0.8);
      this.particles.spawn(kind, x, y, Math.cos(a) * v, Math.sin(a) * v - speed * 0.25, 0.45 + this.rnd() * 0.5, 1.4 + this.rnd() * 2.2, color);
    }
  }

  private ring(x: number, y: number, r0: number, grow: number, color: string): void {
    this.particles.spawn(Kind.Ring, x, y, 0, 0, 0.4, r0, color, grow);
  }

  private popup(text: string, x: number, y: number, color: string): void {
    if (this.popups.length >= POPUP_CAP) this.popups.shift();
    this.popups.push({ text, x, y, life: 0.9, color });
  }

  private onPop(e: Extract<SimEvent, { type: 'hitLine' }>): void {
    const c = BUBBLE_COLORS[e.size] ?? BUBBLE_COLORS[0]!;
    this.burst(e.x, e.y, 6 + e.size * 4, c.body, 120 + e.size * 30);
    this.burst(e.x, e.y, 4 + e.size * 2, c.light, 90, Kind.Spark);
    this.ring(e.x, e.y, CONFIG.bubble.radius[e.size] ?? 10, 70 + e.size * 20, c.light);
    this.popup(`+${e.points}`, e.x, e.y - 8, '#ffffff');
    if (!this.reduced && e.size >= 2) this.shake = Math.max(this.shake, CONFIG.fx.shake * 0.45);
  }

  handle(events: readonly SimEvent[], art: ThemeArt): void {
    for (const e of events) {
      switch (e.type) {
        case 'hitLine': this.onPop(e); break;
        case 'fire': this.burst(e.x, CONFIG.world.floorY - 30, 4, '#ffeab0', 50, Kind.Spark); break;
        case 'bounce':
          this.squash.set(e.id, 0.16);
          if (e.size >= 1) for (let i = 0; i < 2 + e.size; i++) this.particles.spawn(Kind.Mote, e.x + (this.rnd() - 0.5) * 16, CONFIG.world.floorY - 2, (this.rnd() - 0.5) * 50, -14 - this.rnd() * 22, 0.5, 1.4 + this.rnd() * 1.6, art.dust);
          break;
        case 'block': this.burst(e.x, e.y, e.broke ? 16 : 6, e.broke ? art.blockHi : art.block, 100); this.popup(e.broke ? '+60' : '', e.x, e.y - 12, '#ffe9a8'); break;
        case 'drop': this.burst(e.x, e.y, 6, POWER_COLORS[e.kind], 60, Kind.Spark); break;
        case 'collect':
          this.burst(e.x, e.y, 12, POWER_COLORS[e.kind], 110, Kind.Spark);
          this.ring(e.x, e.y, 8, 90, POWER_COLORS[e.kind]);
          this.popup(POWER_LABEL[e.kind], e.x, e.y - 14, POWER_COLORS[e.kind]);
          break;
        case 'shieldBreak': this.ring(e.x, e.y, 14, 120, '#ffd45a'); this.burst(e.x, e.y, 14, '#ffd45a', 130); this.flashWith('#ffd45a', 0.35); break;
        case 'hit': this.burst(e.x, e.y, 18, '#ffc83a', 150); this.ring(e.x, e.y, 10, 130, '#ff6b6b'); this.flashWith('#ff3b3b', 0.55); if (!this.reduced) this.shake = CONFIG.fx.shake; break;
        case 'clear': this.confetti(); break;
        case 'timeout': this.flashWith('#9bb0cc', 0.4); break;
        default: break;
      }
    }
  }

  private flashWith(color: string, amount: number): void {
    if (this.reduced) return;
    this.flashColor = color;
    this.flash = Math.max(this.flash, amount);
  }

  private confetti(): void {
    const cols = ['#ff4f94', '#ffb32e', '#4be39b', '#4fc3ff', '#fff0c4'];
    for (let i = 0; i < 70; i++) {
      this.particles.spawn(Kind.Confetti, 20 + this.rnd() * 600, 10 + this.rnd() * 30, (this.rnd() - 0.5) * 80, 20 + this.rnd() * 60, 1.8 + this.rnd(), 2 + this.rnd() * 2, cols[i % cols.length] as string);
    }
  }

  update(dt: number): void {
    this.particles.update(dt);
    this.shake = Math.max(0, this.shake - dt * 28);
    this.flash = Math.max(0, this.flash - dt * 1.8);
    for (const [id, t] of this.squash) { if (t <= dt) this.squash.delete(id); else this.squash.set(id, t - dt); }
    for (let i = this.popups.length - 1; i >= 0; i--) {
      const p = this.popups[i] as Popup;
      p.life -= dt; p.y -= 22 * dt;
      if (p.life <= 0) this.popups.splice(i, 1);
    }
  }

  reset(): void { this.particles.clear(); this.popups.length = 0; this.squash.clear(); this.shake = 0; this.flash = 0; }
}
