// One fixed simulation step. Rendering interpolates between the previous and current positions.
import { CONFIG } from '../config';
import { moveBall, normalizeBall } from './balls';
import { applyLossAndClear } from './outcome';
import { fireLasers, tickEffects, updateBolts, updateCapsules } from './powerups';
import { ballSpeed, emit, type World } from './world';

export interface Input {
  /** Absolute paddle target in field units (pointer/touch), or null when using keys. */
  targetX: number | null;
  /** -1, 0 or 1 from the keyboard. */
  axis: number;
  /** One-shot launch request. */
  launch: boolean;
}

export const NO_INPUT: Readonly<Input> = Object.freeze({ targetX: null, axis: 0, launch: false });

function movePaddle(w: World, dt: number, input: Input): void {
  const p = w.paddle;
  p.px = p.x;
  const half = p.w / 2;
  let x = p.x;
  if (input.targetX !== null) {
    const maxMove = CONFIG.paddle.followSpeed * dt;
    x += Math.max(-maxMove, Math.min(maxMove, input.targetX - x));
  } else x += input.axis * CONFIG.paddle.keySpeed * dt;
  p.x = Math.max(half, Math.min(w.field.w - half, x));
}

function launch(w: World): void {
  const speed = ballSpeed(w);
  const angle = (w.rng.next() - 0.5) * 2 * CONFIG.ball.launchJitter;
  for (const ball of w.balls) {
    if (!ball.stuck) continue;
    ball.stuck = false;
    ball.vx = speed * Math.sin(angle);
    ball.vy = -speed * Math.cos(angle);
  }
  w.phase = 'playing';
  emit(w, { type: 'launch', x: w.paddle.x, y: w.paddleY });
}

function carryStuck(w: World): void {
  for (const ball of w.balls) {
    if (!ball.stuck) continue;
    ball.px = ball.x;
    ball.x = w.paddle.x;
  }
}

export function stepWorld(w: World, dt: number, input: Input): void {
  if (w.phase === 'clear' || w.phase === 'over') return;
  w.time += dt;
  movePaddle(w, dt, input);
  if (w.phase === 'ready') {
    carryStuck(w);
    if (input.launch) launch(w);
    return;
  }
  tickEffects(w, dt);
  fireLasers(w, dt);
  updateBolts(w, dt);
  updateCapsules(w, dt);
  const speed = ballSpeed(w);
  for (const ball of w.balls) {
    ball.px = ball.x;
    ball.py = ball.y;
    normalizeBall(ball, speed);
    moveBall(w, ball, dt);
  }
  w.balls = w.balls.filter((b) => b.y - CONFIG.ball.r <= w.field.h);
  applyLossAndClear(w);
}
