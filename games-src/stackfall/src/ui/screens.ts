// Overlay manager: shows one card at a time, moves focus, makes the page behind inert,
// and guards the result card against stray key presses.
import { feel } from '../config/feel';

export type CardKind = 'title' | 'pause' | 'confirm' | 'result';

/** Decide when the result card unlocks: after the grace period AND once input has been quiet. */
export function unlockDelay(sinceShown: number, sinceInput: number): number {
  if (sinceShown >= feel.resultMaxHoldMs) return 0;
  const grace = feel.resultGraceMs - sinceShown;
  const quiet = feel.resultQuietMs - sinceInput;
  return Math.max(0, grace, Math.min(quiet, feel.resultMaxHoldMs - sinceShown));
}

export class Screens {
  kind: CardKind | null = null;
  private graceTimer: number | null = null;
  private lastInput = -1e9;

  constructor(private readonly overlay: HTMLElement, private readonly behind: readonly HTMLElement[], private readonly keyHeld: () => boolean) {
    window.addEventListener('keydown', () => (this.lastInput = performance.now()), true);
    window.addEventListener('pointerdown', (e) => { if (!(e.target as Element | null)?.closest('#overlay')) this.lastInput = performance.now(); }, true);
  }

  /** Show `card` (or clear when null). `focusSel` is the default control. */
  show(kind: CardKind | null, card: HTMLElement | null, focusSel?: string): void {
    this.clearGrace();
    this.kind = kind;
    document.documentElement.dataset.screen = kind ?? 'play';
    this.overlay.hidden = card === null;
    this.overlay.replaceChildren(...(card ? [card] : []));
    if (card) this.overlay.setAttribute('aria-labelledby', 'card-title');
    else this.overlay.removeAttribute('aria-labelledby');
    for (const el of this.behind) el.toggleAttribute('inert', card !== null);
    if (card && focusSel) this.overlay.querySelector<HTMLElement>(focusSel)?.focus({ preventScroll: true });
  }

  /** Result card: buttons enable after the grace period; focus moves to Play again unless a key is held. */
  showResult(card: HTMLElement): void {
    this.show('result', card);
    card.focus({ preventScroll: true });
    const shownAt = performance.now();
    const arm = (delay: number): void => {
      this.graceTimer = window.setTimeout(() => {
        const now = performance.now();
        const wait = unlockDelay(now - shownAt, now - this.lastInput);
        if (wait > 0) return arm(wait);
        this.graceTimer = null;
        card.removeAttribute('data-grace');
        card.querySelectorAll<HTMLButtonElement>('button').forEach((b) => (b.disabled = false));
        if (!this.keyHeld()) card.querySelector<HTMLElement>('#btn-again')?.focus({ preventScroll: true });
      }, delay);
    };
    arm(feel.resultGraceMs);
  }

  private clearGrace(): void {
    if (this.graceTimer !== null) window.clearTimeout(this.graceTimer);
    this.graceTimer = null;
  }
}
