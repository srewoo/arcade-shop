// Falling capsules, active effect timers and laser bolts.
import { CONFIG } from '../config';
import type { PowerKind } from '../levels/format';
import { damageBrick } from './bricks';
import { addScore, emit, type World } from './world';

const P = CONFIG.power;

export function applyPower(w: World, kind: PowerKind): void {
  if (kind === 'wide') w.effects.wide = P.wideSec;
  else if (kind === 'slow') w.effects.slow = P.slowSec;
  else if (kind === 'laser') w.effects.laser = P.laserSec;
  else splitBalls(w);
}

function splitBalls(w: World): void {
  const source = w.balls.filter((b) => !b.stuck);
  for (const ball of source) {
    for (const sign of [-1, 1]) {
      if (w.balls.length >= CONFIG.ball.maxBalls) return;
      const a = P.splitRad * sign;
      const vx = ball.vx * Math.cos(a) - ball.vy * Math.sin(a);
      const vy = ball.vx * Math.sin(a) + ball.vy * Math.cos(a);
      w.balls.push({ ...ball, vx, vy });
    }
  }
}

/** Count timers down; shrink or grow the paddle toward its target width. */
export function tickEffects(w: World, dt: number): void {
  const e = w.effects;
  e.wide = Math.max(0, e.wide - dt);
  e.slow = Math.max(0, e.slow - dt);
  e.laser = Math.max(0, e.laser - dt);
  const target = CONFIG.paddle.w * (e.wide > 0 ? CONFIG.paddle.wideMul : 1);
  const diff = target - w.paddle.w;
  const move = CONFIG.paddle.resizeSpeed * dt;
  w.paddle.w = Math.abs(diff) <= move ? target : w.paddle.w + Math.sign(diff) * move;
}

export function updateCapsules(w: World, dt: number): void {
  const pad = w.paddle;
  const top = w.paddleY;
  const keep = [];
  for (const c of w.capsules) {
    c.py = c.y;
    c.px = c.x;
    c.y += P.fallSpeed * dt;
    const bottom = c.y + P.capsuleH / 2;
    const caught = bottom >= top && c.y - P.capsuleH / 2 <= top + CONFIG.paddle.h && Math.abs(c.x - pad.x) <= pad.w / 2 + P.capsuleW / 2;
    if (caught) {
      applyPower(w, c.kind);
      addScore(w, CONFIG.score.catchBonus);
      emit(w, { type: c.kind === 'multi' ? 'multi' : 'catch', x: c.x, y: c.y, kind: c.kind });
    } else if (c.y < w.field.h + P.capsuleH) keep.push(c);
  }
  w.capsules = keep;
}

export function fireLasers(w: World, dt: number): void {
  w.laserCd = Math.max(0, w.laserCd - dt);
  if (w.effects.laser <= 0 || w.laserCd > 0) return;
  w.laserCd = P.laserCooldown;
  const y = w.paddleY;
  for (const sign of [-1, 1]) w.bolts.push({ x: w.paddle.x + sign * (w.paddle.w / 2 - 6), y, py: y });
  emit(w, { type: 'laser', x: w.paddle.x, y });
}

export function updateBolts(w: World, dt: number): void {
  const { cols, brickW, brickH, top, maxRows } = CONFIG.field;
  const keep = [];
  for (const bolt of w.bolts) {
    bolt.py = bolt.y;
    bolt.y -= P.boltSpeed * dt;
    const row = Math.floor((bolt.y - top) / brickH);
    const col = Math.floor((bolt.x - w.ox) / brickW);
    const inGrid = row >= 0 && row < maxRows && col >= 0 && col < cols;
    const idx = row * cols + col;
    if (inGrid && w.bricks[idx]) {
      damageBrick(w, idx, false);
    } else if (bolt.y > -20) keep.push(bolt);
  }
  w.bolts = keep;
}
