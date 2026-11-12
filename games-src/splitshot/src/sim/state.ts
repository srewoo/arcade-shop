import { CONFIG } from '../config';
import { makeBubble } from './physics';
import { makeRng } from './rng';
import { resolveStage, type ResolvedStage } from './stages';
import type { Block, Bubble, Line, Pickup, Player, PowerKind, Rect, SimEvent } from './types';

export type Status = 'play' | 'cleared' | 'lost';

export interface Sim {
  stage: ResolvedStage;
  tick: number;
  /** Seconds left on the stage timer. */
  time: number;
  /** The timer and bubbles stay frozen until the first player action. */
  started: boolean;
  status: Status;
  lostReason: 'hit' | 'timeout' | null;
  score: number;
  startScore: number;
  combo: number;
  comboTimer: number;
  player: Player;
  bubbles: Bubble[];
  lines: Line[];
  pickups: Pickup[];
  blocks: Block[];
  platforms: Rect[];
  solids: Rect[];
  power: Record<Exclude<PowerKind, 'shield'>, number>;
  rng: () => number;
  nextId: number;
  events: SimEvent[];
  /** When true the player cannot be hurt (title-screen demo). */
  demo: boolean;
  warned: number;
}

export function rebuildSolids(sim: Sim): void {
  sim.solids = [...sim.platforms, ...sim.blocks.filter((b) => b.alive)];
}

export function createSim(stageIndex: number, score = 0, seed = 1, demo = false): Sim {
  const stage = resolveStage(stageIndex);
  const { def } = stage;
  const sim: Sim = {
    stage, tick: 0, time: stage.time, started: demo, status: 'play', lostReason: null,
    score, startScore: score, combo: 0, comboTimer: 0,
    player: { x: CONFIG.world.w / 2, px: CONFIG.world.w / 2, facing: 1, moving: false, invuln: CONFIG.player.startInvuln, fireCd: 0, shield: false, shotAge: 9 },
    bubbles: [], lines: [], pickups: [],
    blocks: def.blocks.map((b) => ({ x: b.x, y: b.y, w: b.w, h: b.h, hp: b.hp, maxHp: b.hp, alive: true })),
    platforms: def.platforms.map((p) => ({ ...p })), solids: [],
    power: { double: 0, sticky: 0, slow: 0 },
    rng: makeRng(seed * 7919 + stageIndex * 104729 + 17), nextId: 1, events: [], demo, warned: 0,
  };
  for (const s of def.bubbles) sim.bubbles.push(makeBubble(sim.nextId++, s.x, s.y, s.size, s.dir, stage.speedMul));
  rebuildSolids(sim);
  return sim;
}

export const emitEvent = (sim: Sim, e: SimEvent): void => void sim.events.push(e);
export const maxLines = (sim: Sim): number => (sim.power.double > 0 ? CONFIG.line.doubleMax : CONFIG.line.baseMax);
