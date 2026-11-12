// Brick sprites: each distinct brick look is drawn once into an offscreen canvas and re-blitted.
// hp is shown by frame rings + dots (and patterns/numerals in assist mode), never by hue alone.
import { CONFIG } from '../config';
import { PALETTE } from '../palette';
import type { Brick } from '../sim/world';
import { S } from '../strings';
import { hatch, roundRect } from './drawBricks';

export const SPRITE_PAD = 4;
const cache = new Map<string, HTMLCanvasElement>();
const BW = CONFIG.field.brickW - 3;
const BH = CONFIG.field.brickH - 3;
const R = 5;

function shade(g: CanvasRenderingContext2D, base: string, x: number, y: number, w: number, h: number): void {
  roundRect(g, x, y, w, h, R);
  g.fillStyle = base;
  g.fill();
  g.save();
  g.clip();
  const body = g.createLinearGradient(0, y, 0, y + h);
  body.addColorStop(0, 'rgba(255,255,255,0.45)');
  body.addColorStop(0.5, 'rgba(255,255,255,0.04)');
  body.addColorStop(1, 'rgba(6,10,36,0.42)');
  g.fillStyle = body;
  g.fillRect(x, y, w, h);
  // Glossy band and a thin hot top line.
  g.fillStyle = 'rgba(255,255,255,0.22)';
  g.beginPath();
  g.ellipse(x + w * 0.5, y - h * 0.15, w * 0.62, h * 0.55, 0, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = 'rgba(255,255,255,0.7)';
  g.fillRect(x + R, y + 1, w - R * 2, 1.2);
  g.fillStyle = 'rgba(6,10,36,0.35)';
  g.fillRect(x, y + h - 2, w, 2);
  g.fillStyle = 'rgba(255,255,255,0.18)';
  g.fillRect(x, y, 1.5, h);
  g.restore();
}

function steelFace(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number): void {
  hatch(g, x, y, w, h, 8, 'rgba(60,72,110,0.55)');
  g.fillStyle = 'rgba(255,255,255,0.8)';
  for (const [rx, ry] of [[4, 4], [w - 6, 4], [4, h - 6], [w - 6, h - 6]] as const) {
    g.beginPath();
    g.arc(x + rx, y + ry, 1.3, 0, Math.PI * 2);
    g.fill();
  }
}

function hpMarks(g: CanvasRenderingContext2D, b: Brick, assist: boolean, x: number, y: number, w: number, h: number): void {
  if (assist && b.hp === 2) hatch(g, x, y, w, h, 9, '#0e153066');
  else if (assist && b.hp >= 3) {
    hatch(g, x, y, w, h, 7, '#0e153066');
    g.fillStyle = '#0e153055';
    for (let i = 0; i < w; i += 8) g.fillRect(x + i, y, 1.5, h);
  }
  if (b.maxHp > 1) {
    g.strokeStyle = '#ffffffd9';
    g.lineWidth = 1.5;
    for (let i = 1; i < Math.min(b.hp, 3); i++) {
      roundRect(g, x + i * 2.4, y + i * 2.4, w - i * 4.8, h - i * 4.8, 2.5);
      g.stroke();
    }
  }
  g.fillStyle = PALETTE.ink;
  if (b.maxHp > 1 && !assist) {
    for (let i = 0; i < b.hp; i++) {
      g.beginPath();
      g.arc(x + w / 2 + (i - (b.hp - 1) / 2) * 8, y + h / 2, 2.6, 0, Math.PI * 2);
      g.fill();
    }
  }
  if (assist && b.maxHp > 1) {
    g.font = '700 15px system-ui, sans-serif';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillRect(x + w / 2 - 8, y + h / 2 - 8, 16, 16);
    g.fillStyle = '#ffffff';
    g.fillText(String(b.hp), x + w / 2, y + h / 2 + 1);
  }
}

function powerGem(g: CanvasRenderingContext2D, b: Brick, x: number, y: number, w: number, h: number): void {
  if (!b.power) return;
  const cx = x + w / 2;
  const cy = y + h / 2;
  const gem = g.createRadialGradient(cx - 2, cy - 3, 1, cx, cy, 9);
  gem.addColorStop(0, '#ffffff');
  gem.addColorStop(0.35, PALETTE.power[b.power]);
  gem.addColorStop(1, PALETTE.power[b.power]);
  g.beginPath();
  g.arc(cx, cy, 8, 0, Math.PI * 2);
  g.fillStyle = gem;
  g.fill();
  g.lineWidth = 1.5;
  g.strokeStyle = PALETTE.ink;
  g.stroke();
  g.font = '800 12px system-ui, sans-serif';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillStyle = PALETTE.ink;
  g.fillText(S.powerLetter[b.power], cx, cy + 1);
}

function paint(g: CanvasRenderingContext2D, b: Brick, hue: string, assist: boolean): void {
  const x = SPRITE_PAD;
  const y = SPRITE_PAD;
  roundRect(g, x, y + 2.5, BW, BH, R);
  g.fillStyle = 'rgba(2,4,18,0.6)';
  g.shadowColor = 'rgba(2,4,18,0.6)';
  g.shadowBlur = 3;
  g.fill();
  g.shadowBlur = 0;
  shade(g, b.steel ? PALETTE.steel : hue, x, y, BW, BH);
  if (b.steel) steelFace(g, x, y, BW, BH);
  g.strokeStyle = b.steel ? PALETTE.steelDark : '#0e1530aa';
  g.lineWidth = 1.5;
  roundRect(g, x, y, BW, BH, R);
  g.stroke();
  if (!b.steel) hpMarks(g, b, assist, x, y, BW, BH);
  if (!b.steel) powerGem(g, b, x, y, BW, BH);
}

/** Cached sprite for a brick look at pixel scale `s` (1 or 2). Size is (BW + 2 pad) x (BH + 2 pad) CSS units. */
export function brickSprite(b: Brick, hue: string, assist: boolean, s: number): HTMLCanvasElement {
  const key = `${hue}|${b.hp}|${b.maxHp}|${b.steel ? 1 : 0}|${b.power ?? ''}|${assist ? 1 : 0}|${s}`;
  let c = cache.get(key);
  if (!c) {
    c = document.createElement('canvas');
    c.width = Math.ceil((BW + SPRITE_PAD * 2) * s);
    c.height = Math.ceil((BH + SPRITE_PAD * 2) * s);
    const g = c.getContext('2d') as CanvasRenderingContext2D;
    g.scale(s, s);
    paint(g, b, hue, assist);
    cache.set(key, c);
  }
  return c;
}
