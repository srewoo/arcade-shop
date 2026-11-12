// Pre-rendered glossy disc sprites (one per kind), rebuilt only when the cell size, DPR or the
// colour-blind assist changes. Nothing here runs per frame.
import type { Kind } from '../model/types';
import { DISC, type DiscColour } from './palette';

type Ctx = CanvasRenderingContext2D;
const TAU = Math.PI * 2;

function mk(size: number): { cv: HTMLCanvasElement; c: Ctx } {
  const cv = document.createElement('canvas');
  cv.width = cv.height = Math.max(2, Math.round(size));
  return { cv, c: cv.getContext('2d') as Ctx };
}

function symbolPath(c: Ctx, kind: Kind, cx: number, cy: number, r: number): void {
  c.beginPath();
  switch (kind) {
    case 1: for (let i = 0; i < 3; i++) { const a = -Math.PI / 2 + (i * TAU) / 3; c.lineTo(cx + Math.cos(a) * r * 1.15, cy + 0.1 * r + Math.sin(a) * r * 1.15); } break;
    case 2: c.rect(cx - r * 0.85, cy - r * 0.85, r * 1.7, r * 1.7); break;
    case 3: c.moveTo(cx, cy - r * 1.15); c.lineTo(cx + r * 0.95, cy); c.lineTo(cx, cy + r * 1.15); c.lineTo(cx - r * 0.95, cy); break;
    case 4: c.arc(cx, cy, r * 0.9, 0, TAU); c.moveTo(cx + r * 0.42, cy); c.arc(cx, cy, r * 0.42, 0, TAU, true); break;
    default: for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + (i * Math.PI) / 5; const rr = i % 2 === 0 ? r * 1.2 : r * 0.5; c.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr); }
  }
  c.closePath();
}

function drawSymbol(c: Ctx, kind: Kind, cx: number, cy: number, r: number): void {
  symbolPath(c, kind, cx, cy, r);
  c.lineJoin = 'round';
  c.lineWidth = Math.max(2, r * 0.34);
  c.strokeStyle = 'rgba(18,8,48,0.78)';
  c.stroke();
  c.fillStyle = 'rgba(255,255,255,0.96)';
  c.fill('evenodd');
}

function bolt(c: Ctx, cx: number, cy: number, r: number): void {
  c.beginPath();
  c.moveTo(cx + r * 0.18, cy - r * 1.05);
  c.lineTo(cx - r * 0.62, cy + r * 0.12);
  c.lineTo(cx - r * 0.06, cy + r * 0.12);
  c.lineTo(cx - r * 0.3, cy + r * 1.05);
  c.lineTo(cx + r * 0.66, cy - r * 0.2);
  c.lineTo(cx + r * 0.08, cy - r * 0.2);
  c.closePath();
}

function body(c: Ctx, col: DiscColour, cx: number, cy: number, R: number): void {
  c.save();
  c.shadowColor = 'rgba(2,0,18,0.6)';
  c.shadowBlur = R * 0.26;
  c.shadowOffsetY = R * 0.12;
  c.fillStyle = col.dark;
  c.beginPath(); c.arc(cx, cy, R, 0, TAU); c.fill();
  c.restore();
  const rim = c.createLinearGradient(cx - R, cy - R, cx + R, cy + R);
  rim.addColorStop(0, col.light); rim.addColorStop(0.5, col.base); rim.addColorStop(1, col.dark);
  c.fillStyle = rim;
  c.beginPath(); c.arc(cx, cy, R, 0, TAU); c.fill();
  const r2 = R * 0.84;
  const g = c.createRadialGradient(cx - R * 0.3, cy - R * 0.36, R * 0.05, cx, cy, r2 * 1.08);
  g.addColorStop(0, col.light); g.addColorStop(0.38, col.base); g.addColorStop(1, col.dark);
  c.fillStyle = g;
  c.beginPath(); c.arc(cx, cy, r2, 0, TAU); c.fill();
  c.save();
  c.beginPath(); c.arc(cx, cy, r2, 0, TAU); c.clip();
  const bounce = c.createRadialGradient(cx + R * 0.15, cy + R * 0.78, 0, cx + R * 0.15, cy + R * 0.78, R * 0.8);
  bounce.addColorStop(0, 'rgba(255,255,255,0.34)'); bounce.addColorStop(1, 'rgba(255,255,255,0)');
  c.fillStyle = bounce; c.fillRect(cx - R, cy - R, R * 2, R * 2);
  c.restore();
  c.lineWidth = R * 0.05;
  c.strokeStyle = 'rgba(255,255,255,0.16)';
  c.beginPath(); c.arc(cx, cy, r2 * 0.82, 0, TAU); c.stroke();
}

function specular(c: Ctx, cx: number, cy: number, R: number): void {
  c.save();
  c.translate(cx - R * 0.3, cy - R * 0.44);
  c.rotate(-0.55);
  const g = c.createLinearGradient(0, -R * 0.26, 0, R * 0.26);
  g.addColorStop(0, 'rgba(255,255,255,0.95)'); g.addColorStop(1, 'rgba(255,255,255,0.04)');
  c.fillStyle = g;
  c.beginPath(); c.ellipse(0, 0, R * 0.5, R * 0.25, 0, 0, TAU); c.fill();
  c.restore();
  c.fillStyle = 'rgba(255,255,255,0.7)';
  c.beginPath(); c.arc(cx + R * 0.42, cy + R * 0.34, R * 0.07, 0, TAU); c.fill();
}

function colourDisc(size: number, kind: Kind, assist: boolean): HTMLCanvasElement {
  const { cv, c } = mk(size);
  const cx = size / 2, cy = size / 2, R = size * 0.445;
  body(c, DISC[kind], cx, cy, R);
  if (assist) drawSymbol(c, kind, cx, cy + R * 0.02, R * 0.4);
  specular(c, cx, cy, R);
  return cv;
}

function bombDisc(size: number): HTMLCanvasElement {
  const { cv, c } = mk(size);
  const cx = size / 2, cy = size / 2, R = size * 0.445;
  body(c, DISC[6], cx, cy, R);
  c.lineWidth = R * 0.09;
  c.strokeStyle = DISC[6].glow;
  c.beginPath(); c.arc(cx, cy, R * 0.93, 0, TAU); c.stroke();
  for (let i = 0; i < 12; i++) {
    const a = (i * TAU) / 12;
    c.beginPath(); c.moveTo(cx + Math.cos(a) * R * 0.74, cy + Math.sin(a) * R * 0.74); c.lineTo(cx + Math.cos(a) * R * 0.86, cy + Math.sin(a) * R * 0.86);
    c.lineWidth = R * 0.07; c.stroke();
  }
  c.save();
  c.shadowColor = DISC[6].glow; c.shadowBlur = R * 0.5;
  bolt(c, cx, cy, R * 0.56);
  const g = c.createLinearGradient(cx, cy - R * 0.6, cx, cy + R * 0.6);
  g.addColorStop(0, '#fff6c9'); g.addColorStop(1, '#ffb52e');
  c.fillStyle = g; c.fill();
  c.restore();
  specular(c, cx, cy, R);
  return cv;
}

/** A soft radial glow used behind bombs and for flashes. */
function halo(size: number): HTMLCanvasElement {
  const { cv, c } = mk(size);
  const g = c.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, 'rgba(255,255,255,0.9)'); g.addColorStop(0.35, 'rgba(255,255,255,0.28)'); g.addColorStop(1, 'rgba(255,255,255,0)');
  c.fillStyle = g; c.fillRect(0, 0, size, size);
  return cv;
}

export interface SpriteSet { readonly size: number; readonly assist: boolean; readonly discs: Readonly<Record<Kind, HTMLCanvasElement>>; readonly halo: HTMLCanvasElement }

export function buildSprites(cellPx: number, assist: boolean): SpriteSet {
  const size = Math.max(8, Math.round(cellPx));
  return {
    size, assist,
    discs: { 1: colourDisc(size, 1, assist), 2: colourDisc(size, 2, assist), 3: colourDisc(size, 3, assist), 4: colourDisc(size, 4, assist), 5: colourDisc(size, 5, assist), 6: bombDisc(size) },
    halo: halo(Math.round(size * 2)),
  };
}
