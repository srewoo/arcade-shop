// The player's plane: movement, timers, weapons and bombs.
import { CONFIG, WORLD } from './config';
import { spawnPlayerBullet } from './bullets';
import { damageEnemy } from './combat';
import type { GameState, Input } from './types';

const clamp = (v: number, lo: number, hi: number): number => Math.max(lo, Math.min(hi, v));

function move(s: GameState, input: Input, dt: number): void {
  const p = s.player;
  const c = CONFIG.player;
  if (input.target) {
    const dx = input.target.x - p.x;
    const dy = input.target.y - p.y;
    const dist = Math.hypot(dx, dy);
    const stepLen = Math.min(dist, c.dragSpeed * dt);
    if (dist > 0.001) {
      p.x += (dx / dist) * stepLen;
      p.y += (dy / dist) * stepLen;
    }
  } else {
    const len = Math.hypot(input.moveX, input.moveY) || 1;
    p.x += (input.moveX / Math.max(1, len)) * c.speed * dt;
    p.y += (input.moveY / Math.max(1, len)) * c.speed * dt;
  }
  p.x = clamp(p.x, c.margin, WORLD.w - c.margin);
  p.y = clamp(p.y, c.minY, WORLD.h - c.margin);
}

/** Bullet angles (radians from straight up) for a weapon level; 0 = the plain twin guns. */
export function volley(level: number): number[] {
  if (level <= 0) return [0, 0];
  const base = [0, -0.17, 0.17];
  if (level >= 2) base.push(-0.34, 0.34);
  if (level >= 3) base.push(-0.52, 0.52);
  return base;
}

function shoot(s: GameState): void {
  const p = s.player;
  const angles = volley(p.spread > 0 ? p.spreadLevel : 0);
  angles.forEach((a, i) => {
    const off = a === 0 && angles.length === 2 ? (i === 0 ? -6 : 6) : 0;
    spawnPlayerBullet(s, p.x + off, p.y - 14, a);
  });
  s.stats.fired += angles.length;
  s.events.push({ type: 'shot' });
}

export function detonateBomb(s: GameState): boolean {
  const p = s.player;
  if (p.bombs <= 0) return false;
  p.bombs -= 1;
  p.invuln = Math.max(p.invuln, 1);
  s.bombFlash = CONFIG.bomb.flashSecs;
  s.eBullets = [];
  s.events.push({ type: 'bomb', x: p.x, y: p.y });
  for (const e of [...s.enemies]) {
    if (e.kind === 'boss' && !e.armed) continue;
    damageEnemy(s, e, e.kind === 'boss' ? CONFIG.bomb.bossDamage : CONFIG.bomb.damage);
  }
  return true;
}

export function stepPlayer(s: GameState, input: Input, dt: number): void {
  const p = s.player;
  move(s, input, dt);
  p.invuln = Math.max(0, p.invuln - dt);
  p.shield = Math.max(0, p.shield - dt);
  if (p.spread > 0) {
    p.spread = Math.max(0, p.spread - dt);
    if (p.spread === 0) p.spreadLevel = 0;
  }
  p.fireCd -= dt;
  if (input.fire && p.fireCd <= 0) {
    shoot(s);
    p.fireCd = CONFIG.player.fireInterval;
  }
  if (input.bomb) detonateBomb(s);
}
