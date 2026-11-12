// DOM event bindings: buttons, keys, focus/visibility auto-pause.
import type { App } from './app';
import { LEVELS } from './levels';
import { S } from './strings';
import { el } from './ui/dom';
import { closeOverlay, closeTop, installTrap, isOverlayOpen, openOverlay, setBackground } from './ui/overlay';
import { bindSettings } from './ui/settingsPanel';
import { bindTouch } from './ui/touch';

type Pending = 'restart' | 'quit' | null;

function openSettings(app: App, opener: HTMLElement): void {
  app.input.clear();
  openOverlay(el('settings-overlay'), opener, () => undefined, el('settings-close'));
}

function bindPauseMenu(app: App): void {
  let pending: Pending = null;
  const ask = (what: Exclude<Pending, null>): void => {
    pending = what;
    el('pause-confirm-text').textContent = what === 'restart' ? S.confirmRestart : S.confirmQuit;
    el('pause-confirm-yes').textContent = what === 'restart' ? S.yesRestart : S.yesQuit;
    el('pause-confirm').hidden = false;
    el('pause-confirm-no').focus();
  };
  el('pause-resume').addEventListener('click', () => app.resume());
  el('pause-restart').addEventListener('click', () => ask('restart'));
  el('pause-quit').addEventListener('click', () => ask('quit'));
  el('pause-settings').addEventListener('click', (e) => openSettings(app, e.currentTarget as HTMLElement));
  el('pause-confirm-no').addEventListener('click', () => {
    el('pause-confirm').hidden = true;
    el('pause-resume').focus();
  });
  el('pause-confirm-yes').addEventListener('click', () => {
    if (pending === 'restart') app.restart();
    else if (pending === 'quit') app.quitToLevels();
    pending = null;
  });
}

function bindMenus(app: App): void {
  el('btn-play').addEventListener('click', () => {
    app.audio.unlock();
    app.audio.click();
    app.startLevel(app.continueId());
  });
  el('btn-levels').addEventListener('click', () => {
    app.audio.unlock();
    app.refreshMenus();
    app.showScreen('levels');
  });
  el('levels-back').addEventListener('click', () => app.showScreen('title'));
  el('btn-settings-title').addEventListener('click', (e) => openSettings(app, e.currentTarget as HTMLElement));
  el('settings-close').addEventListener('click', () => closeOverlay(el('settings-overlay')));
  el('btn-pause').addEventListener('click', () => app.pause());
  el('hint-ok').addEventListener('click', () => app.dismissHint());
  el('btn-sound').addEventListener('click', () => app.applySettings({ ...app.settings, sound: !app.settings.sound }));
  el('result-next').addEventListener('click', () => {
    closeOverlay(el('result-overlay'));
    app.startLevel(Math.min(LEVELS.length, app.level.id + 1));
  });
  el('result-retry').addEventListener('click', () => app.restart());
  el('result-levels').addEventListener('click', () => app.quitToLevels());
}

function bindKeys(app: App): void {
  window.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.key === 'Escape') {
      if (closeTop()) e.preventDefault();
      else if (app.screen === 'game' && !e.repeat) app.pause();
      else if (app.screen === 'levels') app.showScreen('title');
      return;
    }
    if (e.key === 'm' || e.key === 'M') return void app.applySettings({ ...app.settings, sound: !app.settings.sound });
    if ((e.key === 'p' || e.key === 'P') && app.screen === 'game' && !isOverlayOpen() && !e.repeat) return app.pause();
    if (app.active && app.input.key(e, true)) e.preventDefault();
  });
  window.addEventListener('keyup', (e) => void app.input.key(e, false));
}

export function wire(app: App): void {
  setBackground([el('app')]);
  installTrap();
  bindMenus(app);
  bindPauseMenu(app);
  bindSettings(() => app.settings, (next) => app.applySettings(next));
  bindKeys(app);
  bindTouch(app.input, el('wheel'), [el('pedal-rev'), el('pedal-fwd'), el('pedal-brake')]);
  const autoPause = (): void => app.pause();
  document.addEventListener('visibilitychange', () => document.hidden && autoPause());
  window.addEventListener('blur', autoPause);
}
