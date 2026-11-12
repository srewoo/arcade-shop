// Static playfield parts: ceiling, danger line, cannon and the NEXT bubble.
import { TUNING } from './config';
import { DANGER_ROW, H, R, SHOOTER, TOP_Y, W, lowestRow } from './hex';
import { ceilingWarning } from './resolve';
import { DANGER_Y, NEXT_POS, RenderOpts } from './renderTypes';
import { drawSprite } from './sprites';
import { Game } from './state';

function bulb(ctx: CanvasRenderingContext2D, x: number, y: number, lit: boolean, warn: boolean, pulse: number): void {
  if (lit) {
    const col = warn ? '255,241,194' : '255,210,90';
    const g = ctx.createRadialGradient(x, y, 0, x, y, 9);
    g.addColorStop(0, `rgba(${col},${0.55 * pulse})`);
    g.addColorStop(1, `rgba(${col},0)`);
    ctx.fillStyle = g;
    ctx.fillRect(x - 9, y - 9, 18, 18);
  }
  const b = ctx.createRadialGradient(x - 1, y - 1, 0.3, x, y, 3.6);
  b.addColorStop(0, lit ? '#ffffff' : '#7a82b8');
  b.addColorStop(1, lit ? (warn ? '#ffd27a' : '#ffb82e') : '#323862');
  ctx.beginPath();
  ctx.arc(x, y, 3.4, 0, Math.PI * 2);
  ctx.fillStyle = b;
  ctx.fill();
  ctx.lineWidth = 0.8;
  ctx.strokeStyle = 'rgba(0,0,0,0.5)';
  ctx.stroke();
}

function beam(ctx: CanvasRenderingContext2D, warn: boolean): void {
  const g = ctx.createLinearGradient(0, 0, 0, TOP_Y);
  g.addColorStop(0, warn ? '#b07a22' : '#5a63a8');
  g.addColorStop(0.5, warn ? '#8a5a12' : '#39406b');
  g.addColorStop(1, warn ? '#5c3a08' : '#262b52');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, TOP_Y);
  ctx.fillStyle = warn ? '#e0a02e' : '#6c76c4';
  ctx.fillRect(0, TOP_Y - 3, W, 2);
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.fillRect(0, TOP_Y - 1, W, 1);
  ctx.fillStyle = 'rgba(255,255,255,0.22)';
  ctx.fillRect(0, 1, W, 1);
  for (let x = 10; x < W; x += 28) {
    ctx.beginPath();
    ctx.arc(x, 4, 1.1, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.fill();
  }
  const shadow = ctx.createLinearGradient(0, TOP_Y, 0, TOP_Y + 12);
  shadow.addColorStop(0, 'rgba(0,0,0,0.32)');
  shadow.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = shadow;
  ctx.fillRect(0, TOP_Y, W, 12);
}

export function ceiling(ctx: CanvasRenderingContext2D, g: Game, o: RenderOpts): void {
  const warn = ceilingWarning(g);
  beam(ctx, warn);
  if (g.mode === 'puzzle') return;
  const n = g.diff.dropEvery;
  // Slow 1.5 Hz pulse, well under the 3 Hz flashing limit; static when motion is reduced.
  const pulse = warn && !g.reduced ? 0.6 + 0.4 * Math.sin(o.time * Math.PI * 3) : 1;
  for (let i = 0; i < n; i++) {
    const lit = i < n - g.sinceDrop;
    bulb(ctx, W / 2 + (i - (n - 1) / 2) * 12, TOP_Y / 2 - 1, lit, warn, lit ? pulse : 1);
  }
}

export function dangerLine(ctx: CanvasRenderingContext2D, g: Game, o: RenderOpts): void {
  const near = lowestRow(g.grid) >= DANGER_ROW - 2;
  const losing = g.status === 'lost' && g.loseRow >= 0;
  const t = o.time;
  let pulse = near && !g.reduced ? 0.5 + 0.5 * Math.sin(t * 8) : near ? 1 : 0.5;
  if (losing) pulse = g.reduced ? 1 : 0.5 + 0.5 * Math.sin(t * 15);
  const thick = o.highContrast ? 2 : 0;
  ctx.save();
  ctx.setLineDash([8, 6]);
  ctx.strokeStyle = `rgba(255,90,90,${Math.min(1, 0.35 + 0.5 * pulse + (o.highContrast ? 0.3 : 0))})`;
  ctx.lineWidth = (losing ? 4 : 2) + thick;
  ctx.beginPath();
  ctx.moveTo(0, DANGER_Y);
  ctx.lineTo(W, DANGER_Y);
  ctx.stroke();
  ctx.restore();
}

function barrel(ctx: CanvasRenderingContext2D, g: Game): void {
  const kick = g.reduced ? 0 : g.recoil * TUNING.fx.recoilPx;
  ctx.save();
  ctx.translate(SHOOTER.x, SHOOTER.y);
  ctx.rotate(g.angle);
  ctx.translate(0, kick);
  const grad = ctx.createLinearGradient(-12, 0, 12, 0);
  grad.addColorStop(0, '#4d5588');
  grad.addColorStop(0.35, '#dfe3ff');
  grad.addColorStop(0.6, '#9aa2d4');
  grad.addColorStop(1, '#434b7c');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.roundRect(-10, -44, 20, 50, 4);
  ctx.fill();
  ctx.lineWidth = 1;
  ctx.strokeStyle = 'rgba(10,12,40,0.6)';
  ctx.stroke();
  ctx.fillStyle = 'rgba(20,24,60,0.45)';
  for (const y of [-30, -16]) ctx.fillRect(-10, y, 20, 3);
  const muzzle = ctx.createLinearGradient(-13, 0, 13, 0);
  muzzle.addColorStop(0, '#59629a');
  muzzle.addColorStop(0.4, '#f1f3ff');
  muzzle.addColorStop(1, '#4a5284');
  ctx.fillStyle = muzzle;
  ctx.beginPath();
  ctx.roundRect(-13, -50, 26, 9, 3);
  ctx.fill();
  ctx.stroke();
  if (g.flash > 0 && !g.reduced) {
    const f = ctx.createRadialGradient(0, -52, 0, 0, -52, 16 + 10 * g.flash);
    f.addColorStop(0, `rgba(255,250,220,${g.flash})`);
    f.addColorStop(0.4, `rgba(255,200,90,${0.6 * g.flash})`);
    f.addColorStop(1, 'rgba(255,160,40,0)');
    ctx.fillStyle = f;
    ctx.beginPath();
    ctx.arc(0, -52, 16 + 10 * g.flash, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function base(ctx: CanvasRenderingContext2D): void {
  const cx = SHOOTER.x;
  ctx.beginPath();
  ctx.arc(cx, SHOOTER.y + 14, 30, Math.PI, 0);
  ctx.lineTo(cx + 30, H);
  ctx.lineTo(cx - 30, H);
  ctx.closePath();
  const g = ctx.createRadialGradient(cx - 8, SHOOTER.y - 6, 4, cx, SHOOTER.y + 14, 38);
  g.addColorStop(0, '#7d87cf');
  g.addColorStop(0.55, '#4b5390');
  g.addColorStop(1, '#2b315f');
  ctx.fillStyle = g;
  ctx.fill();
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = 'rgba(190,200,255,0.55)';
  ctx.beginPath();
  ctx.arc(cx, SHOOTER.y + 14, 29, Math.PI * 1.1, Math.PI * 1.7);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(8,10,34,0.7)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(cx, SHOOTER.y + 14, 30, Math.PI, 0);
  ctx.stroke();
  for (const dx of [-20, 20]) {
    ctx.beginPath();
    ctx.arc(cx + dx, SHOOTER.y + 30, 2.2, 0, Math.PI * 2);
    ctx.fillStyle = '#c5ccff';
    ctx.fill();
  }
}

export function cannon(ctx: CanvasRenderingContext2D, g: Game, o: RenderOpts): void {
  barrel(ctx, g);
  base(ctx);
  if (g.cur) drawSprite(ctx, g.cur, SHOOTER.x, SHOOTER.y, g.ball ? R * 0.9 : R, o.symbols, o.scale);
  ctx.fillStyle = 'rgba(255,255,255,0.78)';
  ctx.font = `600 ${12 * o.textScale}px system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillText('NEXT / SWAP', NEXT_POS.x, NEXT_POS.y + R + 12 + 4 * o.textScale);
  const plate = ctx.createRadialGradient(NEXT_POS.x, NEXT_POS.y, 2, NEXT_POS.x, NEXT_POS.y, R * 0.8 + 4);
  plate.addColorStop(0, 'rgba(8,10,34,0.75)');
  plate.addColorStop(1, 'rgba(40,46,100,0.55)');
  ctx.beginPath();
  ctx.arc(NEXT_POS.x, NEXT_POS.y, R * 0.8 + 4, 0, Math.PI * 2);
  ctx.fillStyle = plate;
  ctx.fill();
  if (g.next) drawSprite(ctx, g.next, NEXT_POS.x, NEXT_POS.y, R * 0.8, o.symbols, o.scale);
  ctx.beginPath();
  ctx.arc(NEXT_POS.x, NEXT_POS.y, R * 0.8 + 4, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(190,200,255,0.55)';
  ctx.lineWidth = 1.5;
  ctx.stroke();
}
