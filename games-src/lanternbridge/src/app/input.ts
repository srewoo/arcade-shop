// Keyboard, pause and auto-pause handling.
import { emit } from '../audio';
import { keyAction, nthOnBank, type KeyAction } from '../keys';
import { anyModalOpen } from '../ui/dialogs';
import type { App } from './app';
import { go, showMenu } from './nav';
import { bankOf, cross, giveHint, pick, restart, undo } from './play';

export interface InputHooks {
  toggleMute(): void;
}

export function pause(app: App): void {
  if (app.shell.view() !== 'play' || anyModalOpen()) return;
  emit('pause');
  app.dlg.pause.open();
}

function playKey(app: App, a: KeyAction, e: KeyboardEvent): void {
  e.preventDefault();
  const s = app.session;
  if (a.type === 'cross') cross(app);
  else if (a.type === 'undo') undo(app);
  else if (a.type === 'restart') void restart(app);
  else if (a.type === 'hint') giveHint(app);
  else if (a.type === 'next' && s?.outcome() === 'won') go(app, (app.ctx?.index ?? 0) + 1);
  else if (a.type === 'pick' && s) {
    const i = nthOnBank(bankOf(s), s.level.actors.length, a.n);
    if (i !== null) pick(app, i);
  }
}

/** N on the win dialog advances, same as its "Next level" button (the dialog is modal, so the generic path ignores it). */
function nextFromResult(app: App, e: KeyboardEvent): void {
  const c = app.ctx;
  if (app.session?.outcome() !== 'won' || !c || c.index + 1 >= c.levels.length) return;
  e.preventDefault();
  app.dlg.result.modal.close();
  go(app, c.index + 1);
}

export function onKey(app: App, e: KeyboardEvent, hooks: InputHooks): void {
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  const a = keyAction(e.key);
  if (!a) return;
  if (a.type === 'mute') return hooks.toggleMute();
  if (app.dlg.pause.isOpen() && a.type === 'pause' && e.key !== 'Escape') return app.dlg.pause.close();
  if (a.type === 'next' && app.dlg.result.modal.isOpen()) return nextFromResult(app, e);
  if (anyModalOpen()) return;
  const view = app.shell.view();
  if (a.type === 'pause') {
    e.preventDefault(); // stops the browser closing the pause dialog it is about to open
    if (view === 'play') pause(app);
    else if (view === 'levels') showMenu(app);
    return;
  }
  if (view === 'play') playKey(app, a, e);
}
