// Enemy creation, movement along a path, and shooting. Positions are pure functions of age.
import { CONFIG, DIFFICULTY, ENEMY, WORLD } from './config';
import type { Spawn } from './waves';
import type { Enemy, GameState } from './types';
import { spawnEnemyBullet, aimAngle } from './bullets';

const HOLD_Y = 150;
const HOLD_SECS = 6;

export function pathPos(e: Pick<Enemy, 'path' | 't' | 'x0' | 'y0' | 'dir'>, speed: number): { x: number; y: number } {
  switch (e.path) {
    case 'sine':
      return { x: e.x0 + 55 * Math.sin(e.t * 2.2), y: e.y0 + speed * e.t };
    case 'sweep':
      return { x: e.x0 + e.dir * 110 * e.t, y: e.y0 + speed * 0.8 * e.t };
    case 'hold': {
      const y = e.t < HOLD_SECS ? Math.min(HOLD_Y, e.y0 + speed * 1.6 * e.t) : HOLD_Y + (e.t - HOLD_SECS) * speed * 1.5;
      return { x: e.x0 + e.dir * 35 * Math.sin(e.t * 0.9), y };
    }
    default:
      return { x: e.x0, y: e.y0 + speed * e.t };
  }
}

export function spawnEnemy(s: GameState, sp: Spawn): void {
  const d = DIFFICULTY[s.difficulty];
  const tuning = sp.kind === 'boss' ? undefined : ENEMY[sp.kind];
  const base = tuning ? tuning.hp * (1 + s.wave.index * 0.05) : CONFIG.boss.hp + CONFIG.boss.hpPerBoss * s.bossesDown;
  const hp = Math.max(1, Math.round(base * d.hp));
  const y0 = tuning ? -20 : -50;
  s.enemies.push({
    id: s.nextId++, kind: sp.kind, hp, maxHp: hp, r: tuning?.r ?? CONFIG.boss.r,
    t: 0, x0: sp.x, y0, x: sp.x, y: y0, px: sp.x, py: y0, path: sp.path, dir: sp.dir,
    cd: (tuning?.fire || 1.5) * s.rng.range(0.6, 1.3), flash: 0, armed: tuning !== undefined,
  });
}

function fireAt(s: GameState, e: Enemy): void {
  const kind = e.kind;
  if (kind === 'boss') return;
  const p = s.player;
  const down = Math.PI / 2;
  if (kind === 'weaver') spawnEnemyBullet(s, e.x, e.y + e.r, down, 1);
  else if (kind === 'gunner') spawnEnemyBullet(s, e.x, e.y + e.r, aimAngle(e.x, e.y, p.x, p.y), 1.1);
  else if (kind === 'tank') {
    const a = aimAngle(e.x, e.y, p.x, p.y);
    for (const off of [-0.28, 0, 0.28]) spawnEnemyBullet(s, e.x, e.y + e.r, a + off, 0.9);
  }
}

export function stepEnemy(s: GameState, e: Enemy, dt: number): void {
  e.t += dt;
  e.flash = Math.max(0, e.flash - dt);
  if (e.kind === 'boss') return;
  const tuning = ENEMY[e.kind];
  const pos = pathPos(e, tuning.speed);
  e.x = pos.x;
  e.y = pos.y;
  const fire = tuning.fire;
  if (fire <= 0) return;
  e.cd -= dt;
  if (e.cd > 0) return;
  e.cd = (fire / DIFFICULTY[s.difficulty].fireRate) * s.rng.range(0.8, 1.2);
  if (e.y > 10 && e.y < WORLD.h - 120) fireAt(s, e);
}

export const enemyOffscreen = (e: Enemy): boolean =>
  e.t > 0.4 && (e.y > WORLD.h + 40 || e.y < -90 || e.x < -60 || e.x > WORLD.w + 60);
