// Pause overlay, Settings overlay and the inline restart-confirmation bar.
import { isOver } from '../game';
import { emit } from '../audio';
import { S } from '../strings';
import { coerceValue } from './chips';
import { el, qs } from './dom';
import type { Host } from './host';
import { closeOverlay, closeTop, openOverlay, topOverlay } from './overlay';

export interface Panels {
  openPause(auto: boolean): void;
  openSettings(opener: HTMLElement): void;
  isPauseOpen(): boolean;
  togglePause(): void;
}

export function initPanels(host: Host): Panels {
  const pauseEl = el('pause-overlay');
  const settingsEl = el('settings-overlay');

  const resumeAll = (): void => {
    host.ctrl.resume('manual');
    host.ctrl.resume('auto');
  };

  const openPause = (auto: boolean): void => {
    if (isOver(host.ctrl.state) || topOverlay()) return;
    host.ctrl.pause(auto ? 'auto' : 'manual');
    el('pause-note').textContent = auto ? S.pausedAuto : S.pausedNote;
    el('pause-confirm').hidden = true;
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : el('pause');
    openOverlay(pauseEl, opener, resumeAll, el('pause-resume'));
  };

  const openSettings = (opener: HTMLElement): void => {
    host.ctrl.pause('settings');
    openOverlay(settingsEl, opener, () => host.ctrl.resume('settings'));
  };

  const isPauseOpen = (): boolean => topOverlay() === pauseEl;

  bindPause(host, { pauseEl, resumeAll, openPause, openSettings });
  bindSettings(host, settingsEl, openSettings);

  return {
    openPause,
    openSettings,
    isPauseOpen,
    togglePause: () => (isPauseOpen() ? void closeTop() : openPause(false)),
  };
}

interface PauseWiring {
  readonly pauseEl: HTMLElement;
  readonly resumeAll: () => void;
  readonly openPause: (auto: boolean) => void;
  readonly openSettings: (opener: HTMLElement) => void;
}

function bindPause(host: Host, w: PauseWiring): void {
  const restart = (): void => {
    closeOverlay(w.pauseEl);
    w.resumeAll();
    host.startRound(true);
  };
  el('pause').addEventListener('click', () => w.openPause(false));
  el('pause-resume').addEventListener('click', () => void closeTop());
  el('pause-settings').addEventListener('click', (e) => w.openSettings(e.currentTarget as HTMLElement));
  el('pause-restart').addEventListener('click', () => {
    if (host.ctrl.state.moves === 0) return restart();
    el('pause-confirm').hidden = false;
    el('pause-confirm-yes').focus();
  });
  el('pause-confirm-no').addEventListener('click', () => {
    el('pause-confirm').hidden = true;
    el('pause-restart').focus();
  });
  el('pause-confirm-yes').addEventListener('click', restart);
}

function bindSettings(host: Host, settingsEl: HTMLElement, openSettings: (opener: HTMLElement) => void): void {
  el('open-settings').addEventListener('click', (e) => openSettings(e.currentTarget as HTMLElement));
  el('settings-close').addEventListener('click', () => void closeTop());
  const volume = el<HTMLInputElement>('volume');
  volume.addEventListener('input', () => host.changeSetting('volume', Number(volume.value)));
  volume.addEventListener('change', () => emit('ui'));
  settingsEl.addEventListener('click', (e) => chipClick(e, host));
  qs('.options', el('options-box')).addEventListener('click', (e) => chipClick(e, host));
  el('confirm-yes').addEventListener('click', () => host.confirmPending(true));
  el('confirm-no').addEventListener('click', () => host.confirmPending(false));
}

function chipClick(e: Event, host: Host): void {
  const btn = (e.target as HTMLElement).closest<HTMLButtonElement>('button[data-value]');
  const key = btn?.closest<HTMLFieldSetElement>('fieldset')?.dataset.setting;
  if (!btn || !key || btn.dataset.value === undefined) return;
  host.changeSetting(key as never, coerceValue(btn.dataset.value));
}
