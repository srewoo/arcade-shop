// Keyboard and pointer input -> match actions and screen flow.
import type { App } from './appState';
import { configureAudio, emit } from './audio';
import { askConfirm, changeSetting, closeSettings, confirmNo, confirmYes, dismissHint, isRunning, openSettings, pauseGame, resumeGame, startGame, toTitle } from './flow';
import { act, setCurve } from './match';
import { closeTop, isOverlayOpen, topOverlay } from './ui/overlay';

function doAct(a: App): void {
  const m = a.match;
  if (!m || !isRunning(a)) return;
  dismissHint(a);
  act(m);
}

function curve(a: App, delta: number): void {
  if (a.match && isRunning(a)) { setCurve(a.match, delta); emit('ui'); }
}

function toggleMute(a: App): void {
  changeSetting(a, 'sound', !a.settings.sound);
  configureAudio({ enabled: a.settings.sound, volume: a.settings.volume });
}

function onKey(a: App, e: KeyboardEvent): void {
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  if (e.key === 'm' || e.key === 'M') { toggleMute(a); return; }
  if (e.key === 'Escape') {
    if (!a.els.pauseConfirm.hidden && topOverlay() === a.els.pauseOv) { confirmNo(a); e.preventDefault(); return; }
    if (closeTop()) { e.preventDefault(); return; }
    pauseGame(a);
    return;
  }
  if (isOverlayOpen()) return;
  if (e.key === 'p' || e.key === 'P') { pauseGame(a); return; }
  if (a.screen !== 'play') return;
  const onButton = (e.target as HTMLElement | null)?.closest('button') && (e.target as HTMLElement).id !== 'bowl';
  if ((e.key === ' ' || e.key === 'Enter') && !onButton && !(e.target as HTMLElement).closest('#bowl')) {
    e.preventDefault();
    if (!e.repeat) doAct(a);
  } else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') { e.preventDefault(); curve(a, -1); }
  else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') { e.preventDefault(); curve(a, 1); }
}

export function installInput(a: App): void {
  const { els } = a;
  document.addEventListener('keydown', (e) => onKey(a, e));
  els.bowl.addEventListener('click', () => doAct(a));
  els.scene.addEventListener('pointerdown', (e) => { e.preventDefault(); doAct(a); });
  els.curveL.addEventListener('click', () => curve(a, -1));
  els.curveR.addEventListener('click', () => curve(a, 1));
  els.hintClose.addEventListener('click', () => { dismissHint(a); els.bowl.focus(); });
  els.playBtn.addEventListener('click', () => startGame(a));
  els.pause.addEventListener('click', () => pauseGame(a));
  els.mute.addEventListener('click', () => toggleMute(a));
  els.openSettings.addEventListener('click', () => openSettings(a, els.openSettings));
  els.settingsClose.addEventListener('click', () => closeSettings(a));
  els.pauseResume.addEventListener('click', () => resumeGame(a));
  els.pauseSettings.addEventListener('click', () => openSettings(a, els.pauseSettings));
  els.pauseRestart.addEventListener('click', () => askConfirm(a, 'restart'));
  els.pauseQuit.addEventListener('click', () => askConfirm(a, 'quit'));
  els.confirmYes.addEventListener('click', () => confirmYes(a));
  els.confirmNo.addEventListener('click', () => confirmNo(a));
  els.overAgain.addEventListener('click', () => startGame(a));
  els.overTitle.addEventListener('click', () => toTitle(a));
  document.addEventListener('visibilitychange', () => { if (document.hidden) pauseGame(a); });
  window.addEventListener('blur', () => pauseGame(a));
}
