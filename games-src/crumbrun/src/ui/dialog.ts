// Modal host: one dialog at a time inside #modal-root. Traps Tab, restores focus to the opener
// on close, and (optionally) dismisses on any key. Esc is routed by the controller via the
// shared pause key so P and Esc behave identically everywhere.
import { focusables, trapTarget } from './dom';

export interface ShowOptions {
  readonly label: string;
  readonly initialFocus?: () => HTMLElement | null;
  /** Clicking the dimmed area outside the panel. */
  readonly onBackdrop?: () => void;
  /** Any key press (not Tab/modifiers) or tap anywhere dismisses (how-to card). */
  readonly onAnyInput?: () => void;
}

const ANY_INPUT_GRACE_MS = 400;

export class ModalHost {
  private opener: HTMLElement | null = null;
  private opts: ShowOptions | null = null;
  private shownAt = 0;

  constructor(private readonly root: HTMLElement, private readonly onPress: () => void = () => undefined) {
    root.addEventListener('keydown', (e) => this.onKey(e), true);
    root.addEventListener('click', (e) => this.onClick(e));
  }

  get isOpen(): boolean {
    return !this.root.hidden;
  }

  show(content: HTMLElement, opts: ShowOptions): void {
    if (!this.isOpen) {
      const a = document.activeElement;
      this.opener = a instanceof HTMLElement && a !== document.body ? a : null;
    }
    this.opts = opts;
    this.shownAt = performance.now();
    this.root.replaceChildren(content);
    this.root.hidden = false;
    this.root.setAttribute('role', 'dialog');
    this.root.setAttribute('aria-modal', 'true');
    this.root.setAttribute('aria-label', opts.label);
    const target = opts.initialFocus?.() ?? focusables(this.root)[0] ?? null;
    if (target) target.focus();
    else {
      this.root.tabIndex = -1;
      this.root.focus();
    }
  }

  hide(): void {
    if (!this.isOpen) return;
    this.root.hidden = true;
    this.root.replaceChildren();
    this.opts = null;
    const back = this.opener;
    this.opener = null;
    if (back && back.isConnected) back.focus();
  }

  private onKey(e: KeyboardEvent): void {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.key === 'Tab') {
      const next = trapTarget(focusables(this.root), document.activeElement, e.shiftKey);
      if (next) {
        e.preventDefault();
        next.focus();
      }
      return;
    }
    if (e.key === 'Escape' || e.key === 'Shift' || e.key === 'Control' || e.key === 'Alt' || e.key === 'Meta') return;
    if (this.opts?.onAnyInput && !e.repeat && this.settled()) {
      e.preventDefault();
      e.stopPropagation();
      this.opts.onAnyInput();
    }
  }

  /** A dialog opened by a tap would otherwise be dismissed by that same tap's synthesized click. */
  private settled(): boolean {
    return performance.now() - this.shownAt > ANY_INPUT_GRACE_MS;
  }

  private onClick(e: MouseEvent): void {
    if ((e.target as HTMLElement).closest('button')) this.onPress();
    if (this.opts?.onAnyInput) {
      if (this.settled()) this.opts.onAnyInput();
      return;
    }
    if (e.target === this.root) this.opts?.onBackdrop?.();
  }
}
