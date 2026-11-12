import { CONFIG } from '../config';
import { colorHex, MARKERS, type ColorId, type Marker } from '../game/players';
import { PAL } from './palette';

export interface BallLook { x: number; y: number; roll: number; color: ColorId; marker: Marker; scale: number; assist: boolean; label: string }

export function drawBall(ctx: CanvasRenderingContext2D, b: BallLook, unrotate: number): void {
  const r = CONFIG.ball.r * b.scale;
  if (r < 0.5) return; // also keeps the clip radius (r - 0.4) positive
  ctx.save();
  ctx.beginPath(); ctx.ellipse(b.x + 2.6 * b.scale, b.y + 3.6 * b.scale, r * 1.05, r * 0.82, 0.5, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(0,20,6,0.38)'; ctx.fill();
  const hex = colorHex(b.color);
  const g = ctx.createRadialGradient(b.x - r * 0.4, b.y - r * 0.45, r * 0.1, b.x, b.y, r * 1.15);
  g.addColorStop(0, '#ffffff'); g.addColorStop(0.28, hex); g.addColorStop(1, shade(hex, 0.55));
  ctx.beginPath(); ctx.arc(b.x, b.y, r, 0, Math.PI * 2);
  ctx.fillStyle = g; ctx.fill();
  ctx.lineWidth = 1.5 * b.scale; ctx.strokeStyle = PAL.ballEdge; ctx.stroke();
  ctx.save();
  ctx.beginPath(); ctx.arc(b.x, b.y, r - 0.4, 0, Math.PI * 2); ctx.clip();
  ctx.translate(b.x, b.y);
  ctx.rotate(b.roll);
  drawMarker(ctx, b.marker, r * (b.assist ? 0.62 : 0.5), markInk(b.color));
  ctx.restore();
  ctx.beginPath(); ctx.ellipse(b.x - r * 0.36, b.y - r * 0.42, r * 0.28, r * 0.2, -0.6, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,255,255,0.85)'; ctx.fill();
  if (b.assist && b.label) {
    ctx.translate(b.x, b.y);
    ctx.rotate(unrotate);
    ctx.font = '700 9px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.lineWidth = 3; ctx.strokeStyle = PAL.ink; ctx.strokeText(b.label, 0, -r - 5);
    ctx.fillStyle = '#fff'; ctx.fillText(b.label, 0, -r - 5);
  }
  ctx.restore();
}

/** Relative luminance (WCAG) of a #rrggbb colour. */
export function luminance(hex: string): number {
  const n = parseInt(hex.slice(1), 16);
  const f = (v: number): number => { const c = v / 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
  return 0.2126 * f((n >> 16) & 255) + 0.7152 * f((n >> 8) & 255) + 0.0722 * f(n & 255);
}

export const INK_DARK = '#0a140e';
export const INK_LIGHT = '#ffffff';

/** Whichever of dark or white ink contrasts more with the ball colour. */
export function markInk(id: ColorId): string {
  const l = luminance(colorHex(id));
  return (l + 0.05) / (luminance(INK_DARK) + 0.05) >= 1.05 / (l + 0.05) ? INK_DARK : INK_LIGHT;
}

function shade(hex: string, k: number): string {
  const n = parseInt(hex.slice(1), 16);
  const c = (v: number): number => Math.round(v * k);
  return `rgb(${c((n >> 16) & 255)},${c((n >> 8) & 255)},${c(n & 255)})`;
}

export function drawMarker(ctx: CanvasRenderingContext2D, m: Marker, s: number, ink: string): void {
  ctx.fillStyle = ink;
  ctx.beginPath();
  if (m === 'dot') ctx.arc(0, 0, s * 0.8, 0, Math.PI * 2);
  else if (m === 'triangle') { ctx.moveTo(0, -s); ctx.lineTo(s * 0.95, s * 0.75); ctx.lineTo(-s * 0.95, s * 0.75); ctx.closePath(); }
  else if (m === 'square') ctx.rect(-s * 0.75, -s * 0.75, s * 1.5, s * 1.5);
  else { ctx.moveTo(0, -s); ctx.lineTo(s, 0); ctx.lineTo(0, s); ctx.lineTo(-s, 0); ctx.closePath(); }
  ctx.fill();
}

export const markerList = MARKERS;
