// Pause-aware stopwatch. Time is injected so it is deterministic under test.
export class Clock {
  private acc = 0;
  private since: number | null = null;

  get running(): boolean {
    return this.since !== null;
  }

  start(now: number): void {
    this.since ??= now;
  }

  stop(now: number): void {
    if (this.since === null) return;
    this.acc += now - this.since;
    this.since = null;
  }

  elapsed(now: number): number {
    return this.acc + (this.since === null ? 0 : now - this.since);
  }

  reset(): void {
    this.acc = 0;
    this.since = null;
  }
}
