// Scenery for the static layer: lawn, pavement ring, hedges, trees, kerb stones, wheel stops, bay numbers.
import type { Box } from '../geom';
import type { Level } from '../levels/types';
import { createRng } from '../rng';
import { PAL } from './palette';

type G = CanvasRenderingContext2D;
const REACH = 300;
const PAVE = 1.25;

/** Lawn all around the lot: diagonal mowing bands, blades and a few flowers. */
export function grass(ctx: G, level: Level): void {
  const { w, h } = level.world;
  ctx.fillStyle = PAL.grass;
  ctx.fillRect(-REACH, -REACH, w + REACH * 2, h + REACH * 2);
  const rng = createRng(level.id * 31 + 5);
  ctx.save();
  ctx.beginPath();
  ctx.rect(-24, -24, w + 48, h + 48);
  ctx.clip();
  ctx.fillStyle = 'rgba(255,255,255,0.035)';
  for (let d = -w - h - 24; d < w + h + 24; d += 5) {
    ctx.beginPath();
    ctx.moveTo(d, -24); ctx.lineTo(d + 2.5, -24); ctx.lineTo(d + 2.5 + h + 48, h + 24); ctx.lineTo(d + h + 48, h + 24);
    ctx.fill();
  }
  ctx.lineCap = 'round';
  ctx.lineWidth = 0.05;
  const blades = Math.floor((w + 48) * (h + 48) * 0.9);
  for (let i = 0; i < blades; i++) {
    const x = rng.range(-24, w + 24);
    const y = rng.range(-24, h + 24);
    ctx.strokeStyle = i % 3 === 0 ? 'rgba(130,200,110,0.3)' : PAL.grassDark;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + rng.range(-0.08, 0.08), y - rng.range(0.1, 0.24));
    ctx.stroke();
  }
  for (let i = 0; i < 60; i++) {
    ctx.fillStyle = i % 2 ? '#fff3b0' : '#ffffff';
    ctx.beginPath();
    ctx.arc(rng.range(-30, w + 30), rng.range(-30, h + 30), 0.06, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

/** Concrete pavement just outside the kerb, with expansion joints. */
export function pavement(ctx: G, level: Level): void {
  const { w, h } = level.world;
  const o = 0.5;
  ctx.fillStyle = '#9aa0a8';
  ctx.fillRect(-o - PAVE, -o - PAVE, w + 2 * (o + PAVE), h + 2 * (o + PAVE));
  const grad = ctx.createLinearGradient(0, -o - PAVE, 0, h + o + PAVE);
  grad.addColorStop(0, 'rgba(255,255,255,0.12)');
  grad.addColorStop(1, 'rgba(0,0,0,0.1)');
  ctx.fillStyle = grad;
  ctx.fillRect(-o - PAVE, -o - PAVE, w + 2 * (o + PAVE), h + 2 * (o + PAVE));
  ctx.strokeStyle = 'rgba(40,46,56,0.3)';
  ctx.lineWidth = 0.04;
  for (let x = -o - PAVE; x < w + o + PAVE; x += 1.6) { ctx.beginPath(); ctx.moveTo(x, -o - PAVE); ctx.lineTo(x, -o); ctx.moveTo(x, h + o); ctx.lineTo(x, h + o + PAVE); ctx.stroke(); }
  for (let y = -o - PAVE; y < h + o + PAVE; y += 1.6) { ctx.beginPath(); ctx.moveTo(-o - PAVE, y); ctx.lineTo(-o, y); ctx.moveTo(w + o, y); ctx.lineTo(w + o + PAVE, y); ctx.stroke(); }
  ctx.strokeStyle = 'rgba(0,0,0,0.25)';
  ctx.lineWidth = 0.1;
  ctx.strokeRect(-o - PAVE, -o - PAVE, w + 2 * (o + PAVE), h + 2 * (o + PAVE));
}

function shrub(ctx: G, x: number, y: number, r: number, i: number): void {
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.beginPath();
  ctx.ellipse(x + r * 0.3, y + r * 0.4, r, r * 0.9, 0, 0, Math.PI * 2);
  ctx.fill();
  const g = ctx.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.1, x, y, r);
  g.addColorStop(0, i % 3 === 0 ? '#6fb25f' : '#5a9c4f');
  g.addColorStop(0.7, i % 3 === 0 ? PAL.bushLight : PAL.bush);
  g.addColorStop(1, '#1f4220');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(210,255,190,0.18)';
  ctx.beginPath();
  ctx.arc(x - r * 0.3, y - r * 0.35, r * 0.3, 0, Math.PI * 2);
  ctx.fill();
}

/** Tree seen from above: layered leaf clumps and a long soft shadow. */
function tree(ctx: G, x: number, y: number, r: number, seed: number): void {
  ctx.fillStyle = 'rgba(0,0,0,0.26)';
  ctx.beginPath();
  ctx.ellipse(x + r * 0.45, y + r * 0.55, r * 1.05, r * 0.95, 0, 0, Math.PI * 2);
  ctx.fill();
  const rng = createRng(seed);
  for (let k = 0; k < 7; k++) {
    const a = (k / 7) * Math.PI * 2;
    const d = k === 0 ? 0 : r * 0.45;
    const cx = x + Math.cos(a) * d;
    const cy = y + Math.sin(a) * d;
    const cr = r * rng.range(0.55, 0.72);
    const g = ctx.createRadialGradient(cx - cr * 0.3, cy - cr * 0.35, cr * 0.1, cx, cy, cr);
    g.addColorStop(0, '#6db55f');
    g.addColorStop(0.6, '#3f7e3a');
    g.addColorStop(1, '#25521f');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(cx, cy, cr, 0, Math.PI * 2);
    ctx.fill();
  }
}

/** Hedge shrubs hugging the pavement, then trees further out (fewer toward the corners of a wide view). */
export function bushes(ctx: G, level: Level): void {
  const { w, h } = level.world;
  const rng = createRng(level.id * 17 + 3);
  const ring = 0.5 + PAVE;
  for (let i = 0; i < 70; i++) {
    const side = rng.int(4);
    const t = rng.next();
    const d = ring + rng.range(0.6, 1.5);
    const x = side === 0 ? t * w : side === 1 ? w + d : side === 2 ? t * w : -d;
    const y = side === 0 ? -d : side === 1 ? t * h : side === 2 ? h + d : t * h;
    shrub(ctx, x, y, rng.range(0.45, 0.85), i);
  }
  for (let i = 0; i < 26; i++) {
    const side = rng.int(4);
    const t = rng.next();
    const d = ring + rng.range(2.4, 9);
    const x = side === 0 ? t * w * 1.2 - w * 0.1 : side === 1 ? w + d : side === 2 ? t * w * 1.2 - w * 0.1 : -d;
    const y = side === 0 ? -d : side === 1 ? t * h * 1.2 - h * 0.1 : side === 2 ? h + d : t * h * 1.2 - h * 0.1;
    tree(ctx, x, y, rng.range(1.2, 2.2), i * 13 + 7);
  }
}

/** Alternating kerb stones with a lit top edge and a shaded face. */
export function kerbStones(ctx: G, level: Level): void {
  const { w, h } = level.world;
  const t = 0.5;
  const run = (x: number, y: number, len: number, horizontal: boolean): void => {
    const n = Math.max(1, Math.round(len / 1.2));
    const step = len / n;
    for (let i = 0; i < n; i++) {
      ctx.fillStyle = i % 2 === 0 ? PAL.kerb : PAL.kerbAlt;
      const bw = horizontal ? step - 0.04 : t;
      const bh = horizontal ? t : step - 0.04;
      const bx = horizontal ? x + i * step : x;
      const by = horizontal ? y : y + i * step;
      ctx.fillRect(bx, by, bw, bh);
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      ctx.fillRect(bx, by, bw, 0.07);
      ctx.fillStyle = 'rgba(0,0,0,0.18)';
      ctx.fillRect(bx, by + bh - 0.07, bw, 0.07);
    }
  };
  run(-t, -t, w + t * 2, true);
  run(-t, h, w + t * 2, true);
  run(-t, 0, h, false);
  run(w, 0, h, false);
  ctx.strokeStyle = PAL.kerbEdge;
  ctx.lineWidth = 0.08;
  ctx.strokeRect(-t, -t, w + t * 2, h + t * 2);
}

const nearEdge = (x: number, y: number, w: number, h: number): number => Math.min(x, w - x, y, h - y);

/** Concrete wheel stop at the closed end of a bay (end nearest the lot edge). */
export function wheelStop(ctx: G, b: Box, world: { w: number; h: number }): void {
  const end = (s: number): number => nearEdge(b.x + Math.cos(b.a) * b.hw * s, b.y + Math.sin(b.a) * b.hw * s, world.w, world.h);
  const sign = end(1) <= end(-1) ? 1 : -1;
  ctx.save();
  ctx.translate(b.x, b.y);
  ctx.rotate(b.a);
  const x = sign * (b.hw - 0.45);
  const len = Math.min(b.hh * 1.5, 2);
  ctx.fillStyle = 'rgba(0,0,0,0.32)';
  ctx.fillRect(x - 0.12, -len / 2 + 0.1, 0.36, len);
  const g = ctx.createLinearGradient(x - 0.17, 0, x + 0.17, 0);
  g.addColorStop(0, '#c2c8d0');
  g.addColorStop(1, '#7f8792');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.roundRect(x - 0.17, -len / 2, 0.34, len, 0.06);
  ctx.fill();
  ctx.fillStyle = '#e8ca3a';
  ctx.fillRect(x - 0.17, -len / 2 + 0.02, 0.34, 0.07);
  ctx.restore();
}

/** Painted bay number, reading along the bay. */
export function bayNumber(ctx: G, b: Box, n: number): void {
  ctx.save();
  ctx.translate(b.x, b.y);
  ctx.rotate(b.a);
  ctx.globalAlpha = 0.4;
  ctx.fillStyle = PAL.line;
  ctx.font = '700 0.9px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(String(n), 0, 0);
  ctx.restore();
}
