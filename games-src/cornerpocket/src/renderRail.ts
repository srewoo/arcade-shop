// Table frame: mahogany rail with bevel and grain, cushion rubber, pearl sights, leather-and-brass pockets.
import { POCKETS, RAIL, TABLE_H, TABLE_W } from './constants';

type C = CanvasRenderingContext2D;

export function roundRect(ctx: C, x: number, y: number, w: number, h: number, r: number): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function grain(ctx: C): void {
  const W = TABLE_W; const H = TABLE_H;
  ctx.save();
  roundRect(ctx, -RAIL, -RAIL, W + 2 * RAIL, H + 2 * RAIL, 22); ctx.clip();
  for (let y = -RAIL + 2; y < H + RAIL; y += 4.5) {
    ctx.strokeStyle = y % 9 < 4.5 ? 'rgba(25,8,2,0.16)' : 'rgba(255,200,150,0.05)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(-RAIL, y + Math.sin(y * 0.7) * 1.6); ctx.bezierCurveTo(W * 0.3, y + Math.cos(y) * 2.6, W * 0.65, y - Math.sin(y) * 2.6, W + RAIL, y + Math.cos(y * 0.7) * 1.6); ctx.stroke();
  }
  ctx.restore();
}

/** Light falls from the top-left: lit top/left edges, shaded bottom/right edges of the rail. */
function bevel(ctx: C): void {
  const W = TABLE_W; const H = TABLE_H;
  const strips: readonly (readonly [number, number, number, number, number, number, string, string])[] = [
    [0, -RAIL, 0, -RAIL + 9, -RAIL, W + RAIL * 2, 'rgba(255,220,170,0.4)', 'rgba(255,220,170,0)'],
    [0, H + RAIL, 0, H + RAIL - 9, -RAIL, W + RAIL * 2, 'rgba(10,2,0,0.5)', 'rgba(10,2,0,0)'],
  ];
  for (const [x0, y0, x1, y1, sx, sw, a, b] of strips) {
    const g = ctx.createLinearGradient(x0, y0, x1, y1); g.addColorStop(0, a); g.addColorStop(1, b);
    ctx.fillStyle = g; ctx.fillRect(sx, Math.min(y0, y1), sw, 9);
  }
  const gl = ctx.createLinearGradient(-RAIL, 0, -RAIL + 9, 0); gl.addColorStop(0, 'rgba(255,220,170,0.3)'); gl.addColorStop(1, 'rgba(255,220,170,0)');
  ctx.fillStyle = gl; ctx.fillRect(-RAIL, -RAIL, 9, H + 2 * RAIL);
  const gr = ctx.createLinearGradient(W + RAIL, 0, W + RAIL - 9, 0); gr.addColorStop(0, 'rgba(10,2,0,0.45)'); gr.addColorStop(1, 'rgba(10,2,0,0)');
  ctx.fillStyle = gr; ctx.fillRect(W + RAIL - 9, -RAIL, 9, H + 2 * RAIL);
}

export function drawRail(ctx: C): void {
  const W = TABLE_W; const H = TABLE_H;
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.55)'; ctx.shadowBlur = 22; ctx.shadowOffsetY = 8;
  ctx.fillStyle = '#3d2112';
  roundRect(ctx, -RAIL, -RAIL, W + 2 * RAIL, H + 2 * RAIL, 22); ctx.fill();
  ctx.restore();
  const rail = ctx.createLinearGradient(0, -RAIL, 0, H + RAIL);
  rail.addColorStop(0, '#8a5430'); rail.addColorStop(0.4, '#613719'); rail.addColorStop(0.75, '#552f16'); rail.addColorStop(1, '#6b3f22');
  ctx.fillStyle = rail;
  roundRect(ctx, -RAIL, -RAIL, W + 2 * RAIL, H + 2 * RAIL, 22); ctx.fill();
  grain(ctx);
  bevel(ctx);
  ctx.strokeStyle = 'rgba(255,225,180,0.45)'; ctx.lineWidth = 2;
  roundRect(ctx, -RAIL + 1.5, -RAIL + 1.5, W + 2 * RAIL - 3, H + 2 * RAIL - 3, 20.5); ctx.stroke();
  ctx.strokeStyle = 'rgba(0,0,0,0.55)'; ctx.lineWidth = 2;
  roundRect(ctx, -12, -12, W + 24, H + 24, 4); ctx.stroke();
  ctx.strokeStyle = 'rgba(255,215,160,0.18)'; ctx.lineWidth = 1;
  roundRect(ctx, -RAIL + 10, -RAIL + 10, W + 2 * RAIL - 20, H + 2 * RAIL - 20, 14); ctx.stroke();
}

function diamond(ctx: C, x: number, y: number, r: number): void {
  const g = ctx.createLinearGradient(x - r, y - r, x + r, y + r);
  g.addColorStop(0, '#fffaf0'); g.addColorStop(0.5, '#ecd9a8'); g.addColorStop(1, '#b8975a');
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.moveTo(x, y - r); ctx.lineTo(x + r, y); ctx.lineTo(x, y + r); ctx.lineTo(x - r, y); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = 'rgba(40,20,5,0.6)'; ctx.lineWidth = 0.8; ctx.stroke();
}

export function drawDiamonds(ctx: C): void {
  for (let i = 1; i < 8; i++) {
    if (i === 4) continue;
    const x = (TABLE_W / 8) * i;
    for (const y of [-RAIL / 2 - 2, TABLE_H + RAIL / 2 + 2]) diamond(ctx, x, y, 4.4);
  }
  for (let i = 1; i < 4; i++) {
    const y = (TABLE_H / 4) * i;
    if (i === 2) continue;
    for (const x of [-RAIL / 2 - 2, TABLE_W + RAIL / 2 + 2]) diamond(ctx, x, y, 4.4);
  }
}

function drawPocket(ctx: C, x: number, y: number, r: number): void {
  const leather = ctx.createRadialGradient(x - 3, y - 3, r * 0.4, x, y, r + 11);
  leather.addColorStop(0, '#5a3a22'); leather.addColorStop(1, '#2a160a');
  ctx.fillStyle = leather;
  ctx.beginPath(); ctx.arc(x, y, r + 10, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = 'rgba(230,190,120,0.35)'; ctx.lineWidth = 1; ctx.setLineDash([3, 3]);
  ctx.beginPath(); ctx.arc(x, y, r + 7.5, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
  const ring = ctx.createLinearGradient(x - r, y - r, x + r, y + r);
  ring.addColorStop(0, '#fff0b0'); ring.addColorStop(0.45, '#d6a93d'); ring.addColorStop(1, '#6e5016');
  ctx.fillStyle = ring;
  ctx.beginPath(); ctx.arc(x, y, r + 4, 0, Math.PI * 2); ctx.fill();
  const g = ctx.createRadialGradient(x + 2, y + 3, 1, x, y, r);
  g.addColorStop(0, '#000'); g.addColorStop(0.75, '#070405'); g.addColorStop(1, '#2e231c');
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  const inner = ctx.createLinearGradient(x, y - r, x, y + r);
  inner.addColorStop(0, 'rgba(0,0,0,0.65)'); inner.addColorStop(0.5, 'rgba(0,0,0,0)');
  ctx.fillStyle = inner; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = 'rgba(255,248,210,0.6)'; ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.arc(x, y, r + 3.6, Math.PI * 1.1, Math.PI * 1.55); ctx.stroke();
}

export function drawPockets(ctx: C): void {
  for (const p of POCKETS) drawPocket(ctx, p.x, p.y, p.r);
}
