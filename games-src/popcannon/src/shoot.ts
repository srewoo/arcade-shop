// Firing, swapping and flight. Mutates Game; no DOM. Landing lives in resolve.ts.
import { Ball as AimBall, SUBSTEP, clampAngle, dirFromAngle, reflectX, stepBall } from './aim';
import { TUNING } from './config';
import { pushTrail } from './effects';
import { SHOOTER, hitsBubble, landingCell } from './hex';
import { landAt, lose } from './resolve';
import { Game, drawNext, emit, loadBoard, shotsLeft } from './state';

export const BALL_SPEED = TUNING.ball.speed;

export function canShoot(g: Game): boolean {
  return g.status === 'playing' && !g.ball && g.cur !== null && shotsLeft(g) > 0;
}

export function aim(g: Game, angle: number): void {
  g.angle = clampAngle(angle);
}

export function fire(g: Game): boolean {
  if (!canShoot(g) || !g.cur) return false;
  const d = dirFromAngle(g.angle);
  g.ball = { x: SHOOTER.x, y: SHOOTER.y, vx: d.x, vy: d.y, rx: SHOOTER.x, ry: SHOOTER.y, px: SHOOTER.x, py: SHOOTER.y };
  g.ballAcc = 0;
  g.flying = g.cur;
  g.cur = g.next;
  g.next = drawNext(g);
  g.shots++;
  g.fireBuffer = 0;
  g.recoil = 1;
  g.flash = 1;
  g.fx.trail.length = 0;
  emit(g, 'fire');
  return true;
}

/** Fire now if possible; otherwise remember the press briefly so it fires on landing. */
export function requestFire(g: Game): boolean {
  if (fire(g)) return true;
  if (g.ball && g.status === 'playing' && shotsLeft(g) > 0) g.fireBuffer = TUNING.timers.fireBuffer;
  return false;
}

export function swap(g: Game): boolean {
  if (g.status !== 'playing' || !g.cur || !g.next) return false;
  [g.cur, g.next] = [g.next, g.cur];
  emit(g, 'swap');
  return true;
}

function land(g: Game): void {
  const ball = g.ball;
  const bubble = g.flying;
  g.ball = null;
  g.flying = null;
  if (!ball || !bubble) return;
  const pos = landingCell(g.grid, ball.x, ball.y);
  if (!pos) return lose(g);
  landAt(g, pos, bubble);
}

/**
 * Advance the in-flight bubble in fixed SUBSTEP slices, so the flight (and the aim guide,
 * which uses the same slices) is identical whatever the frame rate.
 */
export function moveBall(g: Game, dt: number): void {
  if (!g.ball) return;
  g.ball.px = g.ball.rx;
  g.ball.py = g.ball.ry;
  g.ballAcc += BALL_SPEED * dt;
  while (g.ball && g.ballAcc >= SUBSTEP) {
    g.ballAcc -= SUBSTEP;
    stepBall(g.ball as AimBall, SUBSTEP);
    if (hitsBubble(g.grid, g.ball.x, g.ball.y)) land(g);
  }
  if (g.ball) smoothPosition(g.ball, g.ballAcc);
  if (g.ball) pushTrail(g.fx, g.ball.rx, g.ball.ry);
}

/** Render position: the collision position plus the sub-substep remainder, so motion is continuous. */
function smoothPosition(b: Game['ball'] & object, ahead: number): void {
  const r = reflectX(b.x + b.vx * ahead, b.vx);
  b.rx = r.x;
  b.ry = b.y + b.vy * ahead;
}

export function nextArcadeLevel(g: Game): void {
  g.level++;
  g.status = 'playing';
  loadBoard(g);
}
