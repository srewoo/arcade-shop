// Procedural table art: felt under a hanging lamp, cushions, markings. Drawn in table coordinates.
import { TABLE_H, TABLE_W } from './constants';
import { drawDiamonds, drawPockets, drawRail, roundRect } from './renderRail';

export { roundRect };

let feltTile: HTMLCanvasElement | null = null;

/** Tiny deterministic cloth-noise tile, built once. */
function feltPattern(ctx: CanvasRenderingContext2D): CanvasPattern | null {
  if (!feltTile && typeof document !== 'undefined') {
    const c = document.createElement('canvas'); c.width = 96; c.height = 96;
    const t = c.getContext('2d');
    if (t) {
      let seed = 12345;
      const rnd = (): number => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
      for (let i = 0; i < 1100; i++) {
        t.fillStyle = rnd() > 0.5 ? 'rgba(255,255,255,0.07)' : 'rgba(0,20,10,0.10)';
        t.fillRect(Math.floor(rnd() * 96), Math.floor(rnd() * 96), 1, 1 + (rnd() > 0.7 ? 1 : 0));
      }
      feltTile = c;
    }
  }
  return feltTile ? ctx.createPattern(feltTile, 'repeat') : null;
}

function drawFelt(ctx: CanvasRenderingContext2D): void {
  const W = TABLE_W; const H = TABLE_H;
  const rubber = ctx.createLinearGradient(0, -10, 0, 0);
  rubber.addColorStop(0, '#06382f'); rubber.addColorStop(1, '#0b5446');
  ctx.fillStyle = '#0a4a3e'; // cushion rubber
  ctx.fillRect(-10, -10, W + 20, H + 20);
  ctx.fillStyle = rubber; ctx.fillRect(-10, -10, W + 20, 10);
  ctx.fillStyle = 'rgba(255,255,255,0.16)'; ctx.fillRect(-10, -10, W + 20, 1.5);
  ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(-10, H + 8.5, W + 20, 1.5);
  const felt = ctx.createRadialGradient(W * 0.5, H * 0.46, 30, W / 2, H / 2, W * 0.64);
  felt.addColorStop(0, '#22a085'); felt.addColorStop(0.5, '#157f69'); felt.addColorStop(1, '#0b5748');
  ctx.fillStyle = felt;
  ctx.fillRect(0, 0, W, H);
  const pat = feltPattern(ctx);
  if (pat) { ctx.fillStyle = pat; ctx.fillRect(0, 0, W, H); }
  // overhead lamp pool: a soft warm oval, and a faint diagonal sheen
  ctx.save(); ctx.translate(W * 0.5, H * 0.47); ctx.scale(1, 0.55);
  const lamp = ctx.createRadialGradient(0, 0, 0, 0, 0, W * 0.42);
  lamp.addColorStop(0, 'rgba(255,245,200,0.16)'); lamp.addColorStop(1, 'rgba(255,245,200,0)');
  ctx.fillStyle = lamp; ctx.beginPath(); ctx.arc(0, 0, W * 0.42, 0, Math.PI * 2); ctx.fill(); ctx.restore();
  cushionShadow(ctx, 0, 0, W, 18, 'v', false);
  cushionShadow(ctx, 0, H - 18, W, 18, 'v', true);
  cushionShadow(ctx, 0, 0, 18, H, 'h', false);
  cushionShadow(ctx, W - 18, 0, 18, H, 'h', true);
}

/** Soft shadow the cushions cast onto the cloth, darkest at the rail edge. */
function cushionShadow(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, axis: 'v' | 'h', flip: boolean): void {
  const g = axis === 'v' ? ctx.createLinearGradient(0, flip ? y + h : y, 0, flip ? y : y + h) : ctx.createLinearGradient(flip ? x + w : x, 0, flip ? x : x + w, 0);
  g.addColorStop(0, 'rgba(0,0,0,0.42)'); g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
}

export function drawTable(ctx: CanvasRenderingContext2D): void {
  drawRail(ctx);
  drawFelt(ctx);
  drawMarkings(ctx);
  drawDiamonds(ctx);
  drawPockets(ctx);
}

function drawMarkings(ctx: CanvasRenderingContext2D): void {
  ctx.strokeStyle = 'rgba(255,255,255,0.12)'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(200, 8); ctx.lineTo(200, TABLE_H - 8); ctx.stroke();
  ctx.beginPath(); ctx.arc(200, TABLE_H / 2, 62, Math.PI / 2, -Math.PI / 2); ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.18)';
  ctx.beginPath(); ctx.arc(540, TABLE_H / 2, 2.6, 0, Math.PI * 2); ctx.fill();
}
