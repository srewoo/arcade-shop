// Damage, kills, pickups and every collision test.
import { CONFIG, DIFFICULTY, ENEMY, WORLD, type PickupKind } from './config';
import { addBonus, registerKill, resetMultiplier } from './scoring';
import type { Bullet, Enemy, GameState } from './types';

const hits = (ax: number, ay: number, ar: number, bx: number, by: number, br: number): boolean => {
  const dx = ax - bx;
  const dy = ay - by;
  const rr = ar + br;
  return dx * dx + dy * dy < rr * rr;
};

function dropKind(s: GameState): PickupKind {
  const bombsFull = s.player.bombs >= CONFIG.player.maxBombs;
  const table: [PickupKind, number][] = [['spread', 40], ['shield', 30], ['bomb', bombsFull ? 0 : 30]];
  const total = table.reduce((n, [, w]) => n + w, 0);
  let roll = s.rng.next() * total;
  for (const [kind, w] of table) {
    roll -= w;
    if (roll < 0) return kind;
  }
  return 'spread';
}

function dropPickup(s: GameState, x: number, y: number): void {
  const kind = dropKind(s);
  s.pickups.push({ x, y, px: x, py: y, kind, t: 0 });
}

export function damageEnemy(s: GameState, e: Enemy, dmg: number): void {
  if (e.hp <= 0) return;
  e.hp -= dmg;
  e.flash = 0.08;
  if (e.hp > 0) return;
  const boss = e.kind === 'boss';
  const points = registerKill(s, boss ? CONFIG.boss.score : ENEMY[e.kind as keyof typeof ENEMY].score);
  s.events.push({ type: 'kill', x: e.x, y: e.y, big: boss || e.kind === 'tank', points });
  if (boss) {
    s.bossesDown += 1;
    addBonus(s, CONFIG.score.bossBonus);
    s.eBullets = [];
    for (const dx of [-30, 0, 30]) dropPickup(s, e.x + dx, e.y);
  } else if (e.kind === 'tank' || s.rng.next() < DIFFICULTY[s.difficulty].dropChance) {
    dropPickup(s, e.x, e.y);
  }
}

export function hurtPlayer(s: GameState): void {
  const p = s.player;
  if (p.invuln > 0 || s.phase !== 'playing') return;
  if (p.shield > 0) {
    p.shield = 0;
    p.invuln = 1;
    s.events.push({ type: 'shieldBreak', x: p.x, y: p.y });
    return;
  }
  p.lives -= 1;
  p.invuln = CONFIG.player.invuln;
  p.spreadLevel = Math.max(0, p.spreadLevel - 1);
  if (p.spreadLevel === 0) p.spread = 0;
  resetMultiplier(s);
  s.eBullets = s.eBullets.filter((b) => !hits(b.x, b.y, 0, p.x, p.y, 90));
  s.events.push({ type: 'hurt', x: p.x, y: p.y });
  if (p.lives <= 0) {
    s.phase = 'down';
    s.events.push({ type: 'down' });
  }
}

function collectPickups(s: GameState): void {
  const p = s.player;
  s.pickups = s.pickups.filter((k) => {
    if (!hits(k.x, k.y, CONFIG.pickup.collectR, p.x, p.y, CONFIG.player.r)) return true;
    if (k.kind === 'spread') {
      p.spread = CONFIG.player.spreadSecs;
      p.spreadLevel = Math.min(CONFIG.player.spreadMaxLevel, p.spreadLevel + 1);
    } else if (k.kind === 'shield') p.shield = CONFIG.player.shieldSecs;
    else p.bombs = Math.min(CONFIG.player.maxBombs, p.bombs + 1);
    s.events.push({ type: 'pickup', kind: k.kind, x: k.x, y: k.y });
    return false;
  });
}

function shotsVsEnemies(s: GameState): void {
  for (const b of s.pBullets) {
    for (const e of s.enemies) {
      if (e.hp <= 0 || (e.kind === 'boss' && !e.armed)) continue;
      if (!hits(b.x, b.y, b.r, e.x, e.y, e.r)) continue;
      b.r = 0;
      s.stats.hit += 1;
      s.events.push({ type: 'hit', x: b.x, y: b.y });
      damageEnemy(s, e, 1);
      break;
    }
  }
}

function dangersVsPlayer(s: GameState): void {
  const p = s.player;
  if (p.invuln > 0) return;
  const bullet: Bullet | undefined = s.eBullets.find((b) => hits(b.x, b.y, b.r, p.x, p.y, CONFIG.player.r));
  if (bullet) {
    bullet.r = 0;
    hurtPlayer(s);
    return;
  }
  const body = s.enemies.find((e) => e.hp > 0 && hits(e.x, e.y, e.r * 0.8, p.x, p.y, CONFIG.player.r));
  if (!body) return;
  hurtPlayer(s);
  if (body.kind !== 'boss') damageEnemy(s, body, 6);
}

export function resolveCollisions(s: GameState): void {
  shotsVsEnemies(s);
  dangersVsPlayer(s);
  collectPickups(s);
  s.enemies = s.enemies.filter((e) => e.hp > 0);
  s.pBullets = s.pBullets.filter((b) => b.r > 0);
  s.eBullets = s.eBullets.filter((b) => b.r > 0);
}

export const inWorld = (x: number, y: number, m = 0): boolean => x >= -m && x <= WORLD.w + m && y >= -m && y <= WORLD.h + m;
