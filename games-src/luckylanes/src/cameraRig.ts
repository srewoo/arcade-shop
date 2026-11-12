// Camera follow: render-only, never read by the physics.
import { HEAD_Y, START_X_LIMIT } from './constants';
import { approach, followTarget, type Camera } from './project';
import { clamp } from './rng';
import { TUNING } from './tuning';
import type { Stage } from './turnFlow';
import type { Ball } from './worldTypes';

export function updateCamera(cam: Camera, stage: Stage, stageT: number, ball: Ball, dt: number): void {
  const hold = stage === 'rolling' || stage === 'settle' || stage === 'sweep' || (stage === 'banner' && stageT < 0.9);
  const rolling = stage === 'rolling';
  const target = rolling ? followTarget(ball.y, true, HEAD_Y) : hold ? cam.y : followTarget(0, false, HEAD_Y);
  cam.y = approach(cam.y, target, rolling ? TUNING.camera.followRate : TUNING.camera.idleRate, dt);
  const xTarget = rolling && ball.active ? clamp(ball.x, -START_X_LIMIT, START_X_LIMIT) * 0.3 : 0;
  cam.x = approach(cam.x, xTarget, 4, dt);
}
