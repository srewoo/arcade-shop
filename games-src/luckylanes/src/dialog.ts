// Modal helper: focus trap, Esc handling and focus return to the opener.

const FOCUSABLE = 'button, select, input, textarea, [href], [tabindex]:not([tabindex="-1"])';

export interface DialogOptions {
  /** Called on Esc. Defaults to closing the dialog; pass a no-op for dialogs that cannot be dismissed. */
  readonly onEscape?: () => void;
}

export class Dialog {
  private opener: HTMLElement | null = null;

  constructor(readonly root: HTMLElement, private readonly opts: DialogOptions = {}) {
    root.addEventListener('keydown', (e) => this.onKey(e));
  }

  get isOpen(): boolean {
    return !this.root.hidden;
  }

  /** Show the dialog and focus `first` (or the first control). The previously focused element is remembered. */
  open(first?: HTMLElement | null): void {
    const active = document.activeElement;
    if (active instanceof HTMLElement && !this.root.contains(active)) this.opener = active;
    this.root.hidden = false;
    (first ?? this.focusables()[0])?.focus();
  }

  close(restoreFocus = true): void {
    this.root.hidden = true;
    const opener = this.opener;
    this.opener = null;
    if (restoreFocus && opener && opener.isConnected) opener.focus();
  }

  private focusables(): HTMLElement[] {
    return [...this.root.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((n) => !n.hidden && !(n as HTMLButtonElement).disabled && n.offsetParent !== null);
  }

  private onKey(e: KeyboardEvent): void {
    if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      (this.opts.onEscape ?? ((): void => this.close()))();
      return;
    }
    if (e.key !== 'Tab') return;
    const items = this.focusables();
    const first = items[0];
    const last = items[items.length - 1];
    if (!first || !last) return;
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }
}
