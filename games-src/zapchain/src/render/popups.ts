// Score pop-ups, expanding shock rings, bomb beams and the vanishing "ghost" discs of a zap.
// All pooled and updated by real frame time.
import { CONFIG } from '../config';
import type { Kind } from '../model/types';
import { DISC, SCENE } from './palette';

interface Popup { text: string; x: number; y: number; t: number; life: number; size: number; colour: string; live: boolean }
interface Ring { x: number; y: number; t: number; life: number; r: number; colour: string; live: boolean }
interface Beam { row: number; t: number; life: number; live: boolean }
export interface Ghost { x: number; y: number; kind: Kind; t: number; delay: number; life: number; live: boolean; popped: boolean }

export class PopupLayer {
  private readonly popups: Popup[] = Array.from({ length: CONFIG.fx.maxPopups }, () => ({ text: '', x: 0, y: 0, t: 0, life: 1, size: 1, colour: '#fff', live: false }));
  private readonly rings: Ring[] = Array.from({ length: 8 }, () => ({ x: 0, y: 0, t: 0, life: 1, r: 1, colour: '#fff', live: false }));
  private readonly beams: Beam[] = Array.from({ length: 4 }, () => ({ row: 0, t: 0, life: 1, live: false }));
  readonly ghosts: Ghost[] = Array.from({ length: 170 }, () => ({ x: 0, y: 0, kind: 1 as Kind, t: 0, delay: 0, life: 0.3, live: false, popped: false }));
  /** Called once per ghost at the moment it pops (to burst particles). */
  onPop: ((g: Ghost) => void) | null = null;
  private gi = 0;

  get activeGhosts(): number { return this.ghosts.reduce((n, g) => n + (g.live ? 1 : 0), 0); }

  popup(text: string, x: number, y: number, size: number, colour: string, life = 1): void {
    const p = this.popups.find((q) => !q.live) ?? this.popups.reduce((a, b) => (a.t > b.t ? a : b));
    Object.assign(p, { text, x, y, t: 0, life, size, colour, live: true });
  }

  ring(x: number, y: number, r: number, colour: string): void {
    const q = this.rings.find((g) => !g.live) ?? (this.rings[0] as Ring);
    Object.assign(q, { x, y, t: 0, life: 0.5, r, colour, live: true });
  }

  beam(row: number): void {
    const b = this.beams.find((g) => !g.live) ?? (this.beams[0] as Beam);
    Object.assign(b, { row, t: 0, life: 0.45, live: true });
  }

  ghost(x: number, y: number, kind: Kind, delay: number): void {
    const g = this.ghosts[this.gi] as Ghost;
    this.gi = (this.gi + 1) % this.ghosts.length;
    Object.assign(g, { x, y, kind, t: 0, delay, life: 0.26, live: true, popped: false });
  }

  update(dt: number): void {
    for (const p of this.popups) if (p.live && (p.t += dt) >= p.life) p.live = false;
    for (const r of this.rings) if (r.live && (r.t += dt) >= r.life) r.live = false;
    for (const b of this.beams) if (b.live && (b.t += dt) >= b.life) b.live = false;
    for (const g of this.ghosts) {
      if (!g.live) continue;
      g.t += dt;
      if (!g.popped && g.t >= g.delay) { g.popped = true; this.onPop?.(g); }
      if (g.t >= g.delay + g.life) g.live = false;
    }
  }

  drawGlow(c: CanvasRenderingContext2D, ox: number, oy: number, cs: number, gridW: number): void {
    c.save();
    c.globalCompositeOperation = 'lighter';
    for (const r of this.rings) {
      if (!r.live) continue;
      const k = r.t / r.life;
      c.globalAlpha = (1 - k) * 0.8;
      c.strokeStyle = r.colour; c.lineWidth = cs * 0.14 * (1 - k) + 1;
      c.beginPath(); c.arc(ox + (r.x + 0.5) * cs, oy + (r.y + 0.5) * cs, cs * (0.4 + r.r * k), 0, Math.PI * 2); c.stroke();
    }
    for (const b of this.beams) {
      if (!b.live) continue;
      const k = b.t / b.life;
      const y = oy + (b.row + 0.5) * cs, h = cs * (0.95 - 0.5 * k);
      const g = c.createLinearGradient(0, y - h / 2, 0, y + h / 2);
      g.addColorStop(0, 'rgba(255,194,71,0)'); g.addColorStop(0.5, `rgba(255,236,170,${0.95 * (1 - k)})`); g.addColorStop(1, 'rgba(255,194,71,0)');
      c.globalAlpha = 1; c.fillStyle = g; c.fillRect(ox - cs * 0.3, y - h / 2, gridW + cs * 0.6, h);
    }
    c.restore();
  }

  drawText(c: CanvasRenderingContext2D, ox: number, oy: number, cs: number): void {
    c.save();
    c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineJoin = 'round';
    for (const p of this.popups) {
      if (!p.live) continue;
      const k = p.t / p.life;
      const pop = k < 0.18 ? 0.55 + (k / 0.18) * 0.65 + Math.sin((k / 0.18) * Math.PI) * 0.18 : 1.2 - (k - 0.18) * 0.2;
      c.globalAlpha = k > 0.7 ? Math.max(0, 1 - (k - 0.7) / 0.3) : 1;
      c.font = `800 ${Math.round(cs * 0.5 * p.size * pop)}px ui-rounded, 'SF Pro Rounded', system-ui, sans-serif`;
      const x = ox + (p.x + 0.5) * cs, y = oy + (p.y + 0.5) * cs - k * cs * 1.1;
      c.lineWidth = Math.max(3, cs * 0.14 * p.size); c.strokeStyle = 'rgba(14,8,40,0.88)'; c.strokeText(p.text, x, y);
      c.fillStyle = p.colour; c.fillText(p.text, x, y);
    }
    c.restore();
  }

  /** The vanishing discs: held in place until their chain delay, then flash white and shrink. */
  drawGhosts(c: CanvasRenderingContext2D, ox: number, oy: number, cs: number, sprite: (k: Kind) => HTMLCanvasElement, halo: HTMLCanvasElement): void {
    for (const g of this.ghosts) {
      if (!g.live) continue;
      const k = (g.t - g.delay) / g.life;
      const x = ox + g.x * cs, y = oy + g.y * cs;
      if (k < 0) { c.drawImage(sprite(g.kind), x, y, cs, cs); continue; }
      const s = 1 + 0.18 * Math.sin(k * Math.PI) - k * 0.85;
      if (s <= 0.02) continue;
      c.save();
      c.translate(x + cs / 2, y + cs / 2); c.scale(s, s);
      c.globalAlpha = 1 - k * 0.7;
      c.drawImage(sprite(g.kind), -cs / 2, -cs / 2, cs, cs);
      c.globalCompositeOperation = 'lighter';
      c.globalAlpha = Math.min(1, 1.5 - k * 1.5);
      c.drawImage(sprite(g.kind), -cs / 2, -cs / 2, cs, cs);
      c.globalAlpha = (1 - k) * 0.8;
      c.drawImage(halo, -cs, -cs, cs * 2, cs * 2);
      c.restore();
    }
  }
}

export const popupColour = (kind: Kind | 'bomb'): string => (kind === 'bomb' ? SCENE.bolt : DISC[kind].light);
