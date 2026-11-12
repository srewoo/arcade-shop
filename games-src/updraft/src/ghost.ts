// Input recording and replay. The sim is deterministic, so a run is fully described by
// the seed plus the ticks at which the rise input toggled.
export class Recorder {
  readonly toggles: number[] = [];
  private last = false;
  record(tick: number, hold: boolean): void {
    if (hold !== this.last) {
      this.toggles.push(tick);
      this.last = hold;
    }
  }
}

export class Replayer {
  private idx = 0;
  private hold = false;
  constructor(private readonly toggles: readonly number[]) {}
  /** Input for `tick`; must be called with non-decreasing ticks. */
  holdAt(tick: number): boolean {
    while (this.idx < this.toggles.length && (this.toggles[this.idx] as number) <= tick) {
      this.hold = !this.hold;
      this.idx++;
    }
    return this.hold;
  }
}
