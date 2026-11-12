// Timing and page lifecycle: the logic tick, the requestAnimationFrame HUD paint, autosave, and
// auto-pause when the tab is hidden or the window loses focus.
import { TIMING } from '../config/timing';
import type { Session, PauseReason } from '../session';

export interface ClockHost {
  readonly session: () => Session | null;
  readonly gameVisible: () => boolean;
  readonly paint: (s: Session, extraMs: number) => void;
  readonly save: () => void;
  readonly autoPause: (reason: PauseReason) => void;
  readonly onReturn: () => void;
}

export class GameClock {
  private last = performance.now();
  private sinceSave = 0;

  constructor(private readonly host: ClockHost) {}

  /** Call when a new session is attached so the first tick does not include idle time. */
  reset(): void {
    this.last = performance.now();
  }

  start(): void {
    window.setInterval(() => this.logic(), TIMING.logicTickMs);
    const frame = (): void => {
      requestAnimationFrame(frame);
      const s = this.host.session();
      if (s && this.host.gameVisible()) this.host.paint(s, Math.min(performance.now() - this.last, TIMING.logicTickMs * 1.5));
    };
    requestAnimationFrame(frame);
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.host.autoPause('hidden');
        this.host.save();
      } else {
        this.reset();
        this.host.onReturn();
      }
    });
    window.addEventListener('blur', () => this.host.autoPause('blur'));
    window.addEventListener('focus', () => {
      this.reset();
      this.host.onReturn();
    });
    window.addEventListener('pagehide', () => this.host.save());
  }

  private logic(): void {
    const now = performance.now();
    const dt = Math.min(TIMING.maxTickMs, now - this.last);
    this.last = now;
    const s = this.host.session();
    if (!s || !this.host.gameVisible()) return;
    s.tick(dt);
    if (!s.playing) return;
    this.sinceSave += dt;
    if (this.sinceSave >= TIMING.autosaveMs) {
      this.sinceSave = 0;
      this.host.save();
    }
  }
}
