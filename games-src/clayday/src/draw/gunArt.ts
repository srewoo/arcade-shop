// The double-barrelled gun art (first person), painted once into a sprite by gun.ts:
// walnut stock and forend with grain, blued barrels with gloss and a rib, engraved silver receiver, brass bead.
import { PALETTE as P } from '../palette';

const OUT = P.clayOutline;

function barrelPath(ctx: CanvasRenderingContext2D, x: number, top: number, bottom: number, wTop: number, wBot: number): void {
  ctx.beginPath();
  ctx.moveTo(x - wTop / 2, top);
  ctx.lineTo(x + wTop / 2, top);
  ctx.lineTo(x + wBot / 2, bottom);
  ctx.lineTo(x - wBot / 2, bottom);
  ctx.closePath();
}

function metalGrad(ctx: CanvasRenderingContext2D, x0: number, x1: number, dark: string, light: string): CanvasGradient {
  const g = ctx.createLinearGradient(x0, 0, x1, 0);
  g.addColorStop(0, dark);
  g.addColorStop(0.35, light);
  g.addColorStop(0.55, dark);
  g.addColorStop(1, '#14181c');
  return g;
}

function stock(ctx: CanvasRenderingContext2D, u: number): void {
  const g = ctx.createLinearGradient(-50 * u, 0, 50 * u, 0);
  g.addColorStop(0, P.gunWoodDark);
  g.addColorStop(0.5, P.gunWood);
  g.addColorStop(1, P.gunWoodDark);
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(-26 * u, 20 * u);
  ctx.lineTo(26 * u, 20 * u);
  ctx.lineTo(48 * u, 220 * u);
  ctx.lineTo(-48 * u, 220 * u);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
}

function receiver(ctx: CanvasRenderingContext2D, u: number): void {
  ctx.fillStyle = metalGrad(ctx, -34 * u, 34 * u, P.gunSteel, P.gunSteelLight);
  ctx.beginPath();
  ctx.roundRect(-34 * u, -34 * u, 68 * u, 78 * u, 14 * u);
  ctx.fill();
  ctx.stroke();
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = 'rgba(36,20,10,0.55)';
  ctx.beginPath();
  ctx.arc(0, 8 * u, 15 * u, 0, Math.PI * 2);
  ctx.moveTo(-26 * u, -16 * u);
  ctx.lineTo(26 * u, -16 * u);
  ctx.stroke();
  ctx.strokeStyle = OUT;
  ctx.lineWidth = 3;
  ctx.fillStyle = P.gunBrass;
  ctx.beginPath();
  ctx.roundRect(-5 * u, -6 * u, 10 * u, 28 * u, 4 * u);
  ctx.fill();
  ctx.stroke();
}

function barrels(ctx: CanvasRenderingContext2D, u: number, len: number): void {
  const wBot = 21 * u;
  const wTop = 15 * u;
  for (const dx of [-11 * u, 11 * u]) {
    ctx.fillStyle = metalGrad(ctx, dx - wBot / 2, dx + wBot / 2, P.gunMetal, P.gunBlueLight);
    barrelPath(ctx, dx, -len, -30 * u, wTop, wBot);
    ctx.fill();
    ctx.stroke();
  }
  ctx.fillStyle = P.gunSteelLight;
  ctx.fillRect(-2.5 * u, -len, 5 * u, len - 30 * u);
  ctx.strokeRect(-2.5 * u, -len, 5 * u, len - 30 * u);
  ctx.fillStyle = P.gunBrass;
  ctx.beginPath();
  ctx.arc(0, -len + 3 * u, 4.5 * u, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,0.28)';
  ctx.lineWidth = 2;
  for (const dx of [-15 * u, 7 * u]) {
    ctx.beginPath();
    ctx.moveTo(dx, -len + 8 * u);
    ctx.lineTo(dx + 1.5 * u, -34 * u);
    ctx.stroke();
  }
  ctx.strokeStyle = OUT;
  ctx.lineWidth = 3;
}

function forend(ctx: CanvasRenderingContext2D, u: number, len: number): void {
  const top = -len * 0.5;
  const bot = -len * 0.18;
  const g = ctx.createLinearGradient(-30 * u, 0, 30 * u, 0);
  g.addColorStop(0, P.gunWoodDark);
  g.addColorStop(0.45, P.gunWoodLight);
  g.addColorStop(1, P.gunWoodDark);
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.roundRect(-30 * u, top, 60 * u, bot - top, 16 * u);
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = 'rgba(36,20,10,0.35)';
  ctx.lineWidth = 1.5;
  for (const dx of [-14, -4, 8, 18]) {
    ctx.beginPath();
    ctx.moveTo(dx * u, top + 12 * u);
    ctx.quadraticCurveTo((dx + 3) * u, (top + bot) / 2, dx * u, bot - 12 * u);
    ctx.stroke();
  }
  ctx.strokeStyle = OUT;
  ctx.lineWidth = 3;
}


function grain(ctx: CanvasRenderingContext2D, u: number): void {
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(-26 * u, 20 * u);
  ctx.lineTo(26 * u, 20 * u);
  ctx.lineTo(48 * u, 220 * u);
  ctx.lineTo(-48 * u, 220 * u);
  ctx.closePath();
  ctx.clip();
  ctx.strokeStyle = 'rgba(40,20,8,0.28)';
  ctx.lineWidth = 1.4;
  for (let i = -5; i <= 5; i++) {
    ctx.beginPath();
    ctx.moveTo(i * 6 * u, 20 * u);
    ctx.bezierCurveTo(i * 9 * u + 6 * u, 90 * u, i * 5 * u - 5 * u, 150 * u, i * 9 * u, 220 * u);
    ctx.stroke();
  }
  ctx.fillStyle = 'rgba(255,220,160,0.18)';
  ctx.beginPath();
  ctx.moveTo(-8 * u, 20 * u);
  ctx.lineTo(4 * u, 20 * u);
  ctx.lineTo(14 * u, 220 * u);
  ctx.lineTo(-2 * u, 220 * u);
  ctx.fill();
  ctx.restore();
}

function engraving(ctx: CanvasRenderingContext2D, u: number): void {
  ctx.strokeStyle = 'rgba(40,52,64,0.5)';
  ctx.lineWidth = 1.1;
  for (const s of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(s * 8 * u, 38 * u);
    ctx.bezierCurveTo(s * 24 * u, 30 * u, s * 28 * u, 8 * u, s * 14 * u, -6 * u);
    ctx.bezierCurveTo(s * 10 * u, -12 * u, s * 20 * u, -22 * u, s * 24 * u, -26 * u);
    ctx.stroke();
  }
  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ctx.beginPath();
  ctx.roundRect(-28 * u, -30 * u, 14 * u, 70 * u, 6 * u);
  ctx.fill();
}

function band(ctx: CanvasRenderingContext2D, u: number, len: number): void {
  const y = -len * 0.62;
  const g = ctx.createLinearGradient(-26 * u, 0, 26 * u, 0);
  g.addColorStop(0, '#9aa5b0');
  g.addColorStop(0.4, '#f1f5f8');
  g.addColorStop(1, '#6d7882');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.roundRect(-26 * u, y, 52 * u, 10 * u, 3 * u);
  ctx.fill();
  ctx.stroke();
}

/** Paint the whole gun with the pivot at the origin and the muzzle pointing up (-y). */
export function paintGun(ctx: CanvasRenderingContext2D, u: number, len: number): void {
  ctx.lineJoin = 'round';
  ctx.strokeStyle = OUT;
  ctx.lineWidth = 3;
  stock(ctx, u);
  grain(ctx, u);
  barrels(ctx, u, len);
  band(ctx, u, len);
  forend(ctx, u, len);
  receiver(ctx, u);
  engraving(ctx, u);
}
