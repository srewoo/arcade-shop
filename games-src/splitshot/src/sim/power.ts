// Power-up drops, falling pickups, collection and timers.
import { CONFIG } from '../config';
import { circleHitsRect } from './physics';
import { emitEvent, type Sim } from './state';
import { POWER_KINDS, type PowerKind } from './types';

export function pickKind(roll: number): PowerKind {
  const w = CONFIG.power.weights;
  const total = w.reduce((a, b) => a + b, 0);
  let t = roll * total;
  for (let i = 0; i < POWER_KINDS.length; i++) {
    t -= w[i] ?? 0;
    if (t < 0) return POWER_KINDS[i] as PowerKind;
  }
  return 'shield';
}

export function dropPickup(sim: Sim, x: number, y: number): void {
  if (sim.demo || sim.pickups.length >= CONFIG.power.maxOnField) return;
  if (sim.rng() >= CONFIG.power.dropChance) return;
  const kind = pickKind(sim.rng());
  if (kind === 'shield' && sim.player.shield) return;
  sim.pickups.push({ kind, x, y, px: x, py: y, vy: -60, life: CONFIG.power.lifeSec });
  emitEvent(sim, { type: 'drop', x, y, kind });
}

export function applyPower(sim: Sim, kind: PowerKind): void {
  if (kind === 'shield') sim.player.shield = true;
  else sim.power[kind] = CONFIG.power.duration[kind];
}

export function stepPickups(sim: Sim, dt: number): void {
  const p = sim.player;
  const body = { x: p.x - CONFIG.player.hitW / 2, y: CONFIG.world.floorY - CONFIG.player.hitH, w: CONFIG.player.hitW, h: CONFIG.player.hitH };
  const keep = [];
  const floor = CONFIG.world.floorY - CONFIG.power.size;
  for (const u of sim.pickups) {
    u.px = u.x; u.py = u.y;
    u.vy += CONFIG.physics.gravity * 0.5 * dt;
    u.y += u.vy * dt;
    if (u.y >= floor) { u.y = floor; u.vy = 0; }
    u.life -= dt;
    if (circleHitsRect(u.x, u.y, CONFIG.power.size, body)) {
      applyPower(sim, u.kind);
      sim.score += CONFIG.score.pickup;
      emitEvent(sim, { type: 'collect', x: u.x, y: u.y, kind: u.kind });
    } else if (u.life > 0) keep.push(u);
  }
  sim.pickups = keep;
}

export function tickPowerTimers(sim: Sim, dt: number): void {
  for (const k of ['double', 'sticky', 'slow'] as const) sim.power[k] = Math.max(0, sim.power[k] - dt);
}

export const timeScale = (sim: Sim): number => (sim.power.slow > 0 ? CONFIG.power.slowScale : 1);
