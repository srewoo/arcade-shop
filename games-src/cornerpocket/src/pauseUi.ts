// Pause dialog and the inline "Abandon this game?" confirmation (never window.confirm).
import { showModal } from './modal';
import { STR } from './strings';
import { esc } from './ui';

export interface PauseActions {
  resume: () => void;
  restart: () => void;
  settings: () => void;
  quit: () => void;
  toggleSound: () => void;
  soundOn: () => boolean;
}

export function showPause(a: PauseActions): void {
  const m = showModal(`<div class="card" role="dialog" aria-modal="true" aria-labelledby="pz-title">
    <h2 id="pz-title">${esc(STR.paused)}</h2>
    <div class="stack">
      <button class="btn primary" id="pz-resume" type="button">${esc(STR.resume)} <kbd>Esc</kbd></button>
      <button class="btn" id="pz-restart" type="button">${esc(STR.restart)}</button>
      <button class="btn" id="pz-settings" type="button">${esc(STR.settings)}</button>
      <button class="btn" id="pz-sound" type="button" aria-pressed="${a.soundOn()}">${esc(STR.sound)}: ${a.soundOn() ? STR.on : STR.off}</button>
      <button class="btn ghost danger" id="pz-quit" type="button">${esc(STR.quit)}</button>
    </div></div>`, '#pz-resume');
  m.querySelector('#pz-resume')?.addEventListener('click', a.resume);
  m.querySelector('#pz-restart')?.addEventListener('click', a.restart);
  m.querySelector('#pz-settings')?.addEventListener('click', a.settings);
  m.querySelector('#pz-quit')?.addEventListener('click', a.quit);
  m.querySelector('#pz-sound')?.addEventListener('click', () => {
    a.toggleSound();
    const b = m.querySelector<HTMLElement>('#pz-sound');
    if (b) { b.textContent = `${STR.sound}: ${a.soundOn() ? STR.on : STR.off}`; b.setAttribute('aria-pressed', String(a.soundOn())); }
  });
}

/** Ask before a restart or quit throws away an unfinished game. Default focus is the safe choice. */
export function showConfirm(onYes: () => void, onNo: () => void): void {
  const m = showModal(`<div class="card" role="alertdialog" aria-modal="true" aria-labelledby="cf-title" aria-describedby="cf-body">
    <h2 id="cf-title">${esc(STR.abandonTitle)}</h2><p id="cf-body">${esc(STR.abandonBody)}</p>
    <div class="row"><button class="btn primary" id="cf-no" type="button">${esc(STR.keepPlaying)}</button>
    <button class="btn danger-fill" id="cf-yes" type="button">${esc(STR.abandon)}</button></div></div>`, '#cf-no');
  m.querySelector('#cf-no')?.addEventListener('click', onNo);
  m.querySelector('#cf-yes')?.addEventListener('click', onYes);
}
