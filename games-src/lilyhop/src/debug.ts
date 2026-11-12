// Test hooks, installed only when the page URL has ?debug=1.
import type { Play } from './play';
import { topOverlay } from './ui/overlay';
import type { Progress } from './progress';

export interface DebugApi {
  readonly play: Play;
  readonly progress: () => Progress;
  readonly unlockAll: () => void;
  readonly start: (id: string) => void;
}

export function installDebug(api: DebugApi): void {
  if (!new URLSearchParams(location.search).has('debug')) return;
  (window as unknown as { __lilyhop: unknown }).__lilyhop = {
    state: () => ({
      board: api.play.session?.state ?? null,
      moves: api.play.session?.moves ?? 0,
      optimal: api.play.session?.optimal ?? 0,
      status: api.play.status,
      elapsed: api.play.elapsed(),
      overlay: topOverlay()?.id ?? null,
    }),
    play: api.play,
    progress: api.progress,
    unlockAll: api.unlockAll,
    start: api.start,
    /** Play the shortest solution (or `max` moves of it); returns [from,to] pairs. */
    solve(max = 200): [number, number][] {
      const out: [number, number][] = [];
      for (let guard = 0; guard < max && api.play.status !== 'won'; guard++) {
        const m = api.play.session?.solver.bestMove(api.play.session.state);
        if (!m) break;
        out.push([m.from, m.to]);
        api.play.activate(m.from);
        if (api.play.selected !== null) api.play.activate(m.to);
      }
      return out;
    },
    activate: (i: number) => api.play.activate(i),
  };
}
