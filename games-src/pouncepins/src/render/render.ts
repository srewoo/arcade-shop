// Composes a frame: backdrop, lane, ghost arrow, cats and ball sorted by depth, effects.
import { CONFIG } from '../config';
import type { Match } from '../match';
import { catPose } from './pose';
import { drawCatBody } from './cat';
import { drawBall, drawFish, drawGhost } from './ball';
import { paintBackdrop } from './backdrop';
import { paintCushions, paintLane } from './lane';
import { drawBubbles, drawParticles, type Fx } from './fx';
import { makeCamera, type Camera } from './camera';
import type { Cat } from '../worldTypes';

export interface View {
  readonly canvas: HTMLCanvasElement;
  cam: Camera;
  dpr: number;
  /** Wall, floor, lane and the far cushions, baked once per size. */
  backdrop: HTMLCanvasElement | null;
  /** Near-side cushions drawn over the cats (landscape only). */
  front: HTMLCanvasElement | null;
  spin: number;
}

export function createView(canvas: HTMLCanvasElement): View {
  return { canvas, cam: makeCamera(300, 300), dpr: 1, backdrop: null, front: null, spin: 0 };
}

/** Match the canvas backing store to its CSS size (DPR capped at 2). */
export function resizeView(v: View): boolean {
  const rect = v.canvas.getBoundingClientRect();
  const w = Math.max(160, Math.round(rect.width)), h = Math.max(120, Math.round(rect.height));
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  if (w === v.cam.w && h === v.cam.h && dpr === v.dpr && v.backdrop) return false;
  v.dpr = dpr;
  v.canvas.width = Math.round(w * dpr); v.canvas.height = Math.round(h * dpr);
  v.cam = makeCamera(w, h);
  v.canvas.parentElement?.setAttribute('data-portrait', String(v.cam.portrait));
  v.backdrop = bake(v, (oc) => {
    paintBackdrop(oc, v.cam);
    paintLane(oc, v.cam);
    paintCushions(oc, v.cam, 'back');
    paintCushions(oc, v.cam, 'far');
    if (v.cam.portrait) paintCushions(oc, v.cam, 'near');
  });
  v.front = v.cam.portrait ? null : bake(v, (oc) => paintCushions(oc, v.cam, 'near'));
  return true;
}

function bake(v: View, paint: (c: CanvasRenderingContext2D) => void): HTMLCanvasElement | null {
  const off = document.createElement('canvas');
  off.width = v.canvas.width; off.height = v.canvas.height;
  const oc = off.getContext('2d');
  if (!oc) return null;
  oc.scale(v.dpr, v.dpr);
  paint(oc);
  return off;
}

export interface FrameInput { readonly match: Match; readonly alpha: number; readonly time: number; readonly assist: boolean; readonly reduce: boolean; readonly fx: Fx }

interface Drawable { readonly depth: number; readonly draw: () => void }

function catDrawable(c: CatCtx, cat: Cat): Drawable | null {
  const pose = catPose(cat);
  if (pose.name === 'gone') return null;
  const x = cat.px + (cat.x - cat.px) * c.alpha, y = cat.py + (cat.y - cat.py) * c.alpha;
  const p = c.cam.project(x, y);
  return {
    depth: p.y + (pose.name === 'tumble' ? 0.5 : 0),
    draw: () => {
      const g = c.ctx;
      g.save();
      g.fillStyle = 'rgba(0,0,0,0.25)';
      g.beginPath(); g.ellipse(p.x, p.y, 14 * c.cam.k * (1 - pose.z / 120), 5 * c.cam.k, 0, 0, 7); g.fill();
      if (pose.name === 'cushion') { g.fillStyle = '#f2a33a'; g.strokeStyle = '#2b2420'; g.lineWidth = 2; g.beginPath(); g.ellipse(p.x, p.y - 2, 18 * c.cam.k, 10 * c.cam.k, 0, 0, 7); g.fill(); g.stroke(); }
      g.translate(p.x, p.y - pose.z * c.cam.k); g.scale(c.cam.k, c.cam.k);
      g.translate(0, -24); g.rotate(pose.rot); g.translate(0, 24);
      const yowl = pose.sinceLand > 0 && pose.sinceLand < CONFIG.fx.yowlSecs && (pose.name === 'landed' || pose.name === 'cushion');
      drawCatBody(g, { kind: cat.kind, coat: cat.coat, pose, yowl, assist: c.assist, time: c.time + cat.id });
      g.restore();
    },
  };
}

interface CatCtx { readonly ctx: CanvasRenderingContext2D; readonly cam: Camera; readonly alpha: number; readonly assist: boolean; readonly time: number }

export function renderFrame(v: View, f: FrameInput): void {
  const ctx = v.canvas.getContext('2d');
  if (!ctx) return;
  const { cam } = v;
  ctx.setTransform(v.dpr, 0, 0, v.dpr, 0, 0);
  const shake = !f.reduce && f.fx.shake > 0 ? f.fx.shake * 6 : 0;
  ctx.save();
  if (shake) ctx.translate((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake);
  if (v.backdrop) ctx.drawImage(v.backdrop, 0, 0, cam.w, cam.h);
  const { world } = f.match;
  if (world.fish && !world.fish.taken) drawFish(ctx, cam, world.fish.x, world.fish.y, f.time, f.reduce);
  const phase = f.match.phase;
  if (phase === 'aim' || phase === 'power') {
    const a = f.match.aim;
    drawGhost(ctx, cam, a.prev + (a.angle - a.prev) * f.alpha, f.match.curve, f.assist);
  }
  const cc: CatCtx = { ctx, cam, alpha: f.alpha, assist: f.assist, time: f.time };
  const list = world.cats.map((c) => catDrawable(cc, c)).filter((d): d is Drawable => d !== null);
  if (world.ball.active || (phase === 'rolling' && world.ball.launched)) {
    const b = world.ball;
    v.spin = (Math.hypot(b.x, b.y) / 18) % 6.283;
    list.push({ depth: cam.project(b.x, b.y).y, draw: () => drawBall(ctx, cam, b, f.alpha, v.spin) });
  } else if (phase === 'aim' || phase === 'power') {
    list.push({ depth: cam.project(0, 0).y, draw: () => drawBall(ctx, cam, { ...world.ball, x: 0, y: 0, px: 0, py: 0 }, 0, 0) });
  }
  list.sort((a, b) => a.depth - b.depth).forEach((d) => d.draw());
  if (v.front) ctx.drawImage(v.front, 0, 0, cam.w, cam.h);
  drawParticles(ctx, cam, f.fx);
  drawBubbles(ctx, cam, f.fx);
  ctx.restore();
}
