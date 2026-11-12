// Title-screen backdrop: the road scrolls by itself while a few cars cruise past the player's red coupe.
import { CONFIG } from './config';
import { drawPlayer, drawTraffic } from './renderCar';
import type { Car } from './simTypes';
import { view as V } from './viewport';

const mk = (id: number, lane: number, kind: Car['kind'], hue: number, z: number): Car => ({
  id, lane, kind, len: CONFIG.carLen[kind], hue, speed: 14, z, pz: z, minDx: 9, scored: false,
});
const CARS: readonly Car[] = [
  mk(1, 0, 'sedan', 210, 20), mk(2, 1, 'van', 172, 78), mk(3, 3, 'truck', 135, 40), mk(4, 4, 'sedan', 320, 96),
  mk(5, 2, 'sedan', 275, 128), mk(6, 0, 'sedan', 48, 150), mk(7, 3, 'van', 30, 6),
];
const LOOP = 180;
const SCROLL = 26;

/** Road distance the backdrop has scrolled at `time` seconds. */
export const showcaseZ = (time: number, reduce: boolean): number => (reduce ? 0 : time * SCROLL);

export function drawShowcase(g: CanvasRenderingContext2D, time: number, reduce: boolean): void {
  for (const c of CARS) {
    const rel = (((c.z + (14 - SCROLL) * (reduce ? 0 : time)) % LOOP) + LOOP) % LOOP - 30;
    g.save();
    g.translate(V.roadLeft + (c.lane + 0.5) * V.laneW, V.playerY - rel * V.pxPerU);
    drawTraffic(g, c, 32, c.len * V.pxPerU);
    g.restore();
  }
  g.save();
  g.translate(V.roadLeft + 2.5 * V.laneW, V.playerY);
  drawPlayer(g, { w: 32, h: 52, blink: false, boost: false, assist: false, time });
  g.restore();
}
