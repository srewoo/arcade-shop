// Composes one frame. State is interpolated by alpha between the previous and current step.
import { lerp } from './clock';
import { CONFIG } from './config';
import { PALETTE } from './palette';
import { drawPickup, drawPlayer, drawTraffic } from './renderCar';
import { drawFx, shakeOffset, type Fx } from './renderFx';
import { drawComboMeter, drawPayoff } from './renderOverlay';
import { drawRoad, drawSpeedLines, drawVignette } from './renderRoad';
import { drawShowcase, showcaseZ } from './renderShowcase';
import type { Sim } from './simTypes';
import { view as V } from './viewport';

export interface RenderOpts { assist: boolean; reduce: boolean; time: number; alpha: number; countdown: boolean; title?: boolean }

/** Screen y for a world distance relative to the (interpolated) player. */
export const screenY = (rel: number): number => V.playerY - rel * V.pxPerU;
export const laneX = (lane: number): number => V.roadLeft + (lane + 0.5) * V.laneW;
export const roadX = (x: number): number => V.roadLeft + x * V.laneW;

function drawCountdown(g: CanvasRenderingContext2D, s: Sim): void {
  const n = Math.ceil(s.countdown / CONFIG.countdownBeat - 1e-9);
  g.font = 'bold 96px system-ui, sans-serif';
  g.textAlign = 'center';
  g.lineWidth = 8;
  g.strokeStyle = PALETTE.ink;
  g.fillStyle = PALETTE.text;
  const text = s.phase === 'countdown' ? String(n) : 'GO!';
  const cx = V.roadLeft + (V.laneW * CONFIG.lanes) / 2;
  g.strokeText(text, cx, V.playerY - 200);
  g.fillText(text, cx, V.playerY - 200);
}

function drawFinishLine(g: CanvasRenderingContext2D, s: Sim, zi: number): void {
  if (s.mode !== 'trial') return;
  const seg = CONFIG.trial.length / CONFIG.trial.checkpoints;
  const nextZ = (s.checkpoint + 1) * seg;
  const y = screenY(nextZ - zi);
  if (y < -20 || y > V.height) return;
  const last = s.checkpoint + 1 >= CONFIG.trial.checkpoints;
  const w = V.laneW * CONFIG.lanes;
  for (let i = 0; i < 20; i++) {
    g.fillStyle = (i + (last ? 1 : 0)) % 2 === 0 ? PALETTE.text : PALETTE.ink;
    g.fillRect(V.roadLeft + (i * w) / 20, y - 6, w / 20, 12);
  }
}

function drawTitleScene(g: CanvasRenderingContext2D, o: RenderOpts): void {
  drawRoad(g, showcaseZ(o.time, o.reduce), !o.reduce);
  drawShowcase(g, o.time, o.reduce);
  drawVignette(g, 40, o.reduce);
}

export function draw(g: CanvasRenderingContext2D, s: Sim, fx: Fx, o: RenderOpts): void {
  if (o.title) {
    drawTitleScene(g, o);
    return;
  }
  const zi = lerp(s.pz, s.z, o.alpha);
  const xi = lerp(s.px, s.x, o.alpha);
  g.save();
  const [sx, sy] = shakeOffset(fx, o.time);
  g.translate(sx, sy);
  drawRoad(g, zi, !o.reduce);
  drawFinishLine(g, s, zi);
  for (const p of s.pickups) {
    g.save();
    g.translate(laneX(p.lane), screenY(p.z - zi));
    drawPickup(g, p, o.assist, o.reduce ? 0 : o.time);
    g.restore();
  }
  for (const c of s.cars) {
    g.save();
    g.translate(laneX(c.lane), screenY(lerp(c.pz, c.z, o.alpha) - zi));
    drawTraffic(g, c, 32, c.len * V.pxPerU);
    g.restore();
  }
  g.save();
  g.translate(roadX(xi), V.playerY);
  const blink = s.invuln > 0 && (o.reduce || Math.floor(o.time * 10) % 2 === 0);
  drawPlayer(g, { w: 32, h: 52, blink, boost: s.boost > 0, assist: o.assist, time: o.time });
  g.restore();
  if (!o.reduce) drawSpeedLines(g, s.speed, zi, s.boost > 0);
  drawVignette(g, s.speed, o.reduce);
  drawFx(g, fx);
  drawComboMeter(g, s, roadX(xi), o.assist);
  g.restore();
  drawPayoff(g, s, o.reduce);
  if (o.countdown && (s.phase === 'countdown' || (s.phase === 'run' && s.runT < 0.7))) drawCountdown(g, s);
}
