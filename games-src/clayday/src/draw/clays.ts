// Clays, gun and reticle.
import { clayRadius, clayVelocity, type Clay, type ClayKind } from '../clay';
import { trailPoints } from '../visuals';
import { PALETTE as P } from '../palette';
import { baked } from './sprites';
import type { World } from '../world';

const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

/** Paint a clay (unit: radius r, centred) with a lit dome, a flange ring and a contrasting outline. */
function paintClay(g: CanvasRenderingContext2D, r: number, kind: ClayKind, assist: boolean): void {
  const gold = kind === 'gold';
  const lw = assist ? 5 : 3.5;
  g.beginPath();
  g.arc(0, 0, r, 0, Math.PI * 2);
  g.strokeStyle = P.clayHalo;
  g.lineWidth = lw + 7;
  g.stroke();
  const body = g.createRadialGradient(-r * 0.35, -r * 0.4, r * 0.1, 0, 0, r);
  body.addColorStop(0, gold ? '#fff0a0' : '#ffb25c');
  body.addColorStop(0.6, gold ? P.clayGold : P.clay);
  body.addColorStop(1, gold ? '#c9961a' : '#c95e0a');
  g.fillStyle = body;
  g.strokeStyle = P.clayOutline;
  g.lineWidth = lw;
  g.fill();
  g.stroke();
  // Flange ring and raised dome.
  g.strokeStyle = 'rgba(36,20,10,0.35)';
  g.lineWidth = 1.5;
  g.beginPath();
  g.arc(0, 0, r * 0.78, 0, Math.PI * 2);
  g.stroke();
  const dome = g.createRadialGradient(-r * 0.15, -r * 0.2, r * 0.05, 0, 0, r * 0.55);
  dome.addColorStop(0, '#fff3d6');
  dome.addColorStop(0.5, P.clayRim);
  dome.addColorStop(1, gold ? '#d9a82a' : '#e0954a');
  g.fillStyle = dome;
  g.beginPath();
  g.arc(0, 0, r * 0.55, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = 'rgba(255,255,255,0.85)';
  g.beginPath();
  g.ellipse(-r * 0.22, -r * 0.26, r * 0.14, r * 0.08, -0.5, 0, Math.PI * 2);
  g.fill();
  if (gold || assist) {
    g.strokeStyle = P.clayOutline;
    g.lineWidth = 3;
    g.beginPath();
    g.arc(0, 0, r * 0.3, 0, Math.PI * 2);
    g.stroke();
  }
  if (assist && kind === 'mini') {
    g.beginPath();
    g.moveTo(-r, 0);
    g.lineTo(r, 0);
    g.stroke();
  }
}

export function drawClayShape(ctx: CanvasRenderingContext2D, x: number, y: number, kind: ClayKind, age: number, assist: boolean): void {
  const r = clayRadius(kind);
  const pad = 14;
  const sprite = baked(`clay|${kind}|${assist}|${r}`, (r + pad) * 2, (r + pad) * 2, (g) => {
    g.translate(r + pad, r + pad);
    paintClay(g, r, kind, assist);
  }, 3);
  const squash = 0.4 + 0.22 * Math.abs(Math.sin(age * 3.1));
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(Math.sin(age * 2.3) * 0.35);
  ctx.scale(1, squash);
  ctx.drawImage(sprite, -(r + pad), -(r + pad), (r + pad) * 2, (r + pad) * 2);
  ctx.restore();
  if (kind === 'gold') {
    ctx.save();
    ctx.translate(x, y);
    ctx.globalAlpha = 0.6 + 0.4 * Math.sin(age * 9);
    ctx.fillStyle = '#ffffff';
    const s = r * 0.35;
    ctx.rotate(age * 2);
    ctx.beginPath();
    ctx.moveTo(0, -s * 2); ctx.lineTo(s * 0.35, -s * 0.35); ctx.lineTo(s * 2, 0); ctx.lineTo(s * 0.35, s * 0.35);
    ctx.lineTo(0, s * 2); ctx.lineTo(-s * 0.35, s * 0.35); ctx.lineTo(-s * 2, 0); ctx.lineTo(-s * 0.35, -s * 0.35);
    ctx.fill();
    ctx.restore();
  }
}

/** Soft ground shadow: smaller and fainter the higher the clay is above its launch roof. */
function drawShadow(ctx: CanvasRenderingContext2D, w: World, x: number, y: number, r: number): void {
  const height = Math.max(0, Math.min(1, (w.launchY - y) / Math.max(1, w.arc)));
  const k = 1 - 0.55 * height;
  ctx.fillStyle = P.shadow;
  ctx.globalAlpha = 0.5 * k;
  ctx.beginPath();
  ctx.ellipse(x, w.groundY + w.h * 0.06, r * 1.05 * k, r * 0.32 * k, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
}

/** Fading ghost discs behind a flying clay so its direction reads against the busy treeline. */
function drawTrail(ctx: CanvasRenderingContext2D, c: Clay, w: World, x: number, y: number): void {
  const v = clayVelocity(c.spec, w, c.wind, c.age);
  const r = clayRadius(c.spec.kind);
  ctx.fillStyle = c.spec.kind === 'gold' ? P.clayGold : P.clayHalo;
  for (const t of trailPoints(x, y, v.x, v.y, 4, 0.028)) {
    ctx.globalAlpha = 0.34 * t.k;
    ctx.beginPath();
    ctx.ellipse(t.x, t.y, r * (0.45 + 0.35 * t.k), r * 0.2 * (0.6 + 0.4 * t.k), 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

export function drawClays(ctx: CanvasRenderingContext2D, clays: readonly Clay[], alpha: number, assist: boolean, w: World, trail: boolean): void {
  for (const c of clays) {
    if (c.state !== 'flying') continue;
    const x = lerp(c.px, c.x, alpha);
    const y = lerp(c.py, c.y, alpha);
    drawShadow(ctx, w, x, y, clayRadius(c.spec.kind));
    if (trail) drawTrail(ctx, c, w, x, y);
    drawClayShape(ctx, x, y, c.spec.kind, c.age, assist);
  }
}

/** Crosshair ring sized to the pellet spread, light on dark so it reads on sky and grass. */
export function drawReticle(ctx: CanvasRenderingContext2D, x: number, y: number, spread: number, scale: number): void {
  const r = spread + 10;
  const gap = 6;
  const arm = r + 14;
  const px = 1 / scale;
  for (const [color, lw] of [[P.reticleOutline, 6 * px], [P.reticle, 3 * px]] as const) {
    ctx.strokeStyle = color;
    ctx.lineWidth = lw;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
      ctx.moveTo(x + dx * gap, y + dy * gap);
      ctx.lineTo(x + dx * arm, y + dy * arm);
    }
    ctx.stroke();
  }
}
