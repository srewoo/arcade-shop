// Per-frame drawing of the discs (interpolated, squashed, popped in), the hover preview, the
// keyboard cursor and the column danger glow. Reads the sim; never mutates it.
import { CONFIG } from '../config';
import { topRow } from '../model/grid';
import type { Sim } from '../model/sim';
import { BOMB, type Tile } from '../model/types';
import { SCENE } from './palette';
import type { SpriteSet } from './sprites';
import type { FxState } from './fxEvents';
import { cellX, cellY, type View } from './view';

export interface TileOpts { alpha: number; time: number; reduced: boolean; fx: FxState; hover: ReadonlySet<number> | null }

const easeOutBack = (k: number): number => 1 + 2.2 * (k - 1) ** 3 + 1.2 * (k - 1) ** 2;

function shape(t: Tile, o: TileOpts): { sx: number; sy: number } {
  if (t.state === 'queued') {
    const s = easeOutBack(Math.min(1, t.age / 0.22));
    return { sx: s, sy: s };
  }
  if (t.squash > 0 && !o.reduced) {
    const k = t.squash / CONFIG.fx.squashSec;
    const osc = Math.cos((1 - k) * Math.PI * 3) * k * t.impact * 0.17;
    return { sx: 1 + osc * 0.6, sy: 1 - osc };
  }
  if (t.state === 'fall' && !o.reduced) {
    const st = Math.min(0.1, t.vy * 0.004);
    return { sx: 1 - st * 0.5, sy: 1 + st };
  }
  return { sx: 1, sy: 1 };
}

export function drawTiles(c: CanvasRenderingContext2D, v: View, sim: Sim, sp: SpriteSet, o: TileOpts): void {
  const cs = v.cs;
  for (const t of sim.tiles) {
    const gx = t.px + (t.x - t.px) * o.alpha;
    const gy = t.py + (t.y - t.py) * o.alpha;
    let x = cellX(v, gx), y = cellY(v, gy);
    const lift = o.hover?.has(t.id) ? 1.05 : 1;
    const { sx, sy } = shape(t, o);
    const rj = o.fx.reject;
    if (rj && rj.col === t.col && rj.row === t.row && t.state === 'rest') x += Math.sin(rj.t * 70) * cs * 0.06 * (1 - rj.t / 0.3);
    const w = cs * sx * lift, h = cs * sy * lift;
    const dropY = t.state === 'queued' ? y + cs / 2 - h / 2 : y + cs - h - (lift - 1) * cs * 0.3;
    if (t.kind === BOMB) {
      c.save();
      c.globalCompositeOperation = 'lighter';
      c.globalAlpha = o.reduced ? 0.35 : 0.3 + 0.2 * Math.sin(o.time * 5 + t.id);
      c.drawImage(sp.halo, x - cs * 0.5, y - cs * 0.5, cs * 2, cs * 2);
      c.restore();
    }
    c.drawImage(sp.discs[t.kind], x + cs / 2 - w / 2, dropY, w, h);
  }
}

/** A star-shaped glint that wanders across the discs; one at a time, off in Reduce motion. */
export function drawTwinkle(c: CanvasRenderingContext2D, v: View, sim: Sim, time: number): void {
  const tiles = sim.tiles;
  if (tiles.length === 0) return;
  const slot = Math.floor(time / 0.9);
  const t = tiles[(slot * 7919) % tiles.length] as Tile;
  const k = (time / 0.9) % 1;
  if (t.state !== 'rest' || k > 0.6) return;
  const a = Math.sin((k / 0.6) * Math.PI);
  const cx = cellX(v, t.x) + v.cs * 0.34, cy = cellY(v, t.y) + v.cs * 0.3, r = v.cs * 0.16 * a;
  c.save();
  c.globalAlpha = a * 0.9; c.fillStyle = '#ffffff';
  c.beginPath();
  c.moveTo(cx, cy - r); c.quadraticCurveTo(cx, cy, cx + r, cy); c.quadraticCurveTo(cx, cy, cx, cy + r);
  c.quadraticCurveTo(cx, cy, cx - r, cy); c.quadraticCurveTo(cx, cy, cx, cy - r);
  c.fill();
  c.restore();
}

/** Red glow over columns whose stack is about to reach the feeder. */
export function drawDanger(c: CanvasRenderingContext2D, v: View, sim: Sim, time: number, reduced: boolean): void {
  for (let col = 0; col < CONFIG.grid.cols; col++) {
    const top = topRow(sim.cells, col);
    if (top > CONFIG.danger.topRow) continue;
    const pulse = reduced ? 0.7 : 0.55 + 0.35 * Math.sin(time * 8);
    const x = cellX(v, col), y = cellY(v, 1);
    const g = c.createLinearGradient(0, y, 0, y + (top - 1 + 1.5) * v.cs);
    g.addColorStop(0, `rgba(255,61,94,${0.5 * pulse})`); g.addColorStop(1, 'rgba(255,61,94,0)');
    c.fillStyle = g; c.fillRect(x, y, v.cs, (top + 0.5) * v.cs);
  }
}

export interface PreviewCell { col: number; row: number }

/** Outline the group a click would zap, plus a small "n discs = points" tag. */
export function drawPreview(c: CanvasRenderingContext2D, v: View, cells: readonly PreviewCell[], bomb: boolean, points: number, time: number): void {
  if (cells.length === 0) return;
  const cs = v.cs;
  c.save();
  const a = 0.55 + 0.25 * Math.sin(time * 7);
  c.lineWidth = Math.max(2, cs * 0.07);
  c.strokeStyle = bomb ? SCENE.bolt : '#ffffff';
  c.shadowColor = bomb ? SCENE.bolt : SCENE.accentLight; c.shadowBlur = cs * 0.25;
  c.globalAlpha = a;
  for (const p of cells) { c.beginPath(); c.arc(cellX(v, p.col) + cs / 2, cellY(v, p.row) + cs / 2, cs * 0.47, 0, Math.PI * 2); c.stroke(); }
  c.restore();
  if (cells.length < 2 && !bomb) return;
  const top = cells.reduce((m, p) => (p.row < m.row ? p : m), cells[0] as PreviewCell);
  tag(c, v, cellX(v, top.col) + cs / 2, cellY(v, top.row) - cs * 0.12, bomb ? `Row · +${points.toLocaleString('en-US')}` : `${cells.length} · +${points.toLocaleString('en-US')}`);
}

function tag(c: CanvasRenderingContext2D, v: View, x: number, y: number, text: string): void {
  c.save();
  const fs = Math.max(11, v.cs * 0.3);
  c.font = `800 ${fs}px ui-rounded, 'SF Pro Rounded', system-ui, sans-serif`;
  c.textAlign = 'center'; c.textBaseline = 'middle';
  const w = c.measureText(text).width + fs * 0.9, h = fs * 1.5;
  const px = Math.min(v.ox + CONFIG.grid.cols * v.cs - w / 2, Math.max(v.ox + w / 2, x));
  const py = Math.max(v.oy + h / 2 + v.cs, y - h / 2);
  c.fillStyle = 'rgba(14,8,40,0.88)'; c.strokeStyle = 'rgba(185,166,255,0.8)'; c.lineWidth = 1.5;
  c.beginPath(); c.roundRect(px - w / 2, py - h / 2, w, h, h / 2); c.fill(); c.stroke();
  c.fillStyle = SCENE.text; c.fillText(text, px, py + 1);
  c.restore();
}

/** The keyboard cursor: a glowing rounded square around the chosen cell. */
export function drawCursor(c: CanvasRenderingContext2D, v: View, col: number, row: number, time: number, reduced: boolean): void {
  const x = cellX(v, col), y = cellY(v, row), pad = v.cs * 0.04;
  c.save();
  c.lineWidth = Math.max(2.5, v.cs * 0.075);
  c.strokeStyle = SCENE.bolt;
  c.shadowColor = SCENE.bolt; c.shadowBlur = v.cs * 0.3;
  c.globalAlpha = reduced ? 1 : 0.75 + 0.25 * Math.sin(time * 6);
  c.beginPath(); c.roundRect(x + pad, y + pad, v.cs - pad * 2, v.cs - pad * 2, v.cs * 0.22); c.stroke();
  c.restore();
}
