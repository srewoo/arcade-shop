// Test/debug hooks, exposed only with `?debug=1` or in the dev server.
import type { App } from './app';
import { carBox } from './car';
import type { SimState } from './sim';

export interface DebugApi {
  sim(): SimState;
  levelId(): number;
  paused(): boolean;
  screen(): string;
  carBox(): { x: number; y: number; a: number };
  progress(): unknown;
  bay(): { x: number; y: number; hw: number; hh: number; a: number };
  /** Place the car (rear axle) for scripted checks. */
  teleport(x: number, y: number, a: number): void;
}

export function exposeDebug(app: App): void {
  const enabled = import.meta.env.DEV || new URLSearchParams(location.search).get('debug') === '1';
  if (!enabled) return;
  const api: DebugApi = {
    sim: () => app.session.curr,
    levelId: () => app.level.id,
    paused: () => app.paused,
    screen: () => app.screen,
    carBox: () => carBox(app.session.curr.car),
    progress: () => app.progress,
    bay: () => app.level.bay,
    teleport: (x, y, a) => {
      const s = app.session;
      s.curr = s.prev = { ...s.curr, car: { ...s.curr.car, x, y, a, v: 0, phi: a } };
    },
  };
  (window as unknown as { __kerbside: DebugApi }).__kerbside = api;
}
