// Effects layer: flashes, particles, pocket drops, floating text, spin mark.
import { FX } from './config/fx';
import { LAYOUT } from './config/layout';
import { BALL_R, TABLE_H, TABLE_W } from './constants';
import { placeText } from './geom';
import type { Fx } from './fx';
import type { Game } from './game';
import { drawBall } from './renderBalls';
import { type View, toScreen } from './view';

function star(ctx: CanvasRenderingContext2D, x: number, y: number, r: number): void {
  ctx.beginPath();
  ctx.moveTo(x, y - r); ctx.quadraticCurveTo(x + r * 0.15, y - r * 0.15, x + r, y);
  ctx.quadraticCurveTo(x + r * 0.15, y + r * 0.15, x, y + r); ctx.quadraticCurveTo(x - r * 0.15, y + r * 0.15, x - r, y);
  ctx.quadraticCurveTo(x - r * 0.15, y - r * 0.15, x, y - r); ctx.fill();
}

export function drawFx(ctx: CanvasRenderingContext2D, fx: Fx, view: View, assist: boolean): void {
  for (const f of fx.flash) {
    const k = f.age / f.max;
    const x = Math.min(Math.max(f.x, 0), TABLE_W); const y = Math.min(Math.max(f.y, 0), TABLE_H);
    const r = f.r0 + k * (f.r1 - f.r0);
    ctx.globalAlpha = (1 - k) * 0.35; ctx.fillStyle = f.color;
    ctx.beginPath(); ctx.arc(x, y, r * 0.8, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = f.color; ctx.globalAlpha = 1 - k; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = '#ffffff'; ctx.globalAlpha = (1 - k) * 0.6; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.arc(x, y, r * 0.82, 0, Math.PI * 2); ctx.stroke();
  }
  for (const p of fx.particles) {
    const fade = Math.max(0, 1 - p.life / p.max);
    ctx.fillStyle = p.color;
    ctx.globalAlpha = fade * 0.3; ctx.beginPath(); ctx.arc(p.x, p.y, p.size * 2.2, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = fade; star(ctx, p.x, p.y, p.size * 1.6);
  }
  ctx.globalAlpha = 1;
  for (const d of fx.drops) {
    const k = Math.min(1, d.age / FX.dropSeconds);
    drawBall(ctx, d.ball, { x: d.sx + (d.tx - d.sx) * k, y: d.sy + (d.ty - d.sy) * k, scale: view.scale, assist, size: 1 - k });
  }
}

/** Spin mark on the cue ball: 4 px dot with a dark outline plus an up/down chevron, so hue is not the only cue. */
export function drawSpinMark(ctx: CanvasRenderingContext2D, game: Game): void {
  const cue = game.cue;
  if (game.phase !== 'aim' || cue.pocketed || game.spin === 0) return;
  const dir = game.spin > 0 ? -1 : 1; // screen-up for top spin
  const cy = cue.y - game.spin * BALL_R * 0.55;
  ctx.save();
  ctx.fillStyle = game.spin > 0 ? '#2f9de6' : '#e6552f';
  ctx.strokeStyle = '#10201c'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.arc(cue.x, cy, 2.6, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#10201c';
  const ty = cy + dir * 7;
  ctx.beginPath(); ctx.moveTo(cue.x - 3.5, ty - dir * 2.5); ctx.lineTo(cue.x + 3.5, ty - dir * 2.5); ctx.lineTo(cue.x, ty + dir * 2.5); ctx.closePath(); ctx.fill();
  ctx.restore();
}

export interface TextOpts { cssW: number; cssH: number; textScale: number; anchor?: { x: number; y: number } | null }

/** Floating text is anchored just above the cue ball (screen position in o.anchor), clamped inside the canvas. */
export function drawTexts(ctx: CanvasRenderingContext2D, fx: Fx, view: View, o: TextOpts): void {
  const base = Math.max(LAYOUT.textMinPx, Math.min(LAYOUT.textMaxPx, o.cssW / 18)) * o.textScale;
  const lift = (BALL_R * LAYOUT.textLiftBalls) * view.scale;
  const fallback = view.portrait
    ? toScreen(view, TABLE_W * LAYOUT.textAnchor, TABLE_H / 2)
    : toScreen(view, TABLE_W / 2, TABLE_H * LAYOUT.textAnchor);
  const ax = o.anchor?.x ?? o.cssW / 2;
  const ay = o.anchor ? o.anchor.y - lift : fallback.y;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
  const maxW = o.cssW * LAYOUT.textWidthFraction;
  const n = fx.texts.length;
  fx.texts.forEach((t, i) => {
    const k = t.age / t.max;
    const rise = fx.reduced ? 0 : k * FX.textRisePx;
    const pop = fx.reduced || k > 0.12 ? 1 : 0.7 + (k / 0.12) * 0.3;
    ctx.globalAlpha = k > 0.7 ? 1 - (k - 0.7) / 0.3 : 1;
    ctx.font = `800 ${base * pop}px ui-rounded, system-ui, sans-serif`;
    const w = ctx.measureText(t.text).width;
    const size = w > maxW ? (base * pop * maxW) / w : base * pop; // shrink long lines to fit the canvas
    ctx.font = `800 ${size}px ui-rounded, system-ui, sans-serif`;
    const tw = Math.min(w, maxW);
    const pos = placeText(ax, ay - rise - (n - 1 - i) * (base + 6), tw + 6, size, o.cssW, o.cssH); // newest nearest the cue ball, older lines stack above
    ctx.lineWidth = 5; ctx.strokeStyle = 'rgba(10,20,18,0.85)'; ctx.strokeText(t.text, pos.x, pos.y);
    ctx.fillStyle = t.tone === 'bad' ? '#ff8a73' : t.tone === 'good' ? '#ffe27a' : '#f3f1e6';
    ctx.fillText(t.text, pos.x, pos.y);
  });
  ctx.globalAlpha = 1;
}
