// A run = world + mode. Pure, DOM-free orchestration of levels.
import { generateLevel, LEVELS, LEVEL_COUNT, type ParsedLevel } from './levels';
import { CONFIG } from './config';
import { createWorld, loadLevel, levelSpeed, type World } from './sim/world';

export type Mode = 'campaign' | 'endless';
export interface Run { mode: Mode; world: World; seed: number; levelStartLives: number }

export function levelFor(mode: Mode, seed: number, n: number): ParsedLevel {
  if (mode === 'campaign') return LEVELS[Math.min(n, LEVEL_COUNT) - 1] as ParsedLevel;
  return generateLevel(seed, n);
}

function speedFor(mode: Mode, n: number): number {
  return mode === 'campaign' ? levelSpeed(n) : levelSpeed(n, CONFIG.endless.speedPerLevel);
}

export function newRun(mode: Mode, level: number, seed: number): Run {
  const world = createWorld(seed);
  loadLevel(world, levelFor(mode, seed, level).cells, level, speedFor(mode, level));
  return { mode, world, seed, levelStartLives: world.lives };
}

/** Move to the next board. Returns false when the campaign has no more levels. */
export function advance(run: Run): boolean {
  const next = run.world.level + 1;
  if (run.mode === 'campaign' && next > LEVEL_COUNT) return false;
  loadLevel(run.world, levelFor(run.mode, run.seed, next).cells, next, speedFor(run.mode, next));
  run.levelStartLives = run.world.lives;
  return true;
}
