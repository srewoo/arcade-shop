// Balls, drawn in table coordinates. Numbers stay legible when the table is scaled down for phones.
import { LAYOUT } from './config/layout';
import { BALL_R } from './constants';
import type { Ball } from './physics';

export const BALL_COLORS = ['#f7f4ea', '#f2c230', '#2f6fd6', '#d9382c', '#6a3fa8', '#ef7a1c', '#1f9d55', '#8a2230', '#17161a'];
export const colorOf = (id: number): string => BALL_COLORS[id > 8 ? id - 8 : id] ?? '#fff';

export interface BallDraw { x: number; y: number; scale: number; assist: boolean; size?: number }

/** Number font and badge radius in table px, given the view scale (screen px per table px). */
export function numberMetrics(scale: number, assist: boolean): { font: number; badge: number } {
  const r = BALL_R;
  const minFont = (assist ? LAYOUT.numberMinScreenPx + 1 : LAYOUT.numberMinScreenPx) / Math.max(scale, 0.05);
  const font = Math.min(r * 1.4, Math.max(r * 0.7, minFont));
  const badge = Math.min(r * 0.85, Math.max(r * 0.55, font * 0.62));
  return { font, badge };
}

/** Half-height of the colour band on a striped ball, as a fraction of the radius. */
export const STRIPE_HALF = 0.62;

interface BallGradients { readonly shade: CanvasGradient; readonly shadow: CanvasGradient; readonly bounce: CanvasGradient }
const gradCache = new Map<number, BallGradients>();

/** Gradients live in ball-local space (origin at the ball centre), so one set serves every ball of that size. */
function gradientsFor(ctx: CanvasRenderingContext2D, r: number): BallGradients {
  const key = Math.round(r * 10);
  const hit = gradCache.get(key);
  if (hit) return hit;
  const shade = ctx.createRadialGradient(-r * 0.4, -r * 0.45, 0.5, 0, 0, r);
  shade.addColorStop(0, 'rgba(255,255,255,0.6)'); shade.addColorStop(0.3, 'rgba(255,255,255,0.05)'); shade.addColorStop(0.7, 'rgba(0,0,0,0.12)'); shade.addColorStop(1, 'rgba(0,0,0,0.5)');
  const shadow = ctx.createRadialGradient(0, 0, r * 0.3, 0, 0, r * 1.25);
  shadow.addColorStop(0, 'rgba(0,0,0,0.5)'); shadow.addColorStop(0.7, 'rgba(0,0,0,0.22)'); shadow.addColorStop(1, 'rgba(0,0,0,0)');
  const bounce = ctx.createRadialGradient(r * 0.45, r * 0.5, 0, r * 0.45, r * 0.5, r * 0.7);
  bounce.addColorStop(0, 'rgba(120,230,200,0.28)'); bounce.addColorStop(1, 'rgba(120,230,200,0)');
  const made = { shade, shadow, bounce };
  gradCache.set(key, made);
  return made;
}

function paintNumber(ctx: CanvasRenderingContext2D, b: Ball, d: BallDraw, k: number): void {
  const stripe = b.id > 8;
  const m = numberMetrics(d.scale, d.assist);
  const badge = stripe ? Math.min(m.badge, BALL_R * STRIPE_HALF * 0.92) : m.badge;
  const font = stripe ? Math.min(m.font, badge * 1.6) : m.font;
  ctx.fillStyle = '#fbf8ee';
  ctx.beginPath(); ctx.arc(0, 0, badge * k, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.22)'; ctx.lineWidth = 0.6; ctx.stroke();
  ctx.fillStyle = '#17161a'; ctx.font = `800 ${font * k}px system-ui, sans-serif`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(String(b.id), 0, 0.5 * k);
}

export function drawBall(ctx: CanvasRenderingContext2D, b: Ball, d: BallDraw): void {
  const r = BALL_R * (d.size ?? 1);
  if (r <= 0.2) return;
  const k = d.size ?? 1;
  const g = gradientsFor(ctx, r);
  ctx.save();
  ctx.translate(d.x, d.y);
  ctx.save(); ctx.translate(2.5 * k, 3.5 * k); ctx.scale(1, 0.92); ctx.fillStyle = g.shadow;
  ctx.beginPath(); ctx.arc(0, 0, r * 1.25, 0, Math.PI * 2); ctx.fill(); ctx.restore();
  ctx.save();
  ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.clip();
  const stripe = b.id > 8;
  ctx.fillStyle = stripe ? '#f7f4ea' : colorOf(b.id);
  ctx.fillRect(-r, -r, 2 * r, 2 * r);
  if (stripe) { ctx.fillStyle = colorOf(b.id); ctx.fillRect(-r, -r * STRIPE_HALF, 2 * r, r * STRIPE_HALF * 2); }
  if (b.id !== 0) paintNumber(ctx, b, d, k);
  ctx.fillStyle = g.shade; ctx.fillRect(-r, -r, 2 * r, 2 * r);
  ctx.fillStyle = g.bounce; ctx.fillRect(-r, -r, 2 * r, 2 * r);
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.beginPath(); ctx.ellipse(-r * 0.42, -r * 0.5, r * 0.2, r * 0.12, -0.6, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.beginPath(); ctx.arc(-r * 0.1, -r * 0.72, r * 0.07, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
  if (b.id === 8 || d.assist) {
    // Light rim: the 8 ball is near-black on dark felt; assist rims every ball.
    ctx.strokeStyle = 'rgba(255,255,255,0.55)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.stroke();
  }
  ctx.restore();
}
