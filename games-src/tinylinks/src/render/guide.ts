// Aim guide: a dotted path predicted with the real physics (bounces included), a power label and a putter.
import { CONFIG } from '../config';
import type { Aim } from '../game/aim';
import type { Sim } from '../physics/sim';
import { PAL, POWER_HIGH, POWER_LOW } from './palette';

interface Dot { x: number; y: number }
const dots: Dot[] = [];
const SPACING = 9;

/** Walk a copy of the sim and collect evenly spaced points along the first `length` units. */
export function predictPath(sim: Sim, aim: Aim, length: number): Dot[] {
  dots.length = 0;
  const t = sim.clone();
  if (!t.strike(aim.angle, Math.max(aim.power, CONFIG.shot.minPower))) return dots;
  let travelled = 0;
  let sinceDot = SPACING - 4;
  let px = t.ball.x;
  let py = t.ball.y;
  for (let i = 0; i < 600 && t.state === 'rolling' && travelled < length; i++) {
    t.step();
    const d = Math.hypot(t.ball.x - px, t.ball.y - py);
    travelled += d; sinceDot += d; px = t.ball.x; py = t.ball.y;
    if (sinceDot >= SPACING) { sinceDot = 0; dots.push({ x: px, y: py }); }
  }
  return dots;
}

const lerpHex = (a: string, b: string, k: number): string => {
  const pa = parseInt(a.slice(1), 16);
  const pb = parseInt(b.slice(1), 16);
  const ch = (s: number): number => Math.round(((pa >> s) & 255) * (1 - k) + ((pb >> s) & 255) * k);
  return `rgb(${ch(16)},${ch(8)},${ch(0)})`;
}

export function drawGuide(ctx: CanvasRenderingContext2D, sim: Sim, aim: Aim, time: number, unrotate: number, reduced: boolean): void {
  const len = CONFIG.aim.guideBase + CONFIG.aim.guideSpan * aim.power;
  const pts = predictPath(sim, aim, len);
  const col = lerpHex(POWER_LOW, POWER_HIGH, aim.power);
  const pulse = reduced ? 0 : Math.sin(time * 6) * 0.4;
  pts.forEach((p, i) => {
    const k = 1 - (i / Math.max(1, pts.length)) * 0.55;
    ctx.beginPath(); ctx.arc(p.x, p.y, (2.5 + pulse * 0.2) * k + 0.6, 0, Math.PI * 2);
    ctx.fillStyle = PAL.guideEdge; ctx.globalAlpha = 0.55; ctx.fill();
    ctx.beginPath(); ctx.arc(p.x, p.y, 2 * k + 0.2, 0, Math.PI * 2);
    ctx.fillStyle = PAL.guide; ctx.globalAlpha = 0.95; ctx.fill();
  });
  ctx.globalAlpha = 1;
  const end = pts[pts.length - 1];
  if (!end) return;
  const prev = pts[pts.length - 2] ?? { x: sim.ball.x, y: sim.ball.y };
  const ang = Math.atan2(end.y - prev.y, end.x - prev.x);
  ctx.save();
  ctx.translate(end.x, end.y);
  ctx.rotate(ang);
  ctx.beginPath(); ctx.moveTo(8, 0); ctx.lineTo(-3, -6); ctx.lineTo(-1, 0); ctx.lineTo(-3, 6); ctx.closePath();
  ctx.fillStyle = col; ctx.fill();
  ctx.lineWidth = 1.6; ctx.lineJoin = 'round'; ctx.strokeStyle = PAL.guideEdge; ctx.stroke();
  ctx.rotate(-ang + unrotate);
  const label = `${Math.round(aim.power * 100)}%`;
  ctx.font = '800 11px ui-rounded, system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.lineWidth = 3.4; ctx.strokeStyle = PAL.guideEdge; ctx.lineJoin = 'round';
  ctx.strokeText(label, 0, -12); ctx.fillStyle = '#fff'; ctx.fillText(label, 0, -12);
  ctx.restore();
}

/** A putter pulled back behind the ball: the further back, the harder the shot. */
export function drawPutter(ctx: CanvasRenderingContext2D, ball: { x: number; y: number }, aim: Aim): void {
  const back = CONFIG.ball.r + 5 + aim.power * 30;
  ctx.save();
  ctx.translate(ball.x, ball.y);
  ctx.rotate(aim.angle);
  ctx.translate(-back, 0);
  ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(-1, 0); ctx.lineTo(-52, -24);
  ctx.lineWidth = 3.4; ctx.strokeStyle = 'rgba(0,0,0,0.28)'; ctx.translate(2.5, 3.5); ctx.stroke(); ctx.translate(-2.5, -3.5);
  ctx.lineWidth = 2.6; ctx.strokeStyle = '#c9d2d8'; ctx.stroke();
  ctx.lineWidth = 1; ctx.strokeStyle = '#ffffff'; ctx.stroke();
  ctx.beginPath(); ctx.roundRect(-3.5, -10, 5, 20, 1.6);
  const g = ctx.createLinearGradient(-3.5, 0, 1.5, 0);
  g.addColorStop(0, '#6e7a84'); g.addColorStop(0.5, '#e9eef2'); g.addColorStop(1, '#8c98a2');
  ctx.fillStyle = g; ctx.fill();
  ctx.lineWidth = 1; ctx.strokeStyle = '#1c262d'; ctx.stroke();
  ctx.fillStyle = '#f3b13a'; ctx.fillRect(0.4, -1.1, 1.4, 2.2);
  ctx.restore();
}
