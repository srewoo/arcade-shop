// Boss behaviour: enters, then sweeps side to side and changes attack as its health drops.
import { CONFIG, WORLD } from './config';
import { DIFFICULTY } from './config';
import type { Enemy, GameState } from './types';
import { aimAngle, spawnEnemyBullet } from './bullets';

export type BossPhase = 0 | 1 | 2;

export const bossPhase = (e: Pick<Enemy, 'hp' | 'maxHp'>): BossPhase => {
  const f = e.hp / e.maxHp;
  return f > 0.66 ? 0 : f > 0.33 ? 1 : 2;
};

const DOWN = Math.PI / 2;

function fan(s: GameState, e: Enemy, count: number, spread: number): void {
  for (let i = 0; i < count; i++) {
    const a = DOWN + (count === 1 ? 0 : (i / (count - 1) - 0.5) * 2 * spread);
    spawnEnemyBullet(s, e.x, e.y + e.r, a, 0.9);
  }
}

function attack(s: GameState, e: Enemy): number {
  const phase = bossPhase(e);
  const p = s.player;
  if (phase === 0) {
    fan(s, e, 5, 0.45);
    return 1.5;
  }
  if (phase === 1) {
    const a = aimAngle(e.x, e.y, p.x, p.y);
    for (const off of [-0.14, 0, 0.14]) spawnEnemyBullet(s, e.x, e.y + e.r, a + off, 1.15);
    if (Math.round(e.t / 1.2) % 2 === 0) fan(s, e, 7, 0.7);
    return 1.2;
  }
  const spin = e.t * 3;
  if (e.t % 3.4 < 2.1) {
    spawnEnemyBullet(s, e.x, e.y, spin, 0.8);
    spawnEnemyBullet(s, e.x, e.y, spin + Math.PI, 0.8);
    return 0.11;
  }
  return 0.6;
}

export function stepBoss(s: GameState, e: Enemy, dt: number): void {
  if (!e.armed) {
    e.y += CONFIG.boss.entrySpeed * dt;
    if (e.y >= CONFIG.boss.entryY) {
      e.y = CONFIG.boss.entryY;
      e.armed = true;
      e.t = 0;
    }
    return;
  }
  e.x = WORLD.w / 2 + 105 * Math.sin(e.t * 0.7);
  e.y = CONFIG.boss.entryY + 14 * Math.sin(e.t * 1.3);
  e.cd -= dt;
  if (e.cd <= 0) e.cd = attack(s, e) / DIFFICULTY[s.difficulty].fireRate;
}
