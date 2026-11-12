// One fixed simulation step. Deterministic: only the state's own RNG and the input are used.
import { STEP, WORLD } from './config';
import { stepBoss } from './boss';
import { resolveCollisions } from './combat';
import { moveBullets } from './bullets';
import { stepWave } from './director';
import { enemyOffscreen, stepEnemy } from './enemies';
import { stepPlayer } from './player';
import { tickChain } from './scoring';
import type { Body, GameState, Input } from './types';

const snap = (b: Body): void => {
  b.px = b.x;
  b.py = b.y;
};

function snapshot(s: GameState): void {
  snap(s.player);
  s.enemies.forEach(snap);
  s.pBullets.forEach(snap);
  s.eBullets.forEach(snap);
  s.pickups.forEach(snap);
}

export function stepGame(s: GameState, input: Input, dt: number = STEP): void {
  if (s.phase !== 'playing') return;
  snapshot(s);
  s.time += dt;
  s.bombFlash = Math.max(0, s.bombFlash - dt);
  stepPlayer(s, input, dt);
  stepWave(s, dt);
  for (const e of s.enemies) {
    if (e.kind === 'boss') {
      e.t += dt;
      e.flash = Math.max(0, e.flash - dt);
      stepBoss(s, e, dt);
    } else stepEnemy(s, e, dt);
  }
  s.enemies = s.enemies.filter((e) => !enemyOffscreen(e));
  s.pBullets = moveBullets(s.pBullets, dt);
  s.eBullets = moveBullets(s.eBullets, dt);
  for (const k of s.pickups) {
    k.t += dt;
    k.y += 70 * dt;
  }
  s.pickups = s.pickups.filter((k) => k.y < WORLD.h + 30);
  resolveCollisions(s);
  tickChain(s, dt);
}
