// Top-down car and caravan artwork, painted once into sprites (see sprites.ts). Front is +x, metres.
import { mixHex } from '../alignment';
import { PAL } from './palette';

type G = CanvasRenderingContext2D;
export const SPRITE_PAD = 0.5;

/** Tapered car outline: nose narrower than the tail. */
export function carOutline(g: G, hw: number, hh: number, inset = 0): void {
  const w = hw - inset;
  const h = hh - inset;
  g.beginPath();
  g.moveTo(-w + 0.45, -h);
  g.lineTo(w * 0.55, -h);
  g.bezierCurveTo(w * 0.86, -h, w, -h * 0.74, w, -h * 0.42);
  g.lineTo(w, h * 0.42);
  g.bezierCurveTo(w, h * 0.74, w * 0.86, h, w * 0.55, h);
  g.lineTo(-w + 0.45, h);
  g.quadraticCurveTo(-w, h, -w, h - 0.45);
  g.lineTo(-w, -h + 0.45);
  g.quadraticCurveTo(-w, -h, -w + 0.45, -h);
  g.closePath();
}

/** Soft silhouette used as a ground shadow (blurred). */
export function paintShadow(g: G, hw: number, hh: number): void {
  g.shadowColor = 'rgba(0,0,0,0.5)';
  g.shadowBlur = 0.35 * 90;
  g.fillStyle = 'rgba(0,0,0,0.5)';
  g.save();
  g.shadowOffsetX = 0;
  carOutline(g, hw * 0.96, hh * 0.96);
  g.fill();
  g.restore();
}

function glassPane(g: G, x: number, y: number, w: number, h: number, r: number): void {
  const grad = g.createLinearGradient(x, y, x + w, y + h);
  grad.addColorStop(0, '#3d5a78');
  grad.addColorStop(0.55, '#16273a');
  grad.addColorStop(1, '#0c1622');
  g.fillStyle = grad;
  g.beginPath();
  g.roundRect(x, y, w, h, r);
  g.fill();
  g.save();
  g.clip();
  g.fillStyle = 'rgba(255,255,255,0.2)';
  g.beginPath();
  g.moveTo(x, y + h * 0.9);
  g.lineTo(x + w * 0.3, y);
  g.lineTo(x + w * 0.5, y);
  g.lineTo(x + w * 0.1, y + h);
  g.fill();
  g.restore();
}

/** Body, cabin and glass. Wheels and lamps are drawn live so they can steer and light up. */
export function paintCarBody(g: G, hw: number, hh: number, color: string, dark: string): void {
  const light = mixHex(color, '#ffffff', 0.35);
  const rim = mixHex(color, dark, 0.3);
  carOutline(g, hw, hh);
  const side = g.createLinearGradient(0, -hh, 0, hh);
  side.addColorStop(0, rim);
  side.addColorStop(0.28, light);
  side.addColorStop(0.55, color);
  side.addColorStop(1, dark);
  g.fillStyle = side;
  g.fill();
  g.lineWidth = 0.07;
  g.strokeStyle = dark;
  g.stroke();
  // Hood and boot panels with a shallow crease.
  g.strokeStyle = 'rgba(0,0,0,0.22)';
  g.lineWidth = 0.035;
  g.beginPath();
  g.moveTo(hw * 0.28, -hh * 0.78); g.quadraticCurveTo(hw * 0.2, 0, hw * 0.28, hh * 0.78);
  g.moveTo(-hw * 0.78, -hh * 0.76); g.quadraticCurveTo(-hw * 0.7, 0, -hw * 0.78, hh * 0.76);
  g.stroke();
  g.strokeStyle = 'rgba(255,255,255,0.28)';
  g.beginPath();
  g.moveTo(hw * 0.88, 0); g.lineTo(hw * 0.34, 0);
  g.stroke();
  // Cabin: windscreen, roof, rear screen.
  glassPane(g, hw * 0.1, -hh * 0.78, hw * 0.3, hh * 1.56, 0.2);
  glassPane(g, -hw * 0.64, -hh * 0.74, hw * 0.2, hh * 1.48, 0.17);
  const roof = g.createLinearGradient(-hw * 0.4, -hh, hw * 0.1, hh);
  roof.addColorStop(0, light);
  roof.addColorStop(1, color);
  g.fillStyle = roof;
  g.beginPath();
  g.roundRect(-hw * 0.42, -hh * 0.72, hw * 0.52, hh * 1.44, 0.2);
  g.fill();
  g.strokeStyle = dark;
  g.lineWidth = 0.035;
  g.stroke();
  g.fillStyle = 'rgba(255,255,255,0.18)';
  g.beginPath();
  g.roundRect(-hw * 0.38, -hh * 0.64, hw * 0.3, hh * 0.5, 0.15);
  g.fill();
  // Door seams, wing mirrors and a fuel cap.
  g.strokeStyle = 'rgba(0,0,0,0.25)';
  g.lineWidth = 0.03;
  g.beginPath();
  g.moveTo(-hw * 0.1, -hh * 0.96); g.lineTo(-hw * 0.1, -hh * 0.78);
  g.moveTo(-hw * 0.1, hh * 0.96); g.lineTo(-hw * 0.1, hh * 0.78);
  g.stroke();
  g.fillStyle = dark;
  for (const s of [-1, 1]) {
    g.beginPath();
    g.ellipse(hw * 0.22, s * (hh + 0.02), 0.13, 0.08, 0, 0, Math.PI * 2);
    g.fill();
  }
  g.fillStyle = 'rgba(255,255,255,0.4)';
  g.beginPath();
  g.arc(-hw * 0.52, hh * 0.86, 0.06, 0, Math.PI * 2);
  g.fill();
}

/** Caravan: white shell with roof vents, a skylight, a window stripe and a tow tongue. */
export function paintCaravanBody(g: G, hw: number, hh: number, color: string, stripe: string): void {
  g.fillStyle = '#7b8594';
  g.fillRect(hw - 0.05, -0.07, 0.62, 0.14);
  g.beginPath();
  g.arc(hw + 0.62, 0, 0.1, 0, Math.PI * 2);
  g.fill();
  const body = g.createLinearGradient(0, -hh, 0, hh);
  body.addColorStop(0, mixHex(color, '#9aa6b4', 0.35));
  body.addColorStop(0.3, '#ffffff');
  body.addColorStop(0.7, color);
  body.addColorStop(1, mixHex(color, '#5c6674', 0.5));
  g.fillStyle = body;
  g.beginPath();
  g.roundRect(-hw, -hh, hw * 2, hh * 2, 0.34);
  g.fill();
  g.strokeStyle = '#8b94a1';
  g.lineWidth = 0.06;
  g.stroke();
  g.fillStyle = stripe;
  g.fillRect(-hw + 0.3, -0.13, hw * 2 - 0.6, 0.26);
  g.fillStyle = 'rgba(255,255,255,0.4)';
  g.fillRect(-hw + 0.3, -0.13, hw * 2 - 0.6, 0.05);
  g.fillStyle = '#9fb5cc';
  g.beginPath();
  g.roundRect(-0.2, -hh * 0.56, 0.9, hh * 0.32, 0.06);
  g.roundRect(-0.2, hh * 0.24, 0.9, hh * 0.32, 0.06);
  g.fill();
  g.fillStyle = '#d5e6f5';
  g.beginPath();
  g.roundRect(-hw * 0.6, -0.36, 0.7, 0.72, 0.1);
  g.fill();
  g.strokeStyle = '#8b94a1';
  g.lineWidth = 0.04;
  g.stroke();
  g.fillStyle = 'rgba(30,40,55,0.35)';
  for (const x of [-hw * 0.2, hw * 0.3]) g.fillRect(x, -0.5, 0.35, 0.18);
  g.fillStyle = PAL.tail;
  for (const s of [-1, 1]) g.fillRect(-hw + 0.03, s * (hh - 0.3) - 0.12, 0.1, 0.24);
}
