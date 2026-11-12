// Per-frame drawing: cached backdrop, ambient layers, props, hero, bubbles, particles and overlays.
// Sim state is interpolated by `alpha` so 120/144 Hz screens stay smooth.
import { CONFIG } from '../config';
import type { Game } from '../game';
import type { Bubble, SimEvent } from '../sim/types';
import type { Sim } from '../sim/state';
import { drawAmbientBack, drawAmbientFront } from './ambient';
import { getBackdrop } from './backdrop';
import { bubbleSprite } from './bubbleSprite';
import { Fx } from './fx';
import { drawHero, kickOf, type HeroPose } from './hero';
import { drawBlock, drawBubbleShadow, drawLine, drawPickup, drawPlatform, drawPowerBadge } from './props';
import { THEME_ART, type ThemeArt } from './themes';
import { lerp } from './util';
import { applyWorld, type View } from './view';

export interface DrawOpts { reduced: boolean; assist: boolean; time: number; dt: number }

const { floorY } = CONFIG.world;

export class Renderer {
  readonly fx = new Fx();
  private lastSim: Sim | null = null;

  constructor(private readonly ctx: CanvasRenderingContext2D) {}

  private drawBubble(b: Bubble, a: number, k: number, assist: boolean): void {
    const ctx = this.ctx;
    const x = lerp(b.px, b.x, a), y = lerp(b.py, b.y, a);
    const r = CONFIG.bubble.radius[b.size] ?? 8;
    const sprite = bubbleSprite(b.size, k, assist);
    const sq = this.fx.reduced ? 0 : (this.fx.squash.get(b.id) ?? 0) / 0.16;
    const stretch = this.fx.reduced ? 0 : Math.min(0.1, Math.abs(b.vy) / 3800);
    const sy = 1 + stretch - 0.2 * sq;
    const sx = 1 - stretch * 0.6 + 0.18 * sq;
    ctx.save();
    ctx.translate(x, y + r);
    ctx.scale(sx, sy);
    ctx.drawImage(sprite.cv, -sprite.half, -r - sprite.half, sprite.half * 2, sprite.half * 2);
    ctx.restore();
  }

  private pose(sim: Sim, a: number, time: number): HeroPose {
    const p = sim.player;
    return {
      x: lerp(p.px, p.x, a), facing: p.facing, moving: p.moving && sim.status === 'play', t: time,
      aiming: sim.lines.length > 0 || p.shotAge < 0.3, kick: kickOf(p.shotAge),
      hurt: sim.status === 'lost', cheer: sim.status === 'cleared', shield: p.shield, blink: time % 3.4 < 0.12,
    };
  }

  private drawProps(sim: Sim, art: ThemeArt, a: number, time: number): void {
    const ctx = this.ctx;
    for (const p of sim.platforms) drawPlatform(ctx, p, art);
    for (const b of sim.blocks) if (b.alive) drawBlock(ctx, b, art, 0);
    for (const u of sim.pickups) drawPickup(ctx, u, lerp(u.px, u.x, a), lerp(u.py, u.y, a), time);
  }

  private drawStatus(sim: Sim, time: number): void {
    const ctx = this.ctx;
    let i = 0;
    const chip = (kind: 'double' | 'sticky' | 'slow' | 'shield', frac: number): void => {
      const x = 22 + i++ * 40, y = 36;
      drawPowerBadge(ctx, kind, x, y, 9, time);
      ctx.fillStyle = 'rgba(8,12,40,0.7)'; ctx.fillRect(x - 11, y + 12, 22, 4);
      ctx.fillStyle = '#fff'; ctx.fillRect(x - 10, y + 13, 20 * Math.max(0, Math.min(1, frac)), 2);
    };
    for (const k of ['double', 'sticky', 'slow'] as const) if (sim.power[k] > 0) chip(k, sim.power[k] / CONFIG.power.duration[k]);
    if (sim.player.shield) chip('shield', 1);
  }

  private drawPopups(): void {
    const ctx = this.ctx;
    ctx.font = '800 13px system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(8,12,40,0.85)'; ctx.lineJoin = 'round';
    for (const p of this.fx.popups) {
      if (!p.text) continue;
      ctx.globalAlpha = Math.min(1, p.life * 2.2);
      ctx.strokeText(p.text, p.x, p.y); ctx.fillStyle = p.color; ctx.fillText(p.text, p.x, p.y);
    }
    ctx.globalAlpha = 1;
  }

  private overlays(sim: Sim, v: View, time: number, reduced: boolean): void {
    const ctx = this.ctx;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    const W = v.pxW * v.dpr, H = v.pxH * v.dpr;
    if (!reduced && sim.status === 'play' && sim.started && sim.time <= 10 && !sim.demo) {
      const pulse = 0.14 + 0.1 * Math.sin(time * 7);
      const g = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.4, W / 2, H / 2, Math.max(W, H) * 0.75);
      g.addColorStop(0, 'rgba(255,60,60,0)'); g.addColorStop(1, `rgba(255,60,60,${pulse.toFixed(3)})`);
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    }
    if (this.fx.flash > 0) {
      ctx.globalAlpha = Math.min(0.5, this.fx.flash * 0.5);
      ctx.fillStyle = this.fx.flashColor; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1;
    }
  }

  draw(game: Game, v: View, o: DrawOpts, events: readonly SimEvent[]): void {
    const ctx = this.ctx;
    const sim = game.view;
    if (this.lastSim !== sim) { this.lastSim = sim; this.fx.reset(); }
    const theme = sim.stage.def.theme;
    const art = THEME_ART[theme];
    if (this.fx.reduced !== o.reduced) this.fx.setReduced(o.reduced);
    this.fx.handle(events, art);
    this.fx.update(o.dt);
    const a = game.phase === 'playing' || game.phase === 'title' ? game.alpha : 1;
    const shake = this.fx.shake;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.drawImage(getBackdrop(theme, v), 0, 0);
    applyWorld(ctx, v, shake ? (Math.sin(o.time * 91) * shake) : 0, shake ? Math.cos(o.time * 77) * shake : 0);
    drawAmbientBack(ctx, v, theme, o.time, o.reduced);
    this.drawProps(sim, art, a, o.time);
    const k = v.dpr * v.s;
    for (const b of sim.bubbles) drawBubbleShadow(ctx, lerp(b.px, b.x, a), lerp(b.py, b.y, a), CONFIG.bubble.radius[b.size] ?? 8);
    const blink = sim.started && sim.player.invuln > 0 && !sim.demo && Math.floor(o.time * 12) % 2 === 0;
    drawHero(ctx, this.pose(sim, a, o.time), floorY, blink ? 0.45 : 1);
    for (const l of sim.lines) drawLine(ctx, l, lerp(l.pTipY, l.tipY, a), o.time);
    for (const b of sim.bubbles) this.drawBubble(b, a, k, o.assist);
    this.fx.particles.draw(ctx);
    this.drawPopups();
    drawAmbientFront(ctx, v, theme, o.time, o.reduced);
    if (!sim.demo) this.drawStatus(sim, o.time);
    this.overlays(sim, v, o.time, o.reduced);
  }
}
