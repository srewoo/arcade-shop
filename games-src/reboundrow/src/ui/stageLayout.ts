// Sizes the canvas to the stage, fits the logical field to the screen and positions the HUD box over it.
import { CONFIG } from '../config';
import { fitField, placeField, type Box, type Placement } from '../layout';
import { setField } from '../sim/world';
import { $ } from './dom';
import { app } from './state';

/** Current field placement in CSS px (read by pointer input). */
export const placement: Placement = { scale: 1, offX: 0, offY: 0 };
let box: Box = { w: 1, h: 1 };
let applied = '';

export function setBox(w: number, h: number): void {
  box = { w: Math.max(1, w), h: Math.max(1, h) };
  applied = '';
}

function sizeCanvas(canvas: HTMLCanvasElement): void {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = Math.max(1, Math.round(box.w * dpr));
  const h = Math.max(1, Math.round(box.h * dpr));
  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w;
    canvas.height = h;
  }
}

/** Run every frame while playing: cheap unless the field or box changed. */
export function syncLayout(canvas: HTMLCanvasElement): void {
  const world = app.run?.world;
  const fallback = { w: CONFIG.field.w, h: CONFIG.field.h };
  if (world && world.phase === 'ready') {
    const fit = fitField(box, world.rows);
    if (fit.w !== world.field.w || fit.h !== world.field.h) setField(world, fit);
  }
  const field = world?.field ?? fallback;
  const p = placeField(box, field);
  const key = `${box.w}x${box.h}|${field.w}x${field.h}`;
  Object.assign(placement, p);
  if (key === applied) return;
  applied = key;
  sizeCanvas(canvas);
  const ui = $('field-ui').style;
  ui.setProperty('--fx', `${p.offX}px`);
  ui.setProperty('--fy', `${p.offY}px`);
  ui.setProperty('--fw', `${field.w * p.scale}px`);
  ui.setProperty('--fh', `${field.h * p.scale}px`);
}
