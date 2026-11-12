// Test/debug hooks, exposed only with `?debug=1` or in the dev server.
import type { GameState } from './game';
import type { Scores, Stats } from './scores';
import type { Settings } from './settings';

export interface DebugApi {
  state(): GameState;
  settings(): Settings;
  scores(): Scores;
  stats(): Stats;
  isPaused(): boolean;
  setScores(next: Scores): void;
}

export function exposeDebug(api: DebugApi): void {
  const enabled = import.meta.env.DEV || new URLSearchParams(location.search).get('debug') === '1';
  if (enabled) (window as unknown as { __ttt: DebugApi }).__ttt = api;
}
