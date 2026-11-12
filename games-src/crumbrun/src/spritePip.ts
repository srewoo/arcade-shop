// Pip the mouse: grey body, pink ears, swaying tail. Drawn procedurally.
import { BOLD_OUTLINE, NORMAL_OUTLINE, paint } from './spriteOutline';
import { ACTOR_COLORS } from './theme';
import type { Dir } from './types';

type Ctx = CanvasRenderingContext2D;

export interface PipLook {
  readonly dir: Dir;
  readonly time: number;
  readonly moving: boolean;
  readonly spin: number; // extra rotation in radians (death)
  readonly alpha: number;
  readonly scale: number;
  readonly calm: boolean; // reduced motion: gentler tail
  readonly bold?: boolean; // high contrast: thicker outline
}

function angleOf(d: Dir): number {
  if (d === 'D') return Math.PI / 2;
  if (d === 'L') return Math.PI;
  if (d === 'U') return -Math.PI / 2;
  return 0;
}

function tail(ctx: Ctx, look: PipLook): void {
  const amp = look.calm ? 1.2 : look.moving ? 4 : 2;
  const sway = Math.sin(look.time * (look.moving ? 12 : 4)) * amp;
  ctx.strokeStyle = '#f0a3b8';
  ctx.lineWidth = 1.8;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-6, 0);
  ctx.bezierCurveTo(-10, sway, -12, -sway, -16, sway * 1.4);
  ctx.stroke();
}

function drawFace(ctx: Ctx): void {
  ctx.fillStyle = '#f08aa6';
  ctx.beginPath();
  ctx.arc(9.6, 0, 1.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#1b1b22';
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.arc(6.4, side * 1.9, 1.05, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  for (const side of [-1, 1]) ctx.fillRect(6.0, side * 1.9 - 0.7, 0.5, 0.5);
  ctx.strokeStyle = 'rgba(30,30,40,0.5)';
  ctx.lineWidth = 0.6;
  ctx.beginPath();
  for (const side of [-1, 1]) {
    ctx.moveTo(8.5, side * 1);
    ctx.lineTo(12, side * 3.4);
  }
  ctx.stroke();
}

export function drawPip(ctx: Ctx, px: number, py: number, look: PipLook): void {
  const o = look.bold ? BOLD_OUTLINE : NORMAL_OUTLINE;
  ctx.save();
  ctx.translate(px, py);
  ctx.globalAlpha = look.alpha;
  ctx.scale(look.scale, look.scale);
  ctx.rotate(angleOf(look.dir === 'N' ? 'R' : look.dir) + look.spin);
  tail(ctx, look);
  for (const side of [-1, 1]) {
    paint(ctx, '#8b909a', () => {
      ctx.beginPath();
      ctx.arc(2.5, side * 5.2, 3.6, 0, Math.PI * 2);
    }, o);
  }
  const head = (): void => {
    ctx.beginPath();
    ctx.ellipse(5, 0, 4.6, 3.8, 0, 0, Math.PI * 2);
  };
  paint(ctx, '#e6e9f0', head, o);
  paint(ctx, ACTOR_COLORS.pip, () => {
    ctx.beginPath();
    ctx.ellipse(-1, 0, 7.5, 5.4, 0, 0, Math.PI * 2);
  }, o);
  ctx.fillStyle = (() => {
    const g = ctx.createLinearGradient(0, -5.4, 0, 5.4);
    g.addColorStop(0, 'rgba(255,255,255,0.35)');
    g.addColorStop(0.55, 'rgba(255,255,255,0)');
    g.addColorStop(1, 'rgba(70,76,96,0.32)');
    return g;
  })();
  ctx.beginPath();
  ctx.ellipse(-1, 0, 7.5, 5.4, 0, 0, Math.PI * 2);
  ctx.fill();
  head();
  ctx.fillStyle = '#e6e9f0';
  ctx.fill();
  for (const side of [-1, 1]) {
    ctx.fillStyle = '#f4a6bd';
    ctx.beginPath();
    ctx.arc(2.5, side * 5.2, 2.3, 0, Math.PI * 2);
    ctx.fill();
  }
  drawFace(ctx);
  ctx.restore();
}
