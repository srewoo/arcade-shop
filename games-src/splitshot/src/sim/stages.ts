// Original stage layouts. Platforms are thin ledges bubbles bounce off and lines cannot pass;
// blocks are breakable (a line hit chips them). The set loops with shorter timers and faster bubbles.
import { CONFIG } from '../config';
import type { Rect, StageDef } from './types';

const P = (x: number, y: number, w: number): Rect => ({ x, y, w, h: 9 });
const B = (x: number, y: number, w: number, h: number, hp: number): Rect & { hp: number } => ({ x, y, w, h, hp });

export const STAGES: readonly StageDef[] = [
  { name: 'Quiet Harbour', theme: 'harbour', time: 60, platforms: [], blocks: [],
    bubbles: [{ x: 170, y: 150, size: 3, dir: 1 }] },
  { name: 'Coral Shallows', theme: 'coral', time: 70, platforms: [], blocks: [],
    bubbles: [{ x: 130, y: 140, size: 3, dir: 1 }, { x: 510, y: 140, size: 3, dir: -1 }] },
  { name: 'Kelp Maze', theme: 'kelp', time: 80, blocks: [],
    platforms: [P(240, 232, 160)],
    bubbles: [{ x: 110, y: 130, size: 3, dir: 1 }, { x: 470, y: 120, size: 2, dir: -1 }, { x: 540, y: 150, size: 2, dir: -1 }] },
  { name: 'Lantern Cave', theme: 'lantern', time: 85, blocks: [],
    platforms: [P(70, 250, 120), P(450, 250, 120)],
    bubbles: [{ x: 200, y: 110, size: 3, dir: 1 }, { x: 440, y: 110, size: 3, dir: -1 }] },
  { name: 'Storm Cliffs', theme: 'storm', time: 90,
    platforms: [],
    blocks: [B(240, 218, 40, 30, 2), B(300, 218, 40, 30, 2), B(360, 218, 40, 30, 2)],
    bubbles: [{ x: 100, y: 120, size: 3, dir: 1 }, { x: 540, y: 140, size: 2, dir: -1 }, { x: 300, y: 100, size: 2, dir: 1 }, { x: 420, y: 130, size: 2, dir: -1 }] },
  { name: 'Aurora Floe', theme: 'aurora', time: 95,
    platforms: [P(40, 270, 90), P(510, 270, 90)],
    blocks: [B(290, 200, 60, 34, 3)],
    bubbles: [{ x: 160, y: 110, size: 3, dir: 1 }, { x: 300, y: 90, size: 2, dir: -1 }, { x: 500, y: 110, size: 2, dir: -1 }] },
  { name: 'Beacon Night', theme: 'harbour', time: 100,
    platforms: [P(150, 240, 100), P(390, 240, 100)],
    blocks: [B(300, 150, 40, 40, 2)],
    bubbles: [{ x: 100, y: 110, size: 3, dir: 1 }, { x: 320, y: 90, size: 3, dir: -1 }, { x: 540, y: 110, size: 3, dir: -1 }] },
  { name: 'Trench Run', theme: 'coral', time: 110,
    platforms: [P(60, 255, 110), P(470, 255, 110)],
    blocks: [B(270, 215, 50, 30, 2), B(320, 215, 50, 30, 2), B(295, 185, 50, 30, 3)],
    bubbles: [{ x: 120, y: 100, size: 3, dir: 1 }, { x: 520, y: 100, size: 3, dir: -1 }, { x: 320, y: 90, size: 2, dir: 1 }, { x: 220, y: 110, size: 2, dir: -1 }] },
];

export interface ResolvedStage { def: StageDef; index: number; loop: number; time: number; speedMul: number; label: string }

/** Stage `index` (0-based, loops past the last layout with a shorter timer and quicker bubbles). */
export function resolveStage(index: number): ResolvedStage {
  const i = Math.max(0, Math.floor(index));
  const def = STAGES[i % STAGES.length] as StageDef;
  const loop = Math.floor(i / STAGES.length);
  const r = CONFIG.run;
  return {
    def, index: i, loop,
    time: Math.max(r.minTime, def.time - loop * r.loopTimeCut),
    speedMul: Math.min(r.loopSpeedMax, 1 + loop * r.loopSpeedStep),
    label: loop > 0 ? `${def.name} ${'I'.repeat(Math.min(loop + 1, 5))}` : def.name,
  };
}
