// World sizing and the mapping between world units and canvas pixels.
// The world is fixed for a whole round (so clay arcs never change mid-flight);
// its shape follows the stage aspect so phones get a taller, narrower field.
import { CONFIG } from './config';

export interface World {
  readonly w: number;
  readonly h: number;
  /** Reference height for arc sizes: min(h, arcRatio * w). */
  readonly arc: number;
  /** Y of the house roofs, where clays emerge. */
  readonly launchY: number;
  /** Y below which a falling clay counts as landed. */
  readonly groundY: number;
}

export interface Fit {
  readonly scale: number;
  readonly ox: number;
  readonly oy: number;
}

const clamp = (v: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, v));

export function makeWorld(w: number, h: number): World {
  const c = CONFIG.world;
  return { w, h, arc: Math.min(h, c.arcRatio * w), launchY: h * c.launchY, groundY: h * (c.launchY + c.groundDrop) };
}

/** Pick world dimensions for a stage of the given pixel size. */
export function worldForStage(stageW: number, stageH: number): World {
  const c = CONFIG.world;
  const aspect = stageW > 0 && stageH > 0 ? stageW / stageH : 1.5;
  const t = clamp((aspect - c.tallAspect) / (c.wideAspect - c.tallAspect), 0, 1);
  const w = Math.round(c.minW + (c.maxW - c.minW) * t);
  const h = Math.round(clamp(w / aspect, c.minH, c.maxH));
  return makeWorld(w, h);
}

/** Contain-fit the world into a canvas (CSS px), centred. */
export function fitWorld(world: World, canvasW: number, canvasH: number): Fit {
  const scale = Math.min(canvasW / world.w, canvasH / world.h);
  return { scale, ox: (canvasW - world.w * scale) / 2, oy: (canvasH - world.h * scale) / 2 };
}

export const clientToWorld = (fit: Fit, x: number, y: number): { x: number; y: number } => ({
  x: (x - fit.ox) / fit.scale,
  y: (y - fit.oy) / fit.scale,
});

export const worldToClient = (fit: Fit, x: number, y: number): { x: number; y: number } => ({
  x: x * fit.scale + fit.ox,
  y: y * fit.scale + fit.oy,
});

export const clampToWorld = (world: World, x: number, y: number): { x: number; y: number } => ({
  x: clamp(x, 0, world.w),
  y: clamp(y, 0, world.h),
});
