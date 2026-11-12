// Render-only effects: particles, shake, flashes, popups, banner. Never touches the simulation.
import { CONFIG } from '../config';
import { PALETTE } from '../palette';

interface Particle { x: number; y: number; vx: number; vy: number; life: number; max: number; color: string; size: number; rot: number; spin: number; spark: boolean }
export interface Ring { x: number; y: number; life: number; max: number; color: string }
export interface Popup { x: number; y: number; text: string; color: string; life: number; max: number }
export interface Flash { x: number; y: number; life: number }
export interface Banner { text: string; color: string; life: number }
export interface Fx {
  particles: Particle[];
  popups: Popup[];
  flashes: Flash[];
  rings: Ring[];
  banner: Banner | null;
  shake: number;
  flash: number;
  squash: number;
  reduced: boolean;
  burst(x: number, y: number, color: string, count?: number): void;
  popup(x: number, y: number, text: string, color?: string): void;
  ring(x: number, y: number, color: string): void;
  hitFlash(x: number, y: number): void;
  announce(text: string, color?: string): void;
  confetti(w: number, h: number): void;
  kick(): void;
  nudge(): void;
  squashPaddle(): void;
  update(dt: number): void;
  clear(): void;
}

export function createFx(): Fx {
  const fx: Fx = {
    particles: [], popups: [], flashes: [], rings: [], banner: null, shake: 0, flash: 0, squash: 0, reduced: false,
    burst(x, y, color, count = CONFIG.fx.particles) {
      const n = Math.round(count * (fx.reduced ? CONFIG.fx.reducedFactor : 1));
      for (let i = 0; i < n; i++) {
        const a = Math.random() * Math.PI * 2;
        const sp = 70 + Math.random() * 220;
        const life = CONFIG.fx.particleSec * (0.6 + Math.random() * 0.6);
        fx.particles.push({
          x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 50, life, max: life, color,
          size: 3 + Math.random() * 4, rot: Math.random() * 6, spin: (Math.random() - 0.5) * 14, spark: i % 2 === 0,
        });
      }
      if (fx.particles.length > 400) fx.particles.splice(0, fx.particles.length - 400);
    },
    popup(x, y, text, color = PALETTE.text) {
      const life = fx.reduced ? CONFIG.fx.popupSec * 0.7 : CONFIG.fx.popupSec;
      fx.popups.push({ x, y, text, color, life, max: life });
      if (fx.popups.length > 24) fx.popups.shift();
    },
    ring(x, y, color) {
      if (fx.reduced) return;
      fx.rings.push({ x, y, life: 0.35, max: 0.35, color });
      if (fx.rings.length > 20) fx.rings.shift();
    },
    hitFlash(x, y) {
      if (fx.reduced) return;
      fx.flashes.push({ x, y, life: CONFIG.fx.hitFlashSec });
    },
    announce(text, color = PALETTE.text) {
      fx.banner = { text, color, life: CONFIG.fx.bannerSec };
    },
    confetti(w, h) {
      if (fx.reduced) return;
      for (let i = 0; i < CONFIG.fx.confetti; i++) {
        const color = PALETTE.confetti[i % PALETTE.confetti.length] as string;
        fx.burst(Math.random() * w, h * 0.3, color, 1);
      }
    },
    kick() {
      if (fx.reduced) return;
      fx.shake = CONFIG.fx.shakeMs / 1000;
      fx.flash = CONFIG.fx.flashSec;
    },
    nudge() {
      if (fx.reduced) return;
      fx.shake = Math.max(fx.shake, CONFIG.fx.shakeMs / 4000);
    },
    squashPaddle() {
      if (!fx.reduced) fx.squash = CONFIG.fx.squashSec;
    },
    update(dt) {
      fx.shake = Math.max(0, fx.shake - dt);
      fx.flash = Math.max(0, fx.flash - dt);
      fx.squash = Math.max(0, fx.squash - dt);
      if (fx.banner && (fx.banner.life -= dt) <= 0) fx.banner = null;
      for (const p of fx.particles) {
        p.life -= dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += 520 * dt;
        p.rot += p.spin * dt;
      }
      fx.particles = fx.particles.filter((p) => p.life > 0);
      for (const p of fx.popups) {
        p.life -= dt;
        if (!fx.reduced) p.y -= 46 * dt;
      }
      fx.popups = fx.popups.filter((p) => p.life > 0);
      for (const r of fx.rings) r.life -= dt;
      fx.rings = fx.rings.filter((r) => r.life > 0);
      for (const f of fx.flashes) f.life -= dt;
      fx.flashes = fx.flashes.filter((f) => f.life > 0);
    },
    clear() {
      fx.particles = [];
      fx.popups = [];
      fx.flashes = [];
      fx.rings = [];
      fx.banner = null;
      fx.shake = 0;
      fx.flash = 0;
      fx.squash = 0;
    },
  };
  return fx;
}
