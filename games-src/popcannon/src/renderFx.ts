// Effects layer: fallers, particles, pops, ball trail, popups, banners and highlights.
import { lerp } from './clock';
import { TUNING } from './config';
import { H, R, ROW_H, SHOOTER, TOP_Y, W } from './hex';
import { colorHex } from './palette';
import { DANGER_Y, NEXT_POS, RenderOpts } from './renderTypes';
import { drawSprite } from './sprites';
import { Game } from './state';

function ballTrail(ctx: CanvasRenderingContext2D, g: Game): void {
  const t = g.fx.trail;
  if (g.reduced || !g.flying || t.length < 2) return;
  const color = g.flying.kind === 'normal' ? colorHex(g.flying) : '#ffffff';
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.fillStyle = color;
  for (let i = 0; i < t.length - 1; i++) {
    const k = (i + 1) / t.length;
    const p = t[i] as { x: number; y: number };
    ctx.globalAlpha = k * 0.3;
    ctx.beginPath();
    ctx.arc(p.x, p.y, R * 0.8 * k, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = k * 0.5;
    ctx.beginPath();
    ctx.arc(p.x, p.y, R * 0.3 * k, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

/** Pop shockwave (tinted ring) and glass shards that spin outward. */
function popRing(ctx: CanvasRenderingContext2D, p: { x: number; y: number; b: Game['cur']; life: number; max: number }): void {
  const k = p.life / p.max;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.globalAlpha = Math.max(0, k) * 0.8;
  ctx.lineWidth = 1 + 3 * k;
  ctx.strokeStyle = p.b && p.b.kind === 'normal' ? colorHex(p.b) : '#ffffff';
  ctx.beginPath();
  ctx.arc(p.x, p.y, R * (1 + 1.2 * (1 - k)), 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function shards(ctx: CanvasRenderingContext2D, g: Game, a: number): void {
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (const p of g.fx.particles) {
    const k = Math.max(0, p.life / p.max);
    const x = lerp(p.px, p.x, a);
    const y = lerp(p.py, p.y, a);
    const ang = Math.atan2(p.vy, p.vx);
    const len = p.size * 3.2 * (0.5 + k * 0.5);
    ctx.globalAlpha = k;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.moveTo(x + Math.cos(ang) * len, y + Math.sin(ang) * len);
    ctx.lineTo(x + Math.cos(ang + 2.4) * len * 0.55, y + Math.sin(ang + 2.4) * len * 0.55);
    ctx.lineTo(x + Math.cos(ang - 2.4) * len * 0.55, y + Math.sin(ang - 2.4) * len * 0.55);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

function popText(ctx: CanvasRenderingContext2D, g: Game, o: RenderOpts): void {
  ctx.textAlign = 'center';
  for (const p of g.fx.popups) {
    const k = p.life / p.max;
    ctx.globalAlpha = Math.min(1, k * 2);
    ctx.font = `800 ${(p.big ? 18 : 14) * o.textScale}px system-ui, sans-serif`;
    const y = p.y - (g.reduced ? 0 : (1 - k) * 28);
    ctx.lineWidth = 3;
    ctx.strokeStyle = 'rgba(0,0,0,0.7)';
    ctx.strokeText(p.text, p.x, y);
    ctx.fillStyle = p.big ? '#ffd25a' : '#fff';
    ctx.fillText(p.text, p.x, y);
  }
  ctx.globalAlpha = 1;
}

export function effects(ctx: CanvasRenderingContext2D, g: Game, o: RenderOpts): void {
  const a = o.alpha;
  ballTrail(ctx, g);
  for (const f of g.fx.fallers) {
    ctx.save();
    ctx.translate(lerp(f.px, f.x, a), lerp(f.py, f.y, a));
    ctx.rotate(lerp(f.prot, f.rot, a));
    drawSprite(ctx, f.b, 0, 0, R, o.symbols, o.scale);
    ctx.restore();
  }
  for (const p of g.fx.pops) {
    const k = p.life / p.max;
    ctx.globalAlpha = Math.max(0, k);
    drawSprite(ctx, p.b, p.x, p.y, R * (1 + 0.28 * (1 - k)), o.symbols, o.scale);
  }
  ctx.globalAlpha = 1;
  if (!g.reduced) for (const p of g.fx.pops) popRing(ctx, p);
  shards(ctx, g, a);
  ctx.globalAlpha = 1;
  popText(ctx, g, o);
}

/** Centred banner text with a dark outline. */
function banner(ctx: CanvasRenderingContext2D, text: string, y: number, alpha: number, size: number): void {
  ctx.save();
  ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
  ctx.textAlign = 'center';
  ctx.font = `800 ${size}px system-ui, sans-serif`;
  ctx.lineWidth = 5;
  ctx.strokeStyle = 'rgba(0,0,0,0.75)';
  ctx.strokeText(text, W / 2, y);
  ctx.fillStyle = '#ffd25a';
  ctx.fillText(text, W / 2, y);
  ctx.restore();
}

/** Level-clear, time's-up and out-of-shots banners. */
export function banners(ctx: CanvasRenderingContext2D, g: Game, o: RenderOpts): void {
  const size = 30 * o.textScale;
  const y = H * 0.38;
  if (g.status === 'cleared') {
    const k = 1 - g.clearTimer / TUNING.timers.clearBanner;
    const fade = g.reduced ? 1 : Math.min(1, k * 6, (1 - k) * 6);
    banner(ctx, `LEVEL ${g.level} CLEAR`, y, fade, size);
  } else if (g.status === 'finished') banner(ctx, "TIME'S UP", y, 1, size);
  else if (g.status === 'won') banner(ctx, 'CLEARED!', y, 1, size);
  else if (g.status === 'lost' && g.loseRow < 0) banner(ctx, 'OUT OF SHOTS', y, 1, size * 0.8);
}

/** Tint the row that crossed the danger line. */
export function loseHighlight(ctx: CanvasRenderingContext2D, g: Game, o: RenderOpts): void {
  if (g.status !== 'lost' || g.loseRow < 0) return;
  const y = TOP_Y + g.loseRow * ROW_H - g.dropAnim;
  const k = g.reduced ? 1 : 0.55 + 0.45 * Math.sin(o.time * 15);
  ctx.fillStyle = `rgba(255,70,70,${0.22 * k + 0.1})`;
  ctx.fillRect(0, y, W, ROW_H + R * 0.3);
}

/** First-run coach card highlights drawn over the playfield. */
export function highlight(ctx: CanvasRenderingContext2D, o: RenderOpts): void {
  if (!o.highlight) return;
  ctx.save();
  ctx.strokeStyle = '#ffd25a';
  ctx.fillStyle = 'rgba(255,210,90,0.14)';
  ctx.lineWidth = 3;
  ctx.setLineDash([7, 5]);
  ctx.beginPath();
  if (o.highlight === 'aim') ctx.arc(SHOOTER.x, SHOOTER.y - 14, 56, 0, Math.PI * 2);
  else if (o.highlight === 'swap') ctx.arc(NEXT_POS.x, NEXT_POS.y, 30, 0, Math.PI * 2);
  else ctx.rect(2, DANGER_Y - 14, W - 4, 28);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}
