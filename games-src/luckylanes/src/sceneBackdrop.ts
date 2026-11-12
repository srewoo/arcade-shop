// Arcade hall behind the lane: ceiling light rows, neon haze, bokeh, the pinsetter housing and the sign.
import { LANE_HALF, PIT_Y, SIDE_WALL } from './constants';
import { memoGradient } from './gradients';
import { project, type Camera } from './project';
import { BACK_Y, floorStrip, hash01, poly, type Ctx } from './sceneGeo';

const BOKEH = ['255,92,174', '77,216,255', '182,155,255', '255,210,90'] as const;

function ceiling(ctx: Ctx, w: number, h: number, cam: Camera): void {
  // Light bars converge on the vanishing point: rows of lamps on the ceiling.
  const vx = cam.cx;
  const vy = cam.horizon;
  for (let r = 0; r < 7; r++) {
    const t = Math.pow(0.62, r);
    const y = vy - (vy + 20) * t;
    const half = w * 0.42 * t;
    const bw = Math.max(6, half * 0.7);
    const bh = Math.max(1.5, 10 * t);
    ctx.fillStyle = `rgba(190,170,255,${0.1 + 0.22 * t})`;
    ctx.fillRect(vx - bw / 2, y, bw, bh);
    ctx.fillStyle = `rgba(255,92,174,${0.05 + 0.14 * t})`;
    ctx.fillRect(vx - half - bw / 2, y, bw, bh);
    ctx.fillRect(vx + half - bw / 2, y, bw, bh);
  }
  ctx.strokeStyle = 'rgba(160,140,255,0.1)';
  ctx.lineWidth = 1;
  for (const k of [-1.3, -0.7, 0.7, 1.3]) {
    ctx.beginPath();
    ctx.moveTo(vx, vy);
    ctx.lineTo(vx + k * w, -20);
    ctx.stroke();
  }
  void h;
}

function bokeh(ctx: Ctx, w: number, cam: Camera): void {
  const sprite = (c: string): CanvasGradient => memoGradient(`bk|${c}`, () => {
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, 1);
    g.addColorStop(0, `rgba(${c},0.55)`);
    g.addColorStop(0.6, `rgba(${c},0.16)`);
    g.addColorStop(1, `rgba(${c},0)`);
    return g;
  });
  for (let i = 0; i < 26; i++) {
    const side = i % 2 === 0 ? -1 : 1;
    const x = cam.cx + side * (w * (0.22 + hash01(i * 1.7) * 0.3));
    const y = cam.horizon * (0.18 + hash01(i * 2.3) * 0.8);
    const r = 5 + hash01(i * 3.9) * 16;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(r, r);
    ctx.fillStyle = sprite(BOKEH[i % BOKEH.length] as string);
    ctx.beginPath();
    ctx.arc(0, 0, 1, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

export function drawBackdrop(ctx: Ctx, w: number, h: number, cam: Camera): void {
  const g = memoGradient(`bd|${w}|${h}|${Math.round(cam.horizon)}`, () => {
    const lg = ctx.createLinearGradient(0, 0, 0, h);
    lg.addColorStop(0, '#07061a');
    lg.addColorStop(Math.min(0.7, Math.max(0.2, cam.horizon / h)), '#2a1658');
    lg.addColorStop(1, '#0a0919');
    return lg;
  });
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  ceiling(ctx, w, h, cam);
  bokeh(ctx, w, cam);
  const glow = memoGradient(`glow|${w}|${cam.cx}|${Math.round(cam.horizon)}`, () => {
    const rg = ctx.createRadialGradient(cam.cx, cam.horizon, 4, cam.cx, cam.horizon, w * 0.85);
    rg.addColorStop(0, 'rgba(255,110,190,0.42)');
    rg.addColorStop(0.45, 'rgba(120,80,255,0.15)');
    rg.addColorStop(1, 'rgba(0,0,0,0)');
    return rg;
  });
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, w, h);
}

function pinIcon(ctx: Ctx, x: number, y: number, s: number): void {
  ctx.beginPath();
  ctx.moveTo(x, y - s);
  ctx.bezierCurveTo(x + s * 0.28, y - s, x + s * 0.3, y - s * 0.55, x + s * 0.17, y - s * 0.42);
  ctx.bezierCurveTo(x + s * 0.5, y - s * 0.05, x + s * 0.34, y + s * 0.7, x, y + s * 0.7);
  ctx.bezierCurveTo(x - s * 0.34, y + s * 0.7, x - s * 0.5, y - s * 0.05, x - s * 0.17, y - s * 0.42);
  ctx.bezierCurveTo(x - s * 0.3, y - s * 0.55, x - s * 0.28, y - s, x, y - s);
  ctx.closePath();
}

/** Pit, pinsetter housing, glowing sign and the shadow it throws over the deck. */
export function drawPitAndBack(ctx: Ctx, cam: Camera): void {
  floorStrip(ctx, cam, -SIDE_WALL, SIDE_WALL, PIT_Y, BACK_Y, '#07050f');
  const top = project(cam, 0, BACK_Y, 150).sy;
  const bot = project(cam, 0, BACK_Y, 0).sy;
  const g = ctx.createLinearGradient(0, top, 0, bot);
  g.addColorStop(0, '#271c66');
  g.addColorStop(1, '#0b0920');
  poly(ctx, cam, [[-SIDE_WALL, BACK_Y, 0], [SIDE_WALL, BACK_Y, 0], [SIDE_WALL, BACK_Y, 150], [-SIDE_WALL, BACK_Y, 150]], g);
  // Pit curtain: dark vertical slats with a lit lower edge.
  const l = project(cam, -LANE_HALF, BACK_Y, 0);
  const r = project(cam, LANE_HALF, BACK_Y, 0);
  const cTop = project(cam, 0, BACK_Y, 52).sy;
  for (let i = 0; i < 12; i++) {
    ctx.fillStyle = i % 2 ? 'rgba(12,8,30,0.9)' : 'rgba(28,18,64,0.9)';
    ctx.fillRect(l.sx + ((r.sx - l.sx) * i) / 12, cTop, (r.sx - l.sx) / 12 + 0.5, bot - cTop);
  }
  const lit = project(cam, 0, BACK_Y, 56);
  ctx.fillStyle = 'rgba(255,92,174,0.5)';
  ctx.fillRect(l.sx, lit.sy - 1, r.sx - l.sx, Math.max(1.5, lit.s * 1.2));
  // Sign: neon plate with a pin icon.
  const sign = project(cam, 0, BACK_Y, 108);
  const px = Math.max(8, sign.s * 12);
  const plate = sign.s * 112;
  ctx.fillStyle = 'rgba(10,6,32,0.85)';
  ctx.strokeStyle = '#4dd8ff';
  ctx.lineWidth = Math.max(1, sign.s * 0.8);
  ctx.beginPath();
  ctx.roundRect(sign.sx - plate / 2, sign.sy - px * 1.1, plate, px * 2.2, px * 0.5);
  ctx.fill();
  ctx.save();
  ctx.shadowColor = '#4dd8ff';
  ctx.shadowBlur = px * 0.6;
  ctx.stroke();
  ctx.restore();
  ctx.font = `800 ${px}px system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = '#ff4fa3';
  ctx.shadowBlur = px * 0.7;
  ctx.fillStyle = '#ffd1ea';
  ctx.fillText('LUCKY LANES', sign.sx + px * 0.5, sign.sy);
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#ffffff';
  pinIcon(ctx, sign.sx - plate / 2 + px * 1.1, sign.sy, px * 0.85);
  ctx.fill();
}
