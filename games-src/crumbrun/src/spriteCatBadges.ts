// Non-colour cues drawn over a cat in screen space: droplet (drenched), wavy ring and
// letter (colour-blind assist), zzz (grooming), exclamation (pounce wind-up).
import type { CatLook } from './spriteCat';

type Ctx = CanvasRenderingContext2D;

const LETTER = { smudge: 'S', biscuit: 'B', tuxedo: 'T', ginger: 'G' } as const;

function droplet(ctx: Ctx, x: number, y: number): void {
  ctx.beginPath();
  ctx.moveTo(x, y - 5);
  ctx.bezierCurveTo(x + 4.5, y, x + 3.6, y + 4.4, x, y + 4.4);
  ctx.bezierCurveTo(x - 3.6, y + 4.4, x - 4.5, y, x, y - 5);
  ctx.closePath();
  ctx.lineWidth = 2.2;
  ctx.strokeStyle = '#120a0e';
  ctx.stroke();
  ctx.fillStyle = '#bfe6ff';
  ctx.fill();
}

function wavyRing(ctx: Ctx, time: number): void {
  ctx.beginPath();
  for (let i = 0; i <= 24; i++) {
    const a = (i / 24) * Math.PI * 2;
    const r = 11 + Math.sin(a * 6 + time * 8) * 1.3;
    if (i === 0) ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
    else ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  ctx.closePath();
  ctx.lineWidth = 1.6;
  ctx.strokeStyle = '#ffffff';
  ctx.stroke();
}

function letter(ctx: Ctx, ch: string, x: number, y: number): void {
  ctx.fillStyle = '#120a0e';
  ctx.beginPath();
  ctx.arc(x, y, 4.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.lineWidth = 1;
  ctx.strokeStyle = '#f6ecd2';
  ctx.stroke();
  ctx.font = 'bold 7px ui-monospace, Menlo, Consolas, monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#f6ecd2';
  ctx.fillText(ch, x, y + 0.5);
}

function zzz(ctx: Ctx, time: number): void {
  const y = -11 - Math.sin(time * 2.4) * 1.2;
  ctx.strokeStyle = '#bde7ff';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(4, y - 3);
  ctx.lineTo(8, y - 3);
  ctx.lineTo(4, y + 1);
  ctx.lineTo(8, y + 1);
  ctx.stroke();
}

function alert(ctx: Ctx): void {
  ctx.fillStyle = '#ff4a3a';
  ctx.strokeStyle = '#120a0e';
  ctx.lineWidth = 2;
  ctx.strokeRect(-1.2, -16, 2.4, 6);
  ctx.fillRect(-1.2, -16, 2.4, 6);
  ctx.strokeRect(-1.2, -8.5, 2.4, 2.4);
  ctx.fillRect(-1.2, -8.5, 2.4, 2.4);
}

export function drawCatBadges(ctx: Ctx, look: CatLook): void {
  if (look.drenched) {
    if (look.assist) wavyRing(ctx, look.time);
    droplet(ctx, 0, -11);
  }
  if (look.windup) alert(ctx);
  if (look.grooming && !look.calm) zzz(ctx, look.time);
  else if (look.grooming) zzz(ctx, 0);
  if (look.assist) letter(ctx, LETTER[look.kind], 0, 12);
}
