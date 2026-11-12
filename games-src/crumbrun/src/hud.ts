// HUD model: pure formatting of what the status panel shows. The DOM view is in ui/hudView.ts.
import { BLINK_SEC, drenchBlinking } from './modes';
import type { World } from './world';

export interface HudState {
  readonly world: World;
  readonly level: number;
  readonly lives: number;
  readonly score: number;
  readonly hi: number;
  readonly muted: boolean;
  readonly demo: boolean;
  readonly time: number;
  readonly calm: boolean;
}

export interface HudModel {
  readonly demo: boolean;
  readonly score: string;
  readonly hi: string;
  readonly level: number;
  readonly lives: number;
  /** Drench time left as 0..1; 0 hides the meter. */
  readonly drench: number;
  readonly drenchWarn: boolean;
  readonly grooming: boolean;
}

export const MAX_LIFE_ICONS = 6;

export function hudModel(h: HudState): HudModel {
  const d = h.world.drench;
  const total = h.world.tuning.drenchSec;
  const drench = d.left > 0 ? Math.min(1, d.left / total) : 0;
  return {
    demo: h.demo,
    score: String(h.score).padStart(6, '0'),
    hi: String(h.hi).padStart(6, '0'),
    level: h.level,
    lives: Math.min(h.lives, MAX_LIFE_ICONS),
    drench,
    // reduced motion: steady warning, no strobe
    drenchWarn: drench > 0 && (h.calm ? d.left < BLINK_SEC : drenchBlinking(d)),
    grooming: h.world.clock.phase === 'rest' && !h.demo && d.left <= 0,
  };
}
