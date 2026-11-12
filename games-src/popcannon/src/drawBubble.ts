// Procedural bubble art. All shapes are drawn with canvas paths.
import { Bubble } from './hex';
import { COLORS, SYMBOLS, SymbolName, colorHex } from './palette';

export function shade(hex: string, amt: number): string {
  const n = parseInt(hex.slice(1), 16);
  const ch = (v: number): number => Math.max(0, Math.min(255, Math.round(v + (amt > 0 ? (255 - v) * amt : v * amt))));
  return `rgb(${ch(n >> 16)},${ch((n >> 8) & 255)},${ch(n & 255)})`;
}

/** Glass-candy orb: lit body, bounce light, tinted rim, hard outline. */
function sphere(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, base: string): void {
  const g = ctx.createRadialGradient(x - r * 0.32, y - r * 0.38, r * 0.08, x, y, r);
  g.addColorStop(0, shade(base, 0.62));
  g.addColorStop(0.3, shade(base, 0.2));
  g.addColorStop(0.68, base);
  g.addColorStop(1, shade(base, -0.55));
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = g;
  ctx.fill();
  ctx.save();
  ctx.clip();
  const bounce = ctx.createRadialGradient(x + r * 0.28, y + r * 0.62, 0, x + r * 0.28, y + r * 0.62, r * 0.7);
  bounce.addColorStop(0, 'rgba(255,255,255,0.32)');
  bounce.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = bounce;
  ctx.fillRect(x - r, y - r, r * 2, r * 2);
  ctx.restore();
  const rim = ctx.createLinearGradient(x - r, y - r, x + r, y + r);
  rim.addColorStop(0, 'rgba(255,255,255,0.55)');
  rim.addColorStop(0.5, 'rgba(255,255,255,0)');
  rim.addColorStop(1, shade(base, -0.6));
  ctx.beginPath();
  ctx.arc(x, y, r * 0.9, 0, Math.PI * 2);
  ctx.lineWidth = r * 0.13;
  ctx.strokeStyle = rim;
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.lineWidth = 1;
  ctx.strokeStyle = 'rgba(0,0,0,0.55)';
  ctx.stroke();
}

function gloss(ctx: CanvasRenderingContext2D, x: number, y: number, r: number): void {
  ctx.save();
  ctx.translate(x - r * 0.3, y - r * 0.46);
  ctx.rotate(-0.6);
  const g = ctx.createLinearGradient(0, -r * 0.2, 0, r * 0.2);
  g.addColorStop(0, 'rgba(255,255,255,0.9)');
  g.addColorStop(1, 'rgba(255,255,255,0.15)');
  ctx.beginPath();
  ctx.ellipse(0, 0, r * 0.36, r * 0.19, 0, 0, Math.PI * 2);
  ctx.fillStyle = g;
  ctx.fill();
  ctx.restore();
  ctx.beginPath();
  ctx.arc(x + r * 0.42, y + r * 0.46, r * 0.09, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,255,255,0.45)';
  ctx.fill();
}

function symbolPath(ctx: CanvasRenderingContext2D, name: SymbolName, s: number): void {
  ctx.beginPath();
  switch (name) {
    case 'circle': ctx.arc(0, 0, s * 0.8, 0, Math.PI * 2); break;
    case 'triangle': ctx.moveTo(0, -s); ctx.lineTo(s * 0.95, s * 0.75); ctx.lineTo(-s * 0.95, s * 0.75); ctx.closePath(); break;
    case 'square': ctx.rect(-s * 0.75, -s * 0.75, s * 1.5, s * 1.5); break;
    case 'diamond': ctx.moveTo(0, -s * 1.05); ctx.lineTo(s * 0.85, 0); ctx.lineTo(0, s * 1.05); ctx.lineTo(-s * 0.85, 0); ctx.closePath(); break;
    case 'star':
      for (let i = 0; i < 10; i++) {
        const rad = i % 2 === 0 ? s * 1.05 : s * 0.45;
        const a = -Math.PI / 2 + (i * Math.PI) / 5;
        ctx.lineTo(Math.cos(a) * rad, Math.sin(a) * rad);
      }
      ctx.closePath();
      break;
    case 'cross': {
      const t = s * 0.38;
      ctx.moveTo(-t, -s); ctx.lineTo(t, -s); ctx.lineTo(t, -t); ctx.lineTo(s, -t); ctx.lineTo(s, t);
      ctx.lineTo(t, t); ctx.lineTo(t, s); ctx.lineTo(-t, s); ctx.lineTo(-t, t); ctx.lineTo(-s, t);
      ctx.lineTo(-s, -t); ctx.lineTo(-t, -t); ctx.closePath();
      break;
    }
  }
}

export function drawSymbol(ctx: CanvasRenderingContext2D, name: SymbolName, x: number, y: number, r: number): void {
  ctx.save();
  ctx.translate(x, y);
  symbolPath(ctx, name, r * 0.5);
  ctx.fillStyle = 'rgba(255,255,255,0.92)';
  ctx.fill();
  ctx.lineWidth = 1.2;
  ctx.strokeStyle = 'rgba(0,0,0,0.65)';
  ctx.stroke();
  ctx.restore();
}

function drawBomb(ctx: CanvasRenderingContext2D, x: number, y: number, r: number): void {
  sphere(ctx, x, y, r, '#3a3a4c');
  ctx.strokeStyle = '#d9c9a0';
  ctx.lineWidth = 2.2;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x + r * 0.2, y - r * 0.8);
  ctx.quadraticCurveTo(x + r * 0.7, y - r * 1.2, x + r * 0.9, y - r * 0.75);
  ctx.stroke();
  const spark = ctx.createRadialGradient(x + r * 0.9, y - r * 0.75, 0, x + r * 0.9, y - r * 0.75, r * 0.5);
  spark.addColorStop(0, '#ffffff');
  spark.addColorStop(0.35, '#ffb02e');
  spark.addColorStop(1, 'rgba(255,120,30,0)');
  ctx.fillStyle = spark;
  ctx.beginPath();
  ctx.arc(x + r * 0.9, y - r * 0.75, r * 0.5, 0, Math.PI * 2);
  ctx.fill();
  const core = ctx.createRadialGradient(x, y, 0, x, y, r * 0.5);
  core.addColorStop(0, 'rgba(255,120,80,0.9)');
  core.addColorStop(1, 'rgba(255,60,60,0.1)');
  ctx.fillStyle = core;
  ctx.beginPath();
  ctx.arc(x, y, r * 0.48, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#ff4d4d';
  ctx.lineWidth = 1.6;
  ctx.stroke();
  gloss(ctx, x, y, r);
}

function drawRainbow(ctx: CanvasRenderingContext2D, x: number, y: number, r: number): void {
  const wheel = ctx.createConicGradient(-Math.PI / 2, x, y);
  COLORS.forEach((c, i) => wheel.addColorStop(i / COLORS.length, c));
  wheel.addColorStop(1, COLORS[0]);
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = wheel;
  ctx.fill();
  const g = ctx.createRadialGradient(x - r * 0.3, y - r * 0.35, 1, x, y, r);
  g.addColorStop(0, 'rgba(255,255,255,0.65)');
  g.addColorStop(0.5, 'rgba(255,255,255,0.05)');
  g.addColorStop(1, 'rgba(0,0,0,0.45)');
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = g;
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x, y, r * 0.3, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.55)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.stroke();
  gloss(ctx, x, y, r);
}

function drawStone(ctx: CanvasRenderingContext2D, x: number, y: number, r: number): void {
  sphere(ctx, x, y, r, '#8a8f99');
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, r * 0.94, 0, Math.PI * 2);
  ctx.clip();
  const facets: readonly (readonly [number, number, number, number, number, number, string])[] = [
    [-0.7, -0.2, 0.1, -0.6, 0.0, 0.05, 'rgba(255,255,255,0.14)'],
    [0.1, -0.6, 0.75, -0.1, 0.0, 0.05, 'rgba(0,0,0,0.12)'],
    [-0.7, -0.2, 0.0, 0.05, -0.3, 0.7, 'rgba(0,0,0,0.2)'],
    [0.0, 0.05, 0.75, -0.1, 0.45, 0.65, 'rgba(255,255,255,0.08)'],
  ];
  for (const [ax, ay, bx, by, cx, cy, col] of facets) {
    ctx.beginPath();
    ctx.moveTo(x + ax * r, y + ay * r);
    ctx.lineTo(x + bx * r, y + by * r);
    ctx.lineTo(x + cx * r, y + cy * r);
    ctx.closePath();
    ctx.fillStyle = col;
    ctx.fill();
  }
  ctx.restore();
  ctx.strokeStyle = 'rgba(30,32,40,0.75)';
  ctx.lineWidth = 1.3;
  ctx.beginPath();
  ctx.moveTo(x - r * 0.5, y - r * 0.2);
  ctx.lineTo(x - r * 0.1, y + r * 0.05);
  ctx.lineTo(x - r * 0.2, y + r * 0.5);
  ctx.moveTo(x - r * 0.1, y + r * 0.05);
  ctx.lineTo(x + r * 0.4, y - r * 0.1);
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(x - r * 0.3, y - r * 0.5, r * 0.26, r * 0.12, -0.6, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.fill();
}

export function drawBubble(
  ctx: CanvasRenderingContext2D, b: Bubble, x: number, y: number, r: number, symbols: boolean,
): void {
  if (b.kind === 'bomb') return drawBomb(ctx, x, y, r);
  if (b.kind === 'rainbow') return drawRainbow(ctx, x, y, r);
  if (b.kind === 'stone') return drawStone(ctx, x, y, r);
  sphere(ctx, x, y, r, colorHex(b));
  gloss(ctx, x, y, r);
  if (symbols) drawSymbol(ctx, SYMBOLS[b.color] ?? 'circle', x, y + r * 0.05, r);
}
