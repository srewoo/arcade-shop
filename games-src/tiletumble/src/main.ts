import './style/tokens.css';
import './style/base.css';
import './style/game.css';
import './style/panels.css';
import { App } from './app';
import { installAudioUnlock } from './audio';
import { installDebug } from './debug';
import { loadSettings } from './settings';
import { loadStats } from './stats';
import { el } from './ui/dom';
import { closeOverlay, closeTop, installTrap, isOverlayOpen, setBackground } from './ui/overlay';
import { initSettingsPanel } from './ui/panels';

function bind(app: App): void {
  const on = (id: string, fn: () => void): void => el(id).addEventListener('click', fn);
  on('sound', () => app.change('sound', !app.settings.sound));
  on('open-settings', () => app.openSettings(el('open-settings')));
  on('pause', () => app.openPause());
  on('undo', () => app.undo());
  on('new-game', () => app.request('restart'));
  on('to-menu', () => app.request('quit'));
  on('onboard-close', () => app.dismissOnboarding());
  on('settings-close', () => closeOverlay(el('settings-overlay')));
  on('pause-resume', () => closeOverlay(el('pause-overlay')));
  on('pause-restart', () => app.pause.ask('restart'));
  on('pause-quit', () => app.pause.ask('quit'));
  on('pause-settings', () => app.openSettings(el('pause-settings')));
  on('pause-confirm-yes', () => app.pause.accept());
  on('pause-confirm-no', () => app.pause.cancel());
  on('result-again', () => {
    closeOverlay(el('result-overlay'));
    app.restart();
  });
  on('result-menu', () => {
    closeOverlay(el('result-overlay'));
    app.toMenu();
  });
}

function bindKeys(app: App): void {
  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const key = e.key.toLowerCase();
    if (key === 'm' && !(e.target instanceof HTMLInputElement)) return app.change('sound', !app.settings.sound);
    if (isOverlayOpen()) {
      const onPause = !el('pause-overlay').hidden && el('settings-overlay').hidden && el('result-overlay').hidden;
      if (e.key === 'Escape' || (key === 'p' && !e.repeat && onPause)) closeTop();
      return;
    }
    if (!app.state) return;
    if (key === 'p' || e.key === 'Escape') app.openPause();
    else if (key === 'z' || key === 'u') app.undo();
    else if (key === 'n') app.request('restart');
  });
}

function bindAutoPause(app: App): void {
  const pause = (): void => {
    if (app.playing && !isOverlayOpen()) app.openPause();
  };
  document.addEventListener('visibilitychange', () => document.hidden && pause());
  window.addEventListener('blur', pause);
}

const params = new URLSearchParams(location.search);
const debug = params.get('debug') === '1';
const seedParam = Number(params.get('seed'));
const app = new App(loadSettings(), loadStats(), debug && Number.isFinite(seedParam) && params.has('seed') ? seedParam : undefined);
setBackground([el('app')]);
installTrap();
installAudioUnlock();
initSettingsPanel((k, v) => app.change(k, v));
bind(app);
bindKeys(app);
bindAutoPause(app);
if (debug) installDebug(app);
