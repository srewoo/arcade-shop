// Distant scenery: lit mountains with snow caps, haze, and a patchwork of fields in perspective.
import { PALETTE as P } from '../palette';
import type { World } from '../world';
import type { Visible } from './scene';

const hash = (n: number): number => {
  const x = Math.sin(n * 91.3 + 7.7) * 43758.5453;
  return x - Math.floor(x);
};

/** Peak height at x, as a fraction of `amp` (two noise octaves plus a few tall peaks). */
function peakAt(x: number, worldW: number): number {
  const k = x / worldW;
  const tall = Math.max(0, Math.sin(k * 9 + 0.6)) ** 3;
  return 0.35 + 0.25 * Math.sin(k * 5 + 0.4) + 0.15 * Math.sin(k * 19 + 1.1) + 0.45 * tall;
}

export function mountains(ctx: CanvasRenderingContext2D, w: World, v: Visible, base: number): void {
  const amp = w.h * 0.3;
  const top = base - amp * 1.1;
  const step = 8;
  const body = ctx.createLinearGradient(0, top, 0, base);
  body.addColorStop(0, P.mountainLit);
  body.addColorStop(0.6, P.hillFar);
  body.addColorStop(1, P.mountainShade);
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.moveTo(v.x0, base + 10);
  for (let x = v.x0; x <= v.x1 + step; x += step) ctx.lineTo(x, base - amp * peakAt(x, w.w));
  ctx.lineTo(v.x1 + step, base + 10);
  ctx.closePath();
  ctx.fill();
  // Soft shading on the right-hand slope of the tall peaks.
  const shade = ctx.createLinearGradient(0, top, 0, base);
  shade.addColorStop(0, 'rgba(36,56,84,0)');
  shade.addColorStop(1, 'rgba(36,56,84,0.32)');
  ctx.fillStyle = shade;
  ctx.beginPath();
  ctx.moveTo(v.x0, base);
  for (let x = v.x0; x <= v.x1 + step; x += step) ctx.lineTo(x, base - amp * peakAt(x, w.w) * 0.55 - 6);
  ctx.lineTo(v.x1 + step, base);
  ctx.closePath();
  ctx.fill();
  // Snow caps: one smooth polygon per run of tall ridge, with a ragged lower edge.
  ctx.fillStyle = P.snow;
  let run: number[] = [];
  const flush = (): void => {
    if (run.length < 2) { run = []; return; }
    ctx.beginPath();
    for (const x of run) ctx.lineTo(x, base - amp * peakAt(x, w.w));
    for (let i = run.length - 1; i >= 0; i--) {
      const x = run[i] as number;
      const a = peakAt(x, w.w);
      ctx.lineTo(x, base - amp * a + (a - 0.88) * amp * 0.5 * (0.5 + hash(x * 0.1) * 0.5) + 3);
    }
    ctx.closePath();
    ctx.fill();
    run = [];
  };
  for (let x = v.x0; x <= v.x1 + step; x += step) {
    if (peakAt(x, w.w) > 0.9) run.push(x);
    else flush();
  }
  flush();
  const haze = ctx.createLinearGradient(0, base - amp * 0.6, 0, base);
  haze.addColorStop(0, 'rgba(220,236,245,0)');
  haze.addColorStop(1, 'rgba(220,236,245,0.7)');
  ctx.fillStyle = haze;
  ctx.fillRect(v.x0, base - amp * 0.6, v.x1 - v.x0, amp * 0.6 + 10);
}

/** Patchwork of crops between the hills and the near field: bands that converge toward the horizon. */
export function farmland(ctx: CanvasRenderingContext2D, w: World, v: Visible, hz: number): void {
  const top = hz - w.h * 0.045;
  const bottom = hz + w.h * 0.03;
  const colors = ['#8db160', '#b5b068', P.hay, '#6f9a52', '#9fb868', '#7fa457'];
  const step = w.w * 0.07;
  for (let x = v.x0 - step; x < v.x1 + step; x += step) {
    const i = Math.floor((x + 5000) / step);
    const wid = step * (0.7 + hash(i) * 0.9);
    ctx.fillStyle = colors[i % colors.length] ?? P.hay;
    ctx.beginPath();
    ctx.moveTo(x + wid * 0.12, top);
    ctx.lineTo(x + wid * 0.88, top);
    ctx.lineTo(x + wid * 1.2, bottom);
    ctx.lineTo(x - wid * 0.2, bottom);
    ctx.fill();
    ctx.strokeStyle = 'rgba(30,50,20,0.14)';
    ctx.lineWidth = 1;
    for (let f = 1; f < 5; f++) {
      const t = f / 5;
      ctx.beginPath();
      ctx.moveTo(x + wid * (0.12 + 0.76 * t), top);
      ctx.lineTo(x + wid * (-0.2 + 1.4 * t), bottom);
      ctx.stroke();
    }
  }
  const mist = ctx.createLinearGradient(0, top, 0, bottom);
  mist.addColorStop(0, 'rgba(214,232,240,0.6)');
  mist.addColorStop(1, 'rgba(214,232,240,0)');
  ctx.fillStyle = mist;
  ctx.fillRect(v.x0, top, v.x1 - v.x0, bottom - top);
}
