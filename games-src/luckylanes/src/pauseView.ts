// Pause overlay: Resume (default focus), Restart, Settings, Quit. Restart and Quit ask first, in the page.
import { Dialog } from './dialog';
import { byId } from './dom';
import { S } from './strings';

export interface PauseHandlers {
  onResume(): void;
  onRestart(): void;
  onSettings(): void;
  onQuit(): void;
}

type Pending = 'restart' | 'quit' | null;

export class PauseOverlay {
  private readonly dialog = new Dialog(byId('pause'), { onEscape: () => this.escape() });
  private pending: Pending = null;

  constructor(private readonly h: PauseHandlers) {
    byId('pause-title').textContent = S.paused;
    byId('pause-resume').textContent = S.resume;
    byId('pause-restart').textContent = S.restart;
    byId('pause-settings').textContent = S.settings;
    byId('pause-quit').textContent = S.quit;
    byId('pause-no').textContent = S.no;
    byId('pause-yes').textContent = S.yes;
    byId('pause-resume').addEventListener('click', () => h.onResume());
    byId('pause-restart').addEventListener('click', () => this.ask('restart'));
    byId('pause-quit').addEventListener('click', () => this.ask('quit'));
    byId('pause-settings').addEventListener('click', () => h.onSettings());
    byId('pause-no').addEventListener('click', () => this.show(null));
    byId('pause-yes').addEventListener('click', () => this.confirm());
  }

  get isOpen(): boolean {
    return this.dialog.isOpen;
  }

  open(): void {
    this.show(null);
    this.dialog.open(byId('pause-resume'));
  }

  close(restoreFocus = false): void {
    this.dialog.close(restoreFocus);
    this.pending = null;
  }

  /** Focus the default control again, e.g. after Settings closed on top of the overlay. */
  refocus(): void {
    byId(this.pending ? 'pause-no' : 'pause-resume').focus();
  }

  private ask(p: Exclude<Pending, null>): void {
    this.show(p);
    byId('pause-no').focus();
  }

  private show(p: Pending): void {
    this.pending = p;
    byId('pause-main').hidden = p !== null;
    byId('pause-confirm').hidden = p === null;
    byId('pause-confirm-text').textContent = p === 'restart' ? S.confirmRestart : p === 'quit' ? S.confirmQuit : '';
    if (p === null && this.isOpen) byId('pause-resume').focus();
  }

  private escape(): void {
    if (this.pending) this.show(null);
    else this.h.onResume();
  }

  private confirm(): void {
    const p = this.pending;
    this.pending = null;
    if (p === 'restart') this.h.onRestart();
    else if (p === 'quit') this.h.onQuit();
  }
}
