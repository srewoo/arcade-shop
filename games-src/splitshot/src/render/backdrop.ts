// Pre-renders the static layers of a stage (scenery, floor, ceiling beam, vignette) to one offscreen
// canvas per theme and view size. Animated extras live in ambient.ts.
import { makeRng } from '../sim/rng';
import type { Theme } from '../sim/types';
import { paintCeiling, paintFloor } from './floors';
import { aurora, lantern, storm } from './sceneryB';
import { coral, harbour, kelp } from './sceneryA';
import type { Scene } from './sceneKit';
import { THEME_ART } from './themes';
import { makeCanvas } from './util';
import { applyWorld, viewKey, type View } from './view';

const PAINT: Record<Theme, (sc: Scene) => void> = { harbour, coral, kelp, lantern, storm, aurora };
const SEEDS: Record<Theme, number> = { harbour: 11, coral: 23, kelp: 37, lantern: 41, storm: 53, aurora: 67 };

const cache = new Map<string, HTMLCanvasElement>();

function vignette(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  const g = ctx.createRadialGradient(w / 2, h * 0.55, Math.min(w, h) * 0.35, w / 2, h * 0.55, Math.max(w, h) * 0.8);
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(1, 'rgba(0,0,0,0.5)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
}

function paint(theme: Theme, v: View): HTMLCanvasElement {
  const cv = makeCanvas(v.pxW * v.dpr, v.pxH * v.dpr);
  const ctx = cv.getContext('2d') as CanvasRenderingContext2D;
  applyWorld(ctx, v);
  const sc: Scene = { ctx, x0: v.x0, x1: v.x1, y0: v.y0, y1: v.y1, art: THEME_ART[theme], rnd: makeRng(SEEDS[theme]) };
  PAINT[theme](sc);
  paintFloor(sc, theme);
  paintCeiling(sc);
  vignette(ctx, cv.width, cv.height);
  return cv;
}

/** Cached backdrop for a theme at this view size (keeps at most 3 renders in memory). */
export function getBackdrop(theme: Theme, v: View): HTMLCanvasElement {
  const key = `${theme}|${viewKey(v)}`;
  const hit = cache.get(key);
  if (hit) return hit;
  if (cache.size >= 3) cache.delete(cache.keys().next().value as string);
  const cv = paint(theme, v);
  cache.set(key, cv);
  return cv;
}
