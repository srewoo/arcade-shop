// Static near layer: back wall, hard court in perspective with lines, hedge and side walls.
import { mulberry32 } from '../rng';
import { BANDS, laneX } from './layout';
import { PAL } from './palette';

type Ctx = CanvasRenderingContext2D;
export interface FrontBox { x0: number; x1: number; bottom: number; worldW: number }

function backWall(ctx: Ctx, b: FrontBox): void {
  const { top, bottom } = BANDS.wall;
  const g = ctx.createLinearGradient(0, top, 0, bottom);
  g.addColorStop(0, PAL.wallHi); g.addColorStop(0.12, PAL.wall); g.addColorStop(1, '#154f68');
  ctx.fillStyle = g; ctx.fillRect(b.x0, top, b.x1 - b.x0, bottom - top);
  ctx.fillStyle = PAL.wallStripe; ctx.fillRect(b.x0, top + 20, b.x1 - b.x0, 4);
  ctx.fillStyle = 'rgba(255,255,255,0.12)';
  for (let x = b.x0; x < b.x1; x += 96) ctx.fillRect(x, top + 6, 48, 10); // plain panel stripes, no lettering
  ctx.fillStyle = 'rgba(0,0,0,0.28)'; ctx.fillRect(b.x0, bottom - 4, b.x1 - b.x0, 4);
}

function ground(ctx: Ctx, b: FrontBox): void {
  const y0 = BANDS.courtFar;
  const ap = ctx.createLinearGradient(0, y0, 0, b.bottom);
  ap.addColorStop(0, PAL.apronDark); ap.addColorStop(1, PAL.apron);
  ctx.fillStyle = ap; ctx.fillRect(b.x0, y0, b.x1 - b.x0, b.bottom - y0);
  const cx = b.worldW / 2;
  const yb = b.bottom;
  const c = ctx.createLinearGradient(0, y0, 0, yb);
  c.addColorStop(0, PAL.courtDark); c.addColorStop(0.6, PAL.court); c.addColorStop(1, PAL.courtLight);
  ctx.fillStyle = c;
  ctx.beginPath();
  ctx.moveTo(laneX(cx, b.worldW, -1.18, y0), y0); ctx.lineTo(laneX(cx, b.worldW, 1.18, y0), y0);
  ctx.lineTo(laneX(cx, b.worldW, 1.18, yb), yb); ctx.lineTo(laneX(cx, b.worldW, -1.18, yb), yb);
  ctx.closePath(); ctx.fill();
  speckle(ctx, b, cx);
  lines(ctx, b, cx);
  const sun = ctx.createRadialGradient(cx + b.worldW * 0.18, 560, 10, cx + b.worldW * 0.18, 560, b.worldW * 0.6);
  sun.addColorStop(0, 'rgba(255,245,200,0.12)'); sun.addColorStop(1, 'rgba(255,245,200,0)');
  ctx.fillStyle = sun; ctx.fillRect(b.x0, y0, b.x1 - b.x0, yb - y0);
}

function speckle(ctx: Ctx, b: FrontBox, cx: number): void {
  const rnd = mulberry32(5);
  ctx.fillStyle = 'rgba(255,255,255,0.07)';
  for (let i = 0; i < 520; i++) {
    const y = BANDS.courtFar + rnd() * (b.bottom - BANDS.courtFar);
    const x = laneX(cx, b.worldW, (rnd() - 0.5) * 2.2, y);
    ctx.fillRect(x, y, 1.6 + (y - 300) * 0.006, 1.2);
  }
}

function lines(ctx: Ctx, b: FrontBox, cx: number): void {
  ctx.fillStyle = PAL.line;
  const seg = (f: number): void => {
    const y0 = BANDS.courtFar + 8;
    const y1 = b.bottom;
    const w0 = 2.2; const w1 = 2.2 + (y1 - 300) * 0.018;
    const xa = laneX(cx, b.worldW, f, y0); const xb = laneX(cx, b.worldW, f, y1);
    ctx.beginPath(); ctx.moveTo(xa - w0, y0); ctx.lineTo(xa + w0, y0); ctx.lineTo(xb + w1, y1); ctx.lineTo(xb - w1, y1); ctx.closePath(); ctx.fill();
  };
  for (const f of [-1, -0.72, 0.72, 1]) seg(f);
  const bar = (y: number): void => {
    const t = 1.6 + (y - 300) * 0.012;
    ctx.beginPath();
    ctx.moveTo(laneX(cx, b.worldW, -1, y), y - t); ctx.lineTo(laneX(cx, b.worldW, 1, y), y - t);
    ctx.lineTo(laneX(cx, b.worldW, 1, y), y + t); ctx.lineTo(laneX(cx, b.worldW, -1, y), y + t); ctx.fill();
  };
  bar(BANDS.courtFar + 12); bar(BANDS.serviceY);
}

/** Far-court net: translucent mesh, white tape, posts. Purely scenery, sits behind the ball plane. */
function net(ctx: Ctx, b: FrontBox): void {
  const cx = b.worldW / 2;
  const y = 484; const h = 28;
  const xl = laneX(cx, b.worldW, -1.12, y); const xr = laneX(cx, b.worldW, 1.12, y);
  ctx.fillStyle = 'rgba(10,25,45,0.28)'; ctx.fillRect(xl, y - h, xr - xl, h);
  ctx.strokeStyle = 'rgba(255,255,255,0.3)'; ctx.lineWidth = 1;
  ctx.beginPath();
  for (let x = xl; x < xr; x += 9) { ctx.moveTo(x, y - h); ctx.lineTo(x, y); }
  for (let yy = y - h + 7; yy < y; yy += 7) { ctx.moveTo(xl, yy); ctx.lineTo(xr, yy); }
  ctx.stroke();
  ctx.fillStyle = PAL.line; ctx.fillRect(xl, y - h - 3, xr - xl, 4);
  ctx.fillStyle = '#c3cfd8';
  for (const x of [xl, xr]) ctx.fillRect(x - 3, y - h - 5, 6, h + 14);
  const sh = ctx.createLinearGradient(0, y, 0, y + 14);
  sh.addColorStop(0, 'rgba(0,0,0,0.25)'); sh.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = sh; ctx.fillRect(xl, y, xr - xl, 14);
}

function sideWalls(ctx: Ctx, b: FrontBox): void {
  const left = b.x0; const right = b.x1;
  const hedge = (x0: number, x1: number): void => {
    if (x1 - x0 < 1) return;
    const g = ctx.createLinearGradient(0, 250, 0, b.bottom);
    g.addColorStop(0, PAL.hedgeHi); g.addColorStop(1, PAL.hedge);
    ctx.fillStyle = g; ctx.fillRect(x0, 250, x1 - x0, b.bottom - 250);
    const rnd = mulberry32(9);
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    for (let i = 0; i < 160; i++) { ctx.beginPath(); ctx.arc(x0 + rnd() * (x1 - x0), 250 + rnd() * (b.bottom - 250), 2 + rnd() * 3, 0, 7); ctx.fill(); }
  };
  hedge(left, 0); hedge(b.worldW, right);
  for (const x of [0, b.worldW]) {
    const dir = x === 0 ? 1 : -1;
    const g = ctx.createLinearGradient(x, 0, x + dir * 14, 0);
    g.addColorStop(0, 'rgba(244,248,251,0.95)'); g.addColorStop(0.35, 'rgba(210,225,236,0.75)'); g.addColorStop(1, 'rgba(210,225,236,0)');
    ctx.fillStyle = g; ctx.fillRect(dir > 0 ? x : x - 14, 250, 14, b.bottom - 250);
    ctx.fillStyle = PAL.post; ctx.fillRect(dir > 0 ? x : x - 4, 250, 4, b.bottom - 250);
  }
}

export function drawFront(ctx: Ctx, b: FrontBox): void {
  backWall(ctx, b);
  ground(ctx, b);
  net(ctx, b);
  sideWalls(ctx, b);
}
