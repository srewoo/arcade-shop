// Pause dialog with in-page confirmation for restart / quit (never window.confirm).
import { S } from '../strings';
import { el } from './dom';
import { closeOverlay, openOverlay } from './overlay';

type Kind = 'restart' | 'quit';

export class PauseDialog {
  private pending: Kind | null = null;
  constructor(private readonly actions: Record<Kind, () => void>) {}

  get isOpen(): boolean {
    return !el('pause-overlay').hidden;
  }

  /** Open the dialog; `confirm` pre-opens a confirmation. */
  open(confirm: Kind | null = null): void {
    if (this.isOpen) return;
    this.reset();
    el('pause-note').textContent = S.pausedNote;
    openOverlay(el('pause-overlay'), el('pause'), () => this.reset(), el('pause-resume'));
    if (confirm) this.ask(confirm);
  }

  ask(kind: Kind): void {
    this.pending = kind;
    el('pause-confirm-text').textContent = kind === 'restart' ? S.confirmRestart : S.confirmQuit;
    el('pause-confirm-yes').textContent = kind === 'restart' ? S.yesRestart : S.yesQuit;
    el('pause-confirm').hidden = false;
    el('pause-confirm-no').focus();
  }

  accept(): void {
    const kind = this.pending;
    closeOverlay(el('pause-overlay'));
    this.reset();
    if (kind) this.actions[kind]();
  }

  cancel(): void {
    this.reset();
    el('pause-resume').focus();
  }

  private reset(): void {
    this.pending = null;
    el('pause-confirm').hidden = true;
  }
}
