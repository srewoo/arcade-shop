// Canvas drawing primitives. Everything is code-drawn: gradients and paths only.
import { rgba } from './colour';
import { getDisc, renderScale } from './discArt';
import { DISC_COLOURS, PLATE } from './palette';

export { paintPlate as drawPlate } from './plateArt';

export interface DiscStyle {
  readonly colour: number;
  readonly scale: number;
  readonly alpha: number;
  readonly assist: boolean;
  readonly lit: boolean;
  /** 0..1 white flash laid over the disc (pop start). */
  readonly flash?: number;
}

export function drawDisc(ctx: CanvasRenderingContext2D, cx: number, cy: number, radius: number, s: DiscStyle): void {
  const r = radius * s.scale;
  const { canvas, half } = getDisc(s.colour, s.assist, radius);
  const k = renderScale();
  const size = (half * 2) / k;
  ctx.save();
  ctx.globalAlpha = s.alpha;
  if (s.lit) {
    const halo = ctx.createRadialGradient(cx, cy, r * 0.7, cx, cy, r * 1.35);
    halo.addColorStop(0, rgba(DISC_COLOURS[s.colour] ?? '#ffffff', 0.55));
    halo.addColorStop(1, rgba(DISC_COLOURS[s.colour] ?? '#ffffff', 0));
    ctx.fillStyle = halo;
    ctx.fillRect(cx - r * 1.4, cy - r * 1.4, r * 2.8, r * 2.8);
  }
  const d = size * s.scale;
  ctx.drawImage(canvas, cx - d / 2, cy - d / 2, d, d);
  if (s.lit || (s.flash ?? 0) > 0) {
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = `rgba(255,255,255,${s.lit ? 0.16 + (s.flash ?? 0) * 0.6 : (s.flash ?? 0) * 0.7})`;
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.95, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalCompositeOperation = 'source-over';
  }
  if (s.lit) {
    ctx.lineWidth = Math.max(2, r * 0.07);
    ctx.strokeStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.97, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

export function drawRing(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, colour: string): void {
  ctx.save();
  ctx.strokeStyle = colour;
  ctx.lineWidth = 3;
  ctx.setLineDash([6, 4]);
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

/** Expanding shockwave ring; t runs 0..1. */
export function drawShock(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, t: number, colour: string): void {
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.globalAlpha = (1 - t) * 0.85;
  ctx.strokeStyle = colour;
  ctx.lineWidth = Math.max(1.5, r * 0.22 * (1 - t));
  ctx.beginPath();
  ctx.arc(cx, cy, r * (0.7 + t * 1.5), 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

/** Glowing spark (additive) with a short velocity streak. */
export function drawSpark(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, alpha: number, colour: string): void {
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const g = ctx.createRadialGradient(x, y, 0, x, y, size * 2.6);
  g.addColorStop(0, `rgba(255,255,255,${alpha})`);
  g.addColorStop(0.35, rgba(colour, alpha * 0.7));
  g.addColorStop(1, rgba(colour, 0));
  ctx.fillStyle = g;
  ctx.fillRect(x - size * 2.6, y - size * 2.6, size * 5.2, size * 5.2);
  ctx.restore();
}

/** A small tumbling gem shard. */
export function drawShard(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, rot: number, alpha: number, colour: string): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.globalAlpha = alpha;
  ctx.beginPath();
  ctx.moveTo(0, -size);
  ctx.lineTo(size * 0.6, 0);
  ctx.lineTo(0, size);
  ctx.lineTo(-size * 0.6, 0);
  ctx.closePath();
  ctx.fillStyle = colour;
  ctx.fill();
  ctx.lineWidth = 1;
  ctx.strokeStyle = 'rgba(255,255,255,0.7)';
  ctx.stroke();
  ctx.restore();
}

export function drawFloatText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, alpha: number, size: number): void {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.font = `800 ${size}px ui-rounded, system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round';
  ctx.shadowColor = 'rgba(255,214,90,0.85)';
  ctx.shadowBlur = size * 0.5;
  ctx.lineWidth = Math.max(4, size * 0.22);
  ctx.strokeStyle = PLATE;
  ctx.strokeText(text, x, y);
  ctx.shadowBlur = 0;
  const g = ctx.createLinearGradient(0, y - size / 2, 0, y + size / 2);
  g.addColorStop(0, '#ffffff');
  g.addColorStop(1, '#ffe08a');
  ctx.fillStyle = g;
  ctx.fillText(text, x, y);
  ctx.restore();
}
