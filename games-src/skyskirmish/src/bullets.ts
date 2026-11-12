import { CONFIG, DIFFICULTY, WORLD } from './config';
import type { Bullet, GameState } from './types';

/** Angle in radians measured from +x (so PI/2 points down the screen). */
export const aimAngle = (fx: number, fy: number, tx: number, ty: number): number => Math.atan2(ty - fy, tx - fx);

export function spawnEnemyBullet(s: GameState, x: number, y: number, angle: number, speedMul: number): void {
  if (s.eBullets.length >= CONFIG.bullet.cap) return;
  const v = CONFIG.bullet.enemySpeed * DIFFICULTY[s.difficulty].bulletSpeed * speedMul;
  s.eBullets.push({ x, y, px: x, py: y, vx: Math.cos(angle) * v, vy: Math.sin(angle) * v, r: CONFIG.bullet.r });
}

export function spawnPlayerBullet(s: GameState, x: number, y: number, angle: number): void {
  const v = CONFIG.player.bulletSpeed;
  s.pBullets.push({ x, y, px: x, py: y, vx: Math.sin(angle) * v, vy: -Math.cos(angle) * v, r: CONFIG.bullet.playerR });
}

export function moveBullets(list: Bullet[], dt: number): Bullet[] {
  const m = 30;
  const kept: Bullet[] = [];
  for (const b of list) {
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    if (b.r > 0 && b.x > -m && b.x < WORLD.w + m && b.y > -m && b.y < WORLD.h + m) kept.push(b);
  }
  return kept;
}
