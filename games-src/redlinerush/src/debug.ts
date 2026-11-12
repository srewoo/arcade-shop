// Test/debug hooks, exposed only with `?debug=1` or in the dev server.
import type { Records } from './records';
import type { Settings } from './settings';
import type { Sim } from './simTypes';

export interface DebugApi {
  sim(): Sim;
  phase(): string;
  settings(): Settings;
  records(): Records;
  /** Overwrite numeric sim fields (fuel, lives, z, timeLeft, ...) to reach states quickly. */
  patch(fields: Partial<Pick<Sim, 'fuel' | 'lives' | 'z' | 'timeLeft' | 'speed' | 'invuln' | 'boost'>>): void;
}

export function exposeDebug(api: DebugApi): void {
  const enabled = import.meta.env.DEV || new URLSearchParams(location.search).get('debug') === '1';
  if (enabled) (window as unknown as { __redline: DebugApi }).__redline = api;
}
