// Animated scenery on top of the cached backdrop: light shafts, lighthouse beam, swaying kelp,
// lantern flicker, lightning, aurora shimmer and drifting particles. All stateless (a function of time).
// Reduce motion freezes them at t = 0.
import { CONFIG } from '../config';
import type { Theme } from '../sim/types';
import { LIGHTHOUSE } from './sceneryA';
import { LANTERNS } from './sceneryB';
import { glow } from './sceneKit';
import { THEME_ART } from './themes';
import type { View } from './view';

const { floorY } = CONFIG.world;
const hash = (i: number): number => { const s = Math.sin(i * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };

function shafts(ctx: CanvasRenderingContext2D, v: View, t: number, tint: string): void {
  for (let i = 0; i < 5; i++) {
    const x = v.x0 + (v.x1 - v.x0) * (0.1 + 0.2 * i) + Math.sin(t * 0.25 + i * 1.7) * 18;
    const w = 26 + hash(i) * 30;
    const g = ctx.createLinearGradient(x, v.y0, x + 60, floorY);
    g.addColorStop(0, tint); g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.globalAlpha = 0.1 + 0.05 * Math.sin(t * 0.7 + i);
    ctx.beginPath(); ctx.moveTo(x, v.y0); ctx.lineTo(x + w, v.y0); ctx.lineTo(x + w + 90, floorY); ctx.lineTo(x + 20, floorY); ctx.closePath(); ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function lighthouseBeam(ctx: CanvasRenderingContext2D, t: number): void {
  const { x, lampY } = LIGHTHOUSE;
  const c = Math.cos(t * 0.8);
  const len = 520 * Math.abs(c);
  const dir = c >= 0 ? 1 : -1;
  const g = ctx.createLinearGradient(x, 0, x + dir * Math.max(40, len), 0);
  g.addColorStop(0, 'rgba(255,236,170,0.5)'); g.addColorStop(1, 'rgba(255,236,170,0)');
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.moveTo(x, lampY + 10); ctx.lineTo(x + dir * len, lampY - 26 - 20 * Math.abs(c)); ctx.lineTo(x + dir * len, lampY + 46 + 20 * Math.abs(c)); ctx.closePath(); ctx.fill();
}

function kelpSway(ctx: CanvasRenderingContext2D, v: View, t: number): void {
  ctx.lineCap = 'round';
  for (let i = 0; i < 9; i++) {
    const x = v.x0 + (v.x1 - v.x0) * (i / 8.4) + hash(i) * 20;
    const h = 90 + hash(i + 9) * 90;
    ctx.strokeStyle = i % 2 ? '#1f8a5a' : '#176f4a';
    ctx.lineWidth = 4 + hash(i + 3) * 3;
    ctx.beginPath(); ctx.moveTo(x, floorY + 2);
    for (let k = 1; k <= 8; k++) ctx.lineTo(x + Math.sin(t * 1.1 + i + k * 0.55) * (k * 1.7), floorY - (h * k) / 8);
    ctx.stroke();
  }
}

function lanternFlicker(ctx: CanvasRenderingContext2D, t: number): void {
  for (const [i, lx] of LANTERNS.entries()) {
    const ly = 82 + (lx % 3) * 14;
    glow(ctx, lx, ly, 70 + Math.sin(t * 9 + i * 2.3) * 8, '#ffe3a0', 0.35 + 0.12 * Math.sin(t * 13 + i));
  }
}

function lightning(ctx: CanvasRenderingContext2D, v: View, t: number): void {
  const cycle = 8.5;
  const ph = t % cycle;
  if (ph > 0.5) return;
  const a = ph < 0.1 ? ph * 7 : ph < 0.2 ? 0.2 : Math.max(0, (0.5 - ph) * 1.4);
  ctx.fillStyle = `rgba(200,222,255,${(a * 0.4).toFixed(3)})`;
  ctx.fillRect(v.x0, v.y0, v.x1 - v.x0, v.y1 - v.y0);
  const bx = 120 + hash(Math.floor(t / cycle)) * 400;
  ctx.strokeStyle = `rgba(235,245,255,${Math.min(1, a * 2).toFixed(3)})`; ctx.lineWidth = 2; ctx.lineJoin = 'round';
  ctx.beginPath(); ctx.moveTo(bx, v.y0);
  let y = v.y0, x = bx;
  while (y < 280) { y += 28 + hash(y) * 16; x += (hash(y + 1) - 0.5) * 36; ctx.lineTo(x, y); }
  ctx.stroke();
}

function auroraShimmer(ctx: CanvasRenderingContext2D, v: View, t: number): void {
  for (let b = 0; b < 2; b++) {
    const g = ctx.createLinearGradient(0, 20, 0, 170);
    g.addColorStop(0, 'rgba(125,255,200,0)'); g.addColorStop(0.5, b ? 'rgba(170,130,255,0.18)' : 'rgba(125,255,200,0.2)'); g.addColorStop(1, 'rgba(125,255,200,0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.moveTo(v.x0, 170);
    for (let x = v.x0; x <= v.x1; x += 12) ctx.lineTo(x, 90 + b * 20 + Math.sin(x * 0.014 + t * 0.5 + b * 2) * 30);
    ctx.lineTo(v.x1, 170); ctx.closePath(); ctx.fill();
  }
}

/** Behind the gameplay layer. */
export function drawAmbientBack(ctx: CanvasRenderingContext2D, v: View, theme: Theme, tt: number, reduced: boolean): void {
  const t = reduced ? 0 : tt;
  if (theme === 'coral') shafts(ctx, v, t, 'rgba(170,240,255,0.9)');
  else if (theme === 'kelp') { shafts(ctx, v, t, 'rgba(160,255,190,0.8)'); kelpSway(ctx, v, t); }
  else if (theme === 'harbour') lighthouseBeam(ctx, reduced ? 0.4 : t);
  else if (theme === 'lantern') lanternFlicker(ctx, t);
  else if (theme === 'aurora') auroraShimmer(ctx, v, t);
  else if (theme === 'storm' && !reduced) lightning(ctx, v, t);
}

/** In front of the gameplay layer: small drifting particles and weather. */
export function drawAmbientFront(ctx: CanvasRenderingContext2D, v: View, theme: Theme, tt: number, reduced: boolean): void {
  const t = reduced ? 0 : tt;
  const art = THEME_ART[theme];
  const w = v.x1 - v.x0;
  const span = floorY - 20;
  ctx.save();
  if (art.ambient === 'rain') {
    ctx.strokeStyle = 'rgba(200,222,255,0.35)'; ctx.lineWidth = 0.9;
    ctx.beginPath();
    for (let i = 0; i < 46; i++) {
      const x = v.x0 + hash(i) * w + ((t * 90 + i * 13) % 40) * -0.3;
      const y = v.y0 + ((t * 420 * (0.8 + hash(i + 5) * 0.5) + hash(i + 2) * 600) % (floorY - v.y0));
      ctx.moveTo(x, y); ctx.lineTo(x - 2.6, y + 9);
    }
    ctx.stroke();
  } else {
    const n = art.ambient === 'snow' ? 40 : 22;
    for (let i = 0; i < n; i++) {
      const sp = 8 + hash(i + 1) * 20;
      const rise = art.ambient === 'bubbles' || art.ambient === 'embers' || art.ambient === 'motes';
      const phase = (t * sp + hash(i + 7) * span) % span;
      const y = rise ? floorY - phase : 10 + phase;
      const x = v.x0 + hash(i) * w + Math.sin(t * 0.9 + i) * (art.ambient === 'snow' ? 10 : 5);
      const r = 0.7 + hash(i + 3) * (art.ambient === 'bubbles' ? 2.2 : 1.1);
      ctx.globalAlpha = art.ambient === 'embers' ? 0.55 + 0.4 * Math.sin(t * 6 + i) : 0.45;
      if (art.ambient === 'bubbles') { ctx.strokeStyle = 'rgba(210,245,255,0.8)'; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.arc(x, y, r + 1, 0, Math.PI * 2); ctx.stroke(); }
      else { ctx.fillStyle = art.ambient === 'embers' ? '#ffb45a' : art.ambient === 'snow' ? '#ffffff' : art.dust; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); }
    }
  }
  ctx.restore();
}
