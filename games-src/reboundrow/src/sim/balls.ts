// Ball movement: swept collision against walls, paddle and bricks, resolved in time order.
import { CONFIG } from '../config';
import { damageBrick } from './bricks';
import { sweepCircleBox, type Hit } from './collide';
import { ballSpeed, brickRect, emit, type Ball, type World } from './world';

const R = CONFIG.ball.r;
const MAX_BOUNCES = 8;

interface Contact extends Hit { kind: 'wall' | 'paddle' | 'brick'; idx: number }

/** Keep speed constant and stop near-horizontal runs. */
export function normalizeBall(ball: Ball, speed: number): void {
  const len = Math.hypot(ball.vx, ball.vy);
  if (len === 0) return;
  let vx = (ball.vx / len) * speed;
  let vy = (ball.vy / len) * speed;
  const minVy = speed * CONFIG.ball.minVyRatio;
  if (Math.abs(vy) < minVy) {
    vy = (vy < 0 || vy === 0 ? -1 : 1) * minVy;
    vx = Math.sign(vx || 1) * Math.sqrt(speed * speed - vy * vy);
  }
  ball.vx = vx;
  ball.vy = vy;
}

function wallContact(w: World, ball: Ball, dx: number, dy: number): Contact | null {
  let best: Contact | null = null;
  const consider = (t: number, nx: number, ny: number): void => {
    if (t >= 0 && t <= 1 && (!best || t < best.t)) best = { t, nx, ny, kind: 'wall', idx: -1 };
  };
  if (dx < 0) consider(Math.max(0, (R - ball.x) / dx), 1, 0);
  if (dx > 0) consider(Math.max(0, (w.field.w - R - ball.x) / dx), -1, 0);
  if (dy < 0) consider(Math.max(0, (R - ball.y) / dy), 0, 1);
  return best;
}

function paddleContact(w: World, ball: Ball, dx: number, dy: number): Contact | null {
  const top = w.paddleY;
  if (ball.y > top + CONFIG.paddle.h) return null;
  const half = w.paddle.w / 2;
  const hit = sweepCircleBox(ball.x, ball.y, dx, dy, R, w.paddle.x - half, top, w.paddle.x + half, top + CONFIG.paddle.h);
  if (!hit || hit.ny > 0) return null;
  return { ...hit, kind: 'paddle', idx: -1 };
}

function brickContact(w: World, ball: Ball, dx: number, dy: number): Contact | null {
  const { cols, brickW, brickH, top, maxRows } = CONFIG.field;
  const c0 = Math.max(0, Math.floor((Math.min(ball.x, ball.x + dx) - R - w.ox) / brickW));
  const c1 = Math.min(cols - 1, Math.floor((Math.max(ball.x, ball.x + dx) + R - w.ox) / brickW));
  const r0 = Math.max(0, Math.floor((Math.min(ball.y, ball.y + dy) - R - top) / brickH));
  const r1 = Math.min(maxRows - 1, Math.floor((Math.max(ball.y, ball.y + dy) + R - top) / brickH));
  let best: Contact | null = null;
  for (let r = r0; r <= r1; r++) {
    for (let c = c0; c <= c1; c++) {
      const idx = r * cols + c;
      if (!w.bricks[idx]) continue;
      const b = brickRect(idx, w.ox);
      const hit = sweepCircleBox(ball.x, ball.y, dx, dy, R, b.left, b.top, b.right, b.bottom);
      if (hit && (!best || hit.t < best.t) && hit.nx * dx + hit.ny * dy < 0) best = { ...hit, kind: 'brick', idx };
    }
  }
  return best;
}

function earliest(w: World, ball: Ball, dx: number, dy: number): Contact | null {
  let best: Contact | null = null;
  for (const cand of [wallContact(w, ball, dx, dy), paddleContact(w, ball, dx, dy), brickContact(w, ball, dx, dy)]) {
    if (cand && cand.nx * dx + cand.ny * dy < 0 && (!best || cand.t < best.t)) best = cand;
  }
  return best;
}

function bounceOffPaddle(w: World, ball: Ball, hit: Hit, speed: number): void {
  if (hit.ny === 0) {
    ball.vx = -ball.vx;
    return;
  }
  const off = Math.max(-1, Math.min(1, (ball.x - w.paddle.x) / (w.paddle.w / 2)));
  const angle = off * (CONFIG.ball.maxAngleDeg * Math.PI) / 180;
  ball.vx = speed * Math.sin(angle);
  ball.vy = -speed * Math.cos(angle);
  w.combo = 0;
}

function resolve(w: World, ball: Ball, hit: Contact, speed: number): void {
  const dot = ball.vx * hit.nx + ball.vy * hit.ny;
  const at = { x: ball.x, y: ball.y };
  if (hit.kind === 'paddle') {
    bounceOffPaddle(w, ball, hit, speed);
    emit(w, { type: 'paddle', ...at });
    return;
  }
  ball.vx -= 2 * dot * hit.nx;
  ball.vy -= 2 * dot * hit.ny;
  if (hit.kind === 'wall') emit(w, { type: 'wall', ...at });
  else damageBrick(w, hit.idx, true);
}

/** Advance one ball by dt, resolving up to MAX_BOUNCES contacts in order of impact time. */
export function moveBall(w: World, ball: Ball, dt: number): void {
  const speed = ballSpeed(w);
  let left = dt;
  for (let i = 0; i < MAX_BOUNCES && left > 1e-9; i++) {
    const dx = ball.vx * left;
    const dy = ball.vy * left;
    const hit = earliest(w, ball, dx, dy);
    if (!hit) {
      ball.x += dx;
      ball.y += dy;
      return;
    }
    ball.x += dx * hit.t;
    ball.y += dy * hit.t;
    resolve(w, ball, hit, speed);
    left *= 1 - hit.t;
  }
}
