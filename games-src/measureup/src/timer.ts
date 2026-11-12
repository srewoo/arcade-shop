// Stopwatch with an injectable clock so tests are deterministic.
export interface Stopwatch {
  start(): void;
  stop(): void;
  reset(): void;
  readonly running: boolean;
  elapsedMs(): number;
}

export function createStopwatch(now: () => number = () => performance.now()): Stopwatch {
  let acc = 0;
  let since: number | null = null;
  return {
    start() {
      since ??= now();
    },
    stop() {
      if (since !== null) acc += now() - since;
      since = null;
    },
    reset() {
      acc = 0;
      since = null;
    },
    get running() {
      return since !== null;
    },
    elapsedMs: () => acc + (since === null ? 0 : now() - since),
  };
}

export function formatTime(ms: number): string {
  const total = Math.floor(ms / 1000);
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
}
