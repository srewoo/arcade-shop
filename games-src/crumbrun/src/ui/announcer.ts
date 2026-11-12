// Screen-reader status line: an aria-live="polite" region with a rate limit, so a burst of
// events (phase change, splash, pickup) cannot flood a screen reader.
export interface AnnouncerDeps {
  readonly set: (s: string) => void;
  readonly now: () => number;
  readonly later: (fn: () => void, ms: number) => void;
}

export class Announcer {
  private last = -Infinity;
  private pending: string | null = null;
  private flip = false;

  constructor(private readonly d: AnnouncerDeps, private readonly gapMs = 900) {}

  private emit(msg: string): void {
    this.last = this.d.now();
    this.flip = !this.flip;
    this.d.set(this.flip ? msg : `${msg} `); // alternate so identical messages re-announce
  }

  /** `urgent` bypasses the limit (game over, lost life, level clear). */
  say(msg: string, urgent = false): void {
    const wait = this.last + this.gapMs - this.d.now();
    if (urgent || wait <= 0) {
      this.pending = null;
      this.emit(msg);
      return;
    }
    const first = this.pending === null;
    this.pending = msg;
    if (first) {
      this.d.later(() => {
        const m = this.pending;
        this.pending = null;
        if (m !== null) this.emit(m);
      }, wait);
    }
  }
}

export function domAnnouncer(el: HTMLElement): Announcer {
  return new Announcer({
    set: (s) => {
      el.textContent = s;
    },
    now: () => performance.now(),
    later: (fn, ms) => {
      window.setTimeout(fn, ms);
    },
  });
}
