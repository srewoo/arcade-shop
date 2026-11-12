// Floor strip, ceiling beam and vignette: the frame around every stage, themed per scene.
import { CONFIG } from '../config';
import { roundRect, vGrad } from './util';
import type { Scene } from './sceneKit';

const { floorY, ceilY } = CONFIG.world;

function planks(sc: Scene): void {
  const { ctx, x0, x1, art, rnd } = sc;
  ctx.strokeStyle = art.floorLine; ctx.lineWidth = 1.4;
  for (let x = Math.floor(x0 / 34) * 34; x < x1; x += 34) {
    ctx.beginPath(); ctx.moveTo(x + (rnd() - 0.5) * 3, floorY + 1); ctx.lineTo(x, sc.y1); ctx.stroke();
  }
  ctx.globalAlpha = 0.22;
  for (let y = floorY + 9; y < sc.y1; y += 11) {
    ctx.beginPath(); ctx.moveTo(x0, y); for (let x = x0; x < x1; x += 20) ctx.lineTo(x, y + Math.sin(x * 0.1 + y) * 1.2); ctx.stroke();
  }
  ctx.globalAlpha = 1;
  ctx.fillStyle = art.floorLine;
  for (let x = Math.floor(x0 / 34) * 34 + 6; x < x1; x += 34) { ctx.fillRect(x, floorY + 6, 2, 2); ctx.fillRect(x + 20, floorY + 6, 2, 2); }
}

function sand(sc: Scene): void {
  const { ctx, x0, x1, art, rnd } = sc;
  ctx.strokeStyle = art.floorLine; ctx.globalAlpha = 0.35; ctx.lineWidth = 1.2;
  for (let y = floorY + 8; y < sc.y1; y += 10) {
    ctx.beginPath();
    for (let x = x0; x < x1; x += 6) ctx.lineTo(x, y + Math.sin(x * 0.06 + y * 0.9) * 2.2);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  for (let i = 0; i < 40; i++) {
    const x = x0 + rnd() * (x1 - x0), y = floorY + 8 + rnd() * 30, r = 1 + rnd() * 2.4;
    ctx.fillStyle = rnd() < 0.5 ? art.floorBot : art.dust; ctx.globalAlpha = 0.55;
    ctx.beginPath(); ctx.ellipse(x, y, r * 1.4, r, 0, 0, Math.PI * 2); ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function slabs(sc: Scene): void {
  const { ctx, x0, x1, art, rnd } = sc;
  ctx.strokeStyle = art.floorLine; ctx.lineWidth = 1.5;
  let row = 0;
  for (let y = floorY; y < sc.y1; y += 18, row++) {
    ctx.beginPath(); ctx.moveTo(x0, y + 18); ctx.lineTo(x1, y + 18); ctx.stroke();
    for (let x = Math.floor(x0 / 60) * 60 + (row % 2) * 30; x < x1; x += 60) { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + 18); ctx.stroke(); }
  }
  ctx.globalAlpha = 0.5;
  for (let i = 0; i < 10; i++) {
    const x = x0 + rnd() * (x1 - x0), y = floorY + 3 + rnd() * 20;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 6, y + 5); ctx.lineTo(x + 3, y + 10); ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

function ice(sc: Scene): void {
  const { ctx, x0, x1, art, rnd } = sc;
  ctx.strokeStyle = art.floorLine; ctx.lineWidth = 1.2; ctx.globalAlpha = 0.6;
  for (let i = 0; i < 16; i++) {
    const x = x0 + rnd() * (x1 - x0);
    ctx.beginPath(); ctx.moveTo(x, floorY + 2); ctx.lineTo(x + 14 + rnd() * 20, floorY + 16); ctx.lineTo(x + 6 + rnd() * 20, floorY + 38); ctx.stroke();
  }
  ctx.globalAlpha = 0.22; ctx.fillStyle = '#fff';
  for (let x = x0 - 60; x < x1; x += 90) { ctx.beginPath(); ctx.moveTo(x, floorY); ctx.lineTo(x + 26, floorY); ctx.lineTo(x - 10, sc.y1); ctx.lineTo(x - 36, sc.y1); ctx.fill(); }
  ctx.globalAlpha = 1;
}

const DETAIL: Record<string, (sc: Scene) => void> = { harbour: planks, coral: sand, kelp: sand, lantern: slabs, storm: slabs, aurora: ice };

export function paintFloor(sc: Scene, theme: string): void {
  const { ctx, x0, x1, art } = sc;
  ctx.fillStyle = vGrad(ctx, floorY, floorY + 46, [[0, art.floorTop], [1, art.floorBot]]);
  ctx.fillRect(x0, floorY, x1 - x0, sc.y1 - floorY + 2);
  (DETAIL[theme] ?? sand)(sc);
  ctx.fillStyle = vGrad(ctx, floorY, floorY + 4, [[0, 'rgba(255,255,255,0.55)'], [1, 'rgba(255,255,255,0)']]);
  ctx.fillRect(x0, floorY, x1 - x0, 4);
  ctx.fillStyle = vGrad(ctx, floorY - 16, floorY, [[0, 'rgba(0,0,0,0)'], [1, 'rgba(0,0,0,0.28)']]);
  ctx.fillRect(x0, floorY - 16, x1 - x0, 16);
  ctx.fillStyle = vGrad(ctx, floorY + 40, sc.y1, [[0, 'rgba(0,0,0,0)'], [1, 'rgba(0,0,0,0.55)']]);
  ctx.fillRect(x0, floorY + 40, x1 - x0, Math.max(0, sc.y1 - floorY - 40));
}

export function paintCeiling(sc: Scene): void {
  const { ctx, x0, x1, y0, art } = sc;
  if (y0 < 0) { ctx.fillStyle = vGrad(ctx, y0, 0, [[0, 'rgba(4,8,20,0.55)'], [1, 'rgba(4,8,20,0.12)']]); ctx.fillRect(x0, y0, x1 - x0, -y0); }
  ctx.fillStyle = vGrad(ctx, 0, ceilY, [[0, art.ledgeHi], [0.35, art.ledge], [1, art.ledgeLo]]);
  ctx.fillRect(x0, 0, x1 - x0, ceilY);
  ctx.fillStyle = vGrad(ctx, ceilY, ceilY + 22, [[0, 'rgba(0,0,0,0.4)'], [1, 'rgba(0,0,0,0)']]);
  ctx.fillRect(x0, ceilY, x1 - x0, 22);
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  for (let x = Math.floor(x0 / 48) * 48 + 10; x < x1; x += 48) { ctx.beginPath(); ctx.arc(x, ceilY / 2, 1.6, 0, Math.PI * 2); ctx.fill(); }
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.fillRect(x0, 0, x1 - x0, 1.2);
}

/** Ledge/block-shaped slab used for platforms (drawn live, but shares the style). */
export function slabPath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number): void {
  roundRect(ctx, x, y, w, h, Math.min(3, h / 2));
}
