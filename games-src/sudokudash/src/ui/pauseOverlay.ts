// Pause overlay: Resume (default focus), Restart, Settings, Quit to title. Restart and Quit ask
// for an in-page confirmation (never window.confirm).
import type { Session } from '../session';
import { STR } from '../strings';
import { $ } from './dom';
import { closeModal, openModal, trapTab } from './modal';

export interface PauseHost {
  readonly resume: () => void;
  readonly restart: () => void;
  readonly quit: () => void;
  readonly settings: () => void;
}

type Pending = 'restart' | 'quit' | null;
let pending: Pending = null;

const SUB: Readonly<Record<string, string>> = {
  hidden: 'The tab was hidden, so the clock stopped.',
  blur: 'The window lost focus, so the clock stopped.',
  settings: 'Settings are open. The clock is stopped.',
  ready: 'Your clock is stopped until you start.',
};

function showConfirm(kind: Pending, focus = true): void {
  pending = kind;
  $('pause-actions').hidden = kind !== null;
  $('pause-confirm').hidden = kind === null;
  if (kind) {
    $('pause-confirm-text').textContent = kind === 'restart' ? STR.confirmRestart : STR.confirmQuit;
    $('btn-confirm-yes').textContent = kind === 'restart' ? 'Yes, restart' : 'Yes, quit';
    if (focus) $('btn-confirm-no').focus();
  } else if (focus) {
    $('btn-resume').focus();
  }
}

/** True when Esc should cancel an open confirmation instead of resuming. */
export function cancelPendingConfirm(): boolean {
  if (pending === null) return false;
  showConfirm(null);
  return true;
}

export function bindPauseOverlay(host: PauseHost): void {
  trapTab($('pause'));
  $('btn-resume').addEventListener('click', host.resume);
  $('btn-restart').addEventListener('click', () => showConfirm('restart'));
  $('btn-quit').addEventListener('click', () => showConfirm('quit'));
  $('btn-pause-settings').addEventListener('click', host.settings);
  $('btn-confirm-no').addEventListener('click', () => showConfirm(null));
  $('btn-confirm-yes').addEventListener('click', () => {
    const kind = pending;
    showConfirm(null);
    if (kind === 'restart') host.restart();
    else if (kind === 'quit') host.quit();
  });
}

/** Shows or hides the overlay to match the session (call from render). */
export function renderPause(s: Session | null, gameVisible: boolean): void {
  const el = $('pause');
  const shouldShow = s !== null && gameVisible && s.status === 'paused';
  if (!shouldShow) {
    if (!el.hidden) {
      showConfirm(null, false);
      closeModal(el, false);
    }
    return;
  }
  const ready = s.pauseReason === 'ready';
  $('pause-h').textContent = ready ? STR.readyTitle : STR.pausedTitle;
  $('pause-sub').textContent = SUB[s.pauseReason ?? ''] ?? '';
  $('btn-resume').textContent = ready ? STR.resumeFromReady : 'Resume';
  if (el.hidden) {
    showConfirm(null, false);
    openModal(el, $('btn-resume'));
  }
}
