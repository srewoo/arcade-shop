// Test/debug hooks, exposed only with `?debug=1` or in the dev server.
import type { Level } from './puzzle/types';
import type { Session } from './session';
import type { Settings } from './settings';
import type { Progress } from './progress';

export interface DebugApi {
  session(): Session | null;
  settings(): Settings;
  progress(): Progress;
  levels(): readonly Level[];
  daily(): { key: string; level: Level };
  go(pack: 'bridge' | 'raft' | 'daily', index: number): void;
  refresh(): void;
}

export function exposeDebug(api: DebugApi): void {
  const enabled = import.meta.env.DEV || new URLSearchParams(location.search).get('debug') === '1';
  if (enabled) (window as unknown as { __lb: DebugApi }).__lb = api;
}
