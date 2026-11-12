// The cosy office behind the lane: panelled wall, dusk window, props, carpet tiles and lamp light.
// Drawn once into an offscreen canvas per size, then blitted.
import { CARPET_TILES, INK, WALL, WALL_PANEL } from './palette';
import { clock, furniture, lamp, poster, shelf, windowPane } from './backdropProps';
import { farEnd } from './sceneGeometry';
import { CONFIG } from '../config';
import type { Camera } from './camera';

type C = CanvasRenderingContext2D;

function wall(c: C, cam: Camera, horizon: number): void {
  const g = c.createLinearGradient(0, 0, 0, horizon);
  g.addColorStop(0, WALL.top); g.addColorStop(1, WALL.bottom);
  c.fillStyle = g; c.fillRect(0, 0, cam.w, horizon);
  c.fillStyle = 'rgba(255,255,255,0.05)';
  for (let x = 0; x < cam.w; x += 28) c.fillRect(x, 0, 12, horizon);
  const rail = horizon * 0.66;
  const wg = c.createLinearGradient(0, rail, 0, horizon);
  wg.addColorStop(0, WALL_PANEL.panel); wg.addColorStop(1, '#7da39d');
  c.fillStyle = wg; c.fillRect(0, rail, cam.w, horizon - rail);
  c.strokeStyle = WALL_PANEL.groove; c.lineWidth = 1.5;
  for (let x = 20; x < cam.w; x += 70) { c.strokeRect(x, rail + 10, 50, Math.max(8, horizon - rail - 20)); }
  c.fillStyle = WALL_PANEL.rail; c.fillRect(0, rail - 5, cam.w, 7);
  c.fillStyle = 'rgba(43,36,32,0.25)'; c.fillRect(0, rail + 2, cam.w, 3);
}

function carpet(c: C, cam: Camera, horizon: number): void {
  const g = c.createLinearGradient(0, horizon, 0, cam.h);
  g.addColorStop(0, '#5d7f86'); g.addColorStop(1, '#6f8f95');
  c.fillStyle = g; c.fillRect(0, horizon, cam.w, cam.h - horizon);
  c.save(); c.beginPath(); c.rect(0, horizon, cam.w, cam.h - horizon); c.clip();
  const step = 140;
  for (let x = -100, i = 0; x < CONFIG.lane.endX + 200; x += step, i++) {
    for (let y = -520, j = 0; y < 520; y += step, j++) {
      if ((i + j) % 2) continue;
      const a = cam.project(x, y), b = cam.project(x + step, y), d = cam.project(x + step, y + step), e = cam.project(x, y + step);
      c.fillStyle = CARPET_TILES.b; c.beginPath(); c.moveTo(a.x, a.y); c.lineTo(b.x, b.y); c.lineTo(d.x, d.y); c.lineTo(e.x, e.y); c.closePath(); c.fill();
    }
  }
  c.restore();
  c.fillStyle = '#8a6b4a'; c.fillRect(0, horizon - 6, cam.w, 8);
  c.fillStyle = 'rgba(43,36,32,0.3)'; c.fillRect(0, horizon + 2, cam.w, 6);
}

function vignette(c: C, cam: Camera): void {
  const g = c.createRadialGradient(cam.w / 2, cam.h / 2, Math.min(cam.w, cam.h) * 0.45, cam.w / 2, cam.h / 2, Math.max(cam.w, cam.h) * 0.75);
  g.addColorStop(0, 'rgba(30,20,40,0)'); g.addColorStop(1, 'rgba(30,20,40,0.32)');
  c.fillStyle = g; c.fillRect(0, 0, cam.w, cam.h);
}

/** Render the static backdrop for a camera. */
export function paintBackdrop(c: C, cam: Camera): void {
  const horizon = farEnd(cam);
  wall(c, cam, horizon);
  carpet(c, cam, horizon);
  const u = Math.max(0.35, Math.min(cam.w / 900, horizon / 220, 1.2));
  c.lineJoin = 'round';
  windowPane(c, cam.w * 0.4, Math.max(8, horizon - 190 * u), u);
  clock(c, cam.w * 0.62, Math.max(24 * u, horizon - 150 * u), 18 * u);
  poster(c, cam.w * 0.285, Math.max(6, horizon - 170 * u), u);
  shelf(c, cam.w * 0.5 + 100 * u, Math.max(40 * u, horizon - 110 * u), u);
  furniture(c, horizon - 4, cam.w, u);
  lamp(c, cam.w * 0.34, Math.max(8, horizon - 205 * u) * 0.7, u);
  lamp(c, cam.w * 0.68, Math.max(8, horizon - 205 * u) * 0.7, u);
  vignette(c, cam);
  c.strokeStyle = INK;
}
