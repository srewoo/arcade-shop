// One stage of play, advanced by fixed 1/60 s steps. Deterministic for a given stage, seed and input stream.
import { CONFIG } from '../config';
import { circleHitsRect, stepBubble } from './physics';
import { fireLine, resolveLineHits, stepLines } from './lines';
import { stepPickups, tickPowerTimers, timeScale } from './power';
import { emitEvent, maxLines, type Sim } from './state';
import type { Input } from './types';

export { createSim, type Sim } from './state';

const { w: W, floorY } = CONFIG.world;

function movePlayer(sim: Sim, input: Input, dt: number): void {
  const p = sim.player;
  p.px = p.x;
  const dir = (input.right ? 1 : 0) - (input.left ? 1 : 0);
  p.moving = dir !== 0;
  if (dir !== 0) p.facing = dir > 0 ? 1 : -1;
  const half = CONFIG.player.w / 2;
  p.x = Math.min(W - half, Math.max(half, p.x + dir * CONFIG.player.speed * dt));
}

function playerBody(sim: Sim): { x: number; y: number; w: number; h: number } {
  const { hitW, hitH } = CONFIG.player;
  return { x: sim.player.x - hitW / 2, y: floorY - hitH, w: hitW, h: hitH };
}

function checkPlayerHit(sim: Sim): void {
  const p = sim.player;
  if (sim.demo || p.invuln > 0) return;
  const body = playerBody(sim);
  for (const b of sim.bubbles) {
    if (!circleHitsRect(b.x, b.y, CONFIG.bubble.radius[b.size] ?? 8, body)) continue;
    if (p.shield) {
      p.shield = false;
      p.invuln = CONFIG.player.afterShieldInvuln;
      emitEvent(sim, { type: 'shieldBreak', x: p.x, y: floorY - 20 });
    } else {
      sim.status = 'lost';
      sim.lostReason = 'hit';
      emitEvent(sim, { type: 'hit', x: p.x, y: floorY - 20 });
    }
    return;
  }
}

function stepTimers(sim: Sim, dt: number): void {
  const p = sim.player;
  p.invuln = Math.max(0, p.invuln - dt);
  p.fireCd = Math.max(0, p.fireCd - dt);
  p.shotAge += dt;
  sim.comboTimer = Math.max(0, sim.comboTimer - dt);
  if (sim.comboTimer === 0) sim.combo = 0;
  tickPowerTimers(sim, dt);
  sim.time = Math.max(0, sim.time - dt);
  const secs = Math.ceil(sim.time);
  if (secs <= 10 && secs > 0 && secs !== sim.warned) { sim.warned = secs; emitEvent(sim, { type: 'warn', secs }); }
}

function stepBubbles(sim: Sim, dt: number): void {
  const scaled = dt * timeScale(sim);
  for (const b of sim.bubbles) {
    const o = stepBubble(b, scaled, sim.solids);
    if (o.floorBounce) emitEvent(sim, { type: 'bounce', id: b.id, size: b.size, x: b.x, y: b.y });
  }
}

/** Advance the stage by one fixed step. A finished stage (cleared or lost) no longer changes. */
export function stepSim(sim: Sim, input: Input): void {
  if (sim.status !== 'play') return;
  if (!sim.started) {
    if (!(input.left || input.right || input.fire)) return;
    sim.started = true;
  }
  const dt = CONFIG.sim.dt;
  sim.tick++;
  stepTimers(sim, dt);
  if (sim.time <= 0) {
    sim.status = 'lost';
    sim.lostReason = 'timeout';
    emitEvent(sim, { type: 'timeout' });
    return;
  }
  movePlayer(sim, input, dt);
  if (input.fire && sim.player.fireCd <= 0 && sim.lines.length < maxLines(sim)) fireLine(sim);
  stepLines(sim, dt);
  stepBubbles(sim, dt);
  resolveLineHits(sim);
  stepPickups(sim, dt);
  checkPlayerHit(sim);
  if (sim.status === 'play' && sim.bubbles.length === 0) {
    const bonus = Math.round(sim.time) * CONFIG.score.timeBonusPerSec;
    sim.score += bonus;
    sim.status = 'cleared';
    emitEvent(sim, { type: 'clear', bonus });
  }
}
