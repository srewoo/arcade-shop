// Debug hooks: only installed with ?debug=1.
import type { App } from './app';
import { solve } from './solver';

export function installDebug(app: App): void {
  const api = {
    state: () => app.state,
    board: () => app.state?.board.cols,
    cellCentre: (x: number, y: number) => app.view.cellCentre({ x, y }),
    start: (mode: Parameters<App['start']>[0], seed?: number) => app.start(mode, seed),
    solve: () => (app.state ? solve(app.state.board) : null),
    pick: (x: number, y: number) => app.pick({ x, y }),
    stats: () => app.stats,
  };
  (window as unknown as { __tt: typeof api }).__tt = api;
}
