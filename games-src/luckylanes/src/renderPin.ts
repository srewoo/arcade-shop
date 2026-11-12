// Ten-pin art: smooth lathe silhouette, cylinder shading, curved neck stripes, gloss and a faint lane reflection.
import { FALL_TIME, PIN_R } from './constants';
import { memoGradient, quantiseScale } from './gradients';
import { project, type Camera } from './project';
import type { Pin } from './worldTypes';

type Ctx = CanvasRenderingContext2D;

const PIN_H = 38;
/** [height cm, half-width cm] control points of a ten-pin; smoothed once at load. */
const CONTROL: readonly (readonly [number, number])[] = [
  [0, 3.5], [1.2, 4.7], [5, 5.9], [10, 6.05], [15, 5.2], [19, 3.9], [22.5, 2.9], [25.5, 2.55], [28.5, 2.7], [31.5, 3.55], [34.5, 3.7], [36.6, 2.9], [37.9, 1.2], [38, 0],
];

function smooth(points: readonly (readonly [number, number])[], per: number): [number, number][] {
  const out: [number, number][] = [];
  const at = (i: number): readonly [number, number] => points[Math.max(0, Math.min(points.length - 1, i))] as readonly [number, number];
  for (let i = 0; i < points.length - 1; i++) {
    for (let k = 0; k < per; k++) {
      const t = k / per;
      const [p0, p1, p2, p3] = [at(i - 1), at(i), at(i + 1), at(i + 2)];
      const c = (a: number, b: number, c2: number, d: number): number =>
        0.5 * (2 * b + (-a + c2) * t + (2 * a - 5 * b + 4 * c2 - d) * t * t + (-a + 3 * b - 3 * c2 + d) * t * t * t);
      out.push([c(p0[0], p1[0], p2[0], p3[0]), Math.max(0, c(p0[1], p1[1], p2[1], p3[1]))]);
    }
  }
  out.push(points[points.length - 1] as [number, number]);
  return out;
}

export const PROFILE = smooth(CONTROL, 4);

function silhouette(ctx: Ctx, s: number): void {
  ctx.beginPath();
  PROFILE.forEach(([v, u], i) => (i === 0 ? ctx.moveTo(u * s, -v * s) : ctx.lineTo(u * s, -v * s)));
  for (let i = PROFILE.length - 1; i >= 0; i--) {
    const [v, u] = PROFILE[i] as readonly [number, number];
    ctx.lineTo(-u * s, -v * s);
  }
  ctx.closePath();
}

/** Curved band across the body at height v, thickness t (cm), bowing towards the viewer. */
function band(ctx: Ctx, s: number, v: number, t: number): void {
  const w = 7 * s;
  const bow = 0.9 * s;
  ctx.beginPath();
  ctx.moveTo(-w, -v * s);
  ctx.quadraticCurveTo(0, -v * s + bow * 2, w, -v * s);
  ctx.lineTo(w, -(v + t) * s);
  ctx.quadraticCurveTo(0, -(v + t) * s + bow * 2, -w, -(v + t) * s);
  ctx.closePath();
  ctx.fill();
}

function shade(ctx: Ctx, q: number): CanvasGradient {
  return memoGradient(`pinshade|${q}`, () => {
    const g = ctx.createLinearGradient(-6.2 * q, 0, 6.2 * q, 0);
    g.addColorStop(0, 'rgba(40,30,90,0.55)');
    g.addColorStop(0.22, 'rgba(60,50,120,0.08)');
    g.addColorStop(0.42, 'rgba(255,255,255,0.28)');
    g.addColorStop(0.6, 'rgba(255,255,255,0)');
    g.addColorStop(0.88, 'rgba(60,40,110,0.3)');
    g.addColorStop(1, 'rgba(77,216,255,0.4)');
    return g;
  });
}

function pinBody(ctx: Ctx, s: number): void {
  const q = quantiseScale(s);
  silhouette(ctx, s);
  ctx.fillStyle = '#f7f4fb';
  ctx.fill();
  ctx.save();
  ctx.clip();
  ctx.fillStyle = '#d02a40';
  band(ctx, s, 27.4, 2.2);
  band(ctx, s, 24, 1.3);
  ctx.fillStyle = shade(ctx, q);
  ctx.fillRect(-7 * s, -PIN_H * s, 14 * s, PIN_H * s);
  // belly gloss streak and a small head highlight
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  ctx.beginPath();
  ctx.ellipse(-1.9 * s, -10 * s, 0.7 * s, 4.2 * s, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(-1.0 * s, -33 * s, 0.5 * s, 1.5 * s, 0.2, 0, Math.PI * 2);
  ctx.fill();
  // base collar shade
  ctx.fillStyle = 'rgba(70,50,110,0.25)';
  ctx.fillRect(-7 * s, -2.2 * s, 14 * s, 2.2 * s);
  ctx.restore();
  silhouette(ctx, s);
  ctx.strokeStyle = 'rgba(40,28,80,0.5)';
  ctx.lineWidth = Math.max(0.6, s * 0.22);
  ctx.stroke();
}

function ground(ctx: Ctx, cam: Camera, x: number, y: number, r: number, alpha: number): void {
  const p = project(cam, x, y, 0);
  const rx = r * p.s * 1.5;
  const ry = r * p.s * 0.55;
  ctx.save();
  ctx.translate(p.sx, p.sy);
  ctx.scale(rx, ry);
  ctx.fillStyle = memoGradient('pinshadow', () => {
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, 1);
    g.addColorStop(0, 'rgba(30,12,0,0.55)');
    g.addColorStop(0.6, 'rgba(30,12,0,0.22)');
    g.addColorStop(1, 'rgba(30,12,0,0)');
    return g;
  });
  ctx.globalAlpha = Math.min(1, alpha * 3);
  ctx.beginPath();
  ctx.arc(0, 0, 1, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export { ground };

/** Draw one pin: standing (with wobble), toppling, or lying. */
export function drawPin(ctx: Ctx, cam: Camera, pin: Pin, time: number): void {
  const p = project(cam, pin.x, pin.y, 0);
  ground(ctx, cam, pin.x, pin.y, PIN_R, 0.28);
  ctx.save();
  ctx.translate(p.sx, p.sy);
  if (pin.state === 'standing') {
    // Lacquer reflection: a flipped, faint copy under the pin.
    ctx.save();
    ctx.scale(1, -0.45);
    ctx.globalAlpha = 0.14;
    pinBody(ctx, p.s);
    ctx.restore();
    const wob = Math.min(1, pin.stress / 90) * 0.16 * Math.sin(time * 38 + pin.index);
    ctx.rotate(wob);
    pinBody(ctx, p.s);
  } else {
    const a = pin.state === 'down' ? 1 : Math.min(1, pin.fallT / FALL_TIME);
    const ax = pin.fallDx * a;
    const ay = -(1 - a) - pin.fallDy * 0.3 * a;
    const lenf = Math.max(0.35, Math.min(1, Math.hypot(ax, ay)));
    ctx.rotate(Math.atan2(ax, -ay));
    ctx.translate(0, a * (PIN_H / 2) * p.s * lenf);
    ctx.scale(1, lenf);
    pinBody(ctx, p.s);
  }
  ctx.restore();
}
