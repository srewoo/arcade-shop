// Visual effects (particles, popups) for each simulation event.
import { logicalSize, tileCenterX, tileCenterY } from './layout';
import type { Particles } from './particles';
import type { EventType, GameEvent, World } from './world';

type FxHandler = (p: Particles, w: World, e: GameEvent, px: number, py: number) => void;

/** Table keyed by every EventType; events with no visual effect map to null on purpose. */
export const FX_FOR_EVENT: Readonly<Record<EventType, FxHandler | null>> = {
  crumb: null, sugar: null, cheeseSpawn: null, phase: null, release: null, drenchEnd: null, drenchWarn: null,
  pounce: null,
  splash: (p, _w, e) => {
    if (!e.at) return;
    p.splash(tileCenterX(e.at.col), tileCenterY(e.at.row));
    p.popup(tileCenterX(e.at.col), tileCenterY(e.at.row) - 8, String(e.points ?? ''));
  },
  pistol: (p, _w, _e, x, y) => p.splash(x, y, '#bfe6ff'),
  death: (p, _w, _e, x, y) => p.stars(x, y),
  cheese: (p, _w, _e, x, y) => p.popup(x, y - 8, '500', '#ffe066'),
  clear: (p, w) => p.sparkle(logicalSize(w.maze).w, logicalSize(w.maze).h),
  extralife: (p, _w, _e, x, y) => p.popup(x, y - 16, '1UP', '#9dffb0'),
};

export function fxForEvent(p: Particles, w: World, e: GameEvent): void {
  FX_FOR_EVENT[e.type]?.(p, w, e, tileCenterX(w.pip.x), tileCenterY(w.pip.y));
}
