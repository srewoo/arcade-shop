// Generic undo/redo stack of immutable snapshots.
export interface History<T> {
  readonly past: readonly T[];
  readonly future: readonly T[];
}

export const emptyHistory = <T>(): History<T> => ({ past: [], future: [] });

/** Record `current` before a change. Clears redo. Keeps at most `limit` snapshots. */
export function record<T>(h: History<T>, current: T, limit = 400): History<T> {
  const past = [...h.past, current];
  return { past: past.length > limit ? past.slice(past.length - limit) : past, future: [] };
}

export function undo<T>(h: History<T>, current: T): { history: History<T>; state: T } | null {
  const prev = h.past[h.past.length - 1];
  if (prev === undefined) return null;
  return { history: { past: h.past.slice(0, -1), future: [...h.future, current] }, state: prev };
}

export function redo<T>(h: History<T>, current: T): { history: History<T>; state: T } | null {
  const next = h.future[h.future.length - 1];
  if (next === undefined) return null;
  return { history: { past: [...h.past, current], future: h.future.slice(0, -1) }, state: next };
}
