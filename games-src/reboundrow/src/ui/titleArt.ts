// Animated demo scene for the title screen: a ball bouncing under a brick wall, paddle tracking it.
import { PALETTE } from '../palette';
import { roundRect } from './drawBricks';
import { starfield } from './stars';

export const ART = { w: 360, h: 200, cols: 9, rows: 4, bw: 36, bh: 14, top: 18, ball: 6, padW: 64, padY: 176 } as const;

/** Triangle wave 0..1..0 with the given period. */
export const tri = (t: number, period: number): number => {
  const p = ((t % period) + period) % period / period;
  return p < 0.5 ? p * 2 : 2 - p * 2;
};

export interface DemoBall { x: number; y: number; hitCol: number | null }

/** Pure ball path: bounces between the side walls, the brick floor and the paddle. */
export function demoBall(t: number): DemoBall {
  const minX = ART.ball + 2;
  const maxX = ART.w - ART.ball - 2;
  const minY = ART.top + ART.rows * ART.bh + ART.ball + 2;
  const maxY = ART.padY - ART.ball;
  const x = minX + tri(t, 3.1) * (maxX - minX);
  const ty = tri(t, 1.7);
  const y = minY + ty * (maxY - minY);
  const atTop = ty < 0.06;
  const col = Math.min(ART.cols - 1, Math.max(0, Math.floor((x - 0) / ART.bw)));
  return { x, y, hitCol: atTop ? col : null };
}

/** Which bricks are currently "broken": each column re-grows 2.4 s after the ball last tapped it. */
export function brickAlive(col: number, row: number, t: number): boolean {
  const cycle = 2.4 + row * 0.35;
  const phase = (t * 0.9 + col * 1.37 + row * 0.61) % (cycle * 2);
  return phase > cycle * 0.5 || (col + row) % 3 === 0;
}

const STARS = starfield(40, 5);

function glossBrick(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, hue: string): void {
  roundRect(ctx, x, y + 1.5, w, h, 3.5);
  ctx.fillStyle = 'rgba(2,4,18,0.55)';
  ctx.fill();
  roundRect(ctx, x, y, w, h, 3.5);
  ctx.fillStyle = hue;
  ctx.fill();
  ctx.save();
  ctx.clip();
  const g = ctx.createLinearGradient(0, y, 0, y + h);
  g.addColorStop(0, 'rgba(255,255,255,0.5)');
  g.addColorStop(0.5, 'rgba(255,255,255,0.03)');
  g.addColorStop(1, 'rgba(6,10,36,0.45)');
  ctx.fillStyle = g;
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.fillRect(x + 3, y + 0.8, w - 6, 1);
  ctx.restore();
}

function drawBackground(ctx: CanvasRenderingContext2D, t: number, reduced: boolean): void {
  const g = ctx.createLinearGradient(0, 0, 0, ART.h);
  g.addColorStop(0, '#1b2358');
  g.addColorStop(1, PALETTE.field);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, ART.w, ART.h);
  const neb = ctx.createRadialGradient(ART.w * 0.35, ART.h * 0.3, 0, ART.w * 0.35, ART.h * 0.3, ART.w * 0.6);
  neb.addColorStop(0, 'rgba(138,108,240,0.35)');
  neb.addColorStop(1, 'rgba(138,108,240,0)');
  ctx.fillStyle = neb;
  ctx.fillRect(0, 0, ART.w, ART.h);
  for (const s of STARS) {
    const tw = reduced ? 0.7 : 0.5 + 0.5 * Math.sin(t * (1 + s.depth * 2) + s.phase);
    ctx.fillStyle = `rgba(210,222,255,${(0.2 + s.depth * 0.5) * tw})`;
    ctx.fillRect(s.x * ART.w, s.y * ART.h, 1 + s.depth, 1 + s.depth);
  }
  const lane = ctx.createLinearGradient(0, ART.h - 40, 0, ART.h);
  lane.addColorStop(0, 'rgba(138,108,240,0)');
  lane.addColorStop(1, 'rgba(138,108,240,0.3)');
  ctx.fillStyle = lane;
  ctx.fillRect(0, ART.h - 40, ART.w, 40);
}

function drawBall(ctx: CanvasRenderingContext2D, x: number, y: number, reduced: boolean): void {
  const halo = ctx.createRadialGradient(x, y, 0, x, y, ART.ball * 3.4);
  halo.addColorStop(0, 'rgba(200,215,255,0.7)');
  halo.addColorStop(1, 'rgba(200,215,255,0)');
  ctx.fillStyle = halo;
  ctx.fillRect(x - ART.ball * 3.4, y - ART.ball * 3.4, ART.ball * 6.8, ART.ball * 6.8);
  void reduced;
  const sph = ctx.createRadialGradient(x - 2, y - 2.4, 0.5, x, y, ART.ball);
  sph.addColorStop(0, '#ffffff');
  sph.addColorStop(0.6, '#e4eaff');
  sph.addColorStop(1, '#8c9cf0');
  ctx.beginPath();
  ctx.arc(x, y, ART.ball, 0, Math.PI * 2);
  ctx.fillStyle = sph;
  ctx.fill();
}

export function drawTitleArt(ctx: CanvasRenderingContext2D, now: number, reduced: boolean): void {
  const t = reduced ? 1.2 : now;
  const k = ctx.canvas.width / ART.w;
  ctx.setTransform(k, 0, 0, k, 0, 0);
  drawBackground(ctx, t, reduced);
  for (let r = 0; r < ART.rows; r++) {
    for (let c = 0; c < ART.cols; c++) {
      if (!brickAlive(c, r, t)) continue;
      glossBrick(ctx, c * ART.bw + 2, ART.top + r * ART.bh + 2, ART.bw - 4, ART.bh - 4, PALETTE.rows[(r + 1) % PALETTE.rows.length] as string);
    }
  }
  const ball = demoBall(t);
  if (ball.hitCol !== null && !reduced) {
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.fillRect(ball.hitCol * ART.bw, ART.top + ART.rows * ART.bh - 2, ART.bw, 3);
  }
  const padX = Math.max(ART.padW / 2 + 2, Math.min(ART.w - ART.padW / 2 - 2, ball.x));
  const pg = ctx.createLinearGradient(0, ART.padY, 0, ART.padY + 9);
  pg.addColorStop(0, '#ffffff');
  pg.addColorStop(0.6, '#9aa8ee');
  pg.addColorStop(1, '#5a68b4');
  const under = ctx.createRadialGradient(padX, ART.padY + 9, 0, padX, ART.padY + 9, ART.padW * 0.7);
  under.addColorStop(0, 'rgba(138,108,240,0.55)');
  under.addColorStop(1, 'rgba(138,108,240,0)');
  ctx.fillStyle = under;
  ctx.fillRect(padX - ART.padW, ART.padY - 4, ART.padW * 2, 30);
  roundRect(ctx, padX - ART.padW / 2, ART.padY, ART.padW, 9, 4.5);
  ctx.fillStyle = pg;
  ctx.fill();
  drawBall(ctx, ball.x, ball.y, reduced);
  const vig = ctx.createRadialGradient(ART.w / 2, ART.h / 2, ART.h * 0.4, ART.w / 2, ART.h / 2, ART.w * 0.62);
  vig.addColorStop(0, 'rgba(0,0,0,0)');
  vig.addColorStop(1, 'rgba(3,5,16,0.2)');
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, ART.w, ART.h);
  ctx.strokeStyle = PALETTE.edge;
  ctx.lineWidth = 3;
  ctx.strokeRect(1.5, 1.5, ART.w - 3, ART.h - 3);
}
