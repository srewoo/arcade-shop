// Brick drawing. hp is shown by colour AND by dots (and patterns/numerals in assist mode).
import { CONFIG } from '../config';
import { PALETTE } from '../palette';
import { brickRect, type Brick } from '../sim/world';
import { brickSprite, SPRITE_PAD } from './brickSprite';

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
export { roundRect };

export function hatch(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, gap: number, color: string): void {
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let i = -h; i < w; i += gap) {
    ctx.moveTo(x + i, y + h);
    ctx.lineTo(x + i + h, y);
  }
  ctx.stroke();
  ctx.restore();
}

/** Hue for the brick at grid index `idx` (one hue per row). */
export const rowHue = (idx: number): string =>
  PALETTE.rows[Math.floor(idx / CONFIG.field.cols) % PALETTE.rows.length] as string;

export function drawBricks(ctx: CanvasRenderingContext2D, bricks: readonly (Brick | null)[], assist: boolean, ox = 0): void {
  const s = Math.max(1, Math.min(2, Math.round(ctx.getTransform().a * 2) / 2));
  bricks.forEach((b, i) => {
    if (!b) return;
    const r = brickRect(i, ox);
    const sprite = brickSprite(b, rowHue(i), assist, s);
    ctx.drawImage(sprite, r.left + 1.5 - SPRITE_PAD, r.top + 1.5 - SPRITE_PAD, CONFIG.field.brickW - 3 + SPRITE_PAD * 2, CONFIG.field.brickH - 3 + SPRITE_PAD * 2);
  });
}
