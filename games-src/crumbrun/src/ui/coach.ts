// First-run coach mark: one short, non-blocking line shown once while the first level starts.
import type { Phase } from '../flow';

/** True when the first-run line should appear: never seen, level 1, entering READY. */
export function shouldCoach(seen: boolean, phase: Phase, level: number): boolean {
  return !seen && phase === 'ready' && level === 1;
}

export const COACH_MS = 9000;

export class Coach {
  private timer: number | undefined;
  private visible = false;

  constructor(private readonly el: HTMLElement, private readonly onDone: () => void) {}

  show(text: string): void {
    if (this.visible) return;
    this.visible = true;
    this.el.textContent = text;
    this.el.hidden = false;
    this.timer = window.setTimeout(() => this.hide(), COACH_MS);
  }

  /** Hide and report completion (the caller persists the "seen" flag). */
  hide(): void {
    if (!this.visible) return;
    this.visible = false;
    window.clearTimeout(this.timer);
    this.el.hidden = true;
    this.onDone();
  }
}
