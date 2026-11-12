// Damage rules for bricks, shared by balls and laser bolts.
import { CONFIG } from '../config';
import type { PowerKind } from '../levels/format';
import { brickPoints } from './scoring';
import { addScore, brickRect, emit, spawnCapsule, type World } from './world';

const POWERS: readonly PowerKind[] = ['wide', 'multi', 'slow', 'laser'];

/** Apply one point of damage. Returns true when the brick was destroyed. */
export function damageBrick(w: World, idx: number, byBall: boolean): boolean {
  const brick = w.bricks[idx];
  if (!brick) return false;
  const rect = brickRect(idx, w.ox);
  const x = (rect.left + rect.right) / 2;
  const y = (rect.top + rect.bottom) / 2;
  if (brick.steel) {
    emit(w, { type: 'steel', x, y });
    return false;
  }
  if (byBall) w.combo++;
  brick.hp--;
  const destroyed = brick.hp <= 0;
  const points = brickPoints(destroyed, brick.maxHp, byBall ? w.combo : 0);
  addScore(w, points);
  emit(w, { type: destroyed ? 'break' : 'hit', x, y, points, combo: w.combo });
  if (destroyed) {
    w.bricks[idx] = null;
    w.remaining--;
    const kind = brick.power ?? (w.rng.next() < CONFIG.power.dropChance ? w.rng.pick(POWERS) : null);
    if (kind) spawnCapsule(w, x, y, kind);
  }
  return destroyed;
}
