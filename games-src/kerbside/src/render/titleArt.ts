// Title illustration: a lit car park with one empty glowing bay and a red car swinging in. Drawn with the game's own art.
import { CONFIG } from '../config';
import type { Box } from '../geom';
import type { Level, Obstacle } from '../levels/types';
import { drawCar } from './carArt';
import { drawBay } from './bay';
import { drawBeam, drawVignette } from './lights';
import { PAL } from './palette';
import { drawStatic } from './scene';

const W = 18;
const H = 12;
const bayAt = (i: number): Box => ({ x: 3 + i * 3, y: 3.3, hw: 2.7, hh: 1.35, a: Math.PI / 2 });
const parked = (i: number, tintIdx: number): Obstacle => ({ kind: 'car', tint: tintIdx, box: { x: 3 + i * 3, y: 3.5, hw: CONFIG.car.length / 2, hh: CONFIG.car.width / 2, a: Math.PI / 2 + (i % 2 ? 0.03 : -0.02) } });

const LEVEL: Level = {
  id: 77, name: '', kind: 'angled', world: { w: W, h: H }, start: { x: 0, y: 0, a: 0 }, bay: bayAt(2), goal: 'car', trailer: false,
  obstacles: [parked(0, 0), parked(1, 3), parked(3, 5), parked(4, 1)],
  paint: [0, 1, 3, 4].map(bayAt), timeLimit: 60, parTime: 20, tip: '',
};

/** Paint the title art into `canvas` (sized by CSS; backing store follows devicePixelRatio, capped at 2). */
export function drawTitleArt(canvas: HTMLCanvasElement): void {
  const rect = canvas.getBoundingClientRect();
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const cw = Math.max(1, Math.round(rect.width * dpr));
  const ch = Math.max(1, Math.round(rect.height * dpr));
  if (rect.width < 2) return;
  canvas.width = cw;
  canvas.height = ch;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const scale = Math.min(cw / (W + 1.6), ch / (H + 1.6));
  ctx.setTransform(scale, 0, 0, scale, (cw - W * scale) / 2, (ch - H * scale) / 2);
  drawStatic(ctx, LEVEL);
  const car: Box = { x: 8.4, y: 8.3, hw: CONFIG.car.length / 2, hh: CONFIG.car.width / 2, a: -1.32 };
  drawBay(ctx, LEVEL, 0, false, 0.6, false, 0.55);
  drawBeam(ctx, car);
  drawCar(ctx, car, { color: PAL.player, dark: PAL.playerDark, steer: -0.3, braking: false, reversing: false, lights: true });
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  drawVignette(ctx, cw, ch);
}
